# 形式別のセットアップ手順

## Marp で HTML・PDF・画像を出力する

既存の Marp コマンドや Marp for VS Code があれば使う。CLI を新しく用意する場合は、Node.js と pnpm が使える資料用の作業ディレクトリで以下を実行する。一度だけ試す場合は空のディレクトリを使い、`pnpm init` で始める。[Marp CLI の導入手順](https://github.com/marp-team/marp-cli#installation)

```sh
pnpm add -D @marp-team/marp-cli
pnpm exec marp --version
```

PDF・画像・PPTX への変換には Chrome、Edge、Firefox のいずれかを用意する。作業ディレクトリに短い Markdown を `sample.md` として保存し、`pnpm exec marp sample.md --pdf -o sample.pdf` で出力を確かめる。ブラウザーが検出されない場合は `--browser-path` で実行ファイルを指定する。

画像も含めて HTML を1ファイルで渡す場合は、[単一 HTML の作成手順](standalone-html.md)で SingleFile CLI とローカル HTTP サーバーの導入・起動方法を確認する。

## ローカル動画を含む PPTX を作る

PowerPoint がある場合は、[動画を埋め込む手順](rendering.md#pptx-にローカル動画を埋め込む)へ進む。新規 PPTX を Node.js で生成する場合は、資料用の pnpm プロジェクトで PptxGenJS を導入し、モジュールが読み込めることを確かめる。[PptxGenJS の導入手順](https://gitbrent.github.io/PptxGenJS/docs/installation/)

```sh
pnpm add pptxgenjs
node -p "require.resolve('pptxgenjs')"
```

## Google スライドを編集する

ブラウザーで利用する場合は、対象の Google アカウントでログインし、指定された資料を編集できること、または保存先で新規作成できることを確認する。接続や API を使う場合の認証・権限の確認と、手元の動画を挿入するときの Drive の扱いは [Google スライドの手順](google-slides.md)に従う。
