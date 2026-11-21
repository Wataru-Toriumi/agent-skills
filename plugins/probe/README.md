# probe

テスト設計・形式手法による検証を支援する、Claude Code / Codex 用プラグイン。

## スキル

| スキル | 用途 |
| --- | --- |
| [plan-tests](skills/plan-tests/SKILL.md) | 変更に必要なテストの種類・範囲・優先度を決める |
| [design-tests](skills/design-tests/SKILL.md) | 方針と要求を、前提・操作・期待結果を持つケースにする |
| [review-test-cases](skills/review-test-cases/SKILL.md) | 要求・差分と照合し、方針とケースの不足や誤りを指摘する |
| [verify-formally](skills/verify-formally/SKILL.md) | 性質を形式化して手法を選び、検証結果・反例・保証範囲を示す |

## 想定実行順序

方針→ケース作成→レビューの順で使える。各スキルは単独でも使え、小さな変更では会話内の短い方針で進める。
形式手法が必要な性質は `verify-formally` で検証する。設計・コードレビューから直接使うこともできる。

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
    requirements["ink の要求・設計<br/>条件・リスク・対象の版"] -. 方針を具体化 .-> plan
    plan("種類・範囲を選ぶ<br/>plan-tests") --> design("ケースを作る<br/>design-tests")
    design --> review("妥当性を確認<br/>review-test-cases")
    plan -. 形式手法が必要な場合 .-> formal("性質を形式化・検証<br/>verify-formally")
    source["設計・コードレビュー"] -. 性質と対象を渡す .-> formal
    formal --> evidence["反例・検証結果・保証範囲"]
    evidence -. 回帰ケースにする場合 .-> design
    review -. 指摘の対象を確認 .-> feedback{"判断・修正する対象"}
    evidence -. 反例と対応を確認 .-> feedback
    feedback -. 要求・設計 .-> ink["ink で未決事項・違反経路を評価"]
    feedback -. "実装の不一致<br/>修正も依頼された場合" .-> forge["forge で修正・回帰検証"]
```

指摘の内容に応じて、方針は `plan-tests`、ケースは `design-tests` で見直す。ケースのレビューはテスト実行やリリース承認を意味しない。

ink から要求・設計の版、受け入れ条件、失敗経路、仮定・未決事項を受け取り、実装前でも検証方法を具体化できる。
方針・ケース・レビュー・形式検証から必要なものを選び、要求との対応と未確認範囲を返す。計画やケースの完成と、検証の実行成功は区別する。

## 検証から次の工程へ

要求の未決や衝突は ink の要求整理へ、設計上の違反経路は設計レビューへ渡す。
実装の不一致が成立し、修正も依頼されていれば forge で修正・回帰検証へ進める。
テスト・モデル・環境の不備と、未完了の検証は製品の欠陥から分ける。修正後は対象の版と影響範囲を照合する。
具体的な選び方と渡す情報は [検証結果の引き継ぎ](skills/plan-tests/references/feedback-handoff.md) を参照する。

## 導入

利用するツールでマーケットプレイスを登録し、インストールする。

```sh
claude plugin marketplace add Wataru-Toriumi/agent-skills
claude plugin install probe@toripeeeeee-plugins
```

```sh
codex plugin marketplace add Wataru-Toriumi/agent-skills
codex plugin add probe@toripeeeeee-plugins
```

## 利用例

Claude Code では `/probe:<スキル名>`（例: `/probe:plan-tests`）で呼び出す。
Codex ではスキル一覧から選ぶか、スキル名を指定して依頼する。

- 「plan-tests で、今回の差分に必要なテストを整理して。選定理由と省く範囲も示して」
- 「design-tests で、この方針とストーリーからテストケースを作って」
- 「design-tests で、この組み合わせが成立するか整理して。除外するケースには根拠を付けて」
- 「review-test-cases で、このケースをレビューして。元の要求から方針の抜けも確認して」
- 「verify-formally で、同時に予約しても一つの枠を二重確保しないか検証して。反例と探索範囲を示して」
- 「verify-formally で、この権限の関係を検証する手法と必要なモデルを選んで。今回は実行計画まで」

## 形式手法による検証

モデル検査、関係モデル検査、自動プログラム検証、定理証明、SMT/SAT、抽象解釈、有界モデル検査から、対象と必要な保証に合う方法を選ぶ。
詳しい適用場面は [手法の選び方](skills/verify-formally/references/method-selection.md) を参照する。

`ink` の設計レビュー、`forge` のコードレビューと併用する場合は `probe` も導入する。
検証ツールは同梱しない。利用可能なツールで実行し、環境がなければ選定・モデル案・実行に必要な条件を返す。
モデルの前提、探索範囲、未証明の部分を示し、未実行や反例がないことだけで検証完了としない。
