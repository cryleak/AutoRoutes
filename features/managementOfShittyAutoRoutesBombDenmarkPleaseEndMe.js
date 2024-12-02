import Settings from "../config"
import ringCreation from "../ringCreation"
import { convertToRelative, convertFromRelative, getRoomName, chat, playerCoords, convertToRelativeYaw, convertToRealYaw, getEyeHeightSneaking } from "../utils/utils"
import { data } from "../utils/routesData"
import { getDistance3D, isValidEtherwarpBlock, raytraceBlocks } from "../../BloomCore/utils/utils"
import Vector3 from "../../BloomCore/utils/Vector3";

const ringTypes = ["look", "etherwarp", "aotv", "hype", "walk", "finish", "superboom", "pearlclip"]
const availableArgs = new Map([
    ["look", ["yaw", "pitch"]],
    ["etherwarp", ["etherBlock", "etherCoordMode", "yaw", "pitch"]],
    ["aotv", ["yaw", "pitch"]],
    ["hype", ["yaw", "pitch"]],
    ["walk", ["yaw", "pitch"]],
    ["finish", ["yaw", "pitch"]],
    ["superboom", ["yaw", "pitch"]],
    ["pearlclip", ["pearlClipDistance"]]
])
let editingCoords = null
let editingRingIndex

if (!data.profiles["RetardedProfile"]) {
    data.profiles["RetardedProfile"] = {}
}

ringCreation().getConfig().onCloseGui(() => {
    if (editingCoords) addRing(ringCreation(), editingCoords, editingRingIndex)
    else addRing(ringCreation())
})

register("command", () => {
    editingCoords = null
    const config = ringCreation().getConfig()

    config.setConfigValue("Ring", "stop", false)
    config.setConfigValue("Ring", "yaw", Player.getYaw().toFixed(3))
    config.setConfigValue("Ring", "pitch", Player.getPitch().toFixed(3))
    const prediction = raytraceBlocks([Player.getX(), Player.getY() + getEyeHeightSneaking(), Player.getZ()], Vector3.fromPitchYaw(Player.getPitch(), Player.getYaw()), 60, isValidEtherwarpBlock, true, true) ?? "0,0,0"
    config.setConfigValue("Ring", "etherBlock", prediction.toString())
    config.setConfigValue("Ring", "awaitSecretBat", false)
    config.setConfigValue("Ring", "awaitSecretChest", false)
    config.setConfigValue("Ring", "awaitSecretEssence", false)
    config.setConfigValue("Ring", "awaitSecretItem", false)
    config.setConfigValue("Ring", "delay", 0)
    config.setConfigValue("Ring", "pearlClipDistance", "40")




    ringCreation().getConfig().openGui()
}).setName("createring")

register("command", (...args) => {
    const roomNodes = data.profiles[data.selectedProfile][getRoomName()]
    if (!roomNodes || !roomNodes.length) return chat("No nodes found for this room!")

    let nearestRingIndex
    let yaw
    if (args.length) {
        const index = args.shift()
        if (!isNaN(index)) nearestRingIndex = parseInt(index)
        else if (args.some(arg => arg.includes("resetrot"))) yaw = Player.getYaw().toFixed(3)
    }
    if (!nearestRingIndex) nearestRingIndex = getNearestRingIndex()

    const ring = roomNodes[nearestRingIndex]
    if (!yaw) yaw = (convertToRealYaw(ring.yaw) ?? Player.getYaw()).toFixed(3)
    editingRingIndex = nearestRingIndex
    editingCoords = convertFromRelative(ring.position)


    const config = ringCreation().getConfig()
    config.setConfigValue("Ring", "stop", ring.stop)
    config.setConfigValue("Ring", "radius", ring.radius)
    config.setConfigValue("Ring", "height", ring.height)
    config.setConfigValue("Ring", "type", ringTypes.indexOf(ring.type))
    config.setConfigValue("Ring", "yaw", yaw)
    config.setConfigValue("Ring", "pitch", (parseFloat(ring.pitch) ?? Player.getPitch()).toFixed(3))
    const prediction = raytraceBlocks([Player.getX(), Player.getY() + getEyeHeightSneaking(), Player.getZ()], Vector3.fromPitchYaw(Player.getPitch(), Player.getYaw()), 60, isValidEtherwarpBlock, true, true) ?? "0,0,0"
    const etherBlock = convertFromRelative(ring.etherBlock) ?? prediction
    config.setConfigValue("Ring", "etherCoordMode", ring.etherCoordMode)
    config.setConfigValue("Ring", "etherBlock", etherBlock.toString())
    config.setConfigValue("Ring", "awaitSecretBat", ring.awaitSecret.bat)
    config.setConfigValue("Ring", "awaitSecretChest", ring.awaitSecret.chest)
    config.setConfigValue("Ring", "awaitSecretEssence", ring.awaitSecret.essence)
    config.setConfigValue("Ring", "awaitSecretItem", ring.awaitSecret.item)
    config.setConfigValue("Ring", "delay", ring.delay)
    config.setConfigValue("Ring", "pearlClipDistance", ring.pearlClipDistance ?? "40")

    ringCreation().getConfig().openGui()
}).setName("editring")

