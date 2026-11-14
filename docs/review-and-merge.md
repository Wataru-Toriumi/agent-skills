# レビューとマージの条件

## レビューの記録

すべてのPRで、要求・差分・検証結果をセルフレビューする。
権限・秘密情報・データ移行・公開API・配布処理・CIの権限を変える場合は、
実装セッションとは別のレビューに、元の要求、base/head SHA、差分、検証証跡を渡す。
実装者の結論を正解として渡さず、指摘を根拠から確認する。

結果には、レビュー担当またはセッション、対象SHA、確認範囲、指摘と対応、未確認事項を残す。
GitHubへ送信するのは依頼範囲に含まれる場合だけとし、会話内のレビューをGitHubの承認と同一視しない。
レビュー担当を確保できなければ、未完了としてマージ判断へ渡す。

追加変更が入ったら、旧headとの差分を確認する。振る舞い・依存・権限が変わった範囲は再検証・再レビューし、
古いSHAへの承認やCI成功を新しいheadの証跡として使わない。
文言のみの修正でも、スキルの起動条件や操作範囲が変わっていないか確認する。

## GitHubで強制する条件

[main-quality-gate](../.github/rulesets/main-quality-gate.json) は、mainへのPR経由の変更、
レビューの未解決スレッド解消、最新mainを含む検証を要求する。削除・force pushは禁止し、bypassは設けない。
必須チェックはGitHub Actionsを発行元に限定する。

- `Validate (Node 24.12.0)`
- `Validate (Node 26)`
- `Distribution validation`
- `Plugin version policy`

他者承認の必須数は0。重要変更の独立レビューは上記の運用で確認する。
他者1名の承認も強制する場合は、設定の `required_approving_review_count` を1に変更してレビュー・適用する。
PR作成者本人の承認では満たせないため、レビュー担当を確保してから切り替える。

## 適用と確認

設定ファイルをマージするだけではGitHubのルールは変わらない。
先に配布物検証・版更新検査のworkflowをmainへマージし、各チェックの成功を確認する。
2026-11-14の確認では、既存rulesetは削除・force pushの禁止のみ。
旧branch protectionは接続権限不足で取得できず、強制条件の全体は未確認。

既定は読み取りのみで、現在値・予定値・不足しているworkflowを表示する。
読み取り権限で取得できない `bypass_actors` は未確認として表示し、既知の差分がなければ `inspect` を返す。
適用時に現在のbypass設定を確認できない場合は、書き込む前に停止する。

```sh
mise exec -- node scripts/sync-main-rules.ts --repository Wataru-Toriumi/agent-skills
```

適用には、対象リポジトリのAdministration:write権限を持つトークンを
`RULESET_ADMIN_TOKEN` に設定し、同じコマンドに `--apply` を付ける。
このコマンドは `main-quality-gate` だけを作成・更新し、既存の別rulesetを保持する。
応答が不明ならplanを再取得し、二重作成しない。適用後はAPIで設定を再取得して照合する。

Actionsからは `Manage main quality gate` をmain上で手動実行する。
`repository-administration` Environmentをmain限定・担当者承認付きに設定し、
そのEnvironment Secretへトークンを登録する。最初は `apply: false` で差分を確認し、
適用時に `apply: true` を選ぶ。通常のPR検証へ管理トークンは渡さない。

適用後、GitHubのRules画面とPRの必須チェックを確認する。追加・更新したチェックが実際に要求されることを確認してから運用開始とする。
ルール変更・解除も設定差分をレビューしてから適用する。障害時の手動変更は理由と実設定を記録し、後から設定ファイルへ反映する。

設定項目と権限は [GitHub Rulesets API](https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset) を参照する。
