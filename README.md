# agent-skills

Claude Code と Codex で使う自作プラグインのソースを管理するリポジトリ。
プラグイン単位で `plugins/` にまとめ、スキルとスクリプトの実体を両ツールで共有する。

## 構成

```text
.claude-plugin/marketplace.json   # 両ツール用の共通カタログ
plugins/                         # 自作プラグインの本体
templates/plugin/                # コピーして使うひな形（カタログ未登録）
  plugin.json                    # Codex 用のポータブルマニフェスト
  .claude-plugin/plugin.json     # Claude Code 用マニフェスト
  skills/plugin-check/SKILL.md   # 共通の読み込み確認スキル
scripts/new-plugin.ts            # ひな形のコピーとカタログ登録
scripts/version-plugin.ts        # バージョン更新と整合性チェック
scripts/lib/
  plugin-commands.ts             # 作成・検証・バージョン更新の処理手順
  plugin-files.ts                # マニフェストとカタログの読み込み・検証
  releases.ts                    # バージョン計算と変更履歴の生成
  files.ts                       # ファイルの読み書きと失敗時の復元
```

Codex が対応する Claude 互換カタログを利用し、プラグイン一覧を一か所で管理する。
Codex のマニフェストはポータブル形式を使う。
仕様: [OpenAI のプラグインガイド](https://developers.openai.com/plugins/build/plugins)、
[Claude Code のマーケットプレイス](https://code.claude.com/docs/en/plugin-marketplaces)、
[Claude Code のマニフェスト](https://code.claude.com/docs/en/plugins-reference)。

## プラグインを追加する

Node.js 24.12 以降と pnpm 12.16.1 を使い、リポジトリのルートで実行する。
pnpm のバージョンは `package.json` の `packageManager` で固定し、
`pnpm-lock.yaml` を管理する。初回セットアップは次のとおり。

```sh
pnpm install --frozen-lockfile
```

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

## 更新と共有

プラグインごとに独立した `major.minor.patch` を管理する。
新規プラグインの初期値は `0.1.0`。配布する変更を加えたら、変更内容を添えて更新する。

```sh
# 更新前のプレビュー（ファイルは変更しない）
pnpm plugin:version my-tools patch --message '入力の検証を修正' --dry-run

# 両マニフェストの version と、プラグイン内の CHANGELOG.md を更新
pnpm plugin:version my-tools patch --message '入力の検証を修正'

# ひな形・全プラグインの名前とバージョンの整合性を検証
pnpm plugin:check
pnpm test
```

更新種別は [Semantic Versioning](https://semver.org/) に沿って選ぶ。

| 種別 | 用途 | 例 |
| --- | --- | --- |
| `patch` | 互換性を維持した修正 | `1.2.3` → `1.2.4` |
| `minor` | 互換性を維持した機能追加 | `1.2.3` → `1.3.0` |
| `major` | 既存の利用方法を壊す変更 | `1.2.3` → `2.0.0` |

`0.x` も指定した桁を更新する（`0.1.0` の `major` は `1.0.0`）。
現在のコマンドは通常の三桁のバージョンに対応し、プレリリースやビルドメタデータは扱わない。
二つのマニフェストの名前・バージョンが不一致なら、書き込む前に停止する。
`CHANGELOG.md` は `# Changelog` 見出しの下に、UTC 日付と変更内容を新しい順で追記する。
既存ファイルがある場合はこの見出しに揃える。まだ記録のない過去のリリースは補完しない。

このコマンドは手元のファイルを更新する。コミット・タグ作成・push・公開は行わない。
コード変更からバージョン更新の要否を自動判定する機能はないため、配布する変更ごとに実行する。
同じプラグインへの更新は一つずつ実行し、差分を確認してからコミットする。

- 名前・説明を変更する場合は、両マニフェストの `name`・`description` を一致させる。
- 配布後は各ツールで再インストール・再読み込みを確認する。
  インストール済みのコピーにソース編集が即時反映されるとは限らない。
- GitHub に push した後は、両ツールの `plugin marketplace add` の引数に
  `Wataru-Toriumi/agent-skills` を指定して登録できる。非公開の場合は Git 認証が必要。
- スキル本文では特定ホスト専用のツール名への依存を避ける。
  MCP・フック・エージェント定義を追加するときは、形式や実行環境の違いを個別に確認する。
  スキルの共通化だけで、これらすべての互換性が保証されるわけではない。
- 認証情報や各端末のインストールキャッシュは保存しない。

初期状態のカタログは空。ひな形をコピーしてからインストールする。

## 検証状況

`.github/workflows/validate.yml` が、全 PR の作成・更新・再オープン時と
`main` への push 時に検証する。GitHub Actions からの手動実行も可能。
Node.js 24.12.0（最低対応バージョン）と 26 系の両方で、以下を実行する。

- `pnpm install --frozen-lockfile`：マニフェストと lockfile の整合性
- `pnpm plugin:check`：ひな形と各プラグインのマニフェストの名前・バージョンの整合性
- `pnpm test`：バージョン更新、履歴の保持、dry-run、エラー時の挙動
- `git diff --exit-code`：検証によって追跡済みファイルが変更されていないこと

PR でのバージョン更新漏れ（変更前後で番号が上がったか）の判定は含まない。
マージを必ず検証成功後に制限する場合は、GitHub のルールセットで
`Validate (Node 24.12.0)` と `Validate (Node 26)` を必須チェックに指定する。

2026-11-07 に Codex CLI 0.166.0 の一時環境で、ひな形から作ったプラグインの
カタログ認識とインストールを確認済み。
TypeScript 版の生成コマンドは Node.js 26.13.0 の一時環境で、生成内容、
重複・不正名の拒否、失敗時の後片付けを確認済み。
pnpm 12.16.1 での frozen-lockfile インストールと生成コマンドの実行も確認済み。
サンプルスキルの形式検証も確認済み。
Claude Code CLI は検証環境にないため、上記の `claude plugin validate` と
実際のスキル呼び出しは利用環境で確認する。
