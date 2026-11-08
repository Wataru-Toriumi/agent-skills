# 状態の変化

架空の申請機能の例。実際の図では入力資料にある要素・条件へ置き換える。

ノードは状態、矢印は変化の契機にする。複数主体の操作手順と混在させない。
開始・終了は対象のライフサイクルに合わせ、戻りや再申請が未決なら注記する。

```mermaid
stateDiagram-v2
    state "下書き" as Draft
    state "審査中" as InReview
    state "承認済み" as Approved
    [*] --> Draft
    Draft --> InReview: 申請する
    InReview --> Draft: 差し戻す
    InReview --> Approved: 承認する
    Approved --> [*]
```

## 構文の確認先

対応バージョンで使える構文は [State diagram の公式資料](https://mermaid.js.org/syntax/stateDiagram.html) で確認する。
