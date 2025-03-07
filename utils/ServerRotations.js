import { debugMessage, chat, scheduleTask } from "./utils"
import { rotate, sendAirClick } from "../utils/RouteUtils"
import Settings from "../config"
import { getDistanceToCoord } from "../../BloomCore/utils/utils"

const queuedPreRotates = []
const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")

let lastTP = Date.now()
let packetsPreRotating = 0
let yaw = 0
let pitch = 0
let clicking = false
let rotating = false
let preRotating = false
let currentPreRotatePosition = null
let awaitingMotionUpdate = false
let renderRotations = false

register("packetSent", (packet, event) => { // someone should totally teach me how to use ct asm or asm in general (im not learning that shit)
    if (!awaitingMotionUpdate) return
    awaitingMotionUpdate = false
    if (!rotating && !preRotating) return

    if (!yaw && yaw !== 0 || !pitch && pitch !== 0) return


    const packetPos = [packet.func_149464_c(), packet.func_149467_d(), packet.func_149472_e()]
    const onGround = packet.func_149465_i()

    let newPacket
    const packetClass = packet.class.getSimpleName()
    if (packetClass === "C04PacketPlayerPosition" || packetClass === "C06PacketPlayerPosLook") newPacket = new C03PacketPlayer.C06PacketPlayerPosLook(...packetPos, yaw, pitch, onGround)
    else newPacket = new C03PacketPlayer.C05PacketPlayerLook(yaw, pitch, onGround)

    // ChatLib.chat(`${newPacket ? newPacket.class.getSimpleName() : "null"} ${newPacket?.func_149462_g() ?? "null"} ${newPacket?.func_149470_h() ?? "null"}`)
    cancel(event)
    Client.sendPacket(newPacket)

    if (preRotating) debugMessage(`prerotating ${[yaw.toFixed(2), pitch.toFixed(2)].toString()}`)
    else if (clicking) debugMessage(`clicked ${[yaw.toFixed(2), pitch.toFixed(2)].toString()} ${Player.asPlayerMP().isSneaking()}`)
    if (preRotating) packetsPreRotating++

    if (currentPreRotatePosition && getDistanceToCoord(...currentPreRotatePosition, false) > 2.5) stopRotating() // Stop prerotating if you move away from where the prerotate started

    if (queuedPreRotates.length) {
        for (let i = queuedPreRotates.length - 1; i >= 0; i--) {
            let queuedPreRotate = queuedPreRotates[i]
            if (getDistanceToCoord(...queuedPreRotate.pos, false) > 2.5) queuedPreRotates.splice(i, 1)
        }
    }

    if (!clicking) return

    rotating = false
    clicking = false
    airClick()
    if (!queuedPreRotates.length) return

    const queuedPreRotate = queuedPreRotates.shift()
    currentPreRotatePosition = [...queuedPreRotate.pos]
    queuedPreRotate.exec()
}).setFilteredClass(C03PacketPlayer)

register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => { // Only respond to C03s that were sent from a motion update event or osmething idk
    if (event.entity !== Player.getPlayer()) return
    awaitingMotionUpdate = true
})

// why the fuck is changing the pitch of the player in third person so complicated
let clientSidePitch = Player.getPitch()
register(net.minecraftforge.client.event.RenderPlayerEvent$Pre, (event) => {
    if (event.entity !== Player.getPlayer()) return
    if (!renderRotations) return
    if (!Settings().renderServerRotation) return

    clientSidePitch = Player.getPitch()
    Player.getPlayer().field_70761_aq = yaw
    Player.getPlayer().field_70759_as = yaw
    Player.getPlayer().field_70125_A = pitch
    Player.getPlayer().field_70127_C = pitch
})

register(net.minecraftforge.client.event.RenderPlayerEvent$Post, (event) => {
    if (event.entity !== Player.getPlayer()) return
    if (!renderRotations) return
    if (!Settings().renderServerRotation) return

    Player.getPlayer().field_70125_A = clientSidePitch
    Player.getPlayer().field_70127_C = clientSidePitch
})

