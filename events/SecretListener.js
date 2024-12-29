import { getDistanceToCoord, getDistanceToEntity } from "../../BloomCore/utils/utils"
import { movementKeys } from "../utils/RouteUtils"
import { scheduleTask } from "../utils/utils"

const listeners = []

let moveKeyCooldown = Date.now()


function addListener(successExec, failExec, awaitingBatSpawn) {
    const listener = {
        success: successExec,
        fail: failExec,
        awaitingBat: awaitingBatSpawn
    }

    listeners.push(listener)
    moveKeyCooldown = Date.now()
    scheduleTask(100, () => {
        const index = listeners.indexOf(listener)
        if (index === -1) return
        listeners.splice(index, 1)
        failExec("Await timed out!")
    })
}
export default addListener

register("worldUnload", () => {
    while (listeners.length) listeners.pop()
})

register("packetSent", (packet, event) => { // Block click listener
    const position = new BlockPos(packet.func_179724_a())
    const [x, y, z] = [position.x, position.y, position.z]
    const blockName = World.getBlockAt(x, y, z).type.getRegistryName()
    if (!["minecraft:chest", "minecraft:trapped_chest", "minecraft:skull", "minecraft:lever"].includes(blockName)) return
    for (let i = listeners.length - 1; i >= 0; i--) {
        let listener = listeners[i]
        if (listener.awaitingBat) continue
        listeners.splice(i, 1)
        listener.success()
    }
}).setFilteredClass(net.minecraft.network.play.client.C08PacketPlayerBlockPlacement)

register("packetReceived", (packet) => { // Bat death listener
    const name = packet.func_149212_c();
    if (name !== "mob.bat.hurt") return

    const soundPos = [packet.func_149207_d(), packet.func_149211_e(), packet.func_149210_f()]

    if (getDistanceToCoord(...soundPos, true) > 25) return

    for (let i = listeners.length - 1; i >= 0; i--) {
        let listener = listeners[i]
        if (listener.awaitingBat) continue
        listeners.splice(i, 1)
        listener.success()
    }
}).setFilteredClass(net.minecraft.network.play.server.S29PacketSoundEffect)


const drops = ["item.item.monsterPlacer", "item.item.bone", "item.item.skull.char", "item.tile.weightedPlate_heavy", "item.item.enderPearl", "item.item.potion", "item.item.skull.char", "item.item.shears", "item.item.paper", "item.tile.tripWireSource"]

register(Java.type("me.odinmain.events.impl.EntityLeaveWorldEvent"), (event) => { // Item pickup listener
    const entity = event.getEntity()
    if (!(entity instanceof net.minecraft.entity.item.EntityItem)) return
    const wrappedEntity = new Entity(entity)
    const name = wrappedEntity.getName()
    if (!drops.includes(name)) return

    if (getDistanceToEntity(wrappedEntity) > 6) return

    for (let i = listeners.length - 1; i >= 0; i--) {
        let listener = listeners[i]
        if (listener.awaitingBat) continue
        listeners.splice(i, 1)
        listener.success()
    }
})

register("tick", () => { // Wait for bat spawn
    const bats = World.getAllEntitiesOfType(net.minecraft.entity.passive.EntityBat)

    for (let bat of bats) {

        if (getDistanceToEntity(bat) > 15) continue

        for (let i = listeners.length - 1; i >= 0; i--) {
            let listener = listeners[i]
            if (!listener.awaitingBat) continue
            listeners.splice(i, 1)
            listener.success()
        }
        return
    }
})

register(net.minecraftforge.client.event.MouseEvent, (event) => { // Trigger await secret on left click

    const button = event.button
    const state = event.buttonstate
    if (button !== 0 || !state || !Client.isTabbedIn() || Client.isInGui()) return

    if (listeners.length) {
        cancel(event)
        for (let i = listeners.length - 1; i >= 0; i--) {
            let listener = listeners[i]
            listeners.splice(i, 1)
            listener.success()
        }
    } else ChatLib.command("cleartriggerednodes", true)
})

register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, () => {
    if (Date.now() - moveKeyCooldown < 150) return
    if (Client.isInGui() || !World.isLoaded()) return
    if (!Keyboard.getEventKeyState()) return
    const keyCode = Keyboard.getEventKey()
    if (!keyCode) return

    if (!movementKeys.includes(keyCode)) return
    if (!listeners.length) return

    for (let i = listeners.length - 1; i >= 0; i--) {
        let listener = listeners[i]
        listeners.splice(i, 1)
        listener.fail("You moved. All awaits cancelled.")
    }
})