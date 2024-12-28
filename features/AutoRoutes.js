import Settings from "../config"
import Promise from "../../PromiseV2"
import addListener from "../events/SecretListener"
import RenderLibV2 from "../../RenderLibV2"
import { renderBox, renderScandinavianFlag, chat, scheduleTask, debugMessage } from "../utils/utils"
import { convertFromRelative, getRoomName, convertToRealYaw } from "../utils/RoomUtils"
import { getEtherYawPitchFromArgs, rayTraceEtherBlock, playerCoords, swapFromName, rotate, setSneaking, setWalking, movementKeys, releaseMovementKeys, centerCoords, swapFromItemID, leftClick, registerPearlClip, movementKeys, sneakKey, getDesiredSneakState } from "../utils/RouteUtils"
import { clickAt, prepareRotate, stopRotating } from "../utils/ServerRotations"
import { data } from "../utils/routesData"
import { getDistance2D, drawLine3d } from "../../BloomCore/utils/utils"
import { Keybind } from "../../KeybindFix"
import "./managementOfShittyAutoRoutesBombDenmarkPleaseEndMe"

let activeNodes = []
let activeNodesCoords = []
let moveKeyListener = false
let moveKeyCooldown = Date.now()
let blockUnsneakCooldown = Date.now()
let autoRoutesEnabled = false

new Keybind("Toggle AutoRoutes", Keyboard.KEY_NONE, "AutoRoutes").registerKeyPress(() => {
    autoRoutesEnabled = !autoRoutesEnabled
    ChatLib.clearChat(1337)
    new Message(`§0[§6AutoRoutes§0]§r AutoRoutes ${autoRoutesEnabled ? "enabled" : "disabled"}.`).setChatLineId(1337).chat()
})

register("renderWorld", () => { // Bro this turned into a mess im too lazy to fix it now
    const settings = Settings()
    if (!settings.autoRoutesEnabled) return
    if (!activeNodes.length) return
    if (!World.isLoaded()) return
    // for (let i = 0; i < activeNodes.length; i++) {
    activeNodes.forEach((node, i) => {
        // let node = activeNodes[i]
        let extraNodeData = activeNodesCoords[i]
        let position = extraNodeData.position
        let color
        if (node.type === "etherwarp" && extraNodeData.etherBlockCoord) {
            let etherCoords = centerCoords([extraNodeData.etherBlockCoord[0], extraNodeData.etherBlockCoord[1] + 1, extraNodeData.etherBlockCoord[2]])
            drawLine3d(extraNodeData.position[0], extraNodeData.position[1] + 0.01, extraNodeData.position[2], etherCoords[0], etherCoords[1] + 0.01, etherCoords[2], 0, 1, 1, 1, 2, false)
        }
        if (settings.displayIndex) Tessellator.drawString(`index: ${i}, type: ${node.type}`, ...extraNodeData.position, 16777215, true, 0.02, false)


        if (extraNodeData.triggered || Date.now() - extraNodeData.lastUse < 1000) color = [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]
        if (settings.nodeColorPreset === 0 || settings.nodeColorPreset === 1) { // dumb shit
            if (!color) {
                if (settings.nodeColorPreset === 0) color = [[0, 1, 1], [1, 0.6862745098039216, 0.6862745098039216], [1, 1, 1], [1, 0.6862745098039216, 0.6862745098039216], [0, 1, 1]]
                else if (settings.nodeColorPreset === 1) color = [[settings.nodeColor1[0] / 255, settings.nodeColor1[1] / 255, settings.nodeColor1[2] / 255], [settings.nodeColor2[0] / 255, settings.nodeColor2[1] / 255, settings.nodeColor2[2] / 255], [settings.nodeColor3[0] / 255, settings.nodeColor3[1] / 255, settings.nodeColor3[2] / 255], [settings.nodeColor4[0] / 255, settings.nodeColor4[1] / 255, settings.nodeColor4[2] / 255], [settings.nodeColor5[0] / 255, settings.nodeColor5[1] / 255, settings.nodeColor5[2] / 255]]
            }
            renderBox(position, node.radius, node.radius * 2, color)
        }
        else if (settings.nodeColorPreset === 2) {
            if (!extraNodeData.triggered) color = [[0, 0, 1], [1, 1, 0]] // sweden
            else color = [[1, 0, 0], [1, 1, 1]] // denmark
            renderScandinavianFlag(position, node.radius * 2, node.radius, color[0], color[1])
        }
        else if (settings.nodeColorPreset === 3) { // node
            if (extraNodeData.triggered) color = [1, 0, 0]
            else color = [settings.nodeColor1[0] / 255, settings.nodeColor1[1] / 255, settings.nodeColor1[2] / 255]
            RenderLibV2.drawCyl(...position, node.radius, node.radius, -0.01, 40, 1, 90, 0, 0, ...color, 1, false, true)
        }
        // }
    })
})

