/// <reference types="../CTAutocomplete" />

import Settings from "../config";
import { C08PacketPlayerBlockPlacement, isValidEtherwarpBlock, MCBlockPos, raytraceBlocks, getEtherwarpBlock, getEtherwarpBlockSuccess } from "../../BloomCore/utils/Utils"
import Vector3 from "../../BloomCore/utils/Vector3";
import { ignoreNextC06Packet } from "../utils/ServerRotations"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");
const C06PacketPlayerPosLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C06PacketPlayerPosLook");
const C0BPacketEntityAction = Java.type("net.minecraft.network.play.client.C0BPacketEntityAction");
const S02PacketChat = Java.type("net.minecraft.network.play.server.S02PacketChat");

let inF7Boss = false;
const playerState = {
    x: null,
    y: null,
    z: null,
    yaw: null,
    pitch: null,
    sneaking: false
};
const sent = [];
let updatePosition = true;
const recentlySent = []
const recentFails = []

register("packetSent", (packet) => {
    if (!Settings().zpewEnabled) return
    if (packet?.func_149568_f() !== 255) return
    ether()
}).setFilteredClass(net.minecraft.network.play.client.C08PacketPlayerBlockPlacement)

const ether = () => {
    const blockID = Player.lookingAt()?.getType()?.getID();
    if (blockID === 54 || blockID === 146 || blockID === 154) return;
    const info = getTeleportInfo(Player.getHeldItem());
    if (!info) return;

    if (Object.values(playerState).includes(null)) return;

    while (recentFails.length && Date.now() - recentFails[0] > 20 * 1000) recentFails.shift()
    if (recentFails.length >= Settings().maxFails) return ChatLib.chat(`§cZero Ping TP cancelled. ${recentFails.length} fails last 20 seconds.`)
    if (sent.length >= 5) return ChatLib.chat(`§cZero Ping TP cancelled. ${sent.length} packets queued.`)

    let prediction;
    // prediction = raytraceBlocks([playerState.x, playerState.y + Player.getPlayer().func_70047_e(), playerState.z], Vector3.fromPitchYaw(playerState.pitch, playerState.yaw), info.distance, isValidEtherwarpBlock, true, true);
    // prediction = getEtherwarpBlock(true, parseInt(info.distance))
    const [success, block] = getEtherwarpBlockSuccess(true, parseInt(info.distance))
    if (!success) return
    prediction = block
    if (prediction) {
        prediction[0] += 0.5;
        prediction[1] += 1.05;
        prediction[2] += 0.5;
    }
    if (!prediction) return;

    const [x, y, z] = prediction;
    const yaw = (playerState.yaw % 360 + 360) % 360
    const pitch = playerState.pitch;

    playerState.x = x;
    playerState.y = y;
    playerState.z = z;

    sent.push({ x, y, z, yaw, pitch });
    recentlySent.push({ x, y, z, yaw, pitch, sentAt: Date.now() })

    const exec = () => {
        ignoreNextC06Packet()
        Client.sendPacket(new C06PacketPlayerPosLook(x, y, z, yaw, pitch, Player.asPlayerMP().isOnGround()));
        Player.getPlayer().func_70107_b(x, y, z);
        Player.getPlayer().func_70016_h(0, 0, 0);
        updatePosition = true;
    }
    Client.scheduleTask(Settings().zpewDelay, exec)
}

const isWithinTolerence = (n1, n2) => Math.abs(n1 - n2) < 1e-4;

register("packetReceived", (packet, event) => {
    if (!sent.length) return;

    recentlySent.shift()

    const newPitch = packet.func_148930_g();
    const newYaw = packet.func_148931_f();
    const newX = packet.func_148932_c();
    const newY = packet.func_148928_d();
    const newZ = packet.func_148933_e();

    let wasPredictionCorrect = false
    sent.forEach((packet, index) => { // Object.some didnt work for some reason acutally it probably worked but im schizo so i did this for some reason
        let lastPresetPacketComparison = {
            x: packet.x == newX,
            y: packet.y == newY,
            z: packet.z == newZ,
            yaw: isWithinTolerence(packet.yaw, newYaw) || newYaw == 0,
            pitch: isWithinTolerence(packet.pitch, newPitch) || newPitch == 0
        }
        if (Object.values(lastPresetPacketComparison).every(a => a)) {
            sent.splice(index, 1)
            wasPredictionCorrect = true
        }
    })

    if (wasPredictionCorrect) return cancel(event);

    while (sent.length) sent.shift()
    recentFails.push(Date.now())
    while (recentFails.length && Date.now() - recentFails[0] > 20 * 1000) recentFails.shift()
    ChatLib.chat(`§4Zero ping tp failed! ${recentFails.length} fails last 20 seconds`)

    while (recentlySent.length) recentlySent.shift()
}).setFilteredClass(S08PacketPlayerPosLook);

register("packetSent", packet => {
    if (!updatePosition) return;
    const x = packet.func_149464_c();
    const y = packet.func_149467_d();
    const z = packet.func_149472_e();
    const yaw = packet.func_149462_g();
    const pitch = packet.func_149470_h();
    if (packet.func_149466_j()) {
        playerState.x = x;
        playerState.y = y;
        playerState.z = z;
    }
    if (packet.func_149463_k()) {
        playerState.yaw = yaw;
        playerState.pitch = pitch;
    }
}).setFilteredClass(C03PacketPlayer);

register("packetSent", packet => {
    const action = packet.func_180764_b();
    if (action == C0BPacketEntityAction.Action.START_SNEAKING) playerState.sneaking = true;
    if (action == C0BPacketEntityAction.Action.STOP_SNEAKING) playerState.sneaking = false;
}).setFilteredClass(C0BPacketEntityAction);

register("packetReceived", packet => {
    const message = ChatLib.removeFormatting(packet.func_148915_c().func_150260_c());
    if (["[BOSS] Maxor:", "[BOSS] Storm:", "[BOSS] Goldor:", "[BOSS] Necron:"].some(bossname => message.startsWith(bossname))) inF7Boss = true;
}).setFilteredClass(S02PacketChat);

register("worldUnload", () => {
    inF7Boss = false;
});

function getTeleportInfo(item) {
    if (!Settings().zpewEnabled) return;
    if (inF7Boss) return;
    const sbId = item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.id;
    if (!["ASPECT_OF_THE_VOID", "ASPECT_OF_THE_END"].includes(sbId)) return

    const tuners = item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.tuned_transmission || 0;
    if (!playerState.sneaking) return
    return {
        distance: 56 + tuners,
        ether: true
    };
}