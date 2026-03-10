import { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";

/* ── Fonts & Animations ───────────────────────────── */
const styleEl = document.createElement("style");
styleEl.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+JP:wght@400;700;900&family=Syne:wght@700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes countUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideInRight{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}
  @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(212,74,0,0)}50%{box-shadow:0 0 0 6px rgba(212,74,0,0.18)}}
  @keyframes borderFlow{0%{background-position:0% 50%}100%{background-position:100% 50%}}
  @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}

  .fu{animation:fadeUp .7s cubic-bezier(.22,1,.36,1) both}
  .d1{animation-delay:.1s}.d2{animation-delay:.2s}.d3{animation-delay:.35s}.d4{animation-delay:.5s}

  /* ── Ticker ── */
  .ticker-wrap{overflow:hidden;white-space:nowrap;border-top:2px solid #1a0f00;border-bottom:2px solid #1a0f00;padding:10px 0}
  .ticker-inner{display:inline-block;animation:ticker 26s linear infinite;font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:2px;color:#d44a00}

  /* ── Badge ── */
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-family:'Syne',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase}

  /* ── Skeleton ── */
  .skeleton{background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:8px}

  /* ── Worst Card ── */
  .worst-card{transition:all .3s;cursor:pointer;-webkit-tap-highlight-color:transparent;}
  .worst-card:hover{transform:translateY(-3px)}
  .worst-card:active{transform:scale(0.97);}

  /* ── Article Row ── */
  .article-row{transition:background .18s;}
  .article-row:hover{background:#ffffff08!important;}

  /* ── Tab ── */
  .tab-btn{transition:all .2s;cursor:pointer;border:none;background:none;font-family:'Syne',sans-serif;font-weight:700;letter-spacing:2px;font-size:11px;}

  /* ── Sort / Filter ── */
  .sort-btn{transition:all .18s;cursor:pointer;border:1px solid #ffffff22;background:none;border-radius:20px;padding:5px 14px;font-family:'Syne',sans-serif;font-size:10px;letter-spacing:1px;color:#ffffff66;}
  .sort-btn:hover{border-color:#ffffff55;color:#ffffffaa;}
  .sort-btn.active{background:#d44a00;border-color:#d44a00;color:#fff;}
  .filter-chip{transition:all .18s;cursor:pointer;border:1px solid #ffffff18;background:#ffffff08;border-radius:20px;padding:4px 12px;font-size:10px;font-family:'Syne',sans-serif;letter-spacing:1px;color:#ffffff55;}
  .filter-chip:hover{border-color:#ffffff44;color:#ffffffaa;}
  .filter-chip.active{background:#ffffff18;border-color:#ffffff55;color:#ffffffdd;}

  /* ── Search ── */
  .search-input{width:100%;background:#ffffff0a;border:1px solid #ffffff18;border-radius:12px;padding:12px 16px;color:#fffbf2;font-family:'Noto Sans JP',sans-serif;font-size:14px;outline:none;transition:border .2s;}
  .search-input:focus{border-color:#d44a0088;}
  .search-input::placeholder{color:#ffffff33;}

  /* ── Page fade ── */
  .page-fade{animation:fadeIn .4s cubic-bezier(.22,1,.36,1) both;}

  /* ── KPI scroll strip (mobile) ── */
  .kpi-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
  .kpi-scroll::-webkit-scrollbar{display:none;}
  .kpi-card{flex-shrink:0;background:#ffffff0d;border:1px solid #ffffff14;border-radius:16px;padding:16px 18px;min-width:140px;transition:all .25s;cursor:default;-webkit-tap-highlight-color:transparent;}
  .kpi-card:active{transform:scale(.97);background:#ffffff14;}

  /* ── Ranking items ── */
  .rank-item{transition:all .2s;-webkit-tap-highlight-color:transparent;}
  .rank-item:active{transform:scale(.98);background:#ffffff0a!important;}

  /* ── Bottom nav (mobile only) ── */
  .bottom-nav{
    position:fixed;bottom:0;left:0;right:0;z-index:200;
    background:rgba(26,15,0,0.95);
    backdrop-filter:blur(20px);
    -webkit-backdrop-filter:blur(20px);
    border-top:1px solid #ffffff14;
    display:flex;align-items:center;
    height:64px;
    padding:0 8px;
    padding-bottom:env(safe-area-inset-bottom,0);
  }
  .bottom-nav-btn{
    flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:3px;padding:8px 4px;border:none;background:none;cursor:pointer;
    -webkit-tap-highlight-color:transparent;
    transition:all .2s;
  }
  .bottom-nav-icon{font-size:20px;line-height:1;transition:transform .2s;}
  .bottom-nav-label{font-family:'Syne',sans-serif;font-size:9px;letter-spacing:1.5px;color:#ffffff44;transition:color .2s;}
  .bottom-nav-btn.active .bottom-nav-label{color:#d44a00;}
  .bottom-nav-btn.active .bottom-nav-icon{transform:scale(1.15);}
  .bottom-nav-btn:active .bottom-nav-icon{transform:scale(.9);}

  /* ── Floating update badge ── */
  .update-badge{
    position:fixed;top:56px;left:50%;transform:translateX(-50%);
    background:rgba(212,74,0,0.95);color:#fff;border-radius:20px;
    padding:6px 16px;font-size:11px;font-family:'Syne',sans-serif;
    letter-spacing:1px;z-index:90;pointer-events:none;
    animation:fadeUp .5s ease both;
  }

  /* ── Hero noise overlay ── */
  .hero-noise{
    position:absolute;inset:0;pointer-events:none;z-index:0;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity:.4;
  }

  /* ── Section cards ── */
  .section-card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(212,74,0,0.08);}

  /* ── Stat diff pill ── */
  .diff-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;}
  .diff-pill.up{background:#86efac22;color:#86efac;}
  .diff-pill.down{background:#fca5a522;color:#fca5a5;}

  /* ── Mobile article row ── */
  .mob-article{
    display:flex;align-items:center;gap:12px;padding:14px 16px;
    border-bottom:1px solid #ffffff08;
    transition:background .15s;
    -webkit-tap-highlight-color:transparent;
  }
  .mob-article:active{background:#ffffff06;}

  /* ── Progress ring ── */
  .progress-ring{transform:rotate(-90deg);}

  /* ── Responsive layout ── */
  .sec{padding:80px 32px;}
  .hero-bd{padding:0 32px 48px;}
  .growth-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;}
  .worst-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
  .trend-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .stat-row{display:flex;flex-direction:column;gap:20px;margin-top:40px;}
  .top5-rank{font-size:clamp(32px,5vw,56px);min-width:60px;}
  .top5-pv{font-size:28px;}
  .top5-bar{display:block;}

  @media(min-width:641px) and (max-width:900px){
    .sec{padding:64px 24px;}.hero-bd{padding:0 24px 44px;}
    .growth-grid{grid-template-columns:1fr;gap:32px;}.worst-grid{grid-template-columns:1fr 1fr;gap:14px;}
  }
  @media(max-width:640px){
    .sec{padding:40px 0;}.hero-bd{padding:0 0 32px;}
    .growth-grid{grid-template-columns:1fr;gap:20px;}
    .worst-grid{grid-template-columns:1fr;gap:12px;}
    .trend-grid{grid-template-columns:1fr;gap:12px;}
    .top5-rank{font-size:28px;min-width:36px;}
    .top5-pv{font-size:18px;}
    .top5-bar{display:none;}
  }
`;
document.head.appendChild(styleEl);

const EXCLUDED_TITLES = [
  'ナイキ エア ヴェイパーマックス 360','自作PC#2','メモ','スターバックス記事#1',
  'みんなが貪欲になっているときこそ恐怖心を抱き、みんなが恐怖心を抱いているとき…',
  'はたらくこと','気になるレシピ#1','This is US','"50',
];

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

/* ── Animated counter hook ── */
function useCountUp(target, duration = 1200, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target || isNaN(parseInt(target))) { setVal(target); return; }
    const num = parseInt(String(target).replace(/,/g, ""));
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts + delay;
      const elapsed = ts - start;
      if (elapsed < 0) { raf = requestAnimationFrame(step); return; }
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(ease * num));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setVal(num);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

const DATA_BASE = "/note-wrapped/data/";
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
    ]).then(([dailyRaw, rankRaw, trendRaw, follRaw, articlesRaw]) => {
      const daily = parseCSV(dailyRaw), ranking = parseCSV(rankRaw),
            trend = parseCSV(trendRaw), followers = parseCSV(follRaw), articles = parseCSV(articlesRaw);
      const latest = daily[daily.length - 1], prev = daily[daily.length - 2] || {}, first = daily[0];

      const latestArticleDate = articles.reduce((a,b)=>(a.date||"")>(b.date||"")?a:b).date;
      const latestArticles = articles.filter(r => r.date === latestArticleDate);

      const totalPV = parseInt(latest["ビュー合計"] || latest["pv"] || 0);
      const totalSK = parseInt(latest["スキ合計"] || latest["sk"] || 0);
      const totalArt = latestArticles.length;
      const prevPV = parseInt(prev["ビュー合計"] || prev["pv"] || 0);
      const prevSK = parseInt(prev["スキ合計"] || prev["sk"] || 0);
      const prevArt = parseInt(prev["記事数"] || 0);
      const pvDiff = prevPV > 0 ? totalPV - prevPV : 0;
      const skDiff = prevSK > 0 ? totalSK - prevSK : 0;
      const artDiff = prevArt > 0 ? totalArt - prevArt : 0;
      const firstPV = parseInt(first["ビュー合計"] || first["pv"] || 0);
      const firstSK = parseInt(first["スキ合計"] || first["sk"] || 0);
      const pvGrowth = firstPV > 0 ? Math.round((totalPV - firstPV) / firstPV * 100) : 0;
      const skGrowth = firstSK > 0 ? Math.round((totalSK - firstSK) / firstSK * 100) : 0;
      const lastFollower = followers.length > 0 ? parseInt(followers[followers.length-1]["フォロワー数"]||0) : 0;
      const prevFollower = followers.length > 1 ? parseInt(followers[followers.length-2]["フォロワー数"]||0) : lastFollower;
      const followerDiff = lastFollower - prevFollower;
      const followerUpMsgs = ["ぇ？今日のワイの記事がいけてるん！？","フォロワー増えとる…なんか怖いんやけど笑","誰かワイのこと好きになってくれたん？ありがとな。","ちょっと待って、今日なんかいい記事書いたっけ？"];
      const followerDownMsgs = ["いや～、フォロワーが減ってもうた！","去った人よ、元気でな。","フォロワー減ったけど、ワイは元気です。","減った分だけ、残った人が濃いってことにしとく。"];
      const followerFlatMsgs = ["今日はフォロワー動かず。嵐の前の静けさ？","現状維持。悪くない、悪くない。","誰も来ず、誰も去らず。平和な一日。"];
      const followerMsg = followerDiff > 0
        ? followerUpMsgs[Math.abs(followerDiff + new Date().getDate()) % followerUpMsgs.length]
        : followerDiff < 0 ? followerDownMsgs[Math.abs(Math.abs(followerDiff)+new Date().getDate())%followerDownMsgs.length]
        : followerFlatMsgs[new Date().getDate()%followerFlatMsgs.length];
      const step = Math.max(1, Math.floor(daily.length/16));
      const growthChart = daily.filter((_,i)=>i%step===0||i===daily.length-1)
        .map(r=>({ d:(r["日付"]||"").replace("2025/","").replace("2026/","").replace(/^0/,""), v:parseInt(r["ビュー合計"]||0), s:parseInt(r["スキ合計"]||0) }));
      const EMOJIS = ["💀","🔧","🔬","🎨","⚗️"];
      const top5 = ranking.sort((a,b)=>parseInt(b["期間増加PV"]||0)-parseInt(a["期間増加PV"]||0)).slice(0,5)
        .map((r,i)=>({ rank:String(i+1).padStart(2,"0"), title:(r["title"]||"").replace(/ #\d+$/,"").slice(0,32), pv:parseInt(r["期間増加PV"]||0), avg:parseFloat(r["1日平均PV"]||0).toFixed(1), emoji:EMOJIS[i] }));
      const PV_EMOJIS = ["👑","🥈","🥉","🎖️","🏅"];
      const top5PV = latestArticles
        .filter(r => parseInt(r["read_count"]||0) > 0)
        .sort((a,b) => parseInt(b["read_count"]||0) - parseInt(a["read_count"]||0))
        .slice(0, 5)
        .map((r,i) => ({ rank:String(i+1).padStart(2,"0"), title:(r["title"]||"").replace(/ #\d+$/,"").slice(0,32), val:parseInt(r["read_count"]||0), emoji:PV_EMOJIS[i] }));
      const SK_EMOJIS = ["💖","💗","💓","💞","💝"];
      const skKey = articles[0] && (articles[0]["like_count"]!==undefined ? "like_count" : articles[0]["スキ数"]!==undefined ? "スキ数" : null);
      const top5SK = skKey ? latestArticles
        .filter(r => parseInt(r[skKey]||0) > 0)
        .sort((a,b) => parseInt(b[skKey]||0) - parseInt(a[skKey]||0))
        .slice(0, 5)
        .map((r,i) => ({ rank:String(i+1).padStart(2,"0"), title:(r["title"]||"").replace(/ #\d+$/,"").slice(0,32), val:parseInt(r[skKey]||0), emoji:SK_EMOJIS[i] }))
        : [];
      const trendCounts = {};
      trend.forEach(r=>{ const s=r["状態"]||r["state"]||""; trendCounts[s]=(trendCounts[s]||0)+1; });
      const trendMap = {};
      trend.forEach(r => {
        const key = (r["title"]||r["記事タイトル"]||"").trim();
        trendMap[key] = r["状態"]||r["state"]||"";
      });
      const articleList = latestArticles
        .filter(r => (r["title"]||"").trim() !== "")
        .map(r => {
          const title = (r["title"]||"").trim();
          const pv = parseInt(r["read_count"]||0);
          const sk = skKey ? parseInt(r[skKey]||0) : 0;
          const skRate = pv > 0 ? parseFloat((sk / pv * 100).toFixed(1)) : 0;
          const status = trendMap[title] || trendMap[title.replace(/ #\d+$/,"")] || "—";
          return { title, pv, sk, skRate, status };
        });

      const ROASTS = ["タイトルだけで完結してた。","投稿した本人が一番驚いている。","来ると思ってた。来なかった。","短すぎたのか、長すぎたのか。謎は深まるばかり。","存在は確認されている。"];
      const worst3 = latestArticles.filter(r=>parseInt(r["read_count"]||0)>0&&!EXCLUDED_TITLES.includes((r["title"]||"").trim()))
        .sort((a,b)=>parseInt(a["read_count"]||0)-parseInt(b["read_count"]||0)).slice(0,3)
        .map((r,i)=>({ title:(r["title"]||"").replace(/ #\d+$/,"").slice(0,28), pv:parseInt(r["read_count"]||0), roast:ROASTS[i%ROASTS.length] }));
      const rising=trendCounts["🔥 急上昇"]||0, cont=trendCounts["🟢 継続"]||0,
            slow=trendCounts["⚠️ 減速"]||0, stop=trendCounts["💤 停止"]||0;
      const skiRate = latest["スキ率(%)"]||latest["スキ率"]||"—";
      setData({
        totalPV,totalSK,totalArt,pvGrowth,skGrowth,pvDiff,skDiff,artDiff,lastFollower,followerDiff,followerMsg,
        growthChart,top5,top5PV,top5SK,trendCounts,worst3,skiRate,articleList,
        tickerText:`🔥 急上昇 ${rising}記事 · 🟢 継続 ${cont}記事 · ⚠️ 減速 ${slow}記事 · 💤 停止 ${stop}記事 · スキ率 ${parseFloat(skiRate).toFixed(1)}% · `,
        stopPct:totalArt>0?Math.round(stop/(rising+cont+slow+stop)*100):51,
        rising,cont,slow,stop,updatedAt:latest["日付"]||"",
      });
    }).catch(e=>setError(e.message));
  },[]);
  return { data, error };
}

function Skeleton({ w="100%", h=32, style:s={} }) {
  return <div className="skeleton" style={{width:w,height:h,...s}} />;
}

const C="#d44a00", INK="#1a0f00", CREAM="#fffbf2";
const STATUS_COLOR = {
  "🔥 急上昇":"#d44a00","🟢 継続":"#22c55e","⚠️ 減速":"#ca8a04","💤 停止":"#475569",
};
const STATUS_LIST = ["すべて","🔥 急上昇","🟢 継続","⚠️ 減速","💤 停止"];

/* ══════════════════════════════════════════════
   KPI カード (モバイル横スクロール)
══════════════════════════════════════════════ */
function KpiScrollStrip({ data, loading }) {
  const cards = loading
    ? [1,2,3,4].map(i => ({ key: String(i) }))
    : [
        { key:"pv",  n: data.totalPV.toLocaleString(), u:"累計 PV",     diff: data.pvDiff,       icon:"👁" },
        { key:"sk",  n: data.totalSK.toLocaleString(), u:"累計 スキ",   diff: data.skDiff,       icon:"♥" },
        { key:"flw", n: data.lastFollower.toLocaleString(), u:"フォロワー", diff: data.followerDiff, icon:"＋", msg: data.followerMsg },
        { key:"art", n: data.totalArt.toLocaleString(), u:"総記事数",   diff: data.artDiff,      icon:"✎" },
      ];

  return (
    <div className="kpi-scroll" style={{padding:"0 16px 4px"}}>
      {cards.map((k, i) => (
        <div key={k.key} className="kpi-card fu" style={{animationDelay:`${0.1+i*0.08}s`}}>
          {loading ? (
            <><Skeleton w={80} h={28} /><Skeleton w={50} h={12} style={{marginTop:8}} /></>
          ) : (
            <>
              <div style={{fontSize:18,marginBottom:4,lineHeight:1}}>{k.icon}</div>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:C,lineHeight:1}}>{k.n}</div>
              {k.diff !== undefined && k.diff !== 0 && (
                <span className={`diff-pill ${k.diff > 0 ? "up" : "down"}`} style={{marginTop:4,display:"inline-flex"}}>
                  {k.diff > 0 ? `▲${k.diff}` : `▼${Math.abs(k.diff)}`}
                </span>
              )}
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:9,color:"#ffffff55",letterSpacing:2,marginTop:4}}>{k.u}</div>
              {k.msg && <div style={{fontSize:9,color:k.diff>0?"#86efac":k.diff<0?"#fca5a5":"#ffffff44",marginTop:4,lineHeight:1.4,maxWidth:120}}>{k.msg}</div>}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   TOP5 ランキング行 (モバイル最適化)
══════════════════════════════════════════════ */
function RankRow({ item, i, accentColor, valLabel, isMobile }) {
  return (
    <div className="rank-item" style={{
      display:"flex", alignItems:"center", gap:isMobile?10:20,
      padding:isMobile?"14px 16px":"20px 24px",
      borderBottom:"1px solid #ffffff0f",
      background: i===0 ? `${accentColor}08` : "transparent",
    }}>
      {/* Rank number */}
      <div style={{
        fontFamily:"'Bebas Neue'",
        fontSize:isMobile ? 24 : "clamp(32px,5vw,56px)",
        minWidth:isMobile?30:60,
        color: i===0 ? accentColor : "#ffffff18",
        lineHeight:1,
        flexShrink:0,
      }}>{item.rank}</div>

      {/* Emoji */}
      <div style={{fontSize:isMobile?16:18,flexShrink:0}}>{item.emoji}</div>

      {/* Title + sub */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{
          fontSize:isMobile?12:14,
          fontWeight:700,
          color: i===0 ? accentColor : CREAM,
          lineHeight:1.3,
          overflow:"hidden",
          textOverflow:"ellipsis",
          whiteSpace:"nowrap",
          marginBottom:isMobile?4:4,
        }}>{item.title}</div>
        {item.avg && (
          <div style={{fontSize:9,color:"#ffffff33"}}>1日平均 {item.avg} PV</div>
        )}
        {/* Mobile mini-bar */}
        {isMobile && (
          <div style={{height:2,background:"#ffffff0a",borderRadius:1,overflow:"hidden",marginTop:5}}>
            <div style={{height:"100%",background:accentColor,width:`${(item.val||item.pv) > 0 ? "60%" : "20%"}`,borderRadius:1,opacity:.5}} />
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{
          fontFamily:"'Bebas Neue'",
          fontSize:isMobile?20:28,
          color:i===0?accentColor:CREAM,
          lineHeight:1,
        }}>{(item.val ?? item.pv).toLocaleString()}</div>
        <div style={{fontSize:9,color:"#ffffff33",letterSpacing:1}}>{valLabel}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   記事一覧ページ
══════════════════════════════════════════════ */
function ArticleListPage({ data, isMobile }) {
  const [query, setQuery]             = useState("");
  const [sortKey, setSortKey]         = useState("pv");
  const [statusFilter, setStatusFilter] = useState("すべて");
  const [page, setPage]               = useState(1);
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
        if (sortKey === "title")  return a.title.localeCompare(b.title, "ja");
        return 0;
      });
  }, [data, query, sortKey, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const maxPV = data?.articleList?.length ? Math.max(...data.articleList.map(a=>a.pv), 1) : 1;

  useEffect(() => setPage(1), [query, sortKey, statusFilter]);

  return (
    <div className="page-fade" style={{minHeight:"100vh",background:INK,color:CREAM,paddingBottom:isMobile?80:40}}>

      {/* ヘッダー */}
      <div style={{padding:isMobile?"24px 16px 0":"48px 40px 0",maxWidth:960,margin:"0 auto"}}>
        <span className="badge" style={{background:C,color:"#fff",marginBottom:12,display:"inline-block"}}>ARCHIVE</span>
        <h1 style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(40px,9vw,80px)",lineHeight:.88,marginBottom:8}}>
          記事一覧
        </h1>
        <p style={{fontSize:12,color:"#ffffff44",marginBottom:20}}>
          {data ? `全 ${data.articleList.length} 記事 · 検索・フィルタ・ソート` : "読み込み中…"}
        </p>

        {/* 検索 */}
        <input
          className="search-input"
          placeholder="🔍  記事タイトルで検索…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        {/* フィルタ */}
        <div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:6,overflowX:"auto",paddingBottom:2}}>
          {STATUS_LIST.map(s => (
            <button key={s} className={`filter-chip${statusFilter===s?" active":""}`} onClick={()=>setStatusFilter(s)}>{s}</button>
          ))}
        </div>

        {/* ソート */}
        <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
          {[{k:"pv",label:"PV順"},{k:"sk",label:"スキ順"},{k:"skRate",label:"スキ率順"},{k:"title",label:"タイトル順"}]
            .map(s => (
              <button key={s.k} className={`sort-btn${sortKey===s.k?" active":""}`} onClick={()=>setSortKey(s.k)}>{s.label}</button>
            ))
          }
        </div>

        <div style={{marginTop:10,marginBottom:4,fontSize:11,color:"#ffffff33",fontFamily:"'Syne',sans-serif",letterSpacing:1}}>
          {filtered.length} 件{query ? ` / 「${query}」` : ""}
        </div>
      </div>

      {/* テーブル / リスト */}
      <div style={{maxWidth:960,margin:"0 auto",padding:isMobile?"8px 0 60px":"12px 40px 60px"}}>
        {/* デスクトップ ヘッダー行 */}
        {!isMobile && (
          <div style={{
            display:"grid",gridTemplateColumns:"1fr 80px 80px 80px 130px",
            gap:16,padding:"10px 20px",
            borderBottom:"1px solid #ffffff14",
            fontSize:10,color:"#ffffff33",
            fontFamily:"'Syne',sans-serif",letterSpacing:1,
          }}>
            <div>TITLE</div>
            <div style={{textAlign:"right"}}>PV</div>
            <div style={{textAlign:"right"}}>スキ</div>
            <div style={{textAlign:"right"}}>スキ率</div>
            <div style={{textAlign:"center"}}>STATUS</div>
          </div>
        )}

        {!data
          ? [1,2,3,4,5,6,7,8].map(i=>(
              <div key={i} style={{padding:"14px 16px",borderBottom:"1px solid #ffffff08"}}>
                <Skeleton w={`${50+i*5}%`} h={16} />
              </div>
            ))
          : paged.length === 0
            ? <div style={{textAlign:"center",padding:"60px 20px",color:"#ffffff22",fontSize:14}}>
                該当する記事が見つかりませんでした
              </div>
            : paged.map((a,i) => {
                const sc = STATUS_COLOR[a.status] || "#ffffff22";

                if (isMobile) {
                  return (
                    <div key={i} className="mob-article">
                      {/* PV circle */}
                      <div style={{flexShrink:0,width:48,height:48,borderRadius:"50%",
                        border:`2px solid ${C}44`,
                        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                        background:`${C}0a`}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:15,color:C,lineHeight:1}}>
                          {a.pv >= 1000 ? `${(a.pv/1000).toFixed(1)}k` : a.pv}
                        </div>
                        <div style={{fontSize:7,color:`${C}88`,letterSpacing:.5}}>PV</div>
                      </div>
                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:CREAM,lineHeight:1.35,overflow:"hidden",
                          display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                          {a.title}
                        </div>
                        <div style={{display:"flex",gap:8,marginTop:5,alignItems:"center"}}>
                          {a.status !== "—" && (
                            <span style={{
                              fontSize:9,padding:"2px 7px",borderRadius:10,
                              background:`${sc}18`,color:sc,border:`1px solid ${sc}33`,
                            }}>{a.status}</span>
                          )}
                          <span style={{fontSize:10,color:"#ffffff33"}}>♥ {a.sk}</span>
                          <span style={{fontSize:10,color:"#ffffff22"}}>{a.skRate}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={i}
                    className="article-row"
                    style={{
                      display:"grid",
                      gridTemplateColumns:"1fr 80px 80px 80px 130px",
                      gap:16,
                      padding:"14px 20px",
                      borderBottom:"1px solid #ffffff08",
                      alignItems:"center",
                    }}
                  >
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:CREAM,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:5}}>
                        {a.title}
                      </div>
                      <div style={{height:2,background:"#ffffff0a",borderRadius:1,overflow:"hidden"}}>
                        <div style={{height:"100%",background:C,width:`${(a.pv/maxPV)*100}%`,borderRadius:1,opacity:.5}} />
                      </div>
                    </div>
                    <div style={{textAlign:"right",fontFamily:"'Bebas Neue'",fontSize:20,color:C,lineHeight:1}}>{a.pv.toLocaleString()}</div>
                    <div style={{textAlign:"right",fontFamily:"'Bebas Neue'",fontSize:20,color:"#ff9ec4",lineHeight:1}}>{a.sk}</div>
                    <div style={{textAlign:"right",fontSize:12,color:"#ffffff55"}}>{a.skRate}%</div>
                    <div style={{textAlign:"center"}}>
                      <span style={{
                        display:"inline-block",padding:"3px 10px",borderRadius:20,
                        fontSize:10,fontFamily:"'Syne',sans-serif",letterSpacing:.5,
                        background:`${sc}22`,color:sc,border:`1px solid ${sc}44`,whiteSpace:"nowrap",
                      }}>{a.status}</span>
                    </div>
                  </div>
                );
              })
        }

        {/* ページネーション */}
        {totalPages > 1 && (
          <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:32,flexWrap:"wrap"}}>
            {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
              <button
                key={n}
                onClick={()=>{ setPage(n); window.scrollTo({top:0,behavior:"smooth"}); }}
                style={{
                  width:36,height:36,borderRadius:"50%",
                  background:n===page?C:"#ffffff0a",
                  border:`1px solid ${n===page?C:"#ffffff18"}`,
                  color:n===page?"#fff":"#ffffff55",
                  fontFamily:"'Syne',sans-serif",fontSize:11,cursor:"pointer",
                  transition:"all .18s",
                }}
              >{n}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   メインコンポーネント
══════════════════════════════════════════════ */
export default function KitaWrapped() {
  const { data, error } = useNoteData();
  const [activeWorst, setActiveWorst] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const isMobile = useIsMobile();
  const loading = !data;

  if (error) return (
    <div style={{background:INK,color:"#f87171",minHeight:"100vh",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",fontFamily:"monospace",gap:12,padding:24,textAlign:"center"}}>
      <div style={{fontSize:40}}>⚠️</div>
      <div style={{fontSize:14}}>CSVが読み込めませんでした</div>
      <div style={{fontSize:11,color:"#64748b"}}>{error}</div>
      <div style={{fontSize:11,color:"#475569",marginTop:8}}>public/data/ にCSVを置いてください</div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:CREAM,color:INK,minHeight:"100vh",overflowX:"hidden"}}>

      {/* ══ デスクトップ スティッキータブナビ ══ */}
      {!isMobile && (
        <div style={{
          position:"sticky",top:0,zIndex:100,
          background:INK,borderBottom:"1px solid #ffffff14",
          display:"flex",alignItems:"center",
          padding:"0 32px",height:48,
        }}>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:3,color:C,marginRight:24,flexShrink:0}}>
            KITA<span style={{fontFamily:"'Noto Sans JP',sans-serif",fontWeight:700,fontSize:12,letterSpacing:1}}>core</span>
          </span>
          {[
            {id:"dashboard",label:"DASHBOARD"},
            {id:"articles", label:"記事一覧"},
          ].map(t=>(
            <button
              key={t.id}
              className="tab-btn"
              onClick={()=>{ setTab(t.id); window.scrollTo({top:0,behavior:"smooth"}); }}
              style={{
                padding:"0 20px",height:48,
                color:tab===t.id?CREAM:"#ffffff33",
                borderBottom:`2px solid ${tab===t.id?C:"transparent"}`,
                marginBottom:-1,
              }}
            >{t.label}</button>
          ))}
          <div style={{flex:1}} />
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:9,letterSpacing:1,color:"#ffffff33",flexShrink:0}}>
            {loading?"—":data.updatedAt}
          </span>
        </div>
      )}

      {/* ══ モバイル ボトムナビ ══ */}
      {isMobile && (
        <nav className="bottom-nav">
          {[
            {id:"dashboard",icon:"▦",label:"DASH"},
            {id:"articles", icon:"≡",label:"記事"},
          ].map(t=>(
            <button
              key={t.id}
              className={`bottom-nav-btn${tab===t.id?" active":""}`}
              onClick={()=>{ setTab(t.id); window.scrollTo({top:0,behavior:"smooth"}); }}
            >
              <span className="bottom-nav-icon" style={{
                fontFamily:"'Bebas Neue'",fontSize:22,
                color:tab===t.id?C:"#ffffff33",
              }}>{t.icon}</span>
              <span className="bottom-nav-label">{t.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* ══ ダッシュボード ══ */}
      {tab === "dashboard" && (
        <div className="page-fade" style={{paddingBottom:isMobile?80:0}}>

          {/* ─── HERO ─── */}
          <section style={{
            minHeight: isMobile ? "100svh" : "100svh",
            display:"flex",flexDirection:"column",
            background:INK,color:CREAM,
            position:"relative",overflow:"hidden",
          }}>
            {/* Radial glow */}
            <div style={{position:"absolute",inset:0,
              backgroundImage:"radial-gradient(circle at 20% 50%,#2a1500,transparent 60%),radial-gradient(circle at 80% 20%,#300a00,transparent 50%)",
              pointerEvents:"none"}} />
            <div className="hero-noise" />

            {/* モバイル: タイトル + ロゴ */}
            {isMobile && (
              <div style={{
                padding:"20px 16px 0",position:"relative",zIndex:1,
                display:"flex",alignItems:"center",justifyContent:"space-between",
              }}>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:3,color:C}}>
                  KITA<span style={{fontFamily:"'Noto Sans JP',sans-serif",fontWeight:700,fontSize:12,letterSpacing:1}}>core</span>
                </span>
                <span style={{fontFamily:"'Syne',sans-serif",fontSize:9,letterSpacing:1,color:"#ffffff33"}}>
                  {loading?"—":data.updatedAt}
                </span>
              </div>
            )}

            {/* Body */}
            <div className="hero-bd fu d1" style={{
              flex:1,display:"flex",flexDirection:"column",justifyContent:"center",
              position:"relative",zIndex:1,
              paddingTop: isMobile ? 40 : 80,
              paddingLeft: isMobile ? 16 : 32,
              paddingRight: isMobile ? 16 : 32,
            }}>
              {/* Big title */}
              <div style={{
                fontFamily:"'Bebas Neue'",
                fontSize: isMobile ? "clamp(72px,20vw,100px)" : "clamp(60px,15vw,160px)",
                lineHeight:.88,letterSpacing:"-2px",color:CREAM,
              }}>
                DATA <span style={{color:C}}>×</span> NOTE
              </div>

              <div className="fu d2" style={{
                fontFamily:"'Syne',sans-serif",
                fontSize: isMobile ? "clamp(12px,3.5vw,15px)" : "clamp(12px,3vw,17px)",
                color:"#ffffff66",marginTop:16,maxWidth:480,lineHeight:1.7,
              }}>
                {loading?"データ読み込み中…":`${data.totalArt}本の記事・${data.updatedAt}集計。ログは続く。`}
              </div>

              {/* ─── KPI: モバイルは横スクロールカード、デスクトップは縦リスト ─── */}
              {isMobile ? (
                <div className="fu d3" style={{marginTop:28,marginLeft:-16,marginRight:-16}}>
                  <KpiScrollStrip data={data} loading={loading} />
                </div>
              ) : (
                <div className="fu d3 stat-row">
                  {loading
                    ? [1,2,3,4].map(i=><Skeleton key={i} w={80} h={64} />)
                    : [
                        {n:data.totalPV.toLocaleString(),u:"累計PV",diff:data.pvDiff},
                        {n:data.totalSK.toLocaleString(),u:"累計スキ",diff:data.skDiff},
                        {n:data.lastFollower.toLocaleString(),u:"フォロワー",diff:data.followerDiff,msg:data.followerMsg},
                        {n:data.totalArt.toLocaleString(),u:"総記事数",diff:data.artDiff},
                      ].map(k=>(
                        <div key={k.u}>
                          <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(30px,7vw,60px)",color:C,lineHeight:1}}>{k.n}</div>
                            {k.diff!==undefined&&k.diff!==0&&(
                              <span className={`diff-pill ${k.diff>0?"up":"down"}`}>
                                {k.diff>0?`▲${k.diff}`:`▼${Math.abs(k.diff)}`}
                              </span>
                            )}
                          </div>
                          <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,color:"#ffffff55",letterSpacing:2,marginTop:4}}>{k.u}</div>
                          {k.msg&&<div style={{marginTop:6,fontSize:11,color:k.diff>0?"#86efac":k.diff<0?"#fca5a5":"#ffffff66",fontStyle:"italic"}}>{k.msg}</div>}
                        </div>
                      ))
                  }
                </div>
              )}
            </div>

            <div style={{
              position:"absolute",bottom:isMobile?90:20,left:"50%",
              transform:"translateX(-50%)",
              fontFamily:"'Syne',sans-serif",fontSize:10,letterSpacing:3,color:"#ffffff22",
            }}>SCROLL ↓</div>
          </section>

          {/* ─── TICKER ─── */}
          <div className="ticker-wrap" style={{background:"#fff8e7"}}>
            <div className="ticker-inner">
              {loading?"　データ読み込み中…　".repeat(8):(data.tickerText+"　").repeat(4)}
            </div>
          </div>

          {/* ─── GROWTH ─── */}
          <section className="sec" style={{
            maxWidth:900,margin:"0 auto",
            padding: isMobile ? "40px 16px" : "80px 32px",
          }}>
            <div className="growth-grid">
              <div>
                <span className="badge" style={{background:C,color:"#fff",marginBottom:16}}>GROWTH</span>
                {loading
                  ? <><Skeleton w="80%" h={72} style={{marginTop:12}} /><Skeleton w="60%" h={20} style={{marginTop:16}} /></>
                  : <>
                    <h2 style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(38px,9vw,80px)",lineHeight:.9,marginTop:12}}>
                      集計開始→今<br /><span style={{color:C}}>+{data.pvGrowth}%</span>
                    </h2>
                    <p style={{marginTop:20,lineHeight:1.8,color:"#5a3a1a",fontSize:14}}>
                      スキの伸びは <strong>+{data.skGrowth}%</strong>
                      {data.skGrowth>data.pvGrowth
                        ?<> とPVを上回る。<br />「数字より質」が育ってる証拠。</>
                        :data.skGrowth>0
                        ?<> で成長中。<br />PVと一緒にファンも増やしていこ。</>
                        :<> は伸び途中。<br />スキされる記事、研究する価値あり。</>}
                    </p>
                    <div style={{marginTop:24,display:"flex",gap:20}}>
                      <div style={{borderLeft:`3px solid ${C}`,paddingLeft:12}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:C}}>+{data.skGrowth}%</div>
                        <div style={{fontSize:11,color:"#999",letterSpacing:1}}>スキ増加率</div>
                      </div>
                      <div style={{borderLeft:"3px solid #ccc",paddingLeft:12}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:INK}}>{parseFloat(data.skiRate).toFixed(1)}%</div>
                        <div style={{fontSize:11,color:"#999",letterSpacing:1}}>平均スキ率</div>
                      </div>
                    </div>
                  </>
                }
              </div>
              <div style={{
                background:"#fff",borderRadius:16,
                padding:isMobile?"16px 8px":"24px 16px",
                boxShadow:"0 4px 32px #d44a0018",
              }}>
                <div style={{fontSize:11,color:"#999",letterSpacing:2,marginBottom:8,fontFamily:"'Syne',sans-serif"}}>TOTAL PV GROWTH</div>
                {loading
                  ? <Skeleton w="100%" h={160} />
                  : <ResponsiveContainer width="100%" height={isMobile?150:180}>
                    <LineChart data={data.growthChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" />
                      <XAxis dataKey="d" tick={{fill:"#aaa",fontSize:9}} interval={isMobile?5:2} />
                      <YAxis tick={{fill:"#aaa",fontSize:9}} tickFormatter={v=>`${Math.round(v/1000)}K`} width={30} />
                      <Line type="monotone" dataKey="v" stroke={C} strokeWidth={2.5} dot={false} name="PV" />
                      <Tooltip contentStyle={{background:INK,border:"none",borderRadius:8,fontSize:12,color:CREAM}} formatter={v=>[v.toLocaleString(),"累計PV"]} />
                    </LineChart>
                  </ResponsiveContainer>
                }
              </div>
            </div>
          </section>

          {/* ─── TOP5 30日 ─── */}
          <section style={{
            background:INK,color:CREAM,
            padding: isMobile ? "40px 0" : "80px 32px",
          }}>
            <div style={{maxWidth:900,margin:"0 auto"}}>
              <div style={{
                display:"flex",alignItems:"baseline",gap:12,
                marginBottom:isMobile?20:36,
                flexWrap:"wrap",
                padding: isMobile ? "0 16px" : 0,
              }}>
                <span className="badge" style={{background:C,color:"#fff"}}>HALL OF FAME</span>
                <h2 style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(28px,7vw,64px)",lineHeight:1}}>30日間ランキング</h2>
              </div>
              {loading
                ? [1,2,3,4,5].map(i=><Skeleton key={i} w="100%" h={56} style={{marginBottom:12,borderRadius:0}} />)
                : data.top5.map((a,i)=>(
                  <RankRow key={i} item={a} i={i} accentColor={C} valLabel="PV/30日" isMobile={isMobile} />
                ))
              }
            </div>
          </section>

          {/* ─── 累計PV TOP5 ─── */}
          <section style={{
            background:"#120800",color:CREAM,
            borderTop:"1px solid #ffffff0a",
            padding: isMobile ? "40px 0" : "80px 32px",
          }}>
            <div style={{maxWidth:900,margin:"0 auto"}}>
              <div style={{
                display:"flex",alignItems:"baseline",gap:12,
                marginBottom:isMobile?20:36,flexWrap:"wrap",
                padding: isMobile ? "0 16px" : 0,
              }}>
                <span className="badge" style={{background:"#ffffff22",color:CREAM}}>ALL TIME</span>
                <h2 style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(28px,7vw,64px)",lineHeight:1}}>累計PV ランキング</h2>
              </div>
              {loading
                ? [1,2,3,4,5].map(i=><Skeleton key={i} w="100%" h={56} style={{marginBottom:12,borderRadius:0}} />)
                : data.top5PV.map((a,i)=>(
                  <RankRow key={i} item={a} i={i} accentColor={C} valLabel="累計PV" isMobile={isMobile} />
                ))
              }
            </div>
          </section>

          {/* ─── スキ TOP5 ─── */}
          <section style={{
            background:"#0e0a14",color:CREAM,
            borderTop:"1px solid #ffffff0a",
            padding: isMobile ? "40px 0" : "80px 32px",
          }}>
            <div style={{maxWidth:900,margin:"0 auto"}}>
              <div style={{
                display:"flex",alignItems:"baseline",gap:12,
                marginBottom:isMobile?20:36,flexWrap:"wrap",
                padding: isMobile ? "0 16px" : 0,
              }}>
                <span className="badge" style={{background:"#ff6b9d44",color:"#ff9ec4"}}>LOVE</span>
                <h2 style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(28px,7vw,64px)",lineHeight:1}}>スキ ランキング</h2>
              </div>
              {loading
                ? [1,2,3,4,5].map(i=><Skeleton key={i} w="100%" h={56} style={{marginBottom:12,borderRadius:0}} />)
                : data.top5SK.length === 0
                  ? <div style={{fontSize:13,color:"#ffffff44",padding:"24px 16px"}}>スキデータが見つかりませんでした</div>
                  : data.top5SK.map((a,i)=>(
                    <RankRow key={i} item={a} i={i} accentColor="#ff6b9d" valLabel="スキ数" isMobile={isMobile} />
                  ))
              }
            </div>
          </section>

          {/* ─── WORST ─── */}
          <section style={{
            background:INK,color:CREAM,
            borderTop:"1px solid #ffffff0a",
            padding: isMobile ? "40px 16px" : "80px 32px",
          }}>
            <div style={{maxWidth:900,margin:"0 auto"}}>
              <span className="badge" style={{background:"#ffffff22",color:CREAM,marginBottom:12,display:"inline-block"}}>HALL OF SHAME</span>
              <h2 style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(38px,10vw,80px)",lineHeight:.88,marginBottom:8}}>
                ワースト記事<br /><span style={{color:"#ffffff44",fontSize:"70%"}}>も、ネタになる。</span>
              </h2>
              <p style={{fontSize:12,color:"#ffffff44",marginBottom:28,letterSpacing:1}}>
                {loading?"—":`${data.stopPct}%の記事が「停止」判定。でも失敗ログこそが資産。`}
              </p>
              <div className="worst-grid">
                {loading
                  ? [1,2,3].map(i=><Skeleton key={i} w="100%" h={160} style={{borderRadius:14}} />)
                  : data.worst3.map((w,i)=>(
                    <div
                      key={i}
                      className="worst-card"
                      onClick={()=>setActiveWorst(activeWorst===i?null:i)}
                      style={{
                        background:activeWorst===i?C:"#ffffff0d",
                        border:"1px solid #ffffff18",
                        borderRadius:14,
                        padding:isMobile?"18px 14px":"24px 20px",
                      }}
                    >
                      <div style={{fontSize:isMobile?24:30,marginBottom:10}}>{["😶","😑","🫣"][i]}</div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:isMobile?12:14,lineHeight:1.3,marginBottom:8,color:CREAM}}>「{w.title}」</div>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:isMobile?32:40,color:activeWorst===i?"#fff":C,lineHeight:1}}>{w.pv} PV</div>
                      {activeWorst===i
                        ? <div style={{marginTop:14,fontSize:12,lineHeight:1.7,color:"#fff",fontStyle:"italic",borderTop:"1px solid #ffffff44",paddingTop:12}}>💬 {w.roast}</div>
                        : <div style={{fontSize:10,color:"#ffffff33",marginTop:10}}>タップで詳細 →</div>
                      }
                    </div>
                  ))
                }
              </div>
              <div style={{
                marginTop:28,padding:isMobile?"16px":"24px 28px",
                background:"#ffffff08",borderRadius:14,
                border:"1px dashed #ffffff22",
                display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",
              }}>
                <div style={{fontSize:28}}>🏆</div>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:CREAM}}>
                    {loading?"—":`全${data.totalArt}記事中、${data.stopPct}%が「活動停止」状態`}
                  </div>
                  <div style={{fontSize:12,color:"#ffffff55",marginTop:4,lineHeight:1.6}}>
                    「note記事の寿命は5日間」──自ら証明した仮説通り。<br />
                    <strong style={{color:C}}>失敗データを記事にして一番PVを取ったのがワイや。</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── TREND ─── */}
          <section style={{
            background:"#fff8e7",
            padding: isMobile ? "40px 16px" : "80px 32px",
          }}>
            <div style={{maxWidth:900,margin:"0 auto"}}>
              <span className="badge" style={{background:INK,color:CREAM,marginBottom:16,display:"inline-block"}}>STATUS</span>
              <h2 style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(30px,8vw,64px)",lineHeight:.9,marginBottom:isMobile?24:36}}>
                記事の「今」を<br />4分類で見ると
              </h2>
              <div className="trend-grid">
                {[
                  {s:"🔥 急上昇",key:"rising",desc:"昨日PVが伸び中。アルゴリズムに乗ってる。",c:C,bg:"#d44a0008"},
                  {s:"🟢 継続",key:"cont",desc:"ピークを過ぎても安定して読まれ続ける。",c:"#22c55e",bg:"#22c55e08"},
                  {s:"⚠️ 減速",key:"slow",desc:"落ちてきてるが生きてる。リライト候補。",c:"#ca8a04",bg:"#ca8a0408"},
                  {s:"💤 停止",key:"stop",desc:"7日間PVほぼゼロ。でも「寿命の証拠」として機能中。",c:"#64748b",bg:"#64748b08"},
                ].map(s=>{
                  const n=loading?0:(data[s.key]||0);
                  const total=loading?1:(data.rising+data.cont+data.slow+data.stop||1);
                  return (
                    <div key={s.s} style={{
                      background:s.bg,
                      border:`1px solid ${s.c}33`,
                      borderRadius:16,
                      padding:isMobile?"16px":"24px",
                    }}>
                      <div style={{fontSize:15,marginBottom:8}}>{s.s}</div>
                      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:8}}>
                        {loading
                          ? <Skeleton w={60} h={44} />
                          : <><span style={{fontFamily:"'Bebas Neue'",fontSize:isMobile?40:52,color:s.c,lineHeight:1}}>{n}</span>
                            <span style={{fontSize:14,color:s.c,fontWeight:700}}>記事</span>
                            <span style={{fontSize:12,color:"#999",marginLeft:"auto"}}>{Math.round(n/total*100)}%</span>
                          </>
                        }
                      </div>
                      <div style={{height:4,background:`${s.c}22`,borderRadius:2,marginBottom:10,overflow:"hidden"}}>
                        <div style={{height:"100%",background:s.c,width:`${Math.round(n/total*100)}%`,borderRadius:2,transition:"width .8s"}} />
                      </div>
                      <p style={{fontSize:12,color:"#5a3a1a",lineHeight:1.6}}>{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ─── FOOTER ─── */}
          <section style={{
            background:INK,color:CREAM,
            padding: isMobile ? "40px 16px 32px" : "80px 32px 60px",
            textAlign:"center",
          }}>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(44px,13vw,110px)",lineHeight:.85,marginBottom:20}}>
              ログは<span style={{color:C}}>続く。</span>
            </div>
            <p style={{fontSize:14,color:"#ffffff55",maxWidth:460,margin:"0 auto",lineHeight:1.8}}>
              データで遊び、失敗をネタにし、また書く。<br />KITAcoreのnoteはまだ途中です。
            </p>
            <div style={{marginTop:36,fontSize:11,fontFamily:"'Syne',sans-serif",letterSpacing:3,color:"#ffffff33",borderBottom:"1px solid #ffffff22",paddingBottom:6,display:"inline-block"}}>
              {loading?"読み込み中…":`集計日 ${data.updatedAt} — 自動更新中`}
            </div>
          </section>
        </div>
      )}

      {/* ══ 記事一覧 ══ */}
      {tab === "articles" && <ArticleListPage data={data} isMobile={isMobile} />}

    </div>
  );
}
