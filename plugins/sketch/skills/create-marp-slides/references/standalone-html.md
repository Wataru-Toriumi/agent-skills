# HTML を1ファイルで共有する

配布用の `slides.html` は、画像・CSS・JavaScript を含む単一ファイルにする。
閲覧時に画像フォルダー、CDN、ローカルサーバーを必要としない。外部資料へのリンクは残してよいが、スライドの表示や操作を外部通信に依存させない。

## 生成する

Marp の出力には画像の参照が残るため、描画後に埋め込む。既存の単一ファイル化ツールがあれば利用し、なければ以下の SingleFile CLI を使う。
導入は [実行環境](rendering.md#実行環境)の方針に従う。例は Marp CLI 4.5.1、SingleFile CLI 2.26.0、http-server 14.1.1 で確認済み。依存バージョンは lockfile で固定する。

```sh
pnpm add -D @marp-team/marp-cli single-file-cli http-server
pnpm exec marp slides.md --html --theme-set ./theme.css -o slides.raw.html
pnpm exec http-server . -a 127.0.0.1 -p 8080 -c-1
```

デッキのディレクトリで起動する。既存のローカルHTTPサーバーがあればそれを使ってよい。
画像の MIME タイプを保つため、`file://` ではなく HTTP 経由で中間 HTML を読み込ませる。別のターミナルで、同じディレクトリから実行する。

```sh
pnpm exec single-file http://127.0.0.1:8080/slides.raw.html slides.html \
  --filename-conflict-action=overwrite \
  --save-raw-page=true \
  --block-scripts=false \
  --remove-hidden-elements=false \
  --remove-unused-styles=false \
  --remove-unused-fonts=false \
  --remove-alternative-fonts=false \
  --remove-alternative-medias=false \
  --remove-alternative-images=false
```

SingleFile CLI にも対応ブラウザーが必要。自動検出できなければ `--browser-executable-path` で指定する。
生成後はサーバーを停止する。配布するのは `slides.html` で、`slides.raw.html` は渡さない。修正時は中間 HTML から再生成する。

## 動きを保つ

- 元の HTML を処理し、再生後の DOM を保存しない。スライド操作用 JavaScript と、非表示ページ・停止時の図・印刷用 CSS を残す。上のオプションはこれらの削除を防ぐ。
- SVG は正しい MIME タイプのデータ URL などとして埋め込み、アニメーションを保つ。スクリーンショットや PNG への置換で済ませない。背景画像、アイコン、静止版の図も含める。
- Web フォントを使う場合は配布条件を確認して埋め込むか、ローカルの代替フォントにする。動画、iframe、外部 API などは別途対応が必要。表示に必要な参照が残った出力を、単独で再生できる成果物として渡さない。

## HTML だけで確かめる

1. 空のディレクトリへ `slides.html` だけをコピーし、サーバーを停止する。キャッシュに頼らない新しいブラウザー環境で、通信を遮断して開く。
2. 全ページで画像・背景・フォント・レイアウトを確認する。ネットワーク記録も調べ、表示や操作のための外部通信・別ファイル参照がないことを確かめる。文中に残る出典リンクとは区別する。
3. ページ送り・戻り、フェード、進捗アイコンの移動、動的SVG、停止・再開を試す。動きを減らす設定と印刷では静止版になることも確認する。

ブラウザーの機能差は [フェード](rendering.md#スライド切り替えのフェード)と [進捗バー](marp.md#最下端の進捗バー)に従う。
共有サービス内のプレビューはスクリプトを制限することがあるため、閲覧者にはダウンロードしてブラウザーで開く方法を案内する。

## 公式資料

- [SingleFile CLI](https://github.com/gildas-lormeau/single-file-cli)
- [SingleFile FAQ](https://github.com/gildas-lormeau/SingleFile/blob/main/faq.md)
