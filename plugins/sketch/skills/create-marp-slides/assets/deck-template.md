---
marp: true
theme: sketch-slides
class: message
size: 16:9
paginate: true
transition: fade 0.3s
lang: ja
title: "レビューを小さく始める"
header: "提案 / 架空のサンプル"
footer: >-
  <span class="footer-note">内容・根拠・担当は実際の資料に置き換える</span>
  <span class="progress-marker"><img src="images/progress-marker.svg" alt="現在のページ位置"></span>
---

<!-- _class: lead cover -->
<!-- _paginate: false -->
<!-- _header: "" -->
<!-- _footer: "" -->

# レビューを小さく始める

**レイアウト例 — 架空の提案**

---

## 一つの差分に一つの目的を置く

目的の異なる変更が混ざると、確認する範囲が広がります。

- 構造の整理と機能追加を分ける
- 変更理由を短い説明で伝える
- それぞれの差分を検証できる状態にする

> 目的を揃えると、何を確認すべきかを共有できます。

<!-- このページは説明例。実際に確認した課題と根拠へ置き換える。 -->

---

## 分割は確認のしやすさで決める

| 観点 | まとめる | 分ける |
| --- | --- | --- |
| 変更の目的 | 同じ目的 | 別の目的 |
| 依存関係 | 分離すると動かない | 個別に検証できる |
| 取り消し | 一緒に戻す | 個別に戻せる |

> 行数を揃えるためだけに分割しません。

---

## まず一つの変更で試す

<div class="animated-flow">
  <label class="flow-control"><input type="checkbox" checked> 動きを表示</label>
  <img class="flow-still" src="images/review-flow.svg" alt="目的を決め、差分を分け、検証とレビューを経て振り返り、次の変更につなげる">
  <img class="flow-motion" src="images/review-flow-animated.svg" alt="目的から振り返りまで、矢印に沿って順番を繰り返し表示">
</div>

> 判断のしやすさを確認し、続ける範囲を決めます。

---

<!-- _class: summary message -->

## まとめ

次の変更で、小さく試す。

**決めたいこと：試行する変更と担当**

> 期待する効果と確認方法を共有してから始めます。

<!-- 実際の依頼に合わせ、担当・時期・判断事項を具体化する。 -->
