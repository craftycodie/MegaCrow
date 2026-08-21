# object_adjust_health


<AvailabilityCard reach="yes" />

## 説明

[数学演算](/ja/language/enums/math-operations) を使って、オブジェクトの現在のヘルスを変更します。100 はヘルス 100% です。

<ActionParameters />

## 例

```megalo
action object_adjust_health current_object set_to 100
```

## 注記
- Megalo は通常、浮動小数点演算をサポートしませんが、ヘルス／シールドでは利用できます。ヘルスとシールドは通常、それぞれ 0〜1 および 0〜4 の浮動小数点数であり、Megalo に格納される際にパーセントを表す整数へ変換されます。Megalo がヘルス／シールドを変更するとき、オペランドは 100 で除算されたうえで、浮動小数点値に直接適用されます。
- オブジェクトのヘルス／シールドの浮動小数点値に適用する前に、すべてのオペランドが 100 で除算されるため、数値の乗算／除算は想定と異なる結果になることがあります。たとえば、ヘルス／シールドに 2 を掛けても、実際には 0.02 倍になります。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
- [object_adjust_maximum_health](/ja/language/actions/object-adjust-maximum-health)
- [object_adjust_maximum_shield](/ja/language/actions/object-adjust-maximum-shield)
- [object_adjust_shield](/ja/language/actions/object-adjust-shield)
