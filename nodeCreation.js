import {@ButtonProperty, @CheckboxProperty, @ColorProperty, @PercentSliderProperty, @SelectorProperty, @SwitchProperty, @TextProperty, @Vigilant, @SliderProperty, @NumberProperty, @DecimalSliderProperty} from '../Vigilance/index';

@Vigilant("AutoRoutes")
class Settings {
    constructor() {
        this.initialize(this);
        this.setCategoryDescription("Route", "Node Creation");
        this.addDependency("Item name to use", "show itemName")
        this.addDependency("Stop sneaking", "show stopSneaking")
        this.addDependency("Etherwarp Coordinate Mode", "show etherCoordMode")
        this.addDependency("Yaw", "show yaw")
        this.addDependency("Pitch", "show pitch")
        this.addDependency("Etherwarp Block Coordinates", "show etherBlock")
        this.addDependency("Await line of sight", "show blockArg")
        this.addDependency("Await secret pickup, skull, lever click or bat death", "show awaitSecret")
        this.addDependency("Await bat spawning", "show awaitBatSpawn")
        this.addDependency("Pearl VClip Distance", "show pearlClipDistance")
        this.addDependency("Command", "show commandArgs")

    }

    @SwitchProperty({
        name: "Chained",
        description: "Only trigger this node if another node has been executed in the last 500ms, or if you left click inside the node.",
        category: "Route"
    })
    chained = false

    @SwitchProperty({
        name: "Center",
        description: "Puts you right in the center of where the NODE is located. Note that this also modifies your Y level, so it may not work and just lagback if your node is extremely tall. Useful to align yourself if you aren't starting in the middle of the block.",
        category: "Route"
    })
    center = false

    @SwitchProperty({
        name: "Stop",
        description: "Stops all movement when you trigger this node.",
        category: "Route"
    })
    stop = false

    @DecimalSliderProperty({
        name: "Radius",
        description: "Radius of the node.",
        category: "Route",
        minF: 0.15,
        maxF: 2,
        decimalPlaces: 2
    })
    radius = 0.5;

    @TextProperty({
        name: "Height",
        description: "Height of the node.",
        category: "Route",
    })
    height = "0.1";

    @SelectorProperty({
        name: "Node type",
        description: "Select an option",
        category: "Route",
        options: ["Look", "Etherwarp", "Use Item", "Walk", "Superboom", "Pearl VClip", "Command"]
    })
    type = 1;


    @TextProperty({
        name: "Item name to use",
        description: "",
        category: "Route",
        subcategory: "Rotation"
    })
    itemName = ""

    @SwitchProperty({
        name: "Stop sneaking",
        description: "Makes you stop sneaking before executing the node.",
        category: "Route"
    })
    stopSneaking = false

    @SelectorProperty({
        name: "Etherwarp Coordinate Mode",
        description: "RayTrace Scanning may be required for some TPs from extremely certain spots, it is very bad generally though. I recommend trying Calculate Yaw/Pitch and Yaw/Pitch before trying it.",
        category: "Route",
        options: ["RayTrace Scanning", "Yaw/Pitch", "Calculate Yaw/Pitch"]
    })
    etherCoordMode = 0;

    @TextProperty({
        name: "Yaw",
        description: "Number between -180 and 180.",
        category: "Route"
    })
    yaw = ""

    @TextProperty({
        name: "Pitch",
        description: "Number between -90 and 90.",
        category: "Route"
    })
    pitch = ""

    @TextProperty({
        name: "Etherwarp Block Coordinates",
        description: "Seperated by commas.",
        category: "Route"
    })
    etherBlock = "";

    @SwitchProperty({
        name: "Await line of sight",
        description: "Waits for the specified Etherwarp block to be visible before etherwarping.",
        category: "Route"
    })
    block = false

    @SwitchProperty({
        name: "Await secret pickup, skull, lever click or bat death",
        description: "",
        category: "Route"
    })
    awaitSecret = false

    @SwitchProperty({
        name: "Await bat spawning",
        description: "Waits for a bat to spawn within 15 blocks of you. Used so you can kill it after it spawns or something idk",
        category: "Route"
    })
    awaitBatSpawn = false

    @TextProperty({
        name: "Pearl VClip Distance",
        description: "How many blocks to clip down. If this is set to 0 it will attempt to scan for an air opening below you, however note this may be inaccurate or put you in the fucking void",
        category: "Route"
    })
    pearlClipDistance = ""

    @TextProperty({
        name: "Command",
        description: "Make sure to omit the first backslash.",
        category: "Route"
    })
    commandArgs = ""

    @TextProperty({
        name: "Node Delay",
        description: "If you are stacking multiple nodes together to perform multiple actions (e.g throwing 2 pearls), each individual node should have a delay of at least 150ms more than the last one to work properly. This only matters for nodes that use server rotations.",
        category: "Route"
    })
    delay = ""

    @SwitchProperty({
        name: "show itemName",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showItemName = false

    @SwitchProperty({
        name: "show stopSneaking",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showStopSneaking = false
    @SwitchProperty({
        name: "show etherCoordMode",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showEtherCoordMode = false
    @SwitchProperty({
        name: "show yaw",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showYaw = false
    @SwitchProperty({
        name: "show pitch",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showPitch = false
    @SwitchProperty({
        name: "show etherBlock",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showEtherBlock = false
    @SwitchProperty({
        name: "show awaitSecret",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showAwaitSecret = false

    @SwitchProperty({
        name: "show awaitBatSpawn",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showAwaitBatSpawn = false
    @SwitchProperty({
        name: "show pearlClipDistance",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showPearlClipDistance = false
    @SwitchProperty({
        name: "show commandArgs",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showCommandArgs = false

    @SwitchProperty({
        name: "show blockArg",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showBlockArg = false
}

export default new Settings()

export const nodeTypes = ["look", "etherwarp", "useitem", "walk", "superboom", "pearlclip", "command"]
export const availableArgs = new Map([
    ["look", ["yaw", "pitch"]],
    ["etherwarp", ["etherBlock", "etherCoordMode", "yaw", "pitch", "block"]],
    ["useitem", ["yaw", "pitch", "itemName", "stopSneaking", "awaitBatSpawn"]],
    ["walk", ["yaw", "pitch"]],
    ["superboom", ["yaw", "pitch"]],
    ["pearlclip", ["pearlClipDistance"]],
    ["command", ["commandArgs"]]
])
