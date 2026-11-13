# pulse

サービスの運用改善を支援する Claude Code / Codex 用プラグイン。

## スキル

| スキル | 用途 |
| --- | --- |
| [improve-operations](skills/improve-operations/SKILL.md) | 運用負荷や障害の傾向から、改善の優先度と効果の測り方を決める |


## 導入

利用するツールでマーケットプレイスを登録し、インストールする。

```sh
claude plugin marketplace add Wataru-Toriumi/agent-skills
claude plugin install pulse@toripeeeeee-plugins
```

```sh
codex plugin marketplace add Wataru-Toriumi/agent-skills
codex plugin add pulse@toripeeeeee-plugins
```

## 利用例

Claude Code では `/pulse:<スキル名>`（例: `/pulse:plan-monitoring`）で呼び出す。
Codex ではスキル一覧から選ぶか、スキル名を指定して依頼する。

- 「improve-operations で、今月の障害・通知・手作業から改善案に優先度を付けて」
