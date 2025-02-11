

// this is literally just skidded from soshimee
import Settings from "../config"
import { isValidEtherwarpBlock, raytraceBlocks } from "../../BloomCore/utils/Utils"



const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");
const C06PacketPlayerPosLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C06PacketPlayerPosLook");
const C0BPacketEntityAction = Java.type("net.minecraft.network.play.client.C0BPacketEntityAction");
const S02PacketChat = Java.type("net.minecraft.network.play.server.S02PacketChat");
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")

const recentFails = []
const playerState = {
    x: null,
    y: null,
    z: null,
    yaw: null,
    pitch: null,
    sneaking: false
};
const sent = [];

let allowAny = false
let inF7Boss = false;
let updatePosition = true;

global.cryleak ??= {}
global.cryleak.autoroutes ??= {}
global.cryleak.autoroutes.performAnyTeleport ??= () => allowAny = true


register("packetSent", (packet, event) => {
    if (packet.func_149568_f() !== 255) return
    const info = getTeleportInfo(Player.getHeldItem());
    if (!info) return;
    while (recentFails.length && Date.now() - recentFails[0] > 20 * 1000) recentFails.shift()
    if (recentFails.length >= Settings().maxFails && !Settings().singleplayer) return ChatLib.chat(`§c Zero Ping TP cancelled. ${recentFails.length} fails last 20 seconds.`)
    if (sent.length >= 5 && !Settings().singleplayer) return ChatLib.chat(`§c Zero Ping TP cancelled. ${sent.length} packets queued.`)

    if (Object.values(playerState).includes(null)) return;

    let prediction;
    if (info.ether) {
        prediction = raytraceBlocks([playerState.x, playerState.y + 1.5399999618530273, playerState.z], Vector3.fromPitchYaw(playerState.pitch, playerState.yaw), info.distance, isValidEtherwarpBlock, true, true);

        if (prediction) {
            prediction[0] += 0.5;
            prediction[1] += 1.05;
            prediction[2] += 0.5;
        }
    } else {
        prediction = predictTeleport(info.distance, playerState.x, playerState.y, playerState.z, playerState.yaw, playerState.pitch);
    }
    if (!prediction) return

    const [x, y, z] = prediction;
    const yaw = info.ether ? (playerState.yaw % 360 + 360) % 360 : playerState.yaw % 360; // wtf hypixel
    const pitch = playerState.pitch;

    playerState.x = x;
    playerState.y = y;
    playerState.z = z;
    updatePosition = false;

    sent.push({ x, y, z, yaw, pitch });



    Client.scheduleTask(0, () => {
        Client.sendPacket(new C06PacketPlayerPosLook(x, y, z, yaw, pitch, Player.asPlayerMP().isOnGround()))
        Player.getPlayer().func_70107_b(x, y, z)
        Player.getPlayer().func_70016_h(0, 0, 0)
        updatePosition = true;

        /*
        if (!Settings().fixStairs) return
        const blockState = World.getBlockAt(Math.floor(x), Math.floor(y - 1), Math.floor(z)).getState()
        const block = blockState.func_177230_c()
        let halfValue
        if (block instanceof net.minecraft.block.BlockStairs) halfValue = blockState.func_177229_b(block.field_176308_b)
        else if (block instanceof net.minecraft.block.BlockSlab) halfValue = blockState.func_177229_b(block.field_176554_a)
        else return
        if (halfValue.toString() !== "bottom") return
        Object.values(keybinds).forEach(keybind => KeyBinding.func_74510_a(keybind, false))
        setTimeout(() => Object.values(keybinds).forEach(keybind => KeyBinding.func_74510_a(keybind, KeyBoard.isKeyDown(keybind))), 60)
        */
    })
}).setFilteredClass(C08PacketPlayerBlockPlacement)

const isWithinTolerence = (n1, n2) => Math.abs(n1 - n2) < 1e-4;

