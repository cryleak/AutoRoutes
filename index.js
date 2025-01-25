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

const gamemodeKeybind = new KeyBind("Gamemode Switcher", Keyboard.KEY_NONE, "AutoRoutes")

register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, () => {
    if (Server.getIP() !== "localhost") return
    worldLoad.register()
    if (!gamemodeKeybind.isKeyDown() || Client.isInGui() ) return
        toggleGameMode()
})

let gmSwitch = true

function toggleGameMode() {
    if (gmSwitch) {
        ChatLib.command("gamemode s")
        gmSwitch = false
    } else {
        ChatLib.command("gamemode c")
        gmSwitch = true
    }
}

const worldLoad = register("worldLoad", () => {
    ChatLib.command("gamemode c")
    gmSwitch = true
    worldLoad.unregister()
}).unregister()
