# 開発ガイド

セットアップとプラグインの追加手順は [README](../README.md#プラグインを追加する) を参照する。
開発エージェント向けの共通ルールは [AGENTS.md](../AGENTS.md) で管理し、`CLAUDE.md` からも読み込む。

## ツールと設定

[mise](https://mise.jdx.dev/getting-started.html) で Node.js・pnpm・rumdl を揃える。
バージョンは開発用 Node.js と rumdl を [mise.toml](../mise.toml)、pnpm と最低対応 Node.js を
[package.json](../package.json) で管理する。
pnpm の更新時は `packageManager` と `pnpm-lock.yaml` を更新する。
端末固有の設定は Git 管理対象外の `mise.local.toml` に置く。

| タスク | 実行内容 |
| --- | --- |
| `mise run setup` | `pnpm install --frozen-lockfile` |
| `mise run check` | コード・文書の検査、`pnpm plugin:check`、`pnpm test` |
| `mise run lint:code` | Biome で TypeScript の lint・整形・import 順序を検査 |
| `mise run fix:code` | コードの整形・import 整理・安全な lint 修正 |
| `mise run lint:md` | rumdl で Markdown を検査 |
| `mise run fix:md` | 自動修正し、残った指摘を報告 |
| `mise run lint:text` | textlint で日本語の冗長表現を検査 |
| `pnpm plugin:release --repository Wataru-Toriumi/agent-skills` | コミット済みの変更から Release 本文をプレビュー |

[mise をシェルに有効化](https://mise.jdx.dev/shells.html)すると `pnpm` を直接使える。
有効化しない場合は `mise exec -- pnpm ...` を使う。`mise run` はどちらでも実行できる。
CI の検証内容は [プラグインの更新と配布](plugin-maintenance.md#ci-での検証) を参照する。

## TypeScript

[Biome](https://biomejs.dev/) で `scripts/`・`tests/` の TypeScript を検査する。
設定は [biome.json](../biome.json)、固定バージョンは [package.json](../package.json) で管理する。
推奨ルールに加え、`useConsistentFunctionStyle` の `expression` と `useArrowFunction` をエラーに設定し、
関数は原則 `const name = () => {}` にする。`useConsistentFunctionStyle` は実験的な nursery ルールのため、更新時に挙動を確認する。

メソッド・オーバーロード・ジェネレーターや、`this`・`arguments` が必要な関数は意味を保つ形式にする。
ルールを抑制する場合は、その行に理由を添える。名前付き関数式・default export など、ルールの対象外もレビューで確認する。
arrow 化では初期化前の呼び出しを避け、`asserts` 関数は変数に関数型を明示して型の絞り込みを保つ。

整形はスペース2つ・シングルクォート・行幅100文字とし、import を自動整理する。
`mise run fix:code` の実行後は差分を確認する。CI は警告も失敗扱いとし、自動修正しない。

## Markdown

[rumdl](https://github.com/rvben/rumdl) で README・docs・スキル・参考資料・テンプレートを検査する。
設定は [.rumdl.toml](../.rumdl.toml) で管理する。行長制限（MD013）は無効にする。
文書テンプレートは `<...>` を記入欄に使うため、HTML 判定（MD033）を除外する。
自動修正後は差分を確認する。CI では検査のみを行う。

[textlint](https://textlint.org/) は同じ範囲の文書を対象に、
[冗長表現のルール](https://github.com/textlint-ja/textlint-rule-ja-no-redundant-expression)だけを使う。
設定は [.textlintrc.json](../.textlintrc.json)、除外対象は [.textlintignore](../.textlintignore) で管理する。
指摘は文脈を確認して修正する。段落間の説明の重複や、内容の要否はレビューで判断する。

## 生成スクリプト

`pnpm plugin:new` はひな形をコピーし、カタログに登録する。同名のディレクトリや登録があれば上書きせず終了する。
外部パッケージや事前ビルドは不要で、`node scripts/new-plugin.ts ...` でも直接実行できる。

[Node.js 標準の TypeScript 実行機能](https://nodejs.org/api/typescript.html)を使うため、スクリプトは型を取り除くだけで実行できる構文にする。
実行時に型チェックは行わない。プラグイン内の実装言語は自由。

## スキルと補助資料

補助コードはプラグイン内の `scripts/`、スキルの資料は `skills/<skill-name>/references/` などに置く。
プラグイン単位でコピーされるため、外部への相対参照やシンボリックリンクに依存させない。
全体の配置とマニフェストの仕様は [リポジトリの構成](repository-structure.md) を参照する。
