# C4：アプリとデータストア

[Context 図](c4-context.md)の予約サービスを展開した、架空の Container 図。
アプリ・データストアの責務、技術、通信を示す。ここでの Container は Docker コンテナとは限らない。

```mermaid
C4Container
    title 予約サービスの内部構成（架空）
    Person(customer, "利用者", "施設を予約する")
    System_Boundary(booking, "予約サービス") {
        Container(web, "Webアプリ", "TypeScript", "画面と予約処理")
        ContainerDb(db, "予約DB", "PostgreSQL", "予約と受付枠を保存")
    }
    System_Ext(notification, "通知サービス", "メールを配信する")
    Rel(customer, web, "予約を操作する", "HTTPS")
    Rel(web, db, "読み書き", "SQL")
    Rel(web, notification, "予約通知を依頼する", "HTTPS")
    UpdateElementStyle(customer, $fontColor="#0F172A", $bgColor="#F1F5F9", $borderColor="#64748B")
    UpdateElementStyle(web, $fontColor="#0F172A", $bgColor="#F1F5F9", $borderColor="#64748B")
    UpdateElementStyle(db, $fontColor="#0F172A", $bgColor="#F1F5F9", $borderColor="#64748B")
    UpdateElementStyle(notification, $fontColor="#0F172A", $bgColor="#F8FAFC", $borderColor="#64748B")
    UpdateRelStyle(customer, web, $offsetX="-110", $offsetY="-20")
    UpdateRelStyle(web, db, $offsetX="-25", $offsetY="-30")
```

台数・配置先・フェイルオーバーは Deployment 図に分ける。図を埋めるために未決の技術や接続を補わない。
配置と掲載先への対応は [C4 の使い分け](../references/c4.md) を参照する。

## 確認先

- [C4 model：Container](https://c4model.com/diagrams/container)
- [Mermaid の C4 構文](https://mermaid.js.org/syntax/c4.html)
