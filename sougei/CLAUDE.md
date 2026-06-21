@AGENTS.md

# 送迎アプリ

キャバクラの送迎管理Webアプリ。ボーイ・ドライバー・キャストが使う実務ツール。
渡されたデザインモック（プロトタイプ）を元に、Next.js + Supabase Realtime で再構築したもの。

## デプロイ・リポジトリ
- **GitHub**: dubianj487-sketch/test（`sougei/` ディレクトリ）
- **Vercel**: プロジェクト名 `sougei`（GitHub push で自動デプロイ）
- **コミットメッセージ**: 必ず日本語、プレフィックス禁止（`feat:` などNG）

## 技術スタック
- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (PostgreSQL + Realtime) — プロジェクトref: `wtobisqxcnomjglpivec`
- UI は単一クライアントコンポーネント（`app/page.tsx`）の状態マシン。インラインスタイル。

## 構成
| ファイル | 役割 |
|----------|------|
| `app/page.tsx` | 全画面（ログイン/ボーイ/ドライバー/キャスト）と画面遷移ロジック |
| `lib/supabase.ts` | Supabaseクライアント（env優先、anonキーのフォールバックあり） |
| `lib/types.ts` | ドメイン型・純粋ヘルパー（距離計算・帰店時刻・降車順など） |
| `lib/db.ts` | 読み込み（loadSnapshot）と全ミューテーション |
| `lib/useSnapshot.ts` | 全テーブルを読み込み Realtime 購読するフック |

## ロール / 画面
- **ログイン**: 招待コード `boy` / `cast` / `driver`、またはDEMOボタンで各ロール・各キャスト/ドライバーに即ログイン
- **ボーイ**: 配車ホーム / 配車依頼（キャスト選択→時刻→ドライバー指定→確定）/ 便詳細・編集 / 管理（キャスト・ドライバー一覧/詳細）
- **キャスト**: ホーム（帰り便状況・乗車リクエスト）/ 降車場所登録 / 本日のみ変更申請
- **ドライバー**: 配車依頼（到着通知→運行開始）/ 運行中（乗車確認→降車完了）/ 稼働ステータス切替

## DBスキーマ（public, RLSは全許可）
```
girls(id PK, name, area, dist, addr, color, drop_address, sort)        -- キャスト(マスタ)
drivers(key PK, name, initial, car, plate, sort)                       -- ドライバー(マスタ)
driver_status(driver_key PK→drivers, status)                          -- 稼働ステータス
trips(id PK, assigned_ids text[], depart_time, driver_key, last_trip,
      boarded, completed, arrived, created_at)                         -- 便
ride_requests(girl_id PK→girls, status)                                -- 乗車リクエスト
today_requests(girl_id PK→girls, place, reason, status)                -- 本日のみ変更申請
```
realtime: trips / ride_requests / today_requests / driver_status / girls / drivers を
`supabase_realtime` パブリケーションに追加済み。

## ローカル開発
```
npm install
npm run dev     # http://localhost:3000
```
`.env.local` に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`（未設定でもフォールバックで動作）。
