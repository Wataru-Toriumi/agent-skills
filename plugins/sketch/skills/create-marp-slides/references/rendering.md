# 描画と出力

## 実行環境

既存の Marp CLI、プロジェクトのコマンド、Marp for VS Code を優先し、実際のバージョンとオプションを確認する。
このスキルに CLI・ブラウザーは同梱しない。導入が必要なら利用先のルールと依頼範囲に従い、一時的な検証のために既存プロジェクトの依存関係を増やさない。

pnpm のプロジェクトへ導入する場合は `pnpm add -D @marp-team/marp-cli` とし、lockfile でバージョンを固定する。
以下は導入済みの CLI を使い、`slides.md` と `theme.css` を同じディレクトリに置いた例。

```sh
pnpm exec marp --version
pnpm exec marp slides.md --html --theme-set ./theme.css -o slides.html
pnpm exec marp slides.md --html --theme-set ./theme.css --pdf -o slides.pdf
pnpm exec marp slides.md --html --theme-set ./theme.css --images png -o preview.png
```

`--images png` は全ページ、`--image png` は先頭ページだけを出力する。全ページの確認には前者を使う。
`--html` はひな形の進捗アイコンと図の再生切り替えに必要。画像を含む変換では下記の `--allow-local-files` も指定する。
PDF・PPTX・画像への変換には対応ブラウザーが必要。画像生成が成功しても、配置やフォントの正しさは別に確認する。

ローカル画像が必要な変換では、Markdown・CSS の参照先を確認した上で `--allow-local-files` を付ける。
画像が出ない原因を解決するために、資料を無断で外部へアップロードしない。
HTML を別の場所へ渡す場合は画像も同じ相対配置で渡し、受け渡し先で読み込めるか確認する。

## 出力形式の選択

標準は、同じ Markdown・CSS・画像から生成する発表用 HTML と配布用 PDF のセット。
`slides.html`・`slides.pdf` のように名前を揃え、修正時は両方を再生成する。形式を限定された場合は、その指定に従う。
HTML はフェードとページ操作、PDF は静止した内容とレイアウトを確認し、ページ数・順序・主張が一致することを確かめる。

| 形式 | 用途 | 確認すること |
| --- | --- | --- |
| Markdown・CSS・画像 | 継続的な編集 | テーマ登録、相対パス、必要なフォント |
| HTML | ブラウザーでの発表 | 画像とフォント、表示・ページ送り |
| PDF | 固定した見た目での配布 | ページ数、文字や図の欠け、リンク |
| PPTX | PowerPoint 等での再生 | 標準は画像ベースで、文字や図形を個別編集する用途に向かない |

PPTX が必要なら `pnpm exec marp slides.md --html --theme-set ./theme.css --pptx -o slides.pptx` で生成する。
編集可能な PPTX を求められた場合は、標準出力との差を説明する。実験的な `--pptx-editable` には追加環境が必要で、再現性とノートに制約があるため、利用するバージョンの公式資料を確認する。

## スライド切り替えのフェード

HTML での発表は、front matter に `transition: fade 0.3s` を指定する。
Marp CLI の `bespoke` テンプレート（既定）と、View Transition API に対応するブラウザーで動作する。

```yaml
transition: fade 0.3s
```

特定のページから次のページへの切り替えだけ無効にする場合は `<!-- _transition: none -->` を使う。
デッキ全体の動きをなくす場合は `transition: none` にする。閲覧環境の動きを減らす設定を妨げない。

生成した HTML をブラウザーで開き、ページ送り・戻りでフェードが動き、終了後にタイトル・本文・メッセージを読めることを確かめる。
PDF・標準の PPTX・画像は静止版であり、アニメーションの確認には使わない。未対応の環境でも内容が伝わる構成にする。

## 全ページを確認する

- 画像一覧で密度、色、見出し位置のばらつきを確認し、各ページも開いて読む。
- タイトル、本文、表、図、コード、注記、ページ番号の欠けや重なりを調べる。自動のはみ出し検査を使う場合も、画像による確認を省略しない。
- 元資料の数値・条件・出典を照合し、例示や未確認の情報が事実に見えないかを確かめる。
- 修正したら再出力し、要求された最終形式を開く。実行できなかった確認は、完了した確認と分けて報告する。

## 公式資料

- [Marp CLI](https://github.com/marp-team/marp-cli)
- [Marp for VS Code](https://github.com/marp-team/marp-vscode)
- [スライド切り替え](https://github.com/marp-team/marp-cli/blob/main/docs/bespoke-transitions/README.md)