const actionRegister = register("tick", () => {
    if (!autoRoutesEnabled) return
    if (!Settings().autoRoutesEnabled) return
    if (!activeNodes.length) return
    if (!World.isLoaded()) return

    performActions()
})

const performActions = () => {
    let playerPosition = playerCoords().player

    // for (let i = 0; i < activeNodes.length; i++) {
    activeNodes.forEach((node, i) => {
        // let node = activeNodes[i]
        let extraNodeData = activeNodesCoords[i]
        let nodePos = extraNodeData.position
        let distance = getDistance2D(playerPosition[0], playerPosition[2], nodePos[0], nodePos[2])
        if (distance < node.radius && Math.abs(playerPosition[1] - nodePos[1]) <= node.height) {
            // if (Date.now() - extraNodeData.lastUse < 1000) continue
            // if (extraNodeData.triggered) continue
            if (Date.now() - extraNodeData.lastUse < 1000) return
            if (extraNodeData.triggered) return
            extraNodeData.triggered = true
            if (node.stop) {
                releaseMovementKeys()
                Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
            }
            let exec = () => {
                let execNode = () => {
                    if (!autoRoutesEnabled) return stopRotating() // Don't execute node if you disabled autoroutes between the time the node first triggered and when it executes actions
                    if (node.center) {
                        Player.getPlayer().func_70107_b(nodePos[0], nodePos[1], nodePos[2])
                        releaseMovementKeys()
                        Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
                        // scheduleTask(0, () => nodeActions[node.type](node))
                    }
                    nodeActions[node.type](node)
                }
                if (node.delay) {
                    let execDelay = Math.ceil(parseInt(node.delay) / 50) // Round to nearest tick
                    const preRotateExec = () => preRotate(node, nodePos)
                    execDelay >= 2 ? scheduleTask(execDelay - 2, preRotateExec) : preRotateExec()

                    scheduleTask(execDelay, () => { // Delay execution if there is a delay set
                        playerPosition = playerCoords().player
                        let distance = getDistance2D(playerPosition[0], playerPosition[2], nodePos[0], nodePos[2])
                        if (distance < node.radius && Math.abs(playerPosition[1] - nodePos[1]) <= node.height) execNode()
                        else stopRotating()
                    })
                } else execNode()
            }

            if (node.awaitSecret || node.type === "useItem" && node.awaitBatSpawn) {
                new Promise((resolve, reject) => {
                    addListener(() => resolve(Math.random()), (msg) => reject(msg), node.type === "useItem" && node.awaitBatSpawn)
                    if (!node.delay) preRotate(node, nodePos)
                }).then(nothing => {
                    playerPosition = playerCoords().player
                    let distance = getDistance2D(playerPosition[0], playerPosition[2], nodePos[0], nodePos[2])
                    if (distance < node.radius && Math.abs(playerPosition[1] - nodePos[1]) <= node.height) {
                        scheduleTask(1, exec)
                    } else stopRotating()
                }, // Nice linter, VS Code.
                    message => {
                        stopRotating()
                        chat(message)
                    })

            } else exec()
        } else if (extraNodeData.triggered) extraNodeData.triggered = false
        // }
    })
}

let lastRoomName
register("step", () => {
    if (!World.isLoaded()) return
    if (!Settings().autoRoutesEnabled) return
    if (getRoomName() === lastRoomName) return
    lastRoomName = getRoomName()
    updateRoutes()
}).setFps(10)

const updateRoutes = () => {
    roomNodes = data.nodes[getRoomName()]
    activeNodes = []
    if (!roomNodes || !roomNodes.length) {
        return debugMessage("No routes found for this room!")
    }

    activeNodes = roomNodes
    activeNodesCoords = []
    for (let i = 0; i < activeNodes.length; i++) {
        let nodeToPush = {}
        let node = activeNodes[i]
        let [x, y, z] = convertFromRelative(node.position) // What the fuck is this
        x += 0.5
        y += node.yOffset
        z += 0.5
        nodeToPush.position = [x, y, z]
        nodeToPush.triggered = false
        nodeToPush.lastUse = 0
        if (node.type === "etherwarp") {
            if (node.etherCoordMode === 0 || node.etherCoordMode === 2) nodeToPush.etherBlockCoord = convertFromRelative(node.etherBlock)
            else nodeToPush.etherBlockCoord = rayTraceEtherBlock([x, y, z], convertToRealYaw(node.yaw), node.pitch)
        }
        activeNodesCoords.push(nodeToPush)
    }
    debugMessage("Routes updated for current room.")
}

