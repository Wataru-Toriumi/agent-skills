# ink

要件・設計・意思決定を文書にする、Claude Code / Codex 用プラグイン。
既存の資料やリポジトリの文脈を使い、新規文書の作成と既存文書の更新を支援する。

## スキル

| スキル | 文書で答える問い | 慣例がない場合の保存先 |
| --- | --- | --- |
| `write-prd` | 誰の、どの課題を、どこまで解決するか | `docs/prd/<topic>.md` |
| `write-design-doc` | 要求をどう実現し、どう検証するか | `docs/design/<topic>.md` |
| `write-adr` | なぜその設計判断を選び、何を受け入れたか | `docs/adr/<番号>-<topic>.md` |

ユーザーの指定と利用先リポジトリの書式を優先する。チャット上の草案を依頼した場合は、ファイルを作成しない。
各スキルの `assets/` に Markdown のひな形を同梱している。

## 導入

利用するツールでマーケットプレイスを登録し、インストールする。

```sh
claude plugin marketplace add Wataru-Toriumi/agent-skills
claude plugin install ink@wataru-agent-plugins
```

```sh
codex plugin marketplace add Wataru-Toriumi/agent-skills
codex plugin add ink@wataru-agent-plugins
```

## 利用例

Claude Code では `/ink:write-prd`、`/ink:write-design-doc`、`/ink:write-adr` で呼び出す。
Codex ではインストール後のスキル一覧から該当スキルを選ぶか、スキル名を指定して依頼する。

- 「write-prd で、社内申請の承認待ちを減らす機能の PRD を作成して。対象は申請者と承認者。分析メモはこのファイル」
- 「write-design-doc で、この PRD と既存コードをもとに通知機能の Design Doc を作成して。再送と重複通知の扱いも整理して」
- 「write-adr で、同期処理からキュー方式への変更判断を記録して。選択理由と受け入れる運用負担はこのメモを参照して」
- 「write-adr で、既存 ADR を置き換える提案を作成して。まだ採用は決まっていない」

外部ツールへの接続や特定ホスト専用の機能には依存しない。
根拠を確認できない要件や合意は、仮説・提案・未決事項として区別する。
