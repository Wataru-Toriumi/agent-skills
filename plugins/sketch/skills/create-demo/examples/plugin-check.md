# 配布前にリンク切れを見つけて直す

プラグインの作者が、検査結果から導入手順のリンク切れを見つけて直せるか試す。

**開始条件**　`agent-skills` の作業用コピーを用意し、リポジトリのルートで `mise run setup` を済ませる。実行時のコミットは `779daac`。エラー表示の絶対パスは一部省略した。

| 操作 | 実行結果 |
| --- | --- |
| 1. `mise exec -- pnpm plugin:check` を実行する。 | `Distribution valid: marketplace, template and 5 plugin(s).` |
| 2. `plugins/sketch/skills/caption-video/SKILL.md` のリンク先を `references/setup.md` から `references/setpu.md` に変え、同じコマンドを実行する。 | `Missing reference in …/caption-video/SKILL.md: references/setpu.md` と表示され、終了コードは 1。 |
| 3. リンク先を `references/setup.md` に戻して再実行する。 | 手順 1 と同じ成功メッセージが表示され、終了コードは 0。 |

**作者に聞きたいこと**　手順 2 のメッセージから、どのファイルのどのリンクを直せばよいか分かりますか？
