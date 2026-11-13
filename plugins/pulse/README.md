# pulse

障害対応と運用改善を支援する Claude Code / Codex 用プラグイン。

## スキル

| スキル | 用途 |
| --- | --- |
| [respond-to-incident](skills/respond-to-incident/SKILL.md) | 発生中の障害を切り分け、影響の軽減と復旧確認を進める |
| [write-postmortem](skills/write-postmortem/SKILL.md) | 障害の経緯と寄与要因から、再発・影響を減らす対策をまとめる |
| [improve-operations](skills/improve-operations/SKILL.md) | 運用負荷や障害の傾向から、改善の優先度と効果の測り方を決める |

障害対応の記録を振り返りへ渡し、改善結果を手順へ反映できる。

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
- 「respond-to-incident で、このアラートとログから影響範囲と次の確認を整理して」
- 「write-postmortem で、この対応記録から振り返りを書いて」
