import DefaultConfig from "../Amaterasu/core/DefaultConfig"
import Settings from "../Amaterasu/core/Settings"

const config = new DefaultConfig("AutoRoutes", "settings.json")



config
    .addSwitch({
        configName: "autoRoutesEnabled",
        title: "Toggle AutoRoutes",
        description: "",
        category: "Main",
        subcategory: "AutoRoutes",
        value: false
    })
    .addSwitch({
        configName: "displayIndex",
        title: "Display index of nodes on screen",
        description: "Helpful for deleting and editing nodes.",
        category: "Main",
        subcategory: "AutoRoutes",
        value: false
    })
    .addSwitch({
        configName: "rotateOnServerRotate",
        title: "Rotate",
        description: "Rotates on nodes that use Server Rotations so you can see where it is looking visually. This is only a visual change.",
        category: "Main",
        subcategory: "AutoRoutes",
        value: false
    })
    .addSwitch({
        configName: "renderServerRotation",
        title: "Render Server Rotation",
        description: "Shows you where the player is looking serverside when you go into third person view. Similar to Oringo's feature, but likely worse.",
        category: "Main",
        subcategory: "AutoRoutes",
        value: true
    })
    .addSwitch({
        configName: "debugMessages",
        title: "Debug",
        description: "Prints debug messages in chat. Recomended to use right now while AutoRoutes aren't perfect.",
        category: "Main",
        subcategory: "AutoRoutes",
        value: true
    })
    .addSwitch({
        configName: "zeroPingHype",
        title: "Zero Ping TP",
        description: "Uses ZPH to use zero ping teleport for Instant Transmission and Wither Impact on node-triggered teleports. Requires a modified version of ZPH to work. Make sure the Yaw/Pitch combination in your Use Item node yields an accurate teleport prediction!",
        category: "Main",
        subcategory: "AutoRoutes",
        value: false
    })
    .addDropDown({
        configName: "nodeColorPreset",
        title: "Node Color Preset",
        description: "Select an option",
        category: "Visuals",
        options: ["Trans", "Custom", "Sweden", "Ring"],
        value: 3
    })
    .addColorPicker({
        configName: "etherwarpLineColor",
        title: "Etherwarp Line Color",
        description: "",
        category: "Visuals",
        subcategory: "Node",
        value: [0, 255, 255, 255],
        shouldShow: data => data.nodeColorPreset === 1 || data.nodeColorPreset === 3
    })
    .addColorPicker({
        configName: "nodeColor1",
        title: "Node Color 1",
        description: "",
        category: "Visuals",
        subcategory: "Node",
        value: [0, 255, 255, 255],
        shouldShow: data => data.nodeColorPreset === 1 || data.nodeColorPreset === 3
    })
    .addColorPicker({
        configName: "nodeColor2",
        title: "Node Color 2",
        description: "",
        category: "Visuals",
        subcategory: "Node",
        value: [0, 255, 255, 255],
        shouldShow: data => data.nodeColorPreset === 1
    })
    .addColorPicker({
        configName: "nodeColor3",
        title: "Node Color 3",
        description: "",
        category: "Visuals",
        subcategory: "Node",
        value: [0, 255, 255, 255],
        shouldShow: data => data.nodeColorPreset === 1
    })
    .addColorPicker({
        configName: "nodeColor4",
        title: "Node Color 4",
        description: "",
        category: "Visuals",
        subcategory: "Node",
        value: [0, 255, 255, 255],
        shouldShow: data => data.nodeColorPreset === 1
    })
    .addColorPicker({
        configName: "nodeColor5",
        title: "Node Color 5",
        description: "",
        category: "Visuals",
        subcategory: "Node",
        value: [0, 255, 255, 255],
        shouldShow: data => data.nodeColorPreset === 1
    })
    .addSlider({
        configName: "ringSlices",
        title: "Ring Slices",
        description: "Less looks worse but has better performance.",
        category: "Visuals",
        subcategory: "Node",
        options: [3, 48],
        value: 24,
        shouldShow: data => data.nodeColorPreset === 3
    })

const mySettings = new Settings("AutoRoutes", config, "ColorScheme.json")
export default () => mySettings.settings
