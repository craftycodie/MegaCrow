# object_adjust_shield


<AvailabilityCard reach="yes" />

## Description

Modifies an object's current shields with a [math operation](/language/enums/math-operations). 100 is 100% shields.

<ActionParameters />

## Example

```megalo
action object_adjust_shield juggernaut set_to 200
```

Example from HREK `juggernaut`.

## Notes
- While Megalo does not normally support floating point math, you can do so with health/shields. Health and shields are normally floating point numbers of values 0 to 1 and 0 to 4 respectively that are then converted to integers representing percents when stored in Megalo. When Megalo modifies health/shields, the operand is divided by 100 before being applying the modification directly to the floating point value.
- Because all operands are divided by 100 before being applied to the floating point value of an object's health/shields, this means multiplying/dividing by a number will result in different results than what may be expected. For example, multiplying health/shields by 2 will actually multiply by 0.02.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
- [object_adjust_health](/language/actions/object-adjust-health)
- [object_adjust_maximum_health](/language/actions/object-adjust-maximum-health)
- [object_adjust_maximum_shield](/language/actions/object-adjust-maximum-shield)

