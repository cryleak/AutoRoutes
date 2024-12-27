/*

By ITheSerenity
Bomb Denmark

*/

import Settings from "./config"
import "./Features/AutoRoutes"


register("command", () => {
    Settings().getConfig().openGui()
}).setName("autoroutes")