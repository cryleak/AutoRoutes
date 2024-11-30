import Settings from "../config"
import RenderLibV2 from "../../RenderLibV2"
import { convertToRelative, convertFromRelative, getRoomName, chat, playerCoords, swapToItem, calcYawPitch, rotate, setSneaking, setWalking, convertToRealYaw } from "../utils/utils"
import ServerRotations from "../utils/ServerRotations"
import { data } from "../utils/routesData"
import { getDistance3D, C08PacketPlayerBlockPlacement, isValidEtherwarpBlock, MCBlockPos, raytraceBlocks } from "../../BloomCore/utils/utils"
import Vector3 from "../../BloomCore/utils/Vector3";
import "./managementOfShittyAutoRoutesBombDenmarkPleaseEndMe"
import Promise from "../../PromiseV2"
import Async from "../../Async"
import addListener from "../events/SecretListener"

let activeNodes = []
let activeNodesCoords = []
const renderManager = Client.getMinecraft().func_175598_ae()

register("renderWorld", () => {
    if (!Settings().autoRoutesEnabled) return
    if (!activeNodes.length) return
    for (let i = 0; i < activeNodes.length; i++) {
        let position = activeNodesCoords[i].position
        let ring = activeNodes[i]
        if (activeNodesCoords[i].triggered) RenderLibV2.drawCyl(...position, ring.radius, ring.radius, -0.01, 120, 1, 90, 0, 0, 1, 0, 0, 1, false, true)
        else RenderLibV2.drawCyl(...position, ring.radius, ring.radius, -0.01, 120, 1, 90, 0, 0, 1, 1, 1, 1, false, true)
        if (Settings().displayIndex) Tessellator.drawString(`index: ${i}, type: ${activeNodes[i].type}`, ...position, 16777215, true, 0.02, false)
    }
})

register("tick", () => {
    if (!Settings().autoRoutesEnabled) return
    if (!activeNodes.length) return

    performActions()
})

const performActions = () => {
    const playerPosition = [...playerCoords().camera]

    for (let i = 0; i < activeNodes.length; i++) {
        let ring = activeNodes[i]
        let distance = getDistance3D(...playerPosition, ...activeNodesCoords[i].position)
        if (distance < ring.radius) {
            if (activeNodesCoords[i].triggered) return
            activeNodesCoords[i].triggered = true
            const exec = () => {
                setWalking(false)
                ringActions[ring.type](ring, Object.keys(ring))
            }

            if (Object.values(ring.awaitSecret).some(value => value === true)) {
                let startTime = Date.now()

                new Promise((resolve, reject) => {
                    addListener(ring.awaitSecret, () => resolve(Date.now() - startTime), () => reject("hi"))
                }).then((value) => {
                    ChatLib.chat("Secret took" + value)
                    Client.scheduleTask(0, exec)
                }, // Nice linter VS Code
                    (e) => {
                        chat("Await secret timed out!")
                    })

            } else exec()
        } else activeNodesCoords[i].triggered = false
    }
}

let lastRoomName
register("step", () => {
    if (!Settings().autoRoutesEnabled) return
    if (getRoomName() === lastRoomName) return
    lastRoomName = getRoomName()
    updateRoutes()
}).setFps(4)

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
            triggered: false
        })
    }
}

register("command", () => {
    chat("Routes updated for current room.")
    updateRoutes()
}).setName("updateroutes")

register("command", (...args) => {
    ServerRotations.clickAt(args[0], args[1])
}).setName("setrot")

const ringActions = {
    look: (args) => {
        let [yaw, pitch] = [convertToRealYaw(args.yaw), args.pitch]
        rotate(yaw, pitch)
    },
    etherwarp: (args) => {
        const etherBlock = convertFromRelative(args.etherBlock)
        let yawPitch = calcYawPitch(etherBlock[0] + 0.5, etherBlock[1] + 1, etherBlock[2] + 0.5)
        const rotation = {
            yaw: yawPitch[0],
            pitch: yawPitch[1]
        }

        let etherYawPitch = getEtherYawPitch(rotation.yaw, rotation.pitch, etherBlock)
        if (!etherYawPitch) return chat("Failed to get a valid yaw pitch combination!")
        swapToItem("Aspect of The Void")
        setSneaking(true)
        ServerRotations.clickAt(etherYawPitch[0], etherYawPitch[1])
        moveKeyListener.register()
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
        moveKeyListener.unregister()
    }
}

const movementKeys = [Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(), Client.getMinecraft().field_71474_y.field_74370_x.func_151463_i(), Client.getMinecraft().field_71474_y.field_74366_z.func_151463_i(), Client.getMinecraft().field_71474_y.field_74368_y.func_151463_i()]

const moveKeyListener = register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, () => {
    if (Client.isInGui() || !World.isLoaded()) return
    if (!Keyboard.getEventKeyState()) return
    const keyCode = Keyboard.getEventKey()
    if (!keyCode) return

    if (movementKeys.includes(keyCode)) {
        moveKeyListener.unregister()
        setSneaking(false)
    }
}).unregister()

const getEtherYawPitch = (originalYaw, originalPitch, coords) => {
    const playerCoords = [Player.getX(), Player.getY() + Player.getPlayer().func_70047_e(), Player.getZ()]
    let runs = 0
    for (let yaw = originalYaw - 3; yaw <= originalYaw + 3; yaw += 0.5) {
        for (let pitch = originalPitch - 3; pitch <= originalPitch + 3; pitch += 0.5) {
            let prediction = raytraceBlocks(playerCoords, Vector3.fromPitchYaw(pitch, yaw), 60, isValidEtherwarpBlock, true, true)
            runs++
            if (!prediction) continue
            if (prediction.every((coord, index) => coord == coords[index])) {
                ChatLib.chat(runs)
                return [yaw, pitch]
            }
        }
    }
    ChatLib.chat(runs)
}