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
        title: "Display index of rings on screen",
        description: "Helpful for deleting and editing rings.",
        category: "Main",
        subcategory: "AutoRoutes"
    })

const mySettings = new Settings("AutoRoutes", config, "ColorScheme.json")
export default () => mySettings.settings