register("command", () => {
    updateRoutes()
}).setName("updateroutes")

const nodeActions = {
    look: (args) => {
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        if (args.stopSneaking) setSneaking(false)
        rotate(yaw, pitch)
    },
    etherwarp: (args) => {
        const everything = () => {
            Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
            releaseMovementKeys()
            const success = swapFromName("Aspect of The Void")
            if (!success) return
            const rotation = getEtherYawPitchFromArgs(args)
            if (!rotation) return
            const execNode = () => {
                setSneaking(true)
                clickAt(rotation[0], rotation[1], true)
                moveKeyListener = true
                moveKeyCooldown = Date.now()
                blockUnsneakCooldown = Date.now()
            }
            if (success === 2) ChatLib.chat("delayed by 1")
            if (success === 2) scheduleTask(0, execNode)// If success is equal to 2 that means you weren't holding the item before and we need to wait a tick for you to actually be holding the item.
            else execNode()
        }
        // Prevent it from freezing the game if it is raytrace scanning
        if (args.etherCoordMode === 0) new Thread(everything).start()
        else everything()
    },
    useItem: (args) => {
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        const success = swapFromName(args.itemName)
        if (!success) return
        const execNode = () => {
            if (args.stopSneaking) setSneaking(false)
            clickAt(yaw, pitch)
        }
        if (success === 2) scheduleTask(0, execNode)
        else execNode()
    },
    walk: (args) => {
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        rotate(yaw, pitch)
        setWalking(true)
        setSneaking(false)
    },
    superboom: (args) => {
        let [origYaw, origPitch] = [Player.getYaw(), Player.getPitch()]
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        rotate(yaw, pitch)
        const success = swapFromItemID(46)
        if (!success) return
        scheduleTask(0, () => {
            if (Player?.getHeldItem()?.getID() !== 46) return chat("Why aren't you holding a TNT anymore?")
            leftClick()
            if (!Settings().rotateOnServerRotate) rotate(origYaw, origPitch)
        })
    },
    pearlclip: (args) => {
        const success = swapFromName("Ender Pearl")
        if (!success) return
        const execNode = () => {
            clickAt(0, 90)
            registerPearlClip(args.pearlClipDistance)
        }
        if (success === 2) scheduleTask(0, execNode)
        else execNode()
    }
}

register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, () => { // Block unsneaking after etherwarping
    if (Date.now() - blockUnsneakCooldown > 300) return
    if (Client.isInGui() || !World.isLoaded()) return
    const keyState = Keyboard.getEventKeyState()
    const keyCode = Keyboard.getEventKey()
    if (!keyCode) return

    if (keyCode === sneakKey) setSneaking(getDesiredSneakState()) // Schizo shit cause you can't cancel a key input event for some reason
})

register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, () => {
    if (!moveKeyListener) return
    if (Date.now() - moveKeyCooldown < 300) return
    if (Client.isInGui() || !World.isLoaded()) return
    if (!Keyboard.getEventKeyState()) return
    const keyCode = Keyboard.getEventKey()
    if (!keyCode) return

    if (movementKeys.includes(keyCode)) {
        stopRotating()
        moveKeyListener = false
        setSneaking(false)
    }
})

const preRotate = (nodeArgs, pos) => {
    if (!["etherwarp", "useItem", "pearlclip"].includes(nodeArgs.type)) return

    let yaw
    let pitch
    if (nodeArgs.type === "etherwarp") {
        const yawPitch = getEtherYawPitchFromArgs(nodeArgs)
        if (!yawPitch) return
        [yaw, pitch] = yawPitch
    } else {
        [yaw, pitch] = [convertToRealYaw(nodeArgs.yaw), nodeArgs.pitch]
    }
    prepareRotate(yaw, pitch, pos)
}

register("command", () => { // I can't be bothered to deal with circular imports
    if (!activeNodesCoords.some(node => node.triggered)) return
    actionRegister.unregister()
    for (let i = 0; i < activeNodes.length; i++) {
        activeNodesCoords[i].triggered = true
    }

    scheduleTask(5, () => {
        actionRegister.register()
        for (let i = 0; i < activeNodes.length; i++) activeNodesCoords[i].triggered = false
    })
    chat("Cleared triggered nodes.")
}).setName("cleartriggerednodes")