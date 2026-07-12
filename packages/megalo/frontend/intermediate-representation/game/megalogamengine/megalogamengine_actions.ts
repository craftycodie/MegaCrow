import { ValueWithLocation } from "../..";
import { StringTableReference } from "../string_table";
import { HUDMeterInputType } from "./megalogamengine_hud_widgets";
import { CustomTimerReference, CustomVariableReference, ObjectReference, ObjectTypeReference, PlayerReference, TeamReference } from "./megalogamengine_references";
import { MegaloSound } from "./megalogamengine_sounds";
import { DynamicString } from "./megalogamengine_text";

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
    type: ValueWithLocation<T>;
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
    target: ValueWithLocation<TeamOrPlayerTarget>;
    operation: ValueWithLocation<MathOperation>;
    variable: ValueWithLocation<CustomVariableReference>;
}

export type ObjectOffset = {
    x: ValueWithLocation<number>;
    y: ValueWithLocation<number>;
    z: ValueWithLocation<number>;
}

export type CreateObjectParameters = {
    objectType: ValueWithLocation<ObjectTypeReference>;
    place_at_object: ValueWithLocation<ObjectReference>;
    object_reference_out?: ValueWithLocation<ObjectReference>;
    labelIndex?: StringTableReference; // not 100% sure about this
    offset?: ValueWithLocation<ObjectOffset>;
    variantNameIndex?: ValueWithLocation<number>; // object_lists/stringids.txt ?
    neverGarbageCollect?: ValueWithLocation<boolean>;
    suppressEffect?: ValueWithLocation<boolean>;
    absoluteOrientation?: ValueWithLocation<boolean>;
}

export type DeleteObjectParameters = {
    object: ValueWithLocation<ObjectReference>;
}

export type NavpointSetVisibleParameters = {
    navpoint: ValueWithLocation<ObjectReference>;
    visible: ValueWithLocation<boolean>;
}

export type NavpointSetIconParameters = {
    navpoint: ValueWithLocation<ObjectReference>;
    icon: ValueWithLocation<StringTableReference>;
}

export enum NavpointPriority {
    Low = 0,
    Normal = 1,
    High = 2,
    Blink = 3,
}

export type NavpointSetPriorityParameters = {
    navpoint: ValueWithLocation<ObjectReference>;
    priority: ValueWithLocation<NavpointPriority>;
}

export type NavpointSetTimerParameters = {
    navpoint: ValueWithLocation<ObjectReference>;
    timerIndex: ValueWithLocation<number>;
}

export type NavpointSetVisibleRangeParameters = {
    navpoint: ValueWithLocation<ObjectReference>;
    minFeet: ValueWithLocation<CustomVariableReference>;
    maxFeet: ValueWithLocation<CustomVariableReference>;
}

export type SetParameters = {
    left: ValueWithLocation<CustomVariableReference>;
    operation: ValueWithLocation<MathOperation>;
    right: ValueWithLocation<CustomVariableReference>;
}

export enum BoundaryShape {
    Sphere = 0,
    Box = 1,
    Cylinder = 2,
}

type SphereBoundaryParameters = {
    shape: ValueWithLocation<BoundaryShape.Sphere>;
    radius: ValueWithLocation<CustomVariableReference>;
}

type BoxBoundaryParameters = {
    shape: ValueWithLocation<BoundaryShape.Box>;
    width: ValueWithLocation<CustomVariableReference>;
    height: ValueWithLocation<CustomVariableReference>;
    depth: ValueWithLocation<CustomVariableReference>;
}

type CylinderBoundaryParameters = {
    shape: ValueWithLocation<BoundaryShape.Cylinder>;
    radius: ValueWithLocation<CustomVariableReference>;
    height: ValueWithLocation<CustomVariableReference>;
}

export type SetBoundaryParameters = {
    object: ValueWithLocation<ObjectReference>;
} & (
  | SphereBoundaryParameters
  | BoxBoundaryParameters
  | CylinderBoundaryParameters
)

export type ApplyPlayerTraitsParameters = {
    player: ValueWithLocation<PlayerReference>;
    traitIndex: ValueWithLocation<number>;
}

