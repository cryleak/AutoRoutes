import { nodeTypes, availableArgs } from "../nodeCreation"
import { chat } from "../utils/utils"
import { convertToRelative, convertFromRelative, getRoomName, convertToRelativeYaw, convertToRealYaw } from "../utils/RoomUtils"
import { playerCoords, getEyeHeightSneaking, rayTraceEtherBlock } from "../utils/RouteUtils"
import { data } from "../utils/routesData"
import { getDistance3D } from "../../BloomCore/utils/utils"
import nodeCreation from "../nodeCreation"

let nodeCoords = null
let editingNodeIndex = null

nodeCreation().getConfig().onCloseGui(() => {
    addNode(nodeCreation(), nodeCoords)
})

register("command", () => {
    nodeCoords = playerCoords().camera
    editingNodeIndex = null
    const config = nodeCreation().getConfig()

    config.setConfigValue("Node", "center", false)
    config.setConfigValue("Node", "stop", false)
    config.setConfigValue("Node", "itemName", Player?.getHeldItem()?.getName() ?? "Aspect of the Void")
    config.setConfigValue("Node", "etherCoordMode", 2)
    config.setConfigValue("Node", "yaw", Player.getYaw().toFixed(3))
    config.setConfigValue("Node", "pitch", Player.getPitch().toFixed(3))
    const prediction = rayTraceEtherBlock([Player.getX(), Player.getY(), Player.getZ()], Player.getYaw(), Player.getPitch()) ?? "0,0,0"
    config.setConfigValue("Node", "etherBlock", prediction.toString())
    config.setConfigValue("Node", "awaitSecret", false)
    config.setConfigValue("Node", "awaitBatSpawn", false)
    config.setConfigValue("Node", "delay", 0)
    config.setConfigValue("Node", "pearlClipDistance", "20")



    nodeCreation().getConfig().openGui()
}).setName("createnode")

register("command", (...args) => {
    const roomNodes = data.nodes[getRoomName()]
    if (!roomNodes || !roomNodes.length) return chat("No nodes found for this room!")

    let nearestNodeIndex
    let yaw
    if (args && args.length) {
        const index = args.shift()
        if (!isNaN(index)) nearestNodeIndex = parseInt(index)
        else if (args.some(arg => arg.includes("resetrot"))) yaw = Player.getYaw().toFixed(3)
    }
    if (!nearestNodeIndex) nearestNodeIndex = getNearestNodeIndex()

    const node = roomNodes[nearestNodeIndex]
    if (!node) return chat("Node doesn't exist!")
    if (!yaw) yaw = (convertToRealYaw(node.yaw) ?? Player.getYaw()).toFixed(3)
    editingNodeIndex = nearestNodeIndex
    nodeCoords = convertFromRelative(node.position)
    nodeCoords[1] = Math.floor(nodeCoords[1]) + node.yOffset


    const config = nodeCreation().getConfig()
    config.setConfigValue("Node", "center", node.center)
    config.setConfigValue("Node", "stop", node.stop)
    config.setConfigValue("Node", "radius", node.radius)
    config.setConfigValue("Node", "height", node.height)
    config.setConfigValue("Node", "type", nodeTypes.indexOf(node.type))
    config.setConfigValue("Node", "yaw", yaw)
    config.setConfigValue("Node", "pitch", (parseFloat(node.pitch) ?? Player.getPitch()).toFixed(3))
    const prediction = rayTraceEtherBlock([Player.getX(), Player.getY(), Player.getZ()], Player.getYaw(), Player.getPitch()) ?? "0,0,0"
    const etherBlock = convertFromRelative(node.etherBlock) ?? prediction
    config.setConfigValue("Node", "itemName", node.itemName ?? Player.getHeldItem().getName())
    config.setConfigValue("Node", "stopSneaking", node.stopSneaking ?? false)
    config.setConfigValue("Node", "awaitBatSpawn", node.awaitBatSpawn ?? false)
    config.setConfigValue("Node", "etherCoordMode", node.etherCoordMode)
    config.setConfigValue("Node", "etherBlock", etherBlock.toString())
    config.setConfigValue("Node", "awaitSecret", node.awaitSecret)
    config.setConfigValue("Node", "delay", node.delay)
    config.setConfigValue("Node", "pearlClipDistance", node.pearlClipDistance ?? "20")

    nodeCreation().getConfig().openGui()
}).setName("editnode")

