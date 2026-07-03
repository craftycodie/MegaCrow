type MegaloFlavour = undefined | "mcc";

export type MegaloVersion = {
    version: number;
    flavour?: MegaloFlavour;
};

function version<const V extends number>(v: V): { version: V; flavour: undefined };
function version<const V extends number, const F extends MegaloFlavour>(v: V, flavour: F): { version: V; flavour: F };
function version<const V extends number, const F extends MegaloFlavour>(v: number, flavour: MegaloFlavour = undefined): MegaloVersion {
    return { version: v, flavour };
}

export const MEGALO_VERSIONS = {
    // Halo: Reach
    "107-mcc": version(107, "mcc"),     // December 3rd 2019 - MCC
    "107": version(107),                // August 24th 2011 - 360 TU1
    "106": version(106),                // July 24th 2010 - 360 Release
    "73": version(73),                  // May 2010 - 360 Beta
    //"69": version(69),                // March 9th 2010 - Digsite Leak - rover.mglo
    "49": version(49),                  // February 2010 - 360 Alpha
    //"41": version(41),                // January/February 2010 - Digsite Leak - ctf_pro.mglo
    //"32": version(32),                // December 2009 - Digsite Leak - ctf-2flag.mglo
};

export type SupportedMegaloVersion = typeof MEGALO_VERSIONS[keyof typeof MEGALO_VERSIONS];