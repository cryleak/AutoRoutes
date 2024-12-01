import DefaultConfig from "../Amaterasu/core/DefaultConfig"
import Settings from "../Amaterasu/core/Settings"

const config = new DefaultConfig("AutoRoutes", "NonexistentConfig.json")


config
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
        options: ["Look", "Etherwarp", "AOTV", "Hyperion", "Walk", "Finish Route", "Superboom", "Pearl VClip"],
        value: 0
    })
    .addDropDown({
        configName: "etherCoordMode",
        title: "Etherwarp Coordinate Mode",
        description: "Yaw/Pitch may be required for some TPs from specific spots.",
        category: "Ring",
        options: ["Coordinate", "Yaw/Pitch"],
        value: 0,
        shouldShow: data => data.type === 1
    })
    .addTextInput({
        configName: "yaw",
        title: "Yaw",
        description: "Number between -180 and 180.",
        category: "Ring",
        shouldShow: data => data.type === 0 || data.type === 2 || data.type === 3 || data.type === 4 || data.type === 5 || data.type === 6 || data.etherCoordMode === 1 && data.type === 1
    })
    .addTextInput({
        configName: "pitch",
        title: "Pitch",
        description: "Number between -180 and 180.",
        category: "Ring",
        shouldShow: data => data.type === 0 || data.type === 2 || data.type === 3 || data.type === 4 || data.type === 5 || data.type === 6 || data.etherCoordMode === 1 && data.type === 1
    })
    .addTextInput({
        configName: "etherBlock",
        title: "Etherwarp Block Coordinates",
        description: "Seperated by commas.",
        category: "Ring",
        shouldShow: data => data.type === 1 && data.etherCoordMode === 0
    })
    .addMultiCheckbox({
        configName: "awaitSecretTypes",
        title: "Types of secrets to await. Uncheck all to disable.",
        description: "",
        category: "Ring",
        options: [
            {
                title: "Bat",
                configName: "awaitSecretBat",
            },
            {
                title: "Chest",
                configName: "awaitSecretChest",
            },
            {
                title: "Essence",
                configName: "awaitSecretEssence",
            },
            {
                title: "Item",
                configName: "awaitSecretItem",
            }
        ],
    })
    .addTextInput({
        configName: "delay",
        title: "Ring Delay",
        description: "Time in milliseconds to wait for ring to trigger. This is added on top of await secret if you are using it.",
        category: "Ring"
    })
    .addTextInput({
        configName: "pearlClipDistance",
        title: "Pearl VClip Distance",
        description: "How many blocks to clip down.",
        category: "Ring",
        shouldShow: data => data.type === 5
    })


const ringCreationGUI = new Settings("AutoRoutes", config, "ColorScheme.json")
export default () => ringCreationGUI.settings