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
```

Codex が対応する Claude 互換カタログを利用し、プラグイン一覧を一か所で管理する。
Codex のマニフェストはポータブル形式を使う。
仕様: [OpenAI のプラグインガイド](https://developers.openai.com/plugins/build/plugins)、
[Claude Code のマーケットプレイス](https://code.claude.com/docs/en/plugin-marketplaces)、
[Claude Code のマニフェスト](https://code.claude.com/docs/en/plugins-reference)。

## プラグインを追加する

Node.js 24.12 以降を使い、リポジトリのルートで実行する。
外部パッケージへの依存はなく、`npm install` や事前ビルドは不要。

```sh
npm run plugin:new -- my-tools --description '日常の開発作業に使うツール'
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

- 変更時は二つのマニフェストの `name`・`version`・`description` を一致させる。
- 配布する更新では両方の `version` を上げ、各ツールで再インストール・再読み込みを確認する。
  インストール済みのコピーにソース編集が即時反映されるとは限らない。
- GitHub に push した後は、両ツールの `plugin marketplace add` の引数に
  `Wataru-Toriumi/agent-skills` を指定して登録できる。非公開の場合は Git 認証が必要。
- スキル本文では特定ホスト専用のツール名への依存を避ける。
  MCP・フック・エージェント定義を追加するときは、形式や実行環境の違いを個別に確認する。
  スキルの共通化だけで、これらすべての互換性が保証されるわけではない。
- 認証情報や各端末のインストールキャッシュは保存しない。

初期状態のカタログは空。ひな形をコピーしてからインストールする。

## 検証状況

2026-11-07 に Codex CLI 0.166.0 の一時環境で、ひな形から作ったプラグインの
カタログ認識とインストールを確認済み。
TypeScript 版の生成コマンドは Node.js 26.13.0 の一時環境で、生成内容、
重複・不正名の拒否、失敗時の後片付けを確認済み。
サンプルスキルの形式検証も確認済み。
Claude Code CLI は検証環境にないため、上記の `claude plugin validate` と
実際のスキル呼び出しは利用環境で確認する。
