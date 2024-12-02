import { sendAirClick, rotate, debugMessage } from "./utils"
import Settings from "../config"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
const C05PacketPlayerLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C05PacketPlayerLook")
const C06PacketPlayerPosLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C06PacketPlayerPosLook")
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook")

let lastTP = Date.now()
let yaw = 0
let pitch = 0
let clicking = false
let rotating = false
let ignoreNextC06 = false
let ignoreNextC06NoS08 = false
let lastS08Event
let sending = false
let ticksPassed = 0
let tickDelay = 0

register("packetSent", (packet, event) => {
    const simpleName = packet.class.getSimpleName()
    if (simpleName === "C06PacketPlayerPosLook" && (ignoreNextC06 || ignoreNextC06NoS08)) {
        ignoreNextC06 = false
        if (!lastS08Event?.isCancelled() || ignoreNextC06NoS08) {
            ignoreNextC06NoS08 = false
            return
        }
    }
    if (sending || !rotating) return

    cancel(event)
    const wasOnGround = packet.func_149465_i()


    sending = true
    if (simpleName === "C05PacketPlayerLook") Client.sendPacket(new C05PacketPlayerLook(yaw, pitch, wasOnGround))
    else Client.sendPacket(new C06PacketPlayerPosLook(Player.getX(), Player.getPlayer().func_174813_aQ().field_72338_b, Player.getZ(), yaw, pitch, wasOnGround))
    sending = false

    ticksPassed++
    if (ticksPassed < tickDelay) return
    if (clicking) {
        airClick()
        yaw = Player.getYaw()
        pitch = Player.getPitch()
    } else rotating = false
}).setFilteredClass(C03PacketPlayer)

register("packetReceived", (packet, event) => {
    ignoreNextC06 = true
    lastS08Event = event
}).setFilteredClass(S08PacketPlayerPosLook)

export const clickAt = (y, p, ticksToWait = 0) => {
    yaw = parseFloat(y)
    pitch = parseFloat(p)
    if (!yaw && yaw !== 0 || !pitch && pitch !== 0) return chat("Invalid rotation! How is this possible?")

    rotating = true
    clicking = true
    ticksPassed = 0
    tickDelay = ticksToWait
}

export const ignoreNextC06Packet = () => {
    ignoreNextC06NoS08 = true
}

const airClick = () => {
    debugMessage(`Time between this TP and last: ${Date.now() - lastTP}ms`); lastTP = Date.now()
    clicking = false
    sendAirClick()
}