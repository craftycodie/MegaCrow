# オブジェクトリスト

Reach は Megalo スクリプトの隣に、プレーンテキストの **オブジェクトリスト** フォルダを同梱しています。既定の Halo Reach Editing Kit (HREK) インストールでは次にあります。

```
data/multiplayer/megalo/object_lists/
```

（Steam 下では例として `…/HREK/data/multiplayer/megalo/object_lists/`）。

Bungie の Megalo エディタ（**MegaloEdit**）は、オートコンプリート、構文ヘルプ、**Help** メニューの参照一覧のためにこれらのファイルを読み込みます。ゲームエンジンも同じテーブルを使い、ゲームタイプやカスタムバリアントのコンパイル時にスクリプト内の記号名を数値インデックスへ変換します。

これらのリストは `loadout_globals_definition`（`lgtd`）、`megalo_string_id_table`（`msit`）、`multiplayer_object_type_list`（`motl`）タグ内のデータに対応します。

<DocsBlock type="info" title="カスタムマップ">

オブジェクトリストの内容はすべてタグ内のデータに対応します。そのため、標準 Reach コンテンツだけでなく、カスタムオブジェクト、武器、車両、その他マップ固有のエントリを持つカスタムマップ向けに Megalo スクリプトを書けます。

</DocsBlock>

## 形式

各ファイルは単純な照合テーブルです。

- **1 行に 1 エントリ** — 句読点なしの snake_case 識別子。
- **行順がインデックス** — 先頭行がインデックス `0`（下記で注記する場合は id `1`）。一部のリスト（特に `incidents.txt`）では空行もエンジン上のインデックス枠を消費します。
- **名前は安定した語彙** — Megalo ソースに文字どおり書きます（`action create_object warthog …`、`submit_incident kill` など）。

これらのリストは Megalo スクリプトの要素では **ありません**。スクリプトが名前で参照するエンジンデータです。

## 各ファイルの用途

