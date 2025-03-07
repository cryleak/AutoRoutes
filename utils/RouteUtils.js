
import Settings from "../config"
import { debugMessage, chat, scheduleTask } from "./utils"
import { convertFromRelative, convertToRealYaw } from "./RoomUtils"

const renderManager = Client.getMinecraft().func_175598_ae()
const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding")

/**
 * Swaps to an item in your hotbar with the specified name.
 * @param {String} targetItemName - Target item name
 * @returns An array containing 2 items: the success of the swap and the slot index.
 */
export const swapFromName = (targetItemName) => {
    const itemSlot = Player.getInventory().getItems().findIndex(item => item?.getName()?.removeFormatting()?.toLowerCase()?.includes(targetItemName.removeFormatting().toLowerCase()))
    if (itemSlot === -1 || itemSlot > 7) {
        chat(`Unable to find "${targetItemName}" in your hotbar`)
        return ["CANT_FIND", itemSlot]
    } else {
        return swapToSlot(itemSlot)
    }
}

/**
 * Swaps to an item in your hotbar with the specified Item ID.
 * @param {String} targetItemID - Target Item ID
 * @returns An array containing 2 items: the success of the swap and the slot index.
 */
export const swapFromItemID = (targetItemID) => {
    const itemSlot = Player.getInventory().getItems().findIndex(item => item?.getID() == targetItemID)
    if (itemSlot === -1 || itemSlot > 7) {
        chat(`Unable to find Item ID ${targetItemID} in your hotbar`)
        return ["CANT_FIND", itemSlot]
    } else {
        return swapToSlot(itemSlot)
    }
}

