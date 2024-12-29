import { debugMessage, chat, scheduleTask } from "./utils"
import { rotate, sendAirClick, rightClick } from "../utils/RouteUtils"
import Settings from "../config"
import { getDistanceToCoord } from "../../BloomCore/utils/utils"
let lastTP = Date.now()
let packetsPreRotating = 0
let yaw = 0
let renderYaw = null
let pitch = 0
let clicking = false
let rotating = false
let preRotating = false
const queuedPreRotates = []
let currentPreRotatePosition = null

register(Java.type("nukedenmark.events.impl.MotionUpdateEvent").Pre, (event) => {
    if (!rotating && !preRotating) return

    if (!yaw && yaw !== 0 || !pitch && pitch !== 0) return
    event.yaw = yaw
    event.pitch = pitch
    if (preRotating) debugMessage(`prerotating ${[event.yaw.toFixed(2), event.pitch.toFixed(2)].toString()}`)
    else if (clicking) debugMessage(`clicked ${[event.yaw.toFixed(2), event.pitch.toFixed(2)].toString()} ${Player.asPlayerMP().isSneaking()}`)
    if (preRotating) packetsPreRotating++
    if (Settings().rotateOnServerRotate) Client.scheduleTask(0, () => rotate(yaw, pitch))

    if (currentPreRotatePosition && getDistanceToCoord(...currentPreRotatePosition, false) > 2.5) stopRotating() // Stop prerotating if you move away from where the prerotate started

    if (!queuedPreRotates.length) return
    for (let i = queuedPreRotates.length - 1; i >= 0; i--) {
        let queuedPreRotate = queuedPreRotates[i]
        if (getDistanceToCoord(...queuedPreRotate.pos, false) > 2.5) queuedPreRotates.splice(i, 1)
    }
})

register(Java.type("nukedenmark.events.impl.MotionUpdateEvent").Post, () => {
    if (!clicking || !rotating) return

    rotating = false
    clicking = false
    airClick()
    if (!queuedPreRotates.length) return

    const queuedPreRotate = queuedPreRotates.shift()
    currentPreRotatePosition = [...queuedPreRotate.pos]
    queuedPreRotate.exec()
})

register("renderEntity", (entity) => {
    if (entity.getEntity() !== Player.getPlayer()) return
    if (!renderYaw && renderYaw !== 0) return
    if (!Settings().renderServerRotation) return
    Player.getPlayer().field_70761_aq = yaw
    Player.getPlayer().field_70759_as = yaw
})

export function clickAt(y, p) {
    if (!y && y !== 0 || !p && p !== 0) return chat(`Invalid rotation! How is this possible?\nyaw = ${y} pitch = ${p}`)
    yaw = y
    pitch = p

    if (preRotating) debugMessage(`Prerotated for ${packetsPreRotating} packets.`)

    rotating = true
    clicking = true
    preRotating = false
    while (queuedPreRotates.length) queuedPreRotates.pop()
    currentPreRotatePosition = null
    renderYaw = yaw
    Client.scheduleTask(0, () => renderYaw = null)
    if (Settings().rotateOnServerRotate) rotate(yaw, pitch)
}

export function prepareRotate(y, p, pos, cancelAllPreRotates = false) {
    if (!y && y !== 0 || !p && p !== 0) return chat(`Invalid rotation! How is this possible?\nyaw = ${y} pitch = ${p}`)
    const exec = () => {
        yaw = y
        pitch = p
        preRotating = true
        renderYaw = yaw
        packetsPreRotating = 0
    }
    if (!preRotating && !clicking && !rotating || cancelAllPreRotates) {
        if (cancelAllPreRotates) {
            if (yaw === y && pitch === p) return
            while (queuedPreRotates.length) queuedPreRotates.pop()
        }
        currentPreRotatePosition = [...pos]
        exec()
    } else {
        queuedPreRotates.push({ exec, pos })
        scheduleTask(100, () => {
            const index = queuedPreRotates.indexOf(exec)
            if (index !== -1) queuedPreRotates.splice(index, 1)
        })
    }
    // exec()

}

export function stopRotating() {
    rotating = false
    clicking = false
    preRotating = false
    while (queuedPreRotates.length) queuedPreRotates.pop()
    currentPreRotatePosition = null
    renderYaw = null
}

const airClick = () => {
    debugMessage(`Time between this TP and last: ${Date.now() - lastTP}ms`); lastTP = Date.now()
    clicking = false
    sendAirClick(() => {
        try {
            if (Settings().zeroPingHype) global.cryleak.autoroutes.performAnyTeleport() // Makes ZPH allow any type of teleport regardless of if you have it enabled or not on the next teleport
        } catch (e) {
            console.log(e)
            chat("Error, check console or something")
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