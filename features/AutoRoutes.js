import Settings from "../config"
import RenderLibV2 from "../../RenderLibV2"
import { renderBox, convertFromRelative, getRoomName, chat, playerCoords, swapFromName, rotate, setSneaking, setWalking, convertToRealYaw, movementKeys, releaseMovementKeys, centerCoords, swapFromItemID, leftClick, registerPearlClip, movementKeys, debugMessage, getEtherYawPitch, rayTraceEtherBlock, getEyeHeightSneaking } from "../utils/utils"
import { clickAt } from "../utils/ServerRotations"
import { data } from "../utils/routesData"
import { getDistance2D, drawLine3d } from "../../BloomCore/utils/utils"
import "./managementOfShittyAutoRoutesBombDenmarkPleaseEndMe"
import Promise from "../../PromiseV2"
import Async from "../../Async"
import addListener from "../events/SecretListener"
import { Keybind } from "../../KeybindFix"

const javaColor = Java.type("java.awt.Color")
const scheduledTasks = []

let activeNodes = []
let activeNodesCoords = []
let moveKeyListener = false
let moveKeyCooldown = Date.now()
let autoRoutesEnabled = true
let delayedEther = false

new Keybind("Toggle AutoRoutes", Keyboard.KEY_NONE, "AutoRoutes").registerKeyPress(() => {
    autoRoutesEnabled = !autoRoutesEnabled
    chat(`AutoRoutes ${autoRoutesEnabled ? "enabled" : "disabled"}.`)
})

register("renderWorld", () => {
    const settings = Settings()
    if (!settings.autoRoutesEnabled) return
    if (!activeNodes.length) return
    for (let i = 0; i < activeNodes.length; i++) {
        let extraRingData = activeNodesCoords[i]
        let ring = activeNodes[i]
        let position = extraRingData.position
        let color
        let usingJavaColor = false
        if (extraRingData.triggered || Date.now() - extraRingData.lastUse < 1000) {
            color = [javaColor.RED, javaColor.RED, javaColor.RED, javaColor.RED, javaColor.RED]
            usingJavaColor = true
        }
        else if (settings.nodeColorPreset === 0) {
            color = [javaColor.CYAN, javaColor.PINK, javaColor.WHITE, javaColor.PINK, javaColor.CYAN]
            usingJavaColor = true
        }
        // Ridiculously long line...
        else if (settings.nodeColorPreset === 1) color = [[settings.nodeColor1[0] / 255, settings.nodeColor1[1] / 255, settings.nodeColor1[2] / 255], [settings.nodeColor2[0] / 255, settings.nodeColor2[1] / 255, settings.nodeColor2[2] / 255], [settings.nodeColor3[0] / 255, settings.nodeColor3[1] / 255, settings.nodeColor3[2] / 255], [settings.nodeColor4[0] / 255, settings.nodeColor4[1] / 255, settings.nodeColor4[2] / 255], [settings.nodeColor5[0] / 255, settings.nodeColor5[1] / 255, settings.nodeColor5[2] / 255]]
        else continue
        renderBox(position, ring.radius, 0.75, color, usingJavaColor)
        if (ring.type === "etherwarp") {
            if (!extraRingData.etherBlockCoord) continue
            let etherCoords = centerCoords([extraRingData.etherBlockCoord[0], extraRingData.etherBlockCoord[1] + 1, extraRingData.etherBlockCoord[2]])
            drawLine3d(extraRingData.position[0], extraRingData.position[1] + 0.01, extraRingData.position[2], etherCoords[0], etherCoords[1] + 0.01, etherCoords[2], 0, 1, 1, 1, 10, false)
        }
        if (settings.displayIndex) Tessellator.drawString(`index: ${i}, type: ${ring.type}`, ...extraRingData.position, 16777215, true, 0.02, false)
    }
})

register("tick", () => {
    if (!autoRoutesEnabled) return
    if (!Settings().autoRoutesEnabled) return
    if (Settings().editMode) return
    if (!activeNodes.length) return

    performActions()
})

