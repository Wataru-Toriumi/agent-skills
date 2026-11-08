# 配色ルール

色を決めるときに読む。配色の定義は sketch が管理し、利用側のプラグインは希望する色味・強調対象・掲載先を渡す。

## 優先順位と意味

ユーザーの指定を最優先し、指定のない部分は利用先の既存配色、それもなければ以下の標準を使う。
「変更箇所を紫に」「モノクロで」「ブランドカラーを使う」などの指定では、今回の図に必要な色だけ上書きする。同梱の標準設定自体は書き換えない。

| 役割 | 標準色 | 併記する情報 |
| --- | --- | --- |
| 通常・既存 | グレー | 要素の役割。差分図なら「既存」 |
| 変更・提案 | 青 | 「変更」「新設」「提案」など実際の状態 |
| 未決・要確認 | アンバー | 「未決」と判断が必要な内容 |

青は承認済みを意味しない。エラー、危険度、成功・失敗など別の軸を表す場合は、その図で意味を定義する。
全色を使う必要はなく、強調が不要ならグレーだけでよい。色だけで分類せず、ラベルや必要に応じた凡例を併用する。

## 図全体のテーマ

- 明るい背景には [light 設定](../assets/theme-light.json)、暗い背景には [dark 設定](../assets/theme-dark.json) を起点にする。
- Mermaid CLI では JSON を `-c` に指定する。`themeVariables.background` だけで出力画像の背景が変わるとは考えず、画像の背景は CLI の `-b` など描画側でも揃える。
- Markdown へ埋め込む場合は、選んだ JSON の内容を図の YAML frontmatter の `config` 配下へ変換して含める。JSON ファイルへのパスだけを書いても読み込まれない。テーマ変更には `theme: base` を使い、色値は引用符で囲んだ16進表記にする。
- 図種によって参照するテーマ変数や個別スタイルの構文が異なる。背景・文字・枠・線をセットで確認し、必要ならその図種の公式設定で調整する。flowchart の `classDef` を他の図種へそのままコピーしない。

次はスキルのディレクトリを作業ディレクトリとした CLI の例。実際には入力・出力と設定ファイルのパスを利用環境に合わせる。

```sh
pnpm exec mmdc -i diagram.mmd -o diagram-light.png -c assets/theme-light.json -b '#FFFFFF'
pnpm exec mmdc -i diagram.mmd -o diagram-dark.png -c assets/theme-dark.json -b '#0F172A'
```

プラグインに CLI は同梱されていない。実行方法は [描画と検証](rendering.md) に従う。

## flowchart の強調色

通常の要素には上のテーマを適用し、強調する要素だけクラスを付ける。
以下は同じ架空の図の明暗別の例。対応するテーマ設定と組み合わせる。
点線は未決の連携を示す。この例の意味を実際の図へ持ち込まず、入力の状態に合わせる。

明るい背景:

```mermaid
flowchart LR
    current["既存：申請API"] --> changed["提案：通知処理"]:::changed
    changed -.-> pending["未決：通知先"]:::pending
    classDef changed fill:#DBEAFE,stroke:#2563EB,color:#1E3A8A
    classDef pending fill:#FEF3C7,stroke:#B45309,color:#78350F
```

暗い背景:

```mermaid
flowchart LR
    current["既存：申請API"] --> changed["提案：通知処理"]:::changed
    changed -.-> pending["未決：通知先"]:::pending
    classDef changed fill:#1E3A5F,stroke:#60A5FA,color:#DBEAFE
    classDef pending fill:#422006,stroke:#FBBF24,color:#FEF3C7
```

## 掲載先と確認

固定した `themeVariables` や `classDef` は、閲覧者の明暗テーマに自動追従するものとして扱わない。
背景が切り替わる Markdown では、掲載先の標準テーマを保つか、両背景で確認した個別スタイルを使う。
同じ見た目を保ちたい画像では背景を明示して出力する。背景が未指定の独立画像は light を標準とする。
テーマ設定が使えるか不明な掲載先では、その配色を保証せず、ラベルと標準テーマで意味を保つ。

指定色へ変えた場合も文字・塗り・枠線を一緒に確認する。文字が読みにくければ、指定された色相をできるだけ保ちつつ明度や文字色を調整する。
厳密な色コード指定を変える必要がある場合は、変更を黙って行わず代案を示す。
描画後は掲載時の幅と予定する背景で確認し、配色だけで提案や未決事項が確定扱いになっていないかも見直す。

## 公式資料

- [Mermaid のテーマと変数](https://mermaid.js.org/config/theming.html)
- [flowchart のスタイル](https://mermaid.js.org/syntax/flowchart.html#styling-a-node)
