import Settings from "../config"
import ringCreation from "../ringCreation"
import { ringTypes, availableArgs } from "../ringCreation"
import { convertToRelative, convertFromRelative, getRoomName, chat, playerCoords, convertToRelativeYaw, convertToRealYaw, getEyeHeightSneaking, rayTraceEtherBlock } from "../utils/utils"
import { data } from "../utils/routesData"
import { getDistance3D } from "../../BloomCore/utils/utils"

let ringCoords = null
let editingRingIndex = null

if (!data.profiles["RetardedProfile"]) {
    data.profiles["RetardedProfile"] = {}
}

ringCreation().getConfig().onCloseGui(() => {
    addRing(ringCreation(), ringCoords)
})

register("command", () => {
    ringCoords = playerCoords().camera
    editingRingIndex = null
    const config = ringCreation().getConfig()

    config.setConfigValue("Ring", "stop", false)
    config.setConfigValue("Ring", "etherCoordMode", 0)
    config.setConfigValue("Ring", "yaw", Player.getYaw().toFixed(3))
    config.setConfigValue("Ring", "pitch", Player.getPitch().toFixed(3))
    const prediction = rayTraceEtherBlock([Player.getX(), Player.getY() + getEyeHeightSneaking(), Player.getZ()], Player.getYaw(), Player.getPitch()) ?? "0,0,0"
    config.setConfigValue("Ring", "etherBlock", prediction.toString())
    config.setConfigValue("Ring", "awaitSecret", false)
    config.setConfigValue("Ring", "awaitBatSpawn", false)
    config.setConfigValue("Ring", "delay", 0)
    config.setConfigValue("Ring", "pearlClipDistance", "20")



    ringCreation().getConfig().openGui()
}).setName("createring")

register("command", (...args) => {
    const roomNodes = data.profiles[data.selectedProfile][getRoomName()]
    if (!roomNodes || !roomNodes.length) return chat("No nodes found for this room!")

    let nearestRingIndex
    let yaw
    if (args && args.length) {
        const index = args.shift()
        if (!isNaN(index)) nearestRingIndex = parseInt(index)
        else if (args.some(arg => arg.includes("resetrot"))) yaw = Player.getYaw().toFixed(3)
    }
    if (!nearestRingIndex) nearestRingIndex = getNearestRingIndex()

    const ring = roomNodes[nearestRingIndex]
    if (!yaw) yaw = (convertToRealYaw(ring.yaw) ?? Player.getYaw()).toFixed(3)
    editingRingIndex = nearestRingIndex
    ringCoords = convertFromRelative(ring.position)
    ringCoords[1] = Math.floor(ringCoords[1]) + ring.yOffset


    const config = ringCreation().getConfig()
    config.setConfigValue("Ring", "stop", ring.stop)
    config.setConfigValue("Ring", "radius", ring.radius)
    config.setConfigValue("Ring", "height", ring.height)
    config.setConfigValue("Ring", "type", ringTypes.indexOf(ring.type))
    config.setConfigValue("Ring", "yaw", yaw)
    config.setConfigValue("Ring", "pitch", (parseFloat(ring.pitch) ?? Player.getPitch()).toFixed(3))
    const prediction = rayTraceEtherBlock([Player.getX(), Player.getY() + getEyeHeightSneaking(), Player.getZ()], Player.getYaw(), Player.getPitch()) ?? "0,0,0"
    const etherBlock = convertFromRelative(ring.etherBlock) ?? prediction
    config.setConfigValue("Ring", "itemName", ring.itemName ?? "Aspect of the Void")
    config.setConfigValue("Ring", "stopSneaking", ring.stopSneaking ?? false)
    config.setConfigValue("Ring", "awaitBatSpawn", ring.awaitBatSpawn ?? false)
    config.setConfigValue("Ring", "etherCoordMode", ring.etherCoordMode)
    config.setConfigValue("Ring", "etherBlock", etherBlock.toString())
    config.setConfigValue("Ring", "awaitSecret", ring.awaitSecret)
    config.setConfigValue("Ring", "delay", ring.delay)
    config.setConfigValue("Ring", "pearlClipDistance", ring.pearlClipDistance ?? "20")

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

function addRing(args, pos) {
    let yOffset = pos[1] - Math.floor(pos[1]) // Allow for decimals on the Y Axis.
    pos = pos.map(coord => coord = Math.floor(parseFloat(coord)))
    const ringType = ringTypes[parseInt(args.type)]
    if (!ringType) return
    const roomName = getRoomName()
    if (!roomName) return chat("No room detected!")
    if (!data.profiles[data.selectedProfile][roomName]) data.profiles[data.selectedProfile][roomName] = []


    const ringSpecificArgs = availableArgs.get(ringType) // Args specific to the current ring type


    if (ringType === "etherwarp") args.etherBlock = convertToRelative(args.etherBlock.split(",").map(coord => Math.floor(parseFloat(coord))))

    if (["look", "etherwarp", "useItem", "walk", "superboom"].includes(ringType)) args.yaw = convertToRelativeYaw(args.yaw)


    pos = convertToRelative(pos)

    let ring = { type: ringType, position: pos, yOffset: yOffset, radius: parseFloat(args.radius), awaitSecret: args.awaitSecret, height: args.height, delay: parseInt(args.delay), stop: args.stop }
    for (let i = 0; i < ringSpecificArgs.length; i++) {
        ring[ringSpecificArgs[i]] = args[ringSpecificArgs[i]]
    }
    if (editingRingIndex || editingRingIndex === 0) data.profiles[data.selectedProfile][roomName][editingRingIndex] = ring
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
        let realCoords = convertFromRelative(roomNodes[i].position)
        realCoords[1] += roomNodes[i].yOffset
        ringDistances.push({
            distance: getDistance3D(...realCoords, ...playerCoords().camera),
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
ringCreation().getConfig().setConfigValue("Ring", "itemName", "Aspect of the Void")
ringCreation().getConfig().setConfigValue("Ring", "stopSneaking", false)
ringCreation().getConfig().setConfigValue("Ring", "etherCoordMode", 0)
ringCreation().getConfig().setConfigValue("Ring", "yaw", 0)
ringCreation().getConfig().setConfigValue("Ring", "pitch", 0)
ringCreation().getConfig().setConfigValue("Ring", "etherBlock", "0,0,0")
ringCreation().getConfig().setConfigValue("Ring", "awaitSecret", false)
ringCreation().getConfig().setConfigValue("Ring", "delay", 0)
ringCreation().getConfig().setConfigValue("Ring", "pearlClipDistance", "20")