let lastSwap = Date.now()
const swapToSlot = (slot) => {
    if (Player.getHeldItemIndex() === slot) return ["ALREADY_HOLDING", slot]
    debugMessage(`Time since last swap is ${Date.now() - lastSwap}ms.`)
    lastSwap = Date.now()
    Player.setHeldItemIndex(slot)
    return ["SWAPPED", slot]
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

export const sneakKey = Client.getMinecraft().field_71474_y.field_74311_E.func_151463_i()
const sneakKeybind = new KeyBind(Client.getMinecraft().field_71474_y.field_74311_E)

let desiredState = false
export const getDesiredSneakState = () => {
    return desiredState
}
export const setSneaking = (state) => {
    desiredState = state
    sneakKeybind.setState(state)
    KeyBinding.func_74510_a(sneakKey, state)
}

register("worldUnload", () => desiredState = false)


export const WASDKeys = [
    Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74370_x.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74366_z.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74368_y.func_151463_i()
]

export const wrappedWASDKeys = [
    new KeyBind(Client.getMinecraft().field_71474_y.field_74351_w),
    new KeyBind(Client.getMinecraft().field_71474_y.field_74370_x),
    new KeyBind(Client.getMinecraft().field_71474_y.field_74366_z),
    new KeyBind(Client.getMinecraft().field_71474_y.field_74368_y)
]

export const movementKeys = [
    Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74370_x.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74366_z.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74368_y.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74311_E.func_151463_i()
]

export const releaseMovementKeys = () => {
    WASDKeys.forEach(keybind => KeyBinding.func_74510_a(keybind, false))
    wrappedWASDKeys.forEach(keybind => keybind.setState(false)) // I have no clue if this does anything but keybind behavior is so fucking weird
}
export const repressMovementKeys = () => WASDKeys.forEach(keybind => KeyBinding.func_74510_a(keybind, Keyboard.isKeyDown(keybind)))


const leftClickMethod = Client.getMinecraft().getClass().getDeclaredMethod("func_147116_af", null)
leftClickMethod.setAccessible(true)

export const leftClick = () => leftClickMethod.invoke(Client.getMinecraft(), null)


const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
/**
 * Sends a C08 with no target block.
 * @param {exec} exec A specified function to run before the C08 is sent
 * @returns Success of the air click, false if it didn't click, true if it did
 */
export const sendAirClick = (exec) => {
    // c08 packets somehow cause illegalstateexceptions in ct modules sometimes also the playerinteract register in ct triggers whenever forge's playerinteract event triggers but for some fucking reason if i register the forge event directly it only works when i manually right click?????????
    // im using them anyways cause using right click with server rotations is a fucking awful idea
    // nevermind it only happens in singleplayer (for some reason playerinteract triggers on the server thread when you send a c08 and that gets registered by ct so shoutout)
    if (exec) exec()
    syncCurrentPlayItem() // sends c09 if you arent holding the correct item already
    Client.sendPacket(new C08PacketPlayerBlockPlacement(Player.getHeldItem()?.getItemStack() ?? null))
    return true
}

export const getEyeHeightSneaking = () => { // Peak schizo
    return 1.5399999618530273
}

export const getEyeHeight = () => {
    return Player.getPlayer().func_70047_e()
}

const System = Java.type("java.lang.System")
/**
 * Gets a valid Yaw/Pitch combination that you can etherwarp to in order to land at a specific block. Has terrible performance.
 * @param {Array} blockCoords 
 * @returns Object with yaw and pitch or null if fail
 */
export function getEtherYawPitch(blockCoords) {
    const runStart = System.nanoTime()
    const playerCoords = [Player.getX(), Player.getY(), Player.getZ()]

    const centeredCoords = centerCoords(blockCoords)
    const rotation = calcYawPitch(centeredCoords[0], centeredCoords[1] + 0.5, centeredCoords[2], true)
    // Return if you can aim at center of the block
    if (rayTraceEtherBlock(playerCoords, rotation.yaw, rotation.pitch)?.every((coord, index) => coord === blockCoords[index])) return rotation
    let runs = 0
    for (let i = 0; i <= 10; i++) { // Exponentially less distance between steps...
        let lowerLimit = { yaw: rotation.yaw - 2, pitch: rotation.pitch - 4 }
        let upperLimit = { yaw: rotation.yaw + 2, pitch: rotation.pitch + 4 }

        let yawStepSize = (1 / (1 + i * (2 / 3)))
        let pitchStepSize = (0.5 / (1 + (i * 0.5)))
        for (let yaw = lowerLimit.yaw; yaw < upperLimit.yaw; yaw += yawStepSize) {
            for (let pitch = lowerLimit.pitch; pitch < upperLimit.pitch; pitch += pitchStepSize) {
                runs++
                let prediction = rayTraceEtherBlock(playerCoords, yaw, pitch)
                if (!prediction) continue
                if (prediction.every((coord, index) => coord === blockCoords[index])) {
                    debugMessage(`Found Yaw/Pitch combination in ${runs} attempts! Took ${(System.nanoTime() - runStart) / 1000000}ms. Shoutout to CT performance btw`, false)
                    return { yaw, pitch }
                }
            }
        }
    }
    debugMessage(`Failed to find Yaw/Pitch combination. ${runs} attempts. Took ${(System.nanoTime() - runStart) / 1000000}ms. Shoutout to CT performance btw`, false)
    return null
}

/**
 * Gets yaw and pitch for an etherwarp node from the node arguments depending on your coordinate mode.
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
    } else if (args.etherCoordMode === 1) {
        yaw = convertToRealYaw(args.yaw)
        pitch = args.pitch
    } else {
        const block = centerCoords(convertFromRelative(args.etherBlock))
        const rotation = calcYawPitch(block[0], block[1] + 0.9, block[2], true)
        yaw = rotation.yaw
        pitch = rotation.pitch
    }
    return [yaw, pitch]
}

const EtherWarpHelper = Java.type("me.odinmain.utils.skyblock.EtherWarpHelper").INSTANCE
/**
 * Gets the block an etherwarp from a specified position and yaw/pitch will land on. Uses Odin for RayTracing for vastly higher performance.
 * @param {Array} pos 
 * @param {Number} yaw 
 * @param {Number} pitch 
 * @returns An array containing the etherwarp raytrace position
 */
export const rayTraceEtherBlock = (position, yaw, pitch) => {
    // Correct the Y Level because Odin is black and doesn't let you specify eye level yourself so it will be wrong if you're sneaking.
    const prediction = EtherWarpHelper.getEtherPos(new net.minecraft.util.Vec3(position[0], parseFloat(position[1]) - (Player.asPlayerMP().isSneaking() ? 0.0000000381469727 : 0.0800000381469727), position[2]), yaw, pitch, 61, false)
    if (!prediction.succeeded) return null
    const pos = prediction.pos
    if (!pos) return null
    const endBlock = [pos.func_177958_n(), pos.func_177956_o(), pos.func_177952_p()]
    return endBlock
}

/**
 * Retarded way to get center of block cause I couldn't think when I made this
 * @param {Array} blockCoords 
 * @returns {Array} Centered blockCoords 
 */
export const centerCoords = (blockCoords) => {
    return [Math.floor(blockCoords[0]) + (Math.sign(blockCoords[0] === 1) ? -0.5 : 0.5), Math.floor(blockCoords[1]), Math.floor(blockCoords[2]) + (Math.sign(blockCoords[2] === 1) ? -0.5 : 0.5)]
}

const rightClickMethod = Client.getMinecraft().getClass().getDeclaredMethod("func_147121_ag", null)
rightClickMethod.setAccessible(true);
export const rightClick = () => rightClickMethod.invoke(Client.getMinecraft(), null);

export const findAirOpening = () => { // For use in pearlclip
    const playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY()), Math.floor(Player.getZ())]
    for (let i = Math.floor(playerPos[1]); i > 0; i--) {
        let block1 = World.getBlockAt(playerPos[0], i, playerPos[2]).type.getID()
        let block2 = World.getBlockAt(playerPos[0], i - 1, playerPos[2]).type.getID()
        let block3 = World.getBlockAt(playerPos[0], i - 2, playerPos[2]).type.getID()
        if (block1 === 0 && block2 === 0 && block3 !== 0) return i - 1
    }
    return null
}

const PlayerControllerMP = Java.type("net.minecraft.client.multiplayer.PlayerControllerMP")

const syncCurrentPlayItemMethod = PlayerControllerMP.class.getDeclaredMethod("func_78750_j")
syncCurrentPlayItemMethod.setAccessible(true)
export const syncCurrentPlayItem = () => syncCurrentPlayItemMethod.invoke(Client.getMinecraft().field_71442_b, null)



// i double checked that it wasnt 0 tick swapping and it wasnt :thumbsup:
/*
let lastSwapPacket = Date.now()
let slotIndex = 0
register("packetSent", (packet) => {
    lastSwapPacket = Date.now()
    slotIndex = packet.func_149614_c()
    ChatLib.chat(slotIndex)
}).setFilteredClass(net.minecraft.network.play.client.C09PacketHeldItemChange)

register("packetSent", (packet) => {
ChatLib.chat(`${Date.now() - lastSwapPacket} and ${packet.func_149574_g().toString() === Player.getHeldItem().getItemStack().toString() && Player.getHeldItem().getItemStack().toString() === Player.getInventory().getItems()[slotIndex].getItemStack().toString()}`)
}).setFilteredClass(C08PacketPlayerBlockPlacement)
*/