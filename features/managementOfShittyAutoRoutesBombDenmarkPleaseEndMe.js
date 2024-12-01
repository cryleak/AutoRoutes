import ringCreation from "../ringCreation"
import { configNames } from "../ringCreation"
import { convertToRelative, convertFromRelative, getRoomName, chat, ringTypes, availableArgs, playerCoords, convertToRelativeYaw, convertToRealYaw, setWalking } from "../utils/utils"
import { data } from "../utils/routesData"
import { getDistance3D, isValidEtherwarpBlock, raytraceBlocks } from "../../BloomCore/utils/utils"
import Vector3 from "../../BloomCore/utils/Vector3";

let editingCoords = null

if (!data.profiles["RetardedProfile"]) {
    data.profiles["RetardedProfile"] = {}
}

ringCreation().getConfig().onCloseGui(() => {
    if (editingCoords) addRing(ringCreation(), editingCoords)
    else addRing(ringCreation())
})

register("command", () => {
    editingCoords = null
    const config = ringCreation().getConfig()

    config.setConfigValue("Ring", "yaw", Player.getYaw().toString())
    config.setConfigValue("Ring", "pitch", Player.getPitch().toString())
    const prediction = raytraceBlocks([Player.getX(), Player.getY() + Player.getPlayer().func_70047_e(), Player.getZ()], Vector3.fromPitchYaw(Player.getPitch(), Player.getYaw()), 60, isValidEtherwarpBlock, true, true) ?? "0,0,0"
    config.setConfigValue("Ring", "etherBlock", prediction.toString())
    config.setConfigValue("Ring", "awaitSecretBat", false)
    config.setConfigValue("Ring", "awaitSecretChest", false)
    config.setConfigValue("Ring", "awaitSecretEssence", false)
    config.setConfigValue("Ring", "awaitSecretItem", false)




    ringCreation().getConfig().openGui()
}).setName("createring")

register("command", (index) => {
    const roomNodes = data.profiles[data.selectedProfile][getRoomName()]
    if (!roomNodes || !roomNodes.length) return chat("No nodes found for this room!")

    let nearestRingIndex
    if (index) {
        if (isNaN(index)) return chat("Not a number!")
        nearestRingIndex = parseInt(index)
    }
    else nearestRingIndex = getNearestRingIndex()

    const ring = roomNodes[nearestRingIndex]
    editingCoords = convertFromRelative(ring.position)


    const config = ringCreation().getConfig()
    config.setConfigValue("Ring", "radius", ring.radius)
    config.setConfigValue("Ring", "height", ring.height)
    config.setConfigValue("Ring", "type", ringTypes.indexOf(ring.type))
    config.setConfigValue("Ring", "yaw", convertToRealYaw(ring.yaw) ?? Player.getYaw().toString())
    config.setConfigValue("Ring", "pitch", ring.pitch ?? Player.getPitch().toString())
    const prediction = raytraceBlocks([Player.getX(), Player.getY() + Player.getPlayer().func_70047_e(), Player.getZ()], Vector3.fromPitchYaw(Player.getPitch(), Player.getYaw()), 60, isValidEtherwarpBlock, true, true) ?? "0,0,0"
    config.setConfigValue("Ring", "etherBlock", ring.etherBlock ?? prediction)
    config.setConfigValue("Ring", "awaitSecretBat", ring.awaitSecret.bat)
    config.setConfigValue("Ring", "awaitSecretChest", ring.awaitSecret.chest)
    config.setConfigValue("Ring", "awaitSecretEssence", ring.awaitSecret.essence)
    config.setConfigValue("Ring", "awaitSecretItem", ring.awaitSecret.item)

    ringCreation().getConfig().openGui()
    roomNodes.splice(nearestRingIndex, 1)
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

function addRing(args, position) {
    if (!position) position = [Player.getX(), Player.getY(), Player.getZ()]
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

    if (ringType === "etherwarp" && !editingCoords) args.etherBlock = convertToRelative(args.etherBlock.split(",").map(coord => Math.floor(parseFloat(coord))))
    else if (["look", "walk", "finish"].includes(ringType)) args.yaw = convertToRelativeYaw(args.yaw)


    let ring = { type: ringType, position: convertToRelative(position), radius: parseFloat(args.radius), awaitSecret: awaitSecretState, height: args.height }
    for (let i = 0; i < ringSpecificArgs.length; i++) {
        ring[ringSpecificArgs[i]] = args[ringSpecificArgs[i]]
    }
    data.profiles[data.selectedProfile][roomName].push(ring)
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