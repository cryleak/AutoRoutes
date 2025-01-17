import Settings from "../config"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
const lastPacketState = {
    pos: { x: null, y: null, z: null },
    onGround: null,
    rotation: { yaw: null, pitch: null }
}
let awaitingMotionUpdate = false


register("packetSent", (packet, event) => {
    if (!awaitingMotionUpdate) return
    awaitingMotionUpdate = false
    if (!Settings().autoTimerBalance) return

    let cancelPacket = true

    const onGround = packet.func_149465_i()
    if (onGround !== lastPacketState.onGround) cancelPacket = false
    lastPacketState.onGround = onGround
    if (packet.func_149463_k()) { // If rotating
        const [yaw, pitch] = [packet.func_149462_g(), packet.func_149470_h()]
        if (lastPacketState.rotation.yaw !== yaw || lastPacketState.rotation.pitch !== pitch) cancelPacket = false
        lastPacketState.rotation.yaw = yaw
        lastPacketState.rotation.pitch = pitch
    }
    if (packet.func_149466_j()) {// If moving
        const currentPosition = { x: packet.func_149464_c(), y: packet.func_149467_d(), z: packet.func_149472_e() }
        if (Object.values(currentPosition).some((coord, index) => coord !== Object.values(lastPacketState.pos)[index])) cancelPacket = false
        lastPacketState.pos.x = currentPosition.x
        lastPacketState.pos.y = currentPosition.y
        lastPacketState.pos.z = currentPosition.z
    }

    if (!cancelPacket) return
    cancel(event)
}).setFilteredClass(C03PacketPlayer)

register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => {
    if (event.entity !== Player.getPlayer()) return
    awaitingMotionUpdate = true
})