# hide_object


<AvailabilityCard reach="partial" />

## 説明

プレイヤーに対してオブジェクトを非表示または表示します（Reach MCC のみ）。

<ActionParameters />

## 例

```megalo
;makes all player bipeds invisible
trigger local
	action for_each player
	action hide_object current_player true
end
```


## 注記
- 非表示にしたオブジェクトはコリジョンモデルが無効になりますが、物理モデルは有効なままです。
- この方法で非表示にしたオブジェクトにアタッチされているオブジェクトはすべて見えなくなります。ただし、それらの非表示状態はそれ以外では独立して追跡されます。
- この方法でオブジェクトを非表示にしても、常に同期されるわけではありません。ローカルトリガーでこのアクションを使うと、クライアント側のプレイヤーにもオブジェクトが見えなくなります。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
