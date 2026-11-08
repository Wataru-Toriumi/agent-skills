# 呼び出し順と失敗

架空の申請機能の例。実際の図では入力資料にある要素・条件へ置き換える。

参加者を固定し、メッセージには動作を書く。`alt` は条件ごとの代替経路、`opt` は条件付きの処理、`loop` は繰り返しに使う。
失敗分岐は設計にあるものを描き、エラーコードや再試行を推測で追加しない。

```mermaid
sequenceDiagram
    actor Applicant as 申請者
    participant API as 申請API
    participant Store as 申請データ
    Applicant->>API: 申請一覧を要求
    alt 閲覧権限あり
        API->>Store: 許可された申請を検索
        Store-->>API: 申請一覧
        API-->>Applicant: 一覧を返す
    else 閲覧権限なし
        API-->>Applicant: 閲覧を拒否
    end
```

## 構文の確認先

対応バージョンで使える構文は [Sequence diagram の公式資料](https://mermaid.js.org/syntax/sequenceDiagram.html) で確認する。
