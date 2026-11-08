# agent-skills

Claude Code と Codex で使う自作プラグインのソースを管理するリポジトリ。
プラグイン単位で `plugins/` にまとめ、スキルとスクリプトの実体を両ツールで共有する。

## プラグイン一覧

| プラグイン | 用途 | スキル |
| --- | --- | --- |
| [ink](plugins/ink/README.md) | 要件・設計・意思決定を文書にし、設計を検証する | `write-prd`、`write-design-doc`、`write-adr`、`review-design` |
| [forge](plugins/forge/README.md) | 変更をコミットし、PR とレビューにつなぐ | `commit-changes`、`create-pr`、`review-code` |
| [sketch](plugins/sketch/README.md) | Mermaid の図を作り、描画結果を確認・改善する | `draw-mermaid` |

## プラグインを追加する

ディレクトリの役割とマニフェストの仕様は [リポジトリの構成](docs/repository-structure.md) を参照する。

[mise](https://mise.jdx.dev/getting-started.html) で開発環境を揃える。
`mise.toml` に開発用 Node.js 26.13.0 を固定し、pnpm は
`package.json` の `packageManager`（12.16.1）から読み取る。
Node.js の最低対応バージョンは引き続き 24.12.0。
mise の導入後、リポジトリのルートで初回セットアップを実行する。

```sh
mise trust
mise install
mise run setup
mise run check
```

`setup` は `pnpm install --frozen-lockfile`、`check` は
`pnpm plugin:check` と `pnpm test` を順に実行する。
`pnpm-lock.yaml` も引き続き管理する。

[mise をシェルに有効化](https://mise.jdx.dev/shells.html)していれば、
以降の `pnpm` コマンドをそのまま使える。有効化していない環境では
`mise exec -- pnpm ...` と実行する。`mise run` はシェルへの有効化なしでも使える。
端末固有の設定は Git 管理対象外の `mise.local.toml` に置く。
開発用 Node.js の更新は `mise.toml`、pnpm の更新は `package.json` と
`pnpm-lock.yaml` に反映する。

外部パッケージへの依存や事前ビルドはなく、次のコマンドで生成する。

```sh
pnpm plugin:new my-tools --description '日常の開発作業に使うツール'
```

`plugins/my-tools/` の作成とカタログへの登録が完了する。
同名のディレクトリや登録がある場合は上書きせず終了する。

`node scripts/new-plugin.ts ...` で直接実行することもできる。
[Node.js 標準の TypeScript 実行機能](https://nodejs.org/api/typescript.html)を使用するため、
生成スクリプトでは型を取り除くだけで実行できる構文を使う。
この実行方法は型チェックを行わない。プラグイン内の実装言語は自由。

`skills/<skill-name>/SKILL.md` にスキルを追加する。各ファイルの先頭には
`name` と `description` を含む YAML frontmatter を置く。
用途が決まったらサンプルの `plugin-check/` は削除してよい。
補助コードはプラグイン内の `scripts/`、資料はスキル内の `references/` などに置く。
インストール時にプラグイン単位でコピーされるため、プラグイン外への相対参照や
シンボリックリンクに依存しない。

## Claude Code で使う

プラグインを追加した後、リポジトリのルートで実行する。

```sh
claude plugin validate ./plugins/my-tools
claude plugin validate .
claude plugin marketplace add .
claude plugin install my-tools@wataru-agent-plugins
```

新しいセッションで `/my-tools:plugin-check` を実行して読み込みを確認する。
開発中は `claude --plugin-dir ./plugins/my-tools` で直接読み込むこともできる。

## Codex で使う

`codex plugin` を提供する CLI で、リポジトリのルートから実行する。

```sh
codex plugin marketplace add .
codex plugin list --marketplace wataru-agent-plugins --available --json
codex plugin add my-tools@wataru-agent-plugins
```

新しいセッションでスキル選択から `plugin-check` を選び、読み込み確認を依頼する。
ChatGPT デスクトップアプリ側で利用する場合は、アプリを再起動し、
プラグイン一覧からこのマーケットプレイスを選んでインストールする。

## 更新方法

対象プラグインの変更後、変更内容を添えてバージョンを更新し、検証する。

```sh
# 更新内容をプレビュー
pnpm plugin:version my-tools patch --message '入力の検証を修正' --dry-run

# 両マニフェストの version と CHANGELOG.md を更新
pnpm plugin:version my-tools patch --message '入力の検証を修正'

# 整合性チェックとテスト
mise run check
```

`patch` は変更に応じて `minor`・`major` に置き換える。差分を確認してコミット・pushする。
更新種別の選び方、配布時の注意点、CI の詳細は [プラグインの更新と配布](docs/plugin-maintenance.md) を参照する。
