# 循環するプロセス

DevOps の8段階を時計回りに並べる例。周回する流れを示したいときに使う。
中央はサイクル全体の目的であり、独立した処理段階ではない。

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
  block:
    padding: 32
---
block
    columns 3
    plan("01 Plan<br/>要求・設計") code("02 Code<br/>実装・レビュー") build("03 Build<br/>ビルド")
    monitor("08 Monitor<br/>監視") purpose("継続的な改善") test("04 Test<br/>検証")
    operate("07 Operate<br/>運用") deploy("06 Deploy<br/>展開") release("05 Release<br/>公開判断")

    plan --> code
    code --> build
    build --> test
    test --> release
    release --> deploy
    deploy --> operate
    operate --> monitor
    monitor --> plan

    style purpose fill:#FFFFFF,stroke:#CBD5E1,color:#475569
```

番号と矢印で読み順を示し、Monitor から Plan へ学びを戻す。
実際の反復・並行作業は目的に応じて補い、工程の一括実行や承認手順を意味させない。
枠の大きさと間隔を揃え、ラベルは段階名と役割の2行に分ける。

## 構文の確認先

[Block diagram の公式資料](https://mermaid.js.org/syntax/block.html)
