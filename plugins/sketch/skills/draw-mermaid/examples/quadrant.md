# 二つの軸で比較する

架空の改善候補の例。横軸を実装負担、縦軸を期待効果とし、相対評価を0〜1で置く。
軸の向きと評価根拠を説明し、測定していない評価を実測値に見せない。

```mermaid
quadrantChart
    title 改善候補（架空の評価）
    x-axis 負担が小さい --> 負担が大きい
    y-axis 効果が小さい --> 効果が大きい
    quadrant-1 計画して進める
    quadrant-2 先に試す
    quadrant-3 余力で検討
    quadrant-4 見送る候補
    入力例: [0.2, 0.7]
    自動照合: [0.75, 0.8]
    配色変更: [0.25, 0.2]
```

象限だけで採否を確定しない。制約・リスク・評価の不確かさも本文へ残す。

## 構文の確認先

[Quadrant Chart の公式資料](https://mermaid.js.org/syntax/quadrantChart.html)
