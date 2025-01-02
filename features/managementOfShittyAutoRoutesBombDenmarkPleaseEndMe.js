import { nodeTypes, availableArgs } from "../nodeCreation"
import { chat } from "../utils/utils"
import { convertToRelative, convertFromRelative, getRoomName, convertToRelativeYaw, convertToRealYaw } from "../utils/RoomUtils"
import { playerCoords, rayTraceEtherBlock } from "../utils/RouteUtils"
import { data } from "../utils/routesData"
import { getDistance3D } from "../../BloomCore/utils/utils"
import nodeCreation from "../nodeCreation"

const dependencyChecks = { // sigma
    showItemName: (data) => data.type === 2,
    showStopSneaking: (data) => data.type === 2,
    showEtherCoordMode: (data) => data.type === 1,
    showYaw: (data) => data.type === 0 || data.type === 1 && data.etherCoordMode === 1 || data.type === 2 || data.type === 3 || data.type === 4,
    showPitch: (data) => data.type === 0 || data.type === 1 && data.etherCoordMode === 1 || data.type === 2 || data.type === 3 || data.type === 4,
    showEtherBlock: (data) => data.type === 1 && (data.etherCoordMode === 0 || data.etherCoordMode === 2),
    showAwaitSecret: (data) => !data.awaitBatSpawn || data.type !== 2,
    showAwaitBatSpawn: (data) => !data.awaitSecret && data.type === 2,
    showPearlClipDistance: (data) => data.type === 5,
    showCommandArgs: (data) => data.type === 6,
    showRunClientSide: (data) => data.type === 6
}

let nodeCoords = null
let editingNodeIndex = null
let editing = false

register("guiClosed", (gui) => {
    if (!editing) return
    if (!(gui instanceof Java.type("gg.essential.vigilance.gui.SettingsGui"))) return
    editing = false
    addNode(nodeCreation, nodeCoords)
})

register("tick", () => {
    if (!editing) return
    let reopen = false
    Object.getOwnPropertyNames(dependencyChecks).forEach(value => {
        const state = dependencyChecks[value](nodeCreation)
        if (nodeCreation[value] !== state) {
            reopen = true
            nodeCreation[value] = state
        }
    })
    if (reopen) {
        editing = false
        nodeCreation.openGUI()
        Client.scheduleTask(1, () => editing = true)
    }
})

register("command", () => {
    nodeCoords = playerCoords().camera
    editingNodeIndex = null

    nodeCreation.center = false
    nodeCreation.stop = false
    nodeCreation.itemName = Player?.getHeldItem()?.getName() ?? "Aspect of the Void"
    nodeCreation.etherCoordMode = 2
    nodeCreation.yaw = Player.getYaw().toFixed(3)
    nodeCreation.pitch = Player.getPitch().toFixed(3)
    nodeCreation.etherBlock = rayTraceEtherBlock([Player.getX(), Player.getY(), Player.getZ()], Player.getYaw(), Player.getPitch())?.toString() ?? "0,0,0"
    nodeCreation.awaitSecret = false
    nodeCreation.awaitBatSpawn = false
    nodeCreation.runClientside = false
    nodeCreation.commandArgs = ""
    nodeCreation.delay = "0"
    nodeCreation.pearlClipDistance = "20"



    nodeCreation.openGUI()
    Client.scheduleTask(1, () => editing = true)
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


    nodeCreation.center = node.center
    nodeCreation.stop = node.stop
    nodeCreation.radius = node.radius
    nodeCreation.height = node.height.toString()
    nodeCreation.type = nodeTypes.indexOf(node.type)
    nodeCreation.yaw = yaw
    nodeCreation.pitch = (parseFloat(node.pitch) ?? Player.getPitch()).toFixed(3)
    const prediction = rayTraceEtherBlock([Player.getX(), Player.getY(), Player.getZ()], Player.getYaw(), Player.getPitch()) ?? "0,0,0"
    const etherBlock = convertFromRelative(node.etherBlock) ?? prediction
    nodeCreation.itemName = node.itemName ?? Player?.getHeldItem()?.getName()
    nodeCreation.stopSneaking = node.stopSneaking ?? false
    nodeCreation.awaitBatSpawn = node.awaitBatSpawn ?? false
    nodeCreation.etherCoordMode = node.etherCoordMode ?? 0
    nodeCreation.etherBlock = etherBlock?.toString() ?? "0,0,0"
    nodeCreation.awaitSecret = node.awaitSecret ?? false
    nodeCreation.runClientSide = node.runClientSide ?? true
    nodeCreation.commandArgs = node.commandArgs ?? ""
    nodeCreation.delay = node.delay.toString()
    nodeCreation.pearlClipDistance = node.pearlClipDistance ?? "20"

    nodeCreation.openGUI()
    Client.scheduleTask(1, () => editing = true)
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
nodeCreation.center = false
nodeCreation.stop = false
nodeCreation.radius = 0.5
nodeCreation.height = "0.1"
nodeCreation.type = 0
nodeCreation.itemName = Player?.getHeldItem()?.getName() ?? "Aspect of the Void"
nodeCreation.stopSneaking = false
nodeCreation.etherCoordMode = 2
nodeCreation.yaw = 0
nodeCreation.pitch = 0
nodeCreation.etherBlock = "0,0,0"
nodeCreation.awaitSecret = false
nodeCreation.runClientSide = true
nodeCreation.commandArgs = ""
nodeCreation.delay = 0
nodeCreation.pearlClipDistance = 20