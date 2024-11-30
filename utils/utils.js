
// Thank you gekke (why do i need to put INSTANCE in the java class name)

import Vector3 from '../../BloomCore/utils/Vector3.js';

const dungeonUtils = Java.type("me.odinmain.utils.skyblock.dungeon.DungeonUtils")
const renderManager = Client.getMinecraft().func_175598_ae()

export const ringTypes = ["look", "etherwarp", "walk", "finish"]
export const availableArgs = new Map([
    ["look", ["yaw", "pitch"]],
    ["etherwarp", ["etherBlock"]],
    ["walk", ["yaw", "pitch"]],
    ["finish", []]
])
const rotationNumber = new Map([
    ["NORTH", 0],
    ["WEST", -1],
    ["SOUTH", 2],
    ["EAST", 1]
])


export const convertToRelative = (realCoord) => {
    const currRoom = dungeonUtils.INSTANCE.currentRoom;
    const roomRotation = currRoom.rotation;
    const clayCoord = extractCoord(currRoom.clayPos.toString());

    const inputVec = new Vector3(...realCoord);
    const clayVec = new Vector3(clayCoord[0], 0, clayCoord[2]);

    const relativeCoord = inputVec.copy().subtract(clayVec)
    const relativeCoordNorth = rotateToNorth(relativeCoord, roomRotation)

    return [relativeCoordNorth.getX(), relativeCoordNorth.getY(), relativeCoordNorth.getZ()]
}

export const convertFromRelative = (relativeCoord) => {
    const currRoom = dungeonUtils.INSTANCE.currentRoom;
    const roomRotation = currRoom.rotation;
    const clayCoord = extractCoord(currRoom.clayPos.toString());

    const inputVec = new Vector3(...relativeCoord)
    const relativeRotated = rotateFromNorth(inputVec, roomRotation)

    const clayVec = new Vector3(clayCoord[0], 0, clayCoord[2]);

    const realCoord = clayVec.copy().add(relativeRotated.copy())
    return [realCoord.getX(), realCoord.getY(), realCoord.getZ()]
}

export const convertToRealYaw = (yaw) => {
    const currRoom = dungeonUtils.INSTANCE.currentRoom;
    const roomRotation = currRoom.rotation;
    return parseFloat(yaw) + (parseFloat(rotationNumber.get(roomRotation.toString())) * 90)
}

export const convertToRelativeYaw = (yaw) => {
    const currRoom = dungeonUtils.INSTANCE.currentRoom;
    const roomRotation = currRoom.rotation;
    return parseFloat(yaw) - (parseFloat(rotationNumber.get(roomRotation.toString())) * 90)
}


export const getRoomName = () => {
    return dungeonUtils.INSTANCE.currentRoomName
}

const rotateToNorth = (vector, currentRotation) => {
    let output = vector.copy();
    switch (currentRotation.toString()) {
        case "NORTH": output = vector; break;
        case "WEST": output = vector.rotate(90); break;
        case "SOUTH": output = vector.rotate(180); break;
        case "EAST": output = vector.rotate(270); break;
        default: console.log(currentRotation)
    }
    return output;
}

const rotateFromNorth = (vector, desiredRotation) => {
    let output = vector.copy();
    switch (desiredRotation.toString()) {
        case "NORTH": output = vector; break;
        case "WEST": output = vector.rotate(270); break;
        case "SOUTH": output = vector.rotate(180); break;
        case "EAST": output = vector.rotate(90); break;
        default: console.log(currentRotation)
    }
    return output;
}

const coordRegex = /x=(-?\d+), y=(-?\d+), z=(-?\d+)/;
const extractCoord = (string) => {
    const match = string.match(coordRegex);
    if (match) {
        const x = parseInt(match[1], 10);
        const y = parseInt(match[2], 10);
        const z = parseInt(match[3], 10);
        return [x, y, z]
    } else {
        console.log("No match found.");
    }
}

const defaultColor = "§f"
export function chat(message) {
    ChatLib.chat("§0[§6AutoRoutes§0] " + defaultColor + message.toString().replaceAll("&r", defaultColor))
}

export const swapToItem = (targetItemName) => {
    const itemSlot = Player?.getInventory()?.getItems()?.findIndex(item => { return item?.getName()?.toLowerCase()?.includes(targetItemName.toLowerCase()) })
    if (itemSlot === -1 || itemSlot > 7) {
        chat(`Unable to find "${targetItemName}" in your hotbar`)
        throw new Error(`Unable to find "${targetItemName}" in your hotbar`)
    } else {
        Player.setHeldItemIndex(itemSlot)
    }
}

export function rotate(origYaw, origPitch) {
    const player = Player.getPlayer()

    const yaw = parseFloat(origYaw)
    const pitch = parseFloat(origPitch)
    if (!yaw && yaw !== 0 || !pitch && pitch !== 0) return chat("Invalid rotation!")
    player.field_70177_z = parseFloat(yaw)
    player.field_70125_A = parseFloat(pitch)
}

export const playerCoords = () => {
    return {
        camera: [renderManager.field_78730_l, renderManager.field_78731_m, renderManager.field_78728_n],
        player: [Player.getX(), Player.getY(), Player.getZ()]
    }
}

export const calcYawPitch = (x, y, z) => {
    let d = {
        x: x - Player.getX(),
        y: y - (Player.getY() + Player.getPlayer().func_70047_e()),
        z: z - Player.getZ()
    }
    let yaw = 0
    let pitch = 0
    if (d.x != 0) {
        if (d.x < 0) { yaw = 1.5 * Math.PI; } else { yaw = 0.5 * Math.PI; }
        yaw = yaw - Math.atan(d.z / d.x)
    } else if (d.z < 0) { yaw = Math.PI }
    d.xz = Math.sqrt(Math.pow(d.x, 2) + Math.pow(d.z, 2))
    pitch = -Math.atan(d.y / d.xz)
    yaw = -yaw * 180 / Math.PI
    pitch = pitch * 180 / Math.PI
    if (pitch < -90 || pitch > 90 || isNaN(yaw) || isNaN(pitch) || yaw == null || pitch == null || yaw == undefined || pitch == null) return;

    return [yaw, pitch]

}

const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding");
let lastUse = Date.now()
export const setSneaking = (state) => {
    KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74311_E.func_151463_i(), state)
    console.log(`${Date.now() - lastUse}, ${state}`)
    lastUse = Date.now()
}

export const setWalking = (state) => KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(), state)

/*
let sneaking = false


const C0BPacketEntityAction = Java.type("net.minecraft.network.play.client.C0BPacketEntityAction");
export const setSneaking = (state) => {
    if (state && !sneaking) Client.sendPacket(new  (Player.getPlayer(), C0BPacketEntityAction.Action.STOP_SNEAKING))
}

register("packetSent", packet => {
    const action = packet.func_180764_b()
    if (action == C0BPacketEntityAction.Action.START_SNEAKING) sneaking = true
    if (action == C0BPacketEntityAction.Action.STOP_SNEAKING) sneaking = false
}).setFilteredClass(C0BPacketEntityAction)
*/

