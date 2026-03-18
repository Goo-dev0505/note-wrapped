import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, Cell,
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, LabelList,
} from "recharts";

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const styleEl = document.createElement("style");
styleEl.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+JP:wght@400;700;900&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *{box-sizing:border-box;margin:0;padding:0;}

  :root{
    --ink:#080808;
    --ink2:#111111;
    --ink3:#1a1a1a;
    --orange:#f97316;
    --orange2:#fb923c;
    --blue:#3b82f6;
    --blue2:#60a5fa;
    --text:#f0ece4;
    --muted:#6b6660;
    --muted2:#9d9890;
    --border:rgba(255,255,255,0.08);
    --border2:rgba(255,255,255,0.16);
    --border-o:rgba(249,115,22,0.25);
    --border-b:rgba(59,130,246,0.25);
    --glow-o:0 0 40px rgba(249,115,22,0.12);
    --glow-b:0 0 40px rgba(59,130,246,0.10);
    --fd:'Bebas Neue',sans-serif;
    --fs:'Syne',sans-serif;
    --fj:'Noto Sans JP',sans-serif;
    --fm:'JetBrains Mono',monospace;
  }

  html{scroll-behavior:smooth;}
  body{background:var(--ink);color:var(--text);font-family:var(--fj);overflow-x:hidden;-webkit-font-smoothing:antialiased;}

  /* noise */
  body::after{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");opacity:.022;pointer-events:none;z-index:9999;}

  /* animations */
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}

  .fu{animation:fadeUp .7s cubic-bezier(.22,1,.36,1) both}
  .d1{animation-delay:.1s}.d2{animation-delay:.2s}.d3{animation-delay:.35s}.d4{animation-delay:.5s}
  .page-fade{animation:fadeIn .4s cubic-bezier(.22,1,.36,1) both}

  /* ticker */
  .ticker-wrap{overflow:hidden;white-space:nowrap;border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:9px 0;background:var(--ink2);}
  .ticker-inner{display:inline-block;animation:ticker 30s linear infinite;font-family:var(--fm);font-size:11px;letter-spacing:2px;color:var(--muted2)}
  .ticker-sep{color:var(--orange);margin:0 14px}
  .ticker-hi{color:var(--blue2)}

  /* skeleton */
  .skeleton{background:linear-gradient(90deg,#1a1a1a 25%,#282828 50%,#1a1a1a 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:8px}

  /* buttons */
  .tab-btn{transition:all .2s;cursor:pointer;border:none;background:none;font-family:var(--fs);font-weight:700;letter-spacing:2px;font-size:11px;}
  .sort-btn{transition:all .18s;cursor:pointer;border:1px solid var(--border);background:none;border-radius:20px;padding:5px 14px;font-family:var(--fs);font-size:10px;letter-spacing:1px;color:var(--muted2);}
  .sort-btn:hover{border-color:var(--border2);color:var(--text);}
  .sort-btn.active{background:var(--orange);border-color:var(--orange);color:#fff;}
  .filter-chip{transition:all .18s;cursor:pointer;border:1px solid var(--border);background:rgba(255,255,255,0.04);border-radius:20px;padding:4px 12px;font-size:10px;font-family:var(--fs);letter-spacing:1px;color:var(--muted2);}
  .filter-chip:hover{border-color:var(--border2);color:var(--text);}
  .filter-chip.active{background:rgba(255,255,255,0.1);border-color:var(--border2);color:var(--text);}

  /* cards */
  .card-hover{transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s,border-color .25s;cursor:pointer;-webkit-tap-highlight-color:transparent;}
  .card-hover:hover{transform:translateY(-4px);}

  /* article rows */
  .article-row{transition:background .18s;cursor:pointer;}
  .article-row:hover{background:rgba(255,255,255,0.04)!important;}

  /* rank card */
  .rank-card{position:relative;cursor:pointer;border-radius:14px;overflow:hidden;transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s;-webkit-tap-highlight-color:transparent;}
  .rank-card:hover{transform:translateY(-4px) scale(1.01);}
  .rank-card:active{transform:scale(.98);}
  .rank-card .cta-layer{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(249,115,22,.88),rgba(180,60,0,.9));opacity:0;transition:opacity .22s;pointer-events:none;}
  .rank-card:hover .cta-layer{opacity:1;}
  .rank-card .cta-text{font-family:var(--fs);font-weight:700;font-size:13px;letter-spacing:3px;color:#fff;text-transform:uppercase;transform:translateY(8px);transition:transform .24s cubic-bezier(.22,1,.36,1);}
  .rank-card:hover .cta-text{transform:translateY(0);}

  .rank-row{border-radius:8px;overflow:hidden;transition:background .16s,transform .2s cubic-bezier(.22,1,.36,1);cursor:pointer;}
  .rank-row:hover{background:rgba(255,255,255,0.06)!important;transform:translateX(5px);}
  .rank-row:active{transform:scale(.99);}
  .rank-row .row-cta{opacity:0;transition:opacity .16s;}
  .rank-row:hover .row-cta{opacity:1;}

  /* worst */
  .worst-card{transition:all .3s;cursor:pointer;-webkit-tap-highlight-color:transparent;}
  .worst-card:hover{transform:translateY(-3px)}
  .worst-card:active{transform:scale(0.97);}

  /* search */
  .search-input{width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:10px;padding:12px 16px;color:var(--text);font-family:var(--fj);font-size:14px;outline:none;transition:border .2s;}
  .search-input:focus{border-color:var(--border-o);}
  .search-input::placeholder{color:var(--muted);}

  /* badge */
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-family:var(--fs);font-weight:700;letter-spacing:1px;text-transform:uppercase}

  /* layout helpers */
  .sec{padding:80px 32px;}
  .max900{max-width:900px;margin:0 auto;}
  .growth-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;}
  .trend-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .top5-rank{font-size:clamp(32px,5vw,56px);min-width:60px;}
  .top5-pv{font-size:28px;}
  .top5-bar{display:block;}

  /* gem grid */
  .gems-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}

  /* follower chart panel */
  .follower-panel{background:var(--ink3);border:1px solid var(--border);border-radius:14px;padding:28px;}

  @media(min-width:641px) and (max-width:900px){
    .sec{padding:64px 24px;}
    .growth-grid{grid-template-columns:1fr;gap:32px;}
    .gems-grid{grid-template-columns:1fr 1fr;gap:14px;}
  }
  @media(max-width:640px){
    .sec{padding:52px 16px;}
    .growth-grid{grid-template-columns:1fr;gap:24px;}
    .trend-grid{grid-template-columns:1fr;gap:12px;}
    .top5-rank{font-size:32px;min-width:40px;}
    .top5-pv{font-size:20px;}
    .top5-bar{display:none;}
    .gems-grid{grid-template-columns:1fr;gap:12px;}
  }
