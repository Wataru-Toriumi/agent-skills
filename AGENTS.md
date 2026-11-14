# 開発ルール

このリポジトリで Claude Code・Codex 用プラグインを開発するときの共通ルール。

## 作業とツール

- 新しい作業は最新の `origin/main` からブランチを作る。既存作業の続きやユーザーの指定がある場合は、そのブランチを使う。未コミットの変更を保持する。
- 開発ツールは mise、パッケージ管理は pnpm を使う。セットアップは `mise run setup`。詳細は [開発ガイド](docs/development.md) を参照する。
- リポジトリの生成・管理スクリプトは TypeScript で書き、Node.js の型除去で実行できる構文にする。
- `scripts/`・`tests/` の関数は原則 `const` の arrow 関数とし、Biome で検査・整形する。例外は [開発ガイド](docs/development.md#typescript) に従う。

## 文書とスキル

- 文章は結論と必要な根拠を短く書く。同じ説明の繰り返し、一般論、不要な注意書きを省く。
- README は利用者向けの説明とコマンドに絞り、開発・保守の詳細は `docs/` に置く。
- `SKILL.md` には判断基準と手順を記載し、詳細資料はスキル直下の `references/`、出力用ひな形は `assets/` に分ける。本文から必要な資料へリンクする。
- スキルの実体は両ツールで共有する。特定ホストのツール名や、配布するプラグインの外への相対参照に依存させない。配置は [リポジトリの構成](docs/repository-structure.md) に従う。

## 変更と検証

- 新規プラグインは `pnpm plugin:new` で作成する。配布内容を変更したら `pnpm plugin:version` で両マニフェストを更新する。変更内容はコミット・PR に記載し、GitHub Release に集約する。種別は [更新と配布](docs/plugin-maintenance.md#バージョン管理) に従う。
- 完了前に `mise run check` を実行する。同じ差分で成功済みなら結果を再利用する。未実行・失敗した検証は明記する。
- スキルの検証では lint に加え、参照先、手順の矛盾、操作範囲を確認する。判断や手順を大きく変える場合は、具体的な利用例でも確かめる。

## コミットと PR

- コミットを依頼されたら [commit-changes](plugins/forge/skills/commit-changes/SKILL.md) に従う。独立して採用・取り消しできる目的で分割し、変更内容が伝わる件名にする。
- PR を依頼されたら [create-pr](plugins/forge/skills/create-pr/SKILL.md) に従う。先に [review-code](plugins/forge/skills/review-code/SKILL.md) でセルフレビューし、提出先の PR テンプレートに沿って本文を書く。
- レビューの指摘は発生条件・根拠・影響を示す。不具合、確認事項、改善提案を区別する。
- 重要変更の独立レビュー、対象SHAの記録、再検証・マージ条件は [レビューとマージ](docs/review-and-merge.md) に従う。
