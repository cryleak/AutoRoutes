import Settings from "../config"
import RenderLibV2 from "../../RenderLibV2"
import { convertFromRelative, getRoomName, chat, playerCoords, swapFromName, calcYawPitch, rotate, setSneaking, setWalking, convertToRealYaw, movementKeys, releaseMovementKeys, centerCoords, swapFromItemID, leftClick, registerPearlClip, getEyeHeightSneaking, movementKeys, debugMessage } from "../utils/utils"
import { clickAt } from "../utils/ServerRotations"
import { data } from "../utils/routesData"
import { getDistance2D, isValidEtherwarpBlock, raytraceBlocks, drawLine3d } from "../../BloomCore/utils/utils"
import Vector3 from "../../BloomCore/utils/Vector3";
import "./managementOfShittyAutoRoutesBombDenmarkPleaseEndMe"
import Promise from "../../PromiseV2"
import Async from "../../Async"
import addListener from "../events/SecretListener"

let activeNodes = []
let activeNodesCoords = []
let moveKeyListener = false
let moveKeyCooldown = Date.now()

register("renderWorld", () => {
    if (!Settings().autoRoutesEnabled) return
    if (!activeNodes.length) return
    for (let i = 0; i < activeNodes.length; i++) {
        let extraRingData = activeNodesCoords[i]
        let ring = activeNodes[i]
        if (extraRingData.triggered || Date.now() - extraRingData.lastUse < 1000) RenderLibV2.drawCyl(...extraRingData.position, ring.radius, ring.radius, -0.01, 120, 1, 90, 0, 0, 1, 0, 0, 1, false, true)
        else RenderLibV2.drawCyl(...extraRingData.position, ring.radius, ring.radius, -0.01, 120, 1, 90, 0, 0, 0, 1, 1, 1, false, true)
        if (ring.type === "etherwarp") {
            let etherCoords = centerCoords(convertFromRelative(ring.etherBlock))
            drawLine3d(...extraRingData.position, etherCoords[0], etherCoords[1] + 1, etherCoords[2], 0, 1, 1, 1, 10, false)
        }
        if (Settings().displayIndex) Tessellator.drawString(`index: ${i}, type: ${ring.type}`, ...extraRingData.position, 16777215, true, 0.02, false)
    }
})

register("tick", () => {
    if (!Settings().autoRoutesEnabled) return
    if (Settings().editMode) return
    if (!activeNodes.length) return

    performActions()
})

const performActions = () => {
    let playerPosition = playerCoords().player

    for (let i = 0; i < activeNodes.length; i++) {
        let ring = activeNodes[i]
        let extraRingData = activeNodesCoords[i]
        let ringPos = extraRingData.position
        let distance = getDistance2D(playerPosition[0], playerPosition[2], ringPos[0], ringPos[2])
        if (distance < ring.radius && Math.abs(playerPosition[1] - ringPos[1]) <= ring.height) {
            if (Date.now() - extraRingData.lastUse < 1000) continue
            if (extraRingData.triggered) continue
            extraRingData.triggered = true
            let exec = () => {
                if (ring.stop) releaseMovementKeys()
                let execRing = () => ringActions[ring.type](ring, Object.keys(ring))
                ring.delay ? Async.schedule(() => {
                    playerPosition = playerCoords().player
                    let distance = getDistance2D(playerPosition[0], playerPosition[2], ringPos[0], ringPos[2])
                    if (distance < ring.radius && Math.abs(playerPosition[1] - ringPos[1]) <= ring.height) Client.scheduleTask(0, execRing)
                }, ring.delay)
                    : execRing() // Delay if there is a delay set
            }

            if (Object.values(ring.awaitSecret).some(value => value === true)) {
                let startTime = Date.now()

                new Promise((resolve, reject) => {
                    addListener(ring.awaitSecret, () => resolve(Date.now() - startTime), () => reject("hi"))
                }).then(value => {
                    playerPosition = playerCoords().player
                    let distance = getDistance2D(playerPosition[0], playerPosition[2], ringPos[0], ringPos[2])
                    if (distance < ring.radius && Math.abs(playerPosition[1] - ringPos[1]) <= ring.height) {
                        chat("Secret took" + value)
                        // Client.scheduleTask(0, exec)
                        exec()
                    }
                }, // Nice linter, VS Code.
                    e => {
                        chat("Await secret timed out!")
                    })

            } else exec()
        } else if (extraRingData.triggered) extraRingData.triggered = false
    }
}

let lastRoomName
register("step", () => {
    if (!Settings().autoRoutesEnabled) return
    if (getRoomName() === lastRoomName) return
    lastRoomName = getRoomName()
    updateRoutes()
}).setFps(10)

const updateRoutes = () => {
    roomNodes = data.profiles[data.selectedProfile][getRoomName()]
    activeNodes = []
    if (!roomNodes || !roomNodes.length) {
        return chat("No routes found for this room!")
    }

    activeNodes = roomNodes
    activeNodesCoords = []
    for (let i = 0; i < activeNodes.length; i++) {
        let [x, y, z] = convertFromRelative(activeNodes[i].position) // What the fuck is this
        x += 0.5
        y += activeNodes[i].yOffset
        z += 0.5
        activeNodesCoords.push({
            position: [x, y, z],
            triggered: false,
            lastUse: 0 // It was last used on January 1st 1970.
        })
    }
}

