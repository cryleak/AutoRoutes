import DefaultConfig from "../Amaterasu/core/DefaultConfig"
import Settings from "../Amaterasu/core/Settings"

const config = new DefaultConfig("AutoRoutes", "NonexistentConfig.json")


config
    .addSwitch({
        configName: "center",
        title: "Center",
        description: "Puts you in the center of the node position before executing the node. This delays execution by 1 tick so only use it when you actually need to, usually the first ring in an etherwarp chain using Yaw/Pitch mode.",
        category: "Ring"
    })
    .addSwitch({
        configName: "stop",
        title: "Stop",
        description: "Stops all movement when you trigger this node.",
        category: "Ring"
    })
    .addTextInput({
        configName: "radius",
        title: "Radius",
        description: "Radius of the ring in blocks.",
        category: "Ring",
        value: "0.7"
    })
    .addTextInput({
        configName: "height",
        title: "Height",
        description: "Height of the ring in blocks.",
        category: "Ring",
        value: "0.1"
    })
    .addDropDown({
        configName: "type",
        title: "Ring type",
        description: "Select an option",
        category: "Ring",
        options: ["Look", "Etherwarp", "Use Item", "Walk", "Superboom", "Pearl VClip"],
        value: 0
    })
    .addTextInput({
        configName: "itemName",
        title: "Item name to use",
        description: "",
        category: "Ring",
        shouldShow: data => data.type === 2
    })
    .addSwitch({
        configName: "stopSneaking",
        title: "Stop sneaking",
        description: "Makes you stop sneaking.",
        category: "Ring",
        shouldShow: data => data.type === 0 || data.type === 2
    })
    .addDropDown({
        configName: "etherCoordMode",
        title: "Etherwarp Coordinate Mode",
        description: "RayTrace Scanning may be required for some TPs from extremely certain spots, it is very bad generally though. I recommend trying Calculate Yaw/Pitch and Yaw/Pitch before trying it.",
        category: "Ring",
        options: ["RayTrace Scanning", "Yaw/Pitch", "Calculate Yaw/Pitch"],
        value: 0,
        shouldShow: data => data.type === 1
    })
    .addTextInput({
        configName: "yaw",
        title: "Yaw",
        description: "Number between -180 and 180.",
        category: "Ring",
        shouldShow: data => data.type === 0 || data.type === 1 && data.etherCoordMode === 1 || data.type === 2 || data.type === 3 || data.type === 4
    })
    .addTextInput({
        configName: "pitch",
        title: "Pitch",
        description: "Number between -180 and 180.",
        category: "Ring",
        shouldShow: data => data.type === 0 || data.type === 1 && data.etherCoordMode === 1 || data.type === 2 || data.type === 3 || data.type === 4
    })
    .addTextInput({
        configName: "etherBlock",
        title: "Etherwarp Block Coordinates",
        description: "Seperated by commas.",
        category: "Ring",
        shouldShow: data => data.type === 1 && (data.etherCoordMode === 0 || data.etherCoordMode === 2)
    })
    .addSwitch({
        configName: "awaitSecret",
        title: "Await secrets and skulls (such as redstone skull).",
        description: "",
        category: "Ring",
        shouldShow: data => !data.awaitBatSpawn || data.type !== 2
    })
    .addSwitch({
        configName: "awaitBatSpawn",
        title: "Await bat spawning",
        description: "",
        category: "Ring",
        shouldShow: data => !data.awaitSecret && data.type === 2
    })
    .addTextInput({
        configName: "pearlClipDistance",
        title: "Pearl VClip Distance",
        description: "How many blocks to clip down.",
        category: "Ring",
        shouldShow: data => data.type === 6
    })
    .addTextInput({
        configName: "delay",
        title: "Ring Delay",
        description: "Time in milliseconds to wait for ring to trigger. This is added on top of await secret if you are using it.\nDelay needs to be at least 100ms for some rings that utilize server rotations to work properly.\nDelay is rounded to the nearest tick.",
        category: "Ring"
    })


const ringCreationGUI = new Settings("AutoRoutes", config, "ColorScheme.json")
export default () => ringCreationGUI.settings

export const ringTypes = ["look", "etherwarp", "useItem", "walk", "superboom", "pearlclip"]
export const availableArgs = new Map([
    ["look", ["yaw", "pitch", "stopSneaking"]],
    ["etherwarp", ["etherBlock", "etherCoordMode", "yaw", "pitch"]],
    ["useItem", ["yaw", "pitch", "itemName", "stopSneaking", "awaitBatSpawn"]],
    ["walk", ["yaw", "pitch"]],
    ["superboom", ["yaw", "pitch"]],
    ["pearlclip", ["pearlClipDistance"]]
])