`;
document.head.appendChild(styleEl);

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const OR = "#f97316";
const BL = "#3b82f6";
const INK = "#080808";
const TEXT = "#f0ece4";
const DATA_BASE = "/note-wrapped/data/";

const EXCLUDED_TITLES = [
  'ナイキ エア ヴェイパーマックス 360','自作PC','自作PC #1','自作PC#2','メモ',
  'スターバックス記事','スターバックス記事 #1','スターバックス記事#1',
  'みんなが貪欲になっているときこそ恐怖心を抱き、みんなが恐怖心を抱いているとき…',
  'はたらくこと','気になるレシピ','気になるレシピ #1','気になるレシピ#1','This is US','"50',
];

const EXCLUDED_URLNAMES = new Set(["ktcrs1107"]);

const STATUS_COLOR = {
  "🔥 急上昇": OR, "🟢 継続": "#22c55e",
  "⚠️ 減速": "#eab308", "💤 停止": "#475569",
};
const STATUS_LIST = ["すべて","🔥 急上昇","🟢 継続","⚠️ 減速","💤 停止"];

const RANK_PERIODS = [
  { id: "total",     file: "ranking_total.json",    label: "総合", top: 20, hasChart: false },
  { id: "monthly",   file: "ranking_monthly.json",  label: "今月", top: 10, hasChart: true  },
  { id: "last_week", file: "ranking_last_week.json", label: "先週", top: 10, hasChart: false },
];
const MEDAL       = ["👑","🥈","🥉"];
const MEDAL_COLOR = [OR, "#a0a0a0", "#b07c40"];
const BUMP_COLORS = [
  "#f97316","#3b82f6","#22c55e","#eab308","#ec4899",
  "#8b5cf6","#06b6d4","#f43f5e","#10b981","#f59e0b",
  "#6366f1","#84cc16","#e11d48","#0ea5e9","#d97706",
  "#7c3aed","#059669","#dc2626","#2563eb","#16a34a",
];
const BUMP_FETCH_N = 20;

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = []; let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ""; } else cur += ch;
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
}

function useIsMobile() {
  const [v, setV] = useState(typeof window !== "undefined" ? window.innerWidth <= 640 : false);
  useEffect(() => {
    const fn = () => setV(window.innerWidth <= 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return v;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
}

function buildPeriodLabel(data, periodId) {
  if (!data) return null;
  const start = data.period_start ? new Date(data.period_start) : null;
  const end   = data.period_end   ? new Date(data.period_end)   : null;
  if (!start || !end) return null;
  if (periodId === "monthly") return `${start.getFullYear()}年${start.getMonth()+1}月`;
  if (periodId === "last_week") {
    const fmt = d => `${d.getMonth()+1}/${d.getDate()}`;
    return `${fmt(start)} 〜 ${fmt(end)}`;
  }
  return null;
}

function Skeleton({ w = "100%", h = 32, style: s = {} }) {
  return <div className="skeleton" style={{ width: w, height: h, ...s }} />;
}

/* ─────────────────────────────────────────────
   DATA HOOKS
───────────────────────────────────────────── */
function useNoteData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(DATA_BASE + "daily_summary.csv").then(r => { if (!r.ok) throw new Error("daily_summary.csv not found"); return r.text(); }),
      fetch(DATA_BASE + "period_ranking.csv").then(r => { if (!r.ok) throw new Error("period_ranking.csv not found"); return r.text(); }),
      fetch(DATA_BASE + "trend_analysis.csv").then(r => { if (!r.ok) throw new Error("trend_analysis.csv not found"); return r.text(); }),
      fetch(DATA_BASE + "followers.csv").then(r => { if (!r.ok) throw new Error("followers.csv not found"); return r.text(); }),
      fetch(DATA_BASE + "articles.csv").then(r => { if (!r.ok) throw new Error("articles.csv not found"); return r.text(); }),
      fetch(DATA_BASE + "article_quality.csv").then(r => r.ok ? r.text() : ""),
    ]).then(([dailyRaw, rankRaw, trendRaw, follRaw, articlesRaw, qualityRaw]) => {
      const daily = parseCSV(dailyRaw), ranking = parseCSV(rankRaw),
            trend = parseCSV(trendRaw), followers = parseCSV(follRaw), articles = parseCSV(articlesRaw);
      const latest = daily[daily.length - 1], prev = daily[daily.length - 2] || {}, first = daily[0];

      const qualityUrlMap = {};
      if (qualityRaw) {
        parseCSV(qualityRaw).forEach(r => {
          const title = (r["タイトル"] || "").trim();
          const key   = (r["key"]      || "").trim();
          if (title && key) qualityUrlMap[title] = `https://note.com/ktcrs1107/n/${key}`;
        });
      }

      const latestArticleDate = articles.reduce((a,b)=>(a.date||"")>(b.date||"")?a:b).date;
      const latestArticles = articles.filter(r => r.date === latestArticleDate);

      const totalPV  = parseInt(latest["ビュー合計"] || latest["pv"] || 0);
      const totalSK  = parseInt(latest["スキ合計"]   || latest["sk"] || 0);
      const totalArt = latestArticles.length;
      const prevPV   = parseInt(prev["ビュー合計"]   || prev["pv"]  || 0);
      const prevSK   = parseInt(prev["スキ合計"]     || prev["sk"]  || 0);
      const prevArt  = parseInt(prev["記事数"] || 0);
      const pvDiff   = prevPV  > 0 ? totalPV  - prevPV  : 0;
      const skDiff   = prevSK  > 0 ? totalSK  - prevSK  : 0;
      const artDiff  = prevArt > 0 ? totalArt - prevArt : 0;
      const firstPV  = parseInt(first["ビュー合計"] || first["pv"] || 0);
      const firstSK  = parseInt(first["スキ合計"]   || first["sk"] || 0);
      const pvGrowth = firstPV > 0 ? Math.round((totalPV - firstPV) / firstPV * 100) : 0;
      const skGrowth = firstSK > 0 ? Math.round((totalSK - firstSK) / firstSK * 100) : 0;

      const lastFollower  = followers.length > 0 ? parseInt(followers[followers.length-1]["フォロワー数"]||0) : 0;
      const prevFollower  = followers.length > 1 ? parseInt(followers[followers.length-2]["フォロワー数"]||0) : lastFollower;
      const followerDiff  = lastFollower - prevFollower;

      const followerUpMsgs   = ["ぇ？今日のワイの記事がいけてるん！？","フォロワー増えとる…なんか怖いんやけど笑","誰かワイのこと好きになってくれたん？ありがとな。","ちょっと待って、今日なんかいい記事書いたっけ？"];
      const followerDownMsgs = ["いや～、フォロワーが減ってもうた！","去った人よ、元気でな。","これがnoteの現実やな…（メモしとく）","減った分だけ、残った人が濃いってことにしとく。"];
      const followerFlatMsgs = ["今日はフォロワー動かず。嵐の前の静けさ？","現状維持。悪くない、悪くない。","誰も来ず、誰も去らず。平和な一日。"];
      const followerMsg = followerDiff > 0
        ? followerUpMsgs[Math.abs(followerDiff + new Date().getDate()) % followerUpMsgs.length]
        : followerDiff < 0
          ? followerDownMsgs[Math.abs(Math.abs(followerDiff) + new Date().getDate()) % followerDownMsgs.length]
          : followerFlatMsgs[new Date().getDate() % followerFlatMsgs.length];

      // フォロワー推移チャート用データ
      const follStep = Math.max(1, Math.floor(followers.length / 20));
      const followerChart = followers
        .filter((_,i) => i % follStep === 0 || i === followers.length - 1)
        .map(r => ({
          d: (r["日付"]||"").replace("2025/","").replace("2026/","").replace(/^0/,""),
          f: parseInt(r["フォロワー数"]||0),
        }))
        .filter(r => r.d && r.f > 0);

      const step = Math.max(1, Math.floor(daily.length / 16));
      const growthChart = daily.filter((_,i) => i % step === 0 || i === daily.length - 1)
        .map(r => ({
          d: (r["日付"]||"").replace("2025/","").replace("2026/","").replace(/^0/,""),
          v: parseInt(r["ビュー合計"]||0),
          s: parseInt(r["スキ合計"]||0),
        }));

      const EMOJIS = ["💀","🔧","🔬","🎨","⚗️"];
      const top5 = ranking.sort((a,b) => parseInt(b["期間増加PV"]||0) - parseInt(a["期間増加PV"]||0)).slice(0,5)
        .map((r,i) => ({
          rank: String(i+1).padStart(2,"0"),
          title:(r["title"]||"").replace(/ #\d+$/,"").slice(0,32),
          pv:   parseInt(r["期間増加PV"]||0),
          avg:  parseFloat(r["1日平均PV"]||0).toFixed(1),
          emoji:EMOJIS[i],
        }));

      const PV_EMOJIS = ["👑","🥈","🥉","🎖️","🏅"];
      const top5PV = latestArticles
        .filter(r => parseInt(r["read_count"]||0) > 0)
        .sort((a,b) => parseInt(b["read_count"]||0) - parseInt(a["read_count"]||0))
        .slice(0,5).map((r,i) => ({
          rank: String(i+1).padStart(2,"0"),
          title:(r["title"]||"").replace(/ #\d+$/,"").slice(0,32),
          val:  parseInt(r["read_count"]||0),
          emoji:PV_EMOJIS[i],
        }));

      const SK_EMOJIS = ["💖","💗","💓","💞","💝"];
      const skKey = articles[0] && (articles[0]["like_count"] !== undefined ? "like_count" : articles[0]["スキ数"] !== undefined ? "スキ数" : null);
      const top5SK = skKey
        ? latestArticles.filter(r => parseInt(r[skKey]||0) > 0)
            .sort((a,b) => parseInt(b[skKey]||0) - parseInt(a[skKey]||0))
            .slice(0,5).map((r,i) => ({
              rank: String(i+1).padStart(2,"00"),
              title:(r["title"]||"").replace(/ #\d+$/,"").slice(0,32),
              val:  parseInt(r[skKey]||0),
              emoji:SK_EMOJIS[i],
            }))
        : [];

      const trendCounts = {};
      trend.forEach(r => { const s = r["状態"]||r["state"]||""; trendCounts[s] = (trendCounts[s]||0) + 1; });
      const trendMap = {};
      trend.forEach(r => {
        const key = (r["title"]||r["記事タイトル"]||"").trim();
        trendMap[key] = r["状態"]||r["state"]||"";
      });

      const articleList = latestArticles
        .filter(r => (r["title"]||"").trim() !== "")
        .map(r => {
          const title  = (r["title"]||"").trim();
          const pv     = parseInt(r["read_count"]||0);
          const sk     = skKey ? parseInt(r[skKey]||0) : 0;
          const skRate = pv > 0 ? parseFloat((sk / pv * 100).toFixed(1)) : 0;
          const status = trendMap[title] || trendMap[title.replace(/ #\d+$/,"")] || "—";
          const url    = qualityUrlMap[title] || null;
          return { title, pv, sk, skRate, status, url };
        });

      // Hidden Gems: EXCLUDED_TITLES除外、低PV記事
      const hiddenGems = latestArticles
        .filter(r => {
          const title = (r["title"]||"").trim();
          return title !== "" &&
                 !EXCLUDED_TITLES.includes(title) &&
                 parseInt(r["read_count"]||0) > 0 &&
                 parseInt(r["read_count"]||0) < 200;
        })
        .sort((a,b) => {
          const skA = skKey ? parseInt(a[skKey]||0) : 0;
          const skB = skKey ? parseInt(b[skKey]||0) : 0;
          const pvA = parseInt(a["read_count"]||0);
          const pvB = parseInt(b["read_count"]||0);
          // スキ率が高いのに PV が少ない記事を優先
          const rateA = pvA > 0 ? skA / pvA : 0;
          const rateB = pvB > 0 ? skB / pvB : 0;
          return rateB - rateA;
        })
        .slice(0, 6)
        .map(r => {
          const title = (r["title"]||"").trim();
          return {
            title: title.replace(/ #\d+$/,"").slice(0,40),
            pv:    parseInt(r["read_count"]||0),
            sk:    skKey ? parseInt(r[skKey]||0) : 0,
            url:   qualityUrlMap[title] || "https://note.com/ktcrs1107",
          };
        });

      const ROASTS = ["タイトルだけで完結してた。","投稿した本人が一番驚いている。","来ると思ってた。来なかった。","短すぎたのか、長すぎたのか。謎は深まるばかり。","存在は確認されている。"];
      const worst3 = latestArticles
        .filter(r => parseInt(r["read_count"]||0) > 0 && !EXCLUDED_TITLES.includes((r["title"]||"").trim()))
        .sort((a,b) => parseInt(a["read_count"]||0) - parseInt(b["read_count"]||0))
        .slice(0,3).map((r,i) => ({
          title:(r["title"]||"").replace(/ #\d+$/,"").slice(0,28),
          pv:   parseInt(r["read_count"]||0),
          roast:ROASTS[i % ROASTS.length],
          url:   qualityUrlMap[(r["title"]||"").trim()] || null,
        }));

      const rising = trendCounts["🔥 急上昇"]||0, cont = trendCounts["🟢 継続"]||0,
            slow   = trendCounts["⚠️ 減速"] ||0, stop = trendCounts["💤 停止"] ||0;
      const skiRate = latest["スキ率(%)"]||latest["スキ率"]||"—";

      setData({
        totalPV, totalSK, totalArt, pvGrowth, skGrowth, pvDiff, skDiff, artDiff,
        lastFollower, followerDiff, followerMsg, followerChart,
        growthChart, top5, top5PV, top5SK, trendCounts, worst3, skiRate, articleList,
        hiddenGems,
        tickerText:`🔥 急上昇 ${rising}記事 · 🟢 継続 ${cont}記事 · ⚠️ 減速 ${slow}記事 · 💤 停止 ${stop}記事 · スキ率 ${parseFloat(skiRate).toFixed(1)}% · `,
        stopPct: totalArt > 0 ? Math.round(stop / (rising+cont+slow+stop||1) * 100) : 0,
        rising, cont, slow, stop,
        updatedAt: latest["日付"]||"",
      });
    }).catch(e => setError(e.message));
  }, []);
  return { data, error };
}

function useRankingData(file) {
  const [state, setState] = useState({ data: null, error: null, loaded: false });
  useEffect(() => {
    if (state.loaded) return;
    fetch(DATA_BASE + file)
      .then(r => { if (!r.ok) throw new Error(`${file} が見つかりません`); return r.json(); })
      .then(d  => setState({ data: d, error: null, loaded: true }))
      .catch(e => setState({ data: null, error: e.message, loaded: true }));
  }, [file, state.loaded]);
  return state;
}

function useBumpData() {
  const [state, setState] = useState({ data: null, error: null, loaded: false });
  useEffect(() => {
    if (state.loaded) return;
    fetch(DATA_BASE + "ranking_monthly_trace.csv")
      .then(r => { if (!r.ok) throw new Error("ranking_monthly_trace.csv が見つかりません"); return r.text(); })
      .then(text => {
        const rows = parseCSV(text);
        const filtered = rows.filter(r => !EXCLUDED_URLNAMES.has(r.creator_urlname));
        const dates = [...new Set(filtered.map(r => r.date))].sort();
        if (dates.length === 0) { setState({ data:{ dates:[], creators:[] }, error:null, loaded:true }); return; }
        const rowLookup = {};
        filtered.forEach(r => {
          if (!rowLookup[r.like_user_id]) rowLookup[r.like_user_id] = {};
          rowLookup[r.like_user_id][r.date] = r;
        });
        const lastDate = dates[dates.length - 1];
        const topRows = filtered.filter(r => r.date === lastDate)
          .sort((a,b) => { const diff = parseInt(b.likes_count_cumulative) - parseInt(a.likes_count_cumulative); return diff !== 0 ? diff : parseInt(a.rank) - parseInt(b.rank); })
          .slice(0, BUMP_FETCH_N);
        const creators = topRows.map((lastRow, i) => {
          const uid = lastRow.like_user_id;
          return {
            like_user_id:    uid,
            creator_name:    lastRow.creator_name   || uid,
            creator_url:     lastRow.creator_url    || "",
            has_profile_url: lastRow.has_profile_url === "True",
            color:           BUMP_COLORS[i % BUMP_COLORS.length],
            counts:      dates.map(d => rowLookup[uid]?.[d] ? parseInt(rowLookup[uid][d].likes_count_cumulative) : null),
            dailyCounts: dates.map(d => rowLookup[uid]?.[d] ? parseInt(rowLookup[uid][d].likes_count_daily)      : null),
            ranks:       dates.map(d => rowLookup[uid]?.[d] ? parseInt(rowLookup[uid][d].rank)                   : null),
            followers:   dates.map(d => rowLookup[uid]?.[d] ? parseInt(rowLookup[uid][d].follower_count)         : null),
          };
        });
        const labelDates = dates.map(d => { const [,m,day] = d.split("-"); return `${parseInt(m)}/${parseInt(day)}`; });
        setState({ data:{ dates: labelDates, creators }, error:null, loaded:true });
      })
      .catch(e => setState({ data:null, error:e.message, loaded:true }));
  }, [state.loaded]);
  return state;
}

/* ─────────────────────────────────────────────
   SHARED UI COMPONENTS
───────────────────────────────────────────── */
function SectionEyebrow({ color = OR, children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"var(--fm)", fontSize:11, letterSpacing:3, color, marginBottom:16 }}>
      <span style={{ width:20, height:1, background:color, display:"inline-block" }} />
      {children}
    </div>
  );
}

