const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
const C05PacketPlayerLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C05PacketPlayerLook")
const C06PacketPlayerPosLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C06PacketPlayerPosLook")


class ServerRotations {
    constructor() {
        this.ignoreNextC06 = false
        this.click = false
        this.lastS08Event = null
        this.registers = []
        this.registers.push(register("packetSent", (packet, event) => {
            if (this.ignoreNextC06 && packet instanceof C06PacketPlayerPosLook) {
                this.ignoreNextC06 = false
                if (!this.lastS08Event.isCancelled()) return
            }
            if (!this.isValidYaw() || Player.getPlayer().field_70154_o) return
            if (this.yaw == packet.func_149462_g() && this.pitch == packet.func_149470_h()) return
            cancel(event)
            this.registers[0].unregister()
            let wasOnGround = packet.func_149465_i()
            ChatLib.chat(this.yaw)
            if (packet instanceof C05PacketPlayerLook) Client.sendPacket(new C05PacketPlayerLook(this.yaw, this.pitch, wasOnGround))
            else Client.sendPacket(new C06PacketPlayerPosLook(Player.getX(), Player.getPlayer().func_174813_aQ().field_72338_b, Player.getZ(), this.yaw, this.pitch, wasOnGround))
            if (this.click) {
                this.click = false
                this.airClick()
                this.registers.forEach(register => register.unregister())
            }
        }).setFilteredClass(C03PacketPlayer).unregister())

        this.registers.push(register("renderEntity", (entity) => {
            if (entity.getEntity() != Player.getPlayer() || !this.isValidYaw() || Player.getPlayer().field_70154_o) return
            Player.getPlayer().field_70761_aq = this.yaw
            Player.getPlayer().field_70759_as = this.yaw
        }).unregister())


        register("packetReceived", (packet, event) => {
            this.ignoreNextC06 = true
            this.lastS08Event = event
        }).setFilteredClass(net.minecraft.network.play.server.S08PacketPlayerPosLook)
    }

    set(y, p) {
        this.yaw = parseFloat(y)
        this.pitch = parseFloat(p)
        this.resetRot = false
        this.registers.forEach(register => register.register())
    }

    clickAt(y, p) {
        this.yaw = parseFloat(y)
        this.pitch = parseFloat(p)
        this.click = true
        this.resetRot = false
        this.registers.forEach(register => register.register())
    }

    airClick() {
        Client.sendPacket(new net.minecraft.network.play.client.C08PacketPlayerBlockPlacement(Player.getInventory().getStackInSlot(Player.getHeldItemIndex()).getItemStack()))
    }

    isValidYaw(yaw, pitch) {
        return (this.yaw || this.yaw === 0) && (this.pitch || this.pitch === 0)
    }

}

export default new ServerRotations()