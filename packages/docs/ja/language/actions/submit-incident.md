# submit_incident


<AvailabilityCard reach="yes" />

## 説明

原因と結果の [チームまたはプレイヤー対象](/ja/language/enums/team-or-player-target) コンテキスト付きで、ゲームインシデントを発火します（`incidents.txt` より）。メダルの付与、キルフィードへのメッセージ表示、サウンドの再生などに使われることが多いです。Reach の 360 版では実績の付与にも使われていました。

<ActionParameters />

## 例

```megalo
action submit_incident ball_game_start player current_player player none
```
HREK の `hogpotato.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
- [submit_incident_with_custom_value](/ja/language/actions/submit-incident-with-custom-value)
