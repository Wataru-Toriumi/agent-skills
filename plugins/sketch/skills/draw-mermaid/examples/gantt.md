# 作業期間と依存

架空の試行計画の例。日付・期間・依存を示したい場合に使う。出来事を順に並べるだけなら timeline にする。
開始日、所要期間、休日の扱いを元の計画に合わせる。以下は土日を除外する例。

```mermaid
gantt
    title 申請機能の試行計画（架空）
    dateFormat YYYY-MM-DD
    axisFormat %m/%d
    excludes weekends
    todayMarker off
    section 準備
        要求を確認 :req, 2026-12-01, 2d
        試行を実装 :build, after req, 3d
    section 確認
        利用者が確認 :check, after build, 2d
        継続を判断 :milestone, decision, after check, 0d
```

`after` は作業の依存を表す。担当者の稼働や並行作業が実現可能かは別に確認する。
予定の日付を実績と混ぜず、`done` などの状態も確認できたものだけ付ける。

## 構文の確認先

[Gantt の公式資料](https://mermaid.js.org/syntax/gantt.html)
