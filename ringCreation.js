import DefaultConfig from "../Amaterasu/core/DefaultConfig"
import Settings from "../Amaterasu/core/Settings"

const config = new DefaultConfig("AutoRoutes", "NonexistentConfig.json")

export const configNames = [
    "radius",
    "height",
    "type",
    "yaw",
    "pitch",
    "etherBlock",
    "awaitSecretBat",
    "awaitSecretChest",
    "awaitSecretEssence",
    "awaitSecretItem",
    "delay"
]


config
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
        options: ["Look", "Etherwarp", "Walk", "Finish Route"],
        value: 0
    })
    .addTextInput({
        configName: "yaw",
        title: "Yaw",
        description: "Number between -180 and 180.",
        category: "Ring",
        shouldShow: data => data.type === 0 || data.type === 2 || data.type === 3
    })
    .addTextInput({
        configName: "pitch",
        title: "Pitch",
        description: "Number between -180 and 180.",
        category: "Ring",
        shouldShow: data => data.type === 0 || data.type === 2 || data.type === 3
    })
    .addTextInput({
        configName: "etherBlock",
        title: "Etherwarp Block Coordinates",
        description: "Seperated by commas.",
        category: "Ring",
        shouldShow: data => data.type === 1
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
                configName: "awaitSecretEssence"
            },
            {
                title: "Item",
                configName: "awaitSecretItem"
            }
        ],
    })
    .addTextInput({
        configName: "delay",
        title: "Ring Delay",
        description: "Time in milliseconds to wait for ring to trigger. This is added on top of await secret if you are using it.",
        category: "Ring"
    })


const ringCreationGUI = new Settings("AutoRoutes", config, "ColorScheme.json")
export default () => ringCreationGUI.settings
