# forge

変更をコミットし、PR とレビューにつなぐ、Claude Code / Codex 用プラグイン。
利用先リポジトリの規約とユーザーの依頼に合わせて、日常の開発フローを支援する。

## スキル

| スキル | 用途 |
| --- | --- |
| `commit-changes` | 差分を確認し、意味のある単位でコミットする |
| `create-pr` | 変更と検証結果を整理し、GitHub PR を作成・更新する |
| `review-code` | 差分と関連コードを読み、根拠のある問題を指摘する |

各スキルは単独でも使える。特定ホスト専用のエージェントやツール名には依存しない。
コミットには Git、PR の操作には利用環境の GitHub 接続ツールまたは CLI と認証が必要。

## 導入

利用するツールでマーケットプレイスを登録し、インストールする。

```sh
claude plugin marketplace add Wataru-Toriumi/agent-skills
claude plugin install forge@wataru-agent-plugins
```

```sh
codex plugin marketplace add Wataru-Toriumi/agent-skills
codex plugin add forge@wataru-agent-plugins
```

## 利用例

Claude Code では `/forge:commit-changes`、`/forge:create-pr`、`/forge:review-code` で呼び出す。
Codex ではインストール後のスキル一覧から該当スキルを選ぶか、スキル名を指定して依頼する。

- 「commit-changes で、今回の修正を意味のある単位に分けてコミットして」
- 「create-pr で、このブランチから main 向けの PR を作成して」
- 「create-pr で、PR の説明文だけ下書きして」
- 「review-code で、この PR に回帰がないか確認して。結果はこの会話で教えて」

コミットのみの依頼では push せず、PR 作成では必要なコミットと push を含めて進める。
`create-pr` は提出先の `PULL_REQUEST_TEMPLATE`（アカウント共通の既定テンプレートも含む）を確認し、
見出し・必須項目・チェックリストに沿って本文を作成・更新する。テンプレートがない場合は短い説明と検証結果を記す。
レビュー結果は会話で返し、GitHub への送信やコード修正は依頼に応じて行う。
履歴の書き換えとマージは、明示的に依頼された場合に扱う。
