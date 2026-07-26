import { product } from "../config/product";
import { Layout } from "./layout";

const sampleRows = [
  ["株式会社 山田商事", "総務部　山田 太郎", "〒100-0001 東京都千代田区千代田1-1"],
  ["佐藤 花子 様", "〒150-0001", "東京都渋谷区神宮前1-2-3"],
  ["鈴木商店", "商品管理部", "管理番号 A-1042"],
  ["展示品", "HAND MADE", "税込 1,200円"],
] as const;

const sampleText = sampleRows.map((row) => row.join("\t")).join("\n");

export function HomePage() {
  return (
    <Layout>
      <section class="app-intro">
        <span class="app-symbol" aria-hidden="true">
          <i></i>
          <i></i>
          <i></i>
        </span>
        <div>
          <h1>A4ラベルをつくる</h1>
          <p>ExcelやCSVの行を、ラベル1枚ずつに並べて印刷できます。</p>
        </div>
        <span class="local-badge">
          <i aria-hidden="true"></i>
          入力はこの端末に保存
        </span>
      </section>

      <section class="label-workspace" id="product">
        <aside class="control-panel" aria-label="ラベル設定">
          <header class="panel-heading">
            <div>
              <span class="step-number">1</span>
              <h2>用紙を選ぶ</h2>
            </div>
            <button class="quiet-button" id="reset-all" type="button">
              初期状態に戻す
            </button>
          </header>

          <div class="preset-grid" role="group" aria-label="用紙の面数">
            <button
              aria-pressed="true"
              class="preset-card"
              data-preset="address12"
              data-selected="true"
              type="button"
            >
              <span class="preset-icon grid-12" aria-hidden="true">
                {Array.from({ length: 12 }, (_, index) => (
                  <i key={index}></i>
                ))}
              </span>
              <span>
                <strong>宛名 12面</strong>
                <small>83.8 × 42.3 mm</small>
              </span>
            </button>
            <button
              aria-pressed="false"
              class="preset-card"
              data-preset="display24"
              data-selected="false"
              type="button"
            >
              <span class="preset-icon grid-24" aria-hidden="true">
                {Array.from({ length: 24 }, (_, index) => (
                  <i key={index}></i>
                ))}
              </span>
              <span>
                <strong>表示 24面</strong>
                <small>66 × 33.9 mm</small>
              </span>
            </button>
            <button
              aria-pressed="false"
              class="preset-card"
              data-preset="small65"
              data-selected="false"
              type="button"
            >
              <span class="preset-icon grid-65" aria-hidden="true">
                {Array.from({ length: 30 }, (_, index) => (
                  <i key={index}></i>
                ))}
              </span>
              <span>
                <strong>小物 65面</strong>
                <small>38.1 × 21.2 mm</small>
              </span>
            </button>
          </div>

          <section class="control-section">
            <header class="section-heading">
              <div>
                <span class="step-number">2</span>
                <h2>文字を貼り付ける</h2>
              </div>
              <output id="data-count">4件 / 12面</output>
            </header>
            <label class="data-field">
              <span class="sr-only">ラベルに入れる文字</span>
              <textarea aria-describedby="data-help" id="label-data" rows={7} spellcheck={false}>
                {sampleText}
              </textarea>
            </label>
            <p class="field-help" id="data-help">
              1行がラベル1枚、タブ区切りの列は改行になります。Excelからそのまま貼り付けられます。
            </p>
            <label class="check-row">
              <input id="repeat-first" type="checkbox" />
              <span aria-hidden="true"></span>
              1件目をすべての面に複製
            </label>
          </section>

          <details class="design-settings" open>
            <summary>
              <span class="step-number">3</span>
              <strong>文字と位置を整える</strong>
              <span aria-hidden="true">⌄</span>
            </summary>
            <div class="setting-grid">
              <label>
                <span>書体</span>
                <select id="font-family">
                  <option value="sans">ゴシック</option>
                  <option value="serif">明朝</option>
                </select>
              </label>
              <label>
                <span>
                  文字サイズ
                  <output id="font-size-value">11 pt</output>
                </span>
                <input id="font-size" max="18" min="7" step="1" type="range" value="11" />
              </label>
            </div>
            <div class="setting-row">
              <span>文字揃え</span>
              <div class="segment-control" role="group" aria-label="文字揃え">
                <button aria-pressed="true" data-align="left" data-selected="true" type="button">
                  左
                </button>
                <button
                  aria-pressed="false"
                  data-align="center"
                  data-selected="false"
                  type="button"
                >
                  中央
                </button>
              </div>
              <label class="compact-check">
                <input id="print-border" type="checkbox" />
                <span aria-hidden="true"></span>
                枠を印刷
              </label>
            </div>
            <fieldset class="calibration">
              <legend>
                印刷位置の補正
                <small>用紙の寸法図と照合してください</small>
              </legend>
              <label>
                <span>左右</span>
                <input
                  id="offset-x"
                  inputmode="decimal"
                  max="5"
                  min="-5"
                  step="0.1"
                  type="number"
                  value="0"
                />
                <span>mm</span>
              </label>
              <label>
                <span>上下</span>
                <input
                  id="offset-y"
                  inputmode="decimal"
                  max="5"
                  min="-5"
                  step="0.1"
                  type="number"
                  value="0"
                />
                <span>mm</span>
              </label>
            </fieldset>
          </details>

          <div class="print-actions">
            <button class="print-button" id="print-labels" type="button">
              <span aria-hidden="true"></span>
              A4で印刷する
            </button>
            <p>印刷倍率は「100%」または「実際のサイズ」を選択</p>
          </div>
        </aside>

        <section class="preview-panel" aria-labelledby="preview-title">
          <header class="preview-heading">
            <div>
              <span class="preview-kicker">A4・実寸比率</span>
              <h2 id="preview-title">仕上がり</h2>
            </div>
            <div class="preview-tools">
              <div class="page-control" hidden id="page-control">
                <button aria-label="前のページ" id="previous-page" type="button">
                  ‹
                </button>
                <output id="page-status">1 / 1</output>
                <button aria-label="次のページ" id="next-page" type="button">
                  ›
                </button>
              </div>
              <div class="sheet-measure">
                <span>210 mm</span>
                <i aria-hidden="true"></i>
                <span>297 mm</span>
              </div>
            </div>
          </header>
          <div class="sheet-viewport" id="sheet-viewport">
            <div class="sheet-stage" id="sheet-stage">
              <div
                class="print-sheets"
                data-align="left"
                data-font="sans"
                data-print-border="false"
                id="print-sheets"
              >
                <div
                  aria-label="A4ラベル用紙プレビュー"
                  class="sheet-page"
                  data-active="true"
                  data-page="0"
                >
                  {Array.from({ length: 12 }, (_, index) => (
                    <div class="label-cell" key={index}>
                      <span class="label-number">{index + 1}</span>
                      {sampleRows[index]?.map((line) => (
                        <span class="label-line">{line}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div class="preview-foot">
            <span>
              <i class="guide-swatch" aria-hidden="true"></i>
              破線は印刷されません
            </span>
            <strong id="sheet-description">12面・2列 × 6行</strong>
          </div>
        </section>
      </section>

      <section class="print-check">
        <span aria-hidden="true">✓</span>
        <div>
          <strong>最初は普通紙で1枚テスト</strong>
          <p>ラベル用紙へ重ねて光に透かし、ずれがあれば左右・上下を0.1mm単位で補正します。</p>
        </div>
      </section>
    </Layout>
  );
}

export function PrivacyPage() {
  return (
    <Layout title={`プライバシー | ${product.name}`}>
      <article class="prose">
        <p class="prose-kicker">PRIVACY</p>
        <h1>ラベルの文字はサーバーへ送りません</h1>
        <h2>この端末に保存するもの</h2>
        <p>
          入力した文字、選んだ用紙、文字の設定、印刷位置の補正値をブラウザ内に保存します。ブラウザのサイトデータを消すか、作成画面の「初期状態に戻す」で削除できます。
        </p>
        <h2>サービス側で集計するもの</h2>
        <p>
          閲覧、文字編集、設定調整、印刷操作、別日の再訪だけを、匿名識別子を一方向変換して日単位で記録します。入力した文字、用紙、設定値、IPアドレスはD1へ保存しません。
        </p>
        <h2>保持期間</h2>
        <p>
          集計イベントは35日後に自動削除します。外部の解析SDK、広告Cookie、外部フォントは使用しません。
        </p>
      </article>
    </Layout>
  );
}
