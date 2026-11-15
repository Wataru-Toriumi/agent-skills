# SMT/SAT で制約と反例を調べる

## 問い合わせを作る

1. 変数の型・値域を対象に合わせる。数学的整数と固定幅ビットベクトル、実数と浮動小数点を混同しない。量化や理論の組み合わせは、利用するソルバーと版の対応を確認する。
2. 前提を `A`、確かめたい性質を `P` とする。まず `A` の充足可能性を確認する。`A` が unsat なら矛盾した前提であり、意図した性質の確認として扱わない。
3. `A ∧ ¬P` を問い合わせる。sat なら違反する割り当てを取得して対象に照合する。unsat なら、符号化した前提の下で違反する割り当てがない。unknown やタイムアウトなら結論を保留する。
4. 単に `A ∧ P` が sat でも、性質がすべての対象で成り立つことは示していない。問い合わせの式と結果を必ず対応付ける。

取得したモデルが元の入力・状態として成立するか確認し、符号化の誤りを実装の反例と混同しない。
unsat core を利用する場合も、返された集合を自動的に最小原因や唯一の原因と呼ばない。

## 小さな確認例

整数の現在使用数 `used` と追加数 `add` について、上限3を超える入力があるかを調べる。
次は Z3 の SMT-LIB 入力例。`z3 -smt2 capacity.smt2` で実行できる。
cvc5 では `cvc5 --lang smt2 --incremental capacity.smt2` で、複数の問い合わせを処理する。

```lisp
(set-logic QF_LIA)
(set-option :produce-models true)
(declare-const used Int)
(declare-const add Int)
(assert (and (<= 0 used) (<= used 3)))
(assert (and (<= 0 add) (<= add 3)))
(check-sat)
(push 1)
(assert (not (<= (+ used add) 3)))
(check-sat)
(get-model)
(pop 1)
(assert (<= (+ used add) 3))
(check-sat)
(push 1)
(assert (not (<= (+ used add) 3)))
(check-sat)
(pop 1)
```

最初は前提の充足可能性、次は上限違反の存在を調べ、いずれも sat を期待する。
条件追加後の前提も sat であることを確認する。最後の unsat は「上限内だけを受け付ける」という条件を追加した別の問い合わせ。
実装がその条件を検査し、競合なく更新することまで、この例は確認していない。
出力例や期待結果を実行ログの代わりにしない。

公式資料: [Z3 の基本コマンド](https://microsoft.github.io/z3guide/docs/logic/basiccommands/)、[cvc5 の SMT-LIB 入門](https://cvc5.github.io/docs/latest/binary/quickstart.html)。
