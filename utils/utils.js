
// Thank you gekke (why do i need to put INSTANCE in the java class name)

import Vector3 from '../../BloomCore/utils/Vector3.js'
import Settings from "../config"

const dungeonUtils = Java.type("me.odinmain.utils.skyblock.dungeon.DungeonUtils")
const renderManager = Client.getMinecraft().func_175598_ae()

const rotationNumber = new Map([
    ["NORTH", 0],
    ["WEST", -1],
    ["SOUTH", 2],
    ["EAST", 1]
])


export const convertToRelative = (realCoord) => {
    if (!realCoord) return null
    const currRoom = dungeonUtils.INSTANCE.currentRoom;
    if (!currRoom) return realCoord
    const roomRotation = currRoom.rotation;
    const clayCoord = extractCoord(currRoom.clayPos.toString());

    const inputVec = new Vector3(...realCoord);
    const clayVec = new Vector3(clayCoord[0], 0, clayCoord[2]);

    const relativeCoord = inputVec.copy().subtract(clayVec)
    const relativeCoordNorth = rotateToNorth(relativeCoord, roomRotation)

    return [relativeCoordNorth.getX(), relativeCoordNorth.getY(), relativeCoordNorth.getZ()]
}

export const convertFromRelative = (relativeCoord) => {
    if (!relativeCoord) return null
    const currRoom = dungeonUtils.INSTANCE.currentRoom;
    if (!currRoom) return relativeCoord
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
    if (!currRoom) return parseFloat(yaw)
    const roomRotation = currRoom.rotation;
    return parseFloat(yaw) + (parseFloat(rotationNumber.get(roomRotation.toString())) * 90)
}

export const convertToRelativeYaw = (yaw) => {
    const currRoom = dungeonUtils.INSTANCE.currentRoom;
    if (!currRoom) return parseFloat(yaw)
    const roomRotation = currRoom.rotation;
    return parseFloat(yaw) - (parseFloat(rotationNumber.get(roomRotation.toString())) * 90)
}


export const getRoomName = () => {
    let roomName = dungeonUtils.INSTANCE.currentRoomName
    if (roomName === "Unknown") {
        const tabList = TabList.getUnformattedNames()

        // tabList.forEach((str, i) => ChatLib.chat([str, i].toString()))
    }
    return roomName
}

const rotateToNorth = (vector, currentRotation) => {
    let output = vector.copy();
    switch (currentRotation.toString()) {
        case "NORTH": output = new Vector3(-vector.getX(), vector.getY(), -vector.getZ()); break;
        case "WEST": output = new Vector3(vector.getZ(), vector.getY(), -vector.getX()); break;
        case "SOUTH": output = vector; break;
        case "EAST": output = new Vector3(-vector.getZ(), vector.getY(), vector.getX()); break;
        default: console.log(currentRotation)
    }
    return output;
}

