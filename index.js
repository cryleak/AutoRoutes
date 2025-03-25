/*

By ITheSerenity
Bomb Denmark

*/

import Settings from "./config"
import "./features/AutoRoutes"
import "./features/ZeroPingEtherwarp"
import "./features/AutoTimerBalance"

register("command", () => {
    Settings().getConfig().openGui()
}).setName("autoroutes")

new KeyBind("Gamemode Switcher", Keyboard.KEY_NONE, "AutoRoutes").registerKeyPress(() => {
    if (Server.getIP() !== "localhost" && Server.getIP() !== "127.0.0.1") return
    toggleGameMode()
})

function toggleGameMode() {
    const gamemode = Client.getMinecraft().field_71442_b.func_178889_l().toString()
    ChatLib.command(`gamemode ${gamemode === "CREATIVE" ? "s" : "c"}`)
}