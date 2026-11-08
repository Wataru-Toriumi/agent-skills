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

[mise](https://mise.jdx.dev/getting-started.html) を導入し、リポジトリのルートで実行する。

```sh
mise trust
mise install
mise run setup
mise run check
```

次のコマンドで `plugins/my-tools/` を作成し、カタログへ登録する。
mise をシェルに有効化していない場合は、`pnpm` を `mise exec -- pnpm` に置き換える。

```sh
pnpm plugin:new my-tools --description '日常の開発作業に使うツール'
```

`skills/<skill-name>/SKILL.md` にスキルを追加する。各ファイルの先頭には
`name` と `description` を含む YAML frontmatter を置く。
用途が決まったらサンプルの `plugin-check/` は削除してよい。

設定とスクリプトの仕様は [開発ガイド](docs/development.md)、ファイルの配置は
[リポジトリの構成](docs/repository-structure.md) を参照する。

## Claude Code で使う

プラグインを追加した後、リポジトリのルートで実行する。

```sh
claude plugin validate ./plugins/my-tools
claude plugin validate .
claude plugin marketplace add .
claude plugin install my-tools@toripeeeeee-plugins
```

新しいセッションで `/my-tools:plugin-check` を実行して読み込みを確認する。
開発中は `claude --plugin-dir ./plugins/my-tools` で直接読み込むこともできる。

## Codex で使う

`codex plugin` を提供する CLI で、リポジトリのルートから実行する。

```sh
codex plugin marketplace add .
codex plugin list --marketplace toripeeeeee-plugins --available --json
codex plugin add my-tools@toripeeeeee-plugins
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
