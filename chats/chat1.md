# セッション復活

_Started 2026-06-10 16:53 UTC_

---

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "silde-app"
Project currently has 1 file(s)
Current date is now June 11, 2026
</system-info>

<default aesthetic_system_instructions>
The user has not attached a design system. If they have ALSO not attached references or art direction, and the project is empty, you must ASK the user what visual aesthetic they want. Use the questions_v2 tool to ask about preferred vibe, audience, colors, type, mood, etc. Do NOT just pick your own visual aesthetic without getting the user's aesthetic input -- this is how you get slop!

Once answered, use this guidance when creating designs:
- Choose a type pairing from web-safe set or Google Fonts. Helvetica is a good choice. Avoid hard-to-read or overly stylized fonts. Use 1-3 fonts only.
- Foreground and background: choose a color tone (warm, cool, neutral, something in-between). Use subtly-toned whites and blacks; avoid saturations above 0.02 for whites.
- Accents: choose 0-2 additional accent colors using oklch. All accents should share same chroma and lightness; vary hue.
- NEVER write out an SVG yourself that's more complicated than a square, circle, diamond, etc.
- For imagery, never hand-draw SVGs; use subtly-striped SVG placeholders instead with monospace explainers for what should be dropped there (e.g. “product shot”)

CRITICAL: ignore default aesthetic entirely if given other aesthetic instructions like reference images, design systems or guidance, or if there are files in the project already.
</default aesthetic_system_instructions>

<attached_files>
- scraps/sketch-2026-06-10T16-54-05-w6h6am.napkin
</attached_files>

<pasted_text name="Pasted text (104 lines)">
■ アプリ概要
名称: SILDE（シルデ）
形態: iPhone向けPWA（ホーム画面追加で全画面起動 / GitHub Pagesでホスティング / 単一HTML）
バックエンド: Google Apps Script + スプレッドシート（全データを起動時に一括取得、保存はGAS経由）
用途: 送迎ドライバー向けのスケジュール管理アプリ。女の子の出勤時間から逆算して
お迎えルート・出発時刻を自動計算し、店舗到着までのタイムラインを生成・共有する。
利用者: 2人（しゅん / ひーちゃん）で共有して使う前提。

■ 画面構成（フッターナビ5ボタン）
1. スケジュール（ホーム）
2. マップ
3. 行き先（マスター管理）
4. シークレット
5. 設定（モーダルが開く）

────────────────────────
【1】スケジュールタブ（ホーム）
────────────────────────
・「今日のスケジュール」カード
  - 日付見出し＋当日のタイムライン表示
  - タイムライン行: 時刻 / 名前 / バッジ（迎え・店着）/ 所要分
  - カード下部にアクションバー: 編集 / コピー / 共有 / 削除
  - 予定がない日は空状態表示
・横スワイプ2ページ構成（ドットインジケーター付き）
  - 1ページ目: 今日のスケジュールカード
  - 2ページ目: 月別アコーディオンリスト（月タイトル＋件数バッジ、
    開くと日付ごとの履歴アイテム、タップで詳細モーダル）
・履歴詳細モーダル: タイムライン全文、コピー用テキスト、共有、削除
・画面下部に「共有メモ」: ボトムシート風の引き出しUI。
  テキストエリアに入力すると自動保存され、2人で共有される
・FAB（フローティングボタン、肉球画像）→ スケジュール作成モーダルを開く

────────────────────────
【スケジュール作成モーダル（ボトムシート）】
────────────────────────
・日付: デートピッカー＋「今日」「明日」ショートカットボタン
・出発地: タブ切り替え
  - 登録済み（マスターから選択）
  - 直接入力（名前・住所・出発時刻を手入力）
・「逆算した出発時刻」ボックス: 移動時間入力から自動で逆算した
  出発時刻を大きく表示（自動更新）
・女の子の出勤情報: 複数人追加可能
  - 女の子をマスターから選択（または手入力）
  - 出勤時刻: ステッパーUI（±5分刻み、長押し対応）
  - 区間ごとの移動時間（分）を手入力
  - 「マップで計算」ボタン: OSRM（無料ルーティングAPI）＋
    Nominatimジオコーディングで実際の車移動時間を自動計算（キャッシュあり）
・「スケジュール生成」ボタン → 結果セクション表示
  - 便（RUN）ごとのブロック表示。各便にタイムライン
    （出発 → お迎え1 → お迎え2 → 店着）
  - コピー用テキスト: タブ切り替えで2フォーマット
    「しゅんくん用」（等幅フォント・濃色背景）/「ボーイさん用」（プレーン）
  - それぞれワンタップコピー
・「このスケジュールを保存」: 同日付の既存データがあれば上書き確認モーダル

────────────────────────
【2】マップタブ
────────────────────────
・Leaflet + Cartoタイルの全画面マップ（ステータスバー裏まで描画、
  フッターはすりガラスブラー）
・上部に凡例チップ: 🏠場所 / 👧女の子 / 🚩出発地 / 🌙しゅん / 🌸ひーちゃん
・マスター登録された場所・女の子宅・出発地を住所ジオコーディングして
  絵文字マーカー表示
・ライブ位置共有: Overlandアプリ → GAS経由で2人の現在地を2秒間隔ポーリング、
  位置予測補間でなめらかに移動、パルスアニメーション付きマーカー
・2人のスマホバッテリー残量カード（%・充電中表示）
・ダークモード時はタイルの明度フィルター調整

────────────────────────
【3】行き先タブ（マスター管理）
────────────────────────
3つのマスターをCRUD管理（それぞれボトムシートで編集）
・出発地マスター: 名前＋住所
・女の子マスター: 名前＋ニックネーム＋住所
・送り先マスター: 店舗名＋住所
各リスト行: アバター（グラデ円/角丸）＋名前＋住所サブテキスト

────────────────────────
【4】シークレットタブ
────────────────────────
・管理者がURL＋表示テキストを登録できる隠しページ
・パスワード入力＋すりガラスのロックオーバーレイ
・指定日時を過ぎると自動アンロックされ、登録したリンクだけが表示される
  （サプライズ用途）

────────────────────────
【5】設定（モーダル）
────────────────────────
・テーマ: 「かわいい」（ピンク系 #CE95B0）/「かっこいい」（ブルー系）
・カラーモード: ライト / ダーク / 自動（かっこいいテーマのみ有効）
・フォント: まるゴシック（Zen Maru Gothic）/ システム
・Overland URL: 2人分の位置共有用URLをタップでコピー

────────────────────────
【共通UI・その他】
────────────────────────
・起動時ローディングオーバーレイ（スピナー＋「読み込み中」）
・トースト通知（コピー完了・保存完了など）
・モーダルは全てボトムシート形式（下からスライドアップ、角丸22px）
・テーマカラーに連動した theme-color（ステータスバー色）動的切り替え
・フォント: Zen Maru Gothic / Kaisei Opti（時刻数字）/ Noto Sans JP
・現状のトーン: 角丸大きめ（カード16px）、淡いピンク/ブルーのパステル、
  絵文字アイコン多用、影は柔らかめ

</pasted_text>

<!-- The user explicitly selected the following skills for this project, as attachments to their message. These are not optional context — they define how you work. Use them. -->
<attached-skill name="Hi-fi design">
Create a high-fidelity, polished design.

Follow this general design process (use the todo list to remember):
(1) ask questions, (2) find existing UI kits and collect design context — copy ALL relevant components and read ALL relevant examples; ask the user if you can't find them, (3) start your file with assumptions + context + design reasoning (as if you are a junior designer and the user is your manager), with placeholders for the designs, and show it to the user early, (4) build out the designs and show the user again ASAP; append some next steps, (5) use your tools to check, verify and iterate on the design.

Good hi-fi designs do not start from scratch — they are rooted in existing design context. Ask the user to Import their codebase, or find a suitable UI kit / design resources, or ask for screenshots of existing UI. You MUST spend time trying to acquire design context, including components. If you cannot find them, ask the user for them. In the Import menu, they can link a local codebase, provide screenshots or Figma links; they can also link another project. Mocking a full product from scratch is a LAST RESORT and will lead to poor design. If stuck, try listing design assets and ls'ing design system files — be proactive! Some designs may need multiple design systems — get them all. Use the starter components (device frames and the like) to get high-quality scaffolding for free.

When presenting several options or explorations side-by-side, lay them out clearly: give the page a neutral gray background, put each option in its own labeled frame (a small heading + a white rounded card sized to its content), and group related options into sections.

When designing, asking many good questions is ESSENTIAL.

Give options: try to give 3+ variations across several dimensions. Mix by-the-book designs that match existing patterns with new and novel interactions, including interesting layouts, metaphors, and visual styles. Have some options that use color or advanced CSS; some with iconography and some without. Start your variations basic and get more advanced and creative as you go! Try remixing the brand assets and visual DNA in interesting ways — play with scale, fills, texture, visual rhythm, layering, novel layouts, type treatments. The goal is not the perfect option; it's exploring atomic variations the user can mix and match.

CSS, HTML, JS and SVG are amazing. Users often don't know what they can do. Surprise the user.

If you do not have an icon, asset or component, draw a placeholder: in hi-fi design, a placeholder is better than a bad attempt at the real thing.
</attached-skill>

<attached-skill name="Interactive prototype">
Create a fully interactive prototype with realistic state management and transitions. Use React useState/useEffect for dynamic behavior. Include hover states, click interactions, form validation, animated transitions, and multi-step navigation flows. It should feel like a real working app, not a static mockup.
</attached-skill>


<system-reminder>Auto-injected reminder (ignore if not relevant): do not recreate copyrighted or branded UI unless the user's email domain matches that company. Create original designs instead.</system-reminder>

## Assistant

_[tool: list_files]_

_[tool: view_image]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: questions_v2]_

The napkin sketch is empty, so I'm working from your SILDE spec — and it's a great, detailed one. Before I build, a few questions so I get this right rather than guessing.

The most important thing: this app **already exists** as a single HTML file. If you can import it (Import menu → link your codebase/GitHub, or paste the HTML), I'll match your real components, colors, and structure instead of reinventing them. If not, I'll build a fresh hi-fi prototype from the spec.

## User

Questions answered:
- have_existing_code: Yes — I'll import it now
- goal: Redesign / polish the existing look
- priority_screens: All of them
- theme: Both, switchable
- color_mode: Both (with toggle)
- language: Japanese (日本語)
- device_frame: iPhoneとiPad
- fidelity: Fully clickable with mock data + transitions
- explore_areas: 質問の意味がわからない
- emoji_tone: Tone it down / more refined

## Assistant

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "silde-app"
Project currently has 1 file(s)
Current date is now June 11, 2026
</system-info>