| ファイル | エントリ数 | 用途 | タグ |
|------|---------|----------|-----|
| [`objects.txt`](https://github.com/Blam-Network/megalo/blob/main/src/object_lists/objects.txt) | ~220 | **マスターオブジェクト型テーブル。** 武器、車両、装備、情景、スポーン地点、Forge オブジェクト、特殊マーカー。`create_object`、`object_matches_filter`、リスポーン／車両アクション、`map_object` の `type` フィールドが参照。 | `multiplayer\globals.multiplayer_object_type_list`|
| [`weapons.txt`](https://github.com/Blam-Network/megalo/blob/main/src/object_lists/weapons.txt) | 24 | **プレイヤー特性の主／副武器。** 固定順の `objects.txt` の部分集合。`player_traits` ブロック（`primary_weapon`、`secondary_weapon`）で使用。インデックスはゲームタイプが実際に使うオブジェクト型に対して解決される。 |`multiplayer\globals.multiplayer_object_type_list`|
| [`equipment.txt`](https://github.com/Blam-Network/megalo/blob/main/src/object_lists/equipment.txt) | 10 | **プレイヤー特性の装備スロット。** アーマーアビリティと装備（`sprint_equipment`、`jet_pack_equipment`、…）。武器と同じ絶対インデックス規則。 |`multiplayer\globals.multiplayer_object_type_list`|
| [`vehicles.txt`](https://github.com/Blam-Network/megalo/blob/main/src/object_lists/vehicles.txt) | 34 | **車両名** — エディタが車両ピッカーを出す特性／フィルタオペランド用（`objects.txt` エントリの部分集合）。 |`multiplayer\globals.multiplayer_object_type_list`|
| [`grenades.txt`](https://github.com/Blam-Network/megalo/blob/main/src/object_lists/grenades.txt) | 4 | **手榴弾タイプ** — `player_traits` の `initial_grenades`（`frag_grenade`、`plasma_grenade`、`spike_grenade`、`firebomb_grenade`）。 |`multiplayer\globals.multiplayer_object_type_list`|
| [`incidents.txt`](https://github.com/Blam-Network/megalo/blob/main/src/object_lists/incidents.txt) | ~470 | **ゲームインシデント** — `submit_incident` と `submit_incident_with_custom_value` 用。キル、メダル、モードイベント（CTF、KOTH、Infection、…）、サバイバル、実績、アナウンサートリガーをカバー。インシデント id は **1 始まり**（先頭行 = インシデント `1`）。 | `globals\incident.properties.incident_global_properties_definition`|
| [`loadout_palettes.txt`](https://github.com/Blam-Network/megalo/blob/main/src/object_lists/loadout_palettes.txt) | 15 | **ロードアウトパレットプリセット** — `set_loadout_palette` と `override loadout_palette` 用（`slayer_loadouts`、`objective_loadouts`、ファイアファイト用パレットなど）。 | `multiplayer\invasion.loadout_globals_definition` |
| [`loadouts.txt`](https://github.com/Blam-Network/megalo/blob/main/src/object_lists/loadouts.txt) | ~80 | **ロードアウト表示名**（`loadout_name_carter`、`loadout_name_ninja`、…）。アクションオペコードではなく、エディタと UI がロードアウト選択肢を提示するときに使用。 | `multiplayer\invasion.loadout_globals_definition`|
| <span id="weapon_sets">[`weapon_sets.txt`](https://github.com/Blam-Network/megalo/blob/main/src/object_lists/weapon_sets.txt)</span> | 16 | **武器制限プリセット** — [`game_options`](/ja/language/elements/game-options) の `override weapon_set` 用。センチネルトークン（`none`、`default`、`random`）と完全なプリセット一覧は [Weapon Set](/ja/language/enums/game-options/weapon-set) を参照。 |`multiplayer\globals.multiplayer_object_type_list`|
| <span id="vehicle_sets">[`vehicle_sets.txt`](https://github.com/Blam-Network/megalo/blob/main/src/object_lists/vehicle_sets.txt)</span> | 14 | **車両制限プリセット** — `override vehicle_set` 用（`mongoose_only`、`no_aircraft`、`all_vehicles`、…）。センチネルとインデックスは [Vehicle Set](/ja/language/enums/game-options/vehicle-set) を参照。 |`multiplayer\globals.multiplayer_object_type_list`|
| [`hud_widget_icons.txt`](https://github.com/Blam-Network/megalo/blob/main/src/object_lists/hud_widget_icons.txt) | 33 | **HUD ウィジェットアイコン** — `hud_widget_set_icon` 用（`slayer`、`ctf`、`koth`、`generic_icon_2`、…）。このリストの一部の名前（`spartan` 以降）はゲーム内アイコンと一致しません。後からアイコンが追加されたのにリストが更新されなかったためと思われます。 | `ui\chud\bitmaps\variant_items\gametypes.bitmap`（このタグがゲーム内表示アイコンを持ちますが、ツールコマンド `multiplayer-generate-all-string-lists` はリストを更新しないため、手動更新が必要です。このタグは `player_set_objective_allegiance_icon` で表示されるアイコンにも対応しますが、そのアクションはこのリストを使いません。） |
| [`strings.txt`](https://github.com/Blam-Network/megalo/blob/main/src/object_lists/strings.txt) | ~58 | **文字列トークン** — `device_animate_position` および関連デバイスアクション用（`mp_boneyard_a_fly_in` のようなマップ固有アニメ名）、`create_object` で使うオブジェクトバリアント（`default` や `carter` など）、`hs_function_call` の関数名（既定では利用可能なものはありません）。 | `multiplayer\megalo\global.megalo_string_id_table` |

## `objects.txt` との関係

ほとんどの専門リストはマスター `objects.txt` テーブルの **部分集合またはビュー** です。

- `weapons.txt` と `equipment.txt` は `objects.txt` にもある名前を列挙しますが、プレイヤー特性はゲームタイプが使用とマークしたオブジェクト型に依存する圧縮された **絶対インデックス** で符号化します。
- `vehicles.txt` は車両ピッカー用の便宜リストです。車両型はコンパイル済みデータでは依然として `objects.txt` インデックス経由で解決されます。

迷ったら名前が `objects.txt` にあるか確認してください — それがスポーンとフィルタアクションの正式なオブジェクト型名前空間です。

## 関連項目

- [Megalo 言語の概要](/ja/language/) — これらの名前を消費する `map_object`、`player_traits`、アクション
- [Megalo バージョン](/ja/versions/) — Reach ビルドごとのアクションオペコード
