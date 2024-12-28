// Thank you gekke (why do i need to put INSTANCE in the java class name)

import Vector3 from '../../BloomCore/utils/Vector3.js'

const dungeonUtils = Java.type("me.odinmain.utils.skyblock.dungeon.DungeonUtils")

const rotationNumber = new Map([
    ["NORTH", 0],
    ["WEST", -1],
    ["SOUTH", 2],
    ["EAST", 1]
])


export const convertToRelative = (realCoord) => {
    if (!realCoord) return null
    const currRoom = dungeonUtils.INSTANCE.currentRoom;
    if (!currRoom) return JSON.parse(JSON.stringify(realCoord))
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
    if (!currRoom) return JSON.parse(JSON.stringify(relativeCoord))
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
const extractCoord = (String) => {
    const match = String.match(coordRegex);
    if (match) {
        const x = parseInt(match[1], 10);
        const y = parseInt(match[2], 10);
        const z = parseInt(match[3], 10);
        return [x, y, z]
    } else {
        console.log("No match found.");
    }
}