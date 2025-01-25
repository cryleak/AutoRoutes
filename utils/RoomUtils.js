// Thank you gekke (why do i need to put INSTANCE in the java class name)

import Vector3 from "../../BloomCore/utils/Vector3.js"

const dungeonUtils = Java.type("me.odinmain.utils.skyblock.dungeon.DungeonUtils").INSTANCE

const rotationNumber = new Map([
    ["NORTH", 0],
    ["WEST", -1],
    ["SOUTH", 2],
    ["EAST", 1]
])


export const convertToRelative = (realCoord) => {
    if (!realCoord) return null
    const currRoom = dungeonUtils.currentRoom
    if (!currRoom) return JSON.parse(JSON.stringify(realCoord))
    const roomRotation = currRoom.rotation
    const clayCoord = extractCoord(currRoom.clayPos)

    const inputVec = new Vector3(...realCoord)
    const clayVec = new Vector3(clayCoord[0], 0, clayCoord[2])

    const relativeCoord = inputVec.copy().subtract(clayVec)
    const relativeCoordNorth = rotateToNorth(relativeCoord, roomRotation)

    return [relativeCoordNorth.getX(), relativeCoordNorth.getY(), relativeCoordNorth.getZ()]
}

export const convertFromRelative = (relativeCoord) => {
    if (!relativeCoord) return null
    const currRoom = dungeonUtils.currentRoom
    if (!currRoom) return JSON.parse(JSON.stringify(relativeCoord))
    const roomRotation = currRoom.rotation
    const clayCoord = extractCoord(currRoom.clayPos)

    const inputVec = new Vector3(...relativeCoord)
    const relativeRotated = rotateFromNorth(inputVec, roomRotation)

    const clayVec = new Vector3(clayCoord[0], 0, clayCoord[2])

    const realCoord = clayVec.copy().add(relativeRotated.copy())
    return [realCoord.getX(), realCoord.getY(), realCoord.getZ()]
}

export const convertToRealYaw = (yaw) => {
    const currRoom = dungeonUtils.currentRoom
    if (!currRoom) return parseFloat(yaw)
    const roomRotation = currRoom.rotation
    return parseFloat(yaw) + (parseFloat(rotationNumber.get(roomRotation.toString())) * 90)
}

export const convertToRelativeYaw = (yaw) => {
    const currRoom = dungeonUtils.currentRoom
    if (!currRoom) return parseFloat(yaw)
    const roomRotation = currRoom.rotation
    return parseFloat(yaw) - (parseFloat(rotationNumber.get(roomRotation.toString())) * 90)
}


export const getRoomName = () => {
    return dungeonUtils.currentRoomName
}

const rotateToNorth = (vector, currentRotation) => {
    let output
    switch (currentRotation.toString()) {
        case "NORTH": output = new Vector3(-vector.getX(), vector.getY(), -vector.getZ())
            break
        case "WEST": output = new Vector3(vector.getZ(), vector.getY(), -vector.getX())
            break
        case "SOUTH": output = vector.copy()
            break
        case "EAST": output = new Vector3(-vector.getZ(), vector.getY(), vector.getX())
            break
    }
    return output
}

const rotateFromNorth = (vector, desiredRotation) => {
    let output
    switch (desiredRotation.toString()) {
        case "NORTH": output = new Vector3(-vector.getX(), vector.getY(), -vector.getZ())
            break
        case "WEST": output = new Vector3(-vector.getZ(), vector.getY(), vector.getX())
            break
        case "SOUTH": output = vector.copy()
            break
        case "EAST": output = new Vector3(vector.getZ(), vector.getY(), -vector.getX())
            break
    }
    return output
}

const extractCoord = (MCBlockPos) => {
    return [MCBlockPos.func_177958_n(), MCBlockPos.func_177956_o(), MCBlockPos.func_177952_p()]
}