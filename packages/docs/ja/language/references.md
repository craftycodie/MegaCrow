# 参照

Megalo のアクションと条件は **オペランド** — 実行時にプレイヤー、チーム、オブジェクト、タイマー、変数を識別する値 — を取ります。このページは参照モデル、つまりオペランドの書き方と何に解決されるかを説明します。

## 参照の型

Megalo には 5 種類の型付き参照があります。

| 型 | 保持するもの | 例 |
|------|-------|---------|
| Player | プレイヤースロット | `current_player`、`killer`、`none` |
| Team | チーム | `current_team`、`attackers`、`defenders`、`none` |
| Object | マップオブジェクト | `current_object`、`one_flag`、`none` |
| Timer | カウントダウンタイマー | `round_timer`、`current_player.game_start_vo` |
| Number | 整数値 | `my_counter`、`score_to_win_round`、`0` |

各型に「参照なし」または「空」を意味する `none` センチネルがあります。

## コンテキスト参照

現在の評価コンテキストと関連するエンジン状態のための組み込み参照:

| 名前 | 型 | 可用性 |
|------|------|--------------|
| `current_player` | Player | `player` トリガー内 |
| `current_team` | Team | `team` トリガー内 |
| `current_object` | Object | `object` / マップオブジェクトフィルタトリガー内 |
| `local_player` | Player | 常時 |
| `local_team` | Team | 常時（`local_player` を所有するチーム） |
| `target_player` | Player | 常時（HUD ターゲットプレイヤー） |
| `target_object` | Object | 常時（HUD ターゲットオブジェクト） |
| `target_team` | Team | MegaloEvolved 拡張 `targetTeam`（`target_player` を所有するチーム） |

`current_*` 参照はトリガーの深さでゲートされます。その他は常に利用可能です。

```megalo
trigger local
	condition if local_team equal_to attackers
	action hud_widget_set_visibility status_widget local_player 1
end
```

[組み込み変数](/ja/language/enums/built-in-variables) も参照。

## カスタム変数参照

`variables` ブロックで宣言した変数は名前で参照します。メンバー変数はドット記法です。

```megalo
; global variable
action set sudden_death_condition set_to true

; player member variable
action set current_player.is_leader set_to 1

; team member variable
action set current_team.goal set_to current_object

; object member variable
action timer_set_rate buy_zone.phase_1_timer 1

; chained member access
action set buy_zone.allies_present set_to attackers_in_area
```

## チームデザイネータ

チームはデザイネータ名で参照できます。

| デザイネータ | 役割 |
|-----------|------|
| `attackers` | 攻撃側チーム |
| `defenders` | 防御側チーム |
| `third_party` | 第 3 チーム |
| `fourth_party` | 第 4 チーム |
| `fifth_party` | 第 5 チーム |
| `sixth_party` | 第 6 チーム |
| `seventh_party` | 第 7 チーム |
| `eighth_party` | 第 8 チーム |
| `none` | チームなし |

```megalo
action play_sound team defenders bone_cv_ph1_intro
action set_score add 1 team attackers
condition if current_player.team equal_to attackers
```

チームデザイネータは `teams` ブロックで割り当てます。

```megalo
teams
	team
		designator defenders
	end
	team
		designator attackers
	end
end
```

## チームまたはプレイヤーターゲット

一部のアクションは **チームまたはプレイヤーターゲット** — 特定プレイヤー、特定チーム、または全員 — を取ります。構文は `team <team_ref>`、`player <player_ref>`、または `everyone` です。完全なオペランド参照は [チームまたはプレイヤーターゲット](/ja/language/enums/team-or-player-target) を参照。

```megalo
action set_score add 1 team attackers
action play_sound team defenders bone_cv_ph1_intro
action hud_post_message everyone none "Round started!"
```

## オーディエンス参照

他のアクションは、誰に影響するかを指定する **オーディエンス** オペランドを取ります（可視性、ピックアップフィルタなど）。

| オーディエンス | 意味 |
|----------|---------|
| `everyone` | 全プレイヤー |
| `allies` | 味方プレイヤー（コンテキスト相対） |
| `enemies` | 敵プレイヤー |
| `player` | 特定プレイヤー（続けてプレイヤー参照） |
| `team` | 特定チーム（続けてチーム参照） |
| `no_one` | 誰でもない |

```megalo
action navpoint_set_visible current_object allies
action set_pickup_filter one_flag enemies
action boundary_set_visible capture_zone everyone
```

## 組み込みタイマー参照

エンジンは `variables` ブロックで宣言しない組み込みタイマーを提供します。

| タイマー | 説明 |
|-------|-------------|
| `round_timer` | 現在ラウンドの経過時間 |
| `sudden_death_timer` | サドンデスのカウントダウン |
| `grace_period_timer` | ラウンド時間終了後の猶予期間 |

カスタムタイマーは `networked timer` 変数として宣言し、名前またはメンバーアクセスで参照します。

## オブジェクト型参照

`create_object` と `object_is_type` のオブジェクト型は、[オブジェクトリスト](/ja/language/object-lists) からの引用名を使います。

```megalo
action create_object "flag" at current_team.flag_spawn set current_team.flag never_garbage
action create_object "invis_cov_resupply_capsule" at current_object never_garbage
condition object_is_type current_object "area"
condition object_is_type current_object "fireteam_1_respawn_zone"
```

## プレイヤーをオブジェクトとして扱う参照

オブジェクト参照が期待される場所ではプレイヤー参照を使えます。エンジンはプレイヤーの物理ボディオブジェクトに解決します。

```megalo
; from simple/koth/1.txt — a player reference used as an object reference
action for_each player
	condition object_in_area current_player current_object
	action timer_set_rate current_player.time_in_hill 1
end

temporary object my_body current_player
action for_each general
	condition if my_body != none
	action set current_player.body = my_body
end
```

## 文字列テーブル参照

アクションと要素フィールドの文字列オペランドは、`string_table` ブロックで定義した記号を参照します。

```megalo
action hud_post_message player current_player none invasion_title_spartan
action player_set_objective current_player slayer_objective score_to_win_round
action navpoint_set_text current_object nav_weapon_drop
```

ソース上は引用文字列ではなく — 実行時に文字列テーブルを通じて解決される識別子参照です。文字列に `%` プレースホルダがある場合、続くオペランドがそれらのスロットを埋めます — [動的文字列](/ja/language/enums/dynamic-strings) を参照。

## フィルタ参照

オブジェクトフィルタオペランドは、誰がオブジェクトと相互作用できるかを識別します。

| フィルタ | 意味 |
|--------|---------|
| `all` | 全員 |
| `allies` | 味方プレイヤー／チーム |
| `enemies` | 敵プレイヤー／チーム |
| `no_one` | 誰でもない |
| `none` | フィルタなし（無効） |

リスポーン、ピックアップ、ファイアチームフィルタのアクションで使います。

```megalo
action set_respawn_filter current_object allies
action set_pickup_filter current_object no_one
action set_fireteam_respawn_filter current_object all
```

## 関連項目

- [変数モデル](/ja/language/variable-model) — カスタム変数の宣言
- [action](/ja/language/elements/trigger/action) — 参照がオペランドとして現れる方法
- [condition](/ja/language/elements/trigger/condition) — 比較内の参照
- [オブジェクトリスト](/ja/language/object-lists) — オブジェクト型とインシデントの記号名
