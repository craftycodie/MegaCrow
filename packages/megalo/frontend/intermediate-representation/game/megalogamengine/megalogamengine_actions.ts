import { StringTableReference } from "../string_table";
import { CustomVariableReference, ObjectReference, ObjectTypeReference } from "./megalogamengine_references";

export enum ActionType {
    None,
    SetScore,
    CreateObject,
    DeleteObject,
    NavpointSetVisible,
    NavpointSetIcon,
    NavpointSetPriority,
    NavpointSetTimer,
    NavpointSetVisibleRange,
    Set,
    SetBoundary,
    ApplyPlayerTraits,
    SetPickupFilter,
    SetRespawnFilter,
    SetFireteamRespawnFilter,
    SetProgressBar,
    HudPostMessage,
    TimerSetRate,
    PrintVariable,
    GetPlayerHoldingObject,
    ForEach,
    EndRound,
    BoundarySetVisible,
    ObjectDestroy,
    ObjectSetInvincibility,
    Random,
    BreakIntoDebugger,
    ObjectGetOrientation,
    ObjectGetVelocity,
    PlayerDeathGetKillingPlayer,
    PlayerDeathGetDamageType,
    PlayerDeathGetSpecialType,
    DebuggingEnableTracing,
    ObjectAttach,
    ObjectDetach,
    PlayerGetPlace,
    TeamGetPlace,
    PlayerGetKillingSpreeCount,
    PlayerAdjustMoney,
    PlayerEnablePurchases,
    PlayerGetVehicle,
    PlayerSetVehicle,
    PlayerSetUnit,
    TimerReset,
    WeaponSetPickupPriority,
    ObjectBounce,
    HudWidgetSetText,
    HudWidgetSetValue,
    HudWidgetSetMeter,
    HudWidgetSetIcon,
    HudWidgetSetVisibility,
    PlaySound,
    ObjectSetScale,
    NavpointSetText,
    ObjectGetShield,
    ObjectGetHealth,
    PlayerSetObjective,
    PlayerSetObjectiveAllegiance,
    PlayerSetObjectiveAllegianceIcon,
    TeamSetCoopSpawning,
    TeamSetPrimaryRespawnObject,
    PlayerSetPrimaryRespawnObject,
    PlayerGetFireteamIndex,
    PlayerSetFireteamIndex,
    ObjectAdjustShield,
    ObjectAdjustHealth,
    ObjectGetDistance,
    ObjectAdjustMaximumShield,
    ObjectAdjustMaximumHealth,
    PlayerSetRequisitionPalette,
    DeviceSetPower,
    DeviceGetPower,
    DeviceSetPosition,
    DeviceGetPosition,
    AdjustGrenades,
    SubmitIncident,
    SubmitIncidentWithCustomValue,
    SetLoadoutPalette,
    DeviceSetPositionTrack,
    DeviceAnimatePosition,
    DeviceSetPositionImmediate,
    SavedFilmInsertMarker,
    RespawnZoneEnable,
    PlayerGetWeapon,
    PlayerGetEquipment,
    ObjectSetNeverGarbage,
    PlayerGetTargetObject,
    CreateTunnel,
    DebugForcePlayerViewCount,
    PlayerPickUpWeapon,
    PlayerSetCoopSpawning,
    ObjectSetOrientation,
    ObjectFaceObject,
    BipedGiveWeapon,
    BipedDropWeapon,
    SetScenarioInterpolatorState,
    GetRandomObject,
    GameGriefRecordCustomPenalty,
    BoundarySetPlayerColor,
    Begin,
    HsFunctionCall,
    GetButtonTime,
    TeamSetVehicleSpawning,
    PlayerSetVehicleSpawning,
    SetPlayerRespawnVehicle,
    SetTeamRespawnVehicle,
    HideObject,
}

type ActionParameters<T extends ActionType, P> = {
    type: T;
    parameters: P;
}

export enum TeamOrPlayerTarget {
    Team = 0,
    Player = 1,
    Everyone = 2,
}

export enum MathOperation {
    Add = 0,
    Subtract = 1,
    Multiply = 2,
    Divide = 3,
    SetTo = 4,
    Modulo = 5,
    And = 6,
    Or = 7,
    Xor = 8,
    Not = 9,
    LShift = 10,
    RShift = 11,
    Abs = 12,
}

export type SetScoreParameters = {
    target: TeamOrPlayerTarget;
    operation: MathOperation;
    variable: CustomVariableReference;
}

export type CreateObjectParameters = {
    objectType: ObjectTypeReference;
    place_at_object: ObjectReference;
    object_reference_out?: ObjectReference;
    labelIndex?: StringTableReference; // not 100% sure about this
    offset?: number;
    variantNameIndex?: number; // object_lists/stringids.txt ?
    neverGarbageCollect?: boolean;
    suppressEffect?: boolean;
    absoluteOrientation?: boolean;
}

export type DeleteObjectParameters = {
    object: ObjectReference;
}

export type NavpointSetVisibleParameters = {
    navpoint: ObjectReference;
    visible: boolean;
}

export type NavpointSetIconParameters = {
    navpoint: ObjectReference;
    icon: StringTableReference;
}

export enum NavpointPriority {
    Low = 0,
    Normal = 1,
    High = 2,
    Blink = 3,
}

export type NavpointSetPriorityParameters = {
    navpoint: ObjectReference;
    priority: NavpointPriority;
}

export type NavpointSetTimerParameters = {
    navpoint: ObjectReference;
    timerIndex: number;
}

export type NavpointSetVisibleRangeParameters = {
    navpoint: ObjectReference;
    minFeet: CustomVariableReference;
    maxFeet: CustomVariableReference;
}

export type SetParameters = {
    left: CustomVariableReference;
    operation: MathOperation;
    right: CustomVariableReference;
}

export type Action =
    | ActionParameters<ActionType.SetScore, SetScoreParameters>
    | ActionParameters<ActionType.CreateObject, CreateObjectParameters>
    | ActionParameters<ActionType.DeleteObject, DeleteObjectParameters>
    | ActionParameters<ActionType.NavpointSetVisible, NavpointSetVisibleParameters>
    | ActionParameters<ActionType.NavpointSetIcon, NavpointSetIconParameters>
    | ActionParameters<ActionType.NavpointSetPriority, NavpointSetPriorityParameters>
    | ActionParameters<ActionType.NavpointSetTimer, NavpointSetTimerParameters>
    | ActionParameters<ActionType.NavpointSetVisibleRange, NavpointSetVisibleRangeParameters>
    | ActionParameters<ActionType.Set, SetParameters>
    // TODO: Finish the rest of the actions
;