register("command", (index) => {
    const roomNodes = data.nodes[getRoomName()]
    if (!roomNodes || !roomNodes.length) return chat("No nodes found for this room!")

    let indexToDelete
    if (index) {
        if (isNaN(index)) return chat("Not a number!")
        indexToDelete = parseInt(index)
    }
    else {
        indexToDelete = getNearestNodeIndex()
    }
    if (!roomNodes[indexToDelete]) return chat("Node doesn't exist!")
    let nodeString = "Deleted node: "
    const propertyNames = Object.getOwnPropertyNames(roomNodes[indexToDelete])
    propertyNames.forEach((arg, index) => nodeString += `§b${arg}: §c${roomNodes[indexToDelete][arg]}${index === propertyNames.length - 1 ? "." : ", "}§f`)
    chat(nodeString)
    roomNodes.splice(indexToDelete, 1)
    data.save()
    ChatLib.command("updateroutes", true)
}).setName("removenode")

function addNode(args, pos) {
    let yOffset = pos[1] - Math.floor(pos[1]) // Allow for decimals on the Y Axis.
    pos = pos.map(coord => coord = Math.floor(parseFloat(coord)))
    const nodeType = nodeTypes[parseInt(args.type)]
    if (!nodeType) return
    const roomName = getRoomName()
    if (!roomName) return chat("No room detected!")
    if (!data.nodes[roomName]) data.nodes[roomName] = []


    const nodeSpecificArgs = availableArgs.get(nodeType) // Args specific to the current node type


    if (nodeType === "etherwarp") args.etherBlock = convertToRelative(args.etherBlock.split(",").map(coord => Math.floor(parseFloat(coord))))

    if (["look", "etherwarp", "useItem", "walk", "superboom"].includes(nodeType)) args.yaw = convertToRelativeYaw(args.yaw)


    pos = convertToRelative(pos)

    let node = { type: nodeType, position: pos, yOffset: yOffset, radius: parseFloat(args.radius), awaitSecret: args.awaitSecret, height: args.height, delay: parseInt(args.delay), stop: args.stop, center: args.center }
    for (let i = 0; i < nodeSpecificArgs.length; i++) {
        node[nodeSpecificArgs[i]] = args[nodeSpecificArgs[i]]
    }
    if (editingNodeIndex || editingNodeIndex === 0) data.nodes[roomName][editingNodeIndex] = node
    else data.nodes[roomName].push(node)
    data.save()
    let nodeString = "Added node: "
    const propertyNames = Object.getOwnPropertyNames(node)
    propertyNames.forEach((arg, index) => nodeString += `§b${arg}: §c${node[arg]}${index === propertyNames.length - 1 ? "." : ", "}§f`)
    chat(nodeString)
    ChatLib.command("updateroutes", true)
}

function getNearestNodeIndex() {
    const roomNodes = data.nodes[getRoomName()]
    if (!roomNodes || !roomNodes.length) return chat("No nodes found for this room!")

    let nodeDistances = []
    for (let i = 0; i < roomNodes.length; i++) {
        let realCoords = convertFromRelative(roomNodes[i].position)
        realCoords[1] += roomNodes[i].yOffset
        nodeDistances.push({
            distance: getDistance3D(...realCoords, ...playerCoords().camera),
            nodeIndex: i
        })
    }
    const sortedNodeDistances = nodeDistances.sort((a, b) => a.distance - b.distance)
    return sortedNodeDistances[0].nodeIndex
}



// Reset everything
nodeCreation().getConfig().setConfigValue("Node", "center", false)
nodeCreation().getConfig().setConfigValue("Node", "stop", false)
nodeCreation().getConfig().setConfigValue("Node", "radius", 0.5)
nodeCreation().getConfig().setConfigValue("Node", "height", 0.1)
nodeCreation().getConfig().setConfigValue("Node", "type", 0)
nodeCreation().getConfig().setConfigValue("Node", "itemName", Player?.getHeldItem()?.getName() ?? "Aspect of the Void")
nodeCreation().getConfig().setConfigValue("Node", "stopSneaking", false)
nodeCreation().getConfig().setConfigValue("Node", "etherCoordMode", 2)
nodeCreation().getConfig().setConfigValue("Node", "yaw", 0)
nodeCreation().getConfig().setConfigValue("Node", "pitch", 0)
nodeCreation().getConfig().setConfigValue("Node", "etherBlock", "0,0,0")
nodeCreation().getConfig().setConfigValue("Node", "awaitSecret", false)
nodeCreation().getConfig().setConfigValue("Node", "delay", 0)
nodeCreation().getConfig().setConfigValue("Node", "pearlClipDistance", "20")