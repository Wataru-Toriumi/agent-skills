# 開発ガイド

セットアップとプラグインの追加手順は [README](../README.md#プラグインを追加する) を参照する。

## ツールと設定

[mise](https://mise.jdx.dev/getting-started.html) で Node.js・pnpm・rumdl を揃える。
バージョンは開発用 Node.js と rumdl を [mise.toml](../mise.toml)、pnpm と最低対応 Node.js を
[package.json](../package.json) で管理する。
pnpm の更新時は `packageManager` と `pnpm-lock.yaml` を更新する。
端末固有の設定は Git 管理対象外の `mise.local.toml` に置く。

| タスク | 実行内容 |
| --- | --- |
| `mise run setup` | `pnpm install --frozen-lockfile` |
| `mise run check` | Markdown の検査、`pnpm plugin:check`、`pnpm test` |
| `mise run lint:md` | rumdl で Markdown を検査 |
| `mise run fix:md` | 自動修正し、残った指摘を報告 |

[mise をシェルに有効化](https://mise.jdx.dev/shells.html)すると `pnpm` を直接使える。
有効化しない場合は `mise exec -- pnpm ...` を使う。`mise run` はどちらでも実行できる。
CI の検証内容は [プラグインの更新と配布](plugin-maintenance.md#ci-での検証) を参照する。

## Markdown

[rumdl](https://github.com/rvben/rumdl) で README・docs・スキル・参考資料・テンプレートを検査する。
設定は [.rumdl.toml](../.rumdl.toml) で管理する。行長制限（MD013）は無効にする。
文書テンプレートは `<...>` を記入欄に使うため、HTML 判定（MD033）を除外する。
自動修正後は差分を確認する。CI では検査のみを行う。

## 生成スクリプト

`pnpm plugin:new` はひな形をコピーし、カタログに登録する。同名のディレクトリや登録があれば上書きせず終了する。
外部パッケージや事前ビルドは不要で、`node scripts/new-plugin.ts ...` でも直接実行できる。

[Node.js 標準の TypeScript 実行機能](https://nodejs.org/api/typescript.html)を使うため、スクリプトは型を取り除くだけで実行できる構文にする。
実行時に型チェックは行わない。プラグイン内の実装言語は自由。

## スキルと補助資料

補助コードはプラグイン内の `scripts/`、スキルの資料は `skills/<skill-name>/references/` などに置く。
プラグイン単位でコピーされるため、外部への相対参照やシンボリックリンクに依存させない。
全体の配置とマニフェストの仕様は [リポジトリの構成](repository-structure.md) を参照する。
