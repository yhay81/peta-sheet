# Metrics

`npm run metrics`は匿名セッション単位で次を集計します。

| Stage    | D1 event   | Meaning                    |
| -------- | ---------- | -------------------------- |
| users    | `visited`  | 作成画面を開いた           |
| edited   | `edited`   | ラベル文字を変更した       |
| adjusted | `adjusted` | 用紙または印刷設定を変えた |
| printed  | `printed`  | A4印刷操作へ進んだ         |
| returned | `returned` | 別日に再訪した             |

イベントは匿名IDをSHA-256で一方向変換して日単位で重複排除し、35日後に削除します。入力文字、用紙、設定値、IPアドレスはD1へ保存しません。

印刷ボタンは物理印刷成功の代理指標です。分母0の比率は0とし、閲覧やプレビューだけを中核job完了とは扱いません。
