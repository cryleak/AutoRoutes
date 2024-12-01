import Settings from "../config"
import RenderLibV2 from "../../RenderLibV2"
import { convertToRelative, convertFromRelative, getRoomName, chat, playerCoords, swapToItem, calcYawPitch, rotate, setSneaking, setWalking, convertToRealYaw, movementKeys, releaseMovementKeys, centerCoords } from "../utils/utils"
import { clickAt } from "../utils/ServerRotations"
import { data } from "../utils/routesData"
import { getDistance2D, C08PacketPlayerBlockPlacement, isValidEtherwarpBlock, MCBlockPos, raytraceBlocks, drawLine3d } from "../../BloomCore/utils/utils"
import Vector3 from "../../BloomCore/utils/Vector3";
import "./managementOfShittyAutoRoutesBombDenmarkPleaseEndMe"
import Promise from "../../PromiseV2"
import Async from "../../Async"
import addListener from "../events/SecretListener"

let activeNodes = []
let activeNodesCoords = []
let moveKeyListener = false

register("renderWorld", () => {
    if (!Settings().autoRoutesEnabled) return
    if (!activeNodes.length) return
    for (let i = 0; i < activeNodes.length; i++) {
        let extraRingData = activeNodesCoords[i]
        let ring = activeNodes[i]
        if (extraRingData.triggered || Date.now() - extraRingData.lastUse < 1000) RenderLibV2.drawCyl(...extraRingData.position, ring.radius, ring.radius, -0.01, 120, 1, 90, 0, 0, 1, 0, 0, 1, false, true)
        else RenderLibV2.drawCyl(...extraRingData.position, ring.radius, ring.radius, -0.01, 120, 1, 90, 0, 0, 1, 1, 1, 1, false, true)
        if (ring.type === "etherwarp") {
            let etherCoords = centerCoords(convertFromRelative(ring.etherBlock))
            drawLine3d(extraRingData.position[0], extraRingData.position[1], extraRingData.position[2], etherCoords[0], etherCoords[1] + 1, etherCoords[2], 0, 1, 1, 1, 10, false)
        }
        if (Settings().displayIndex) Tessellator.drawString(`index: ${i}, type: ${ring.type}`, ...extraRingData.position, 16777215, true, 0.02, false)
    }
})

register("tick", () => {
    if (!Settings().autoRoutesEnabled) return
    if (!activeNodes.length) return

    performActions()
})

const performActions = () => {
    let playerPosition = [...playerCoords().player]

    for (let i = 0; i < activeNodes.length; i++) {
        // activeNodes.forEach((ring, i) => {
        let ring = activeNodes[i]
        let extraRingData = activeNodesCoords[i]
        let ringPos = extraRingData.position
        let distance = getDistance2D(playerPosition[0], playerPosition[2], ringPos[0], ringPos[2])
        if (distance < ring.radius && Math.abs(playerPosition[1] - ringPos[1]) <= ring.height) {
            // if (Date.now() - extraRingData.lastUse < 1000) return
            // if (extraRingData.triggered) return
            if (Date.now() - extraRingData.lastUse < 1000) continue
            if (extraRingData.triggered) continue
            extraRingData.triggered = true
            let exec = () => {
                releaseMovementKeys()
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
                    chat("Secret took" + value)
                    playerPosition = playerCoords().player
                    let distance = getDistance2D(playerPosition[0], playerPosition[2], ringPos[0], ringPos[2])
                    if (distance < ring.radius && Math.abs(playerPosition[1] - ringPos[1]) <= ring.height) Client.scheduleTask(0, exec)
                }, // Nice linter VS Code
                    e => {
                        chat("Await secret timed out!")
                    })

            } else {
                exec()
            }
        } else if (extraRingData.triggered) extraRingData.triggered = false
        // })
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
        activeNodesCoords.push({
            position: convertFromRelative([...activeNodes[i].position]),
            triggered: false,
            lastUse: Date.now()
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

let lastUse = Date.now()
const ringActions = {
    look: (args) => {
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        rotate(yaw, pitch)
    },
    etherwarp: (args) => {
        const etherwarpRotation = getEtherYawPitch(convertFromRelative(args.etherBlock))
        if (!etherwarpRotation) return chat("Failed to get a valid yaw pitch combination!")
        const success = swapToItem("Aspect of The")
        if (!success) return
        Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
        setSneaking(true)
        ChatLib.chat(Date.now() - lastUse)
        lastUse = Date.now()
        clickAt(etherwarpRotation.yaw, etherwarpRotation.pitch)
        // rotate(etherwarpRotation.yaw, etherwarpRotation.pitch)
        moveKeyListener = true
    },
    walk: (args) => {
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        rotate(yaw, pitch)
        setWalking(true)
    },
    finish: (args) => {
        if ((args.yaw || args.yaw === 0) && (args.pitch || args.pitch === 0)) {
            let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
            rotate(yaw, pitch)
        }
        setSneaking(false)
        moveKeyListener = false
    }
}

const movementKeys = [Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(), Client.getMinecraft().field_71474_y.field_74370_x.func_151463_i(), Client.getMinecraft().field_71474_y.field_74366_z.func_151463_i(), Client.getMinecraft().field_71474_y.field_74368_y.func_151463_i()]

register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, () => {
    if (!moveKeyListener) return
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
    const playerCoords = [Player.getX(), Player.getY() + Player.getPlayer().func_70047_e(), Player.getZ()]

    // Retarded way to get center of block cause I couldn't be bothered to think
    const centeredCoords = centerCoords(etherBlock)
    const rotation = calcYawPitch(centeredCoords[0], centeredCoords[1] + 1, centeredCoords[2])
    // Return if you can aim at center of the block
    if (raytraceBlocks(playerCoords, Vector3.fromPitchYaw(rotation.pitch, rotation.yaw), 60, isValidEtherwarpBlock, true, true)?.every((coord, index) => coord === etherBlock[index])) return rotation
    const lowerLimit = { yaw: rotation.yaw - 4, pitch: rotation.pitch - 4 }
    const upperLimit = { yaw: rotation.yaw + 4, pitch: rotation.pitch + 4 }
    let runs = 0
    for (let yaw = lowerLimit.yaw; yaw < upperLimit.yaw; yaw++) {
        for (let pitch = lowerLimit.pitch; pitch < upperLimit.pitch; pitch++) {
            runs++
            let prediction = raytraceBlocks(playerCoords, Vector3.fromPitchYaw(pitch, yaw), 60, isValidEtherwarpBlock, true, true)
            if (!prediction) continue
            if (prediction.every((coord, index) => coord === etherBlock[index])) {
                console.log(runs)
                return { yaw, pitch }
            }
        }
    }
    console.log(runs)
    return null
}