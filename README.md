# Peta Sheet

ExcelやCSVの行を、市販A4ラベル用紙へ1枚ずつ実寸配置して印刷する日本語Webツールです。

https://peta-sheet.yusuke8h.workers.dev

## What it does

- Excel貼り付けのタブ区切りと、引用符を含むCSVを解釈
- 12面（83.8×42.3mm）、24面（66×33.9mm）、65面（38.1×21.2mm）
- 複数ページ、1件目の全面複製、ゴシック／明朝、7–18pt、左／中央揃え
- 左右・上下を0.1mm単位、±5mmで補正
- CSSのmm単位とA4印刷用スタイルで、ブラウザの印刷／PDF保存へ出力
- ラベル文字と設定は端末内だけに保存
- D1へは匿名ファネルイベントだけを35日間保存

商品番号との互換は断定しません。用紙パッケージの寸法図と、画面に表示するラベル寸法を照合してください。初回は普通紙へ倍率100%で印刷し、ラベル用紙と重ねて位置を確認します。

## Stack

- Cloudflare Workers / D1
- Hono / Hono JSX
- Vite+
- TypeScript / Vitest / Oxlint / Oxfmt

所有者アカウントや端末同期が不要なため、Better Authは使用していません。

## Local development

Node.js 24を使用します。

```powershell
vp env off
npm ci
npx wrangler d1 migrations apply peta-sheet --local
npm run dev
```

## Quality and deployment

```powershell
npm run release:check
npm run check
npm test
npm run build
npm run deploy
npm run indexnow
npm run metrics
```

プロダクト判断と出典は`EXPERIMENT.md`、実装上の決定は`DECISIONS.md`、保存内容は`PRIVACY.md`に記録します。
