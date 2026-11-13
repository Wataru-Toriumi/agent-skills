# probe

テスト設計・品質の検証を支援する、Claude Code / Codex 用プラグイン。

## スキル

| スキル | 用途 |
| --- | --- |
| [design-tests](skills/design-tests/SKILL.md) | 要求と変更内容から、リスクに応じたテスト観点・ケースを設計する |

## 導入

利用するツールでマーケットプレイスを登録し、インストールする。

```sh
claude plugin marketplace add Wataru-Toriumi/agent-skills
claude plugin install probe@toripeeeeee-plugins
```

```sh
codex plugin marketplace add Wataru-Toriumi/agent-skills
codex plugin add probe@toripeeeeee-plugins
```

## 利用例

Claude Code では `/probe:design-tests` で呼び出す。
Codex ではスキル一覧から選ぶか、スキル名を指定して依頼する。

- 「design-tests で、このストーリーのテストケースを設計して。リリース前に必須の確認を優先して」
- 「design-tests で、この組み合わせが成立するか整理して。除外するケースには根拠を付けて」
