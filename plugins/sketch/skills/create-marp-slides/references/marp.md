# Marp の記法

## デッキとページの設定

先頭に front matter を置き、スライド間を `---` で区切る。

```markdown
---
marp: true
theme: sketch-slides
size: 16:9
paginate: true
lang: ja
title: "発表タイトル"
---

<!-- _class: lead cover -->
<!-- _paginate: false -->

# 発表タイトル

---

## このページで伝える結論

結論を支える根拠。
```

`theme` は全体に適用する。`class` や `paginate` は指定ページ以降に続き、`_class` や `_paginate` はそのページだけに適用する。
同梱テーマの `lead` は濃色背景の指定。テーマ名だけでは CSS は読み込まれないため、CLI の `--theme-set` またはエディターのテーマ設定で登録する。
最初の表紙は `_class: lead cover` とし、タイトルと補足を上下中央・左揃えにする。`message` クラスと下部メッセージは付けない。
`cover` は表紙だけに適用する。「まとめ」は `_class: summary message` とし、本文と同じ明るい背景・上部タイトルを使う。

## 下部に固定するスライドメッセージ

同梱テーマでは `message` クラスを使い、そのページの最後の引用ブロックに要点を書く。
本文の引用と区別するため、メッセージは末尾に一つだけ置く。`message` がなければ引用ブロックは通常の本文として表示する。

```markdown
<!-- _class: message -->

## このページで伝える結論

結論を支える本文や図表。

> 読み手に持ち帰ってほしい要点。
```

全ページに使う場合は front matter に `class: message` を置く。
濃色ページでは `_class: lead message` とし、`_class` による上書きで `message` を落とさない。
メッセージは下端から64pxの位置に固定し、本文には専用の余白を確保する。短い1〜2行に収め、長い理由は本文へ移す。
出典などの `footer` とページ番号は、その下の領域を使う。進捗アイコンとの間にも余白を確保する。

## 最下端の進捗バー

同梱テーマは最下端に高さ6pxの進捗バーを表示し、ページごとに8pxの隙間で区切る。表紙を除いたページ位置を表し、現在までの区切りを強調色、残りを薄い色で示す。
表紙を含む5枚なら4区切りになり、最後のページですべて埋まる。時間の経過や発表時間の割合ではない。

先頭を表紙にし、`paginate: true` と表紙の `_paginate: false` を使う。表紙もページ数には含め、`skip`・`hold` による番号の変更は使わない。
Marp が生成するページ番号と総数から幅を計算するため、追加・削除・並べ替え後はHTML・PDFを再生成する。

CSS の型付き `attr()` に対応するブラウザーが必要。HTMLの閲覧先とPDFの変換用ブラウザーで確認し、未対応ならバーを表示せずページ番号を残す。
HTML専用の `--bespoke.progress` は併用しない。ページ送り・戻り、PDFの先頭・途中・末尾で長さを確認する。

### 配色・区切り・アイコン

テーマの `--progress-height`・`--progress-gap` で太さと隙間、`--progress-color`・`--progress-track` で通過部分と残りの色を変える。濃色ページの指定は `section.lead` にある。

ひな形の `footer` にある `progress-marker` は任意。現在の区切りの中央に20pxのSVGを一つ置く。
`img` の `src` と `alt` を替えれば画像と説明を変更できる。アイコンだけで内容を説明せず、ページ番号とスライドの見出しを残す。
不要なら `progress-marker` の `span` を削除する。位置はページ番号と総数から自動計算するため、ページ数・順序の変更に追従する。
表紙は `_footer: ""` で非表示にする。「まとめ」は共通フッターを使い、テーマ側で注記だけを隠してアイコンを残す。

HTMLでは同じ `view-transition-name` を持つ画像がページ間を滑らかに移動する。各ページのマーカーは一つにし、ページ送り・戻りの両方向を確認する。
動きを減らす設定や未対応のブラウザーでは移動の演出を省き、PDFでは各ページの現在位置に静止表示する。

フッターのHTMLを使うため、変換時に `--html` を付ける。利用者が管理するテンプレートと画像を使い、外部のHTMLをそのまま組み込まない。

## 画像と図

```markdown
![w:900 構成要素と接続先](images/architecture.svg)
```

図の比率を保ち、表示幅と高さを確認する。背景に写真を置く場合の例は `![bg right:40%](images/photo.jpg)`。
背景画像は切り抜かれることがあるため、図表のラベルを隠さない。必要なら `bg contain` を使う。
画像の説明は代替テキストに、判断に必要な結論や出典は見える本文にも残す。

Mermaid は先に画像化する。独自の HTML や JavaScript を埋め込む前に、その機能が利用先で対応しているかを確かめる。

ひな形には [Mermaid ソース](../assets/images/review-flow.mmd)、[静止 SVG](../assets/images/review-flow.svg)、[動的 SVG](../assets/images/review-flow-animated.svg) を同梱している。
編集用ソースでは `images/` の配置を保つ。図を変えたら両方の SVG と HTML・PDF を再生成し、[配布用 HTML に埋め込む](standalone-html.md)。
Mermaid 12.3以降に対応した CLI で、デッキのディレクトリから次のように描画する。

```sh
pnpm exec mmdc -i images/review-flow.mmd -o images/review-flow-animated.svg -b transparent
pnpm exec mmdc -i images/review-flow.mmd -o images/review-flow.svg -b transparent -C images/review-flow-static.css
```

`step` で矢印の再生順、`stepDuration` で各経路の秒数を指定する。同じソースから静止版も作り、[静止版の CSS](../assets/images/review-flow-static.css)で動きの重ね描きだけを隠す。
ひな形の `animated-flow` は「動きを表示」で動的SVGと静止SVGを切り替える。HTMLでは繰り返し再生し、印刷・PDFと動きを減らす設定では静止版を使う。
動きは説明用で、実処理の実行状態や所要時間を示さない。スライドの再表示や再開時は途中から再生されることがあるため、先頭からの説明が必要なら再生時刻を制御できる埋め込み方を選ぶ。
HTMLでマーカーの移動・順番・停止操作・再表示を確認する。PDFでは静止版が選ばれ、経路とラベルが一致することを確認する。

## 発表者ノート

ディレクティブ以外の HTML コメントをノートとして使える。
ノートは配布ファイルに含まれることがあるため、読者へ渡してはいけない情報は書かない。
重要な条件や出典をノートだけへ隠さない。

## 公式資料

- [ディレクティブ](https://marpit.marp.app/directives)
- [画像](https://marpit.marp.app/image-syntax)
- [テーマ CSS](https://marpit.marp.app/theme-css)
- [発表者ノート](https://marpit.marp.app/usage?id=presenter-notes)
