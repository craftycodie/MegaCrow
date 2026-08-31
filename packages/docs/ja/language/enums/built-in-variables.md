# 組み込み変数

[`variables`](/ja/language/elements/variables) 宣言なしで、条件および [`set`](/ja/language/actions/set) のオペランドに現れる読み取り専用エンジングローバルです。ゲームオプション項目の書き込み可能な override は、[`game_options`](/ja/language/elements/game-options) の `override` 行内で同じ名前を使います。


<EnumVersionTable enum="built-in-variables" />

<DocsBlock type="warning" title="target_team は MegaloEdit では利用不可">

MegaloEdit のオートコンプリートは `target_team` を一覧表示しますが、パースしません（[Megalo Headache #2](/ja/language/megalo-headaches#2-inaccessible-target_team)）。使うには MegaloEvolved の [`targetTeam`](/ja/language/compiler-settings#megacrow-extensions) 拡張を有効にしてください。ワイヤ上のスロットは実行時に動作します。

</DocsBlock>

## 例

```megalo
condition if score_to_win_round not_equal_to 0
condition if teams_enabled equal_to 1
condition if round_time_limit greater_than 0
condition timer_expired round_timer
condition if current_player.team equal_to attackers
action set symmetric_gametype set_to 0
action play_sound team defenders bone_cv_ph1_intro
```

```megalo
trigger object_death
	condition if object_death_damage_type greater_than 34
	condition if object_death_damage_type less_than 56
end
```

## 関連

- [変数モデル — 組み込み変数](/ja/language/variable-model#built-in-variables)
- [チーム指定子](/ja/language/references#team-designators)
- [ゲームオプション](/ja/language/enums/game-options)
- [game_options](/ja/language/elements/game-options)