export function clickAt(y, p) {
    if (!y && y !== 0 || !p && p !== 0) return chat(`Invalid rotation! How is this possible?\nyaw = ${y} pitch = ${p}`)
    yaw = parseFloat(y) // why is this not already a number what
    pitch = parseFloat(p)

    if (preRotating) debugMessage(`Prerotated for ${packetsPreRotating} packets.`)

    rotating = true
    clicking = true
    preRotating = false
    while (queuedPreRotates.length) queuedPreRotates.pop()
    currentPreRotatePosition = null
    renderRotations = true
    Client.scheduleTask(0, () => renderRotations = false)
}

export function prepareRotate(y, p, pos, cancelAllPreRotates = false) {
    if (!pos) {
        chat("CHeck console idk why is this happening bro herp me")
        throw new Error("invalid pos")
    }
    if (!y && y !== 0 || !p && p !== 0) return chat(`Invalid rotation! How is this possible?\nyaw = ${y} pitch = ${p}`)
    const exec = () => {
        if (yaw !== y && pitch !== p) packetsPreRotating = 0
        yaw = parseFloat(y)
        pitch = parseFloat(p)
        preRotating = true
        renderRotations = true
    }
    if (!preRotating && !clicking && !rotating || cancelAllPreRotates) {
        if (cancelAllPreRotates) while (queuedPreRotates.length) queuedPreRotates.pop()
        currentPreRotatePosition = pos
        exec()
    } else {
        queuedPreRotates.push({ exec, pos })
        scheduleTask(100, () => {
            const index = queuedPreRotates.indexOf(exec)
            if (index !== -1) queuedPreRotates.splice(index, 1)
        })
    }
}

let lastSentYaw = Player.getYaw()
register("packetSent", (packet, event) => {
    Client.scheduleTask(0, () => {
        if (event.isCancelled() || !packet.func_149463_k()) return
        lastSentYaw = packet.func_149462_g()
    })
}).setFilteredClass(C03PacketPlayer).setPriority(Priority.LOWEST)

export const getLastSentYaw = () => {
    return lastSentYaw
}

export function stopRotating() {
    rotating = false
    clicking = false
    preRotating = false
    while (queuedPreRotates.length) queuedPreRotates.pop()
    currentPreRotatePosition = null
    renderRotations = false
}

const airClick = () => {
    debugMessage(`Time between this TP and last: ${Date.now() - lastTP}ms`); lastTP = Date.now()
    clicking = false
    sendAirClick(() => {
        try {
            // Worlds longest line of code world record or something
            if (Settings().zeroPingHype && (["ASPECT_OF_THE_VOID", "ASPECT_OF_THE_END", "NECRON_BLADE", "HYPERION", "VALKYRIE", "ASTRAEA", "SCYLLA"].includes(Player?.getHeldItem()?.getNBT()?.toObject()?.tag?.ExtraAttributes?.id) || Settings().singleplayer && (Player?.getHeldItem()?.getID() === 277 || Player?.getHeldItem()?.getID() === 267))) global.cryleak.autoroutes.performAnyTeleport()// Makes ZPH allow any type of teleport regardless of if you have it enabled or not on the next teleport
        } catch (e) {
            console.log(e)
            chat("Error, check console idk its probably fine")
        }
    })
}


register("worldUnload", stopRotating)

/*
register("packetSent", (packet, event) => {
    if (!packet.func_149466_j()) return
    if (!packet.func_149463_k()) return
    ChatLib.chat(`x: ${packet.func_149464_c()}, y: ${packet.func_149467_d()}, z: ${packet.func_149472_e()}, yaw: ${packet.func_149462_g()}, pitch: ${packet.func_149470_h()}`)
}).setFilteredClass(net.minecraft.network.play.client.C03PacketPlayer)
*/