# ink

要件・設計・意思決定を文書にし、設計を検証する Claude Code / Codex 用プラグイン。
既存の資料やリポジトリの文脈を使い、文書の作成・更新と設計レビューを支援する。

## スキル

| スキル | 答える問い | 既定の出力先（指定・慣例がない場合） |
| --- | --- | --- |
| `write-prd` | 誰の、どの課題を、どこまで解決するか | `docs/prd/<topic>.md` |
| `write-design-doc` | 要求をどう実現し、どう検証するか | `docs/design/<topic>.md` |
| `write-adr` | なぜその設計判断を選び、何を受け入れたか | `docs/adr/<番号>-<topic>.md` |
| `review-design` | どの条件で設計が要求を満たし、どこで破綻するか | 会話 |

ユーザーの指定と利用先リポジトリの書式を優先する。チャット上の草案を依頼した場合は、ファイルを作成しない。
文書作成スキルの `assets/` に Markdown のひな形を同梱している。

## 文書の書き方

判断に必要な最小構成を標準にし、必要な説明だけを追加する。

| 文書 | 基本構成 |
| --- | --- |
| ADR | 決定・背景と理由・受け入れる不利益 |
| Design Doc | 目的・提案する設計・検証計画 |
| PRD | 課題と目的・スコープ・要求と受け入れ条件 |

結論を先に示し、同じ説明を繰り返さない。他文書の背景や判断理由はリンクする。
比較表、移行計画、指標などは判断に必要な場合だけ加え、空の節は作らない。
短さのために重要な不利益、受け入れ条件、未決事項は省かない。
既存文書の更新では、その書式と合意済みの内容を尊重する。

PRD は JTBD の Job Story で状況・達成したいこと・期待する成果を整理し、
各要求を Job または必須制約に対応付ける。振る舞いの受け入れ条件には
Given / When / Then（前提・操作や出来事・期待結果）を使う。
複数アクターが関係する場合は、要求の出所と利用者・影響先を区別し、
共通要求をまとめながら、権限などの違いと要求間の衝突・合意状況を残す。
基本3節を保ちながら、要求の根拠と合否の判断を追える形にする。
書き方に迷った場合の例は、スキル内の `references/framework.md` と
`references/actors.md` に収録している。

Design Doc は arc42 の観点を使い、要求・制約から境界と構成、実行時の流れ、
選択理由、検証へつなぐ。図が役立つ場合は C4 model を参考に必要な粒度を選ぶ。
基本3節を維持し、全項目や図の作成を必須にはしない。
PRD の要求 ID・アクターごとの条件・未決事項を引き継ぎ、要求と設計・検証の対応を示す。
スキル内の `references/framework.md` に適用方針、`references/design-example.md` に具体例を収録している。

## 設計レビュー

`review-design` は ATAM の考え方で重要なリスクを選び、ARID を参考に利用側のコードや操作列で設計を確かめる。
複雑な競合や状態遷移は、必要に応じて Quint や TLA+ / TLC などのモデル実行で探索する。
正式な ATAM・ARID 評価ではなく、設計上のリスクとトレードオフを判断できる粒度で整理する。
設計上の問題、説明不足・未決事項、検証未実施を区別し、根拠・影響・改善の方向性・検証方法を示す。
結果は重要な指摘、判断に必要な未確認事項、確認範囲と残るリスクに絞り、会話へ返す。
机上での追跡・シミュレーション・モデル検査・実装のテストを区別し、実行した範囲と限界を残す。
レビューの依頼だけで設計やコードを書き換えない。
適用方針と例はスキル内の [framework.md](skills/review-design/references/framework.md) と
[review-example.md](skills/review-design/references/review-example.md)、実行方法の選び方は
[model-execution.md](skills/review-design/references/model-execution.md) を参照する。

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

## 任意の作図連携

図が必要な場合は、別途導入した `sketch` プラグインの `draw-mermaid` スキルと連携する。
`ink` が図の目的と内容を決め、`sketch` が作図と描画確認を担当する。
連携は任意で、利用できない環境でも文書作成は続けられる。
`sketch` は同じマーケットプレイスから `claude plugin install sketch@wataru-agent-plugins` または
`codex plugin add sketch@wataru-agent-plugins` で個別に導入する。

## 利用例

Claude Code では `/ink:write-prd`、`/ink:write-design-doc`、`/ink:write-adr`、`/ink:review-design` で呼び出す。
Codex ではインストール後のスキル一覧から該当スキルを選ぶか、スキル名を指定して依頼する。

- 「write-prd で、社内申請の承認待ちを減らす機能の PRD を作成して。対象は申請者と承認者。分析メモはこのファイル。Job と要求を対応付け、受け入れ条件まで整理して」
- 「write-design-doc で、この PRD と既存コードをもとに通知機能の Design Doc を作成して。要求と設計・検証を対応付け、再送と重複通知の扱いも整理して」
- 「review-design で、この注文 API の設計をレビューして。PRD と関連コードを参照し、同時実行・再送・依存先の停止時にも要求を満たせるか確認して」
- 「write-adr で、同期処理からキュー方式への変更判断を記録して。選択理由と受け入れる運用負担はこのメモを参照して」
- 「write-adr で、既存 ADR を置き換える提案を作成して。まだ採用は決まっていない」

外部ツールへの接続や特定ホスト専用の機能には依存しない。
根拠を確認できない要件や合意は、仮説・提案・未決事項として区別する。
