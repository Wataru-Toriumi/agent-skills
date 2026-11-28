# 描画と検証

## 掲載先に合わせる

既存のプレビューやプロジェクト内のレンダラーを優先する。描画に使う Mermaid のバージョン、図種、テーマや追加レイアウトの対応を確認する。
GitHub の Markdown では `mermaid` コードブロックを使う。GitHub 上で `info` を内容とする Mermaid ブロックを表示すると、利用中のバージョンを確認できる。
ローカルの新しい Mermaid で描けても、掲載先で同じ構文が使えるとは限らない。

掲載先のバージョンが不明なら基本構文を起点にし、追加のアイコンパック、HTML ラベル、独自 CSS、追加レイアウトに依存する前に対応を確認する。
GitHub 上で確認するためだけに PR やコメントを投稿しない。公開が依頼の範囲でなければ、手元の確認結果と掲載先未確認の旨を渡す。

## Mermaid CLI を導入する

Markdown の図は、掲載先が Mermaid に対応していればプレビューだけで確認できる。手元で SVG・PNG・PDF を生成するときは、既存の `mmdc` を使うか、Node.js と pnpm が使える環境で Mermaid CLI を導入する。

一度だけ試す場合は空の作業ディレクトリで `pnpm init` を実行する。以下は、端末の Chrome を使って描画する例。CLI をインストールしたディレクトリでバージョンを確認する。[Mermaid CLI の公式手順](https://github.com/mermaid-js/mermaid-cli#installation)

```sh
pnpm add -D @mermaid-js/mermaid-cli --ignore-scripts
pnpm exec mmdc --version
```

この例ではインストール時のブラウザーダウンロードを省く。Chrome がなければ [Chrome の配布ページ](https://www.google.com/chrome/)から導入する。`puppeteer.json` にブラウザーの実行ファイルのパスを書く。次は macOS の例。[Puppeteer のブラウザー設定](https://pptr.dev/guides/configuration)

```json
{
  "executablePath": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
}
```

同じディレクトリで小さな図を描き、`sample.svg` を開いて「受付」から「完了」へ矢印がつながることを確かめる。

```sh
printf '%s\n' 'flowchart LR' '  A[受付] --> B[完了]' > sample.mmd
pnpm exec mmdc -p puppeteer.json -i sample.mmd -o sample.svg
```

## ローカルの Mermaid CLI を使う場合

以下はプロジェクトに導入済みの CLI がブラウザーを自動検出できる場合の例。上の手順で Chrome を指定した環境では、各コマンドに `-p puppeteer.json` を付ける。`diagram.mmd` にはコードフェンスを含まない Mermaid ソースを置く。

```sh
pnpm exec mmdc -i diagram.mmd -o diagram.svg
pnpm exec mmdc -i diagram.mmd -o diagram.png
```

CLI の使用バージョンを記録し、オプションは導入済み版の `mmdc --help` で確認する。
ブラウザー不足や起動制限を構文エラーと取り違えず、環境エラーが解消できなければソースの確認までで止める。
Markdown 全体を CLI に入力すると画像参照へ変換するモードもあるため、元文書をそのまま上書きせず、個別の図か一時コピーで検証する。

## ラベルの改行と折り返し

- ラベルは短くし、複数行にする場合は文節や句の区切りで改行する。単語・固有名詞の途中や、数値と単位の間を分断しない。
- 最終行に数文字だけ残る場合は、文言を短くする、ノード幅や配置を調整する、意味の区切りで明示的に改行する順に見直す。句読点や閉じ括弧が行頭に残らないかも確認する。
- 改行の記法や幅の指定は、使用する図種・ラベル形式・レンダラーで確認する。一律に改行記号を挿入したり、自動折り返しだけで意味の区切りが保たれると判断したりしない。
- 行数を合わせるために文字を縮めたり、連続した空白で位置を揃えたりしない。長い説明は図の近くへ移す。

## 結果を見る

- 出力画像を開き、実際に載せる幅でラベルの欠け・重なり・日本語の表示・線の交差を確認する。必要なら PNG にして画像ビューアーで確認する。
- ノード・矢印・グループのラベルについて、意味の区切り、単語の分断、最終行の数文字残りを確認する。文書やスライドへ埋め込む場合は、図単体と最終出力の両方で改行・文字の欠けを調べる。
- 長い図は概要と詳細に分ける。横幅の調整だけで文字が読めなくなる場合は、向き・ラベル・構成から見直す。
- 色分けする場合は背景との判別と凡例を確認する。明暗両テーマで使う予定なら両方で確認する。
- 図を直したら再描画する。ソース、生成画像、本文の意味が一致している状態を完成とする。

検証結果は「Mermaid CLI の使用版で描画・画像確認済み。GitHub での表示は未確認」のように範囲を分ける。
画像を見られない場合は「描画成功、見た目は未確認」、描画自体ができない場合は「ソース確認のみ」とする。

## 公式資料

- [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli)
- [GitHub で図を作成する](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)
