# アクターとユースケース

架空の予約サービスの例。「誰が何を達成するか」とシステム境界を示す。
Mermaid 12以降の `usecase-beta` を使う。ベータ構文のため掲載先の対応を確認する。

```mermaid
usecase-beta
    direction LR
    actor Customer("利用者")
    actor Staff("施設担当者")
    systemBoundary Booking["予約サービス"]
        Reserve("予約する")
        Cancel("予約を取り消す")
        CheckAvailability("空き枠を確認する")
        ManageSlots("受付枠を管理する")
    end
    Customer -- Reserve
    Customer -- Cancel
    Staff -- ManageSlots
    Reserve ..> : include CheckAvailability
```

アクターはシステムの外に置き、ユースケースを目的の動詞で命名する。関連線は操作の順序を表さない。
この例の `include` は予約時に必ず行う空き枠確認を表す。条件付きの追加動作には `extend` を使い、追加側から基本側へ向ける。詳細な条件は本文に残す。
内部メソッドや画面遷移をユースケースとして列挙せず、手順・分岐は flowchart や sequenceDiagram に分ける。
未対応の掲載先では、同じアクター・境界・関連を flowchart で近似するか、描画済み SVG を使う。近似図を厳密な UML 記法とは扱わない。

## 構文の確認先

[Use Case の公式資料](https://mermaid.js.org/syntax/usecase.html)
