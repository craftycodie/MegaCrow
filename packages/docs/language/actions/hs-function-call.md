# hs_function_call


<AvailabilityCard reach="partial" />

## Description

Calls a dormant HaloScript function that matches the argument's name (Reach MCC only). The function name needs to be in `strings.txt` to compile and in the megalo_string_id_table tag to function properly.

<ActionParameters />

## Example

```haloscript
;This block is Haloscript, not Megalo
(script dormant void kill_player
    (unit_kill (unit (list_get (players) 0)))
)
```

```megalo
action hs_function_call kill_player
```

## Notes
- It is unlikely that HaloScript will always sync properly, so it is recommended to put this in a local trigger. 


## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
