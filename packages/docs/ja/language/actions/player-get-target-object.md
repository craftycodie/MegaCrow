# player_get_target_object


<AvailabilityCard reach="partial" />

## 説明

プレイヤーのクロスヘア内にあるオブジェクトを出力変数に読み取ります。このアクションは、Megalo コードがそのプレイヤーのマシン上で実行されている場合にオブジェクトを返すことがあります。

<ActionParameters />

## 例

```megalo
action player_get_target_object current_player targeted_object
```
## 注記
* このアクションは、Megalo コードが実行されているマシン上のプレイヤーに対してのみ機能するため、ローカルトリガー内でそのプレイヤーがローカルプレイヤーかどうかを検出するために使えます。意図的にゲームを非同期化する用途にも役立ちます。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
