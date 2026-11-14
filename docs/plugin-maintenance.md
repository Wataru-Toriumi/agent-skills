# プラグインの更新と配布

更新コマンドは [README の更新方法](../README.md#更新方法) を参照する。

## バージョン管理

プラグインごとに独立した `major.minor.patch` を管理する。
新規プラグインの初期値は `0.1.0`。配布する変更を加えたら、バージョンを更新する。

更新種別は [Semantic Versioning](https://semver.org/) に沿って選ぶ。

| 種別 | 用途 | 例 |
| --- | --- | --- |
| `patch` | 互換性を維持した修正 | `1.2.3` → `1.2.4` |
| `minor` | 互換性を維持した機能追加 | `1.2.3` → `1.3.0` |
| `major` | 既存の利用方法を壊す変更 | `1.2.3` → `2.0.0` |

`0.x` も指定した桁を更新する（`0.1.0` の `major` は `1.0.0`）。
現在のコマンドは通常の三桁のバージョンに対応し、プレリリースやビルドメタデータは扱わない。
二つのマニフェストの名前・バージョンが不一致なら、書き込む前に停止する。
`--message` は廃止した。変更内容はコミットと PR に記載する。

このコマンドは手元のファイルを更新する。コミット・タグ作成・push・公開は行わない。
コード変更からバージョン更新の要否を自動判定する機能はないため、配布する変更ごとに実行する。
同じプラグインへの更新は一つずつ実行し、差分を確認してからコミットする。

## GitHub Release

`main` への push 後、両 Node.js バージョンの検証に成功すると、各プラグインの現行版に
対応する [GitHub Release](https://github.com/Wataru-Toriumi/agent-skills/releases) を作成する。
タグは `forge/v0.1.8` のようにプラグイン名とバージョンで識別する。

- タグは、そのバージョンが main に入ったコミットを指す。
- 本文は、前のバージョンから今回までに対象プラグインを変更した main 上のコミットから生成する。マージコミットでは PR のタイトルとリンクを使う。
- 既存の Release 本文は保持する。タグが別のコミットを指す場合や、同名の draft がある場合は停止する。
- 公開に失敗したら、該当 workflow を再実行する。公開済みの版を飛ばして再開する。手動実行は `Validate plugins` の `main` を選ぶ。

コミット後、公開せずに生成内容を確認できる。

```sh
pnpm plugin:release --repository Wataru-Toriumi/agent-skills
```

公開処理は GitHub Actions の main に限定し、`contents: write` は公開ジョブだけに付与する。
PR の検証では公開しない。main の実行はコミットごとに分け、後続の push で取り消さない。
初回は現行版を公開する。移行前の変更履歴は [Git 履歴](https://github.com/Wataru-Toriumi/agent-skills/tree/bafa5f5/plugins) に残る。

## 配布と互換性

- 名前・説明を変更する場合は、両マニフェストの `name`・`description` を一致させる。
- 配布後は各ツールで再インストール・再読み込みを確認する。
  インストール済みのコピーにソース編集が即時反映されるとは限らない。
- GitHub に push した後は、両ツールの `plugin marketplace add` の引数に
  `Wataru-Toriumi/agent-skills` を指定して登録できる。非公開の場合は Git 認証が必要。
- スキル本文では特定ホスト専用のツール名への依存を避ける。
  MCP・フック・エージェント定義を追加するときは、形式や実行環境の違いを個別に確認する。
  スキルの共通化だけで、これらすべての互換性が保証されるわけではない。
- 認証情報や各端末のインストールキャッシュは保存しない。

### マーケットプレイス名の変更

マーケットプレイス名を `wataru-agent-plugins` から `toripeeeeee-plugins` に変更した。
旧名で導入済みの環境では、各ツールの登録名とインストール済みプラグインを確認し、
マーケットプレイスを登録し直して `<plugin>@toripeeeeee-plugins` で導入する。
旧名を指定したプロジェクト設定があれば、同時に更新する。

## CI での検証

[validate.yml](../.github/workflows/validate.yml) が、全 PR の作成・更新・再オープン時と
`main` への push 時に検証する。GitHub Actions からの手動実行も可能。
CI も [mise-action](https://github.com/jdx/mise-action) でツールを導入する。
`MISE_NODE_VERSION` で Node.js のみ上書きし、24.12.0（最低対応バージョン）と
26 系の両方で、ローカルと共通の `mise run setup`・`mise run check` を実行する。
CI の 26 系は最新のパッチ版、通常の開発では `mise.toml` の固定版を使う。
検証内容は次のとおり。

- `pnpm install --frozen-lockfile`：マニフェストと lockfile の整合性
- `mise run lint:md`：rumdl による Markdown の書式チェック
- `mise run lint:text`：textlint による日本語の冗長表現チェック
- `pnpm plugin:check`：ひな形と各プラグインのマニフェストの名前・バージョンの整合性
- `pnpm test`：バージョン更新、リリースノートの生成、再実行、エラー時の挙動
- `git diff --exit-code`：検証によって追跡済みファイルが変更されていないこと

`Plugin version policy` はPRの比較元とマージ結果を比較し、`plugins/<name>/` 配下が
変わった既存Pluginに、両マニフェストの版番号増加を要求する。README・画像・削除も対象。
新規Pluginは有効な初期版を要求し、Plugin全体の削除には新しい版を要求しない。
カタログの削除・対応関係は配布物検証で別途確認する。

ローカルではコミット済みの比較対象を指定する。比較元を取得できない場合も検査は失敗する。

```sh
node scripts/check-version-changes.ts --base origin/main --head HEAD
```

マージを必ず検証成功後に制限する場合は、GitHub のルールセットで
`Validate (Node 24.12.0)` と `Validate (Node 26)` を必須チェックに指定する。

各変更の検証結果は PR と GitHub Actions の実行結果で確認する。
