/*

By ITheSerenity
Bomb Denmark

*/

import Settings from "./config"
import "./features/AutoRoutes"
import "./features/ZeroPingEtherwarp"


register("command", (args) => {
    Settings().getConfig().openGui()
}).setName("autoroutes")