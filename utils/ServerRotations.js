import { debugMessage, chat, scheduleTask } from "./utils"
import { rotate, sendAirClick, rightClick } from "../utils/RouteUtils"
import Settings from "../config"
import { getDistanceToCoord } from "../../BloomCore/utils/utils"
let lastTP = Date.now()
let packetsPreRotating = 0
let yaw = 0
let renderYaw = null
let pitch = 0
let clicking = false
let rotating = false
let preRotating = false
const queuedPreRotates = []
let currentPreRotatePosition = null

register(Java.type("nukedenmark.events.impl.MotionUpdateEvent").Pre, (event) => {
    if (!rotating && !preRotating) return

    event.yaw = yaw
    event.pitch = pitch
    if (preRotating) packetsPreRotating++
    if (Settings().rotateOnServerRotate) Client.scheduleTask(0, () => rotate(yaw, pitch))

    if (currentPreRotatePosition && getDistanceToCoord(...currentPreRotatePosition, false) > 2.5) stopRotating() // Stop prerotating if you move away from where the prerotate started

    if (!queuedPreRotates.length) return
    for (let i = queuedPreRotates.length - 1; i >= 0; i--) {
        let queuedPreRotate = queuedPreRotates[i]
        if (getDistanceToCoord(...queuedPreRotate.pos, false) > 2.5) queuedPreRotates.splice(i, 1)
    }
})

register(Java.type("nukedenmark.events.impl.MotionUpdateEvent").Post, () => {
    if (!clicking || !rotating) return

    rotating = false
    clicking = false
    airClick()
    if (!queuedPreRotates.length) return

    const queuedPreRotate = queuedPreRotates.shift()
    currentPreRotatePosition = [...queuedPreRotate.pos]
    queuedPreRotate.exec()
})

register("renderEntity", (entity) => {
    if (entity.getEntity() !== Player.getPlayer()) return
    if (!renderYaw && renderYaw !== 0) return
    if (!Settings().renderServerRotation) return
    Player.getPlayer().field_70761_aq = yaw
    Player.getPlayer().field_70759_as = yaw
})

export function clickAt(y, p) {
    yaw = parseFloat(y)
    pitch = parseFloat(p)
    if (!yaw && yaw !== 0 || !pitch && pitch !== 0) return chat(`Invalid rotation! How is this possible?\nyaw = ${yaw} pitch = ${pitch}`)

    if (preRotating) debugMessage(`Prerotated for ${packetsPreRotating} packets.`)

    rotating = true
    clicking = true
    preRotating = false
    while (queuedPreRotates.length) queuedPreRotates.pop()
    currentPreRotatePosition = null
    renderYaw = yaw
    Client.scheduleTask(0, () => renderYaw = null)
    if (Settings().rotateOnServerRotate) rotate(yaw, pitch)
}

export function prepareRotate(y, p, pos) {
    const exec = () => {
        yaw = parseFloat(y)
        pitch = parseFloat(p)
        if (!yaw && yaw !== 0 || !pitch && pitch !== 0) return chat(`Invalid rotation! How is this possible?\nyaw = ${yaw} pitch = ${pitch}`)

        preRotating = true
        renderYaw = yaw
        packetsPreRotating = 0
    }
    // if (preRotating) return
    if (!preRotating && !clicking && !rotating) {
        currentPreRotatePosition = [...pos]
        exec()
    } else {
        queuedPreRotates.push({ exec, pos })
        scheduleTask(100, () => {
            const index = queuedPreRotates.indexOf(exec)
            if (index !== -1) queuedPreRotates.splice(index, 1)
        })
    }
    // exec()

}

export function stopRotating() {
    rotating = false
    clicking = false
    preRotating = false
    while (queuedPreRotates.length) queuedPreRotates.pop()
    currentPreRotatePosition = null
    renderYaw = null
}

const airClick = () => {
    debugMessage(`Time between this TP and last: ${Date.now() - lastTP}ms`); lastTP = Date.now()
    clicking = false
    sendAirClick()
}


register("worldUnload", stopRotating)