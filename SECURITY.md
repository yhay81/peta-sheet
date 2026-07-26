# Security Policy

## Reporting

GitHubリポジトリのPrivate vulnerability reportingから非公開で報告してください。脆弱性を公開Issueへ投稿しないでください。

## Implemented boundaries

- ラベル文字と印刷設定はブラウザ内だけで処理し、Workerへ送信しない
- `textContent`でラベルを組み立て、ユーザー生成HTMLを描画しない
- CSP、frame拒否、MIME sniffing拒否、Permissions Policy
- 同一オリジンのJSONイベントだけを受け付け、イベント名とUUIDを検証
- UUIDはSHA-256で一方向変換してD1へ保存
- イベント本文は1KBまで、日単位で重複排除し35日後に削除
- 外部API、外部フォント、認証情報、秘密値を扱わない
