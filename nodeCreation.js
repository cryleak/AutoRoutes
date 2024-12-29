import DefaultConfig from "../Amaterasu/core/DefaultConfig"
import Settings from "../Amaterasu/core/Settings"

const config = new DefaultConfig("AutoRoutes", "NonexistentConfig.json")


config
    .addSwitch({
        configName: "center",
        title: "Center",
        description: "Puts you right in the center of where the NODE is located. Note that this also modifies your Y level, so it may not work and just lagback if your node is extremely tall. Useful to align yourself if you aren't starting in the middle of the block.",
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
        options: ["Look", "Etherwarp", "Use Item", "Walk", "Superboom", "Pearl VClip", "Command"],
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
        description: "Makes you stop sneaking before executing the node.",
        category: "Node",
        shouldShow: data => data.type === 2
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
        description: "Number between -90 and 90.",
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
        title: "Await secret pickup, skull or lever click",
        description: "",
        category: "Node",
        shouldShow: data => !data.awaitBatSpawn || data.type !== 2
    })
    .addSwitch({
        configName: "awaitBatSpawn",
        title: "Await bat spawning",
        description: "Waits for a bat to spawn within 15 blocks of you. Used so you can kill it after it spawns or something idk",
        category: "Node",
        shouldShow: data => !data.awaitSecret && data.type === 2
    })
    .addTextInput({
        configName: "pearlClipDistance",
        title: "Pearl VClip Distance",
        description: "How many blocks to clip down. If this is set to 0 it will attempt to scan for an air opening below you, however note this may be inaccurate or put you in the fucking void",
        category: "Node",
        shouldShow: data => data.type === 5
    })
    .addTextInput({
        configName: "commandArgs",
        title: "Command",
        description: "Make sure to omit the first backslash.",
        category: "Node",
        shouldShow: data => data.type === 6
    })
    .addSwitch({
        configName: "runClientSide",
        title: "Run Clientside",
        description: "",
        category: "Node",
        shouldShow: data => data.type === 6
    })
    .addTextInput({
        configName: "delay",
        title: "Node Delay",
        description: "If you are stacking multiple nodes together to perform multiple actions (e.g throwing 2 pearls), each individual node should have a delay of at least 200ms more than the last one to work properly. This only matters for nodes that use server rotations.",
        category: "Node"
    })


const nodeCreationGUI = new Settings("AutoRoutes", config, "ColorScheme.json")
export default () => nodeCreationGUI.settings

export const nodeTypes = ["look", "etherwarp", "useItem", "walk", "superboom", "pearlclip", "command"]
export const availableArgs = new Map([
    ["look", ["yaw", "pitch"]],
    ["etherwarp", ["etherBlock", "etherCoordMode", "yaw", "pitch"]],
    ["useItem", ["yaw", "pitch", "itemName", "stopSneaking", "awaitBatSpawn"]],
    ["walk", ["yaw", "pitch"]],
    ["superboom", ["yaw", "pitch"]],
    ["pearlclip", ["pearlClipDistance"]],
    ["command", ["commandArgs", "runClientSide"]]
])