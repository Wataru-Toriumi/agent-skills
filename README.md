# agent-skills

Claude Code と Codex で使う自作プラグインのソースを管理するリポジトリ。
プラグイン単位で `plugins/` にまとめ、スキルとスクリプトの実体を両ツールで共有する。

## プラグイン一覧

| プラグイン | 用途 | スキル |
| --- | --- | --- |
| [ink](plugins/ink/README.md) | 要求整理・文書作成・設計レビューを支援する | `clarify-requirements`、`write-prd`、`write-work-item`、`write-design-doc`、`write-adr`、`review-design` |
| [forge](plugins/forge/README.md) | 要求の実装・検証からコミット・PR・レビューまでを支援する | `implement-work-item`、`refactor-code`、`tidy-code`、`commit-changes`、`create-pr`、`review-code`、`address-pr-comments` |
| [sketch](plugins/sketch/README.md) | 図やスライドを作り、描画結果を確認・改善する | `draw-mermaid`、`create-marp-slides` |
| [probe](plugins/probe/README.md) | テスト設計・品質の検証を支援する | `plan-tests`、`design-tests`、`review-test-cases` |
| [pulse](plugins/pulse/README.md) | 監視・障害対応・振り返りを通じて運用を改善する | `plan-monitoring`、`respond-to-incident`、`write-postmortem`、`improve-operations` |

各プラグインの役割と未対応の範囲は [DevOps サイクルとの対応](docs/devops-coverage.md) を参照する。

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

対象プラグインの変更後、バージョンを更新し、検証する。

```sh
# 更新内容をプレビュー
pnpm plugin:version my-tools patch --dry-run

# 両マニフェストの version を更新
pnpm plugin:version my-tools patch

# 整合性チェックとテスト
mise run check
```

`patch` は変更に応じて `minor`・`major` に置き換える。差分を確認してコミット・pushする。
main へのマージ後、検証に成功するとプラグインごとの [GitHub Release](https://github.com/Wataru-Toriumi/agent-skills/releases) が作成される。
更新種別の選び方、配布時の注意点、CI の詳細は [プラグインの更新と配布](docs/plugin-maintenance.md) を参照する。