register("packetReceived", (packet, event) => {
    if (!sent.length) return;

    const { pitch, yaw, x, y, z } = sent.shift();

    const newPitch = packet.func_148930_g();
    const newYaw = packet.func_148931_f();
    const newX = packet.func_148932_c();
    const newY = packet.func_148928_d();
    const newZ = packet.func_148933_e();

    const lastPresetPacketComparison = {
        x: x == newX,
        y: y == newY,
        z: z == newZ,
        yaw: isWithinTolerence(yaw, newYaw) || newYaw == 0,
        pitch: isWithinTolerence(pitch, newPitch) || newPitch == 0
    };

    const wasPredictionCorrect = Object.values(lastPresetPacketComparison).every(a => a);

    if (wasPredictionCorrect) return cancel(event);
    else {
        recentFails.push(Date.now())
        while (recentFails.length && Date.now() - recentFails[0] > 20 * 1000) recentFails.shift()
        ChatLib.chat(`§4Zero ping tp failed! ${recentFails.length} fails last 20 seconds`)
    }

    while (sent.length) sent.shift();
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
    let allowAllTPMethods = allowAny === true
    allowAny = false
    if (!Settings().singleplayer) {
        const sbId = item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.id;
        if (["ASPECT_OF_THE_VOID", "ASPECT_OF_THE_END"].includes(sbId)) {
            const tuners = item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.tuned_transmission || 0;
            if (playerState.sneaking) {
                if (!Settings().ether && !allowAllTPMethods) return;
                return {
                    distance: 56 + tuners,
                    ether: true
                };
            } else {
                if (!Settings().aotv && !allowAllTPMethods) return;
                return {
                    distance: 8 + tuners,
                    ether: false
                };
            }
        } else if (["NECRON_BLADE", "HYPERION", "VALKYRIE", "ASTRAEA", "SCYLLA"].includes(sbId)) {
            if (!Settings().hype && !allowAllTPMethods) return;
            if (!["IMPLOSION_SCROLL", "WITHER_SHIELD_SCROLL", "SHADOW_WARP_SCROLL"].every(value => item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.ability_scroll?.includes(value))) return;
            return {
                distance: 10,
                ether: false
            };
        }
    } else {
        if (Player?.getHeldItem()?.getID() === 277) {
            if (playerState.sneaking) {
                if (!Settings().ether && !allowAllTPMethods) return;
                return {
                    distance: 61,
                    ether: true
                };
            } else {
                if (!Settings().aotv && !allowAllTPMethods) return;
                return {
                    distance: 12,
                    ether: false
                }
            }
        } else if (Player?.getHeldItem()?.getID() === 267) {
            if (!Settings().hype && !allowAllTPMethods) return;
            return {
                distance: 10,
                ether: false
            };
        }
        return
    }
}

// nigger
import Vector3 from "../../BloomCore/utils/Vector3";

const Vec3 = Java.type("net.minecraft.util.Vec3");

const IGNORED = [0, 51, 8, 9, 10, 11, 171, 331, 39, 40, 115, 132, 77, 143, 66, 27, 28, 157];
const IGNORED2 = [44, 182, 126]; // ignored blocks for selbox raycast
const SPECIAL = [65, 106, 111]; // blocks for exclusive selbox raycast

const steps = 100;

function predictTeleport(distance, x, y, z, yaw, pitch) {
    const forward = Vector3.fromPitchYaw(pitch, yaw).multiply(1 / steps);
    const cur = new Vector3(x, y + Player.getPlayer().func_70047_e(), z);
    let i = 0;
    for (; i < distance * steps; ++i) {
        if (i % steps === 0 && !isSpecial(cur.getX(), cur.getY(), cur.getZ()) && !isSpecial(cur.getX(), cur.getY() + 1, cur.getZ())) {
            if (!isIgnored(cur.getX(), cur.getY(), cur.getZ()) || !isIgnored(cur.getX(), cur.getY() + 1, cur.getZ())) {
                cur.add(forward.multiply(-steps));
                if (i === 0 || !isIgnored(cur.getX(), cur.getY(), cur.getZ()) || !isIgnored(cur.getX(), cur.getY() + 1, cur.getZ())) return false;
                return [Math.floor(cur.getX()) + 0.5, Math.floor(cur.getY()), Math.floor(cur.getZ()) + 0.5];
            }
        }
        if ((!isIgnored2(cur.getX(), cur.getY(), cur.getZ()) && inBB(cur.getX(), cur.getY(), cur.getZ())) || (!isIgnored2(cur.getX(), cur.getY() + 1, cur.getZ()) && inBB(cur.getX(), cur.getY() + 1, cur.getZ()))) {
            cur.add(forward.multiply(-steps));
            if (i === 0 || (!isIgnored(cur.getX(), cur.getY(), cur.getZ()) && inBB(cur.getX(), cur.getY(), cur.getZ())) || (!isIgnored(cur.getX(), cur.getY() + 1, cur.getZ()) && inBB(cur.getX(), cur.getY() + 1, cur.getZ()))) return false;
            break;
        }
        cur.add(forward);
    }
    const pos = new Vector3(x, y + Player.getPlayer().func_70047_e(), z).add(Vector3.fromPitchYaw(pitch, yaw).multiply(Math.floor(i / steps)));
    if ((!isIgnored(cur.getX(), cur.getY(), cur.getZ()) && inBB(cur.getX(), cur.getY(), cur.getZ())) || (!isIgnored(cur.getX(), cur.getY() + 1, cur.getZ()) && inBB(cur.getX(), cur.getY() + 1, cur.getZ()))) return false;
    return [Math.floor(pos.getX()) + 0.5, Math.floor(pos.getY()), Math.floor(pos.getZ()) + 0.5];
}

function isIgnored(x, y, z) {
    return IGNORED.includes(World.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z)).type.getID());
}

function isIgnored2(x, y, z) {
    return isIgnored(x, y, z) || IGNORED2.includes(World.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z)).type.getID());
}

function isSpecial(x, y, z) {
    return SPECIAL.includes(World.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z)).type.getID());
}

function inBB(x, y, z) {
    // if (!isSpecial(x, y, z)) return true;
    const block = World.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z));
    const mcBlock = block.type.mcBlock;
    const bb = mcBlock.func_180646_a(World.getWorld(), block.pos.toMCBlock());
    const vec = new Vec3(x, y, z);
    return bb.func_72318_a(vec);
}