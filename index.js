/*

By ITheSerenity
Bomb Denmark

*/

import Settings from "./config"
import "./features/AutoRoutes"


register("command", () => {
    Settings().getConfig().openGui()
}).setName("autoroutes")