# 字幕ツールの導入手順

既存 SRT の修正や無音デモの SRT 作成は、動画プレーヤーとテキストエディターで進められる。MP4 に字幕を焼き込む場合は FFmpeg、音声から自動で字幕を起こす場合は音声認識ツールを用意する。

## FFmpeg で字幕を焼き込む

まず `ffmpeg -hide_banner -filters` の一覧で `subtitles` を探す。見つかれば既存の FFmpeg を使える。未導入の場合やフィルターが欠けている場合は、libass 対応ビルドを選ぶ。

macOS で Homebrew を使う例。インストール後、同じターミナルで字幕フィルターの説明とオプションが表示されることを確かめる。[Homebrew の ffmpeg-full](https://formulae.brew.sh/formula/ffmpeg-full)

```sh
brew install ffmpeg-full
export PATH="$(brew --prefix ffmpeg-full)/bin:$PATH"
ffmpeg -hide_banner -h filter=subtitles
```

ほかの環境では OS 向けのビルドを選び、同じフィルターを確認する。[FFmpeg の配布先](https://ffmpeg.org/download.html)

## whisper.cpp で音声から SRT を作る

以下は日本語の音声をローカルで文字起こしする例。音声抽出用の FFmpeg と、多言語モデルの `ggml-base.bin` を使う。モデルは CLI とは別に取得する。

1. macOS で Homebrew を使う場合は `brew install whisper.cpp` を実行し、`whisper-cli --help` が開くことを確認する。ほかの環境でソースからビルドする場合は、生成された `whisper-cli` のパスで実行する。[Homebrew の whisper.cpp](https://formulae.brew.sh/formula/whisper.cpp)・[公式ビルド手順](https://github.com/ggml-org/whisper.cpp#quick-start)
2. [多言語モデルの配布ページ](https://huggingface.co/ggerganov/whisper.cpp/blob/main/ggml-base.bin)からファイルをダウンロードし、保存先を控える。`.en.bin` は英語専用。
3. [文字起こしの実行例](rendering.md#ナレーションから-srt-の草案を作る)の `-m` にモデルの保存先を指定する。生成された `draft.srt` を開き、元の発話と時刻を照合する。
