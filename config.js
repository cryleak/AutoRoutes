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

const mySettings = new Settings("AutoRoutes", config, "ColorScheme.json")
export default () => mySettings.settings