register("command", () => {
    chat("Routes updated for current room.")
    updateRoutes()
}).setName("updateroutes")

register("command", (arg) => {
    let etherBlock
    if (arg.toString() == "1") {
        etherBlock = [-27, 66, -57]
    }
    else etherBlock = [86, 63, 97]

    let etherYawPitch = getEtherYawPitch(etherBlock)
    if (!etherYawPitch) return chat("Failed to get a valid yaw pitch combination!")

    rotate(etherYawPitch.yaw, etherYawPitch.pitch)
}).setName("setrot")

const ringActions = {
    look: (args) => {
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        rotate(yaw, pitch)
    },
    etherwarp: (args) => {
        let yaw
        let pitch
        if (args.etherCoordMode === 0) {
            const etherwarpRotation = getEtherYawPitch(convertFromRelative(args.etherBlock))
            if (!etherwarpRotation) return chat("Failed to get a valid yaw pitch combination!")
            yaw = etherwarpRotation.yaw
            pitch = etherwarpRotation.pitch
        } else {
            yaw = convertToRealYaw(args.yaw)
            pitch = args.pitch
        }
        const success = swapFromName("Aspect of The Void")
        if (!success) return
        releaseMovementKeys()
        Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
        setSneaking(true)
        clickAt(yaw, pitch)
        moveKeyListener = true
        moveKeyCooldown = Date.now()
    },
    aotv: (args) => {
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        const success = swapFromName("Aspect of The Void")
        if (!success) return
        Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
        setSneaking(false)
        clickAt(yaw, pitch)
    },
    hype: (args) => {
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        const success = swapFromName("Hyperion")
        if (!success) return
        Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
        setSneaking(false)
        clickAt(yaw, pitch)
    },
    walk: (args) => {
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        rotate(yaw, pitch)
        setWalking(true)
        setSneaking(false)
    },
    finish: (args) => {
        if ((args.yaw || args.yaw === 0) && (args.pitch || args.pitch === 0)) {
            let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
            rotate(yaw, pitch)
        }
        setSneaking(false)
        moveKeyListener = false
    },
    superboom: (args) => {
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        rotate(yaw, pitch)
        if (Player.getHeldItem().getID() !== 46) {
            const success = swapFromItemID(46)
            if (!success) return
            Client.scheduleTask(0, leftClick)
        } else leftClick()
    },
    pearlclip: (args) => {
        const success = swapFromName("Ender Pearl")
        if (!success) return
        clickAt(0, 90)
        registerPearlClip(args.pearlClipDistance)
    }
}

register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, () => {
    if (!moveKeyListener) return
    if (Date.now() - moveKeyCooldown < 500) return
    if (Client.isInGui() || !World.isLoaded()) return
    if (!Keyboard.getEventKeyState()) return
    const keyCode = Keyboard.getEventKey()
    if (!keyCode) return

    if (movementKeys.includes(keyCode)) {
        moveKeyListener = false
        setSneaking(false)
    }
})

function getEtherYawPitch(etherBlock) {
    const playerCoords = [Player.getX(), Player.getY() + getEyeHeightSneaking(), Player.getZ()]

    const centeredCoords = centerCoords(etherBlock)
    const rotation = calcYawPitch(centeredCoords[0], centeredCoords[1] + 0.5, centeredCoords[2], true)
    // Return if you can aim at center of the block
    if (raytraceBlocks(playerCoords, Vector3.fromPitchYaw(rotation.pitch, rotation.yaw), 60, isValidEtherwarpBlock, true, true)?.every((coord, index) => coord === etherBlock[index])) return rotation
    const lowerLimit = { yaw: rotation.yaw - 4, pitch: rotation.pitch - 6 }
    const upperLimit = { yaw: rotation.yaw + 4, pitch: rotation.pitch + 6 }
    // let runs = 0
    for (let yaw = lowerLimit.yaw; yaw < upperLimit.yaw; yaw++) {
        for (let pitch = lowerLimit.pitch; pitch < upperLimit.pitch; pitch += 0.3) {
            // runs++
            let prediction = raytraceBlocks(playerCoords, Vector3.fromPitchYaw(pitch, yaw), 60, isValidEtherwarpBlock, true, true)
            if (!prediction) continue
            if (prediction.every((coord, index) => coord === etherBlock[index])) {
                // console.log(runs)
                return { yaw, pitch }
            }
        }
    }
    // console.log(runs)
    return null
}

let packetsSent = 0
register("packetSent", (packet, event) => {
    Client.scheduleTask(0, () => {
        if (event?.isCancelled()) return

        packetsSent++
    })
}).setFilteredClass(net.minecraft.network.play.client.C03PacketPlayer)

register("step", () => {
    if (!Settings().debugMessages) return
    ChatLib.clearChat(89299)
    new Message(`§0[§6AutoRoutesDebug§0]§f Movement packets sent last second: ${packetsSent}`).setChatLineId(89299).chat()
    packetsSent = 0
}).setDelay(1)