export type FireteamFilter = {
    fireteam1: boolean;
    fireteam2: boolean;
    fireteam3: boolean;
    fireteam4: boolean;
    fireteam5: boolean;
    fireteam6: boolean;
    fireteam7: boolean;
    fireteam8: boolean;
}

export type SetFireteamRespawnFilterParameters = {
    object: ValueWithLocation<ObjectReference>;
    fireteamFilter: ValueWithLocation<FireteamFilter>;
}

export enum PlayerFilterType {
    NoOne = 0,
    Everyone = 1,
    Allies = 2,
    Enemies = 3,
    SpecificPlayer = 4,
    Normal = 5,
}

export type PlayerFilterModifier = {
    type: ValueWithLocation<Exclude<PlayerFilterType, PlayerFilterType.SpecificPlayer>>;
} | {
    type: ValueWithLocation<PlayerFilterType.SpecificPlayer>;
    player: ValueWithLocation<PlayerReference>;
    visible: ValueWithLocation<CustomVariableReference>;
}

export type SetProgressBarParameters = {
    object: ValueWithLocation<ObjectReference>;
    playerFilterModifier: ValueWithLocation<PlayerFilterModifier>;
    timerIndex: ValueWithLocation<number>;
}

export type HudPostMessageParameters = {
    target: ValueWithLocation<TeamOrPlayerTarget>;
    soundIndex: ValueWithLocation<MegaloSound>;
    string: ValueWithLocation<DynamicString>;
}

export enum GameEngineTimerRate {
    Zero = 0,
    Negative_10x = 1,
    Negative_25x = 2,
    Negative_50x = 3,
    Negative_75x = 4,
    Negative_100x = 5,
    Negative_125x = 6,
    Negative_150x = 7,
    Negative_175x = 8,
    Negative_200x = 9,
    Negative_300x = 10,
    Negative_400x = 11,
    Negative_500x = 12,
    Negative_1000x = 13,
    Positive_10x = 14,
    Positive_25x = 15,
    Positive_50x = 16,
    Positive_75x = 17,
    Positive_100x = 18,
    Positive_125x = 19,
    Positive_150x = 20,
    Positive_175x = 21,
    Positive_200x = 22,
    Positive_300x = 23,
    Positive_400x = 24,
    Positive_500x = 25,
    Positive_1000x = 26,
}

export type TimerSetRateParameters = {
    timer: ValueWithLocation<CustomTimerReference>;
    rate: ValueWithLocation<GameEngineTimerRate>;
}

export type ForEachParameters = {
    triggerIndex: ValueWithLocation<number>;
}

export type ObjectDestroyParameters = {
    object: ValueWithLocation<ObjectReference>;
    noStatistics?: ValueWithLocation<boolean>;
}

export type ObjectAttachParameters = {
    child: ValueWithLocation<ObjectReference>;
    parent: ValueWithLocation<ObjectReference>;
    offset: ValueWithLocation<ObjectOffset>;
    absoluteOrientation?: ValueWithLocation<boolean>;
}

export type PlayerAdjustMoneyParameters = {
    player: ValueWithLocation<PlayerReference>;
    operation: ValueWithLocation<MathOperation>;
    amount: ValueWithLocation<CustomVariableReference>;
}

export type PlayerPurchaseMode = {
    aliveWeapons: boolean;
    aliveEquipment: boolean;
    aliveVehicles: boolean;
    deadWeapons: boolean;
    deadEquipment: boolean;
}

export type PlayerEnablePurchasesParameters = {
    player: ValueWithLocation<PlayerReference>;
    selectedModes: ValueWithLocation<PlayerPurchaseMode>;
    enabled: ValueWithLocation<CustomVariableReference>;
}

export enum WeaponPickupPriority {
    Normal = 0,
    Special = 1,
    Automatic = 2,
}

export type WeaponSetPickupPriorityParameters = {
    weapon: ValueWithLocation<ObjectReference>;
    priority: ValueWithLocation<WeaponPickupPriority>;
}


export type HUDWidgetSetTextParameters = {
    widgetIndex: ValueWithLocation<number>;
    string: ValueWithLocation<DynamicString>;
}