const performActions = () => {
    let playerPosition = playerCoords().player

    // for (let i = 0; i < activeNodes.length; i++) {
    activeNodes.forEach((ring, i) => {
        // let ring = activeNodes[i]
        let extraRingData = activeNodesCoords[i]
        let ringPos = extraRingData.position
        let distance = getDistance2D(playerPosition[0], playerPosition[2], ringPos[0], ringPos[2])
        console.log(distance)
        if (distance < ring.radius && Math.abs(playerPosition[1] - ringPos[1]) <= ring.height) {
            if (Date.now() - extraRingData.lastUse < 1000) return
            if (extraRingData.triggered) return
            extraRingData.triggered = true
            let exec = () => {
                if (ring.stop) releaseMovementKeys()
                let execRing = () => ringActions[ring.type](ring, Object.keys(ring))
                ring.delay ? Async.schedule(() => { // Delay if there is a delay set
                    playerPosition = playerCoords().player
                    let distance = getDistance2D(playerPosition[0], playerPosition[2], ringPos[0], ringPos[2])
                    if (distance < ring.radius && Math.abs(playerPosition[1] - ringPos[1]) <= ring.height) {
                        if (ring.type === "etherwarp") delayedEther = true
                        exec()
                    }
                }, ring.delay)
                    : execRing()
            }

            if (ring.awaitSecret) {
                let startTime = Date.now()

                new Promise((resolve, reject) => {
                    addListener(() => resolve(Date.now() - startTime), () => reject("hi"))
                }).then(value => {
                    playerPosition = playerCoords().player
                    let distance = getDistance2D(playerPosition[0], playerPosition[2], ringPos[0], ringPos[2])
                    if (distance < ring.radius && Math.abs(playerPosition[1] - ringPos[1]) <= ring.height) {
                        chat(`Secret took ${value}ms.`)
                        if (ring.type === "etherwarp") delayedEther = true
                        exec()
                    }
                }, // Nice linter, VS Code.
                    e => {
                        chat("Await secret timed out!")
                    })

            } else exec()
        } else if (extraRingData.triggered) extraRingData.triggered = false
    })
    // }
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
        let nodeToPush = {}
        let node = activeNodes[i]
        let [x, y, z] = convertFromRelative(node.position) // What the fuck is this
        x += 0.5
        y += activeNodes[i].yOffset
        z += 0.5
        nodeToPush.position = [x, y, z]
        nodeToPush.triggered = false
        nodeToPush.lastUse = 0
        if (node.type === "etherwarp") {
            if (node.etherCoordMode === 0) nodeToPush.etherBlockCoord = convertFromRelative(node.etherBlock)
            else nodeToPush.etherBlockCoord = rayTraceEtherBlock([x, y + getEyeHeightSneaking(), z], convertToRealYaw(node.yaw), node.pitch)
        }
        activeNodesCoords.push(nodeToPush)
    }
    chat("Routes updated for current room.")
}

register("command", () => {
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
        clickAt(yaw, pitch, delayedEther === true ? 2 : 0)
        if (Settings().rotateOnServerRotate) rotate(yaw, pitch)
        moveKeyListener = true
        moveKeyCooldown = Date.now()
        delayedEther = false
    },
    useItem: (args) => {
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        const success = swapFromName(args.itemName)
        if (!success) return
        if (args.stopSneaking) setSneaking(false)
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
    if (Date.now() - moveKeyCooldown < 60) return
    if (Client.isInGui() || !World.isLoaded()) return
    if (!Keyboard.getEventKeyState()) return
    const keyCode = Keyboard.getEventKey()
    if (!keyCode) return

    if (movementKeys.includes(keyCode)) {
        moveKeyListener = false
        setSneaking(false)
    }
})

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

register("tick", () => {
    try {
        for (let i = 0; i < scheduledTasks.length; i++) {
            ChatLib.chat("exec")
            scheduledTasks[i]()
        }
    } catch (e) {

    }
    while (scheduledTasks.length) scheduledTasks.pop()
})

function scheduleTask(exec) {
    scheduledTasks.push(exec)
}