function SectionTitle({ children, style: s = {} }) {
  return (
    <h2 style={{ fontFamily:"var(--fd)", fontSize:"clamp(36px,8vw,72px)", lineHeight:.9, marginBottom:12, color:TEXT, ...s }}>
      {children}
    </h2>
  );
}

function CustomTooltipDark({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"10px 14px", fontSize:12, color:TEXT, fontFamily:"var(--fj)", boxShadow:"0 8px 32px rgba(0,0,0,0.6)" }}>
      {label && <div style={{ fontSize:10, color:"var(--muted2)", fontFamily:"var(--fm)", letterSpacing:1, marginBottom:6 }}>{label}</div>}
      {formatter ? formatter(payload) : payload.map((p,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:p.stroke||p.fill }} />
          <span>{p.name}: </span>
          <span style={{ fontFamily:"var(--fd)", fontSize:16, color:p.stroke||p.fill }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ARTICLE LIST PAGE
───────────────────────────────────────────── */
function ArticleListPage({ data, isMobile }) {
  const [query,        setQuery]        = useState("");
  const [sortKey,      setSortKey]      = useState("pv");
  const [statusFilter, setStatusFilter] = useState("すべて");
  const [page,         setPage]         = useState(1);
  const PER_PAGE = 20;

  const filtered = useMemo(() => {
    if (!data?.articleList) return [];
    return data.articleList
      .filter(a => {
        const matchQ = query === "" || a.title.toLowerCase().includes(query.toLowerCase());
        const matchS = statusFilter === "すべて" || a.status === statusFilter;
        return matchQ && matchS;
      })
      .sort((a,b) => {
        if (sortKey === "pv")     return b.pv - a.pv;
        if (sortKey === "sk")     return b.sk - a.sk;
        if (sortKey === "skRate") return b.skRate - a.skRate;
        return 0;
      });
  }, [data, query, sortKey, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const maxPV = filtered[0]?.pv || 1;

  useEffect(() => setPage(1), [query, sortKey, statusFilter]);

  return (
    <div className="page-fade" style={{ minHeight:"100vh", background:INK, color:TEXT, padding:0 }}>
      <div style={{ padding: isMobile?"28px 16px 0":"52px 40px 0", maxWidth:960, margin:"0 auto" }}>
        <SectionEyebrow color={OR}>ARTICLES</SectionEyebrow>
        <SectionTitle>記事一覧</SectionTitle>
        <p style={{ fontSize:13, color:"var(--muted2)", marginBottom:32 }}>
          {data ? `全${data.articleList.length}記事` : "読み込み中…"}
        </p>

        <input className="search-input" placeholder="タイトルで検索…" value={query} onChange={e=>setQuery(e.target.value)} style={{ marginBottom:16 }} />

        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
          {["pv","sk","skRate"].map(k => (
            <button key={k} className={`sort-btn${sortKey===k?" active":""}`} onClick={()=>setSortKey(k)}>
              {k==="pv"?"PV順":k==="sk"?"スキ順":"スキ率順"}
            </button>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", gap:6, flexWrap:"wrap" }}>
            {STATUS_LIST.map(s => (
              <button key={s} className={`filter-chip${statusFilter===s?" active":""}`} onClick={()=>setStatusFilter(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:"0 auto", padding:isMobile?"0 16px 80px":"0 40px 80px" }}>
        {!data
          ? [1,2,3,4,5].map(i=><Skeleton key={i} w="100%" h={52} style={{ marginBottom:8 }} />)
          : paged.length === 0
            ? <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--muted)", fontSize:14 }}>記事が見つかりません</div>
            : paged.map((a,idx) => {
                const sc = STATUS_COLOR[a.status] || "var(--muted)";
                return (
                  <div key={idx} className="article-row"
                    onClick={() => a.url && window.open(a.url,"_blank","noopener")}
                    style={{ display:"grid", gridTemplateColumns:isMobile?"auto 1fr auto":"auto 1fr auto auto auto auto", alignItems:"center", gap:isMobile?10:16, padding:isMobile?"10px 8px":"14px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)", borderRadius:6 }}>
                    <div style={{ fontFamily:"var(--fd)", fontSize:isMobile?22:28, color:"rgba(255,255,255,0.15)", lineHeight:1, minWidth:isMobile?32:40, textAlign:"right" }}>
                      {(page-1)*PER_PAGE+idx+1}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:isMobile?12:14, fontWeight:700, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</div>
                      {isMobile && <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>PV {a.pv.toLocaleString()} · ♡{a.sk} · {a.status}</div>}
                      <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2, marginTop:6, overflow:"hidden" }}>
                        <div style={{ height:"100%", background:OR, width:`${(a.pv/maxPV)*100}%`, borderRadius:2, opacity:.5 }} />
                      </div>
                    </div>
                    <div style={{ textAlign:"right", fontFamily:"var(--fd)", fontSize:isMobile?18:20, color:OR, lineHeight:1 }}>{a.pv.toLocaleString()}</div>
                    {!isMobile && <>
                      <div style={{ textAlign:"right", fontFamily:"var(--fd)", fontSize:20, color:BL, lineHeight:1 }}>{a.sk}</div>
                      <div style={{ textAlign:"right", fontSize:12, color:"var(--muted)" }}>{a.skRate}%</div>
                      <div style={{ textAlign:"center" }}>
                        <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:10, fontFamily:"var(--fs)", letterSpacing:.5, background:`${sc}18`, color:sc, border:`1px solid ${sc}33`, whiteSpace:"nowrap" }}>{a.status}</span>
                      </div>
                    </>}
                  </div>
                );
              })
        }
        {totalPages > 1 && (
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:32, flexWrap:"wrap" }}>
            {Array.from({ length:totalPages }, (_,i)=>i+1).map(n => (
              <button key={n} onClick={()=>{ setPage(n); window.scrollTo({ top:0, behavior:"smooth" }); }}
                style={{ width:36, height:36, borderRadius:"50%", background:n===page?OR:"rgba(255,255,255,0.05)", border:`1px solid ${n===page?OR:"rgba(255,255,255,0.1)"}`, color:n===page?"#fff":"var(--muted2)", fontFamily:"var(--fs)", fontSize:11, cursor:"pointer", transition:"all .18s" }}
              >{n}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RANKING PAGE COMPONENTS
───────────────────────────────────────────── */
function RankSkeleton({ isMobile }) {
  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
        {[0,1,2].map(i=><Skeleton key={i} w="100%" h={isMobile?120:160} style={{ borderRadius:14 }} />)}
      </div>
      {[0,1,2,3].map(i=>(
        <div key={i} style={{ display:"flex", gap:12, padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <Skeleton w={40} h={18} />
          <Skeleton w={`${50+i*10}%`} h={18} />
          <div style={{ marginLeft:"auto" }}><Skeleton w={48} h={18} /></div>
        </div>
      ))}
    </>
  );
}

function HeroCard({ row, isMobile }) {
  const idx     = row.rank - 1;
  const url     = row.has_profile_url ? row.creator_url : null;
  const mc      = MEDAL_COLOR[idx] ?? "rgba(255,255,255,0.2)";
  const isFirst = idx === 0;

  const inner = (
    <div className="rank-card" style={{
      background: isFirst ? "linear-gradient(135deg,#1a0800,#0f0500)" : "rgba(255,255,255,0.04)",
      border: `1px solid ${isFirst ? `${OR}55` : "rgba(255,255,255,0.1)"}`,
      padding: isMobile?"18px 14px":"26px 22px", height:"100%",
    }}>
      {url && <div className="cta-layer"><span className="cta-text">プロフィールへ →</span></div>}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:isFirst?26:20 }}>{MEDAL[idx]}</span>
        <span style={{ fontFamily:"var(--fd)", fontSize:isFirst?(isMobile?52:68):(isMobile?38:52), color:mc, lineHeight:1, letterSpacing:-1 }}>
          {String(row.rank).padStart(2,"0")}
        </span>
      </div>
      <div style={{ fontSize:isMobile?13:15, fontWeight:700, color:isFirst?TEXT:"rgba(255,255,255,0.75)", lineHeight:1.4, marginBottom:12, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
        {row.creator_name}
      </div>
      <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
        <span style={{ fontFamily:"var(--fd)", fontSize:isFirst?(isMobile?38:50):(isMobile?30:38), color:mc, lineHeight:1 }}>
          {Number(row.likes_count).toLocaleString()}
        </span>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"var(--fs)", letterSpacing:1 }}>スキ</span>
      </div>
      <div style={{ marginTop:10, fontSize:10, color:"rgba(255,255,255,0.25)", fontFamily:"var(--fm)", letterSpacing:.5 }}>
        最終 {fmtDate(row.last_like_at)}
      </div>
      {!url && <div style={{ marginTop:8, fontSize:9, color:"rgba(255,255,255,0.15)", fontFamily:"var(--fs)" }}>URL未設定</div>}
    </div>
  );
  return url
    ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none", display:"block", height:"100%" }}>{inner}</a>
    : inner;
}

function RankRow({ row, isMobile }) {
  const url = row.has_profile_url ? row.creator_url : null;
  const inner = (
    <div className="rank-row" style={{
      display:"grid",
      gridTemplateColumns:isMobile?"48px 1fr 56px":"56px 1fr 80px 100px 90px",
      gap:isMobile?10:16, padding:isMobile?"12px 10px":"14px 20px", alignItems:"center",
      borderBottom:"1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ fontFamily:"var(--fd)", fontSize:isMobile?24:28, color:"rgba(255,255,255,0.2)", lineHeight:1, textAlign:"center" }}>{row.rank}</div>
      <div style={{ fontSize:isMobile?12:13, fontWeight:700, color:"rgba(255,255,255,0.8)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.creator_name}</div>
      <div style={{ textAlign:"right", fontFamily:"var(--fd)", fontSize:isMobile?20:22, color:TEXT, lineHeight:1 }}>
        {Number(row.likes_count).toLocaleString()}
        <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", fontFamily:"var(--fs)", letterSpacing:.5 }}>スキ</div>
      </div>
      {!isMobile && <div style={{ textAlign:"right", fontSize:10, color:"rgba(255,255,255,0.25)" }}>{fmtDate(row.last_like_at)}</div>}
      {!isMobile && (
        <div className="row-cta" style={{ textAlign:"right" }}>
          {url && <span style={{ display:"inline-block", padding:"4px 12px", borderRadius:16, fontSize:10, fontFamily:"var(--fs)", letterSpacing:1, color:"#fff", background:OR, whiteSpace:"nowrap" }}>見に行く →</span>}
        </div>
      )}
    </div>
  );
  return url
    ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none", display:"block" }}>{inner}</a>
    : inner;
}

function MonthlyChart({ items, isMobile }) {
  const chartData = [...items].sort((a,b)=>b.likes_count-a.likes_count)
    .map(r => ({ name:r.creator_name.length>12?r.creator_name.slice(0,11)+"…":r.creator_name, fullName:r.creator_name, count:r.likes_count, url:r.has_profile_url?r.creator_url:null }));
  const maxCount = Math.max(...chartData.map(d=>d.count), 1);

  return (
    <div style={{ marginTop:8 }}>
      <ResponsiveContainer width="100%" height={isMobile?chartData.length*38+20:chartData.length*44+20}>
        <BarChart data={chartData} layout="vertical" margin={{ top:0, right:isMobile?60:80, left:0, bottom:0 }} barCategoryGap="30%">
          <XAxis type="number" hide domain={[0,maxCount*1.15]} />
          <YAxis type="category" dataKey="name" width={isMobile?110:150}
            tick={{ fill:"rgba(255,255,255,0.5)", fontSize:isMobile?10:12, fontFamily:"'Noto Sans JP',sans-serif" }}
            axisLine={false} tickLine={false} />
          <Tooltip content={({ active, payload }) => {
            if (!active||!payload?.[0]) return null;
            const d = payload[0].payload;
            return (
              <div style={{ background:"#111", border:`1px solid ${OR}33`, borderRadius:10, padding:"10px 14px", fontSize:12, color:TEXT, fontFamily:"var(--fj)", boxShadow:"0 8px 24px rgba(0,0,0,0.8)" }}>
                <div style={{ fontWeight:700, marginBottom:4, maxWidth:200 }}>{d.fullName}</div>
                <div style={{ fontFamily:"var(--fd)", fontSize:22, color:OR, lineHeight:1 }}>{d.count} <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"var(--fs)" }}>スキ</span></div>
              </div>
            );
          }} cursor={{ fill:"rgba(255,255,255,0.04)" }} />
          <Bar dataKey="count" radius={[0,6,6,0]} isAnimationActive animationDuration={600}>
            {chartData.map((entry,i)=>(
              <Cell key={i} fill={i===0?OR:i<3?`${OR}66`:"rgba(255,255,255,0.1)"}
                style={{ cursor:entry.url?"pointer":"default" }}
                onClick={()=>entry.url&&window.open(entry.url,"_blank","noopener")} />
            ))}
            <LabelList dataKey="count" position="right"
              style={{ fill:"rgba(255,255,255,0.6)", fontSize:isMobile?11:13, fontFamily:"'Bebas Neue'", letterSpacing:1 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)", textAlign:"right", marginTop:8, fontFamily:"var(--fs)", letterSpacing:1 }}>バーをクリックでプロフィールへ</p>
    </div>
  );
}

function GrowthRaceChart({ bumpState, isMobile }) {
  const [hovered, setHovered] = useState(null);
  const [hidden,  setHidden]  = useState(new Set());
  const [topN,    setTopN]    = useState(10);

  if (!bumpState.loaded) return <RankSkeleton isMobile={isMobile} />;
  if (bumpState.error) return <div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,0.15)", fontSize:14 }}>⚠️ {bumpState.error}</div>;
  if (!bumpState.data?.creators?.length) return <div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,0.15)", fontSize:14 }}>データがありません</div>;

  const { dates, creators: allCreators } = bumpState.data;
  const creators = allCreators.slice(0, topN);
  const toggleHidden = uid => { setHidden(prev => { const next=new Set(prev); next.has(uid)?next.delete(uid):next.add(uid); return next; }); };

  const chartData = dates.map((label,di) => {
    const row = { date:label };
    creators.forEach(c => { if (!hidden.has(c.like_user_id)) row[c.like_user_id] = c.counts[di] ?? null; });
    return row;
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active||!payload?.length) return null;
    const di = dates.findIndex(d=>d===label);
    const sorted = [...payload].filter(p=>p.value!=null).sort((a,b)=>b.value-a.value);
    return (
      <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"10px 14px", minWidth:200, boxShadow:"0 8px 32px rgba(0,0,0,0.9)", maxHeight:360, overflowY:"auto", fontFamily:"var(--fj)" }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"var(--fm)", letterSpacing:1, marginBottom:8 }}>{label}</div>
        {sorted.map(p => {
          const c = creators.find(cr=>cr.like_user_id===p.dataKey);
          if (!c) return null;
          const rank=di>=0?c.ranks[di]:null, daily=di>=0?c.dailyCounts[di]:null, follower=di>=0?c.followers[di]:null;
          return (
            <div key={p.dataKey} style={{ marginBottom:8, paddingBottom:8, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:p.stroke, display:"inline-block", flexShrink:0 }} />
                <span style={{ fontSize:11, color:"#fff", fontWeight:700, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:150 }}>{c.creator_name}</span>
                {rank!=null&&<span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:"var(--fs)", flexShrink:0 }}>#{rank}位</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px 12px", paddingLeft:14, fontSize:10, color:"rgba(255,255,255,0.4)" }}>
                <div>累計 <span style={{ fontFamily:"var(--fd)", fontSize:15, color:p.stroke }}>{p.value}</span></div>
                {daily!=null&&<div>本日 <span style={{ fontFamily:"var(--fd)", fontSize:15, color:"rgba(255,255,255,0.7)" }}>+{daily}</span></div>}
                {follower!=null&&<div style={{ gridColumn:"1/-1" }}>フォロワー <span style={{ fontFamily:"var(--fd)", fontSize:15, color:"rgba(255,255,255,0.7)" }}>{follower.toLocaleString()}</span></div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const CustomDot = props => {
    const { cx, cy, dataKey, value } = props;
    if (value==null||hovered!==dataKey) return null;
    const c = creators.find(cr=>cr.like_user_id===dataKey);
    return <circle cx={cx} cy={cy} r={5} fill={c?.color??"#fff"} stroke={INK} strokeWidth={1.5} />;
  };

  const visibleCount = creators.filter(c=>!hidden.has(c.like_user_id)).length;

  return (
    <div style={{ marginTop:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
        {allCreators.length>10 && (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontFamily:"var(--fs)", letterSpacing:1 }}>表示人数</span>
            {[10,20].filter(n=>n<=allCreators.length).map(n=>(
              <button key={n} className={`sort-btn${topN===n?" active":""}`} style={{ padding:"4px 12px" }} onClick={()=>{ setTopN(n); setHidden(new Set()); }}>TOP {n}</button>
            ))}
          </div>
        )}
        {hidden.size>0&&<button className="sort-btn" style={{ padding:"4px 12px", color:OR, borderColor:`${OR}55` }} onClick={()=>setHidden(new Set())}>全員表示</button>}
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:isMobile?6:8, marginBottom:16 }}>
        {creators.map(c => {
          const isHid=hidden.has(c.like_user_id), dimmed=!isHid&&hovered&&hovered!==c.like_user_id;
          return (
            <div key={c.like_user_id} title={isHid?"クリックで表示":"クリックで非表示"}
              style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer", userSelect:"none", opacity:isHid||dimmed?.25:1, transition:"opacity .18s" }}
              onClick={()=>toggleHidden(c.like_user_id)}
              onMouseEnter={()=>{ if(!isHid) setHovered(c.like_user_id); }}
              onMouseLeave={()=>setHovered(null)}>
              <span style={{ width:10, height:10, borderRadius:"50%", display:"inline-block", flexShrink:0, background:isHid?"transparent":c.color, border:isHid?`2px solid ${c.color}`:"none", boxSizing:"border-box" }} />
              <span style={{ fontSize:isMobile?9:10, color:"rgba(255,255,255,0.6)", fontFamily:"var(--fj)", maxWidth:isMobile?72:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textDecoration:isHid?"line-through":"none" }}>
                {c.has_profile_url
                  ? <a href={c.creator_url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ color:"inherit", textDecoration:"none", pointerEvents:isHid?"none":"auto" }}>{c.creator_name}</a>
                  : c.creator_name}
              </span>
            </div>
          );
        })}
      </div>
      {visibleCount===0
        ? <div style={{ textAlign:"center", padding:"40px 20px", color:"rgba(255,255,255,0.15)", fontSize:13 }}>凡例から表示したいクリエイターを選んでください</div>
        : (
          <ResponsiveContainer width="100%" height={isMobile?260:340}>
            <LineChart data={chartData} margin={{ top:8, right:isMobile?8:16, left:isMobile?-16:0, bottom:4 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill:"rgba(255,255,255,0.25)", fontSize:isMobile?9:11, fontFamily:"var(--fs)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"rgba(255,255,255,0.2)", fontSize:isMobile?9:10, fontFamily:"var(--fd)" }} axisLine={false} tickLine={false} width={isMobile?28:32}
                label={!isMobile?{ value:"累計スキ数", angle:-90, position:"insideLeft", fill:"rgba(255,255,255,0.15)", fontSize:10, fontFamily:"var(--fj)", dx:-4 }:undefined} />
              <Tooltip content={<CustomTooltip />} />
              {creators.map(c => {
                if (hidden.has(c.like_user_id)) return null;
                const isHov = hovered===c.like_user_id;
                return (
                  <Line key={c.like_user_id} type="monotone" dataKey={c.like_user_id}
                    stroke={c.color} strokeWidth={isHov?3:hovered?1:1.8}
                    strokeOpacity={hovered&&!isHov?.15:1}
                    dot={<CustomDot />}
                    activeDot={isHov?{ r:6, fill:c.color, stroke:INK, strokeWidth:2 }:false}
                    connectNulls={false} isAnimationActive animationDuration={700}
                    onMouseEnter={()=>setHovered(c.like_user_id)}
                    onMouseLeave={()=>setHovered(null)}
                    style={{ cursor:c.has_profile_url?"pointer":"default" }}
                    onClick={()=>c.has_profile_url&&window.open(c.creator_url,"_blank","noopener")} />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )
      }
      <p style={{ fontSize:10, color:"rgba(255,255,255,0.18)", textAlign:"right", marginTop:6, fontFamily:"var(--fs)", letterSpacing:1 }}>凡例クリックで表示/非表示 · 名前または線クリックでプロフィールへ</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RANKING PAGE
───────────────────────────────────────────── */
function LikesRankingPage({ isMobile }) {
  const [period,   setPeriod]   = useState("total");
  const [viewMode, setViewMode] = useState("rank");

  const total    = useRankingData("ranking_total.json");
  const monthly  = useRankingData("ranking_monthly.json");
  const lastWeek = useRankingData("ranking_last_week.json");
  const bump     = useBumpData();

  const stateMap  = { total, monthly, last_week: lastWeek };
  const active    = stateMap[period];
  const periodCfg = RANK_PERIODS.find(p=>p.id===period);
  const items = (active.data?.items ?? [])
    .filter(r=>![...EXCLUDED_URLNAMES].some(u=>(r.creator_url||"").includes(u)))
    .slice(0, periodCfg.top);
  const top3=items.slice(0,3), rest=items.slice(3);
  const genAt=active.data?.generated_at?.slice(0,10).replace(/-/g,"/")??null;
  const periodLabel=buildPeriodLabel(active.data, period);

  useEffect(() => { if (!periodCfg.hasChart&&viewMode!=="rank") setViewMode("rank"); }, [period, periodCfg.hasChart]);

  const VIEW_MODES = periodCfg.hasChart
    ? [{ id:"rank", icon:"☰", tip:"ランク" },{ id:"chart", icon:"▬", tip:"チャート" },{ id:"race", icon:"↗", tip:"レース" }]
    : [];

  return (
    <div className="page-fade" style={{ minHeight:"100vh", background:INK, color:TEXT }}>
      <div style={{ padding:isMobile?"28px 16px 0":"52px 40px 0", maxWidth:960, margin:"0 auto" }}>
        <SectionEyebrow color={OR}>RANKING</SectionEyebrow>
        <SectionTitle>スキしてくれた人たち</SectionTitle>
        <p style={{ fontSize:12, color:"var(--muted2)", marginBottom:32, letterSpacing:.5 }}>
          {active.error?`⚠️ ${active.error}`:genAt?`集計日 ${genAt} — 気になる人を見つけたら、プロフィールへ飛んでみて`:"読み込み中…"}
        </p>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:periodLabel?16:40, flexWrap:"wrap" }}>
          {RANK_PERIODS.map(p=>(
            <button key={p.id} className="tab-btn" onClick={()=>setPeriod(p.id)}
              style={{ padding:isMobile?"7px 18px":"9px 24px", borderRadius:28, fontSize:11, letterSpacing:2, fontFamily:"var(--fs)", fontWeight:700, textTransform:"uppercase",
                       color:period===p.id?"#fff":"rgba(255,255,255,0.35)",
                       background:period===p.id?OR:"transparent",
                       border:`1.5px solid ${period===p.id?OR:"rgba(255,255,255,0.15)"}`,
                       transition:"all .2s cubic-bezier(.22,1,.36,1)" }}>
              {p.label}
              {period===p.id&&<span style={{ marginLeft:6, fontSize:9, opacity:.7 }}>TOP {p.top}</span>}
            </button>
          ))}
          {VIEW_MODES.length>0&&items.length>0&&(
            <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>
              {VIEW_MODES.map(v=>(
                <button key={v.id} className="tab-btn" onClick={()=>setViewMode(v.id)} title={v.tip}
                  style={{ padding:"7px 14px", borderRadius:20, fontSize:14,
                           color:viewMode===v.id?TEXT:"rgba(255,255,255,0.25)",
                           background:viewMode===v.id?"rgba(255,255,255,0.1)":"transparent",
                           border:`1px solid ${viewMode===v.id?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.1)"}`,
                           transition:"all .18s" }}>{v.icon}</button>
              ))}
            </div>
          )}
        </div>

        {periodLabel&&(
          <div style={{ marginBottom:32 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"6px 16px" }}>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:"var(--fs)", letterSpacing:1 }}>集計期間</span>
              <span style={{ fontSize:13, fontWeight:700, color:TEXT, fontFamily:"var(--fj)" }}>{periodLabel}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth:960, margin:"0 auto", padding:isMobile?"0 16px 80px":"0 40px 80px" }}>
        {!active.loaded&&<RankSkeleton isMobile={isMobile} />}
        {active.error&&<div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,0.15)", fontSize:14 }}>⚠️ {active.error}</div>}
        {active.loaded&&!active.error&&items.length===0&&<div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,0.15)", fontSize:14 }}>この期間のデータがありません</div>}

        {viewMode==="chart"&&items.length>0&&<MonthlyChart items={items} isMobile={isMobile} />}
        {viewMode==="race"&&<GrowthRaceChart bumpState={bump} isMobile={isMobile} />}

        {viewMode==="rank"&&(
          <>
            {top3.length>0&&(
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":`repeat(${top3.length},1fr)`, gap:12, marginBottom:8 }}>
                {top3.map(row=><HeroCard key={row.like_user_id} row={row} isMobile={isMobile} />)}
              </div>
            )}
            {rest.length>0&&(
              <div style={{ marginTop:8 }}>
                {!isMobile&&(
                  <div style={{ display:"grid", gridTemplateColumns:"56px 1fr 80px 100px 90px", gap:16, padding:"8px 20px", fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"var(--fs)", letterSpacing:1.5, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div>RANK</div><div>CREATOR</div>
                    <div style={{ textAlign:"right" }}>スキ</div>
                    <div style={{ textAlign:"right" }}>最終スキ日</div>
                    <div />
                  </div>
                )}
                {rest.map(row=><RankRow key={row.like_user_id} row={row} isMobile={isMobile} />)}
              </div>
            )}
          </>
        )}
      </div>

      {items.length>0&&(
        <div style={{ padding:isMobile?"0 16px 60px":"0 40px 60px", maxWidth:960, margin:"0 auto" }}>
          <div style={{ background:"rgba(255,255,255,0.03)", border:`1px dashed ${OR}44`, borderRadius:12, padding:isMobile?"16px":"24px 28px", display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
            <div style={{ fontSize:28 }}>💡</div>
            <div style={{ flex:1, minWidth:180 }}>
              <div style={{ fontFamily:"var(--fs)", fontWeight:700, fontSize:13, color:TEXT }}>
                スキを押すと、ここにあなたの名前が載るかも。
              </div>
              <div style={{ fontSize:12, color:"var(--muted2)", marginTop:4, lineHeight:1.6 }}>
                毎月・先週・総合の3つのランキングがある。まだ名前のない人は、今月中に押しに来て。
              </div>
            </div>
            <a href="https://note.com/ktcrs1107" target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-block", padding:"10px 24px", borderRadius:4, background:OR, color:"#fff", fontSize:12, fontFamily:"var(--fs)", fontWeight:700, letterSpacing:2, textDecoration:"none", whiteSpace:"nowrap", transition:"all .2s" }}>
              note を読む →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PICKUP PAGE (おすすめ) — preserved from original
───────────────────────────────────────────── */
function PickupPage({ isMobile }) {
  const heroArticles = [
    { title:"KITAcoreのAI×思考ログへようこそ — プロンプト設計、アート、そして人生のログプレイ", tag:"START HERE", url:"https://note.com/ktcrs1107/n/n07d5d073e524", desc:"まず読んでほしい固定記事。ワイが何者で、何をしてるかが全部入ってる。" },
    { title:"初速スキとバズの相関分析：その因果関係を解明する", tag:"DATA ANALYSIS", url:"https://note.com/ktcrs1107/n/n5f594f849c4b", desc:"note記事の最初の1時間が全てを決めるという仮説を、データで検証した。" },
  ];
  const magazineGroups = [
    {
      name:"KITAcore ORIGINALS",
      items:[
        { title:"AI×DATA LOG", desc:"毎日の実験ログ。プロンプト設計から失敗まで全記録。", url:"https://note.com/ktcrs1107/m/m9c1bd0dc9a3e", icon:"🧪" },
        { title:"AIアート実験室", desc:"画像生成AIの技法研究と試行錯誤の記録。", url:"https://note.com/ktcrs1107/m/m3c61f7e05cf9", icon:"🎨" },
        { title:"Python Odyssey", desc:"自動化と試行錯誤の全記録。", url:"https://note.com/ktcrs1107/m/md1c85d0a934b", icon:"🐍" },
        { title:"Selected List", desc:"再読に値する特選記事アーカイブ。", url:"https://note.com/ktcrs1107/m/m779b42e18707", icon:"🔖" },
      ]
    },
    {
      name:"COLLABORATIONS",
      items:[
        { title:"AI-LA（アイラ）", desc:"共同参加中のマガジン。", url:"https://note.com/supertoraneko/m/mc6810aa41870", icon:"🤝" },
        { title:"漆黒の絶対領域", desc:"共同参加中のマガジン。", url:"https://note.com/hitsuji_natsume/m/m41a7aa3dcc38", icon:"🌑" },
        { title:"集まれ！白銀の髪同盟", desc:"共同参加中のマガジン。", url:"https://note.com/reipichu/m/m8fb499ecbcbb", icon:"❄️" },
        { title:"ダークファンタジー図書館", desc:"共同参加中のマガジン。", url:"https://note.com/shio_batapopcorn/m/mc085f157d924", icon:"🏛️" },
        { title:"OASOBI会", desc:"共同参加中のマガジン。", url:"https://note.com/maiyu_x_ai/m/m96728bd6b208", icon:"🎉" },
        { title:"note×AI活用推進", desc:"共同参加中のマガジン。", url:"https://note.com/mugimugi92/m/md2a022132e8f", icon:"🚀" },
      ]
    }
  ];
  const premiumGroups = [
    {
      name:"STRATEGY & LOGIC",
      items:[
        { title:"初速スキとバズの相関分析：その因果関係を解明する", tag:"ANALYSIS", url:"https://note.com/ktcrs1107/n/n5f594f849c4b" },
        { title:"Note閲覧数・スキ数の自動収集システム実装ガイド", tag:"TOOL", url:"https://note.com/ktcrs1107/n/ne2bb6d38c4e3" },
        { title:"データ構造から逆算したnoteタグ戦略の深淵", tag:"STRATEGY", url:"https://note.com/ktcrs1107/n/n1d32162cd219" },
        { title:"Platformアルゴリズム公開の背景とその意図を読み解く", tag:"LOGIC", url:"https://note.com/ktcrs1107/n/n5f991f7606e9" },
        { title:"全記事データの自動抽出とスプレッドシート連携法", tag:"AUTO", url:"https://note.com/ktcrs1107/n/ndb86a66932ee" },
        { title:"Note非公式APIの機能解析と活用可能性の整理", tag:"REPORT", url:"https://note.com/ktcrs1107/n/n3ab972786aa0" },
      ]
    },
    {
      name:"ARTISTRY & TECHNIQUES",
      items:[
        { title:"群衆プロンプトの自由制御：巨大な集合体を生成する技法", tag:"TECH", url:"https://note.com/ktcrs1107/n/n07197895a3e9" },
        { title:"プロンプト公開版：切り抜き×逆光×投影の再現技法", tag:"ART", url:"https://note.com/ktcrs1107/n/n86e1c6ff59e1" },
        { title:"水彩迷子を救った「妖怪」と「4つの縛り」の解説", tag:"WATERCOLOR", url:"https://note.com/ktcrs1107/n/n0323b9955abb" },
        { title:"文字にキャラを埋め込むプロンプト設計", tag:"TYPE", url:"https://note.com/ktcrs1107/n/n5c5913089d08" },
        { title:"アメコミホラーを制御するYAML構造化とコンパイル技法", tag:"YAML", url:"https://note.com/ktcrs1107/n/nd9fa08da2f22" },
        { title:"ダブルエクスポージャー再現：混ぜない、重ねる投影の技法", tag:"DOUBLE", url:"https://note.com/ktcrs1107/n/nb392a506a3e1" },
        { title:"12干支に変換するキーと11体コピペ集", tag:"ZODIAC", url:"https://note.com/ktcrs1107/n/nfe75462bec74" },
        { title:"Nano Banana Proで映画BTSごっこを楽しむ沼の話", tag:"PRO", url:"https://note.com/ktcrs1107/n/n8787acd84304" },
      ]
    },
    {
      name:"PROMPT ENGINEERING",
      items:[
        { title:"JSON構造プロンプトの汎用化：あらゆる対象への横展開フレーム", tag:"FRAME", url:"https://note.com/ktcrs1107/n/n023ff6bdcf19" },
        { title:"NanoBanana 構造化設計：画像生成を運から論理へ変える全貌", tag:"ENGINE", url:"https://note.com/ktcrs1107/n/n12201dd9b5ff" },
        { title:"プロンプト順序が生成結果に与える影響の定量的考察", tag:"STUDY", url:"https://note.com/ktcrs1107/n/n1cb447965e43" },
        { title:"衆院選×日経平均：AIに株価シナリオを描かせてみる実験", tag:"ECONOMY", url:"https://note.com/ktcrs1107/n/n4c64f88ab49b" },
        { title:"KITAcore流プロンプトエンジニアリング：呪文を卒業するカリキュラム", tag:"CURRICULUM", url:"https://note.com/ktcrs1107/n/nfb6b2d84dfc9" },
        { title:"AIにプロの調査ルールを移植し、リサーチを効率化する技法", tag:"ANALYST", url:"https://note.com/ktcrs1107/n/n38437d0f3242" },
        { title:"プロンプトエンジニアリングにおける「ズル技」の体系化", tag:"HACK", url:"https://note.com/ktcrs1107/n/n8ded3116a32b" },
        { title:"AIとの対話ログから自己の思考傾向を丸裸にする試み", tag:"LOG", url:"https://note.com/ktcrs1107/n/ne2173e797345" },
      ]
    }
  ];

  return (
    <div className="page-fade" style={{ minHeight:"100vh", background:INK, color:TEXT, paddingBottom:100 }}>
      <div style={{ padding:isMobile?"28px 16px 0":"52px 40px 0", maxWidth:960, margin:"0 auto" }}>
        <SectionEyebrow color={BL}>CURATION</SectionEyebrow>
        <SectionTitle>PICK UP & SERIES</SectionTitle>
      </div>
      <div style={{ maxWidth:960, margin:"0 auto", padding:isMobile?"0 16px":"0 40px" }}>
        <section style={{ marginBottom:60 }}>
          <div style={{ fontSize:14, fontFamily:"var(--fd)", letterSpacing:2, color:OR, borderBottom:`1px solid ${OR}44`, paddingBottom:8, marginBottom:20 }}>01. START HERE</div>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1.8fr 1.2fr", gap:16 }}>
            {heroArticles.map((hero,idx)=>(
              <a key={idx} href={hero.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
                <div className="rank-card" style={{ background:idx===0?"linear-gradient(135deg,#1a0800,#0a0400)":"rgba(255,255,255,0.04)", border:`1px solid ${idx===0?`${OR}55`:"rgba(255,255,255,0.08)"}`, borderRadius:14, padding:isMobile?"24px 20px":"32px", height:"100%" }}>
                  <span className="badge" style={{ background:idx===0?OR:"rgba(255,255,255,0.1)", color:idx===0?"#fff":TEXT, marginBottom:16 }}>{hero.tag}</span>
                  <h2 style={{ fontSize:idx===0?20:16, fontWeight:700, color:TEXT, lineHeight:1.4, marginBottom:12 }}>{hero.title}</h2>
                  <p style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.7 }}>{hero.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
        {magazineGroups.map((group,idx)=>(
          <section key={idx} style={{ marginBottom:60 }}>
            <div style={{ fontSize:14, fontFamily:"var(--fd)", letterSpacing:2, color:"rgba(255,255,255,0.3)", borderBottom:"1px solid rgba(255,255,255,0.08)", paddingBottom:8, marginBottom:20 }}>{`02-${idx+1}. ${group.name}`}</div>
            <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)", gap:16 }}>
              {group.items.map((mag,i)=>(
                <a key={i} href={mag.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
                  <div className="rank-row" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"24px", height:"100%" }}>
                    <div style={{ fontSize:24, marginBottom:12 }}>{mag.icon}</div>
                    <h3 style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:8 }}>{mag.title}</h3>
                    <p style={{ fontSize:11, color:"var(--muted2)", lineHeight:1.5 }}>{mag.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
        <section>
          <div style={{ fontSize:14, fontFamily:"var(--fd)", letterSpacing:2, color:BL, borderBottom:`1px solid ${BL}44`, paddingBottom:8, marginBottom:20 }}>03. PREMIUM RESOURCE</div>
          {premiumGroups.map((group,idx)=>(
            <div key={idx} style={{ marginBottom:32 }}>
              <div style={{ fontSize:10, fontFamily:"var(--fs)", color:BL, marginBottom:12, opacity:.8, letterSpacing:1 }}>{group.name}</div>
              <div style={{ background:"#0d0d0d", border:`1px solid ${BL}22`, borderRadius:12, overflow:"hidden" }}>
                {group.items.map((item,i)=>(
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none", display:"block" }}>
                    <div className="article-row" style={{ display:"flex", alignItems:"center", gap:16, padding:"15px 20px", borderBottom:i===group.items.length-1?"none":"1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize:9, fontFamily:"var(--fs)", color:BL, border:`1px solid ${BL}44`, padding:"2px 6px", borderRadius:3, minWidth:64, textAlign:"center" }}>{item.tag}</span>
                      <div style={{ fontSize:isMobile?12:13, fontWeight:700, color:TEXT, lineHeight:1.4, flex:1 }}>{item.title}</div>
                      {!isMobile&&<span style={{ color:"rgba(255,255,255,0.15)" }}>→</span>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
function Dashboard({ data, isMobile, onTabChange }) {
  const [activeWorst, setActiveWorst] = useState(null);
  const loading = !data;

  const Top5Row = ({ a, i, valKey, valSuffix, color }) => (
    <div style={{ display:"flex", alignItems:"center", gap:isMobile?10:20, padding:isMobile?"12px 0":"18px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
      <div className="top5-rank" style={{ fontFamily:"var(--fd)", color:i===0?color:"rgba(255,255,255,0.15)", lineHeight:1 }}>{a.rank}</div>
      <div style={{ fontSize:isMobile?14:18, flexShrink:0 }}>{a.emoji}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:isMobile?12:14, fontWeight:700, color:i===0?color:TEXT, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</div>
        {a.avg&&<div style={{ fontSize:10, color:"var(--muted)", marginTop:3 }}>1日平均 {a.avg} PV</div>}
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div className="top5-pv" style={{ fontFamily:"var(--fd)", color:i===0?color:TEXT }}>{(a.val||a.pv).toLocaleString()}</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:1 }}>{valSuffix}</div>
      </div>
      <div className="top5-bar" style={{ width:60, flexShrink:0 }}>
        <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", background:i===0?color:"rgba(255,255,255,0.25)", width:`${(a.val||a.pv)/(data?.top5[0]?.pv||data?.top5PV?.[0]?.val||1)*100}%`, borderRadius:2 }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-fade">

      {/* ── HERO ── */}
      <section style={{ minHeight:"100svh", display:"flex", flexDirection:"column", background:INK, color:TEXT, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 15% 50%, rgba(249,115,22,0.06), transparent 55%), radial-gradient(circle at 85% 25%, rgba(59,130,246,0.06), transparent 50%)", pointerEvents:"none" }} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", position:"relative", zIndex:1, padding:isMobile?"80px 16px 60px":"100px 48px 80px", maxWidth:1100, margin:"0 auto", width:"100%" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"var(--fm)", fontSize:11, letterSpacing:3, color:"var(--muted2)", marginBottom:20 }} className="fu">
            <span style={{ width:20, height:1, background:OR }}></span>
            LOG IS RUNNING
          </div>
          <h1 className="fu d1" style={{ fontFamily:"var(--fd)", fontSize:"clamp(72px,13vw,140px)", lineHeight:.88, letterSpacing:-2 }}>
            今日も<br />
            <span style={{ color:OR }}>ログ</span>、<br />
            <span style={{ WebkitTextStroke:`2px ${BL}`, color:"transparent" }}>まわっとる。</span>
          </h1>
          <p className="fu d2" style={{ fontFamily:"var(--fs)", fontSize:isMobile?13:16, color:"var(--muted2)", marginTop:20, maxWidth:480, lineHeight:1.8 }}>
            {loading ? "データ読み込み中…" : (
              <>
                {data.totalArt}本の記事・{data.updatedAt}集計。<br />
                データと生成AIを片手に、毎日なんか作って壊して直すログプレイヤー。
              </>
             )}
          </p>
          <div className="fu d3" style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:36 }}>
            {loading
              ? [1,2,3,4].map(i=><Skeleton key={i} w={80} h={56} />)
              : [
                  { n:data.totalPV.toLocaleString(), u:"累計PV",    diff:data.pvDiff,       c:OR  },
                  { n:data.totalSK.toLocaleString(), u:"累計スキ",  diff:data.skDiff,       c:BL  },
                  { n:data.lastFollower.toLocaleString(), u:"フォロワー", diff:data.followerDiff, c:"#22c55e", msg:data.followerMsg },
                  { n:data.totalArt.toLocaleString(), u:"総記事数", diff:data.artDiff,      c:"rgba(255,255,255,0.6)" },
                ].map(k=>(
                  <div key={k.u} style={{ borderLeft:`3px solid ${k.c}`, paddingLeft:14 }}>
                    <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                      <div style={{ fontFamily:"var(--fd)", fontSize:"clamp(28px,5vw,48px)", color:k.c, lineHeight:1 }}>{k.n}</div>
                      {k.diff!==undefined&&k.diff!==0&&(
                        <div style={{ fontSize:11, color:k.diff>0?"#86efac":"#fca5a5", lineHeight:1 }}>
                          <span style={{ fontSize:9, opacity:.7, marginRight:3 }}>前日比</span>
                          {k.diff>0?`▲${k.diff}`:`▼${Math.abs(k.diff)}`}
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily:"var(--fs)", fontSize:10, color:"var(--muted)", letterSpacing:2, marginTop:4 }}>{k.u}</div>
                    {k.msg&&<div style={{ marginTop:4, fontSize:11, color:k.diff>0?"#86efac":k.diff<0?"#fca5a5":"var(--muted2)", fontStyle:"italic" }}>{k.msg}</div>}
                  </div>
                ))
            }
          </div>
        </div>
        <div style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)", fontFamily:"var(--fm)", fontSize:10, letterSpacing:3, color:"rgba(255,255,255,0.2)" }}>SCROLL ↓</div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {loading ? "　データ読み込み中…　".repeat(8) : (
            (data.tickerText + "　").repeat(4).split("").map((c,i) => c)
          )}
          {!loading && <>{data.tickerText}&nbsp;&nbsp;&nbsp;{data.tickerText}&nbsp;&nbsp;&nbsp;{data.tickerText}&nbsp;&nbsp;&nbsp;{data.tickerText}</>}
        </div>
      </div>

      {/* ── RANKING CTA ── */}
      <section className="sec" style={{ background:"#0a0a0a", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="max900">
          <SectionEyebrow color={OR}>LIKES RANKING — 今月</SectionEyebrow>
          <SectionTitle>スキをくれた人、<br /><span style={{ color:OR }}>ここに刻んどくで。</span></SectionTitle>
          <p style={{ fontSize:14, color:"var(--muted2)", marginBottom:40, lineHeight:1.8, maxWidth:480 }}>
            あなたのスキがワイを動かしてる。<br />名前を残したいなら、スキを押しに来て。<br />毎月リセットされるから今月中に。
          </p>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1.3fr 1fr", gap:14, alignItems:"end", marginBottom:28 }}>
            {loading ? [1,2,3].map(i=><Skeleton key={i} w="100%" h={160} style={{ borderRadius:14 }} />) : null}
          </div>
          <div style={{ background:"rgba(249,115,22,0.06)", border:`1px dashed ${OR}44`, borderRadius:12, padding:isMobile?"16px":"20px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
            <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.7 }}>
              ランキングの全体は<strong style={{ color:OR }}>「ランキング」タブ</strong>で見られるよ。<br />チャートも成長レースも全部そこにある。
            </div>
            <button
              onClick={() => { onTabChange("ranking"); window.scrollTo({ top:0, behavior:"smooth" }); }}
              style={{ display:"inline-block", padding:"10px 22px", borderRadius:4, background:OR, color:"#fff", fontFamily:"var(--fs)", fontSize:12, fontWeight:700, letterSpacing:2, border:"none", cursor:"pointer", whiteSpace:"nowrap", transition:"all .2s" }}>
              ランキングを見る →
            </button>
          </div>
        </div>
      </section>

      {/* ── GROWTH CHART ── */}
      <section className="sec" style={{ background:INK }}>
        <div className="max900">
          <div className="growth-grid">
            <div>
              <SectionEyebrow color={BL}>GROWTH</SectionEyebrow>
              {loading
                ? <><Skeleton w="80%" h={72} style={{ marginTop:12 }} /><Skeleton w="60%" h={20} style={{ marginTop:16 }} /></>
                : <>
                  <h2 style={{ fontFamily:"var(--fd)", fontSize:"clamp(36px,8vw,72px)", lineHeight:.9, marginTop:12, color:TEXT }}>
                    集計開始→今<br /><span style={{ color:BL }}>+{data.pvGrowth}%</span>
                  </h2>
                  <p style={{ marginTop:20, lineHeight:1.8, color:"var(--muted2)", fontSize:14 }}>
                    スキの伸びは <strong style={{ color:BL }}>+{data.skGrowth}%</strong>
                    {data.skGrowth>data.pvGrowth ? <> とPVを上回る。<br />「数字より質」が育ってる証拠。</>
                     :data.skGrowth>0 ? <> で成長中。<br />PVと一緒にファンも増やしていこ。</>
                     : <> は伸び途中。<br />スキされる記事、研究する価値あり。</>}
                  </p>
                  <div style={{ marginTop:24, display:"flex", gap:20 }}>
                    <div style={{ borderLeft:`3px solid ${BL}`, paddingLeft:12 }}>
                      <div style={{ fontFamily:"var(--fd)", fontSize:28, color:BL }}>+{data.skGrowth}%</div>
                      <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:1 }}>スキ増加率</div>
                    </div>
                    <div style={{ borderLeft:"3px solid rgba(255,255,255,0.15)", paddingLeft:12 }}>
                      <div style={{ fontFamily:"var(--fd)", fontSize:28, color:TEXT }}>{parseFloat(data.skiRate).toFixed(1)}%</div>
                      <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:1 }}>平均スキ率</div>
                    </div>
                  </div>
                </>
              }
            </div>
            <div style={{ background:"#111", borderRadius:14, padding:isMobile?"16px 8px":"24px 16px", border:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:8, fontFamily:"var(--fs)" }}>TOTAL PV GROWTH</div>
              {loading ? <Skeleton w="100%" h={160} />
                : <ResponsiveContainer width="100%" height={isMobile?150:180}>
                  <LineChart data={data.growthChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="d" tick={{ fill:"rgba(255,255,255,0.2)", fontSize:9 }} interval={isMobile?5:2} />
                    <YAxis tick={{ fill:"rgba(255,255,255,0.2)", fontSize:9 }} tickFormatter={v=>`${Math.round(v/1000)}K`} width={30} />
                    <Line type="monotone" dataKey="v" stroke={OR} strokeWidth={2.5} dot={false} name="PV" />
                    <Tooltip contentStyle={{ background:"#111", border:`1px solid ${OR}44`, borderRadius:8, fontSize:12, color:TEXT }} formatter={v=>[v.toLocaleString(),"累計PV"]} />
                  </LineChart>
                </ResponsiveContainer>
              }
            </div>
          </div>
        </div>
      </section>

      {/* ── FOLLOWER TREND ── */}
      <section className="sec" style={{ background:"#0a0a0a", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="max900">
          <SectionEyebrow color="#22c55e">FOLLOWERS</SectionEyebrow>
          <SectionTitle>フォロワー推移。</SectionTitle>
          <p style={{ fontSize:13, color:"var(--muted2)", marginBottom:32, lineHeight:1.8 }}>
            {loading ? "—" : (
             <>
               現在 {data.lastFollower.toLocaleString()} フォロワー。<br />
               {data.followerMsg}
             </>
            )}
          </p>
          <div className="follower-panel">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ fontFamily:"var(--fm)", fontSize:10, letterSpacing:2, color:"var(--muted)" }}>FOLLOWER COUNT OVER TIME</div>
              {!loading && data.followerDiff!==0 && (
                <div style={{ fontFamily:"var(--fm)", fontSize:12, color:data.followerDiff>0?"#86efac":"#fca5a5" }}>
                  前日比 {data.followerDiff>0?"▲":"▼"}{Math.abs(data.followerDiff)}
                </div>
              )}
            </div>
            {loading ? <Skeleton w="100%" h={200} />
              : data.followerChart?.length > 0
                ? <ResponsiveContainer width="100%" height={isMobile?180:220}>
                  <LineChart data={data.followerChart} margin={{ top:8, right:8, left:isMobile?-16:0, bottom:4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="d" tick={{ fill:"rgba(255,255,255,0.2)", fontSize:isMobile?9:10, fontFamily:"var(--fs)" }} axisLine={false} tickLine={false} interval={isMobile?4:2} />
                    <YAxis tick={{ fill:"rgba(255,255,255,0.2)", fontSize:9, fontFamily:"var(--fd)" }} axisLine={false} tickLine={false} width={isMobile?32:38} tickFormatter={v=>v.toLocaleString()} />
                    <Tooltip contentStyle={{ background:"#111", border:"1px solid rgba(34,197,94,0.3)", borderRadius:8, fontSize:12, color:TEXT }} formatter={v=>[v.toLocaleString(),"フォロワー"]} labelStyle={{ color:"var(--muted2)", fontFamily:"var(--fm)", fontSize:10 }} />
                    <Line type="monotone" dataKey="f" stroke="#22c55e" strokeWidth={2.5} dot={false} name="フォロワー" />
                  </LineChart>
                </ResponsiveContainer>
                : <div style={{ textAlign:"center", padding:"40px 20px", color:"var(--muted)", fontSize:13 }}>フォロワーデータがありません</div>
            }
          </div>
        </div>
      </section>

      {/* ── TOP5 30日 ── */}
      <section className="sec" style={{ background:"#111", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="max900">
          <SectionEyebrow color={OR}>HALL OF FAME</SectionEyebrow>
          <SectionTitle>30日間ランキング</SectionTitle>
          {loading ? [1,2,3,4,5].map(i=><Skeleton key={i} w="100%" h={56} style={{ marginBottom:12 }} />)
            : data.top5.map((a,i)=><Top5Row key={i} a={{...a, val:a.pv}} i={i} valSuffix="PV/30日" color={OR} />)}
        </div>
      </section>

      {/* ── TOP5 PV ── */}
      <section className="sec" style={{ background:"#0d0d0d", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="max900">
          <SectionEyebrow color="rgba(255,255,255,0.4)">ALL TIME</SectionEyebrow>
          <SectionTitle>累計PV ランキング</SectionTitle>
          {loading ? [1,2,3,4,5].map(i=><Skeleton key={i} w="100%" h={56} style={{ marginBottom:12 }} />)
            : data.top5PV.map((a,i)=><Top5Row key={i} a={a} i={i} valSuffix="累計PV" color={OR} />)}
        </div>
      </section>

      {/* ── TOP5 SK ── */}
      <section className="sec" style={{ background:"#0a0d14", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="max900">
          <SectionEyebrow color={BL}>LOVE</SectionEyebrow>
          <SectionTitle>スキ ランキング</SectionTitle>
          {loading ? [1,2,3,4,5].map(i=><Skeleton key={i} w="100%" h={56} style={{ marginBottom:12 }} />)
            : data.top5SK.length===0
              ? <div style={{ fontSize:13, color:"var(--muted)", padding:"24px 0" }}>スキデータが見つかりませんでした</div>
              : data.top5SK.map((a,i)=><Top5Row key={i} a={a} i={i} valSuffix="スキ数" color={BL} />)}
        </div>
      </section>

      {/* ── HIDDEN GEMS ── */}
      <section className="sec" style={{ background:INK, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="max900">
          <SectionEyebrow color={BL}>HIDDEN GEMS</SectionEyebrow>
          <SectionTitle>まだ読んでへんやろ？</SectionTitle>
          <p style={{ fontSize:14, color:"var(--muted2)", marginBottom:40, lineHeight:1.8, maxWidth:480 }}>
            PVは少ないけど、読者にこっそり読まれた記事たち。<br /> 死に記事にするには惜しすぎる。
          </p>
          {loading
            ? <div className="gems-grid">{[1,2,3,4,5,6].map(i=><Skeleton key={i} w="100%" h={160} style={{ borderRadius:14 }} />)}</div>
            : data.hiddenGems?.length===0
              ? <div style={{ textAlign:"center", padding:"40px 20px", color:"var(--muted)", fontSize:13 }}>隠れた記事を発掘中…</div>
              : (
                <div className="gems-grid">
                  {data.hiddenGems.map((gem,i)=>(
                    <a key={i} href={gem.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
                      <div className="card-hover" style={{ background:"#111", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"22px 20px", height:"100%", position:"relative", overflow:"hidden" }}>
                        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${OR},${BL})`, opacity:0, transition:"opacity .2s" }} className="gem-line" />
                        <div style={{ fontFamily:"var(--fm)", fontSize:10, letterSpacing:2, color:OR, marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
                          ♡ {gem.sk}スキ
                          {gem.sk > 0 && gem.pv > 0 && (
                            <span style={{ color:"var(--muted)", fontSize:9 }}>/ PV {gem.pv}</span>
                          )}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, lineHeight:1.6, color:TEXT, marginBottom:16 }}>{gem.title}</div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div style={{ fontFamily:"var(--fd)", fontSize:22, color:"var(--muted2)", lineHeight:1 }}>{gem.pv} <span style={{ fontSize:14 }}>PV</span></div>
                            <div style={{ fontFamily:"var(--fm)", fontSize:9, letterSpacing:1, color:"var(--muted)", marginTop:2 }}>TOTAL VIEWS</div>
                          </div>
                          <span style={{ fontFamily:"var(--fm)", fontSize:9, letterSpacing:1, background:`${BL}18`, color:BL, border:`1px solid ${BL}33`, padding:"4px 10px", borderRadius:3 }}>READ IT →</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )
          }
        </div>
      </section>

      {/* ── TREND 4分類 ── */}
      <section className="sec" style={{ background:"#0d0d0d", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="max900">
          <SectionEyebrow color="rgba(255,255,255,0.4)">STATUS</SectionEyebrow>
          <SectionTitle>記事の「今」を<br />4分類で見ると</SectionTitle>
          <div className="trend-grid" style={{ marginTop:32 }}>
            {[
              { s:"🔥 急上昇", key:"rising", desc:"昨日PVが伸び中。アルゴリズムに乗ってる。",        c:OR,          bg:`${OR}08`  },
              { s:"🟢 継続",   key:"cont",   desc:"ピークを過ぎても安定して読まれ続ける。",        c:"#22c55e",  bg:"#22c55e08" },
              { s:"⚠️ 減速",  key:"slow",   desc:"落ちてきてるが生きてる。リライト候補。",        c:"#eab308",  bg:"#eab30808" },
              { s:"💤 停止",   key:"stop",   desc:"7日間PVほぼゼロ。でも「寿命の証拠」として機能中。", c:"#475569", bg:"#47556908" },
            ].map(s=>{
              const n = loading ? 0 : (data[s.key]||0);
              const total = loading ? 1 : (data.rising+data.cont+data.slow+data.stop||1);
              return (
                <div key={s.s} style={{ background:s.bg, border:`1px solid ${s.c}22`, borderRadius:14, padding:isMobile?"16px":"22px" }}>
                  <div style={{ fontSize:15, marginBottom:8 }}>{s.s}</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:8 }}>
                    {loading ? <Skeleton w={60} h={44} />
                      : <>
                        <span style={{ fontFamily:"var(--fd)", fontSize:isMobile?40:52, color:s.c, lineHeight:1 }}>{n}</span>
                        <span style={{ fontSize:13, color:s.c, fontWeight:700 }}>記事</span>
                        <span style={{ fontSize:12, color:"var(--muted)", marginLeft:"auto" }}>{Math.round(n/total*100)}%</span>
                      </>}
                  </div>
                  <div style={{ height:3, background:`${s.c}18`, borderRadius:2, marginBottom:10, overflow:"hidden" }}>
                    <div style={{ height:"100%", background:s.c, width:`${Math.round(n/total*100)}%`, borderRadius:2, transition:"width .8s" }} />
                  </div>
                  <p style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WORST ── */}
      <section className="sec" style={{ background:"#0a0a0a", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="max900">
          <SectionEyebrow color="rgba(255,255,255,0.25)">HALL OF SHAME</SectionEyebrow>
          <h2 style={{ fontFamily:"var(--fd)", fontSize:"clamp(38px,10vw,80px)", lineHeight:.88, marginBottom:8, color:TEXT }}>
            ワースト記事<br /><span style={{ color:"rgba(255,255,255,0.2)", fontSize:"70%" }}>も、ネタになる。</span>
          </h2>
          <p style={{ fontSize:12, color:"var(--muted)", marginBottom:32, letterSpacing:1 }}>
            {loading ? "—" : `${data.stopPct}%の記事が「停止」判定。でも失敗ログこそが資産。`}
          </p>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)", gap:16 }}>
            {loading ? [1,2,3].map(i=><Skeleton key={i} w="100%" h={160} />)
              : data.worst3.map((w,i)=>(
                <div key={i} className="worst-card"
                  onClick={()=>setActiveWorst(activeWorst===i?null:i)}
                  style={{ background:activeWorst===i?OR:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:isMobile?"18px 14px":"24px 20px" }}>
                  <div style={{ fontSize:isMobile?24:30, marginBottom:10 }}>{["😶","😑","🫣"][i]}</div>
                  <div style={{ fontFamily:"var(--fs)", fontWeight:700, fontSize:isMobile?12:14, lineHeight:1.3, marginBottom:8, color:TEXT }}>「{w.title}」</div>
                  <div style={{ fontFamily:"var(--fd)", fontSize:isMobile?32:40, color:activeWorst===i?"#fff":OR, lineHeight:1 }}>{w.pv} PV</div>
                  {activeWorst===i
                    ? <div style={{ marginTop:14, fontSize:12, lineHeight:1.7, color:"#fff", fontStyle:"italic", borderTop:"1px solid rgba(255,255,255,0.3)", paddingTop:12 }}>
                      💬 {w.roast}
                      {w.url && (
                       <a href={w.url} target="_blank" rel="noopener noreferrer"
                         style={{ display:"block", marginTop:12, fontStyle:"normal", fontFamily:"var(--fs)", fontSize:11, letterSpacing:2, color:OR, textDecoration:"none" }}>
                         記事を読む →
                       </a>
                    )}
                    </div>
                    : <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:10 }}>タップで詳細 →</div>}
                </div>
              ))}
          </div>
          <div style={{ marginTop:28, padding:isMobile?"16px":"22px 28px", background:"rgba(255,255,255,0.03)", borderRadius:14, border:"1px dashed rgba(255,255,255,0.1)", display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
            <div style={{ fontSize:28 }}>🏆</div>
            <div style={{ flex:1, minWidth:180 }}>
              <div style={{ fontFamily:"var(--fs)", fontWeight:700, fontSize:13, color:TEXT }}>
                {loading ? "—" : `全${data.totalArt}記事中、${data.stopPct}%が「活動停止」状態`}
              </div>
              <div style={{ fontSize:12, color:"var(--muted2)", marginTop:4, lineHeight:1.6 }}>
                「note記事の寿命は5日間」──自ら証明した仮説通り。<br />
                <strong style={{ color:OR }}>失敗データを記事にして一番PVを取ったのがワイや。</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MEMBERSHIP CTA ── */}
      <section className="sec" style={{ background:"#080808", borderTop:`1px solid ${OR}22`, textAlign:"center" }}>
        <div style={{ maxWidth:700, margin:"0 auto" }}>
          <SectionEyebrow color={OR} style={{ justifyContent:"center" }}>MEMBERSHIP</SectionEyebrow>
          <h2 style={{ fontFamily:"var(--fd)", fontSize:"clamp(40px,9vw,88px)", lineHeight:.9, color:TEXT, marginBottom:8 }}>
            呪文の裏庭、<br />開いてます。
          </h2>
          <div style={{ fontFamily:"var(--fd)", fontSize:"clamp(60px,12vw,100px)", lineHeight:1, color:"transparent", WebkitTextStroke:`1px ${OR}`, margin:"16px 0" }}>
            ¥780
          </div>
          <p style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.8, marginBottom:32 }}>
            10名まで、月額780円で、ワイのプロンプトが丸見えになる。<br />AIアートの呪文、プロンプト設計の裏側、全部置いとくで。
          </p>
          <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"28px 32px", marginBottom:32, textAlign:"left" }}>
            {[
              "実際に使ったプロンプトを公開（メタプロンプト由来の呪文も含む）",
              "980円未満の有料記事はメンバーなら無料で読める",
              "創設メンバーは780円のまま継続できる（値上げなし）",
            ].map((perk,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, fontSize:13, lineHeight:1.7, color:"var(--muted2)", marginBottom:i<2?12:0 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:OR, flexShrink:0, marginTop:8 }} />
                {perk}
              </div>
            ))}
          </div>
          <a href="https://note.com/ktcrs1107/membership" target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:10, background:OR, color:"#fff", padding:"16px 40px", borderRadius:4, fontFamily:"var(--fs)", fontSize:13, fontWeight:700, letterSpacing:2, textDecoration:"none", transition:"all .2s" }}>
            メンバーシップに参加する →
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <section className="sec" style={{ background:"#050505", borderTop:"1px solid rgba(255,255,255,0.05)", textAlign:"center", paddingBottom:60 }}>
        <div style={{ fontFamily:"var(--fd)", fontSize:"clamp(44px,12vw,100px)", lineHeight:.85, marginBottom:16, color:"transparent", WebkitTextStroke:"1px rgba(255,255,255,0.12)" }}>
          ログは続く。
        </div>
        <p style={{ fontSize:13, color:"var(--muted)", maxWidth:420, margin:"0 auto", lineHeight:1.8 }}>
          データで遊び、失敗をネタにし、また書く。<br />KITAcoreのnoteはまだ途中です。
        </p>
        <div style={{ marginTop:32, fontFamily:"var(--fm)", fontSize:10, letterSpacing:3, color:"rgba(255,255,255,0.15)", borderBottom:"1px solid rgba(255,255,255,0.06)", paddingBottom:6, display:"inline-block" }}>
          {loading ? "読み込み中…" : `集計日 ${data.updatedAt} — 自動更新中`}
        </div>
      </section>

    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────── */
export default function KitaWrapped() {
  const { data, error } = useNoteData();
  const [tab, setTab]   = useState("dashboard");
  const isMobile        = useIsMobile();

  if (error) return (
    <div style={{ background:INK, color:"#f87171", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"monospace", gap:12, padding:24, textAlign:"center" }}>
      <div style={{ fontSize:32 }}>⚠️</div>
      <div style={{ fontSize:14 }}>CSVが読み込めませんでした</div>
      <div style={{ fontSize:11, color:"#64748b" }}>{error}</div>
      <div style={{ fontSize:11, color:"#475569", marginTop:8 }}>public/data/ にCSVを置いてください</div>
    </div>
  );

  const TABS = [
    { id:"dashboard", label:"DASHBOARD" },
    { id:"pickup",    label:"おすすめ"  },
    { id:"articles",  label:"記事一覧"  },
    { id:"ranking",   label:"ランキング"},
  ];

  return (
    <div style={{ fontFamily:"var(--fj)", background:INK, color:TEXT, minHeight:"100vh", overflowX:"hidden" }}>

      {/* ── STICKY NAV ── */}
      <div style={{ position:"sticky", top:0, zIndex:100, background:"rgba(8,8,8,0.92)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", padding:isMobile?"0 12px":"0 32px", height:48 }}>
        <span style={{ fontFamily:"var(--fd)", fontSize:16, letterSpacing:3, color:OR, marginRight:24, flexShrink:0 }}>
          KITA<span style={{ fontFamily:"var(--fj)", fontWeight:700, fontSize:12, letterSpacing:1, color:"rgba(255,255,255,0.5)" }}>core</span>
        </span>
        {TABS.map(t=>(
          <button key={t.id} className="tab-btn"
            onClick={()=>{ setTab(t.id); window.scrollTo({ top:0, behavior:"smooth" }); }}
            style={{ padding:isMobile?"0 10px":"0 18px", height:48, fontSize:isMobile?10:11, textTransform:"uppercase", letterSpacing:isMobile?1:2, color:tab===t.id?TEXT:"rgba(255,255,255,0.28)", borderBottom:`2px solid ${tab===t.id?OR:"transparent"}`, marginBottom:-1 }}>
            {t.label}
          </button>
        ))}
        <div style={{ flex:1 }} />
        <span style={{ fontFamily:"var(--fm)", fontSize:9, letterSpacing:1, color:"rgba(255,255,255,0.2)", flexShrink:0 }}>
          {!data ? "—" : data.updatedAt}
        </span>
      </div>

      {tab==="dashboard" && <Dashboard data={data} isMobile={isMobile} onTabChange={setTab} />}
      {tab==="pickup"    && <PickupPage isMobile={isMobile} />}
      {tab==="articles"  && <ArticleListPage data={data} isMobile={isMobile} />}
      {tab==="ranking"   && <LikesRankingPage isMobile={isMobile} />}

    </div>
  );
}