type HUDMeterInputNumber = {
    meterType: ValueWithLocation<HUDMeterInputType.Number>;
    value: ValueWithLocation<CustomVariableReference>;
    max: ValueWithLocation<CustomVariableReference>;
}

type HUDMeterInputTimer = {
    meterType: ValueWithLocation<HUDMeterInputType.Timer>;
    timer: ValueWithLocation<CustomTimerReference>;
}

export type HUDMeterInput = 
    | HUDMeterInputNumber 
    | HUDMeterInputTimer;

export type HUDWidgetSetMeterParameters = {
    widgetIndex: number;
    meterInput: HUDMeterInput;
}

export type HUDWidgetSetIconParameters = {
    widgetIndex: number;
    iconIndex: ValueWithLocation<number>; // object_lists/hud_widget_icons.txt
}

export type HUDWidgetSetVisibilityParameters = {
    widgetIndex: number;
    player: ValueWithLocation<PlayerReference>;
    visible: boolean;
}

export type PlaySoundParameters = {
    soundIndex: ValueWithLocation<MegaloSound>;
    immediate: ValueWithLocation<boolean>;
    target: ValueWithLocation<TeamOrPlayerTarget>;
}

export type VitalityAdjustmentParameters = {
    object: ValueWithLocation<ObjectReference>;
    operation: ValueWithLocation<MathOperation>;
    amount: ValueWithLocation<CustomVariableReference>;
}

export type PlayerSetRequisitionPaletteParameters = {
    player: ValueWithLocation<PlayerReference>;
    requisitionPaletteIndex: number;
}

export enum GrenadeType {
    Frag = 0,
    Plasma = 1,
}

export type AdjustGrenadesParameters = {
    player: ValueWithLocation<PlayerReference>;
    grenadeType: ValueWithLocation<GrenadeType>;
    operation: ValueWithLocation<MathOperation>;
    amount: ValueWithLocation<CustomVariableReference>;
}

export type SubmitIncidentParameters = {
    statIndex: number;
    cause: ValueWithLocation<TeamOrPlayerTarget>;
    effect: ValueWithLocation<TeamOrPlayerTarget>;
}

export type SubmitIncidentWithCustomValueParameters = {
    statIndex: number;
    cause: ValueWithLocation<TeamOrPlayerTarget>;
    effect: ValueWithLocation<TeamOrPlayerTarget>;
    customValue: ValueWithLocation<CustomVariableReference>;
}

export type SetLoadoutPaletteParameters = {
    target: ValueWithLocation<TeamOrPlayerTarget>;
    loadoutPaletteIndex: number;
}

export type PlayerGiveWeaponParameters = {
    player: ValueWithLocation<PlayerReference>;
    primary: boolean;
    weapon: ValueWithLocation<ObjectReference>;
}

export type CreateTunnelParameters = {
    from: ValueWithLocation<ObjectReference>;
    to: ValueWithLocation<ObjectReference>;
    objectType: ValueWithLocation<ObjectTypeReference>;
    radious: ValueWithLocation<CustomVariableReference>;
    objectReferenceOut: ValueWithLocation<ObjectReference>;
}

export type PlayerSetCoopSpawningParameters = {
    player: ValueWithLocation<PlayerReference>;
    enabled: boolean;
}

export type ObjectSetOrientationParameters = {
    object: ValueWithLocation<ObjectReference>;
    source: ValueWithLocation<ObjectReference>;
    absoluteOrientation?: ValueWithLocation<boolean>;
}

export type ObjectFaceObjectParameters = {
    object: ValueWithLocation<ObjectReference>;
    target: ValueWithLocation<ObjectReference>;
    offset?: ValueWithLocation<ObjectOffset>;
}

export enum BipedGiveWeaponMode {
    Primary = 0,
    Secondary = 1,
    Force = 2,
}

export type BipedGiveWeaponParameters = {
    biped: ValueWithLocation<ObjectReference>;
    weapon: ValueWithLocation<ObjectReference>;
    mode: ValueWithLocation<BipedGiveWeaponMode>;
}

