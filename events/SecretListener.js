import Async from "../../Async"



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
    }, 2000)
}
export default addListener

const chestListener = register("packetSent", (packet, event) => {
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
}).setFilteredClass(net.minecraft.network.play.client.C08PacketPlayerBlockPlacement)

const essenceListener = register("packetSent", (packet, event) => {
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
}).setFilteredClass(net.minecraft.network.play.client.C08PacketPlayerBlockPlacement)

register(net.minecraftforge.client.event.MouseEvent, (event) => { // Trigger await secret on left click

    const button = event.button
    const state = event.buttonstate
    if (button !== 0 || !state || !Client.isTabbedIn() || Client.isInGui()) return

    for (let i = 0; i < listeners.length; i++) {
        let listener = listeners[i]
        listeners.splice(i, 1)
        listener.successExecute()
    }

})