import Settings from "../config"
const renderManager = Client.getMinecraft().func_175598_ae()
const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding")
const C0BPacketEntityAction = Java.type("net.minecraft.network.play.client.C0BPacketEntityAction")



/**
 * Swaps to an item in your hotbar with the specified name.
 * @param {String} targetItemName - Target item name
 * @returns false if it can't find the item, 1 if you are already holding it, 2 if you aren't already holding it
 */
export const swapFromName = (targetItemName) => {
    const itemSlot = Player.getInventory().getItems().findIndex(item => item?.getName()?.toLowerCase()?.includes(targetItemName.toLowerCase()))
    if (itemSlot === -1 || itemSlot > 7) {
        chat(`Unable to find "${targetItemName}" in your hotbar`)
        return false
    } else {
        return swapToSlot(itemSlot)
    }
}

/**
 * Swaps to an item in your hotbar with the specified Item ID.
 * @param {String} targetItemID - Target Item ID
 * @returns false if it can't find the item, 1 if you are already holding it, 2 if you aren't already holding it
 */
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

/**
 * Rotates the camera clientside to a specified yaw and pitch. Will also update serverside rotation on the next tick if nothing else is affecting it.
 * @param {Number} origYaw - Yaw 
 * @param {Number} origPitch - Pitch
 * @returns 
 */
export function rotate(origYaw, origPitch) {
    const player = Player.getPlayer()

    const yaw = parseFloat(origYaw)
    const pitch = parseFloat(origPitch)
    if (!yaw && yaw !== 0 || !pitch && pitch !== 0) return chat("Invalid rotation!")
    player.field_70177_z = parseFloat(yaw)
    player.field_70125_A = parseFloat(pitch)
}

/**
 * Gets the player coordinates
 * @returns An object containing the current coordinates of the Player and the camera
 */
export const playerCoords = () => {
    return {
        camera: [renderManager.field_78730_l, renderManager.field_78731_m, renderManager.field_78728_n],
        player: [Player.getX(), Player.getY(), Player.getZ()]
    }
}

/**
 * Calculates yaw and pitch of a specified block from the player position
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} z 
 * @param {Number} sneaking - Whether to calculate based off the fact that you are sneaking or not, otherwise it uses eye height
 * @returns The yaw and pitch to aim at the specified coordinates.
 */
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

export const setWalking = (state) => KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(), state)

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

export const getEyeHeightSneaking = () => { // Peak schizo
    return 1.5399999618530273
}

export const getEyeHeight = () => {
    return Player.getPlayer().func_70047_e()
}


import { isValidEtherwarpBlock, raytraceBlocks } from "../../BloomCore/utils/utils"

/**
 * Gets a valid Yaw/Pitch combination that you can etherwarp to in order to land at a specific block. Has terrible performance.
 * @param {Array} blockCoords 
 * @returns Object with yaw and pitch or null if fail
 */
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

/**
 * Gets yaw and pitch for an etherwarp node from the ring arguments depending on your coordinate mode.
 * @param {Object} args 
 * @returns Array containing yaw and pitch
 */
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


/**
 * Gets the block an etherwarp from a specified position and yaw/pitch will land on.
 * @param {Array} pos 
 * @param {Number} yaw 
 * @param {Number} pitch 
 * @returns An array containing the etherwarp raytrace position
 */
export const rayTraceEtherBlock = (pos, yaw, pitch) => {
    return raytraceBlocks(pos, Vector3.fromPitchYaw(pitch, yaw), 60, isValidEtherwarpBlock, true, true)
}

/**
 * Retarded way to get center of block cause I couldn't think when I made this
 * @param {Array} blockCoords 
 * @returns 
 */
export const centerCoords = (blockCoords) => {
    return [blockCoords[0] + (Math.sign(blockCoords[0] === 1) ? -0.5 : 0.5), blockCoords[1], blockCoords[2] + (Math.sign(blockCoords[2] === 1) ? -0.5 : 0.5)]
}