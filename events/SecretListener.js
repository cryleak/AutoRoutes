import Async from "../../Async"
import { getDistanceToCoord, getDistanceToEntity } from "../../BloomCore/utils/utils"

const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")


const listeners = []


function addListener(types, successExec, failExec) {
    const listener = {
        listenerTypes: types,
        successExecute: successExec,
    }
    listeners.push(listener)
    Async.schedule(() => {
        const index = listeners.indexOf(listener)
        if (index === -1) return
        listeners.splice(index, 1)
        failExec()
    }, 5000)
}
export default addListener

register("worldUnload", () => {
    while (listeners.length) listeners.pop()
})

register("packetSent", (packet, event) => { // Chest open listener
    const position = new BlockPos(packet.func_179724_a())
    const [x, y, z] = [position.x, position.y, position.z]
    const blockName = World.getBlockAt(x, y, z).type.getRegistryName()
    if (!["minecraft:chest", "minecraft:trapped_chest"].includes(blockName)) return
    for (let i = 0; i < listeners.length; i++) {
        let listener = listeners[i]
        if (listener.types.chest) {
            listeners.splice(i, 1)
            listener.successExecute()
        }
    }
}).setFilteredClass(C08PacketPlayerBlockPlacement)

register("packetSent", (packet, event) => { // Wither essence listener. Detects all skulls but who cares. It shouldn't matter.
    const position = new BlockPos(packet.func_179724_a())
    const [x, y, z] = [position.x, position.y, position.z]
    const blockName = World.getBlockAt(x, y, z).type.getRegistryName()
    if (blockName !== "minecraft:skull") return
    for (let i = 0; i < listeners.length; i++) {
        let listener = listeners[i]
        if (listener.types.essence) {
            listeners.splice(i, 1)
            listener.successExecute()
        }
    }
}).setFilteredClass(C08PacketPlayerBlockPlacement)

register("packetReceived", (packet, event) => { // Bat death listener
    const name = packet.func_149212_c();
    if (name !== "mob.bat.hurt") return

    const soundPos = [packet.func_149207_d(), packet.func_149211_e(), packet.func_149210_f]

    if (getDistanceToCoord(...soundPos, true) > 25) return

    for (let i = 0; i < listeners.length; i++) {
        let listener = listeners[i]
        if (listener.types.bat) {
            listeners.splice(i, 1)
            listener.successExecute()
        }
    }
}).setFilteredClass(net.minecraft.network.play.server.S29PacketSoundEffect)


const drops = ["item.item.monsterPlacer", "item.item.bone", "item.item.skull.char", "item.tile.weightedPlate_heavy", "item.item.enderPearl", "item.item.potion", "item.item.skull.char", "item.item.shears", "item.item.paper", "item.tile.tripWireSource"]
let entitiesLastTick = []

register("tick", () => { // Schizo solution for item pickup listener
    const itemEntities = World.getAllEntitiesOfType(net.minecraft.entity.item.EntityItem)

    for (let entity of entitiesLastTick) {
        if (itemEntities.some(oldEntity => oldEntity.getUUID().toString() === entity.getUUID().toString())) continue

        if (!drops.includes(entity.getName())) continue

        if (getDistanceToEntity(entity) > 6) continue

        for (let i = 0; i < listeners.length; i++) {
            let listener = listeners[i]
            if (listener.types.item) {
                listeners.splice(i, 1)
                listener.successExecute()
            }
        }

    }
    entitiesLastTick = itemEntities
})

register(net.minecraftforge.client.event.MouseEvent, (event) => { // Trigger await secret on left click

    const button = event.button
    const state = event.buttonstate
    if (button !== 0 || !state || !Client.isTabbedIn() || Client.isInGui()) return

    if (listeners.length) cancel(event)
    for (let i = 0; i < listeners.length; i++) {
        let listener = listeners[i]
        listeners.splice(i, 1)
        listener.successExecute()
    }

})