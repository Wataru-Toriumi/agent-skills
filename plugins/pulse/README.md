# pulse

監視設計・障害対応・振り返りを通じて、サービスの運用を改善する Claude Code / Codex 用プラグイン。

## スキル

| スキル | 用途 |
| --- | --- |
| [plan-monitoring](skills/plan-monitoring/SKILL.md) | 利用者への影響から、監視指標・通知条件・初動を設計する |
| [respond-to-incident](skills/respond-to-incident/SKILL.md) | 発生中の障害を切り分け、影響の軽減と復旧確認を進める |
| [write-postmortem](skills/write-postmortem/SKILL.md) | 障害の経緯と寄与要因から、再発・影響を減らす対策をまとめる |
| [improve-operations](skills/improve-operations/SKILL.md) | 費用や当番の負荷から、取り組む改善策と効果の測り方を決める |
| [optimize-log-volume](skills/optimize-log-volume/SKILL.md) | イベントごとに削減策と残す記録を決め、削減量と記録の欠落を確かめる |

## 想定実行順序

発生中の障害には `respond-to-incident` を使い、復旧後の振り返りは `write-postmortem` で行う。ログ削減が目的なら `optimize-log-volume`、ログ費用と他の運用課題の優先度を比べるなら `improve-operations` から始める。

```mermaid
---
config:
  theme: base
  look: classic
  fontFamily: sans-serif
  themeVariables:
    primaryColor: "#F1F5F9"
    primaryTextColor: "#0F172A"
    primaryBorderColor: "#64748B"
    lineColor: "#64748B"
    tertiaryColor: "#F8FAFC"
    clusterBkg: "#F8FAFC"
    clusterBorder: "#CBD5E1"
    edgeLabelBackground: "#FFFFFF"
  flowchart:
    wrappingWidth: 300
    curve: linear
    nodeSpacing: 32
    rankSpacing: 40
---
flowchart TD
    monitoring("監視・初動を設計<br/>plan-monitoring")
    incident("切り分け・復旧確認<br/>respond-to-incident")
    postmortem("経緯と要因を振り返る<br/>write-postmortem")
    improve("改善の優先度を決める<br/>improve-operations")
    monitoring -. 障害時 .-> incident
    incident -->|復旧後| postmortem
    postmortem --> improve
    improve -->|監視を見直す場合| monitoring
    improve -. ログ削減を具体化する場合 .-> logs("ログの削減策を選ぶ<br/>optimize-log-volume")
    improve -. 設計の前提が実績とずれた場合 .-> review("設計判断を再評価<br/>ink：review-design")
    postmortem -. 改善策を具体化 .-> item("要求・作業項目を整理<br/>ink")
    improve -. 改善策を具体化 .-> item
    item -. 実装も依頼された場合 .-> implement("実装・検証・提出<br/>forge")
    improve -. 条件が揃い実装も依頼済み .-> implement
    implement -. 適用後の観測データで評価 .-> improve
```

改善結果は監視や対応手順へ反映する。監視設計だけの依頼から本番設定の適用や常時監視へは進まない。

## 改善策を実装へつなぐ

計画の依頼では作業候補を返す。実装や PR まで依頼された場合は、問題の根拠、対策の採否、受け入れ条件、効果の測り方を引き継ぐ。

- 処理量や復旧時間が設計時の想定を外れたら、ink の `review-design` で元の前提と運用記録を照合する。
- 要求を明らかにするには ink の `clarify-requirements`、作業単位や受け入れ条件を決めるには `write-work-item` を使う。
- 実装の条件がそろえば forge の `implement-work-item` を使う。実装、本番適用、効果確認はそれぞれの実施状況を記録する。

連携先が未導入でも、[引き継ぐ情報](skills/improve-operations/references/implementation-handoff.md)を整理して依頼の範囲で進められる。

## 設計・実装変更を監視へ反映する

ink・forge から変更前後の利用経路、対象の版と環境、既存の指標・通知・初動を受け取り、`plan-monitoring` で見直す。
不足する計測や未合意の閾値を明示し、監視案と必要な作業を呼び出し元へ返す。運用改善の効果評価は `improve-operations` で扱う。

```mermaid
---
config:
  theme: base
  themeVariables:
    fontFamily: sans-serif
    primaryColor: "#F1F5F9"
    primaryTextColor: "#0F172A"
    primaryBorderColor: "#64748B"
    lineColor: "#64748B"
  flowchart:
    curve: linear
---
flowchart TD
    design["ink：設計の版<br/>変更前後の挙動"] -. 監視や初動に影響する場合 .-> plan("pulse<br/>監視設計")
    code["forge：差分<br/>実装・適用状況"] -. 設計案と差分を照合 .-> plan
    plan --> result["監視案・計測<br/>初動・検証方法"]
    result --> caller["ink・forge<br/>元の変更へ反映"]
```

監視案ができたことと、設定の作成・適用・通知検証が済んだことは別に記録する。
新旧版の共存中は各経路を確認し、新しい監視ができただけで旧監視を撤去しない。

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

- 「improve-operations で、ログ費用の削減と夜間の手動復旧の削減のどちらを先に進めるか比較して」
- 「optimize-log-volume で、取り込み量の多いログを特定して。障害調査と監査に必要な記録を残せる削減案を出して」
- 「plan-monitoring で、このサービスの監視と通知条件を整理して」
- 「respond-to-incident で、このアラートとログから影響範囲と次の確認を整理して」
- 「write-postmortem で、この対応記録から振り返りを書いて」
- 「この障害の再発防止策を、ink で受け入れ条件のある作業項目にして。今回は草案まで」
- 「この改善策を forge で実装・検証してPRまで。運用への適用後に効果を確かめる条件も残して」