const rotateFromNorth = (vector, desiredRotation) => {
    let output = vector.copy();
    switch (desiredRotation.toString()) {
        case "NORTH": output = new Vector3(-vector.getX(), vector.getY(), -vector.getZ()); break;
        case "WEST": output = new Vector3(-vector.getZ(), vector.getY(), vector.getX()); break;
        case "SOUTH": output = vector; break;
        case "EAST": output = new Vector3(vector.getZ(), vector.getY(), -vector.getX()); break;
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

export const swapFromName = (targetItemName) => {
    const itemSlot = Player.getInventory().getItems().findIndex(item => item?.getName()?.toLowerCase()?.includes(targetItemName.toLowerCase()))
    if (itemSlot === -1 || itemSlot > 7) {
        chat(`Unable to find "${targetItemName}" in your hotbar`)
        return false
    } else {
        return swapToSlot(itemSlot)
    }
}

export const swapFromItemID = (targetItemID) => {
    const itemSlot = Player.getInventory().getItems().findIndex(item => item?.getID() == targetItemID)
    if (itemSlot === -1 || itemSlot > 7) {
        chat(`Unable to find Item ID ${targetItemID} in your hotbar`)
        return false
    } else {
        return swapToSlot(itemSlot)
    }
}

let lastSwap = Date.now()
const swapToSlot = (slot) => {
    if (Player.getHeldItemIndex() === slot) return 1
    debugMessage(`Time since last swap is ${Date.now() - lastSwap}ms.`)
    lastSwap = Date.now()
    Player.setHeldItemIndex(slot)
    return 2
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

export const calcYawPitch = (x, y, z, sneaking = false) => {
    let d = {
        x: x - Player.getX(),
        y: y - (Player.getY() + (sneaking ? getEyeHeightSneaking() : getEyeHeight())),
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

    return { yaw, pitch }

}

const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding")

export const setWalking = (state) => KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(), state)


const C0BPacketEntityAction = Java.type("net.minecraft.network.play.client.C0BPacketEntityAction")
let sneaking = Player.isSneaking()

export const setSneaking = (state) => {
    if (state && !sneaking) Client.sendPacket(new C0BPacketEntityAction(Player.getPlayer(), C0BPacketEntityAction.Action.START_SNEAKING))
    if (!state && sneaking) Client.sendPacket(new C0BPacketEntityAction(Player.getPlayer(), C0BPacketEntityAction.Action.STOP_SNEAKING))
}

let lastTrigger = Date.now()
register("packetSent", (packet, event) => {
    if (!Settings().autoRoutesEnabled) return
    const action = packet.func_180764_b()
    if (action == C0BPacketEntityAction.Action.START_SNEAKING) {
        if (sneaking) cancel(event)
        else {
            // debugMessage(`Last sneak packet was ${Date.now() - lastTrigger}ms ago`)
            lastTrigger = Date.now()
        }
        sneaking = true
    }
    if (action == C0BPacketEntityAction.Action.STOP_SNEAKING) {
        if (!sneaking) cancel(event)
        else {
            // debugMessage(`Last sneak packet was ${Date.now() - lastTrigger}ms ago`)
            lastTrigger = Date.now()
        }
        sneaking = false
    }
}).setFilteredClass(C0BPacketEntityAction)



register("worldUnload", () => sneaking = false)

export const WASDKeys = [
    Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74370_x.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74366_z.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74368_y.func_151463_i()
]

export const movementKeys = [
    Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74370_x.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74366_z.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74368_y.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74311_E.func_151463_i()
]

export const releaseMovementKeys = () => WASDKeys.forEach(keybind => KeyBinding.func_74510_a(keybind, false))
export const repressMovementKeys = () => WASDKeys.forEach(keybind => KeyBinding.func_74510_a(keybind, Keyboard.isKeyDown(keybind)))

//Retarded way to get center of block cause I couldn't think when I made this
export const centerCoords = (blockCoords) => {
    return [blockCoords[0] + (Math.sign(blockCoords[0] === 1) ? -0.5 : 0.5), blockCoords[1], blockCoords[2] + (Math.sign(blockCoords[2] === 1) ? -0.5 : 0.5)]
    // return [blockCoords[0] + 0.5, blockCoords[1], blockCoords[2] + 0.5]
}

const leftClickMethod = Client.getMinecraft().getClass().getDeclaredMethod("func_147116_af", null)
leftClickMethod.setAccessible(true)

export const leftClick = () => {
    leftClickMethod.invoke(Client.getMinecraft(), null)
}


let distance
export const registerPearlClip = (dist) => {
    distance = Math.abs(dist)
    pearlclip.register()
}

const pearlclip = register("packetReceived", (packet, event) => {
    Client.scheduleTask(0, () => {
        if (event?.isCancelled()) return
        pearlclip.unregister()
        chat(`Pearlclipped ${distance} blocks down.`)
        Player.getPlayer().func_70107_b(Math.floor(Player.getX()) + 0.5, Math.floor(Player.getY()) - distance, Math.floor(Player.getZ()) + 0.5)
    })
}).setFilteredClass(net.minecraft.network.play.server.S08PacketPlayerPosLook).unregister()

export const sendAirClick = () => Client.sendPacket(new net.minecraft.network.play.client.C08PacketPlayerBlockPlacement(Player.getInventory().getStackInSlot(Player.getHeldItemIndex()).getItemStack()))

export function debugMessage(message, disappear = true) {
    if (!Settings().debugMessages) return
    ChatLib.chat("§0[§6AutoRoutesDebug§0] " + defaultColor + message.toString().replaceAll("&r", defaultColor))
}

export const getEyeHeightSneaking = () => { // Peak schizo
    return 1.5399999618530273
}

export const getEyeHeight = () => {
    return Player.getPlayer().func_70047_e()
}


import { isValidEtherwarpBlock, raytraceBlocks } from "../../BloomCore/utils/utils"

export function getEtherYawPitch(blockCoords) {
    const playerCoords = [Player.getX(), Player.getY() + getEyeHeightSneaking(), Player.getZ()]

    const centeredCoords = centerCoords(blockCoords)
    const rotation = calcYawPitch(centeredCoords[0], centeredCoords[1] + 0.5, centeredCoords[2], true)
    // Return if you can aim at center of the block
    if (raytraceBlocks(playerCoords, Vector3.fromPitchYaw(rotation.pitch, rotation.yaw), 60, isValidEtherwarpBlock, true, true)?.every((coord, index) => coord === blockCoords[index])) return rotation
    const lowerLimit = { yaw: rotation.yaw - 4, pitch: rotation.pitch - 6 }
    const upperLimit = { yaw: rotation.yaw + 4, pitch: rotation.pitch + 6 }
    const runStart = Date.now()
    let runs = 0
    for (let yaw = lowerLimit.yaw; yaw < upperLimit.yaw; yaw++) {
        for (let pitch = lowerLimit.pitch; pitch < upperLimit.pitch; pitch++) {
            runs++
            let prediction = rayTraceEtherBlock(playerCoords, yaw, pitch)
            if (!prediction) continue
            if (prediction.every((coord, index) => coord === blockCoords[index])) {
                debugMessage(`Found Yaw/Pitch combination in ${runs} attempts! Took ${Date.now() - runStart}ms.`, false)
                return { yaw, pitch }
            }
        }
    }
    debugMessage(`Failed to find Yaw/Pitch combination. ${runs} attempts. Took ${Date.now() - runStart}ms`, false)
    return null
}

export function getEtherYawPitchFromArgs(args) {
    let yaw
    let pitch
    if (args.etherCoordMode === 0) {
        const etherwarpRotation = getEtherYawPitch(convertFromRelative(args.etherBlock))
        if (!etherwarpRotation) {
            chat("Failed to get a valid yaw pitch combination!")
            return null
        }
        yaw = etherwarpRotation.yaw
        pitch = etherwarpRotation.pitch
    } else {
        yaw = convertToRealYaw(args.yaw)
        pitch = args.pitch
    }
    return [yaw, pitch]
}

import { isValidEtherwarpBlock, raytraceBlocks } from "../../BloomCore/utils/utils"

export const rayTraceEtherBlock = (pos, yaw, pitch) => {
    return raytraceBlocks(pos, Vector3.fromPitchYaw(pitch, yaw), 60, isValidEtherwarpBlock, true, true)
}

const mcTessellator = Java.type("net.minecraft.client.renderer.Tessellator")
const tessellatorInstance = mcTessellator.func_178181_a()
const worldRenderer = tessellatorInstance.func_178180_c()

export function renderBox(pos, width, height, colors) {
    for (let i = 0; i < colors.length; i++) {
        let yOffset = i * (1 / (colors.length - 1))
        renderSquare(pos[0], pos[1] + yOffset * height + 0.01, pos[2], width, colors[i], 3, false)
    }
}

import RenderLibV2 from "../../RenderLibV2"

export function renderScandinavianFlag(pos, width, height, color1, color2) {
    RenderLibV2.drawInnerEspBoxV2(...pos, width, height, width, ...color1, 0.5, false)
    RenderLibV2.drawLine(pos[0] + width / 6, pos[1], pos[2], pos[0] + width / 6, pos[1] + height, pos[2], ...color2, 1, false, 10)
    RenderLibV2.drawLine(pos[0] + width / 2, pos[1] + height / 2, pos[2], pos[0] - width / 2, pos[1] + height / 2, pos[2], ...color2, 1, false, 10)
}

function renderSquare(x, y, z, width, color, thickness, phase = true) {
    GlStateManager.func_179140_f() // disableLighting
    GlStateManager.func_179147_l() // enableBlend
    GlStateManager.func_179112_b(770, 771) // blendFunc
    GL11.glLineWidth(thickness)

    if (phase) GlStateManager.func_179097_i() // disableDepth

    GlStateManager.func_179090_x() // disableTexture2D

    GlStateManager.func_179094_E() // pushMatrix

    GlStateManager.func_179137_b(-renderManager.field_78730_l, -renderManager.field_78731_m, -renderManager.field_78728_n) // translate

    worldRenderer.func_181668_a(3, net.minecraft.client.renderer.vertex.DefaultVertexFormats.field_181705_e) // begin

    GlStateManager.func_179131_c(color[0], color[1], color[2], 1) // color

    const halfWidth = width / 2
    worldRenderer.func_181662_b(x + halfWidth, y, z + halfWidth).func_181675_d()
    worldRenderer.func_181662_b(x + halfWidth, y, z - halfWidth).func_181675_d()
    worldRenderer.func_181662_b(x - halfWidth, y, z - halfWidth).func_181675_d()
    worldRenderer.func_181662_b(x - halfWidth, y, z + halfWidth).func_181675_d()
    worldRenderer.func_181662_b(x + halfWidth, y, z + halfWidth).func_181675_d()

    tessellatorInstance.func_78381_a() // draw

    GlStateManager.func_179121_F() // popMatrix

    GlStateManager.func_179098_w() // enableTexture2D
    GlStateManager.func_179126_j() // enableDepth
    GlStateManager.func_179084_k() // disableBlend
}