export type BipedDropWeaponParameters = {
    biped: ValueWithLocation<ObjectReference>;
    primary: ValueWithLocation<boolean>;
    deleteOnDrop: boolean;
}

export type GetRandomObjectParameters = {
    filterIndex: number;
    ignoreObject: ValueWithLocation<ObjectReference>;
    objectOut: ValueWithLocation<ObjectReference>;
}

export type BoundarySetPlayerColorParameters = {
    object: ValueWithLocation<ObjectReference>;
    playerIndex: number;
}

export type BeginParameters = {
    firstConditionIndex: number;
    conditionCount: number;
    firstActionIndex: number;
    actionCount: number;
}

export type HsFunctionCallParameters = {
    functionNameIndex: number; // object_lists/stringids.txt
}

export enum ScriptableGameButtons {
    Jump = 0,
    Grenade = 1,
    SwitchWeapon = 2,
    ContextPrimary = 3,
    MeleeAttack = 4,
    Equipment = 5,
    ThrowGrenade = 6,
    FirePrimary = 7,
    Crouch = 8,
    ScopeZoom = 9,
    NightVision = 10,
    FireSecondary = 11,
    FireTertiary = 12,
    VehicleTrick = 13,
}

export type GetButtonTimeParameters = {
    player: ValueWithLocation<PlayerReference>;
    button: ValueWithLocation<ScriptableGameButtons>;
    timeOut: ValueWithLocation<CustomVariableReference>;
}

export type TeamSetVehicleSpawningParameters = {
    team: ValueWithLocation<TeamReference>;
    enabled: boolean;
}

export type PlayerSetVehicleSpawningParameters = {
    player: ValueWithLocation<PlayerReference>;
    enabled: boolean;
}

export type SetPlayerRespawnVehicleParameters = {
    objectType: ValueWithLocation<ObjectTypeReference>;
    player: ValueWithLocation<PlayerReference>;
}

export type SetTeamRespawnVehicleParameters = {
    objectType: ValueWithLocation<ObjectTypeReference>;
    team: ValueWithLocation<TeamReference>;
}

export type HideObjectParameters = {
    object: ValueWithLocation<ObjectReference>;
    shouldHide: boolean;
}

export type PrintVariableParameters = {
    string: ValueWithLocation<DynamicString>;
}

export type GetPlayerHoldingObjectParameters = {
    object: ValueWithLocation<ObjectReference>;
    playerOut: ValueWithLocation<PlayerReference>;
}

export type EndRoundParameters = never;

export type BoundarySetVisibleParameters = {
    object: ValueWithLocation<ObjectReference>;
    playerFilterModifier: ValueWithLocation<PlayerFilterModifier>;
}

export type ObjectSetInvincibilityParameters = {
    object: ValueWithLocation<ObjectReference>;
    invincible: ValueWithLocation<CustomVariableReference>;
}

export type RandomParameters = {
    range: ValueWithLocation<CustomVariableReference>;
    valueOut: ValueWithLocation<CustomVariableReference>;
}

export type ObjectGetOrientationParameters = {
    object: ValueWithLocation<ObjectReference>;
    orientationOut: ValueWithLocation<CustomVariableReference>;
}

export type ObjectGetVelocityParameters = {
    object: ValueWithLocation<ObjectReference>;
    velocityOut: ValueWithLocation<CustomVariableReference>;
}

export type PlayerDeathGetKillingPlayerParameters = {
    deadPlayer: ValueWithLocation<PlayerReference>;
    killingPlayerOut: ValueWithLocation<PlayerReference>;
}

export type PlayerDeathGetDamageTypeParameters = {
    deadPlayer: ValueWithLocation<PlayerReference>;
    damageTypeOut: ValueWithLocation<CustomVariableReference>;
}

export type PlayerDeathGetSpecialTypeParameters = {
    deadPlayer: ValueWithLocation<PlayerReference>;
    specialTypeOut: ValueWithLocation<CustomVariableReference>;
}

export type DebuggingEnableTracingParameters = {
    tracingEnabled: boolean;
}

export type ObjectDetachParameters = {
    object: ValueWithLocation<ObjectReference>;
}

