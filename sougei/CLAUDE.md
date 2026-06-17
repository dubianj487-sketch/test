@AGENTS.md

# 送迎アプリ

キャバクラの送迎管理Webアプリ。ボーイ・ドライバー・女の子が使う実務ツール。

## デプロイ・リポジトリ
- **本番URL**: https://sougei-wine.vercel.app
- **GitHub**: dubianj487-sketch/test
- **作業ブランチ**: `claude/ios-safe-area-color-KIkfH` → main にマージ
- **コミットメッセージ**: 必ず日本語、プレフィックス禁止（`feat:` などNG）

## 技術スタック
- Next.js 16 (App Router) + TypeScript
- Supabase (PostgreSQL) — プロジェクトref: `wtobisqxcnomjglpivec`
- Vercel (GitHub push で自動デプロイ)

## 画面一覧
| パス | 画面 | 状態 |
|------|------|------|
| `/` | ボーイ ダッシュボード | 完成 |
| `/dispatch` | 送り配車（3ステップウィザード） | 完成 |
| `/masters/drivers` | ドライバー管理CRUD | 完成 |
| `/masters/girls` | 女の子管理CRUD | 完成 |
| `/driver/[id]` | ドライバー通知・承諾画面 | 完成 |
| 迎え管理 | 迎えスケジュール管理 | **未実装** |

## DBスキーマ
```sql
drivers (id UUID PK, name TEXT, capacity INT DEFAULT 5, note TEXT,
         status TEXT CHECK IN ('待機','移動中','終了'), created_at TIMESTAMPTZ)

girls (id UUID PK, name TEXT, area TEXT, address TEXT, note TEXT, created_at TIMESTAMPTZ)

dispatches (id UUID PK, driver_id UUID→drivers, destination TEXT,
            urgency TEXT, scheduled_time TEXT, status TEXT,
            estimated_return TIMESTAMPTZ, date DATE, created_at TIMESTAMPTZ)

dispatch_girls (id UUID PK, dispatch_id UUID→dispatches CASCADE,
                girl_id UUID→girls, created_at TIMESTAMPTZ)
```
RLS: 全テーブル allow all

**重要**: `drivers.status` にCHECK制約あり。`'承諾待ち'` は追加不可。

## 配車フロー（実装済み）
```
ボーイが配車確定
  → dispatches INSERT { status: '待機' }  ← '待機' = 承諾前の意味
  → driver.status は変えない（DB制約のため）

ドライバーが /driver/[id] で「了解する」
  → dispatches UPDATE { status: '移動中' }
  → drivers UPDATE { status: '移動中' }

ドライバーが「完了する」
  → dispatches UPDATE { status: '完了' }
  → drivers UPDATE { status: '終了' }
```

## ダッシュボードの表示ロジック
```typescript
// dispatch.status='待機' → 青バッジ「承諾待ち」として表示
const active = d.dispatches?.find(dp => dp.status === '移動中')
const pending = d.dispatches?.find(dp => dp.status === '待機')
const displayStatus = active ? '移動中' : pending ? '承諾待ち' : driver.status
```

## デザイントークン
```
待機:    #1a9e50（緑）
移動中:  #c2750a（オレンジ）
承諾待ち: #3478f6（青）
終了:    #aeaeb2（グレー）
背景:    #f5f5f5
カード:  #ffffff, border: 1.5px solid rgba(0,0,0,0.1), borderRadius: 14
フォント: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif
```

## 未解決バグ（最優先）
**配車後もダッシュボードで「承諾待ち」（青）にならず「待機」（緑）のまま**

原因候補:
1. dispatch の INSERT が失敗してる（エラーは `console.error` で出力済み）
2. ダッシュボードの Supabase join `select('*, dispatches(...)')` が機能していない
3. ブラウザキャッシュ

**次にやること**: Supabase MCP で dispatches テーブルを直接 SELECT して原因特定
```sql
SELECT id, driver_id, status, destination, created_at
FROM dispatches ORDER BY created_at DESC LIMIT 10;
```

## Supabase MCP
`.mcp.json` 設定済み（gitignore済み）。  
ネットワークアクセスが「フルネットワークアクセス」の環境でのみ動作する。
