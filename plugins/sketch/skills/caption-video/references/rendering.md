# 文字起こしと焼き込みの実行例

ローカルの FFmpeg を使う例。新しい作業ディレクトリに元動画を用意し、以下の `input.mp4` は実際の入力パスに置き換える。既存 SRT はコピーを編集する。字幕付きの出力を作り直すときも、新しい出力名を選ぶ。

## ナレーションから SRT の草案を作る

日本語の音声、whisper.cpp の CLI、対応する多言語モデルが手元にある場合の例。対象の音声トラックを選び、認識する言語を発話に合わせる。既存 SRT や無音のデモは次の節から始める。

```sh
ffmpeg -n -i input.mp4 -map 0:a:0 -ac 1 -ar 16000 -c:a pcm_s16le narration.wav
whisper-cli -m /path/to/multilingual-model.bin -l ja -f narration.wav -osrt -of draft
```

`draft.srt` を元動画と照合し、校正した版を `captions.srt` に保存する。音声が映像の途中から始まる場合は、最初の発話が元動画で始まる時刻を基準に合わせる。[whisper.cpp の CLI](https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/README.md)

## SRT と MP4 を仕上げる

SRT は通し番号、開始・終了時刻、本文を一組にし、空行で区切る。次は架空の操作例。

```text
1
00:00:00,500 --> 00:00:02,500
通知先を選びます

2
00:00:03,000 --> 00:00:05,000
保存すると一覧に反映されます
```

`ffmpeg -filters` で `subtitles` フィルターを確認する。次の例は H.264・AAC の MP4 を作る。字幕フィルターには作業ディレクトリ内の固定名を渡すと、元のファイル名に空白や記号があっても扱いやすい。

```sh
ffmpeg -n -i input.mp4 -map 0:V:0 -map '0:a?' \
  -vf "subtitles=captions.srt:force_style='Outline=2,Shadow=0',pad=ceil(iw/2)*2:ceil(ih/2)*2" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart captioned.mp4
```

元動画が無音なら出力も無音になる。字幕を上に移すときは `force_style` に `Alignment=8` を加える。日本語が欠ける場合は、その環境にある日本語フォントを `FontName` で指定して再描画する。[FFmpeg の字幕フィルター](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

MP4 を単体で再生し、外部字幕の自動読み込みを切って映像内の文字を確認する。元動画と出力の尺・音声の有無を比べ、音声がある場合は発話と字幕の同期も確かめる。
