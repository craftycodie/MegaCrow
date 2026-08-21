# for_each


<AvailabilityCard reach="yes" />

## 説明

プレイヤー、チーム、またはオブジェクトを反復し、入れ子のトリガーロジックを実行します。トリガーの中にトリガーを置くことはできないため、トリガー内で反復が必要な場合は、このアクションを使います。

<ActionParameters />

## 例

```megalo
trigger host_migration
	action for_each player
		action timer_set_rate current_player.ball_timer 0
		action timer_reset current_player.ball_timer
	end
end
```

HREK の `oddball.txt` より。


## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
