# リポジトリの構成

```text
.claude-plugin/marketplace.json   # 両ツール用の共通カタログ
plugins/                         # 自作プラグインの本体
docs/                            # 開発者向けの構成・管理資料
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
mise.toml                       # 開発ツールとセットアップ・検証タスク
```

Codex が対応する Claude 互換カタログを利用し、プラグイン一覧を一か所で管理する。
Codex のマニフェストはポータブル形式を使う。
仕様: [OpenAI のプラグインガイド](https://developers.openai.com/plugins/build/plugins)、
[Claude Code のマーケットプレイス](https://code.claude.com/docs/en/plugin-marketplaces)、
[Claude Code のマニフェスト](https://code.claude.com/docs/en/plugins-reference)。