export type PlayerGetPlaceParameters = {
    player: ValueWithLocation<PlayerReference>;
    placeOut: ValueWithLocation<CustomVariableReference>;
}

export type TeamGetPlaceParameters = {
    team: ValueWithLocation<TeamReference>;
    placeOut: ValueWithLocation<CustomVariableReference>;
}

export type PlayerGetKillingSpreeCountParameters = {
    player: ValueWithLocation<PlayerReference>;
    spreeCountOut: ValueWithLocation<CustomVariableReference>;
}

export type PlayerGetVehicleParameters = {
    player: ValueWithLocation<PlayerReference>;
    vehicleOut: ValueWithLocation<ObjectReference>;
}

export type PlayerSetVehicleParameters = {
    player: ValueWithLocation<PlayerReference>;
    vehicle: ValueWithLocation<ObjectReference>;
}

export type PlayerSetUnitParameters = {
    player: ValueWithLocation<PlayerReference>;
    unit: ValueWithLocation<ObjectReference>;
}

export type TimerResetParameters = {
    timer: ValueWithLocation<CustomTimerReference>;
}

export type ObjectBounceParameters = {
    object: ValueWithLocation<ObjectReference>;
}

export type HUDWidgetSetValueParameters = {
    widgetIndex: number;
    value: ValueWithLocation<CustomVariableReference>;
}

export type ObjectSetScaleParameters = {
    object: ValueWithLocation<ObjectReference>;
    scale: ValueWithLocation<CustomVariableReference>;
}

export type NavpointSetTextParameters = {
    object: ValueWithLocation<ObjectReference>;
    string: ValueWithLocation<DynamicString>;
}

export type ObjectGetShieldParameters = {
    object: ValueWithLocation<ObjectReference>;
    variable: ValueWithLocation<CustomVariableReference>;
}

export type ObjectGetHealthParameters = {
    object: ValueWithLocation<ObjectReference>;
    variable: ValueWithLocation<CustomVariableReference>;
}

export type PlayerSetObjectiveParameters = {
    player: ValueWithLocation<PlayerReference>;
    objective: ValueWithLocation<DynamicString>;
}

export type PlayerSetObjectiveAllegianceParameters = {
    player: ValueWithLocation<PlayerReference>;
    allegiance: ValueWithLocation<DynamicString>;
}

export type PlayerSetObjectiveAllegianceIconParameters = {
    player: ValueWithLocation<PlayerReference>;
    iconIndex: number; // object_lists/hud_widget_icons.txt
}

export type TeamSetCoopSpawningParameters = {
    team: ValueWithLocation<TeamReference>;
    coopSpawningEnabled: boolean;
}

export type TeamSetPrimaryRespawnObjectParameters = {
    team: ValueWithLocation<TeamReference>;
    respawnObject: ValueWithLocation<ObjectReference>;
}

export type PlayerSetPrimaryRespawnObjectParameters = {
    player: ValueWithLocation<PlayerReference>;
    respawnObject: ValueWithLocation<ObjectReference>;
}

export type PlayerGetFireteamIndexParameters = {
    player: ValueWithLocation<PlayerReference>;
    fireteamIndexOut: ValueWithLocation<CustomVariableReference>;
}

export type PlayerSetFireteamIndexParameters = {
    player: ValueWithLocation<PlayerReference>;
    fireteamIndex: ValueWithLocation<CustomVariableReference>;
}

export type ObjectAdjustShieldParameters = {
    object: ValueWithLocation<ObjectReference>;
    operation: ValueWithLocation<MathOperation>;
    amount: ValueWithLocation<CustomVariableReference>;
}

export type ObjectAdjustHealthParameters = {
    object: ValueWithLocation<ObjectReference>;
    operation: ValueWithLocation<MathOperation>;
    amount: ValueWithLocation<CustomVariableReference>;
}

export type ObjectAdjustMaximumShieldParameters = {
    object: ValueWithLocation<ObjectReference>;
    operation: ValueWithLocation<MathOperation>;
    amount: ValueWithLocation<CustomVariableReference>;
}

export type ObjectAdjustMaximumHealthParameters = {
    object: ValueWithLocation<ObjectReference>;
    operation: ValueWithLocation<MathOperation>;
    amount: ValueWithLocation<CustomVariableReference>;
}

