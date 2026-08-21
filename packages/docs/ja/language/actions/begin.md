# begin


<AvailabilityCard reach="partial" />

## 説明

入れ子のサブトリガーブロックの開始を示します。

<DocsBlock type="warning" title="通常のアクションではない">

`begin` は技術的にはアクションですが、言語上は要素に近い扱いです。詳しくは [begin 要素](/ja/language/elements/begin) のページを参照してください。

</DocsBlock>

<ActionParameters />

## 例

`begin` はアクションスコープ内で単独行として書き、`action begin` としては書きません:

```megalo
action for_each team
	condition team_is_active current_team

	begin
		condition if current_team.players_frozen == least_frozen_players
		action set teams_tied = true
	end
	begin
		condition if current_team.players_frozen < least_frozen_players
		action set least_frozen_players = current_team.players_frozen
		action set least_frozen_players_team = current_team
	end
end
```

Reach MCC の `tu1_winter_contingency.txt` より — 詳細な解説は [begin 要素](/ja/language/elements/begin) のページを参照してください。

<DocsBlock type="note" title="アクション構文">

技術的には `action begin ... end` と書いても `begin ... end` と同じようにコンパイル・動作しますが、おそらく意図された構文ではありません。

</DocsBlock>

## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