register("command", (index) => {
    const roomNodes = data.profiles[data.selectedProfile][getRoomName()]
    if (!roomNodes || !roomNodes.length) return chat("No nodes found for this room!")

    let indexToDelete
    if (index) {
        if (isNaN(index)) return chat("Not a number!")
        indexToDelete = parseInt(index)
    }
    else {
        indexToDelete = getNearestRingIndex()
    }
    chat(`Deleted ring:\n${JSON.stringify(roomNodes[indexToDelete])}`)
    roomNodes.splice(indexToDelete, 1)
    data.save()
    ChatLib.command("updateroutes", true)
}).setName("removering")

function addRing(args, position, ringIndex) {
    if (!position) position = [Math.floor(Player.getX()), Math.floor(Player.getY()), Math.floor(Player.getZ())]
    const yOffset = Player.getY() - position[1]
    const ringType = ringTypes[parseInt(args.type)]
    if (!ringType) return
    const roomName = getRoomName()
    if (!roomName) return chat("No room detected!")
    if (!data.profiles[data.selectedProfile][roomName]) data.profiles[data.selectedProfile][roomName] = []


    const ringSpecificArgs = availableArgs.get(ringType) // Args specific to the current ring type

    const awaitSecretState = {
        bat: args.awaitSecretBat,
        chest: args.awaitSecretChest,
        essence: args.awaitSecretEssence,
        item: args.awaitSecretItem
    }

    if (ringType === "etherwarp") args.etherBlock = convertToRelative(args.etherBlock.split(",").map(coord => Math.floor(parseFloat(coord))))

    if (["look", "etherwarp", "aotv", "hype", "walk", "finish", "superboom"].includes(ringType)) args.yaw = convertToRelativeYaw(args.yaw)


    let position = convertToRelative(position)

    let ring = { type: ringType, position: position, yOffset: yOffset, radius: parseFloat(args.radius), awaitSecret: awaitSecretState, height: args.height, delay: parseInt(args.delay), stop: args.stop }
    for (let i = 0; i < ringSpecificArgs.length; i++) {
        ring[ringSpecificArgs[i]] = args[ringSpecificArgs[i]]
    }
    if (ringIndex || ringIndex === 0) data.profiles[data.selectedProfile][roomName][ringIndex] = ring
    else data.profiles[data.selectedProfile][roomName].push(ring)
    data.save()
    let ringString = "Added ring: "
    const propertyNames = Object.getOwnPropertyNames(ring)
    propertyNames.forEach((arg, index) => ringString += `§b${arg}: §c${ring[arg]}${index === propertyNames.length - 1 ? "." : ", "}§f`)
    chat(ringString)
    ChatLib.command("updateroutes", true)
}

function getNearestRingIndex() {
    const roomNodes = data.profiles[data.selectedProfile][getRoomName()]
    if (!roomNodes || !roomNodes.length) return chat("No nodes found for this room!")

    let ringDistances = []
    for (let i = 0; i < roomNodes.length; i++) {
        ringDistances.push({
            distance: getDistance3D(...convertFromRelative([...roomNodes[i].position]), ...playerCoords().camera),
            ringIndex: i
        })
    }
    const sortedRingDistances = ringDistances.sort((a, b) => a.distance - b.distance)
    return sortedRingDistances[0].ringIndex
}



// Reset everything
ringCreation().getConfig().setConfigValue("Ring", "stop", false)
ringCreation().getConfig().setConfigValue("Ring", "radius", 0.7)
ringCreation().getConfig().setConfigValue("Ring", "height", 0.05)
ringCreation().getConfig().setConfigValue("Ring", "type", 0)
ringCreation().getConfig().setConfigValue("Ring", "etherCoordMode", 0)
ringCreation().getConfig().setConfigValue("Ring", "yaw", 0)
ringCreation().getConfig().setConfigValue("Ring", "pitch", 0)
ringCreation().getConfig().setConfigValue("Ring", "etherBlock", "0,0,0")
ringCreation().getConfig().setConfigValue("Ring", "awaitSecretBat", false)
ringCreation().getConfig().setConfigValue("Ring", "awaitSecretChest", false)
ringCreation().getConfig().setConfigValue("Ring", "awaitSecretEssence", false)
ringCreation().getConfig().setConfigValue("Ring", "awaitSecretItem", false)
ringCreation().getConfig().setConfigValue("Ring", "delay", 0)
ringCreation().getConfig().setConfigValue("Ring", "pearlClipDistance", "40")