export type ObjectGetDistanceParameters = {
    from: ValueWithLocation<ObjectReference>;
    to: ValueWithLocation<ObjectReference>;
    distanceOut: ValueWithLocation<CustomVariableReference>;
}

export type DeviceSetPowerParameters = {
    object: ValueWithLocation<ObjectReference>;
    power: ValueWithLocation<CustomVariableReference>;
}

export type DeviceGetPowerParameters = {
    object: ValueWithLocation<ObjectReference>;
    powerOut: ValueWithLocation<CustomVariableReference>;
}

export type DeviceSetPositionParameters = {
    object: ValueWithLocation<ObjectReference>;
    position: ValueWithLocation<CustomVariableReference>;
}

export type DeviceGetPositionParameters = {
    object: ValueWithLocation<ObjectReference>;
    positionOut: ValueWithLocation<CustomVariableReference>;
}

export type DeviceSetPositionTrackParameters = {
    object: ValueWithLocation<ObjectReference>;
    animationNameIndex: number; // object_lists/stringids.txt ?
    interpolationTime: ValueWithLocation<CustomVariableReference>;
}

export type DeviceAnimatePositionParameters = {
    object: ValueWithLocation<ObjectReference>;
    animationTargetFraction: ValueWithLocation<CustomVariableReference>;
    animationDurationSeconds: ValueWithLocation<CustomVariableReference>;
    accelerationSeconds: ValueWithLocation<CustomVariableReference>;
    decelerationSeconds: ValueWithLocation<CustomVariableReference>;
}

export type DeviceSetPositionImmediateParameters = {
    object: ValueWithLocation<ObjectReference>;
    position: ValueWithLocation<CustomVariableReference>;
}

export type SavedFilmInsertMarkerParameters = {
    offsetSeconds: ValueWithLocation<CustomVariableReference>;
    label: ValueWithLocation<DynamicString>;
}

export type RespawnZoneEnableParameters = {
    respawnZone: ValueWithLocation<ObjectReference>;
    enabled: ValueWithLocation<CustomVariableReference>;
}

export type PlayerGetEquipmentParameters = {
    player: ValueWithLocation<PlayerReference>;
    equipmentOut: ValueWithLocation<ObjectReference>;
}

export type ObjectSetNeverGarbageParameters = {
    object: ValueWithLocation<ObjectReference>;
    neverGarbage: ValueWithLocation<CustomVariableReference>;
}

export type PlayerGetTargetObjectParameters = {
    player: ValueWithLocation<PlayerReference>;
    objectOut: ValueWithLocation<ObjectReference>;
}

export type DebugForcePlayerViewCountParameters = {
    viewCount: ValueWithLocation<CustomVariableReference>;
}

export type PlayerPickUpWeaponParameters = {
    player: ValueWithLocation<PlayerReference>;
    weapon: ValueWithLocation<ObjectReference>;
}

export type SetScenarioInterpolatorStateParameters = {
    interpolatorIndex: ValueWithLocation<CustomVariableReference>;
    active: ValueWithLocation<CustomVariableReference>;
}

export type GameGriefRecordCustomPenaltyParameters = {
    player: ValueWithLocation<PlayerReference>;
    variable: ValueWithLocation<CustomVariableReference>;
}

export type SetPickupFilterParameters = {
    object: ValueWithLocation<ObjectReference>;
    playerFilterModifier: ValueWithLocation<PlayerFilterModifier>;
}

export type SetRespawnFilterParameters = {
    object: ValueWithLocation<ObjectReference>;
    playerFilterModifier: ValueWithLocation<PlayerFilterModifier>;
}