<pasted_text name="Pasted text (2155 lines)">
&lt;!DOCTYPE html&gt;
&lt;html lang="ja"&gt;
&lt;head&gt;
&lt;meta charset="UTF-8"&gt;
&lt;meta name="build-hash" content="DEPLOY_HASH_PLACEHOLDER"&gt;
&lt;meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"&gt;
&lt;meta name="theme-color" content="#CE95B0"&gt;
&lt;meta name="apple-mobile-web-app-capable" content="yes"&gt;
&lt;meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"&gt;
&lt;meta name="color-scheme" content="light dark"&gt;
&lt;meta name="supported-color-schemes" content="light dark"&gt;
&lt;title&gt;🌙 SILDE&lt;/title&gt;
&lt;link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&amp;family=Kaisei+Opti:wght@700&amp;family=Noto+Sans+JP:wght@400;500;700&amp;display=swap" rel="stylesheet"&gt;
&lt;link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/&gt;
&lt;script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"&gt;&lt;/script&gt;
&lt;style&gt;
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{color-scheme:light dark}
html{-webkit-color-scheme:light dark;color-scheme:light dark}
:root{
  --pk:#e88fac;--pkl:#fde8ef;--pkp:#fef3f7;
  --pu:#c478a8;--pul:#f7e4f2;--lav:#f0cfe0;
  --gr:#6a9e8a;--tx:#2a1218;--txs:#7a4a68;
  --night:#9b3a6a;--card:rgba(255,255,255,.97);
  --sh:0 4px 20px rgba(200,100,140,.12);
  --gold:#e88fac;--teal:#c4608a;
}
body{font-family:var(--app-font,'Zen Maru Gothic'),sans-serif;background:#CE95B0 !important;background-color:#CE95B0 !important;height:100dvh;overflow:hidden;display:flex;flex-direction:column;color:var(--tx) !important;overscroll-behavior:none;touch-action:manipulation}
html{background:#CE95B0 !important;background-color:#CE95B0 !important;overscroll-behavior:none;height:100dvh}
/* ===== フォント切り替え ===== */
body.font-shun{--app-font:-apple-system,BlinkMacSystemFont,'Helvetica Neue'}
body.font-shun .auto-dep-time,body.font-shun .shift-stepper-time,
body.font-shun .tl-time,body.font-shun .today-banner-date,
body.font-shun .today-banner::before,body.font-shun .hist-item-date,
body.font-shun .hist-detail-date{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif!important}
body.font-shun .nb,body.font-shun input,body.font-shun select,
body.font-shun .btn,body.font-shun .bmap,body.font-shun .dep-tab,
body.font-shun .otab,body.font-shun .obox.boy{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif!important}
body.font-shun.font-maru{--app-font:'Zen Maru Gothic'}
body.font-shun.font-maru .auto-dep-time,body.font-shun.font-maru .shift-stepper-time,
body.font-shun.font-maru .tl-time,body.font-shun.font-maru .today-banner-date,
body.font-shun.font-maru .today-banner::before,body.font-shun.font-maru .hist-item-date,
body.font-shun.font-maru .hist-detail-date,
body.font-shun.font-maru .nb,body.font-shun.font-maru input,body.font-shun.font-maru select,
body.font-shun.font-maru .btn,body.font-shun.font-maru .bmap,body.font-shun.font-maru .dep-tab,
body.font-shun.font-maru .otab,body.font-shun.font-maru .obox.boy{font-family:'Zen Maru Gothic',sans-serif!important}
/* ===== しゅんくんテーマ カラー (ライトモード) ===== */
body.font-shun{
  --pk:#5a8ab5;--pkl:#dce8f5;--pkp:#eef4fa;
  --pu:#3a6090;--pul:#ccdcee;--lav:#b0c8e0;
  --gr:#4a7a9a;--tx:#1a2540;--txs:#4a5a7a;
  --night:#1e3050;--card:rgba(255,255,255,.97);
  --sh:0 4px 20px rgba(30,60,120,.12);
  --gold:#5a8ab5;--teal:#2a5a8a;
  background:#d8eef8 !important;background-color:#d8eef8 !important
}
html:has(body.font-shun){background:#d8eef8 !important}
body.font-shun .pg{background:#c0d8ec}
body.font-shun .loading-overlay{background:rgba(30,48,80,.92)}
body.font-shun .bp{background:#2a5a8a;box-shadow:0 4px 14px rgba(30,60,120,.3)}
body.font-shun .bgr{background:linear-gradient(135deg,#3a7aaa,#2a5a8a)}
body.font-shun .bmap{background:linear-gradient(135deg,#3a7aaa,#2a5a8a)}
body.font-shun .bdk{background:#1e3050}
body.font-shun .bsave{background:linear-gradient(135deg,#5a8ab5,#2a5a8a);box-shadow:0 4px 14px rgba(30,60,120,.3)}
body.font-shun .today-banner{background:linear-gradient(135deg,#2a5a8a,#5a8ab5)}
body.font-shun .obox.shun{background:linear-gradient(135deg,#1e3050,#2a5a8a)}
body.font-shun .nb.active{color:#2a5a8a;border-top-color:#2a5a8a}
body.font-shun .otab.active{background:#1e3050}
body.font-shun .hist-dot.active{background:#2a5a8a}
/* ===== しゅんくんテーマ ダークモード ===== */
body.font-shun.dark-active{
  --pkl:rgba(90,138,181,.18);--pkp:rgba(90,138,181,.08);
  --pul:rgba(90,138,181,.15);--lav:rgba(90,138,181,.25);
  --tx:#e8f0f8;--txs:rgba(180,210,240,.65);--card:#242424;
  --sh:0 4px 20px rgba(0,0,0,.3);--teal:#6aaad8;
  background:#111111 !important;background-color:#111111 !important
}
html:has(body.font-shun.dark-active){background:#111111 !important}
body.font-shun.dark-active .pg{background:#1a1a1a}
body.font-shun.dark-active .bnav{background:#111111;box-shadow:0 -2px 16px rgba(0,0,0,.5)}
body.font-shun.dark-active .today-card{background:#242424;box-shadow:0 2px 10px rgba(0,0,0,.3),0 0 0 1px rgba(255,255,255,.04)}
body.font-shun.dark-active .today-card-hdr{border-bottom-color:#333}
body.font-shun.dark-active .today-card-date{color:#e8f0f8}
body.font-shun.dark-active .today-action-bar{border-top-color:#333}
body.font-shun.dark-active .today-action-sep{background:#333}
body.font-shun.dark-active .today-action-btn:active{background:#2e2e2e}
body.font-shun.dark-active .hist-detail-run{border-bottom-color:#333}
body.font-shun.dark-active .edit-time-row{border-bottom-color:#2e2e2e}
body.font-shun.dark-active .edit-time-inp{color:#e8f0f8}
body.font-shun.dark-active .edit-time-name{color:#c8d8e8}
body.font-shun.dark-active .card{background:#242424;box-shadow:0 1px 4px rgba(0,0,0,.3),0 0 0 1px rgba(255,255,255,.04)}
body.font-shun.dark-active .ctitle{border-bottom-color:#333;color:rgba(180,210,240,.7)}
body.font-shun.dark-active .mcard{background:#242424;border-bottom-color:#333}
body.font-shun.dark-active .mcard.girl,body.font-shun.dark-active .mcard.place,body.font-shun.dark-active .mcard.dep{background:#242424}
body.font-shun.dark-active .mc-name{color:#e8f0f8}
body.font-shun.dark-active input,body.font-shun.dark-active select{background:#1e1e1e;border-color:rgba(90,138,181,.3);color:#e8f0f8}
body.font-shun.dark-active input:focus,body.font-shun.dark-active select:focus{background:#252525;border-color:#5a8ab5}
body.font-shun.dark-active .gi-card{background:#1e1e1e;border-color:rgba(90,138,181,.2)}
body.font-shun.dark-active .shift-stepper{background:#1e1e1e;border-color:rgba(90,138,181,.2)}
body.font-shun.dark-active .run-block{background:#242424;border-color:rgba(255,255,255,.04)}
body.font-shun.dark-active .hist-item{background:#242424}
body.font-shun.dark-active .hist-item:active{background:#2e2e2e}
body.font-shun.dark-active .tl-item,body.font-shun.dark-active .edit-time-row{border-bottom-color:#333}
body.font-shun.dark-active .month-acc{background:#242424}
body.font-shun.dark-active .month-acc-body{border-top-color:#333}
body.font-shun.dark-active .mbox{background:#1a1a1a}
body.font-shun.dark-active .mtitle{border-bottom-color:#333;color:#e8f0f8;background:#1a1a1a!important}
body.font-shun.dark-active .obox.boy{background:#1e1e1e;color:#e8f0f8}
body.font-shun.dark-active .memo-box{background:#242424}
body.font-shun.dark-active .memo-inp{color:#e8f0f8}
body.font-shun.dark-active .auto-dep-box{background:linear-gradient(135deg,#1e2a3a,#1a2a4a)}
body.font-shun.dark-active .dep-tab{background:#1e1e1e;color:#8a9ab8}
body.font-shun.dark-active .dep-tab.sel{border-color:#5a8ab5;background:rgba(90,138,181,.22);color:#e8f0f8}
body.font-shun.dark-active .nb.active{color:#6aaad8;border-top-color:#6aaad8}
body.font-shun.dark-active .otab.active{background:#1e3050;border-color:#1e3050}
body.font-shun.dark-active .hist-dot.active{background:#2a5a8a}
/* ===== ダークモード補完 ===== */
body.font-shun.dark-active label{color:rgba(180,210,240,.6)}
body.font-shun.dark-active .mc-sub{color:rgba(180,210,240,.45)}
body.font-shun.dark-active .mclose{color:rgba(180,210,240,.5)}
body.font-shun.dark-active .btn.bg{background:#1d2738;color:#7ab8e8}
body.font-shun.dark-active .btn.bg:active{background:#253044}
body.font-shun.dark-active .btn.bo{background:#1a1a1a;border-color:rgba(90,138,181,.35)}
body.font-shun.dark-active .btn.bd{background:#2a1818;border-color:rgba(239,68,68,.35);color:#f87171}
body.font-shun.dark-active .otab{background:#1e1e1e;color:rgba(160,200,235,.55);border-color:rgba(90,138,181,.2)}
body.font-shun.dark-active .badge-drop{background:rgba(74,168,200,.15);color:#7ac8d8}
body.font-shun.dark-active .battery-card{border:1px solid rgba(255,255,255,.05)}
body.font-shun.dark-active .battery-wrap{border-color:rgba(255,255,255,.3)}
body.font-shun.dark-active .battery-wrap::after{background:rgba(255,255,255,.3)}
body.font-shun.dark-active .battery-name{color:rgba(180,210,240,.7)}
body.font-shun.dark-active .battery-pct{color:#e8f0f8}
body.font-shun.dark-active .battery-charge{color:rgba(180,210,240,.5)}
body.font-shun.dark-active .map-legend{background:#1a1a1a;color:#c8d8e8;box-shadow:0 1px 4px rgba(0,0,0,.4)}
body.dark-active #map-container .leaflet-tile-pane{filter:brightness(1.6) contrast(1.1)}
body.map-active{overflow:visible!important;padding-top:0!important}
html:has(body.map-active){background:transparent!important;background-color:transparent!important}
body.map-active #pg-map{position:fixed!important;top:0;left:0;right:0;bottom:0;z-index:52!important;height:100%;padding:0!important;overflow:visible!important;background:transparent!important}
#map-container{display:none}
body.map-active #map-container{display:block;position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;width:100%!important;height:100%!important;z-index:49}
body.map-active #pg-map .map-legend{position:absolute;top:0;left:0;right:0;z-index:10;padding:calc(env(safe-area-inset-top) + 10px) 14px 10px;background:transparent;box-shadow:none;border-bottom:none}
body.map-active .bnav{background:rgba(250,246,250,0.65)!important;-webkit-backdrop-filter:blur(26px) saturate(1.9)!important;backdrop-filter:blur(26px) saturate(1.9)!important;border-top:1.5px solid rgba(255,255,255,0.5)!important;box-shadow:none!important}
body.map-active.font-shun.dark-active .bnav{background:rgba(8,14,30,0.65)!important;border-top-color:rgba(90,140,200,0.18)!important}
#mapGlassTop{display:none;position:absolute;top:0;left:0;right:0;height:env(safe-area-inset-top);z-index:1000;background:rgba(250,246,250,0.55);-webkit-backdrop-filter:blur(24px) saturate(1.8);backdrop-filter:blur(24px) saturate(1.8)}
body.font-shun.dark-active .hist-item-sub{color:rgba(180,210,240,.45)}
body.font-shun.dark-active .hist-item-arr{color:rgba(180,210,240,.3)}
body.font-shun.dark-active .today-card-empty p{color:rgba(180,210,240,.45)}
body.font-shun.dark-active .today-card-empty small{color:rgba(180,210,240,.3)}
body.font-shun.dark-active .today-action-del .today-action-lbl{color:#f87171}
body.font-shun.dark-active .shift-stepper-time{color:#e8f0f8}
body.font-shun.dark-active .shift-stepper-btn{color:#5a8ab5}
body.font-shun.dark-active .shift-stepper-hint{color:rgba(180,210,240,.4)}
body.font-shun.dark-active .auto-dep-label{color:rgba(180,210,240,.7)}
body.font-shun.dark-active .auto-dep-note{color:rgba(180,210,240,.4)}
body.font-shun.dark-active .auto-dep-time{color:#e8f0f8}
body.font-shun.dark-active .memo-hdr{color:rgba(180,210,240,.65)}
body.font-shun.dark-active hr.dv{border-top-color:#2a2a2a}
body.font-shun.dark-active .month-acc-title{color:#e8f0f8}
body.font-shun.dark-active .month-acc-arr{color:rgba(180,210,240,.45)}
body.font-shun.dark-active .rm-btn{color:rgba(180,210,240,.35)}
body.font-shun.dark-active .min-row span{color:rgba(180,210,240,.4)}
body.font-shun.dark-active .empty-hist{color:rgba(180,210,240,.4)}
body.font-shun.dark-active .empty-note{color:rgba(180,210,240,.4)}
body.font-shun.dark-active input:disabled{background:#141414;color:rgba(180,210,240,.3);border-color:rgba(90,138,181,.15)}
body.font-shun.dark-active .hist-dot{background:rgba(90,138,181,.2)}
body.font-shun.dark-active .memo-handle-bar{background:rgba(180,210,240,.2)}
body.font-shun.dark-active .tl-name{color:#e8f0f8}
body.font-shun.dark-active .hist-item-date{color:#e8f0f8}
body.font-shun.dark-active .hist-detail-date{color:#e8f0f8}
body.font-shun.dark-active .save-success-bar{background:linear-gradient(135deg,#1e3a5a,#2a5a8a)}
/* ===== フォント ===== */
body.font-system{--app-font:system-ui,-apple-system,sans-serif}
body.font-system *{font-family:system-ui,-apple-system,sans-serif !important}
/* ===== 設定パネル ===== */
.sett-section{margin-bottom:22px}
.sett-label{font-size:12px;font-weight:700;color:var(--txs);letter-spacing:.3px;margin-bottom:10px;opacity:.7}
.sett-note{font-size:11px;font-weight:400;opacity:.6}
.sett-row{display:flex;gap:8px}
.sett-pill{flex:1;padding:12px 6px;border:none;border-radius:12px;background:var(--pkp);color:var(--txs);font-family:var(--app-font,'Zen Maru Gothic'),sans-serif;font-size:13px;font-weight:700;cursor:pointer;text-align:center;transition:all .15s;-webkit-tap-highlight-color:transparent}
.sett-pill:active{opacity:.8}
.sett-pill.sel{background:var(--pk);color:#fff}
.sett-section.disabled{opacity:.35;pointer-events:none}
body.font-shun .sett-pill.sel{background:var(--teal);color:#fff}
body.font-shun.dark-active .sett-pill{background:rgba(255,255,255,.08);color:rgba(180,210,240,.7)}
body.font-shun.dark-active .sett-pill.sel{background:var(--teal);color:#fff}
.overland-url-row{display:flex;align-items:center;gap:8px;background:var(--pkp);border-radius:10px;padding:10px 12px;cursor:pointer;-webkit-tap-highlight-color:transparent;active:opacity:.8}
.overland-url-row:active{opacity:.7}
.overland-url-text{flex:1;font-size:10px;color:var(--txs);word-break:break-all;opacity:.7}

.bnav{position:fixed;bottom:0;left:0;right:0;z-index:200;background:#fff;display:flex;box-shadow:0 -4px 20px rgba(80,60,140,.15)}
.nb{flex:1;padding:6px 4px 4px;border:none;background:none;cursor:pointer;font-family:'Zen Maru Gothic',sans-serif;font-size:10px;color:#aaa8c0;display:flex;flex-direction:column;align-items:center;gap:2px;border-top:3px solid transparent;transition:all .2s}
.nb .ni{width:18px;height:18px;display:flex;align-items:center;justify-content:center}
.nb .ni svg{width:18px;height:18px}
.nb.active{color:var(--teal);border-top-color:var(--teal);font-weight:700}

.pg{display:none;padding:14px 14px 56px;animation:fi .25s ease;overflow-y:scroll;overscroll-behavior:contain;flex:1;min-height:0;-webkit-overflow-scrolling:touch;background:#f4eef2}
.pg.active{display:block}
#pg-map{padding:0;overflow:hidden;display:none;flex-direction:column}
#pg-map.active{display:flex}
#map-container{flex:1;min-height:0;width:100%}
#map-container .leaflet-container{background:#e8e4e0}
body.dark-active #map-container .leaflet-container{background:#1a2a40}
.map-legend{padding:10px 14px 6px;font-size:12px;display:flex;flex-wrap:wrap;gap:8px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.map-legend-item{display:flex;align-items:center;gap:4px;white-space:nowrap}
.map-marker{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid rgba(255,255,255,.8)}
.leaflet-div-icon{background:none!important;border:none!important}

.loc-wrap{position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center}
.loc-pulse{position:absolute;inset:0;border-radius:50%;animation:locPulse 2.4s ease-out infinite}
@keyframes locPulse{0%{transform:scale(.4);opacity:.7}100%{transform:scale(2.2);opacity:0}}
@keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

.card{background:#fff;border-radius:16px;padding:16px;margin-bottom:10px;box-shadow:0 2px 12px rgba(180,100,140,.1);overflow:hidden}
.ctitle{font-size:13px;font-weight:700;color:var(--txs);margin:-16px -16px 14px;padding:13px 16px 12px;border-bottom:1px solid #f5f0f3;display:flex;align-items:center;gap:6px;letter-spacing:.3px;opacity:.8}

label{display:block;font-size:12px;color:#9b8090;margin-bottom:5px;font-weight:600;letter-spacing:.3px}
input,select{width:100%;padding:11px 14px;border:none;border-radius:10px;font-family:var(--app-font,'Zen Maru Gothic'),sans-serif;font-size:15px;color:var(--tx);background:var(--pkp);outline:none;margin-bottom:12px;-webkit-appearance:none;transition:background .15s,box-shadow .15s}
input:focus,select:focus{background:var(--pkl);box-shadow:0 0 0 3px rgba(200,150,175,.18)}
input:disabled{background:#f0f0f0;color:#bbb}

.btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:14px;border:none;border-radius:11px;cursor:pointer;font-family:var(--app-font,'Zen Maru Gothic'),sans-serif;font-size:15px;font-weight:700;transition:all .15s;margin-bottom:8px}
.btn:active{transform:scale(.98);opacity:.9}
.bp{background:#CE95B0;color:#fff;box-shadow:0 2px 10px rgba(180,100,140,.25)}
.bg{background:#f4eef2;color:var(--teal)}
.bo{background:var(--pkp);color:var(--teal)}
.bd{background:#fff0f0;color:#e53e3e}
.bgr{background:linear-gradient(135deg,#6a9e8a,#4a8070);color:#fff}
.bdk{background:var(--night);color:#fde8e8}
.bsave{background:linear-gradient(135deg,#e88fac,#c4608a);color:#fff;box-shadow:0 2px 10px rgba(200,100,140,.25)}
.sm{padding:8px 16px;font-size:13px;border-radius:9px;width:auto;margin-bottom:0}
.bmap{background:var(--pk);color:#fff;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--app-font,'Zen Maru Gothic'),sans-serif;white-space:nowrap;display:inline-flex;align-items:center;gap:3px}
.bmap:active{opacity:.8}
.bmap.calculating{background:var(--lav);animation:blink .8s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.5}}

.dep-tabs{display:flex;gap:6px;margin:0 0 14px}
.dep-tab{flex:1;padding:10px 6px;border:none;border-radius:12px;background:var(--pkp);color:var(--txs);font-family:var(--app-font,'Zen Maru Gothic'),sans-serif;font-size:13px;font-weight:700;cursor:pointer;text-align:center;transition:all .15s;-webkit-tap-highlight-color:transparent}
.dep-tab:active{background:var(--pkl)}
.dep-tab.sel{background:var(--pkl);color:var(--night)}

.auto-dep-box{background:linear-gradient(135deg,var(--pkp),var(--pul));border-radius:14px;padding:14px 16px;margin:0 0 14px;display:flex;align-items:center;justify-content:space-between}
.auto-dep-label{font-size:12px;color:var(--txs);font-weight:600}
.auto-dep-time{font-size:30px;font-weight:700;font-family:'Kaisei Opti',serif;color:var(--tx)}
.auto-dep-note{font-size:11px;color:#bbb;margin-top:2px}

.gi-card{background:var(--pkp);border-radius:14px;padding:14px;margin-bottom:8px}
.gi-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.gi-badge{font-size:11px;font-weight:700;color:var(--teal);background:var(--pul);padding:3px 10px;border-radius:20px}
.rm-btn{background:none;border:none;font-size:17px;color:#c0a8c8;cursor:pointer;padding:0}

.shift-stepper{display:flex;align-items:center;margin-bottom:6px;background:var(--pkp);border-radius:11px;overflow:hidden}
.shift-stepper-btn{width:44px;height:44px;border:none;background:none;cursor:pointer;font-size:20px;font-weight:700;color:var(--pk);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background .12s}
.shift-stepper-btn:active{background:var(--pkl)}
.shift-stepper-time{flex:1;text-align:center;font-size:20px;font-weight:700;font-family:'Kaisei Opti',serif;color:var(--tx);padding:0 4px;line-height:44px}
.shift-stepper-hint{font-size:10px;color:#bbb;text-align:center;margin-top:2px;margin-bottom:8px}

.min-row{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.min-row input{margin-bottom:0;flex:1}
.min-row span{font-size:12px;color:#bbb;white-space:nowrap}

.run-block{background:transparent;border-radius:0;padding:12px 0;margin-bottom:0;border:none;border-bottom:1px solid #f5f0f3}
.run-block:last-child{border-bottom:none}
.run-label{font-size:11px;font-weight:700;color:var(--teal);background:var(--pul);padding:3px 10px;border-radius:20px;display:inline-block;margin-bottom:10px}
.tl-item{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f5f0f3}
.tl-item:last-child{border-bottom:none}
.tl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dot-pick{background:var(--pk)}
.dot-drop{background:#7ab8c8}
.tl-time{font-size:17px;font-weight:700;font-family:'Kaisei Opti',serif;color:var(--tx);min-width:50px}
.tl-name{font-size:14px;flex:1}
.tl-badge{font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;flex-shrink:0}
.badge-pick{background:var(--pkl);color:var(--teal)}
.badge-drop{background:#dff0f5;color:#4a8098}
.tl-min{font-size:11px;color:var(--txs);background:var(--pul);padding:2px 8px;border-radius:20px;flex-shrink:0}

.otabs{display:flex;gap:6px;padding:12px 16px 0}
.otab{flex:1;padding:9px;text-align:center;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:var(--app-font,'Zen Maru Gothic'),sans-serif;background:var(--pkp);color:var(--txs);transition:all .15s}
.otab.active{background:var(--night);color:#fde8e8}
.obox{border-radius:0;padding:16px;font-size:14px;line-height:2;white-space:pre-wrap;word-break:break-all;margin-bottom:0;min-height:70px}
.obox.shun{background:linear-gradient(135deg,#9b3a6a,#c4608a);color:#fff;font-family:monospace}
.obox.boy{background:#fafafa;color:var(--tx);font-family:var(--app-font,'Zen Maru Gothic'),sans-serif}

.mcard{background:#fff;padding:12px 0;margin-bottom:0;display:flex;align-items:center;gap:12px;border-bottom:1px solid #f5f0f3}
.mcard:last-child{border-bottom:none}
.mcard.girl,.mcard.place,.mcard.dep{background:#fff}
.mc-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.mc-av.g{background:linear-gradient(135deg,#e88fac,#c4608a)}
.mc-av.p{background:linear-gradient(135deg,#c4608a,#a84878);border-radius:9px}
.mc-av.d{background:linear-gradient(135deg,#6a9e8a,#4a8070);border-radius:9px}
.mc-info{flex:1;min-width:0}
.mc-name{font-size:15px;font-weight:600;color:var(--tx)}
.mc-sub{font-size:12px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}

.mo{display:none;position:fixed;inset:0;background:rgba(20,18,40,.45);z-index:500;align-items:flex-end}
.mo.open{display:flex}
.mbox{background:#f4eef2;border-radius:22px 22px 0 0;padding:0 16px 34px;width:100%;max-height:88vh;overflow-y:auto;animation:su .28s ease}
@keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
.mtitle{font-size:15px;font-weight:700;color:var(--tx);padding:16px 0;border-bottom:1px solid #ece4ea;display:flex;align-items:center;justify-content:space-between;background:transparent;margin-bottom:14px}
.mclose{background:none;border:none;font-size:22px;color:#bbb;cursor:pointer}

/* ===== 今日のスケジュールカード ===== */
.today-card{background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;box-shadow:0 2px 12px rgba(180,100,140,.1)}
.today-card-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 12px;border-bottom:1px solid #f5f0f3}
.today-card-label{font-size:10px;font-weight:700;color:var(--txs);letter-spacing:1.5px;opacity:.5}
.today-card-date{font-size:19px;font-weight:700;font-family:'Kaisei Opti',serif;color:var(--tx)}
.today-card-empty{padding:28px 16px 24px;text-align:center}
.today-card-empty p{font-size:14px;color:#bbb}
.today-card-empty small{font-size:11px;color:#ddd}
.today-action-bar{display:flex;border-top:1px solid #f5f0f3}
.today-action-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:13px 4px;cursor:pointer;user-select:none;transition:background .12s;-webkit-tap-highlight-color:transparent}
.today-action-btn:active{background:#f8f4f6}
.today-action-ico{font-size:20px;line-height:1;display:flex;align-items:center;justify-content:center;color:var(--txs)}
.today-action-lbl{font-size:10px;font-weight:700;color:var(--txs);letter-spacing:.3px}
.today-action-sep{width:1px;background:#f5f0f3;align-self:stretch}
.today-action-del .today-action-ico{font-size:17px;opacity:.5}
.today-action-del .today-action-lbl{color:#e05a5a;opacity:.8}
.battery-card{background:var(--card);border-radius:16px;padding:13px 16px;margin-top:10px;box-shadow:var(--sh);display:flex;justify-content:space-between;align-items:center;gap:8px}
.battery-user{display:flex;align-items:center;gap:10px;flex:1}
.battery-name{font-size:12px;font-weight:700;color:var(--txs);margin-bottom:2px}
.battery-pct{font-size:18px;font-weight:700;color:var(--tx);line-height:1}
.battery-wrap{width:48px;height:24px;border:2px solid rgba(0,0,0,.2);border-radius:5px;padding:2px;position:relative;flex-shrink:0}
.battery-wrap::after{content:'';position:absolute;right:-6px;top:50%;transform:translateY(-50%);width:4px;height:10px;background:rgba(0,0,0,.2);border-radius:0 3px 3px 0}
.battery-fill{height:100%;border-radius:3px;transition:width .4s,background .4s}
.battery-bolt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1;pointer-events:none;z-index:1}
.battery-charge{font-size:10px;color:var(--txs)}

.month-acc{background:#fff;border-radius:16px;margin-bottom:10px;box-shadow:0 2px 12px rgba(180,100,140,.1);overflow:hidden}
.month-acc-hdr{display:flex;align-items:center;justify-content:space-between;padding:15px 16px;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;transition:background .12s}
.month-acc-hdr:active{background:#fdf5f8}
.month-acc-title{font-size:17px;font-weight:700;color:var(--tx);font-family:'Kaisei Opti',serif}
.month-acc-count{font-size:11px;font-weight:700;color:var(--teal);background:var(--pul);padding:3px 10px;border-radius:20px}
.month-acc-arr{font-size:11px;color:var(--txs);opacity:.4;transition:transform .25s}
.month-acc.open .month-acc-arr{transform:rotate(180deg)}
.month-acc-body{display:none;border-top:1px solid #f5f0f3;padding:0}
.month-acc.open .month-acc-body{display:block}
#pg-hist{overflow:hidden !important;flex-direction:column;padding:0 0 52px}
#pg-hist.active{display:flex !important}
.hist-dots{display:flex;justify-content:center;gap:7px;padding:8px 0 4px;flex-shrink:0}
.hist-dot{width:6px;height:6px;border-radius:50%;background:rgba(180,100,140,.2);transition:all .2s;cursor:pointer}
.hist-dot.active{background:#c4608a;width:18px;border-radius:3px}
#histSlider{display:flex;flex:1;min-height:0;overflow-x:scroll;scroll-snap-type:x mandatory;scrollbar-width:none}
#histSlider::-webkit-scrollbar{display:none}
#histPageToday,#histPageMonths{min-width:100%;scroll-snap-align:start;overflow-y:scroll;overscroll-behavior:contain;padding:14px 14px 160px}
.memo-box{background:#fff;border-radius:16px 16px 0 0;padding:0 14px 14px;position:fixed;bottom:56px;left:0;right:0;z-index:20;transition:transform 0.4s cubic-bezier(0.32,0.72,0,1);box-shadow:0 -2px 16px rgba(180,100,140,.1)}
.memo-handle{display:flex;justify-content:center;padding:10px 0 6px;cursor:pointer;touch-action:none}
.memo-handle-bar{width:36px;height:4px;border-radius:2px;background:rgba(180,100,140,.2)}
.memo-hdr{font-size:13px;font-weight:700;color:var(--txs);margin-bottom:8px}
.memo-inp{width:100%;min-height:90px;border:none;border-radius:0;padding:0;font-size:15px;font-family:inherit;resize:none;background:transparent;color:var(--tx);outline:none}

.hist-item{background:transparent;border-radius:0;padding:13px 16px;margin-bottom:0;cursor:pointer;transition:background .12s;border:none;border-bottom:1px solid #f8f4f6;-webkit-tap-highlight-color:transparent}
.hist-item:last-child{border-bottom:none}
.hist-item:active{background:#fdf5f8}
.hist-item-hdr{display:flex;align-items:center;justify-content:space-between}
.hist-item-date{font-size:15px;font-weight:700;font-family:'Kaisei Opti',serif;color:var(--tx)}
.hist-item-sub{font-size:12px;color:#bbb;margin-top:3px}
.hist-item-badge{font-size:11px;font-weight:700;color:var(--teal);background:var(--pul);padding:2px 9px;border-radius:20px}
.hist-item-arr{font-size:14px;color:var(--txs);opacity:.35}

.hist-detail-date{font-size:18px;font-weight:700;font-family:'Kaisei Opti',serif;color:var(--tx);margin-bottom:14px}
.hist-detail-run{padding:12px 16px 2px;border-bottom:1px solid #f5f0f3}
.hist-detail-run:last-of-type{border-bottom:none}
.hist-detail-run-lbl{font-size:10px;font-weight:700;color:var(--txs);letter-spacing:.8px;margin-bottom:8px;opacity:.5}
.edit-time-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f8f4f6}
.edit-time-row:last-child{border-bottom:none}
.edit-time-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.edit-time-inp{font-size:17px;font-weight:700;font-family:'Kaisei Opti',serif;color:var(--tx);border:none;background:transparent !important;outline:none;width:54px;padding:0;margin-bottom:0;border-radius:0;-webkit-appearance:none;cursor:pointer;align-self:center}
.edit-time-inp:focus{color:var(--pk)}
.edit-time-name{font-size:14px;flex:1;color:var(--tx);font-weight:500}
.edit-time-badge{font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;flex-shrink:0}
.edit-time-row.past{opacity:.28}
.tl-now{display:flex;align-items:center;gap:8px;padding:4px 0 8px}
.tl-now-dot{width:14px;height:14px;flex-shrink:0;color:var(--pk);display:flex;align-items:center;justify-content:center;animation:now-pulse 1.8s ease-in-out infinite}
@keyframes now-pulse{0%,100%{opacity:1;transform:scale(1)}60%{opacity:.45;transform:scale(.85)}}
.tl-now-lbl{font-size:11px;font-weight:700;color:var(--pk);letter-spacing:.3px}
.today-done{text-align:center;padding:8px 0 4px;font-size:11px;font-weight:700;color:var(--txs);opacity:.4;letter-spacing:.5px}
.debug-time-row{display:flex;align-items:center;gap:10px;background:var(--card);border-radius:16px;padding:12px 16px;margin-top:10px;box-shadow:var(--sh)}
.debug-time-lbl{font-size:12px;color:var(--txs);font-weight:600;line-height:1;align-self:center}
.debug-time-inp{font-size:14px;font-weight:700;color:var(--tx);border:1px solid var(--lav);border-radius:8px;background:var(--pkp);outline:none;padding:0 8px;cursor:pointer;width:110px;flex-shrink:0;height:34px;align-self:center;vertical-align:middle}
.debug-time-clr{font-size:12px;color:var(--txs);border:none;background:none;cursor:pointer;padding:0;margin-left:auto;opacity:.6;white-space:nowrap;line-height:1;align-self:center}

.empty-hist{text-align:center;padding:40px 14px;color:#ccc}
.empty-hist .ei{font-size:44px;margin-bottom:8px}
.fab{position:fixed;bottom:58px;right:14px;z-index:190;width:90px;height:110px;background:none;border:none;cursor:pointer;padding:0;transition:transform .25s cubic-bezier(.34,1.56,.64,1);transform:translateY(30px)}
.fab:hover,.fab:focus{transform:translateY(10px)}
.fab:active{transform:translateY(14px) scale(.96)}
.fab img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 -4px 12px rgba(200,100,140,.3))}
@keyframes pawPeek{0%{transform:translateY(60px)}60%{transform:translateY(5px)}80%{transform:translateY(14px)}100%{transform:translateY(30px)}}
.fab.init{animation:pawPeek .8s cubic-bezier(.34,1.56,.64,1) forwards}

.empty-hist p{font-size:13px}

.save-success-bar{background:linear-gradient(135deg,#c4608a,#e88fac);border-radius:12px;padding:13px 16px;margin-bottom:10px;display:flex;align-items:center;gap:10px;animation:fi .3s ease}
.save-success-bar span{font-size:13px;font-weight:700;color:#fde8e8;flex:1}

.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(30,20,40,.85);backdrop-filter:blur(8px);color:#fff;padding:10px 22px;border-radius:30px;font-size:13px;z-index:999;pointer-events:none;white-space:nowrap;opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}
.toast.show{opacity:1;visibility:visible}
.empty-note{font-size:12px;color:#bbb;text-align:center;padding:14px}
hr.dv{border:none;border-top:1px solid #f0eaf0;margin:10px 0}

/* ローディングオーバーレイ */
.loading-overlay{position:fixed;inset:0;background:rgba(206,149,176,.95);z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff}
.loading-spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;margin-bottom:16px}
@keyframes spin{to{transform:rotate(360deg)}}
.loading-text{font-size:15px;font-weight:700;font-family:'Zen Maru Gothic',sans-serif}
.loading-sub{font-size:12px;opacity:.75;margin-top:6px;font-family:'Zen Maru Gothic',sans-serif}
#starfield{display:none;position:fixed;inset:0;pointer-events:none;z-index:0}
body.font-shun.dark-active #starfield{display:block}
body.font-shun.dark-active .pg{background:transparent;position:relative;z-index:1}
body.font-shun.dark-active #pg-hist{background:transparent}
#pg-secret{padding:14px 14px 52px}
#pg-secret.active{display:block !important}
.secret-wrap{position:relative;border-radius:16px;overflow:hidden}
.secret-content{background:var(--card);border-radius:16px;padding:16px;box-shadow:var(--sh)}
.secret-content label{display:block;font-size:11px;color:var(--txs);font-weight:600;margin-bottom:4px;margin-top:12px}
.secret-content label:first-child{margin-top:0}
.secret-overlay{position:absolute;inset:0;background:rgba(255,255,255,.12);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;border-radius:16px;z-index:2}
.secret-pw-lbl{font-size:13px;font-weight:700;color:var(--tx);opacity:.7}
.secret-pw-inp{font-size:16px;font-family:var(--app-font,'Zen Maru Gothic'),sans-serif;color:var(--tx);background:rgba(255,255,255,.7);border:1px solid var(--lav);border-radius:10px;padding:10px 14px;outline:none;width:100%;text-align:center}
.secret-unlock-btn{font-size:14px;font-weight:700;font-family:var(--app-font,'Zen Maru Gothic'),sans-serif;background:var(--pk);color:#fff;border:none;border-radius:10px;padding:10px 28px;cursor:pointer;width:100%}
.secret-link-wrap{padding:24px 0;text-align:center}
.secret-link{font-size:18px;font-weight:700;color:var(--pk);text-decoration:none;word-break:break-all;padding:16px;display:inline-block;background:var(--pkp);border-radius:14px;width:100%;box-sizing:border-box}
@media (min-width: 768px) {
  .pg{padding-left:max(14px,calc(50% - 300px));padding-right:max(14px,calc(50% - 300px))}
  #histPageToday,#histPageMonths{padding-left:max(14px,calc(50% - 300px));padding-right:max(14px,calc(50% - 300px))}
  .bnav{padding-left:max(0px,calc(50% - 300px));padding-right:max(0px,calc(50% - 300px))}
  .memo-box{left:max(0px,calc(50% - 300px));right:max(0px,calc(50% - 300px))}
}
/* ===== セーフエリア下端 (常時適用: env()はセーフエリアがなければ0になる) ===== */
.bnav{padding-bottom:env(safe-area-inset-bottom)}
.memo-box{bottom:calc(56px + env(safe-area-inset-bottom))}
.pg{padding-bottom:calc(56px + env(safe-area-inset-bottom))}
#pg-hist{padding:0 0 calc(52px + env(safe-area-inset-bottom))}
#pg-secret{padding:14px 14px calc(52px + env(safe-area-inset-bottom))}
&lt;/style&gt;
&lt;/head&gt;
&lt;body&gt;
&lt;canvas id="starfield"&gt;&lt;/canvas&gt;

&lt;!-- ローディング --&gt;
&lt;div class="loading-overlay" id="loadingOverlay"&gt;
  &lt;div class="loading-spinner"&gt;&lt;/div&gt;
  &lt;div class="loading-text"&gt;🌙 読み込み中...&lt;/div&gt;
  &lt;div class="loading-sub"&gt;スプレッドシートからデータを取得しています&lt;/div&gt;
&lt;/div&gt;

&lt;!-- SCHEDULE MODAL (bottom sheet) --&gt;
&lt;div class="mo" id="moSched"&gt;
  &lt;div class="mbox" style="max-height:calc(100dvh - 80px)"&gt;
    &lt;div class="mtitle" style="position:sticky;top:0;z-index:10;background:#f4eef2"&gt;
      &lt;span style="font-size:16px;font-weight:700"&gt;🚗 スケジュール作成&lt;/span&gt;
      &lt;button class="mclose" style="font-size:13px;color:#fff;background:var(--teal);border-radius:20px;padding:6px 14px;font-family:var(--app-font,'Zen Maru Gothic'),sans-serif;font-weight:700" onclick="closeSchedModal()"&gt;キャンセル&lt;/button&gt;
    &lt;/div&gt;
    &lt;div id="schedFormContent"&gt;
    &lt;div class="card"&gt;
      &lt;div class="ctitle"&gt;📅 日付&lt;/div&gt;
      &lt;div style="display:flex;gap:8px;align-items:center"&gt;
        &lt;input type="date" id="dateInp" style="flex:1;margin-bottom:0"&gt;
        &lt;button class="btn bg sm" onclick="setToday()"&gt;今日&lt;/button&gt;
        &lt;button class="btn bg sm" onclick="setTomorrow()"&gt;明日&lt;/button&gt;
      &lt;/div&gt;
    &lt;/div&gt;
    &lt;div class="card"&gt;
      &lt;div class="ctitle"&gt;🚩 出発地&lt;/div&gt;
      &lt;div class="dep-tabs"&gt;
        &lt;button class="dep-tab sel" id="dt-saved" onclick="setDepMode('saved')"&gt;📍 登録済み&lt;/button&gt;
        &lt;button class="dep-tab" id="dt-manual" onclick="setDepMode('manual')"&gt;✏️ 直接入力&lt;/button&gt;
      &lt;/div&gt;
      &lt;div id="dep-saved-area"&gt;
        &lt;label&gt;出発地を選ぶ&lt;/label&gt;
        &lt;select id="depLocSel" onchange="onDepChange()" style="margin-bottom:0"&gt;&lt;/select&gt;
      &lt;/div&gt;
      &lt;div id="dep-manual-area" style="display:none"&gt;
        &lt;label&gt;出発地名&lt;/label&gt;
        &lt;input type="text" id="depManualName" placeholder="○○カフェ、友達の家など" oninput="onDepChange()" style="margin-bottom:10px"&gt;
        &lt;label&gt;出発地住所（任意・ルート計算に使用）&lt;/label&gt;
        &lt;input type="text" id="depManualAddr" placeholder="大阪市北区梅田1-1-1など" style="margin-bottom:10px"&gt;
        &lt;label&gt;出発時刻（手動）&lt;/label&gt;
        &lt;input type="time" id="depManualTime" value="18:30" onchange="onDepChange()" style="margin-bottom:0"&gt;
      &lt;/div&gt;
      &lt;div id="autoDepDisplay" style="display:none;margin-top:10px"&gt;
        &lt;div class="auto-dep-box"&gt;
          &lt;div&gt;
            &lt;div class="auto-dep-label"&gt;🔮 逆算した出発時刻&lt;/div&gt;
            &lt;div class="auto-dep-time" id="autoDepTime"&gt;--:--&lt;/div&gt;
            &lt;div class="auto-dep-note"&gt;移動時間を入力すると自動で更新されるよ&lt;/div&gt;
          &lt;/div&gt;
          &lt;div style="font-size:28px"&gt;🚗&lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
    &lt;div class="card"&gt;
      &lt;div class="ctitle"&gt;👩 女の子の出勤情報&lt;/div&gt;
      &lt;div id="girlInputs"&gt;&lt;/div&gt;
    &lt;/div&gt;
    &lt;button class="btn bp" onclick="buildSchedule()"&gt;✨ スケジュール生成&lt;/button&gt;
    &lt;div id="resultSection" style="display:none"&gt;
      &lt;div class="card"&gt;
        &lt;div class="ctitle"&gt;🗓 スケジュール&lt;/div&gt;
        &lt;div id="resultBlocks"&gt;&lt;/div&gt;
      &lt;/div&gt;
      &lt;div class="card"&gt;
        &lt;div class="ctitle"&gt;📋 コピー用テキスト&lt;/div&gt;
        &lt;div class="otabs"&gt;
          &lt;button class="otab active" id="tabS" onclick="switchOutTab('shun')"&gt;🌙 しゅんくん用&lt;/button&gt;
          &lt;button class="otab" id="tabB" onclick="switchOutTab('boy')"&gt;📤 ボーイさん用&lt;/button&gt;
        &lt;/div&gt;
        &lt;div id="outShun" class="obox shun"&gt;&lt;/div&gt;
        &lt;div id="outBoy" class="obox boy" style="display:none"&gt;&lt;/div&gt;
        &lt;button class="btn bdk" id="cpyS" onclick="copyOut('shun')"&gt;📋 しゅんくん用をコピー&lt;/button&gt;
        &lt;button class="btn bgr" id="cpyB" style="display:none" onclick="copyOut('boy')"&gt;📤 ボーイさん用をコピー&lt;/button&gt;
      &lt;/div&gt;
      &lt;button class="btn bsave" onclick="saveSchedule()"&gt;💾 このスケジュールを保存&lt;/button&gt;
    &lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;

&lt;div class="pg active" id="pg-hist"&gt;
  &lt;div class="hist-dots"&gt;
    &lt;span class="hist-dot active" id="dot-today" onclick="slideTo(0)"&gt;&lt;/span&gt;
    &lt;span class="hist-dot" id="dot-months" onclick="slideTo(1)"&gt;&lt;/span&gt;
  &lt;/div&gt;
  &lt;div id="histSlider"&gt;
    &lt;div id="histPageToday"&gt;&lt;/div&gt;
    &lt;div id="histPageMonths"&gt;&lt;div id="histContent" style="min-height:60vh"&gt;&lt;/div&gt;&lt;/div&gt;
  &lt;/div&gt;
  &lt;div class="memo-box"&gt;
    &lt;div class="memo-handle"&gt;&lt;div class="memo-handle-bar"&gt;&lt;/div&gt;&lt;/div&gt;
    &lt;div class="memo-hdr"&gt;📝 共有メモ&lt;/div&gt;
    &lt;textarea id="memoInp" class="memo-inp" oninput="onMemoInput()" placeholder="ここに共有メモを入力..."&gt;&lt;/textarea&gt;
  &lt;/div&gt;
&lt;/div&gt;

&lt;div class="pg" id="pg-map"&gt;
  &lt;div id="mapGlassTop"&gt;&lt;/div&gt;
  &lt;div class="map-legend" id="mapLegend"&gt;
    &lt;span class="map-legend-item"&gt;🏠 場所&lt;/span&gt;
    &lt;span class="map-legend-item"&gt;👧 女の子&lt;/span&gt;
    &lt;span class="map-legend-item"&gt;🚩 出発地&lt;/span&gt;
    &lt;span class="map-legend-item" id="locStatusShun" style="opacity:.4"&gt;🌙 しゅん&lt;/span&gt;
    &lt;span class="map-legend-item" id="locStatusHee" style="opacity:.4"&gt;🌸 ひーちゃん&lt;/span&gt;
  &lt;/div&gt;
&lt;/div&gt;

&lt;div id="map-container"&gt;&lt;/div&gt;

&lt;div class="pg" id="pg-master"&gt;
  &lt;div class="card"&gt;
    &lt;div class="ctitle"&gt;🚩 出発地マスター&lt;/div&gt;
    &lt;div id="depMasterList"&gt;&lt;/div&gt;
    &lt;button class="btn bo" onclick="openDepMo(null)"&gt;＋ 出発地を追加&lt;/button&gt;
  &lt;/div&gt;
  &lt;div class="card"&gt;
    &lt;div class="ctitle"&gt;👩 女の子マスター&lt;/div&gt;
    &lt;div id="girlMasterList"&gt;&lt;/div&gt;
    &lt;button class="btn bo" onclick="openGirlMo(null)"&gt;＋ 女の子を追加&lt;/button&gt;
  &lt;/div&gt;
  &lt;div class="card"&gt;
    &lt;div class="ctitle"&gt;🏠 送り先マスター&lt;/div&gt;
    &lt;div id="placeMasterList"&gt;&lt;/div&gt;
    &lt;button class="btn bg" onclick="openPlaceMo(null)"&gt;＋ 送り先を追加&lt;/button&gt;
  &lt;/div&gt;
&lt;/div&gt;

&lt;div class="pg" id="pg-secret"&gt;&lt;/div&gt;

&lt;!-- FAB --&gt;
&lt;button class="fab" onclick="openSchedModal()" aria-label="スケジュール作成"&gt;
  &lt;img src="data:image/png;base64,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" alt="🐾" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 -4px 10px rgba(200,100,140,.3))"&gt;
&lt;/button&gt;

&lt;div class="bnav"&gt;
  &lt;button class="nb active" id="nb-hist" onclick="switchPg('hist')"&gt;&lt;span class="ni"&gt;&lt;svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"&gt;&lt;rect x="3" y="4" width="18" height="18" rx="2" ry="2"/&gt;&lt;line x1="16" y1="2" x2="16" y2="6"/&gt;&lt;line x1="8" y1="2" x2="8" y2="6"/&gt;&lt;line x1="3" y1="10" x2="21" y2="10"/&gt;&lt;/svg&gt;&lt;/span&gt;スケジュール&lt;/button&gt;
  &lt;button class="nb" id="nb-map" onclick="switchPg('map')"&gt;&lt;span class="ni"&gt;&lt;svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"&gt;&lt;polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/&gt;&lt;line x1="8" y1="2" x2="8" y2="18"/&gt;&lt;line x1="16" y1="6" x2="16" y2="22"/&gt;&lt;/svg&gt;&lt;/span&gt;マップ&lt;/button&gt;
  &lt;button class="nb" id="nb-master" onclick="switchPg('master')"&gt;&lt;span class="ni"&gt;&lt;svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"&gt;&lt;path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/&gt;&lt;circle cx="12" cy="10" r="3"/&gt;&lt;/svg&gt;&lt;/span&gt;行き先&lt;/button&gt;
  &lt;button class="nb" id="nb-secret" onclick="switchPg('secret')"&gt;&lt;span class="ni"&gt;&lt;svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"&gt;&lt;rect x="3" y="11" width="18" height="11" rx="2" ry="2"/&gt;&lt;path d="M7 11V7a5 5 0 0 1 10 0v4"/&gt;&lt;/svg&gt;&lt;/span&gt;シークレット&lt;/button&gt;
  &lt;button class="nb" id="nb-settings" onclick="openSettings()"&gt;&lt;span class="ni"&gt;&lt;svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"&gt;&lt;circle cx="12" cy="12" r="3"/&gt;&lt;path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/&gt;&lt;/svg&gt;&lt;/span&gt;設定&lt;/button&gt;
&lt;/div&gt;

&lt;div class="mo" id="moDepLoc"&gt;
  &lt;div class="mbox"&gt;
    &lt;div class="mtitle"&gt;&lt;span id="moDepTitle"&gt;🚩 出発地を登録&lt;/span&gt;&lt;button class="mclose" onclick="closeMo('moDepLoc')"&gt;✕&lt;/button&gt;&lt;/div&gt;
    &lt;input type="hidden" id="edId"&gt;
    &lt;label&gt;場所名&lt;/label&gt;&lt;input type="text" id="dNameInp" placeholder="職場・家・〇〇など"&gt;
    &lt;label&gt;住所（任意）&lt;/label&gt;&lt;input type="text" id="dAddrInp" placeholder="大阪市〇〇区…"&gt;
    &lt;button class="btn bp" onclick="saveDepLoc()"&gt;💾 保存&lt;/button&gt;
    &lt;button class="btn bd" id="delDepBtn" style="display:none" onclick="delDepLoc()"&gt;🗑️ 削除&lt;/button&gt;
  &lt;/div&gt;
&lt;/div&gt;

&lt;div class="mo" id="moGirl"&gt;
  &lt;div class="mbox"&gt;
    &lt;div class="mtitle"&gt;&lt;span id="moGirlTitle"&gt;👩 女の子を登録&lt;/span&gt;&lt;button class="mclose" onclick="closeMo('moGirl')"&gt;✕&lt;/button&gt;&lt;/div&gt;
    &lt;input type="hidden" id="egId"&gt;
    &lt;label&gt;名前&lt;/label&gt;&lt;input type="text" id="gNameInp" placeholder="さなさん"&gt;
    &lt;label&gt;迎え場所（通称）&lt;/label&gt;&lt;input type="text" id="gNickInp" placeholder="さなさんマンション前"&gt;
    &lt;label&gt;住所&lt;/label&gt;&lt;input type="text" id="gAddrInp" placeholder="大阪市北区〇〇 1-2-3"&gt;
    &lt;button class="btn bp" onclick="saveGirl()"&gt;💾 保存&lt;/button&gt;
    &lt;button class="btn bd" id="delGirlBtn" style="display:none" onclick="delGirl()"&gt;🗑️ 削除&lt;/button&gt;
  &lt;/div&gt;
&lt;/div&gt;

&lt;div class="mo" id="moPlace"&gt;
  &lt;div class="mbox"&gt;
    &lt;div class="mtitle"&gt;&lt;span id="moPlaceTitle"&gt;🏠 送り先を登録&lt;/span&gt;&lt;button class="mclose" onclick="closeMo('moPlace')"&gt;✕&lt;/button&gt;&lt;/div&gt;
    &lt;input type="hidden" id="epId"&gt;
    &lt;label&gt;場所名&lt;/label&gt;&lt;input type="text" id="pNameInp" placeholder="Venus"&gt;
    &lt;label&gt;住所&lt;/label&gt;&lt;input type="text" id="pAddrInp" placeholder="大阪市中央区〇〇"&gt;
    &lt;button class="btn bp" onclick="savePlace()"&gt;💾 保存&lt;/button&gt;
    &lt;button class="btn bd" id="delPlaceBtn" style="display:none" onclick="delPlace()"&gt;🗑️ 削除&lt;/button&gt;
  &lt;/div&gt;
&lt;/div&gt;

&lt;div class="mo" id="moHistDetail"&gt;
  &lt;div class="mbox"&gt;
    &lt;div class="mtitle"&gt;
      &lt;span id="moHistTitle"&gt;📅 スケジュール詳細&lt;/span&gt;
      &lt;button class="mclose" onclick="closeMo('moHistDetail')"&gt;✕&lt;/button&gt;
    &lt;/div&gt;
    &lt;div id="moHistBody"&gt;&lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;

&lt;div class="mo" id="moOverwrite"&gt;
  &lt;div class="mbox"&gt;
    &lt;div class="mtitle"&gt;&lt;span&gt;⚠️ 上書き確認&lt;/span&gt;&lt;/div&gt;
    &lt;div id="moOverwriteMsg" style="font-size:13px;color:var(--tx);margin-bottom:16px;line-height:1.7"&gt;&lt;/div&gt;
    &lt;button class="btn bp" onclick="doSave()"&gt;✅ 上書きして保存&lt;/button&gt;
    &lt;button class="btn bg" onclick="closeMo('moOverwrite')"&gt;キャンセル&lt;/button&gt;
  &lt;/div&gt;
&lt;/div&gt;

&lt;!-- SETTINGS MODAL --&gt;
&lt;div class="mo" id="moSettings"&gt;
  &lt;div class="mbox"&gt;
    &lt;div class="mtitle"&gt;
      &lt;span&gt;⚙️ 設定&lt;/span&gt;
      &lt;button class="mclose" onclick="closeMo('moSettings')"&gt;✕&lt;/button&gt;
    &lt;/div&gt;
    &lt;div class="sett-section"&gt;
      &lt;div class="sett-label"&gt;テーマ&lt;/div&gt;
      &lt;div class="sett-row"&gt;
        &lt;button class="sett-pill" id="sp-hee" onclick="setAppTheme('hee')"&gt;かわいい&lt;/button&gt;
        &lt;button class="sett-pill" id="sp-shun" onclick="setAppTheme('shun')"&gt;かっこいい&lt;/button&gt;
      &lt;/div&gt;
    &lt;/div&gt;
    &lt;div class="sett-section" id="st-color"&gt;
      &lt;div class="sett-label"&gt;カラーモード &lt;span class="sett-note"&gt;かっこいいのみ&lt;/span&gt;&lt;/div&gt;
      &lt;div class="sett-row"&gt;
        &lt;button class="sett-pill" id="sp-light" onclick="setColorMode('light')"&gt;☀️ ライト&lt;/button&gt;
        &lt;button class="sett-pill" id="sp-dark" onclick="setColorMode('dark')"&gt;🌙 ダーク&lt;/button&gt;
        &lt;button class="sett-pill" id="sp-auto" onclick="setColorMode('auto')"&gt;📱 自動&lt;/button&gt;
      &lt;/div&gt;
    &lt;/div&gt;
    &lt;div class="sett-section"&gt;
      &lt;div class="sett-label"&gt;フォント&lt;/div&gt;
      &lt;div class="sett-row"&gt;
        &lt;button class="sett-pill" id="sp-maru" onclick="setAppFont('maru')"&gt;あ まるゴシック&lt;/button&gt;
        &lt;button class="sett-pill" id="sp-sys" onclick="setAppFont('system')"&gt;A システム&lt;/button&gt;
      &lt;/div&gt;
    &lt;/div&gt;
    &lt;div class="sett-section"&gt;
      &lt;div class="sett-label"&gt;Overland URL（位置共有）&lt;/div&gt;
      &lt;div style="font-size:11px;color:var(--txs);margin-bottom:6px"&gt;OverlandアプリのServer URLにコピーして設定してください&lt;/div&gt;
      &lt;div class="overland-url-row" onclick="copyOverlandUrl('shun')" title="タップでコピー"&gt;
        &lt;span style="font-size:13px"&gt;🌙 しゅん&lt;/span&gt;
        &lt;span class="overland-url-text" id="ovUrlShun"&gt;&lt;/span&gt;
        &lt;span style="font-size:11px;color:var(--txs)"&gt;コピー&lt;/span&gt;
      &lt;/div&gt;
      &lt;div class="overland-url-row" onclick="copyOverlandUrl('hee')" title="タップでコピー" style="margin-top:6px"&gt;
        &lt;span style="font-size:13px"&gt;🌸 ひーちゃん&lt;/span&gt;
        &lt;span class="overland-url-text" id="ovUrlHee"&gt;&lt;/span&gt;
        &lt;span style="font-size:11px;color:var(--txs)"&gt;コピー&lt;/span&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;

&lt;div class="toast" id="toast"&gt;&lt;/div&gt;

&lt;script&gt;
if(window.navigator.standalone){document.documentElement.classList.add('ios-pwa');}
// ========== GAS設定 ==========
// GASをデプロイした後、ここにURLを貼り付けてください
const GAS_URL = 'https://script.google.com/macros/s/AKfycbymJJag2hZIXnudvejecWckv2YTzexAMPE7dSgcf-OQuj1Jk_BpygOXL489KBwD11W-sA/exec';

// ========== 状態変数 ==========
let memoText = '', memoTimer = null;
let depLocs = [];
let girls = [];
let places = [];
let dCnt = 20, gCnt = 20, pCnt = 20;
let schedHistory = [];
let histCnt = 0;

let depMode = 'saved';
let girlRows = [];
let rowUid = 0;
let builtRuns = [];
let outShunTxt='', outBoyTxt='', outTab='shun';
let currentBuiltDate='', currentBuiltDateLabel='';
let batteryData={};
let locationData={};
let secretData={url:'',text:''};

// ========== GAS通信 ==========
async function gasGet() {
  const res = await fetch(GAS_URL + '?action=all&amp;_=' + Date.now());
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

function gasPost(data) {
  if (!GAS_URL || GAS_URL.startsWith('YOUR')) return;
  const d = JSON.parse(JSON.stringify(data));
  if (d.payload) { delete d.payload.shunTxt; delete d.payload.boyTxt; }
  const action = d.action; delete d.action;
  fetch(GAS_URL + '?action=' + action + '&amp;data=' + encodeURIComponent(JSON.stringify(d)), {mode:'no-cors'})
    .catch(function(e) { console.warn('GAS save failed:', e); });
}

function saveCounters() {
  gasPost({action:'saveCounters', payload:{dCnt:dCnt,gCnt:gCnt,pCnt:pCnt,histCnt:histCnt}});
}
function onMemoInput(){
  clearTimeout(memoTimer);
  memoTimer = setTimeout(function(){
    memoText = document.getElementById('memoInp').value;
    gasPost({action:'saveMemo', memo: memoText});
  }, 1500);
}

// ========== 起動処理（非同期） ==========
(async function(){
  const overlay = document.getElementById('loadingOverlay');

  if (!GAS_URL || GAS_URL.startsWith('YOUR')) {
    overlay.querySelector('.loading-text').textContent = '⚠️ GAS URLが未設定です';
    overlay.querySelector('.loading-sub').textContent = 'docs/index.html の GAS_URL を設定してください';
    overlay.querySelector('.loading-spinner').style.display = 'none';
    setTimeout(function(){ overlay.style.display='none'; initApp(); }, 2000);
    return;
  }

  try {
    const res = await gasGet();
    if (res.ok) {
      girls        = res.data.girls        || [];
      places       = res.data.places       || [];
      depLocs      = res.data.depLocs      || [];
      schedHistory = res.data.schedHistory || [];
      schedHistory.forEach(function(e){ rebuildHistTexts(e); });
      const c      = res.data.counters     || {};
      dCnt    = c.dCnt    || 20;
      gCnt    = c.gCnt    || 20;
      pCnt    = c.pCnt    || 20;
      histCnt = c.histCnt || 0;
      memoText = res.data.memo || '';
      batteryData = res.data.battery || {};
      locationData = res.data.location || {};
      secretData = res.data.secret || {url:'',text:''};
    }
  } catch(e) {
    console.error('GAS load failed:', e);
    showToast('⚠️ データの読み込みに失敗しました');
  }

  overlay.style.display = 'none';
  initApp();
  startLocationTracking();
  renderHistPage();
  document.getElementById('memoInp').value = memoText;
  var seenMemo = localStorage.getItem('memoSeen') || '';
  if (memoText &amp;&amp; memoText !== seenMemo) openMemo(false);
  else closeMemoSheet(false);
  localStorage.setItem('memoSeen', memoText);

  setInterval(async function(){
    try {
      const res = await gasGet();
      if (!res.ok) return;
      schedHistory = res.data.schedHistory || schedHistory;
      schedHistory.forEach(function(e){ rebuildHistTexts(e); });
      histCnt = (res.data.counters || {}).histCnt || histCnt;
      if (document.getElementById('pg-hist').classList.contains('active')) renderHistPage();
      const newMemo = res.data.memo || '';
      if (newMemo !== memoText) {
        memoText = newMemo;
        const inp = document.getElementById('memoInp');
        if (document.activeElement !== inp) inp.value = newMemo;
      }
    } catch(e) {}
  }, 10000);
})();

function setPgHeight(){
  if(document.body.classList.contains('map-active')) return;
  document.querySelectorAll('.pg:not(#pg-map)').forEach(function(el){
    el.style.height='';
  });
}
function slideTo(idx){
  var s=document.getElementById('histSlider');
  s.scrollTo({left:idx*s.offsetWidth,behavior:'smooth'});
}
var _memoIsOpen=false,_memoStartY=0,_memoStartTransY=0;
function _memoClosedY(){var b=document.querySelector('.memo-box');var nav=document.querySelector('.bnav');return b.offsetHeight-(nav?nav.offsetHeight:55)-20;}
function openMemo(animate){
  _memoIsOpen=true;
  var b=document.querySelector('.memo-box');
  b.style.transition=animate?'transform 0.4s cubic-bezier(0.32,0.72,0,1)':'none';
  b.style.transform='translateY(0)';
}
function closeMemoSheet(animate){
  _memoIsOpen=false;
  var b=document.querySelector('.memo-box');
  b.style.transition=animate?'transform 0.4s cubic-bezier(0.32,0.72,0,1)':'none';
  b.style.transform='translateY('+_memoClosedY()+'px)';
  document.getElementById('memoInp').blur();
}
function initApp() {
  setPgHeight();
  window.addEventListener('resize',setPgHeight);
  (function schedNowTimer(){function tick(){if(!_debugTime&amp;&amp;document.getElementById('pg-hist').classList.contains('active'))renderHistPage();setTimeout(tick,60000-Date.now()%60000);}setTimeout(tick,60000-Date.now()%60000);})();
  var sl=document.getElementById('histSlider');
  sl.addEventListener('scroll',function(){
    var m=this.scrollLeft&gt;this.offsetWidth*0.5;
    document.getElementById('dot-today').classList.toggle('active',!m);
    document.getElementById('dot-months').classList.toggle('active',m);
  });
  var handle=document.querySelector('.memo-handle');
  handle.addEventListener('touchstart',function(e){
    _memoStartY=e.touches[0].clientY;
    _memoStartTransY=_memoIsOpen?0:_memoClosedY();
    document.querySelector('.memo-box').style.transition='none';
  },{passive:true});
  handle.addEventListener('touchmove',function(e){
    var dy=e.touches[0].clientY-_memoStartY;
    var raw=_memoStartTransY+dy;
    var cl=_memoClosedY();
    var y;
    if(raw&lt;0)y=Math.max(raw*0.25,-60);
    else if(raw&gt;cl)y=cl+(raw-cl)*0.25;
    else y=raw;
    document.querySelector('.memo-box').style.transform='translateY('+y+'px)';
  },{passive:true});
  handle.addEventListener('touchend',function(e){
    var dy=e.changedTouches[0].clientY-_memoStartY;
    if(_memoIsOpen&amp;&amp;dy&gt;30)closeMemoSheet(true);
    else if(!_memoIsOpen&amp;&amp;dy&lt;-30)openMemo(true);
    else if(_memoIsOpen)openMemo(true);
    else closeMemoSheet(true);
  },{passive:true});
  document.getElementById('memoInp').addEventListener('focus',function(){
    if(!_memoIsOpen)this.blur();
  });
  handle.addEventListener('click',function(){_memoIsOpen?closeMemoSheet(true):openMemo(true);});
  const t = new Date();
  document.getElementById('dateInp').value = fmtDV(t);
  addGirlRow();
  refreshDepSel();
  renderMasters();
  updateAutoDepDisplay();
  switchPg('hist');
  document.querySelector('.fab').classList.add('init');
  let _batPrevKey='';
  async function _pollBattery(){
    if(document.hidden){setTimeout(_pollBattery,2000);return;}
    try{
      const res=await fetch(GAS_URL+'?action=battery&amp;_='+Date.now());
      const json=await res.json();
      if(json.ok){
        const b=json.data.battery||{};
        const key=JSON.stringify(b);
        if(key!==_batPrevKey){
          _batPrevKey=key;
          batteryData=b;
          const wrap=document.getElementById('batteryWrap');
          if(wrap)wrap.outerHTML=renderBatteryCard();
        }
      }
    }catch(e){}
    setTimeout(_pollBattery,1000);
  }
  _pollBattery();
}

// ========== ユーティリティ ==========
function fmtDV(d){return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`}
function p2(n){return String(n).padStart(2,'0')}
function normDV(v){if(!v)return'';const m=String(v).replace(/\//g,'-').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);return m?m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0'):''}
function fmtDL(v){if(!v)return'';const d=new Date(normDV(v)+'T00:00:00');if(isNaN(d.getTime()))return'';return `${d.getMonth()+1}/${d.getDate()}(${'日月火水木金土'[d.getDay()]})`}
function fmtDLFull(v){if(!v)return'';const d=new Date(normDV(v)+'T00:00:00');if(isNaN(d.getTime()))return'';return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日(${'日月火水木金土'[d.getDay()]})`}
function fmtMonth(v){if(!v)return'';const d=new Date(normDV(v)+'T00:00:00');if(isNaN(d.getTime()))return'';return `${d.getFullYear()}年${d.getMonth()+1}月`}
function addMin(hhmm,min){const[h,m]=hhmm.split(':').map(Number);const t=h*60+m+Number(min);return `${p2(Math.floor(t/60)%24)}:${p2(t%60)}`}
function subMin(hhmm,min){const[h,m]=hhmm.split(':').map(Number);let t=h*60+m-Number(min);if(t&lt;0)t+=1440;return `${p2(Math.floor(t/60)%24)}:${p2(t%60)}`}
function ceil5(min){return Math.ceil(Number(min)/5)*5;}
function roundTime5(hhmm){const[h,m]=hhmm.split(':').map(Number);const t=Math.floor((h*60+m)/5)*5;return `${p2(Math.floor(t/60)%24)}:${p2(t%60)}`}
function setToday(){document.getElementById('dateInp').value=fmtDV(new Date())}
function setTomorrow(){const t=new Date();t.setDate(t.getDate()+1);document.getElementById('dateInp').value=fmtDV(t)}
function todayVal(){return fmtDV(new Date())}

// ========== ページ切り替え ==========
function updateThemeColor(){
  var m=document.querySelector('meta[name="theme-color"]');
  if(!m) return;
  var b=document.body.classList;
  if(b.contains('map-active')) m.content = b.contains('dark-active') ? '#1a2a40' : '#e8e4e0';
  else if(b.contains('font-shun')) m.content = b.contains('dark-active') ? '#111111' : '#d8eef8';
  else m.content='#CE95B0';
}
function switchPg(p){
  document.querySelectorAll('.pg').forEach(e=&gt;e.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(e=&gt;e.classList.remove('active'));
  document.getElementById('pg-'+p).classList.add('active');
  document.getElementById('nb-'+p).classList.add('active');
  document.body.classList.toggle('map-active', p==='map');
  updateThemeColor();
  if(p==='hist') renderHistPage();
  if(p==='map') initMap(); else setPgHeight();
  if(p==='secret') renderSecretPage();
}

function openSchedModal(){
  document.getElementById('moSched').classList.add('open');
}
function closeSchedModal(){
  document.getElementById('moSched').classList.remove('open');
}

// ========== 出発地モード ==========
function setDepMode(m){
  depMode=m;
  document.getElementById('dt-saved').classList.toggle('sel',m==='saved');
  document.getElementById('dt-manual').classList.toggle('sel',m==='manual');
  document.getElementById('dep-saved-area').style.display=m==='saved'?'block':'none';
  document.getElementById('dep-manual-area').style.display=m==='manual'?'block':'none';
  document.getElementById('autoDepDisplay').style.display=m==='saved'?'block':'none';
  updateAutoDepDisplay();
}

function refreshDepSel(){
  const sel=document.getElementById('depLocSel');
  sel.innerHTML='&lt;option value=""&gt;-- 選択 --&lt;/option&gt;'+
    depLocs.map(d=&gt;`&lt;option value="${d.id}"&gt;${d.name}${d.addr?' ('+d.addr+')':''}&lt;/option&gt;`).join('');
}
function onDepChange(){ updateAutoDepDisplay(); }

function getDepName(){
  if(depMode==='manual') return document.getElementById('depManualName').value||'出発地';
  const id=document.getElementById('depLocSel').value;
  const d=depLocs.find(x=&gt;x.id==id);
  return d?d.name:'出発地';
}
function getDepAddr(){
  if(depMode==='manual'){
    const el=document.getElementById('depManualAddr');
    return el?el.value.trim():'';
  }
  const id=document.getElementById('depLocSel').value;
  const d=depLocs.find(x=&gt;x.id==id);
  return d?String(d.addr||'').trim():'';
}

function calcFirstRunDepartTime(){
  const groups=getGroups();
  const sortedTimes=Object.keys(groups).filter(k=&gt;k!=='_notime').sort();
  if(!sortedTimes.length) return null;
  const firstGroup=groups[sortedTimes[0]];
  const segs=buildSegments(firstGroup, true, getDepName());
  const refRow=firstGroup[0];
  for(const seg of segs){if(!refRow.mins[seg.key]) return null;}
  const shiftTime=sortedTimes[0];
  const storeArrival=subMin(shiftTime,10);
  let cursor=storeArrival;
  const revSegs=[...segs].reverse();
  for(const seg of revSegs){cursor=subMin(cursor, ceil5(refRow.mins[seg.key]));}
  return roundTime5(cursor);
}

function updateAutoDepDisplay(){
  if(depMode!=='saved') return;
  const t=calcFirstRunDepartTime();
  const el=document.getElementById('autoDepTime');
  if(t){el.textContent=t;el.style.color='var(--tx)';}
  else{el.textContent='--:--';el.style.color='#9ca3af';}
}

// ========== 女の子入力 ==========
function stepShiftTime(uid, delta){
  const r=girlRows.find(x=&gt;x.uid===uid);
  if(!r) return;
  let [h,m]=r.shiftTime ? r.shiftTime.split(':').map(Number) : [19,0];
  let total=h*60+m;
  total+=delta*30;
  total=((total%1440)+1440)%1440;
  total=Math.round(total/30)*30;
  r.shiftTime=`${p2(Math.floor(total/60))}:${p2(total%60)}`;
  const el=document.getElementById('stepper_'+uid);
  if(el) el.textContent=r.shiftTime;
  renderGroupMinInputs();
  updateAutoDepDisplay();
}

function addGirlRow(){
  const uid=++rowUid;
  girlRows.push({uid, girlId:'', customName:'', shiftTime:'19:00', mins:{}});
  renderGirlInputs();
}
function removeGirlRow(uid){
  girlRows=girlRows.filter(r=&gt;r.uid!==uid);
  renderGirlInputs();
  updateAutoDepDisplay();
}
function onGirlSel(uid,val){
  const r=girlRows.find(x=&gt;x.uid===uid);
  if(r){r.girlId=val;r.customName='';}
  renderGirlInputs();
}
function onCustomName(uid,val){const r=girlRows.find(x=&gt;x.uid===uid);if(r)r.customName=val;}
function getGirlName(row){
  if(row.girlId==='_c') return row.customName||'???';
  const g=girls.find(x=&gt;x.id==row.girlId);
  return g?g.name:'???';
}
function getStoreName(){return places.length?places[0].name:'Venus'}

function getGroups(){
  const map={};
  girlRows.forEach(r=&gt;{
    const k=r.shiftTime||'_notime';
    if(!map[k])map[k]=[];
    map[k].push(r);
  });
  return map;
}

function renderGirlInputs(){
  const c=document.getElementById('girlInputs');
  c.innerHTML='';
  girlRows.forEach((row,i)=&gt;{
    const d=document.createElement('div');
    d.className='gi-card';
    const gopts=girls.map(g=&gt;`&lt;option value="${g.id}" ${row.girlId==g.id?'selected':''}&gt;${g.name}&lt;/option&gt;`).join('');
    const addrHtml=(row.girlId&amp;&amp;row.girlId!=='_c')?(()=&gt;{const g=girls.find(x=&gt;x.id==row.girlId);return g?`&lt;div style="font-size:11px;color:#6b7280;background:var(--pkp);border-radius:8px;padding:5px 10px;margin-bottom:8px"&gt;📍 ${g.nick}&lt;/div&gt;`:''})():'';
    d.innerHTML=`
      &lt;div class="gi-head"&gt;
        &lt;span class="gi-badge"&gt;👩 ${i+1}人目&lt;/span&gt;
        ${girlRows.length&gt;1?`&lt;button class="rm-btn" onclick="removeGirlRow(${row.uid})"&gt;✕&lt;/button&gt;`:''}
      &lt;/div&gt;
      &lt;label&gt;女の子&lt;/label&gt;
      &lt;select onchange="onGirlSel(${row.uid},this.value)" style="margin-bottom:8px"&gt;
        &lt;option value=""&gt;-- 選択 --&lt;/option&gt;
        ${gopts}
        &lt;option value="_c" ${row.girlId==='_c'?'selected':''}&gt;✏️ 直接入力&lt;/option&gt;
      &lt;/select&gt;
      ${row.girlId==='_c'?`&lt;input type="text" placeholder="名前" value="${row.customName}" oninput="onCustomName(${row.uid},this.value)" style="margin-bottom:8px"&gt;`:addrHtml}
      &lt;label&gt;出勤時間&lt;/label&gt;
      &lt;div class="shift-stepper"&gt;
        &lt;button class="shift-stepper-btn" onclick="stepShiftTime(${row.uid},-1)"&gt;－&lt;/button&gt;
        &lt;div class="shift-stepper-time" id="stepper_${row.uid}"&gt;${row.shiftTime||'19:00'}&lt;/div&gt;
        &lt;button class="shift-stepper-btn" onclick="stepShiftTime(${row.uid},+1)"&gt;＋&lt;/button&gt;
      &lt;/div&gt;
      &lt;div class="shift-stepper-hint"&gt;30分単位で調整&lt;/div&gt;
      ${i===girlRows.length-1?`&lt;button class="btn bo" style="margin-top:6px;margin-bottom:0" onclick="addGirlRow()"&gt;＋ 女の子を追加&lt;/button&gt;`:''}
    `;
    c.appendChild(d);
  });
  renderGroupMinInputs();
}

function renderGroupMinInputs(){
  const existing=document.getElementById('groupMinSection');
  if(existing) existing.remove();
  const c=document.getElementById('girlInputs');
  const groups=getGroups();
  const sortedTimes=Object.keys(groups).filter(k=&gt;k!=='_notime').sort();
  if(!sortedTimes.length) return;
  const section=document.createElement('div');
  section.id='groupMinSection';
  const header=document.createElement('div');
  header.style.cssText='font-size:16px;font-weight:700;color:var(--teal);margin:14px 0 8px;';
  header.textContent='🗺 区間ごとの移動時間';
  section.appendChild(header);
  const depName=getDepName();
  const depAddr=getDepAddr();
  const storeAddr=String((places[0]||{}).addr||'').trim();
  const pendingCalcs=[];
  sortedTimes.forEach((shiftTime,gi)=&gt;{
    const group=groups[shiftTime];
    const isFirst=gi===0;
    const startLabel=isFirst?depName:getStoreName();
    const startAddr=isFirst?depAddr:storeAddr;
    const segs=buildSegments(group,isFirst,startLabel,startAddr);
    const refRow=group[0];
    const wrap=document.createElement('div');
    wrap.style.cssText='background:var(--pkp);border-radius:14px;padding:12px 14px;margin-bottom:10px';
    let html=`&lt;div style="font-size:14px;font-weight:700;color:var(--teal);margin-bottom:10px"&gt;🚗 ${shiftTime} 出勤グループ（${group.length}人）&lt;/div&gt;`;
    segs.forEach(seg=&gt;{
      const stored=refRow.mins[seg.key]||'';
      html+=`
        &lt;div style="font-size:13px;color:#6b7280;margin-bottom:3px"&gt;📍 ${seg.from} → ${seg.to}&lt;/div&gt;
        &lt;div class="min-row"&gt;
          &lt;input type="number" min="1" max="90" placeholder="分" value="${stored}"
            id="seginp_${refRow.uid}_${seg.key}"
            oninput="onSegMin(${refRow.uid},'${seg.key}',this.value)"&gt;
          &lt;span&gt;分&lt;/span&gt;
          &lt;button class="bmap" id="bmapbtn_${refRow.uid}_${seg.key}"
            data-from-addr="${encodeURIComponent(seg.fromAddr)}"
            data-to-addr="${encodeURIComponent(seg.toAddr)}"
            data-from-name="${encodeURIComponent(seg.from)}"
            data-to-name="${encodeURIComponent(seg.to)}"
            onclick="realMapCalc(${refRow.uid},'${seg.key}',this)"&gt;🗺 自動&lt;/button&gt;
        &lt;/div&gt;
      `;
    });
    wrap.innerHTML=html;
    section.appendChild(wrap);
    pendingCalcs.push({uid:refRow.uid, segs});
  });
  c.appendChild(section);
  pendingCalcs.forEach(function(p){ autoCalcEmptySegs(p.uid, p.segs); });
}

function buildSegments(group, isFirstRun, startLabel, startAddr){
  const segs=[];
  const store=getStoreName();
  const storeAddr=String((places[0]||{}).addr||'').trim();
  const ga=function(row){const g=girls.find(x=&gt;x.id==row.girlId);return g?String(g.addr||'').trim():'';};
  segs.push({key:'start_to_0', from:startLabel, to:getGirlName(group[0]),
    fromAddr:startAddr||'', toAddr:ga(group[0])});
  for(let i=0;i&lt;group.length-1;i++){
    segs.push({key:`${i}_to_${i+1}`, from:getGirlName(group[i]), to:getGirlName(group[i+1]),
      fromAddr:ga(group[i]), toAddr:ga(group[i+1])});
  }
  segs.push({key:`${group.length-1}_to_store`, from:getGirlName(group[group.length-1]), to:store,
    fromAddr:ga(group[group.length-1]), toAddr:storeAddr});
  return segs;
}

function onSegMin(refUid, key, val){
  const r=girlRows.find(x=&gt;x.uid==refUid);
  if(r) r.mins[key]=val;
  updateAutoDepDisplay();
}

async function realMapCalc(refUid, key, btn, silent){
  if(!btn) btn=document.getElementById(`bmapbtn_${refUid}_${key}`);
  if(btn){btn.classList.add('calculating');btn.textContent='⏳';}
  const fromAddr=btn?decodeURIComponent(btn.dataset.fromAddr||''):'';
  const toAddr=btn?decodeURIComponent(btn.dataset.toAddr||''):'';
  const fromName=btn?decodeURIComponent(btn.dataset.fromName||''):'?';
  const toName=btn?decodeURIComponent(btn.dataset.toName||''):'?';
  try{
    if(!fromAddr||!toAddr){
      if(!silent)showToast(`⚠️ 住所未登録\n${fromName}→${toName}`);
      return;
    }
    const [fp,tp]=await Promise.all([_geocode(fromAddr),_geocode(toAddr)]);
    if(!fp||!tp){
      if(!silent)showToast(`⚠️ 座標取得失敗\n${fromName}→${toName}`);
      return;
    }
    const res=await fetch(`https://router.project-osrm.org/route/v1/driving/${fp.lng},${fp.lat};${tp.lng},${tp.lat}?overview=false`);
    const data=await res.json();
    if(data.code==='Ok'&amp;&amp;data.routes.length){
      const min=ceil5(Math.ceil(data.routes[0].duration/60));
      onSegMin(refUid,key,String(min));
      const inp=document.getElementById(`seginp_${refUid}_${key}`);
      if(inp)inp.value=min;
      if(!silent)showToast(`🗺 ${fromName}→${toName}: ${min}分`);
    }else{
      if(!silent)showToast(`⚠️ ルート取得失敗\n${fromName}→${toName}`);
    }
  }catch(e){
    if(!silent)showToast(`⚠️ 計算エラー\n${fromName}→${toName}`);
  }finally{
    if(btn){btn.classList.remove('calculating');btn.textContent='🗺 自動';}
  }
}

function autoCalcEmptySegs(refUid, segs){
  segs.forEach(function(seg){
    const r=girlRows.find(x=&gt;x.uid==refUid);
    if(r&amp;&amp;!r.mins[seg.key]){
      const btn=document.getElementById(`bmapbtn_${refUid}_${seg.key}`);
      if(btn) realMapCalc(refUid,seg.key,btn,true);
    }
  });
}

// ========== スケジュール生成 ==========
function buildSchedule(){
  const groups=getGroups();
  const sortedTimes=Object.keys(groups).filter(k=&gt;k!=='_notime').sort();
  if(!sortedTimes.length){showToast('出勤時間を入れてね！');return;}
  for(const t of sortedTimes){
    const g=groups[t];
    if(g.some(r=&gt;!r.girlId&amp;&amp;!r.customName)){showToast('名前が未入力の子がいるよ！');return;}
    const segs=buildSegments(g, sortedTimes.indexOf(t)===0, getDepName());
    const refRow=g[0];
    for(const seg of segs){
      if(!refRow.mins[seg.key]){showToast(`移動時間が未入力:\n${seg.from}→${seg.to}`);return;}
    }
  }

  const dateVal=document.getElementById('dateInp').value;
  const dateLabel=fmtDL(dateVal);
  const store=getStoreName();
  const depName=getDepName();
  builtRuns=[];
  currentBuiltDate=dateVal;
  currentBuiltDateLabel=dateLabel;

  sortedTimes.forEach((shiftTime,gi)=&gt;{
    const group=groups[shiftTime];
    const isFirst=gi===0;
    const startLabel=isFirst?depName:store;
    const segs=buildSegments(group,isFirst,startLabel);
    const refRow=group[0];
    const storeArrival=subMin(shiftTime,10);
    let times=new Array(group.length+2);
    times[group.length+1]=storeArrival;
    for(let i=group.length-1;i&gt;=0;i--){
      const key=i===group.length-1?`${i}_to_store`:`${i}_to_${i+1}`;
      const m=ceil5(refRow.mins[key]);
      times[i+1]=roundTime5(subMin(times[i+2], m));
    }
    times[0]=roundTime5(subMin(times[1], ceil5(refRow.mins['start_to_0'])));
    let departTime;
    if(isFirst &amp;&amp; depMode==='manual'){
      departTime=document.getElementById('depManualTime').value||times[0];
    } else {
      departTime=times[0];
    }
    const departLabel=`${departTime}${startLabel}出発`;
    const stops=[];
    group.forEach((row,i)=&gt;{
      const minKey=i===0?'start_to_0':`${i-1}_to_${i}`;
      stops.push({time:times[i+1], name:getGirlName(row), type:'pick', min:refRow.mins[minKey]});
    });
    stops.push({time:storeArrival, name:store, type:'drop', min:refRow.mins[`${group.length-1}_to_store`]});
    builtRuns.push({departTime, departLabel, stops});
  });

  renderResult(dateLabel);
  buildOutputText(dateLabel);
  document.getElementById('resultSection').style.display='block';
  document.getElementById('resultSection').scrollIntoView({behavior:'smooth',block:'start'});
}

function renderResult(dateLabel){
  const c=document.getElementById('resultBlocks');
  c.innerHTML=`&lt;div style="font-size:12px;font-weight:700;color:var(--txs);margin-bottom:10px"&gt;${dateLabel}&lt;/div&gt;`;
  builtRuns.forEach(run=&gt;{
    const d=document.createElement('div');
    d.className='run-block';
    let html=`&lt;div class="run-label"&gt;🚗 ${run.departLabel}&lt;/div&gt;`;
    run.stops.forEach(s=&gt;{
      const badge=s.type==='pick'?'&lt;span class="tl-badge badge-pick"&gt;迎え&lt;/span&gt;':'&lt;span class="tl-badge badge-drop"&gt;店着&lt;/span&gt;';
      const dot=s.type==='pick'?'dot-pick':'dot-drop';
      html+=`&lt;div class="tl-item"&gt;
        &lt;div class="tl-dot ${dot}"&gt;&lt;/div&gt;
        &lt;span class="tl-time"&gt;${s.time}&lt;/span&gt;
        &lt;span class="tl-name"&gt;${s.name}&lt;/span&gt;
        ${badge}
        &lt;span class="tl-min"&gt;${s.min}分&lt;/span&gt;
      &lt;/div&gt;`;
    });
    d.innerHTML=html;
    c.appendChild(d);
  });
}

function buildOutputText(dateLabel){
  let shun=[dateLabel,''], boy=[dateLabel,''];
  builtRuns.forEach((run,ri)=&gt;{
    shun.push(run.departLabel);
    run.stops.forEach(s=&gt;{
      shun.push(`${s.min}分`);
      shun.push(`${s.time}${s.name}${s.type==='pick'?'迎え':'着'}`);
      boy.push(`${s.time}${s.name}${s.type==='pick'?'迎え':'着'}`);
    });
    if(ri&lt;builtRuns.length-1){shun.push('');boy.push('');}
  });
  outShunTxt=shun.join('\n'); outBoyTxt=boy.join('\n');
  document.getElementById('outShun').textContent=outShunTxt;
  document.getElementById('outBoy').textContent=outBoyTxt;
  switchOutTab(outTab);
}

function switchOutTab(t){
  outTab=t;
  document.getElementById('tabS').className='otab'+(t==='shun'?' active':'');
  document.getElementById('tabB').className='otab'+(t==='boy'?' active':'');
  document.getElementById('outShun').style.display=t==='shun'?'block':'none';
  document.getElementById('outBoy').style.display=t==='boy'?'block':'none';
  document.getElementById('cpyS').style.display=t==='shun'?'flex':'none';
  document.getElementById('cpyB').style.display=t==='boy'?'flex':'none';
}
function copyOut(who){
  const txt=who==='shun'?outShunTxt:outBoyTxt;
  if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=&gt;showToast('コピーしました！📋'));
  else{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('コピーしました！📋');}
}

// ========== スケジュール保存 ==========
function saveSchedule(){
  if(!builtRuns.length){showToast('先にスケジュールを生成してね！');return;}
  const existing=schedHistory.findIndex(x=&gt;x.dateVal===currentBuiltDate);
  if(existing&gt;=0){
    document.getElementById('moOverwriteMsg').textContent=
      `${currentBuiltDateLabel} のスケジュールはすでに保存されています。上書きしますか？`;
    document.getElementById('moOverwrite').classList.add('open');
    return;
  }
  doSave();
}

function doSave(){
  closeMo('moOverwrite');
  const existing=schedHistory.findIndex(x=&gt;x.dateVal===currentBuiltDate);
  const savedShunTxt=outShunTxt, savedBoyTxt=outBoyTxt;
  const savedDateLabel=currentBuiltDateLabel;
  const entry={
    id: existing&gt;=0 ? schedHistory[existing].id : ++histCnt,
    dateVal: currentBuiltDate,
    dateLabel: savedDateLabel,
    runs: JSON.parse(JSON.stringify(builtRuns)),
    shunTxt: savedShunTxt,
    boyTxt: savedBoyTxt,
    savedAt: new Date().toISOString()
  };
  if(existing&gt;=0) schedHistory[existing]=entry;
  else schedHistory.unshift(entry);

  gasPost({action:'saveSchedule', payload:entry});
  if(existing&lt;0) saveCounters();

  resetSchedForm();
  closeSchedModal();
  showSaveSuccessBar(savedDateLabel, savedShunTxt, savedBoyTxt);
}

function resetSchedForm(){
  document.getElementById('dateInp').value=fmtDV(new Date());
  girlRows=[];rowUid=0;
  addGirlRow();
  document.getElementById('depLocSel').value='';
  document.getElementById('depManualName').value='';
  document.getElementById('resultSection').style.display='none';
  builtRuns=[];outShunTxt='';outBoyTxt='';
  updateAutoDepDisplay();
}

let _savedShunTxt='', _savedBoyTxt='';

function showSaveSuccessBar(dateLabel, shunTxt, boyTxt){
  _savedShunTxt=shunTxt;
  _savedBoyTxt=boyTxt;
  switchPg('hist');
  showToast('💾 保存完了！'+dateLabel);
}

function copyText(txt){
  if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=&gt;showToast('コピーしました！📋'));
  else{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('コピーしました！📋');}
}

// ========== 履歴ページ ==========
let _debugTime=null;
function nowHHMM(){if(_debugTime)return _debugTime;const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function setDebugTime(v){
  _debugTime=v||null;
  const entry=schedHistory.find(x=&gt;x.dateVal===todayVal());
  if(!entry)return;
  const tmp=document.createElement('div');
  tmp.innerHTML=buildRunsHtml(entry,true);
  const newRuns=[...tmp.querySelectorAll('.hist-detail-run')];
  const oldRuns=[...document.querySelectorAll('#histPageToday .hist-detail-run')];
  oldRuns.forEach((r,i)=&gt;{if(newRuns[i])r.replaceWith(newRuns[i]);});
}
function buildRunsHtml(e,showNow){
  const now=showNow?nowHHMM():null;
  let h='';
  e.runs.forEach((run,ri)=&gt;{
    h+=`&lt;div class="hist-detail-run"&gt;&lt;div class="hist-detail-run-lbl"&gt;🚗 ${run.departLabel}&lt;/div&gt;`;
    const allPast=now?run.stops.every(s=&gt;s.time&lt;=now):false;
    let nowInserted=false;
    run.stops.forEach((s,si)=&gt;{
      const isPast=now?s.time&lt;=now:false;
      const dot=s.type==='pick'?'dot-pick':'dot-drop';
      const badge=s.type==='pick'?'&lt;span class="edit-time-badge badge-pick"&gt;迎え&lt;/span&gt;':'&lt;span class="edit-time-badge badge-drop"&gt;店着&lt;/span&gt;';
      const minB=s.min?`&lt;span style="font-size:10px;color:var(--txs);background:var(--pul);padding:2px 7px;border-radius:20px;flex-shrink:0"&gt;${s.min}分&lt;/span&gt;`:'';
      if(now&amp;&amp;!isPast&amp;&amp;!nowInserted){h+=`&lt;div class="tl-now"&gt;&lt;div class="tl-now-dot"&gt;&lt;svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="transform:rotate(135deg)"&gt;&lt;polygon points="3 11 22 2 13 21 11 13 3 11"/&gt;&lt;/svg&gt;&lt;/div&gt;&lt;span class="tl-now-lbl"&gt;いまここ&lt;/span&gt;&lt;/div&gt;`;nowInserted=true;}
      h+=`&lt;div class="edit-time-row${isPast?' past':''}"&gt;&lt;div class="tl-dot ${dot}"&gt;&lt;/div&gt;&lt;input class="edit-time-inp" type="time" value="${s.time}" onchange="updateHistStop(${e.id},${ri},${si},this.value)"&gt;&lt;span class="edit-time-name"&gt;${s.name}&lt;/span&gt;${badge}${minB}&lt;/div&gt;`;
    });
    if(allPast)h+=`&lt;div class="today-done"&gt;✓ 完了&lt;/div&gt;`;
    h+=`&lt;/div&gt;`;
  });
  return h;
}
// ========== シークレット ==========
let _secretUnlocked=false;
function isSecretAutoUnlock(){
  if(_debugTime)return true;
  return Date.now()&gt;=new Date('2026-06-10T00:00:00+09:00').getTime();
}
function renderSecretPage(){
  const pg=document.getElementById('pg-secret');
  const auto=isSecretAutoUnlock();
  const url=secretData.url||'';
  const text=secretData.text||'';
  if(auto){
    pg.innerHTML=url&amp;&amp;text
      ?`&lt;div class="secret-link-wrap"&gt;&lt;a href="${url}" class="secret-link" target="_blank"&gt;${text}&lt;/a&gt;&lt;/div&gt;`
      :`&lt;div style="text-align:center;padding:60px 14px;color:var(--txs);opacity:.4;font-size:14px"&gt;登録なし&lt;/div&gt;`;
    return;
  }
  const adminHtml=`&lt;div class="secret-content"&gt;
    &lt;label&gt;URL&lt;/label&gt;&lt;input type="url" id="secretUrlInp" value="${url}" placeholder="https://..." style="width:100%;box-sizing:border-box"&gt;
    &lt;label&gt;テキスト&lt;/label&gt;&lt;input type="text" id="secretTextInp" value="${text}" placeholder="表示するテキスト" style="width:100%;box-sizing:border-box"&gt;
    &lt;div style="display:flex;gap:8px;margin-top:14px"&gt;
      &lt;button class="btn bp sm" style="flex:1" onclick="saveSecret()"&gt;保存&lt;/button&gt;
      ${url?`&lt;button class="btn bd sm" onclick="deleteSecret()"&gt;削除&lt;/button&gt;`:''}
    &lt;/div&gt;
  &lt;/div&gt;`;
  if(_secretUnlocked){
    pg.innerHTML=`&lt;div class="secret-wrap"&gt;${adminHtml}&lt;/div&gt;`;
  } else {
    pg.innerHTML=`&lt;div class="secret-wrap"&gt;${adminHtml}
      &lt;div class="secret-overlay"&gt;
        &lt;span class="secret-pw-lbl"&gt;🔐 パスワードを入力&lt;/span&gt;
        &lt;input class="secret-pw-inp" type="password" id="secretPwInp" placeholder="••••••" onkeydown="if(event.key==='Enter')unlockSecret()"&gt;
        &lt;button class="secret-unlock-btn" onclick="unlockSecret()"&gt;解除&lt;/button&gt;
      &lt;/div&gt;
    &lt;/div&gt;`;
  }
}
function unlockSecret(){
  const inp=document.getElementById('secretPwInp');
  if(!inp)return;
  if(inp.value==='2101103'){_secretUnlocked=true;renderSecretPage();}
  else{inp.value='';inp.placeholder='違います…もう一度';inp.style.borderColor='#e74c3c';}
}
function saveSecret(){
  const u=document.getElementById('secretUrlInp').value.trim();
  const t=document.getElementById('secretTextInp').value.trim();
  secretData={url:u,text:t};
  gasPost({action:'saveSecret',payload:{url:u,text:t}});
  showToast('保存しました');
  renderSecretPage();
}
function deleteSecret(){
  secretData={url:'',text:''};
  gasPost({action:'saveSecret',payload:{url:'',text:''}});
  showToast('削除しました');
  renderSecretPage();
}

function renderBatteryCard(){
  const users=[{key:'hee',label:'ひーちゃん'},{key:'shun',label:'しゅん'}];
  const cols=users.map(u=&gt;{
    const d=batteryData[u.key];
    if(!d)return `&lt;div class="battery-user"&gt;&lt;div class="battery-name"&gt;${u.label}&lt;/div&gt;&lt;div class="battery-charge" style="font-size:11px;color:#ccc"&gt;データなし&lt;/div&gt;&lt;/div&gt;`;
    const lv=Math.min(100,Math.max(0,Number(d.level)||0));
    const isCharging=d.charging===true||['true','1','yes','はい'].includes(String(d.charging||'').toLowerCase());
    const color=isCharging?'#30d158':lv&lt;10?'#ff3b30':lv&lt;20?'#ffcc00':'#ffffff';
    const ago=(function(){const s=Math.floor((Date.now()-new Date(d.at).getTime())/1000);return s&lt;60?'今さっき':s&lt;3600?Math.floor(s/60)+'分前':Math.floor(s/3600)+'時間前';})();
    return `&lt;div class="battery-user"&gt;
      &lt;div&gt;
        &lt;div class="battery-name"&gt;${u.label}&lt;/div&gt;
        &lt;div class="battery-charge"&gt;${isCharging?'充電中':ago}&lt;/div&gt;
      &lt;/div&gt;
      &lt;div style="display:flex;align-items:center;gap:6px"&gt;
        &lt;div class="battery-wrap"&gt;
          &lt;div class="battery-fill" style="width:${lv}%;background:${color}"&gt;&lt;/div&gt;
          ${isCharging?'&lt;div class="battery-bolt"&gt;&lt;svg viewBox="0 0 10 16" width="8" height="12" fill="white" xmlns="http://www.w3.org/2000/svg"&gt;&lt;path d="M7 0L2 9h4l-2 7 7-9H7z"/&gt;&lt;/svg&gt;&lt;/div&gt;':''}
        &lt;/div&gt;
        &lt;div class="battery-pct"&gt;${lv}&lt;span style="font-size:11px"&gt;%&lt;/span&gt;&lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;`;
  });
  return `&lt;div class="battery-card" id="batteryWrap"&gt;${cols.join('&lt;div style="width:1px;background:var(--lav);align-self:stretch"&gt;&lt;/div&gt;')}&lt;/div&gt;`;
}
function renderHistPage(){
  const c=document.getElementById('histContent');
  const tp=document.getElementById('histPageToday');
  if(!schedHistory.length){
    tp.innerHTML=`&lt;div class="empty-hist"&gt;&lt;div class="ei"&gt;📭&lt;/div&gt;&lt;p&gt;まだ保存されたスケジュールはないよ&lt;/p&gt;&lt;p style="margin-top:6px;font-size:11px"&gt;スケジュールを生成して「保存」ボタンを押してね！&lt;/p&gt;&lt;/div&gt;`;
    c.innerHTML='';
    return;
  }
  const today=todayVal();
  const todayEntry=schedHistory.find(x=&gt;x.dateVal===today);
  const others=schedHistory.filter(x=&gt;x.dateVal!==today);
  let todayHtml=`&lt;div class="today-card"&gt;`;
  if(todayEntry){
    todayHtml+=`
    &lt;div class="today-card-hdr"&gt;
      &lt;span class="today-card-label"&gt;TODAY&lt;/span&gt;
      &lt;span class="today-card-date"&gt;${fmtDLFull(todayEntry.dateVal)}&lt;/span&gt;
    &lt;/div&gt;
    ${buildRunsHtml(todayEntry,true)}
    &lt;div class="today-action-bar"&gt;
      &lt;div class="today-action-btn" onclick="shareHist(${todayEntry.id})"&gt;
        &lt;span class="today-action-ico"&gt;&lt;svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"&gt;&lt;path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/&gt;&lt;polyline points="16 6 12 2 8 6"/&gt;&lt;line x1="12" y1="2" x2="12" y2="15"/&gt;&lt;/svg&gt;&lt;/span&gt;
        &lt;span class="today-action-lbl"&gt;共有&lt;/span&gt;
      &lt;/div&gt;
    &lt;/div&gt;`;
  } else {
    todayHtml+=`
    &lt;div class="today-card-hdr"&gt;
      &lt;span class="today-card-label"&gt;TODAY&lt;/span&gt;
      &lt;span class="today-card-date"&gt;${fmtDL(today)}&lt;/span&gt;
    &lt;/div&gt;
    &lt;div class="today-card-empty"&gt;
      &lt;p&gt;スケジュールなし&lt;/p&gt;
      &lt;small&gt;スケジュールを生成して保存してね&lt;/small&gt;
    &lt;/div&gt;`;
  }
  todayHtml+=`&lt;/div&gt;`;
  todayHtml+=renderBatteryCard();
  todayHtml+=`&lt;div class="debug-time-row"&gt;&lt;span class="debug-time-lbl"&gt;🕐 テスト時刻&lt;/span&gt;&lt;input class="debug-time-inp" id="debugTimeInp" type="time" onchange="setDebugTime(this.value)"&gt;&lt;button class="debug-time-clr" onclick="setDebugTime('');document.getElementById('debugTimeInp').value=''"&gt;リセット&lt;/button&gt;&lt;/div&gt;`;
  tp.innerHTML=todayHtml;
  if(_debugTime)document.getElementById('debugTimeInp').value=_debugTime;
  let html='';
  const monthMap={};
  others.forEach(e=&gt;{
    const m=fmtMonth(e.dateVal);
    if(!monthMap[m])monthMap[m]=[];
    monthMap[m].push(e);
  });
  Object.entries(monthMap).sort((a,b)=&gt;b[0].localeCompare(a[0])).forEach(([month, entries],mi)=&gt;{
    const accId=`acc_${mi}`;
    html+=`&lt;div class="month-acc" id="${accId}"&gt;
      &lt;div class="month-acc-hdr" onclick="toggleAcc('${accId}')"&gt;
        &lt;span class="month-acc-title"&gt;${month}&lt;/span&gt;
        &lt;div style="display:flex;align-items:center;gap:8px"&gt;
          &lt;span class="month-acc-count"&gt;${entries.length}件&lt;/span&gt;
          &lt;span class="month-acc-arr"&gt;▾&lt;/span&gt;
        &lt;/div&gt;
      &lt;/div&gt;
      &lt;div class="month-acc-body"&gt;`;
    entries.sort((a,b)=&gt;b.dateVal.localeCompare(a.dateVal)).forEach(e=&gt;{
      const girlNames=e.runs.flatMap(r=&gt;r.stops.filter(s=&gt;s.type==='pick').map(s=&gt;s.name)).join('・');
      html+=`&lt;div class="hist-item" onclick="openHistDetail(${e.id})"&gt;
        &lt;div class="hist-item-hdr"&gt;
          &lt;div&gt;
            &lt;div class="hist-item-date"&gt;${fmtDLFull(e.dateVal)}&lt;/div&gt;
            &lt;div class="hist-item-sub"&gt;👩 ${girlNames||'データなし'}&lt;/div&gt;
          &lt;/div&gt;
          &lt;div style="display:flex;align-items:center;gap:6px"&gt;
            &lt;span class="hist-item-badge"&gt;${e.runs.length}便&lt;/span&gt;
            &lt;span class="hist-item-arr"&gt;›&lt;/span&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;`;
    });
    html+=`&lt;/div&gt;&lt;/div&gt;`;
  });
  c.innerHTML=html;
}

function toggleAcc(id){document.getElementById(id).classList.toggle('open');}

function quickCopyBoy(id){
  const e=schedHistory.find(x=&gt;x.id==id);
  if(!e) return;
  if(navigator.clipboard)navigator.clipboard.writeText(e.boyTxt).then(()=&gt;showToast('ボーイ用をコピーしました！📤'));
  else{const ta=document.createElement('textarea');ta.value=e.boyTxt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('ボーイ用をコピーしました！📤');}
}

function openHistDetail(id){
  const e=schedHistory.find(x=&gt;x.id==id);
  if(!e) return;
  document.getElementById('moHistTitle').textContent=`📅 ${fmtDLFull(e.dateVal)}`;
  let html=buildRunsHtml(e);
  html+=`&lt;div class="today-action-bar" style="margin:14px -16px 0;border-radius:0 0 14px 14px;overflow:hidden"&gt;
    &lt;div class="today-action-btn" onclick="shareHist(${e.id})"&gt;
      &lt;span class="today-action-ico"&gt;&lt;svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"&gt;&lt;path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/&gt;&lt;polyline points="16 6 12 2 8 6"/&gt;&lt;line x1="12" y1="2" x2="12" y2="15"/&gt;&lt;/svg&gt;&lt;/span&gt;
      &lt;span class="today-action-lbl"&gt;共有&lt;/span&gt;
    &lt;/div&gt;
  &lt;/div&gt;`;
  document.getElementById('moHistBody').innerHTML=html;
  document.getElementById('moHistDetail').classList.add('open');
}

function updateHistStop(entryId, runIdx, stopIdx, newTime){
  const e=schedHistory.find(x=&gt;x.id==entryId);
  if(!e) return;
  e.runs[runIdx].stops[stopIdx].time=newTime;
  rebuildHistTexts(e);
  gasPost({action:'updateSchedule', payload:e});
  showToast('時間を更新しました ✏️');
}

function rebuildHistTexts(e){
  const dateLabel=e.dateLabel||'';
  let shun=[dateLabel,''], boy=[dateLabel,''];
  e.runs.forEach((run,ri)=&gt;{
    shun.push(run.departLabel);
    run.stops.forEach(s=&gt;{
      shun.push(`${s.min}分`);
      shun.push(`${s.time}${s.name}${s.type==='pick'?'迎え':'着'}`);
      boy.push(`${s.time}${s.name}${s.type==='pick'?'迎え':'着'}`);
    });
    if(ri&lt;e.runs.length-1){shun.push('');boy.push('');}
  });
  e.shunTxt=shun.join('\n');
  e.boyTxt=boy.join('\n');
}

async function shareHist(id){
  const e=schedHistory.find(x=&gt;x.id==id);
  if(!e) return;
  const txt=e.boyTxt||e.shunTxt||'';
  if(navigator.share){
    try{ await navigator.share({text:txt}); }
    catch(err){ if(err.name!=='AbortError') showToast('共有できませんでした'); }
  } else {
    if(navigator.clipboard) await navigator.clipboard.writeText(txt);
    else{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}
    showToast('コピーしました！');
  }
}
function copyHistText(id, who){
  const e=schedHistory.find(x=&gt;x.id==id);
  if(!e) return;
  const txt=who==='shun'?e.shunTxt:e.boyTxt;
  if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=&gt;showToast('コピーしました！📋'));
  else{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('コピーしました！📋');}
}

function deleteHist(id){
  schedHistory=schedHistory.filter(x=&gt;x.id!=id);
  gasPost({action:'deleteSchedule', id:id});
  closeMo('moHistDetail');
  renderHistPage();
  showToast('削除しました 🗑️');
}

// ========== マスター管理 ==========
function renderMasters(){
  document.getElementById('depMasterList').innerHTML=depLocs.length?depLocs.map(d=&gt;`
    &lt;div class="mcard dep"&gt;
      &lt;div class="mc-av d"&gt;🚩&lt;/div&gt;
      &lt;div class="mc-info"&gt;&lt;div class="mc-name"&gt;${d.name}&lt;/div&gt;&lt;div class="mc-sub"&gt;${d.addr||'住所なし'}&lt;/div&gt;&lt;/div&gt;
      &lt;button class="btn bg sm" onclick="openDepMo(${d.id})"&gt;編集&lt;/button&gt;
    &lt;/div&gt;`).join(''):'&lt;div class="empty-note"&gt;まだ登録なし&lt;/div&gt;';
  document.getElementById('girlMasterList').innerHTML=girls.length?girls.map(g=&gt;`
    &lt;div class="mcard girl"&gt;
      &lt;div class="mc-av g"&gt;👩&lt;/div&gt;
      &lt;div class="mc-info"&gt;&lt;div class="mc-name"&gt;${g.name}&lt;/div&gt;&lt;div class="mc-sub"&gt;${g.nick} / ${g.addr}&lt;/div&gt;&lt;/div&gt;
      &lt;button class="btn bg sm" onclick="openGirlMo(${g.id})"&gt;編集&lt;/button&gt;
    &lt;/div&gt;`).join(''):'&lt;div class="empty-note"&gt;まだ登録なし&lt;/div&gt;';
  document.getElementById('placeMasterList').innerHTML=places.length?places.map(p=&gt;`
    &lt;div class="mcard place"&gt;
      &lt;div class="mc-av p"&gt;🏠&lt;/div&gt;
      &lt;div class="mc-info"&gt;&lt;div class="mc-name"&gt;${p.name}&lt;/div&gt;&lt;div class="mc-sub"&gt;${p.addr}&lt;/div&gt;&lt;/div&gt;
      &lt;button class="btn bg sm" onclick="openPlaceMo(${p.id})"&gt;編集&lt;/button&gt;
    &lt;/div&gt;`).join(''):'&lt;div class="empty-note"&gt;まだ登録なし&lt;/div&gt;';
}

function openDepMo(id){
  ['dNameInp','dAddrInp'].forEach(x=&gt;document.getElementById(x).value='');
  document.getElementById('edId').value='';
  document.getElementById('moDepTitle').textContent='🚩 出発地を登録';
  document.getElementById('delDepBtn').style.display='none';
  if(id){const d=depLocs.find(x=&gt;x.id===id);if(d){document.getElementById('dNameInp').value=d.name;document.getElementById('dAddrInp').value=d.addr||'';document.getElementById('edId').value=d.id;document.getElementById('moDepTitle').textContent='🚩 編集';document.getElementById('delDepBtn').style.display='flex';}}
  document.getElementById('moDepLoc').classList.add('open');
}
function saveDepLoc(){
  const name=document.getElementById('dNameInp').value.trim();
  if(!name){showToast('名前を入れてね！');return;}
  const addr=document.getElementById('dAddrInp').value.trim();
  const eid=parseInt(document.getElementById('edId').value);
  if(eid){const d=depLocs.find(x=&gt;x.id===eid);if(d){d.name=name;d.addr=addr;}}
  else{depLocs.push({id:++dCnt,name,addr});saveCounters();}
  gasPost({action:'saveDepLocs', payload:depLocs});
  closeMo('moDepLoc');renderMasters();refreshDepSel();showToast('保存しました！💾');
}
function delDepLoc(){
  const eid=parseInt(document.getElementById('edId').value);
  depLocs=depLocs.filter(x=&gt;x.id!==eid);
  gasPost({action:'saveDepLocs', payload:depLocs});
  closeMo('moDepLoc');renderMasters();refreshDepSel();showToast('削除しました');
}

function openGirlMo(id){
  ['gNameInp','gNickInp','gAddrInp'].forEach(x=&gt;document.getElementById(x).value='');
  document.getElementById('egId').value='';
  document.getElementById('moGirlTitle').textContent='👩 登録';
  document.getElementById('delGirlBtn').style.display='none';
  if(id){const g=girls.find(x=&gt;x.id===id);if(g){document.getElementById('gNameInp').value=g.name;document.getElementById('gNickInp').value=g.nick;document.getElementById('gAddrInp').value=g.addr;document.getElementById('egId').value=g.id;document.getElementById('moGirlTitle').textContent='👩 編集';document.getElementById('delGirlBtn').style.display='flex';}}
  document.getElementById('moGirl').classList.add('open');
}
function saveGirl(){
  const name=document.getElementById('gNameInp').value.trim();
  if(!name){showToast('名前を入れてね！');return;}
  const nick=document.getElementById('gNickInp').value.trim(),addr=document.getElementById('gAddrInp').value.trim();
  const eid=parseInt(document.getElementById('egId').value);
  if(eid){const g=girls.find(x=&gt;x.id===eid);if(g){g.name=name;g.nick=nick;g.addr=addr;}}
  else{girls.push({id:++gCnt,name,nick,addr});saveCounters();}
  gasPost({action:'saveGirls', payload:girls});
  closeMo('moGirl');renderMasters();renderGirlInputs();showToast('保存しました！💾');
}
function delGirl(){
  const eid=parseInt(document.getElementById('egId').value);
  girls=girls.filter(x=&gt;x.id!==eid);
  gasPost({action:'saveGirls', payload:girls});
  closeMo('moGirl');renderMasters();renderGirlInputs();showToast('削除しました');
}

function openPlaceMo(id){
  ['pNameInp','pAddrInp'].forEach(x=&gt;document.getElementById(x).value='');
  document.getElementById('epId').value='';
  document.getElementById('moPlaceTitle').textContent='🏠 登録';
  document.getElementById('delPlaceBtn').style.display='none';
  if(id){const p=places.find(x=&gt;x.id===id);if(p){document.getElementById('pNameInp').value=p.name;document.getElementById('pAddrInp').value=p.addr;document.getElementById('epId').value=p.id;document.getElementById('moPlaceTitle').textContent='🏠 編集';document.getElementById('delPlaceBtn').style.display='flex';}}
  document.getElementById('moPlace').classList.add('open');
}
function savePlace(){
  const name=document.getElementById('pNameInp').value.trim();
  if(!name){showToast('名前を入れてね！');return;}
  const addr=document.getElementById('pAddrInp').value.trim();
  const eid=parseInt(document.getElementById('epId').value);
  if(eid){const p=places.find(x=&gt;x.id===eid);if(p){p.name=name;p.addr=addr;}}
  else{places.push({id:++pCnt,name,addr});saveCounters();}
  gasPost({action:'savePlaces', payload:places});
  closeMo('moPlace');renderMasters();showToast('保存しました！💾');
}
function delPlace(){
  const eid=parseInt(document.getElementById('epId').value);
  places=places.filter(x=&gt;x.id!==eid);
  gasPost({action:'savePlaces', payload:places});
  closeMo('moPlace');renderMasters();showToast('削除しました');
}

function closeMo(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.mo').forEach(el=&gt;el.addEventListener('click',e=&gt;{if(e.target===el)el.classList.remove('open');}));

// ========== トースト ==========
let _toastTimer=null;
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  if(_toastTimer) clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=&gt;{t.classList.remove('show');_toastTimer=null;},2200);
}

// ========== 星空アニメーション ==========
(function(){
  var c=document.getElementById('starfield');
  var ctx=c.getContext('2d');
  var stars=[];
  function resize(){c.width=window.innerWidth;c.height=window.innerHeight}
  function init(){
    stars=[];
    for(var i=0;i&lt;200;i++){
      var big=Math.random()&lt;0.12;
      stars.push({
        x:Math.random()*c.width,y:Math.random()*c.height,
        r:big?(Math.random()*0.8+0.6):(Math.random()*0.45+0.1),
        phase:Math.random()*Math.PI*2,
        speed:Math.random()*1.4+0.3,
        minA:Math.random()*0.15,
        maxA:Math.random()*0.55+0.35,
        glow:big
      });
    }
  }
  var t=0;
  var px={tx:0,ty:0,cx:0,cy:0,sx:0,sy:0,on:false};
  document.addEventListener('touchstart',function(e){
    if(!document.body.classList.contains('dark-active'))return;
    px.sx=e.touches[0].clientX;px.sy=e.touches[0].clientY;px.on=true;
  },{passive:true});
  document.addEventListener('touchmove',function(e){
    if(!px.on||!document.body.classList.contains('dark-active'))return;
    px.tx=(e.touches[0].clientX-px.sx)*0.12;
    px.ty=(e.touches[0].clientY-px.sy)*0.12;
  },{passive:true});
  document.addEventListener('touchend',function(){
    px.on=false;px.tx=0;px.ty=0;
  },{passive:true});
  function draw(){
    requestAnimationFrame(draw);
    var isDark=document.body.classList.contains('dark-active');
    if(!isDark){ctx.clearRect(0,0,c.width,c.height);return}
    px.cx+=(px.tx-px.cx)*0.08;
    px.cy+=(px.ty-px.cy)*0.08;
    ctx.clearRect(0,0,c.width,c.height);
    t+=0.018;
    ctx.save();
    ctx.translate(px.cx,px.cy);
    stars.forEach(function(s){
      var a=s.minA+(s.maxA-s.minA)*(0.5+0.5*Math.sin(t*s.speed+s.phase));
      if(s.glow){ctx.shadowBlur=5;ctx.shadowColor='rgba(200,220,255,'+a+')';}
      else{ctx.shadowBlur=0}
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle='rgba(215,228,255,'+a+')';ctx.fill();
    });
    ctx.shadowBlur=0;
    ctx.restore();
  }
  resize();init();
  window.addEventListener('resize',function(){resize();init()});
  draw();
})();

// ========== 設定 ==========
let _theme = localStorage.getItem('appTheme') || (localStorage.getItem('fontMode')==='shun'?'shun':'hee');
let _color = localStorage.getItem('colorMode') || 'auto';
let _font  = localStorage.getItem('appFont')  || 'maru';
const _darkMQ = window.matchMedia('(prefers-color-scheme: dark)');

function _applyAll(){
  const b = document.body;
  b.classList.toggle('font-shun', _theme==='shun');
  b.classList.toggle('font-maru', _font==='maru');
  b.classList.toggle('font-system', _font==='system');
  const dark = _theme==='shun' &amp;&amp; (_color==='dark' || (_color==='auto' &amp;&amp; _darkMQ.matches));
  b.classList.toggle('dark-active', dark);
  if(typeof updateThemeColor==='function') updateThemeColor();
}
_darkMQ.addEventListener('change', function(){ _applyAll(); updateMapTile(); });

function openSettings(){
  document.getElementById('sp-hee').classList.toggle('sel',_theme==='hee');
  document.getElementById('sp-shun').classList.toggle('sel',_theme==='shun');
  document.getElementById('sp-light').classList.toggle('sel',_color==='light');
  document.getElementById('sp-dark').classList.toggle('sel',_color==='dark');
  document.getElementById('sp-auto').classList.toggle('sel',_color==='auto');
  document.getElementById('sp-maru').classList.toggle('sel',_font!=='system');
  document.getElementById('sp-sys').classList.toggle('sel',_font==='system');
  document.getElementById('st-color').classList.toggle('disabled',_theme==='hee');
  var base = GAS_URL.split('?')[0];
  var elS = document.getElementById('ovUrlShun');
  var elH = document.getElementById('ovUrlHee');
  if(elS) elS.textContent = base+'?user=shun';
  if(elH) elH.textContent = base+'?user=hee';
  document.getElementById('moSettings').classList.add('open');
}
function copyOverlandUrl(user){
  var url = GAS_URL.split('?')[0]+'?user='+user;
  if(navigator.clipboard){
    navigator.clipboard.writeText(url).then(function(){ showToast('コピーしました'); }).catch(function(){ _fallbackCopy(url); });
  } else { _fallbackCopy(url); }
}
function _fallbackCopy(text){
  var ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try{ document.execCommand('copy'); showToast('コピーしました'); } catch(e){ showToast('コピー失敗'); }
  document.body.removeChild(ta);
}
function setAppTheme(t){
  _theme=t; localStorage.setItem('appTheme',t); localStorage.setItem('fontMode',t==='shun'?'shun':'hee');
  _applyAll(); openSettings(); updateMapTile();
}
function setColorMode(c){
  _color=c; localStorage.setItem('colorMode',c); _applyAll(); openSettings(); updateMapTile();
}
function setAppFont(f){
  _font=(f==='sys'?'system':f); localStorage.setItem('appFont',_font); _applyAll(); openSettings();
}
(function(){ _applyAll(); })();

// ========== リアルタイム位置共有 ==========
var _locLayer = null;
var _locPollTimer = null;
var _locMarkers = {};
var _locHistory = {}; // {key: [{lat,lng,t}]} 最大2件
var _predLoop = null;

function _myUser(){ return localStorage.getItem('fontMode')==='shun' ? 'shun' : 'hee'; }

var _LOC_USERS = [
  {key:'shun', label:'しゅん',      icon:'🌙', bg:'#2a5a8a'},
  {key:'hee',  label:'ひーちゃん',  icon:'🌸', bg:'#c478a8'}
];

function _liveIcon(icon, bg){
  return L.divIcon({
    className:'leaflet-div-icon',
    html:'&lt;div class="loc-wrap"&gt;&lt;div class="loc-pulse" style="background:'+bg+'"&gt;&lt;/div&gt;'
        +'&lt;div class="map-marker" style="background:'+bg+';width:36px;height:36px;font-size:17px"&gt;'+icon+'&lt;/div&gt;&lt;/div&gt;',
    iconSize:[44,44], iconAnchor:[22,22], popupAnchor:[0,-22]
  });
}

function _fmtAgo(isoStr){
  if(!isoStr) return '–';
  var diff=Math.floor((Date.now()-new Date(isoStr).getTime())/1000);
  if(diff&lt;60) return diff+'秒前';
  if(diff&lt;3600) return Math.floor(diff/60)+'分前';
  return Math.floor(diff/3600)+'時間前';
}

// 位置履歴に追加（最大2件）
function _pushLocHistory(key, d){
  if(!d||!d.lat||!d.lng) return;
  if(!_locHistory[key]) _locHistory[key]=[];
  var h=_locHistory[key];
  var t=new Date(d.at||0).getTime()||Date.now();
  if(h.length&amp;&amp;h[h.length-1].t===t) return;
  h.push({lat:+d.lat, lng:+d.lng, t:t});
  if(h.length&gt;2) h.shift();
}

// デッドレコニング：2点の速度から現在位置を推定
function _predictPos(key){
  var h=_locHistory[key];
  if(!h||!h.length) return null;
  if(h.length&lt;2) return {lat:h[0].lat, lng:h[0].lng};
  var a=h[0], b=h[1];
  var dt=b.t-a.t;
  if(dt&lt;=0) return {lat:b.lat, lng:b.lng};
  var dlat=b.lat-a.lat, dlng=b.lng-a.lng;
  var r=Math.min((Date.now()-b.t)/dt, 1.5);
  return {lat:b.lat+dlat*r, lng:b.lng+dlng*r};
}

// 200msごとに推定位置でマーカーを更新
function _startPredLoop(){
  if(_predLoop) return;
  _predLoop=setInterval(function(){
    if(!_mapObj||!_locLayer) return;
    _LOC_USERS.forEach(function(u){
      if(!_locMarkers[u.key]) return;
      var pos=_predictPos(u.key);
      if(pos) _locMarkers[u.key].setLatLng([pos.lat,pos.lng]);
    });
  }, 200);
}

function updateLocStatus(){
  _LOC_USERS.forEach(function(u){
    var el=document.getElementById('locStatus'+u.key.charAt(0).toUpperCase()+u.key.slice(1));
    if(!el) return;
    var d=locationData[u.key];
    if(d&amp;&amp;d.lat&amp;&amp;d.lng){
      el.style.opacity='1';
      el.title=_fmtAgo(d.at);
    } else {
      el.style.opacity='.4';
      el.title='データなし';
    }
  });
}

function updateLocMarkers(){
  updateLocStatus();
  // 履歴を更新（マップ未表示でも記録しておく）
  _LOC_USERS.forEach(function(u){
    var d=locationData[u.key];
    if(d&amp;&amp;d.lat&amp;&amp;d.lng) _pushLocHistory(u.key, d);
  });
  if(!_mapObj||!_locLayer) return;
  _LOC_USERS.forEach(function(u){
    var d=locationData[u.key];
    if(!d||!d.lat||!d.lng) return;
    if(!_locMarkers[u.key]){
      var pos=_predictPos(u.key)||{lat:+d.lat, lng:+d.lng};
      _locMarkers[u.key]=L.marker([pos.lat,pos.lng],{icon:_liveIcon(u.icon,u.bg),zIndexOffset:2000})
        .addTo(_locLayer);
      (function(uk){
        _locMarkers[uk].bindPopup('');
        _locMarkers[uk].on('click',function(){
          var u2=_LOC_USERS.find(function(x){return x.key===uk;});
          _locMarkers[uk].getPopup().setContent('&lt;b&gt;'+u2.label+'&lt;/b&gt;&lt;br&gt;&lt;small&gt;'+_fmtAgo(locationData[uk]&amp;&amp;locationData[uk].at)+'&lt;/small&gt;');
          _locMarkers[uk].openPopup();
        });
      })(u.key);
    }
  });
}

function _fetchLocations(){
  fetch(GAS_URL+'?action=location&amp;_='+Date.now())
    .then(function(r){return r.json();})
    .then(function(data){
      if(data.ok){
        var newLoc=data.data||{};
        Object.keys(newLoc).forEach(function(k){ if(newLoc[k]&amp;&amp;newLoc[k].lat) locationData[k]=newLoc[k]; });
        updateLocMarkers();
      }
    }).catch(function(){});
}

function startLocationTracking(){
  _startPredLoop();
  _locPollTimer=setInterval(_fetchLocations, 2000);
  _fetchLocations();
}

// ========== マップ ==========
var _mapObj = null;
var _mapLayer = null;
var _mapTile = null;

function _cartoCDN(style){
  return L.tileLayer('https://{s}.basemaps.cartocdn.com/'+style+'/{z}/{x}/{y}{r}.png', {
    attribution:'&amp;copy; &lt;a href="https://www.openstreetmap.org/copyright"&gt;OpenStreetMap&lt;/a&gt; contributors &amp;copy; &lt;a href="https://carto.com/attributions"&gt;CARTO&lt;/a&gt;',
    subdomains:'abcd', maxZoom:19
  });
}
function _jaTile(dark){
  var style = dark ? 'dark_all' : 'rastertiles/voyager';
  return L.tileLayer('https://{s}.basemaps.cartocdn.com/'+style+'/{z}/{x}/{y}{r}.png', {
    attribution:'&amp;copy; &lt;a href="https://www.openstreetmap.org/copyright"&gt;OpenStreetMap&lt;/a&gt; contributors &amp;copy; &lt;a href="https://carto.com/attributions"&gt;CARTO&lt;/a&gt;',
    subdomains:'abcd', maxZoom:19
  });
}
function updateMapTile(){
  if(!_mapObj) return;
  var isDark = document.body.classList.contains('dark-active');
  if(_mapTile) _mapObj.removeLayer(_mapTile);
  _mapTile = _jaTile(isDark).addTo(_mapObj);
}

function _geocacheKey(addr){ return 'geo2_' + addr; }

function _parseLatLng(s) {
  // "35.123,135.456" or "35.123 135.456" or "(35.123,135.456)"
  var m = s.replace(/[()]/g,'').match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
  if (m) {
    var a = parseFloat(m[1]), b = parseFloat(m[2]);
    // 日本の緯度(24-46)・経度(122-154)かチェック
    if (a &gt;= 24 &amp;&amp; a &lt;= 46 &amp;&amp; b &gt;= 122 &amp;&amp; b &lt;= 154) return {lat:a, lng:b};
    if (b &gt;= 24 &amp;&amp; b &lt;= 46 &amp;&amp; a &gt;= 122 &amp;&amp; a &lt;= 154) return {lat:b, lng:a};
  }
  return null;
}

async function _geocode(addr) {
  // 緯度経度形式なら直接返す
  var direct = _parseLatLng(addr);
  if (direct) return direct;

  var k = _geocacheKey(addr);
  var cached = localStorage.getItem(k);
  if (cached) { try { return JSON.parse(cached); } catch(e){} }

  // 郵便番号を除去
  var q = addr.replace(/〒?\d{3}-?\d{4}\s*/g, '').trim() || addr;

  try {
    var url = GAS_URL + '?action=geocode&amp;addr=' + encodeURIComponent(q) + '&amp;_=' + Date.now();
    var res = await fetch(url);
    var data = await res.json();
    if (data.ok) {
      var pt = {lat: data.data.lat, lng: data.data.lng};
      localStorage.setItem(k, JSON.stringify(pt));
      return pt;
    }
  } catch(e) {}
  return null;
}

function _divIcon(emoji, bg) {
  return L.divIcon({
    className: 'leaflet-div-icon',
    html: '&lt;div class="map-marker" style="background:' + bg + '"&gt;' + emoji + '&lt;/div&gt;',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

async function initMap() {
  var container = document.getElementById('map-container');
  if (!container) return;

  if(!document.body.classList.contains('map-active')){
    var hdrH = 0;
    var navH = (document.querySelector('.bnav') || {}).offsetHeight || 56;
    var legendH = (document.getElementById('mapLegend') || {}).offsetHeight || 44;
    var safeTop = parseInt(getComputedStyle(document.body).paddingTop) || 0;
    container.style.height = (window.innerHeight - safeTop - hdrH - legendH - navH) + 'px';
  } else {
    // CSS handles size via position:fixed top:-env(safe-area-inset-top)/bottom:0; just ensure Leaflet re-reads it
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        if(_mapObj){
          _mapObj.invalidateSize({animate:false});
          _mapObj.setView(_mapObj.getCenter(), _mapObj.getZoom(), {reset:true, animate:false});
        }
      });
    });
  }

  if (!_mapObj) {
    _mapObj = L.map('map-container', {center:[34.6937,135.5023], zoom:13, zoomControl:true});
    _mapTile = _jaTile(document.body.classList.contains('dark-active')).addTo(_mapObj);
    _mapLayer = L.layerGroup().addTo(_mapObj);
    _locLayer = L.layerGroup().addTo(_mapObj);
    setTimeout(function(){ _mapObj &amp;&amp; _mapObj.invalidateSize({animate:false}); }, 100);
    setTimeout(function(){ _mapObj &amp;&amp; _mapObj.invalidateSize({animate:false}); }, 400);
  } else {
    _mapObj.invalidateSize();
    _mapLayer.clearLayers();
  }

  var bounds = [];

  // リアルタイム位置マーカー（別レイヤー）
  updateLocMarkers();
  var myLoc = locationData[_myUser()];
  var centerLatLng = myLoc ? [myLoc.lat, myLoc.lng] : [34.6937, 135.5023];
  bounds.push(centerLatLng);

  // キューに全住所を積む
  var queue = [];
  places.forEach(function(p){ var a=String(p.addr||'').trim(); if(a) queue.push({addr:a, emoji:'🏠', bg:'#e88fac', label:p.name}); });
  girls.forEach(function(g){ var a=String(g.addr||'').trim(); if(a) queue.push({addr:a, emoji:'👧', bg:'#c478a8', label:g.name+(g.nick?'（'+g.nick+'）':'')}); });
  depLocs.forEach(function(d){ var a=String(d.addr||'').trim(); if(a) queue.push({addr:a, emoji:'🚩', bg:'#6a9e8a', label:d.name}); });

  var legend = document.getElementById('mapLegend');
  var oldSt = document.getElementById('mapGeoStatus');
  if (oldSt) oldSt.remove();
  var needGeo = queue.filter(function(q){ return !_parseLatLng(q.addr) &amp;&amp; !localStorage.getItem(_geocacheKey(q.addr)); });
  if (needGeo.length &gt; 0) {
    var stEl = document.createElement('span');
    stEl.id = 'mapGeoStatus';
    stEl.style.cssText = 'margin-left:auto;color:var(--txs);font-size:11px';
    stEl.textContent = '📡 住所変換中 0/' + queue.length;
    legend.appendChild(stEl);
  }

  for (var i = 0; i &lt; queue.length; i++) {
    // キャッシュ済みなら待機不要、未キャッシュなら1秒間隔でNominatim制限に従う
    var q = queue[i];
    var pt = await _geocode(q.addr);
    var st = document.getElementById('mapGeoStatus');
    if (st) st.textContent = '📡 ジオコーディング中 ' + (i+1) + '/' + queue.length;
    if (pt) {
      L.marker([pt.lat, pt.lng], {icon: _divIcon(q.emoji, q.bg)})
        .addTo(_mapLayer)
        .bindPopup('&lt;b&gt;' + q.label + '&lt;/b&gt;&lt;br&gt;&lt;small&gt;' + q.addr + '&lt;/small&gt;');
      bounds.push([pt.lat, pt.lng]);
    }
  }

  var st = document.getElementById('mapGeoStatus');
  if (st) st.remove();

  if (bounds.length &gt; 1) {
    _mapObj.fitBounds(bounds, {padding:[30,30]});
  } else {
    _mapObj.setView(shunLatLng, 13);
  }
}
&lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;
</pasted_text>

## User



## Assistant

_[tool: update_todos]_

The full source — thank you. Now I understand SILDE completely: a Japanese PWA for managing pickup/drop-off schedules with reverse-time calculation, live map tracking, a destinations master, a secret link, and the dual かわいい/かっこいい themes. I have everything I need.

Let me set up the plan and build a polished, standalone redesign (mock data, no backend dependency) that works fully and reads truthfully inside iPhone + iPad frames.

## User

セッション復活したからお願い

## Assistant

## Assistant

## Assistant

## Assistant

## Assistant

## User

セッション復活したからお願い

## Assistant

_[tool: list_files]_

セッションが戻りましたね。現在の状態を確認します。

_[tool: read_file]_

_[tool: read_file]_

_[tool: write_file]_

Project state restored — original source, an iOS frame starter, and the napkin are here. I have the complete SILDE source in context, so I'll proceed to build the refined redesign now.

My plan: a fully-working standalone React rebuild (mock data, no backend) covering all 5 tabs + the create-schedule reverse-calc flow + settings, with both **かわいい/かっこいい** themes and **light/dark**, de-emoji'd into a refined line-icon system — shown inside **iPhone + iPad** frames.

Let me start with the design system (CSS), then build up the screens.

_[tool: str_replace_edit]_

I left a stray invalid token in the cool theme. Let me fix it.Now the core: icons, mock data, and the pure time-calc functions ported from the original.

_[tool: write_file]_

_[tool: write_file]_

Now the screens (Schedule, Map, Destinations, Secret) plus shared timeline component.

_[tool: write_file]_

Now the Create-schedule flow, Settings, master editors, and detail sheet.

_[tool: write_file]_

Now the App shell that wires everything together.Now the HTML entry point.

_[tool: write_file]_

_[tool: show_html]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: eval_js]_

Looks strong. Let me check console and verify a detail — the wordmark is rendering as katakana, which is unexpected.

_[tool: grep]_

_[tool: eval_js]_

That's genuinely odd — the source says `'SILDE'` but the DOM shows katakana. Let me force a fresh reload and re-check.

_[tool: sleep]_

_[tool: eval_js]_

_[tool: str_replace_edit]_

It's the preview's auto-translation transliterating the brand (SILDE → シルデ). Since the brand is literally "SILDE（シルデ）", that's harmless — but I'll lock the latin wordmark with `translate="no"` so it stays intentional.

_[tool: multi_screenshot]_

The translation quirk aside, the app renders well. Let me exercise the other screens and themes.

_[tool: multi_screenshot]_

All screens look polished. Now let me test the Create flow and the cool/dark themes.

_[tool: str_replace_edit]_

Settings stayed open over the Create sheet — opening one sheet should dismiss others. Let me fix sheet exclusivity.Now let me test the Create sheet (filled) and cool + dark theme.

_[tool: multi_screenshot]_

_[tool: show_html]_

The auto-calc toast fired ("さな → ヴィーナス 25分") — logic works. The settings overlay is stale state from the prior session; my exclusivity fix needs a reload. Let me reload and run a clean Create-flow + dark/cool test.

_[tool: multi_screenshot]_

## Assistant

_[tool: multi_screenshot]_

_[tool: str_replace_edit]_

SILDE wordmark is correct now and the reverse-calc hero (18:05) works. One nit: the "1人目" badge wraps. Let me fix that, then verify dark + cool theme and a generated result.

_[tool: show_html]_

_[tool: multi_screenshot]_

_[tool: write_file]_

The **かっこいい dark** theme is gorgeous — deep navy with the map rendering beautifully. Everything works across themes/modes. Now let me build the iPhone + iPad device-frame showcase the user asked for.

_[tool: show_html]_

_[tool: save_screenshot]_

Frames look great but the embedded apps were still booting (Babel compile). Let me give them a moment and recapture.

_[tool: save_screenshot]_

_[tool: eval_js]_

The blank screens are likely an html-to-image capture limitation (iframes often don't render in DOM-snapshot screenshots), not a real failure. Let me verify the embedded apps actually mounted.

_[tool: snip]_

_[tool: snip]_

Both embedded apps are fully mounted and interactive (verified: `.phone` present, "SILDE" wordmark, 5 nav buttons each) — the blank screens are just an html-to-image limitation with nested iframes; real browsers composite them fine.

Let me clean up context and finalize.

_[tool: done]_

_[tool: fork_verifier_agent]_

SILDEのリデザイン、完成しました。

**作ったもの**
- `silde-showcase.html` — iPhone + iPad 両方の実機フレームで並べた表示（今開いています）。両方とも実際に操作できます。
- `silde.html` — リデザイン版アプリ本体（フルサイズで使う場合はこちら）。モックデータ入りで完全動作します。

**リデザインのポイント**
- **絵文字を一掃**し、統一感のある細線アイコンセットに置き換え（🔮→逆算アイコン、🚩👩🏠→ピン／人／家アイコンなど）。「Tone it down / more refined」のご要望に合わせて、温かみは残しつつ洗練させました。
- **4テーマ完全対応** — かわいい(ローズ)／かっこいい(スティール)× ライト／ダーク。設定から即切替。oklchで色を調和させています。
- 時刻は **Kaisei Opti** の数字で大きく見せ、逆算した出発時刻をヒーロー化。
- 全画面を再構築 — スケジュール(タイムライン＋いまここ表示＋電池＋共有メモ)、スケジュール作成(逆算ロジック・ステッパー・区間自動計算・コピー用テキスト2種・保存上書き)、マップ(洗練したカスタム地図＋ライブ位置パルス)、行き先マスター(CRUD)、シークレット(すりガラスロック)、設定。

**補足**
- マップは外部依存(Leaflet/通信)を排し、デザイン性と確実性を優先したスタイライズド地図にしています。実地図に戻したい場合は対応可能です。
- 「区間ごとの移動時間 → 自動」はプロトタイプ用に擬似計算（実際のOSRM通信なし）。
- プレビュー上部のフレーム内が静止画では空に見えるのは撮影ツールの制約で、実ブラウザでは正常に描画されます。

次にやるなら：iPad専用の2カラムレイアウト、共有メモのドラッグ操作の作り込み、実地図への接続あたり。どこか調整したい点があれば教えてください。

## User

Save as standalone HTML: the current design

