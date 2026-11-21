# 構成と処理の分岐

架空の申請機能の例。実際の図では入力資料にある要素・条件へ置き換える。

構成図では責務と境界、処理図では条件と結果に焦点を当てる。
識別子と表示ラベルを分け、日本語や記号を含む flowchart のラベルは引用符で囲む。
小文字の `end` はブロック終端と衝突するため、ノード ID やそのままのラベルに使わない。

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
    clusterBkg: "#F8FAFC"
    clusterBorder: "#CBD5E1"
    edgeLabelBackground: "#FFFFFF"
  flowchart:
    curve: linear
    nodeSpacing: 32
    rankSpacing: 48
---
flowchart LR
    applicant["申請者"]
    subgraph system["申請システム"]
        api("申請API<br/>閲覧権限を判定")
        store[("申請データ")]
    end
    applicant -->|一覧を取得| api
    api -->|許可された申請を検索| store
```

これは依存関係の図であり、認証や失敗時の処理順序を網羅した図ではない。
構成を説明する線に全応答を追加して煩雑になる場合は、実行時の図を別にする。
`subgraph` 内の向きは外部との接続に影響されるため、方向指定だけで配置を固定できるとは考えない。
外枠は境界、角丸は処理、円柱はデータに使い、薄い背景と余白で役割を分ける。

## 申請フロー

架空の申請手続きで、受付後の分岐を追う例。受付と矢印には標準のグレーを使い、判断・引き継ぎ・完了にだけ色を足す。

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
    edgeLabelBackground: "#FFFFFF"
  flowchart:
    curve: linear
    rankSpacing: 40
---
flowchart LR
    receive("申請を受領") --> check{"書類は完備？"}:::decision
    check -->|はい| done(["受付完了"]):::complete
    check -->|いいえ| handoff("申請者に返却"):::handoff
    handoff -->|再提出| receive

    classDef decision fill:#EEE9FA,stroke:#80709D,color:#44345E
    classDef handoff fill:#E3EFF9,stroke:#6786A5,color:#294965
    classDef complete fill:#DDF2E9,stroke:#5E8B79,color:#244E40
```

## 送信フロー

通知を再送できる間は待機し、上限に達したら送信を打ち切る架空の例。

```mermaid
---
config:
  theme: base
  look: classic
  themeVariables:
    primaryColor: "#F1F5F9"
    primaryTextColor: "#0F172A"
    primaryBorderColor: "#64748B"
    lineColor: "#64748B"
    edgeLabelBackground: "#FFFFFF"
  flowchart:
    curve: linear
---
flowchart LR
    send("通知を送信") -->|送信成功| done(["送信完了"]):::complete
    send -->|一時障害・再送可| wait("警告：再送待ち"):::warning
    wait -->|待機後| send
    send -->|再送上限に到達| failed(["失敗：送信終了"]):::failure

    classDef complete fill:#DDF2E9,stroke:#5E8B79,color:#244E40
    classDef warning fill:#FEF3C7,stroke:#B45309,color:#78350F
    classDef failure fill:#FDE4E4,stroke:#B34A53,color:#75232F
```

## 構文の確認先

対応バージョンで使える構文は [Flowchart の公式資料](https://mermaid.js.org/syntax/flowchart.html) で確認する。
