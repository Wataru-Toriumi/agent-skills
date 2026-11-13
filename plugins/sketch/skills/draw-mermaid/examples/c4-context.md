# C4：システムの周辺関係

架空の予約サービスの Context 図。利用者、対象システム、直接連携する外部システムを示す。
内部のアプリ・DB・通信方式は [Container 図](c4-container.md) で扱う。

```mermaid
C4Context
    title 予約サービスの周辺関係（架空）
    Person(customer, "利用者", "施設を予約する")
    System(booking, "予約サービス", "予約の受付と変更")
    System_Ext(notification, "通知サービス", "メールを配信する")
    Rel(customer, booking, "予約を操作する")
    Rel(booking, notification, "予約通知を依頼する")
    UpdateElementStyle(customer, $fontColor="#0F172A", $bgColor="#F1F5F9", $borderColor="#64748B")
    UpdateElementStyle(booking, $fontColor="#0F172A", $bgColor="#F1F5F9", $borderColor="#64748B")
    UpdateElementStyle(notification, $fontColor="#0F172A", $bgColor="#F8FAFC", $borderColor="#64748B")
    UpdateRelStyle(customer, booking, $offsetX="-30", $offsetY="-25")
    UpdateRelStyle(booking, notification, $offsetX="80", $offsetY="-20")
```

外部は組織の外という意味ではなく、今回描くシステムの境界の外を指す。
C4 の粒度は [C4 の使い分け](../references/c4.md) を参照する。

## 確認先

- [C4 model：System context](https://c4model.com/diagrams/system-context)
- [Mermaid の C4 構文](https://mermaid.js.org/syntax/c4.html)
