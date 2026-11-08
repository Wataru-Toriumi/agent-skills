# sketch

Mermaid で伝わる図を作る、Claude Code / Codex 用プラグイン。
図種と粒度の選定、作図、描画結果の確認と改善を `draw-mermaid` スキルで行う。

## 使い方

利用するツールでマーケットプレイスを登録し、インストールする。

```sh
claude plugin marketplace add Wataru-Toriumi/agent-skills
claude plugin install sketch@wataru-agent-plugins
```

```sh
codex plugin marketplace add Wataru-Toriumi/agent-skills
codex plugin add sketch@wataru-agent-plugins
```

Claude Code では `/sketch:draw-mermaid`、Codex ではスキル一覧や `draw-mermaid` の名前から利用する。

- 「draw-mermaid で、この設計のシステム境界と依存関係を図にして」
- 「このシーケンス図に仕様にある権限エラーを追加して、読みやすく整理して」
- 「README の Mermaid が横長なので、意味を保って描き直して。描画結果も確認して」

Markdown の Mermaid ブロックや `.mmd` ソースを出力し、必要に応じて SVG / PNG を生成する。
描画には利用先のプレビューまたは Mermaid CLI などを使う。CLI・ブラウザー・MCP サーバーは同梱せず、自動導入しない。
描画できない環境でもソースは作成し、未検証の範囲を伝える。

## 配色

標準は通常・既存をグレー、変更・提案を青、未決・要確認をアンバーで表す。
ユーザー指定と利用先の既存配色を優先し、必要な箇所だけ強調する。
明暗別のテーマ設定と flowchart の強調例を同梱している。
配色だけに意味を持たせず、ラベルや線種も併用する。

- 「落ち着いた配色で、変更する部分だけ青にして」
- 「提案は紫、未決事項はアンバーにして」
- 「暗い背景向けの PNG にして」

色値と適用手順は [配色ルール](skills/draw-mermaid/references/colors.md) で管理する。
固定した配色は閲覧者の明暗テーマへ自動追従しないため、掲載先に合わせて確認する。

## 他のプラグインから利用する

`ink` などと併用する場合も `sketch` を個別に導入する。必須依存や他プラグインのインストール先への固定パスは設けない。
利用側のスキルは、現在の環境で利用可能な `sketch` の `draw-mermaid` を名前で見つけ、その手順を適用する。
これはエージェントへの連携指示であり、コードの import や自動依存解決ではない。

利用側から図の目的・読者・粒度・根拠となる要素や関係・掲載先・配色の希望を渡し、作図側からソース・短い説明・検証状況を返す。
文書の要求や設計判断は利用側で管理する。利用できない場合は、利用側の通常の文書作成を続ける。

## 検証状況

Codex CLI 0.166.0 の一時環境でインストールと同梱ファイルの一致を確認済み。
`examples/` の4例は Mermaid CLI 12.2.0（Mermaid 12.3.0）で描画し、画像を確認済み。
標準テーマは4図種の明暗両方で描画・画像確認済み。flowchart の強調色と図内へのテーマ設定の埋め込みも確認済み。
Claude Code での実行、GitHub 上の表示、エージェントによる `ink` との連携動作は未検証。
