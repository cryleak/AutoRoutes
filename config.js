import DefaultConfig from "../Amaterasu/core/DefaultConfig"
import Settings from "../Amaterasu/core/Settings"

const config = new DefaultConfig("AutoRoutes", "settings.json")



config
    .addSwitch({
        configName: "autoRoutesEnabled",
        title: "Toggle AutoRoutes",
        description: "",
        category: "Main",
        subcategory: "AutoRoutes"
    })
    .addSwitch({
        configName: "displayIndex",
        title: "Display index of nodes on screen",
        description: "Helpful for deleting and editing nodes.",
        category: "Main",
        subcategory: "AutoRoutes"
    })
    .addSwitch({
        configName: "editMode",
        title: "Edit Mode",
        description: "Prevents nodes from triggering.",
        category: "Main",
        subcategory: "AutoRoutes"
    })
    .addSwitch({
        configName: "rotateOnServerRotate",
        title: "Rotate",
        description: "Rotates on nodes that use Server Rotations so you can see where it is looking visually.",
        category: "Main",
        subcategory: "AutoRoutes"
    })
    .addSwitch({
        configName: "debugMessages",
        title: "Debug",
        description: "Prints debug messages in chat. Recomended to use right now while AutoRoutes aren't perfect.",
        category: "Main",
        subcategory: "AutoRoutes",
        value: true
    })
    .addDropDown({
        configName: "nodeColorPreset",
        title: "Node Color Preset",
        description: "Select an option",
        category: "Visuals",
        options: ["Trans", "Custom", "Sweden", "Denmark", "Ring"],
        value: 0
    })
    .addColorPicker({
        configName: "nodeColor1",
        title: "Node Color 1",
        description: "",
        category: "Visuals",
        subcategory: "Node",
        value: [255, 255, 255, 255],
        shouldShow: data => data.nodeColorPreset === 1 || data.nodeColorPreset === 4
    })
    .addColorPicker({
        configName: "nodeColor2",
        title: "Node Color 2",
        description: "",
        category: "Visuals",
        subcategory: "Node",
        value: [255, 255, 255, 255],
        shouldShow: data => data.nodeColorPreset === 1
    })
    .addColorPicker({
        configName: "nodeColor3",
        title: "Node Color 3",
        description: "",
        category: "Visuals",
        subcategory: "Node",
        value: [255, 255, 255, 255],
        shouldShow: data => data.nodeColorPreset === 1
    })
    .addColorPicker({
        configName: "nodeColor4",
        title: "Node Color 4",
        description: "",
        category: "Visuals",
        subcategory: "Node",
        value: [255, 255, 255, 255],
        shouldShow: data => data.nodeColorPreset === 1
    })
    .addColorPicker({
        configName: "nodeColor5",
        title: "Node Color 5",
        description: "",
        category: "Visuals",
        subcategory: "Node",
        value: [255, 255, 255, 255],
        shouldShow: data => data.nodeColorPreset === 1
    })
    .addSwitch({
        configName: "zpewEnabled",
        title: "Zero Ping Etherwarp Toggle",
        description: "",
        category: "Zero Ping TP",
        value: true
    })
    .addSlider({
        configName: "maxFails",
        title: "Max fails in 20 seconds",
        description: "",
        category: "Zero Ping TP",
        options: [1, 10],
        value: 3
    })
    .addSlider({
        configName: "zpewDelay",
        title: "Tick delay",
        description: "",
        category: "Zero Ping TP",
        options: [0, 50],
        value: 0
    })

const mySettings = new Settings("AutoRoutes", config, "ColorScheme.json")
export default () => mySettings.settings
