/*

By ITheSerenity
Bomb Denmark

*/

import Settings from "./config"
import "./features/AutoRoutes"
import "./features/ZeroPingEtherwarp"


register("command", () => {
    Settings().getConfig().openGui()
}).setName("autoroutes")