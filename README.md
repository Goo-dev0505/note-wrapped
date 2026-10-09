# note-wrapped

note.com（[@ktcrs1107](https://note.com/ktcrs1107)）の記事パフォーマンスとスキ（いいね）ランキングを可視化する、KITAcore の公開ダッシュボードです。

収集・集計済みの CSV / JSON を `public/data/` に置き、React + Recharts の SPA がそれをフェッチして描画します。バックエンドはありません（完全な静的サイト）。

**公開URL**: https://goo-dev0505.github.io/note-wrapped/

---

## 画面構成

### SPA（`src/App.jsx`）

| タブ | 内容 | 主に使うデータ |
|---|---|---|
| `DASHBOARD` | ヒーロー、日次サマリー、PV/スキ Top5、トレンド状態別の記事一覧 | `daily_summary.csv` / `period_ranking.csv` / `trend_analysis.csv` / `followers.csv` |
| `おすすめ` | 固定記事・マガジン・有料記事のキュレーション（**JSX内のハードコード**、データ駆動ではない） | なし |
| `記事一覧` | 全記事の検索・ソート・状態フィルタ・ページング | `articles.csv` / `article_quality.csv` |
| `ランキング` | スキをくれたクリエイターのランキング（総合 / 今月 / 先週）＋順位推移のバンプチャート | `ranking_*.json` / `ranking_monthly_trace.csv` |

### スタンドアロンHTML（SPAとは独立した単一ファイルページ）

| ファイル | 公開パス | 内容 | データ |
|---|---|---|---|
| `public/log.html` | `/note-wrapped/log.html` | 旧版の日次ログページ | `daily_summary` / `followers` / `period_ranking` / `trend_analysis` |
| `public/ski-ranking.html` | `/note-wrapped/ski-ranking.html` | スキランキング v1（スコア＝スキ数×継続日数ベース） | `ranking_ski.csv` / `ranking_ski_trace.csv` |
| `public/ski_ranking_2.html` | `/note-wrapped/ski_ranking_2.html` | スキランキング v2（`score_base` × `streak_mult` ＋ `lucky_bonus`） | `ranking_ski_2.csv` / `ranking_ski_2_trace.csv` |

---

## 技術スタック

- React 18 / Vite 5 / Recharts 2
- 状態管理・ルーティングライブラリなし（タブは `useState`、スタイルは `App.jsx` 冒頭で `<style>` を動的注入）
- ホスティング: GitHub Pages（`peaceiris/actions-gh-pages`）

---

## セットアップ

```bash
npm install
npm run dev      # 開発サーバ（http://localhost:5173/note-wrapped/）
npm run build    # dist/ に本番ビルド
npm run preview  # ビルド結果のローカル確認
```

`vite.config.js` の `base: '/note-wrapped/'` と、`src/App.jsx` の

```js
const DATA_BASE = "/note-wrapped/data/";
```

は対になっています。リポジトリ名を変える／独自ドメインに載せ替える場合は**両方**を直してください。

---

## データ

### 更新フロー

```
note.com
   └─(別リポジトリの収集バッチ)─> 集計CSV/JSON
          └─ github-actions[bot] が public/data/ を main に push
                 └─ .github/workflows/deploy.yml が build → gh-pages へ publish
```

- データ更新コミットは `Update public data: YYYY-MM-DD HH:MM` の形式で bot から入ります。
- `main` への push と `workflow_dispatch` の両方でデプロイが走ります。
- このリポジトリ自体には収集スクリプトは含まれていません（成果物の置き場＋ビューワ）。

### ファイル一覧（`public/data/`）

**記事系**

| ファイル | 行数目安 | 内容 |
|---|---|---|
| `articles.csv` | 約11万 | 記事 × 日次のスナップショット（`date, note_id, key, title, age_days, read_count, like_count, comment_count`） |
| `article_quality.csv` | 約550 | 記事ごとの質スコア（初速PV、ピーク到達日数、ハーフライフ、持続率、安定性スコア、成長タイプ） |
| `article_trend.csv` | 約550 | 記事ごとの `day0`〜`day324` 日次PV推移（横持ち） |
| `trend_analysis.csv` | 約560 | 直近7日のPV/スキ推移とトレンドスコア、状態（🔥急上昇 / 🟢継続 / ⚠️減速 / 💤停止） |
| `period_ranking.csv` | 約460 | 期間増加PVランキング（1日平均PV、分析期間つき） |
| `asset_score_v1.csv` / `asset_score_v2.csv` | 各約350 | 「資産性」スコア。v2 は平均日次ビュー列を落とした改訂版 |
| `asset_articles.csv` | 約90 | 資産記事の抽出結果 |
| `weekly_summary.csv` / `monthly_summary.csv` | 約9,700 / 3,700 | 記事 × 週／月の期間増加PV・スキとランク |

**アカウント系**

| ファイル | 内容 |
|---|---|
| `daily_summary.csv` | 日次のビュー合計・スキ合計・記事数・スキ率・前日比・フォロワー数 |
| `followers.csv` | フォロワー数の時系列（日付・時刻・人数） |
| `funnel_daily_public.csv` / `funnel_cumulative_public.csv` | インプレッション → PV → スキ → コメントのファネルと各転換率 |

**スキ（いいね）ランキング系**

| ファイル | 内容 |
|---|---|
| `ranking_total.{csv,json}` | 総合ランキング（全期間） |
| `ranking_monthly.{csv,json}` | 今月 |
| `ranking_this_week.{csv,json}` | 今週 |
| `ranking_last_week.{csv,json}` | 先週 |
| `ranking_monthly_trace.csv` | 今月ランキングの日次トレース（バンプチャート用。日次／累計の両方を保持） |
| `ranking_ski.csv` / `ranking_ski_trace.csv` | スキランキング v1（`score`, `streak_days`） |
| `ranking_ski_2.csv` / `ranking_ski_2_trace.csv` | スキランキング v2（`score_base`, `streak_mult`, `lucky_bonus` に分解） |

JSON はいずれも次の形です。SPA のランキングタブは JSON のみを読みます。

```json
{
  "ranking_type": "monthly",
  "generated_at": "2026-10-09T09:36:19+09:00",
  "period_start": "2026-10-01T00:00:00+09:00",
  "period_end":   "2026-10-09T09:30:00+09:00",
  "items": [ { "rank": 1, "like_user_id": "...", "creator_name": "...", "creator_urlname": "...", "likes_count": 0, "follower_count": 0, "first_like_at": "...", "last_like_at": "..." } ]
}
```

**`likes.db`（SQLite, 約16MB）**

集計元のローカルDBをそのまま同梱しているもので、SPAからは参照していません。

| テーブル | 行数目安 | 内容 |
|---|---|---|
| `dim_articles` | 555 | 記事マスタ（`note_key`, `title`, `published_at`, `updated_at`） |
| `fact_snapshots` | 92,342 | 日次スナップショット（`date`, `note_key`, `likes_total`, `views_total`, `comments_total`） |
| `fact_likes_events` | 33,537 | スキイベント（`note_key` × `like_user_id` でユニーク） |
| `checkpoints` | 555 | 記事ごとの増分取得位置 |

---

## 主な設定ポイント（`src/App.jsx`）

| 定数 | 役割 |
|---|---|
| `DATA_BASE` | データの取得元パス |
| `EXCLUDED_TITLES` | 記事一覧・集計から除外するタイトル（テスト投稿やメモ） |
| `EXCLUDED_URLNAMES` | ランキングから除外するユーザー（自分自身 `ktcrs1107`） |
| `RANK_PERIODS` | ランキングタブの期間（総合=Top20 / 今月=Top10・チャートあり / 先週=Top10） |
| `BUMP_FETCH_N` | バンプチャートに載せるクリエイター数（20） |
| `STATUS_LIST` / `STATUS_COLOR` | トレンド状態のフィルタとカラー |

テーマカラーはオレンジ `#f97316` × ブルー `#3b82f6`、背景 `#080808` のダーク固定。フォントは Bebas Neue / Syne / Noto Sans JP / JetBrains Mono を Google Fonts から読み込みます。

---

## 既知の整理ポイント

- `log.html` がリポジトリ直下と `public/` の両方にあり、内容が食い違っています（直下のものは旧版で、ビルドには含まれません）。
- `public/img/` の `work2`〜`work16`、および `logo.png` の参照先実体が、現在どこからも使われていない／存在しません。
- `src/App.jsx` が約1,600行の単一ファイルです。タブ単位（Dashboard / Pickup / ArticleList / LikesRanking）への分割余地があります。
- `おすすめ` タブの記事・マガジン一覧は JSX にハードコードされているため、更新のたびにコード変更が必要です。
- `likes.db`（約16MB）と `public/img/`（約18MB）でリポジトリ容量の大半を占めています。とくに `likes.db` は配信には不要です。

---

## ライセンス

未設定。
