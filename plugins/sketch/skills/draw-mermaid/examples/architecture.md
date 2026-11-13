# サービスと実行基盤

架空の申請基盤の例。サービス、データベース、ストレージと、それらが属する環境を示す。
`architecture-beta` はベータ構文。掲載先の対応を確認し、未対応なら flowchart または描画済み SVG を使う。

```mermaid
architecture-beta
    group platform(cloud)[申請基盤]
    service api(server)[申請API] in platform
    service db(database)[申請DB] in platform
    service files(disk)[添付ファイル] in platform
    api:L -- R:db
    api:R -- L:files
```

線は接続を表し、呼び出し順や権限を示さない。組み込みアイコンを起点にし、外部アイコンパックを前提にしない。
グループが環境・ネットワーク・所有者のどれを表すかを揃える。

## 構文の確認先

[Architecture diagram の公式資料](https://mermaid.js.org/syntax/architecture.html)
