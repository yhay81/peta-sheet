# Privacy

## Browser storage

- 入力したラベル文字
- 選んだ用紙、書体、文字サイズ、揃え、枠線、印刷位置の補正値
- 匿名の利用識別子と最終訪問日

すべて端末内の`localStorage`だけに保存します。作成画面の「初期状態に戻す」またはブラウザのサイトデータ削除で消去できます。

## D1 analytics

- `visited`, `edited`, `adjusted`, `printed`, `returned`のイベント名
- 匿名識別子をSHA-256で一方向変換した値
- 発生日

イベントは日単位で重複排除し、35日後に自動削除します。入力文字、選んだ用紙、設定値、IPアドレスはD1へ保存しません。広告Cookieや外部解析SDKは使用しません。

## Operator

GitHub: `yhay81`
