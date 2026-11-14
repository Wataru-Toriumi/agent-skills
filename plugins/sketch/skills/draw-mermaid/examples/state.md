# 状態の変化

架空の申請機能の例。実際の図では入力資料にある要素・条件へ置き換える。

ノードは状態、矢印は変化の契機にする。複数主体の操作手順と混在させない。
開始・終了は対象のライフサイクルに合わせ、戻りや再申請が未決なら注記する。

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
    secondaryColor: "#F8FAFC"
    tertiaryColor: "#FFFFFF"
  state:
    nodeSpacing: 32
    rankSpacing: 48
---
stateDiagram-v2
    direction LR
    state "下書き" as Draft
    state "審査中" as InReview
    state "承認済み" as Approved
    [*] --> Draft
    Draft --> InReview: 申請する
    InReview --> Draft: 差し戻す
    InReview --> Approved: 承認する
    Approved --> [*]
```

主経路を左から右に揃え、差し戻しを戻り線として描く。状態名や線の色で承認・否認の意味を重複して強調しない。

## 構文の確認先

対応バージョンで使える構文は [State diagram の公式資料](https://mermaid.js.org/syntax/stateDiagram.html) で確認する。
