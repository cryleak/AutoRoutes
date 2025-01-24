import Settings from "../config"
const renderManager = Client.getMinecraft().func_175598_ae()


const defaultColor = "§f"
/**
 * Prints in chat a message with a prefix
 * @param {String} message 
 */
export function chat(message) {
    ChatLib.chat("§0[§6AutoRoutes§0] " + defaultColor + message.toString().replaceAll(/(?:&r|§r)/gi, defaultColor))
}

/**
 * Prints in chat a debug message if debug messages are enabled.
 * @param {String} message 
 */
export function debugMessage(message) {
    if (!Settings().debugMessages) return
    ChatLib.chat("§0[§6AutoRoutesDebug§0] " + defaultColor + message.toString().replaceAll("&r", defaultColor))
}

const mcTessellator = Java.type("net.minecraft.client.renderer.Tessellator")
const tessellatorInstance = mcTessellator.func_178181_a()
const worldRenderer = tessellatorInstance.func_178180_c()

/**
 * Renders a box made out of squares.
 * @param {Array} pos 
 * @param {Number} width 
 * @param {Number} height 
 * @param {Array} colors An array of any number of arrays which consist each of 3 floats containing color values from 0-1
 */
export function renderBox(pos, width, height, colors) {
    for (let i = 0; i < colors.length; i++) {
        let yOffset = i * (1 / (colors.length - 1))
        renderSquare(pos[0], pos[1] + yOffset * height + 0.01, pos[2], width, colors[i], 3, false)
    }
}

import RenderLibV2 from "../../RenderLibV2"

/**
 * Draws a box that looks like a scandinavian flag with specified colors.
 * @param {Array} pos 
 * @param {Number} width 
 * @param {Number} height 
 * @param {Array} color1 An array of 3 floats containing color values from 0-1
 * @param {Array} color2 An array of 3 floats containing color values from 0-1
 */
export function renderScandinavianFlag(pos, width, height, color1, color2) {
    RenderLibV2.drawInnerEspBoxV2(...pos, width, height, width, ...color1, 0.5, false)
    RenderLibV2.drawLine(pos[0] + width / 6, pos[1], pos[2], pos[0] + width / 6, pos[1] + height, pos[2], ...color2, 1, false, 10)
    RenderLibV2.drawLine(pos[0] + width / 2, pos[1] + height / 2, pos[2], pos[0] - width / 2, pos[1] + height / 2, pos[2], ...color2, 1, false, 10)
}


/**
 * Renders a square with the specified properties
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} z 
 * @param {Number} width Width of the square
 * @param {Array} color An array of 3 floats containing color values from 0-1
 * @param {Number} thickness Thickness of the lines
 * @param {Boolean} phase Whether to phase through blocks or not
 */
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

    const halfWidth = width
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

// This actually fucking works btw it lets you make nested scheduleTasks
const codeToExec = []
/**
 * Schedules a task to run in the specified number of ticks. This variant of scheduleTask lets you nest scheduleTasks inside of eachother. Note that it won't work if you trigger it inside a Client.scheduleTask.
 * @param {int} delay Delay in ticks
 * @param {func} exec Code to execute
 */
export function scheduleTask(delay, exec) {
    Client.scheduleTask(delay, () => codeToExec.push(exec))
}

register("tick", () => {
    while (codeToExec.length) codeToExec.shift()()
}).setPriority(Priority.HIGHEST)