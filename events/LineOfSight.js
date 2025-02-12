import { scheduleTask } from "../utils/utils"
import { getEtherYawPitch, getEyeHeightSneaking, getEtherYawPitchFromArgs, rayTraceEtherBlock, playerCoords, movementKeys } from "../utils/RouteUtils"

const listeners = []

let moveKeyCooldown = Date.now()


function addLineOfSightListener(success, fail, nodeArgs) {
    const listener = { success, fail, nodeArgs }

    listeners.push(listener)
    moveKeyCooldown = Date.now()
    scheduleTask(100, () => {
        const index = listeners.indexOf(listener)
        if (index === -1) return
        listeners.splice(index, 1)
        fail("Line of sight timed out!")
    })
}
export default addLineOfSightListener

register("worldUnload", () => {
    while (listeners.length) listeners.pop()
})

register("tick", () => {
    new Thread(() => {
        const playerPosition = playerCoords().player
        if (!listeners.length) return
        for (let i = listeners.length - 1; i >= 0; i--) {
            let listener = listeners[i]
            let nodeArgs = listener.nodeArgs
            if (nodeArgs.etherCoordMode === 0) {
                const raytrace = getEtherYawPitch(nodeArgs.etherBlock)
                if (!raytrace) return
            }
            else {
                const raytrace = rayTraceEtherBlock(playerPosition, ...getEtherYawPitchFromArgs(nodeArgs))
                if (raytrace.some((coord, index) => coord !== nodeArgs.etherBlock[index])) return
            }
            listeners.splice(i, 1)
            listener.success()
        }
    }).start()
})

register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, () => {
    if (Date.now() - moveKeyCooldown < 150) return
    if (Client.isInGui() || !World.isLoaded()) return
    if (!Keyboard.getEventKeyState()) return
    const keyCode = Keyboard.getEventKey()
    if (!keyCode) return

    if (!movementKeys.includes(keyCode)) return
    if (!listeners.length) return

    for (let i = listeners.length - 1; i >= 0; i--) {
        listeners.splice(i, 1)
    }
})