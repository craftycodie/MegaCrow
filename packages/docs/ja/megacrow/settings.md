# 設定

ツールバーから **Settings** を開きます。オプションは **Compiler** と **Editor** に分かれています。変更はすぐに反映され、セッション間で保持されます。

## コンパイラ設定

### Gametype Author

コンパイル済みゲームタイプのメタデータに書き込まれる作成者名です。

| 項目 | 値 |
|------|-----|
| 最大長 | 16 文字 |
| デフォルト | 空 |

ファイルに作者を刻印したくない場合は空のままにしてください。Discord や OS のアカウント名とは別です。

### Compiler profile

コンパイラと言語サービスが許可する言語拡張を制御します。

| プロファイル | 動作 |
|--------------|------|
| **MegaloEvolved**（デフォルト） | 標準 Megalo の上に MegaloEvolved 製品拡張を有効化 |
| **MegaloEdit** | 標準の MegaloEdit に合わせる — MegaloEvolved 専用の言語拡張は無効 |

HREK の MegaloEdit コンパイラに近いスクリプト／ツール挙動が必要なときは **MegaloEdit** を使ってください。

### Strict compiler

有効にすると、コンパイラは **ローカライゼーションを強制**します。

- 文字列テーブルのシンボルが期待される場所での引用符付き文字列リテラルは（警告ではなく）**エラー**になる
- 欠落した [`localized_include`](/ja/language/elements/localized-include) ファイルはより厳しく扱われる（厳密なローカライゼーション規則に合わせる）

無効（デフォルト）のときは、寛容な MegaloEdit 風コンパイルに近い挙動になります。リテラルは警告になり得て、一部のローカライゼーション欠落は緩く扱われます。

Megalo コンパイラのスイッチモデル全体（一時オーバーフローや HREK 背景を含む）は、言語ドキュメントの [コンパイラ設定](/ja/language/compiler-settings) を参照してください。IDE のトグルは、そのモデルのうちローカライゼーション／文字列リテラルの厳密さ側に対応します。

## エディタ設定

### Language

IDE の UI、診断、ホバーヘルプの言語です。

| 値 | 意味 |
|----|------|
| **English** | デフォルトの UI とメッセージ |
| **日本語** | 日本語の UI およびコンパイラ／IDE メッセージ |

コンパイル済みゲームタイプの名前と説明をサイドバーに表示するとき、優先する文字列テーブル言語にも影響します。

### Editor theme

Megalo（Monaco）エディタ専用のカラーテーマです。IDE のその他の UI には適用されません。

利用可能なテーマには、MegaloEvolved Dark、VS Dark、Clouds Midnight、Cobalt2、Dracula、GitHub Dark / Light、Monokai、Night Owl、Nord、Oceanic Next、Solarized Dark / Light、Tomorrow Night、Twilight があります。

### Discord rich presence

有効にすると、Discord に MegaloEvolved で編集中であること（例: 現在のファイル）を表示できます。編集アクティビティを Discord に共有したくない場合はオフにしてください。

| デフォルト | オン |
|------------|------|

## 関連

- [ワークスペース](/ja/megacrow/workspaces) — スクリプトと出力フォルダ（デスクトップ）
- [エクスポート](/ja/megacrow/export) — コンパイル出力形式
- [言語のコンパイラ設定](/ja/language/compiler-settings) — MegaloCompile スイッチの詳細
