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

export type ObjectOffset = {
    x: number;
    y: number;
    z: number;
}

export type CreateObjectParameters = {
    objectType: ObjectTypeReference;
    place_at_object: ObjectReference;
    object_reference_out?: ObjectReference;
    labelIndex?: StringTableReference; // not 100% sure about this
    offset?: ObjectOffset;
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

export enum BoundaryShape {
    Sphere = 0,
    Box = 1,
    Cylinder = 2,
}

type SphereBoundaryParameters = {
    shape: BoundaryShape.Sphere;
    radius: CustomVariableReference;
}

type BoxBoundaryParameters = {
    shape: BoundaryShape.Box;
    width: CustomVariableReference;
    height: CustomVariableReference;
    depth: CustomVariableReference;
}

type CylinderBoundaryParameters = {
    shape: BoundaryShape.Cylinder;
    radius: CustomVariableReference;
    height: CustomVariableReference;
}

export type SetBoundaryParameters = {
    object: ObjectReference;
} & (
  | SphereBoundaryParameters
  | BoxBoundaryParameters
  | CylinderBoundaryParameters
)

export type ApplyPlayerTraitsParameters = {
    player: PlayerReference;
    traitIndex: number;
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
    object: ObjectReference;
    fireteamFilter: FireteamFilter;
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
    type: Exclude<PlayerFilterType, PlayerFilterType.SpecificPlayer>;
} | {
    type: PlayerFilterType.SpecificPlayer;
    player: PlayerReference;
    visible: CustomVariableReference;
}

export type SetProgressBarParameters = {
    object: ObjectReference;
    playerFilterModifier: PlayerFilterModifier;
    timerIndex: number;
}

export type HudPostMessageParameters = {
    target: TeamOrPlayerTarget;
    soundIndex: MegaloSound;
    string: DynamicString;
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
    timer: CustomTimerReference;
    rate: GameEngineTimerRate;
}

export type ForEachParameters = {
    triggerIndex: number;
}

export type ObjectDestroyParameters = {
    object: ObjectReference;
    noStatistics?: boolean;
}

export type ObjectAttachParameters = {
    child: ObjectReference;
    parent: ObjectReference;
    offset: ObjectOffset;
    absoluteOrientation?: boolean;
}

export type PlayerAdjustMoneyParameters = {
    player: PlayerReference;
    operation: MathOperation;
    amount: CustomVariableReference;
}

export type PlayerPurchaseMode = {
    aliveWeapons: boolean;
    aliveEquipment: boolean;
    aliveVehicles: boolean;
    deadWeapons: boolean;
    deadEquipment: boolean;
}

export type PlayerEnablePurchasesParameters = {
    player: PlayerReference;
    selectedModes: PlayerPurchaseMode;
    enabled: CustomVariableReference;
}

export enum WeaponPickupPriority {
    Normal = 0,
    Special = 1,
    Automatic = 2,
}

export type WeaponSetPickupPriorityParameters = {
    weapon: ObjectReference;
    priority: WeaponPickupPriority;
}


export type HUDWidgetSetTextParameters = {
    widgetIndex: number;
    string: DynamicString;
}

type HUDMeterInputNumber = {
    meterType: HUDMeterInputType.Number;
    value: CustomVariableReference;
    max: CustomVariableReference;
}

type HUDMeterInputTimer = {
    meterType: HUDMeterInputType.Timer;
    timer: CustomTimerReference;
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
    iconIndex: number; // object_lists/hud_widget_icons.txt
}

export type HUDWidgetSetVisibilityParameters = {
    widgetIndex: number;
    player: PlayerReference;
    visible: boolean;
}

export type PlaySoundParameters = {
    soundIndex: MegaloSound;
    immediate: boolean;
    target: TeamOrPlayerTarget;
}

export type VitalityAdjustmentParameters = {
    object: ObjectReference;
    operation: MathOperation;
    amount: CustomVariableReference;
}

export type PlayerSetRequisitionPaletteParameters = {
    player: PlayerReference;
    requisitionPaletteIndex: number;
}

export enum GrenadeType {
    Frag = 0,
    Plasma = 1,
}

export type AdjustGrenadesParameters = {
    player: PlayerReference;
    grenadeType: GrenadeType;
    operation: MathOperation;
    amount: CustomVariableReference;
}

export type SubmitIncidentParameters = {
    statIndex: number;
    cause: TeamOrPlayerTarget;
    effect: TeamOrPlayerTarget;
}

export type SubmitIncidentWithCustomValueParameters = {
    statIndex: number;
    cause: TeamOrPlayerTarget;
    effect: TeamOrPlayerTarget;
    customValue: CustomVariableReference;
}

export type SetLoadoutPaletteParameters = {
    target: TeamOrPlayerTarget;
    loadoutPaletteIndex: number;
}

export type PlayerGiveWeaponParameters = {
    player: PlayerReference;
    primary: boolean;
    weapon: ObjectReference;
}

export type CreateTunnelParameters = {
    from: ObjectReference;
    to: ObjectReference;
    objectType: ObjectTypeReference;
    radious: CustomVariableReference;
    objectReferenceOut: ObjectReference;
}

export type PlayerSetCoopSpawningParameters = {
    player: PlayerReference;
    enabled: boolean;
}

export type ObjectSetOrientationParameters = {
    object: ObjectReference;
    source: ObjectReference;
    absoluteOrientation?: boolean;
}

export type ObjectFaceObjectParameters = {
    object: ObjectReference;
    target: ObjectReference;
    offset?: ObjectOffset;
}

export enum BipedGiveWeaponMode {
    Primary = 0,
    Secondary = 1,
    Force = 2,
}

export type BipedGiveWeaponParameters = {
    biped: ObjectReference;
    weapon: ObjectReference;
    mode: BipedGiveWeaponMode;
}

export type BipedDropWeaponParameters = {
    biped: ObjectReference;
    primary: boolean;
    deleteOnDrop: boolean;
}

export type GetRandomObjectParameters = {
    filterIndex: number;
    ignoreObject: ObjectReference;
    objectOut: ObjectReference;
}

export type BoundarySetPlayerColorParameters = {
    object: ObjectReference;
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
    player: PlayerReference;
    button: ScriptableGameButtons;
    timeOut: CustomVariableReference;
}

export type TeamSetVehicleSpawningParameters = {
    team: TeamReference;
    enabled: boolean;
}

export type PlayerSetVehicleSpawningParameters = {
    player: PlayerReference;
    enabled: boolean;
}

export type SetPlayerRespawnVehicleParameters = {
    objectType: ObjectTypeReference;
    player: PlayerReference;
}

export type SetTeamRespawnVehicleParameters = {
    objectType: ObjectTypeReference;
    team: TeamReference;
}

export type HideObjectParameters = {
    object: ObjectReference;
    shouldHide: boolean;
}

export type PrintVariableParameters = {
    string: DynamicString;
}

export type GetPlayerHoldingObjectParameters = {
    object: ObjectReference;
    playerOut: PlayerReference;
}

export type EndRoundParameters = never;

export type BoundarySetVisibleParameters = {
    object: ObjectReference;
    playerFilterModifier: PlayerFilterModifier;
}

export type ObjectSetInvincibilityParameters = {
    object: ObjectReference;
    invincible: CustomVariableReference;
}

export type RandomParameters = {
    range: CustomVariableReference;
    valueOut: CustomVariableReference;
}

export type ObjectGetOrientationParameters = {
    object: ObjectReference;
    variable: CustomVariableReference;
}

export type ObjectGetVelocityParameters = {
    object: ObjectReference;
    variable: CustomVariableReference;
}

export type PlayerDeathGetKillingPlayerParameters = {
    deadPlayer: PlayerReference;
    killingPlayerOut: PlayerReference;
}

export type PlayerDeathGetDamageTypeParameters = {
    deadPlayer: PlayerReference;
    damageTypeOut: CustomVariableReference;
}

export type PlayerDeathGetSpecialTypeParameters = {
    deadPlayer: PlayerReference;
    specialTypeOut: CustomVariableReference;
}

export type DebuggingEnableTracingParameters = {
    tracingEnabled: boolean;
}

export type ObjectDetachParameters = {
    object: ObjectReference;
}

export type PlayerGetPlaceParameters = {
    player: PlayerReference;
    placeOut: CustomVariableReference;
}

export type TeamGetPlaceParameters = {
    team: TeamReference;
    placeOut: CustomVariableReference;
}

export type PlayerGetKillingSpreeCountParameters = {
    player: PlayerReference;
    spreeCountOut: CustomVariableReference;
}

export type PlayerGetVehicleParameters = {
    player: PlayerReference;
    vehicleOut: ObjectReference;
}

export type PlayerSetVehicleParameters = {
    player: PlayerReference;
    vehicle: ObjectReference;
}

export type PlayerSetUnitParameters = {
    player: PlayerReference;
    unit: ObjectReference;
}

export type TimerResetParameters = {
    timer: CustomTimerReference;
}

export type ObjectBounceParameters = {
    object: ObjectReference;
}

export type HUDWidgetSetValueParameters = {
    widgetIndex: number;
    value: CustomVariableReference;
}

export type ObjectSetScaleParameters = {
    object: ObjectReference;
    scale: CustomVariableReference;
}

export type NavpointSetTextParameters = {
    object: ObjectReference;
    string: DynamicString;
}

export type ObjectGetShieldParameters = {
    object: ObjectReference;
    variable: CustomVariableReference;
}

export type ObjectGetHealthParameters = {
    object: ObjectReference;
    variable: CustomVariableReference;
}

export type PlayerSetObjectiveParameters = {
    player: PlayerReference;
    objective: DynamicString;
}

export type PlayerSetObjectiveAllegianceParameters = {
    player: PlayerReference;
    allegiance: DynamicString;
}

export type PlayerSetObjectiveAllegianceIconParameters = {
    player: PlayerReference;
    iconIndex: number; // object_lists/hud_widget_icons.txt
}

export type TeamSetCoopSpawningParameters = {
    team: TeamReference;
    coopSpawningEnabled: boolean;
}

export type TeamSetPrimaryRespawnObjectParameters = {
    team: TeamReference;
    respawnObject: ObjectReference;
}

export type PlayerSetPrimaryRespawnObjectParameters = {
    player: PlayerReference;
    respawnObject: ObjectReference;
}

export type PlayerGetFireteamIndexParameters = {
    player: PlayerReference;
    fireteamIndexOut: CustomVariableReference;
}

export type PlayerSetFireteamIndexParameters = {
    player: PlayerReference;
    fireteamIndex: CustomVariableReference;
}

export type ObjectAdjustShieldParameters = {
    object: ObjectReference;
    operation: MathOperation;
    amount: CustomVariableReference;
}

export type ObjectAdjustHealthParameters = {
    object: ObjectReference;
    operation: MathOperation;
    amount: CustomVariableReference;
}

export type ObjectAdjustMaximumShieldParameters = {
    object: ObjectReference;
    operation: MathOperation;
    amount: CustomVariableReference;
}

export type ObjectAdjustMaximumHealthParameters = {
    object: ObjectReference;
    operation: MathOperation;
    amount: CustomVariableReference;
}

export type ObjectGetDistanceParameters = {
    from: ObjectReference;
    to: ObjectReference;
    distanceOut: CustomVariableReference;
}

export type DeviceSetPowerParameters = {
    object: ObjectReference;
    power: CustomVariableReference;
}

export type DeviceGetPowerParameters = {
    object: ObjectReference;
    powerOut: CustomVariableReference;
}

export type DeviceSetPositionParameters = {
    object: ObjectReference;
    position: CustomVariableReference;
}

export type DeviceGetPositionParameters = {
    object: ObjectReference;
    positionOut: CustomVariableReference;
}

export type DeviceSetPositionTrackParameters = {
    object: ObjectReference;
    animationNameIndex: number; // object_lists/stringids.txt ?
    interpolationTime: CustomVariableReference;
}

export type DeviceAnimatePositionParameters = {
    object: ObjectReference;
    animationTargetFraction: CustomVariableReference;
    animationDurationSeconds: CustomVariableReference;
    accelerationSeconds: CustomVariableReference;
    decelerationSeconds: CustomVariableReference;
}

export type DeviceSetPositionImmediateParameters = {
    object: ObjectReference;
    position: CustomVariableReference;
}

export type SavedFilmInsertMarkerParameters = {
    offsetSeconds: CustomVariableReference;
    label: DynamicString;
}

export type RespawnZoneEnableParameters = {
    respawnZone: ObjectReference;
    enabled: CustomVariableReference;
}

export type PlayerGetEquipmentParameters = {
    player: PlayerReference;
    equipmentOut: ObjectReference;
}

export type ObjectSetNeverGarbageParameters = {
    object: ObjectReference;
    neverGarbage: CustomVariableReference;
}

export type PlayerGetTargetObjectParameters = {
    player: PlayerReference;
    objectOut: ObjectReference;
}

export type DebugForcePlayerViewCountParameters = {
    viewCount: CustomVariableReference;
}

export type PlayerPickUpWeaponParameters = {
    player: PlayerReference;
    weapon: ObjectReference;
}

export type SetScenarioInterpolatorStateParameters = {
    interpolatorIndex: CustomVariableReference;
    active: CustomVariableReference;
}

export type GameGriefRecordCustomPenaltyParameters = {
    player: PlayerReference;
    variable: CustomVariableReference;
}

export type SetPickupFilterParameters = {
    object: ObjectReference;
    playerFilterModifier: PlayerFilterModifier;
}

export type SetRespawnFilterParameters = {
    object: ObjectReference;
    playerFilterModifier: PlayerFilterModifier;
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