export type BreakIntoDebuggerParameters = never;

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
    | ActionParameters<ActionType.SetBoundary, SetBoundaryParameters>
    | ActionParameters<ActionType.ApplyPlayerTraits, ApplyPlayerTraitsParameters>
    | ActionParameters<ActionType.SetPickupFilter, SetPickupFilterParameters>
    | ActionParameters<ActionType.SetRespawnFilter, SetRespawnFilterParameters>
    | ActionParameters<ActionType.SetFireteamRespawnFilter, SetFireteamRespawnFilterParameters>
    | ActionParameters<ActionType.SetProgressBar, SetProgressBarParameters>
    | ActionParameters<ActionType.HudPostMessage, HudPostMessageParameters>
    | ActionParameters<ActionType.TimerSetRate, TimerSetRateParameters>
    | ActionParameters<ActionType.PrintVariable, PrintVariableParameters>
    | ActionParameters<ActionType.GetPlayerHoldingObject, GetPlayerHoldingObjectParameters>
    | ActionParameters<ActionType.ForEach, ForEachParameters>
    | ActionParameters<ActionType.EndRound, EndRoundParameters>
    | ActionParameters<ActionType.BoundarySetVisible, BoundarySetVisibleParameters>
    | ActionParameters<ActionType.ObjectDestroy, ObjectDestroyParameters>
    | ActionParameters<ActionType.ObjectSetInvincibility, ObjectSetInvincibilityParameters>
    | ActionParameters<ActionType.Random, RandomParameters>
    | ActionParameters<ActionType.BreakIntoDebugger, BreakIntoDebuggerParameters>
    | ActionParameters<ActionType.ObjectGetOrientation, ObjectGetOrientationParameters>
    | ActionParameters<ActionType.ObjectGetVelocity, ObjectGetVelocityParameters>
    | ActionParameters<ActionType.PlayerDeathGetKillingPlayer, PlayerDeathGetKillingPlayerParameters>
    | ActionParameters<ActionType.PlayerDeathGetDamageType, PlayerDeathGetDamageTypeParameters>
    | ActionParameters<ActionType.PlayerDeathGetSpecialType, PlayerDeathGetSpecialTypeParameters>
    | ActionParameters<ActionType.DebuggingEnableTracing, DebuggingEnableTracingParameters>
    | ActionParameters<ActionType.ObjectAttach, ObjectAttachParameters>
    | ActionParameters<ActionType.ObjectDetach, ObjectDetachParameters>
    | ActionParameters<ActionType.PlayerGetPlace, PlayerGetPlaceParameters>
    | ActionParameters<ActionType.TeamGetPlace, TeamGetPlaceParameters>
    | ActionParameters<ActionType.PlayerGetKillingSpreeCount, PlayerGetKillingSpreeCountParameters>
    | ActionParameters<ActionType.PlayerAdjustMoney, PlayerAdjustMoneyParameters>
    | ActionParameters<ActionType.PlayerEnablePurchases, PlayerEnablePurchasesParameters>
    | ActionParameters<ActionType.PlayerGetVehicle, PlayerGetVehicleParameters>
    | ActionParameters<ActionType.PlayerSetVehicle, PlayerSetVehicleParameters>
    | ActionParameters<ActionType.PlayerSetUnit, PlayerSetUnitParameters>
    | ActionParameters<ActionType.TimerReset, TimerResetParameters>
    | ActionParameters<ActionType.WeaponSetPickupPriority, WeaponSetPickupPriorityParameters>
    | ActionParameters<ActionType.ObjectBounce, ObjectBounceParameters>
    | ActionParameters<ActionType.HudWidgetSetText, HUDWidgetSetTextParameters>
    | ActionParameters<ActionType.HudWidgetSetValue, HUDWidgetSetValueParameters>
    | ActionParameters<ActionType.HudWidgetSetMeter, HUDWidgetSetMeterParameters>
    | ActionParameters<ActionType.HudWidgetSetIcon, HUDWidgetSetIconParameters>
    | ActionParameters<ActionType.HudWidgetSetVisibility, HUDWidgetSetVisibilityParameters>
    | ActionParameters<ActionType.PlaySound, PlaySoundParameters>
    | ActionParameters<ActionType.ObjectSetScale, ObjectSetScaleParameters>
    | ActionParameters<ActionType.NavpointSetText, NavpointSetTextParameters>
    | ActionParameters<ActionType.ObjectGetShield, ObjectGetShieldParameters>
    | ActionParameters<ActionType.ObjectGetHealth, ObjectGetHealthParameters>
    | ActionParameters<ActionType.PlayerSetObjective, PlayerSetObjectiveParameters>
    | ActionParameters<ActionType.PlayerSetObjectiveAllegiance, PlayerSetObjectiveAllegianceParameters>
    | ActionParameters<ActionType.PlayerSetObjectiveAllegianceIcon, PlayerSetObjectiveAllegianceIconParameters>
    | ActionParameters<ActionType.TeamSetCoopSpawning, TeamSetCoopSpawningParameters>
    | ActionParameters<ActionType.TeamSetPrimaryRespawnObject, TeamSetPrimaryRespawnObjectParameters>
    | ActionParameters<ActionType.PlayerSetPrimaryRespawnObject, PlayerSetPrimaryRespawnObjectParameters>
    | ActionParameters<ActionType.PlayerGetFireteamIndex, PlayerGetFireteamIndexParameters>
    | ActionParameters<ActionType.PlayerSetFireteamIndex, PlayerSetFireteamIndexParameters>
    | ActionParameters<ActionType.ObjectAdjustShield, ObjectAdjustShieldParameters>
    | ActionParameters<ActionType.ObjectAdjustHealth, ObjectAdjustHealthParameters>
    | ActionParameters<ActionType.ObjectAdjustMaximumShield, ObjectAdjustMaximumShieldParameters>
    | ActionParameters<ActionType.ObjectAdjustMaximumHealth, ObjectAdjustMaximumHealthParameters>
    | ActionParameters<ActionType.ObjectGetDistance, ObjectGetDistanceParameters>
    | ActionParameters<ActionType.DeviceSetPower, DeviceSetPowerParameters>
    | ActionParameters<ActionType.DeviceGetPower, DeviceGetPowerParameters>
    | ActionParameters<ActionType.DeviceSetPosition, DeviceSetPositionParameters>
    | ActionParameters<ActionType.DeviceGetPosition, DeviceGetPositionParameters>
    | ActionParameters<ActionType.DeviceSetPositionTrack, DeviceSetPositionTrackParameters>
    | ActionParameters<ActionType.DeviceAnimatePosition, DeviceAnimatePositionParameters>
    | ActionParameters<ActionType.DeviceSetPositionImmediate, DeviceSetPositionImmediateParameters>
    | ActionParameters<ActionType.SavedFilmInsertMarker, SavedFilmInsertMarkerParameters>
    | ActionParameters<ActionType.RespawnZoneEnable, RespawnZoneEnableParameters>
    | ActionParameters<ActionType.PlayerGetEquipment, PlayerGetEquipmentParameters>
    | ActionParameters<ActionType.ObjectSetNeverGarbage, ObjectSetNeverGarbageParameters>
    | ActionParameters<ActionType.PlayerGetTargetObject, PlayerGetTargetObjectParameters>
    | ActionParameters<ActionType.DebugForcePlayerViewCount, DebugForcePlayerViewCountParameters>
    | ActionParameters<ActionType.PlayerPickUpWeapon, PlayerPickUpWeaponParameters>
    | ActionParameters<ActionType.SetScenarioInterpolatorState, SetScenarioInterpolatorStateParameters>
    | ActionParameters<ActionType.GameGriefRecordCustomPenalty, GameGriefRecordCustomPenaltyParameters>
    | ActionParameters<ActionType.BoundarySetPlayerColor, BoundarySetPlayerColorParameters>
    | ActionParameters<ActionType.Begin, BeginParameters>
    | ActionParameters<ActionType.HsFunctionCall, HsFunctionCallParameters>
    | ActionParameters<ActionType.GetButtonTime, GetButtonTimeParameters>
    | ActionParameters<ActionType.TeamSetVehicleSpawning, TeamSetVehicleSpawningParameters>
    | ActionParameters<ActionType.PlayerSetVehicleSpawning, PlayerSetVehicleSpawningParameters>
    | ActionParameters<ActionType.SetPlayerRespawnVehicle, SetPlayerRespawnVehicleParameters>
    | ActionParameters<ActionType.SetTeamRespawnVehicle, SetTeamRespawnVehicleParameters>
    | ActionParameters<ActionType.HideObject, HideObjectParameters>
;