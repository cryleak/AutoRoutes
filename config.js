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
        configName: "renderNodes",
        title: "Render AutoRoutes",
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
        configName: "disableOnMimic",
        title: "Disable AutoRoutes on trapped chest click",
        description: "Automatically disables AutoRoutes when you click a trapped chest. This is because a trapped chest is probably a mimic chest.",
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
        configName: "autoTimerBalance",
        title: "Automatically cancel movement packets while standing still",
        description: "Cancels movement packets that do nothing in order to give negative timer balance and reduce the risk of getting banned significantly. May interfere with some mods but I don't know which, if any?",
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
    .addSwitch({
        configName: "zeroPingHype",
        title: "Zero Ping TP On All Items",
        description: "Uses ZPH to use zero ping teleport for Instant Transmission and Wither Impact on node-triggered teleports. You must toggle Zero Ping TP in AutoRoutes to make it work. Disable other zpews if you have any.",
        category: "Zero Ping TP",
        value: false
    })
    .addSwitch({
        configName: "zpewEnabled",
        title: "Toggle",
        description: "",
        category: "Zero Ping TP",
    })
    .addSwitch({
        configName: "singleplayer",
        title: "Singleplayer mode",
        description: "Detects Iron Sword and Diamond Shovel as teleport items. This mode also disables all failsafes so disable it before you log on Hypixel probably",
        category: "Zero Ping TP",
        shouldShow: data => data.zpewEnabled
    })
    .addSlider({
        configName: "maxFails",
        title: "Max fails in last 20 seconds",
        description: "Note that you will probably get banned regardless of if you fail 1000 times in 20 minutes or 1 minute (on the same server) due to how timer balance works. You can try using the option to cancel movement packets in this mod.",
        category: "Zero Ping TP",
        options: [3, 20],
        value: 3,
        shouldShow: data => data.zpewEnabled
    })
    .addSwitch({
        configName: "aotv",
        title: "Toggle Instant Transmission",
        description: "This will still trigger if you enable Zero Ping TP On All Items",
        category: "Zero Ping TP",
        shouldShow: data => data.zpewEnabled
    })
    .addSwitch({
        configName: "ether",
        title: "Toggle Etherwarp",
        description: "This will still trigger if you enable Zero Ping TP On All Items",
        category: "Zero Ping TP",
        shouldShow: data => data.zpewEnabled
    })
    .addSwitch({
        configName: "hype",
        title: "Toggle Hyperion",
        description: "This will still trigger if you enable Zero Ping TP On All Items",
        category: "Zero Ping TP",
        shouldShow: data => data.zpewEnabled
    })

const mySettings = new Settings("AutoRoutes", config, "ColorScheme.json")
export default () => mySettings.settings
