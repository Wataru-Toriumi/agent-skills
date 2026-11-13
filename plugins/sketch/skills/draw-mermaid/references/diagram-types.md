# 図種の選び方

伝えたい問いで選ぶ。図種が対応していても、配置・日本語・改行は [描画と検証](rendering.md)に沿って掲載先で確認する。

## 構造と振る舞い

| 説明したいこと | 例 | 残す情報 |
| --- | --- | --- |
| 責務・境界・依存、処理の分岐 | [flowchart](../examples/flowchart.md) | 要素の役割、条件、接続の意味 |
| 呼び出し順と応答 | [sequenceDiagram](../examples/sequence.md) | 参加者、成功・失敗の経路 |
| 状態の変化 | [stateDiagram-v2](../examples/state.md) | 状態、契機、条件、終了条件 |
| データの関連 | [erDiagram](../examples/er.md) | エンティティ、多重度、キー |
| 型の責務と関係 | [classDiagram](../examples/class.md) | 属性、操作、継承・関連の意味 |
| 配置を揃えた構成 | [block](../examples/block.md) | 層、まとまり、接続 |
| サービスと実行基盤の接続 | [architecture-beta](../examples/architecture.md) | サービス、リソース、配置境界 |
| システムと利用者・外部との関係 | [C4Context](../examples/c4-context.md) | 対象システム、外部システム、利用者 |
| システム内部のアプリとデータストア | [C4Container](../examples/c4-container.md) | 責務、技術、接続、システム境界 |

classDiagram は型のモデル、erDiagram はデータのモデルに使う。配置を指定したいなら block、接続や分岐を追わせたいなら flowchart を起点にする。
Architecture はベータ。掲載先が未対応なら flowchart、または対応環境で描画した SVG を使う。
C4 の粒度と専用構文の注意点は [C4 の使い分け](c4.md) を参照する。

## 要求と利用体験

| 説明したいこと | 例 | 残す情報 |
| --- | --- | --- |
| 要求と実現・検証の対応 | [requirementDiagram](../examples/requirement.md) | 要求ID、関係、検証方法 |
| 利用者の体験と困りごと | [journey](../examples/journey.md) | 行動、担当、評価の根拠 |
| 誰がシステムで何を達成するか | [usecase-beta](../examples/usecase.md) | アクター、目的、システム境界、関連 |
| 論点や関心の分類 | [mindmap](../examples/mindmap.md) | 中心テーマ、分類の階層 |

体験の推移は journey、アクターの目的は usecase、処理の順序は sequenceDiagram にする。mindmap の枝を依存関係や実行順序として扱わない。
usecase-beta は Mermaid 12以降のベータ構文。未対応なら flowchart での近似か描画済み SVG を使う。

## 計画と比較

| 説明したいこと | 例 | 残す情報 |
| --- | --- | --- |
| 作業期間と依存 | [gantt](../examples/gantt.md) | 開始日、期間、前提作業、節目 |
| 出来事の順序 | [timeline](../examples/timeline.md) | 時期、出来事、計画と実績の区別 |
| Gitの分岐と統合 | [gitGraph](../examples/gitgraph.md) | ブランチ、コミット、統合先 |
| 二つの軸による比較 | [quadrantChart](../examples/quadrant.md) | 軸の定義、評価根拠、位置 |
| 数量の比較や推移 | [xychart](../examples/xychart.md) | 対象、期間、単位、尺度 |
| 全体に対する内訳 | [pie](../examples/pie.md) | 母数、重複しない分類、値 |

期間と依存が必要なら gantt、出来事の順序だけなら timeline を選ぶ。内訳の比率は pie、項目間の差や時系列の変化は xychart にする。
数値・日付・評価は元資料から取り、未確認の値を図に合わせて補わない。各例の架空データはそのまま実績として使わない。

## 他の図種が必要な場合

[公式の図種一覧](https://mermaid.js.org/intro/)には、Sankey、Kanban などもある。
選んだ図種の公式資料で構文・ベータ扱い・追加依存を確認し、利用先が未対応なら対応する図種か描画済み画像へ切り替える。
