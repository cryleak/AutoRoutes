/*

By ITheSerenity
Bomb Denmark

*/

import Settings from "./config"
import "./features/AutoRoutes"


register("command", (args) => {
    Settings().getConfig().openGui()
}).setName("autoroutes")