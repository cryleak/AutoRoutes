import { debugMessage } from "./utils"
import { rotate, sendAirClick } from "../utils/RouteUtils"
import Settings from "../config"

let lastTP = Date.now()
let packetsPreRotating = 0
let yaw = 0
let pitch = 0
let clicking = false
let rotating = false
let preRotating = false

register(Java.type("nukedenmark.events.impl.MotionUpdateEvent").Pre, (event) => {
    if (!rotating && !preRotating) return

    event.yaw = yaw
    event.pitch = pitch
    if (preRotating) packetsPreRotating++
    if (Settings().rotateOnServerRotate) rotate(yaw, pitch)
})

register(Java.type("nukedenmark.events.impl.MotionUpdateEvent").Post, () => {
    if (!clicking || !rotating) return

    rotating = false
    clicking = false
    airClick()
})

export function clickAt(y, p) {
    yaw = parseFloat(y)
    pitch = parseFloat(p)
    if (!yaw && yaw !== 0 || !pitch && pitch !== 0) return chat("Invalid rotation! How is this possible?")

    if (preRotating) debugMessage(`Prerotated for ${packetsPreRotating} packets.`)

    rotating = true
    clicking = true
    preRotating = false
}

export function prepareRotate(y, p) {
    yaw = parseFloat(y)
    pitch = parseFloat(p)
    if (!yaw && yaw !== 0 || !pitch && pitch !== 0) return chat("Invalid rotation! How is this possible?")

    preRotating = true
    packetsPreRotating = 0
}

export function stopRotating() {
    rotating = false
    clicking = false
    preRotating = false
}

const airClick = () => {
    debugMessage(`Time between this TP and last: ${Date.now() - lastTP}ms`); lastTP = Date.now()
    clicking = false
    sendAirClick()
}


register("worldUnload", stopRotating)