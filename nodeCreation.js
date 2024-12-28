import DefaultConfig from "../Amaterasu/core/DefaultConfig"
import Settings from "../Amaterasu/core/Settings"

const config = new DefaultConfig("AutoRoutes", "NonexistentConfig.json")


config
    .addSwitch({
        configName: "center",
        title: "Center",
        description: "Puts you right in the center of where the NODE is located. Note that this also modifies your Y level, so it may not work and just lagback if your node is extremely tall.",
        category: "Node"
    })
    .addSwitch({
        configName: "stop",
        title: "Stop",
        description: "Stops all movement when you trigger this node.",
        category: "Node"
    })
    .addTextInput({
        configName: "radius",
        title: "Radius",
        description: "Radius of the node in blocks.",
        category: "Node",
        value: "0.7"
    })
    .addTextInput({
        configName: "height",
        title: "Height",
        description: "Height of the node in blocks.",
        category: "Node",
        value: "0.1"
    })
    .addDropDown({
        configName: "type",
        title: "Node type",
        description: "Select an option",
        category: "Node",
        options: ["Look", "Etherwarp", "Use Item", "Walk", "Superboom", "Pearl VClip"],
        value: 0
    })
    .addTextInput({
        configName: "itemName",
        title: "Item name to use",
        description: "",
        category: "Node",
        shouldShow: data => data.type === 2
    })
    .addSwitch({
        configName: "stopSneaking",
        title: "Stop sneaking",
        description: "Makes you stop sneaking.",
        category: "Node",
        shouldShow: data => data.type === 0 || data.type === 2
    })
    .addDropDown({
        configName: "etherCoordMode",
        title: "Etherwarp Coordinate Mode",
        description: "RayTrace Scanning may be required for some TPs from extremely certain spots, it is very bad generally though. I recommend trying Calculate Yaw/Pitch and Yaw/Pitch before trying it.",
        category: "Node",
        options: ["RayTrace Scanning", "Yaw/Pitch", "Calculate Yaw/Pitch"],
        value: 0,
        shouldShow: data => data.type === 1
    })
    .addTextInput({
        configName: "yaw",
        title: "Yaw",
        description: "Number between -180 and 180.",
        category: "Node",
        shouldShow: data => data.type === 0 || data.type === 1 && data.etherCoordMode === 1 || data.type === 2 || data.type === 3 || data.type === 4
    })
    .addTextInput({
        configName: "pitch",
        title: "Pitch",
        description: "Number between -180 and 180.",
        category: "Node",
        shouldShow: data => data.type === 0 || data.type === 1 && data.etherCoordMode === 1 || data.type === 2 || data.type === 3 || data.type === 4
    })
    .addTextInput({
        configName: "etherBlock",
        title: "Etherwarp Block Coordinates",
        description: "Seperated by commas.",
        category: "Node",
        shouldShow: data => data.type === 1 && (data.etherCoordMode === 0 || data.etherCoordMode === 2)
    })
    .addSwitch({
        configName: "awaitSecret",
        title: "Await secrets and skulls (such as redstone skull).",
        description: "",
        category: "Node",
        shouldShow: data => !data.awaitBatSpawn || data.type !== 2
    })
    .addSwitch({
        configName: "awaitBatSpawn",
        title: "Await bat spawning",
        description: "",
        category: "Node",
        shouldShow: data => !data.awaitSecret && data.type === 2
    })
    .addTextInput({
        configName: "pearlClipDistance",
        title: "Pearl VClip Distance",
        description: "How many blocks to clip down.",
        category: "Node",
        shouldShow: data => data.type === 6
    })
    .addTextInput({
        configName: "delay",
        title: "Node Delay",
        description: "Time to wait for node to trigger, rounded to the nearest tick.\nIf you are stacking multiple nodes together, each individual node should have a delay of at least 100ms more than the last one. Note this only matters for nodes that use server rotations.",
        category: "Node"
    })


const nodeCreationGUI = new Settings("AutoRoutes", config, "ColorScheme.json")
export default () => nodeCreationGUI.settings

export const nodeTypes = ["look", "etherwarp", "useItem", "walk", "superboom", "pearlclip"]
export const availableArgs = new Map([
    ["look", ["yaw", "pitch", "stopSneaking"]],
    ["etherwarp", ["etherBlock", "etherCoordMode", "yaw", "pitch"]],
    ["useItem", ["yaw", "pitch", "itemName", "stopSneaking", "awaitBatSpawn"]],
    ["walk", ["yaw", "pitch"]],
    ["superboom", ["yaw", "pitch"]],
    ["pearlclip", ["pearlClipDistance"]]
])