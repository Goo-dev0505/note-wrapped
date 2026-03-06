import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";

/* ── Fonts & Animations ───────────────────────────── */
const styleEl = document.createElement("style");
styleEl.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+JP:wght@400;700;900&family=Syne:wght@700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  .fu{animation:fadeUp .7s cubic-bezier(.22,1,.36,1) both}
  .d1{animation-delay:.1s}.d2{animation-delay:.2s}.d3{animation-delay:.35s}.d4{animation-delay:.5s}
  .ticker-wrap{overflow:hidden;white-space:nowrap;border-top:2px solid #1a0f00;border-bottom:2px solid #1a0f00;padding:10px 0}
  .ticker-inner{display:inline-block;animation:ticker 26s linear infinite;font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:2px;color:#d44a00}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-family:'Syne',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase}
  .skeleton{background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:8px}
  .worst-card{transition:all .3s;cursor:pointer;-webkit-tap-highlight-color:transparent;}
  .worst-card:hover{transform:translateY(-3px)}
  .worst-card:active{transform:scale(0.97);}

  /* ── Layout helpers ── */
  .sec { padding: 80px 32px; }
  .hero-hd { padding: 24px 32px; }
  .hero-bd { padding: 0 32px 48px; }

  .growth-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; }
  .worst-grid  { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .trend-grid  { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .stat-row    { display:flex; flex-direction:column; gap:20px; margin-top:40px; }
  .top5-rank   { font-size:clamp(32px,5vw,56px); min-width:60px; }
  .top5-pv     { font-size:28px; }
  .top5-bar    { display:block; }

  /* ── Tablet 641-900px ── */
  @media(min-width:641px) and (max-width:900px){
    .sec          { padding:64px 24px; }
    .hero-hd      { padding:20px 24px; }
    .hero-bd      { padding:0 24px 44px; }
    .growth-grid  { grid-template-columns:1fr; gap:32px; }
    .worst-grid   { grid-template-columns:1fr 1fr; gap:14px; }
  }

  /* ── Mobile ≤640px ── */
  @media(max-width:640px){
    .sec          { padding:52px 16px; }
    .hero-hd      { padding:16px 16px; }
    .hero-bd      { padding:0 16px 40px; }
    .growth-grid  { grid-template-columns:1fr; gap:24px; }
    .worst-grid   { grid-template-columns:1fr; gap:12px; }
    .trend-grid   { grid-template-columns:1fr; gap:12px; }
    .top5-rank    { font-size:32px; min-width:40px; }
    .top5-pv      { font-size:20px; }
    .top5-bar     { display:none; }
  }
`;
document.head.appendChild(styleEl);

/* ── 除外記事リスト ──────────────────────────────── */
const EXCLUDED_TITLES = [
  'ナイキ エア ヴェイパーマックス 360',
  '自作PC#2', 'メモ', 'スターバックス記事#1',
  'みんなが貪欲になっているときこそ恐怖心を抱き、みんなが恐怖心を抱いているとき…',
  'はたらくこと', '気になるレシピ#1', 'This is US', '"50',
];

/* ── CSV Parser ───────────────────────────────────── */
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

/* ── Mobile detect hook ───────────────────────────── */
function useIsMobile() {
  const [v, setV] = useState(typeof window !== "undefined" ? window.innerWidth <= 640 : false);
  useEffect(() => {
    const fn = () => setV(window.innerWidth <= 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return v;
}

/* ── Data hook ────────────────────────────────────── */
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
      const totalPV = parseInt(latest["ビュー合計"] || latest["pv"] || 0);
      const totalSK = parseInt(latest["スキ合計"] || latest["sk"] || 0);
      const totalArt = parseInt(latest["記事数"] || 0);
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
      const followerUpMsgs = ["ぇ？今日のワイの記事がいけてるん！？","フォロワー増えとる…なんか怖いんやけど笑","誰かワイのこと好きになってくれたん？ありがとな。","これ、バレたらどうしよ（何が）","ちょっと待って、今日なんかいい記事書いたっけ？"];
      const followerDownMsgs = ["いや～、フォロワーが減ってもうた！","去った人よ、元気でな。","フォロワー減ったけど、ワイは元気です。","これがnoteの現実やな…（メモしとく）","減った分だけ、残った人が濃いってことにしとく。"];
      const followerFlatMsgs = ["今日はフォロワー動かず。嵐の前の静けさ？","現状維持。悪くない、悪くない。","誰も来ず、誰も去らず。平和な一日。"];
      const followerMsg = followerDiff > 0
        ? followerUpMsgs[Math.abs(followerDiff + new Date().getDate()) % followerUpMsgs.length]
        : followerDiff < 0 ? followerDownMsgs[Math.abs(Math.abs(followerDiff)+new Date().getDate())%followerDownMsgs.length]
        : followerFlatMsgs[new Date().getDate()%followerFlatMsgs.length];
      const step = Math.max(1, Math.floor(daily.length/16));
      const growthChart = daily.filter((_,i)=>i%step===0||i===daily.length-1)
        .map(r=>({ d:(r["日付"]||"").replace("2025/","").replace("2026/","").replace(/^0/,""), v:parseInt(r["ビュー合計"]||0), s:parseInt(r["スキ合計"]||0) }));
      const latestArticleDate = articles.reduce((a,b)=>(a.date||"")>(b.date||"")?a:b).date;
      const EMOJIS = ["💀","🔧","🔬","🎨","⚗️"];
      const top5 = ranking.sort((a,b)=>parseInt(b["期間増加PV"]||0)-parseInt(a["期間増加PV"]||0)).slice(0,5)
        .map((r,i)=>({ rank:String(i+1).padStart(2,"0"), title:(r["title"]||"").replace(/ #\d+$/,"").slice(0,32), pv:parseInt(r["期間増加PV"]||0), avg:parseFloat(r["1日平均PV"]||0).toFixed(1), emoji:EMOJIS[i] }));

      // 累計PV Top5（articles.csv の read_count）
      const PV_EMOJIS = ["👑","🥈","🥉","🎖️","🏅"];
      const top5PV = articles
        .filter(r => r.date === latestArticleDate && parseInt(r["read_count"]||0) > 0)
        .sort((a,b) => parseInt(b["read_count"]||0) - parseInt(a["read_count"]||0))
        .slice(0, 5)
        .map((r,i) => ({ rank:String(i+1).padStart(2,"0"), title:(r["title"]||"").replace(/ #\d+$/,"").slice(0,32), val:parseInt(r["read_count"]||0), emoji:PV_EMOJIS[i] }));

      // スキ Top5（like_count / スキ数 など）
      const SK_EMOJIS = ["💖","💗","💓","💞","💝"];
      const skKey = articles[0] && (articles[0]["like_count"]!==undefined ? "like_count" : articles[0]["スキ数"]!==undefined ? "スキ数" : null);
      const top5SK = skKey ? articles
        .filter(r => r.date === latestArticleDate && parseInt(r[skKey]||0) > 0)
        .sort((a,b) => parseInt(b[skKey]||0) - parseInt(a[skKey]||0))
        .slice(0, 5)
        .map((r,i) => ({ rank:String(i+1).padStart(2,"0"), title:(r["title"]||"").replace(/ #\d+$/,"").slice(0,32), val:parseInt(r[skKey]||0), emoji:SK_EMOJIS[i] }))
        : [];
      const trendCounts = {};
      trend.forEach(r=>{ const s=r["状態"]||r["state"]||""; trendCounts[s]=(trendCounts[s]||0)+1; });
      const ROASTS = ["タイトルだけで完結してた。","投稿した本人が一番驚いている。","来ると思ってた。来なかった。","短すぎたのか、長すぎたのか。謎は深まるばかり。","存在は確認されている。"];
      const worst3 = articles.filter(r=>r.date===latestArticleDate&&parseInt(r["read_count"]||0)>0&&!EXCLUDED_TITLES.includes((r["title"]||"").trim()))
        .sort((a,b)=>parseInt(a["read_count"]||0)-parseInt(b["read_count"]||0)).slice(0,3)
        .map((r,i)=>({ title:(r["title"]||"").replace(/ #\d+$/,"").slice(0,28), pv:parseInt(r["read_count"]||0), roast:ROASTS[i%ROASTS.length] }));
      const rising=trendCounts["🔥 急上昇"]||0, cont=trendCounts["🟢 継続"]||0,
            slow=trendCounts["⚠️ 減速"]||0, stop=trendCounts["💤 停止"]||0;
      const skiRate = latest["スキ率(%)"]||latest["スキ率"]||"—";
      const follData = followers.filter(r=>r["フォロワー数"]);
      setData({
        totalPV,totalSK,totalArt,pvGrowth,skGrowth,pvDiff,skDiff,artDiff,lastFollower,followerDiff,followerMsg,
        growthChart,top5,top5PV,top5SK,trendCounts,worst3,skiRate,
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

export default function KitaWrapped() {
  const { data, error } = useNoteData();
  const [activeWorst, setActiveWorst] = useState(null);
  const isMobile = useIsMobile();
  const loading = !data;

  if (error) return (
    <div style={{background:INK,color:"#f87171",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"monospace",gap:12,padding:24,textAlign:"center"}}>
      <div style={{fontSize:32}}>⚠️</div>
      <div style={{fontSize:14}}>CSVが読み込めませんでした</div>
      <div style={{fontSize:11,color:"#64748b"}}>{error}</div>
      <div style={{fontSize:11,color:"#475569",marginTop:8}}>public/data/ にCSVを置いてください</div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:CREAM,color:INK,minHeight:"100vh",overflowX:"hidden"}}>

      {/* ── HERO ── */}
      <section style={{minHeight:"100svh",display:"flex",flexDirection:"column",background:INK,color:CREAM,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 20% 50%,#2a1500,transparent 60%),radial-gradient(circle at 80% 20%,#300a00,transparent 50%)",pointerEvents:"none"}} />

        <div className="hero-hd" style={{display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative",zIndex:1,borderBottom:"1px solid #ffffff18"}}>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:3,color:C}}>KITA<span style={{fontFamily:"'Noto Sans JP',sans-serif",fontWeight:700,fontSize:14,letterSpacing:1}}>core</span></span>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:10,letterSpacing:1,color:"#ffffff44"}}>
            {loading?"—":`更新 ${data.updatedAt}`}
          </span>
        </div>

        <div className="hero-bd fu d1" style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",position:"relative",zIndex:1}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(60px,15vw,160px)",lineHeight:.88,letterSpacing:"-2px",color:CREAM}}>
            DATA <span style={{color:C}}>×</span> NOTE
          </div>
          <div className="fu d2" style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(12px,3vw,17px)",color:"#ffffff88",marginTop:20,maxWidth:480,lineHeight:1.7}}>
            {loading?"データ読み込み中…":`${data.totalArt}本の記事・${data.updatedAt}集計。ログは続く。`}
          </div>

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
                        <div style={{fontSize:11,color:k.diff>0?"#86efac":"#fca5a5",lineHeight:1}}>
                          <span style={{fontSize:9,opacity:.7,marginRight:3}}>前日比</span>{k.diff>0?`▲${k.diff}`:`▼${Math.abs(k.diff)}`}
                        </div>
                      )}
                    </div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,color:"#ffffff55",letterSpacing:2,marginTop:4}}>{k.u}</div>
                    {k.msg&&(
                      <div style={{marginTop:6,fontSize:11,color:k.diff>0?"#86efac":k.diff<0?"#fca5a5":"#ffffff66",fontStyle:"italic",}}>
                        {k.msg}
                      </div>
                    )}
                  </div>
                ))
            }
          </div>
        </div>
        <div style={{position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)",fontFamily:"'Syne',sans-serif",fontSize:10,letterSpacing:3,color:"#ffffff33"}}>SCROLL ↓</div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker-wrap" style={{background:"#fff8e7"}}>
        <div className="ticker-inner">
          {loading?"　データ読み込み中…　".repeat(8):(data.tickerText+"　").repeat(4)}
        </div>
      </div>

      {/* ── GROWTH ── */}
      <section className="sec" style={{maxWidth:900,margin:"0 auto"}}>
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

          <div style={{background:"#fff",borderRadius:16,padding:isMobile?"16px 8px":"24px 16px",boxShadow:"0 4px 32px #d44a0018"}}>
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

      {/* ── TOP 5 ── */}
      <section className="sec" style={{background:INK,color:CREAM}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:36,flexWrap:"wrap"}}>
            <span className="badge" style={{background:C,color:"#fff"}}>HALL OF FAME</span>
            <h2 style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(28px,7vw,64px)",lineHeight:1}}>30日間ランキング</h2>
          </div>
          {loading
            ? [1,2,3,4,5].map(i=><Skeleton key={i} w="100%" h={56} style={{marginBottom:12}} />)
            : data.top5.map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:isMobile?10:20,padding:isMobile?"12px 0":"20px 0",borderBottom:"1px solid #ffffff18"}}>
                <div className="top5-rank" style={{fontFamily:"'Bebas Neue'",color:i===0?C:"#ffffff22",lineHeight:1}}>{a.rank}</div>
                <div style={{fontSize:isMobile?14:18,flexShrink:0}}>{a.emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:isMobile?12:14,fontWeight:700,color:i===0?C:CREAM,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title}</div>
                  <div style={{fontSize:10,color:"#ffffff44",marginTop:4}}>1日平均 {a.avg} PV</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div className="top5-pv" style={{fontFamily:"'Bebas Neue'",color:i===0?C:CREAM}}>{a.pv}</div>
                  <div style={{fontSize:10,color:"#ffffff33",letterSpacing:1}}>PV/30日</div>
                </div>
                <div className="top5-bar" style={{width:60,flexShrink:0}}>
                  <div style={{height:4,background:"#ffffff18",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",background:i===0?C:"#ffffff44",width:`${a.pv/data.top5[0].pv*100}%`,borderRadius:2}} />
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </section>

      {/* ── 累計PV TOP5 ── */}
      <section className="sec" style={{background:"#120800",color:CREAM,borderTop:"1px solid #ffffff0a"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:36,flexWrap:"wrap"}}>
            <span className="badge" style={{background:"#ffffff22",color:CREAM}}>ALL TIME</span>
            <h2 style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(28px,7vw,64px)",lineHeight:1}}>累計PV ランキング</h2>
          </div>
          {loading
            ? [1,2,3,4,5].map(i=><Skeleton key={i} w="100%" h={56} style={{marginBottom:12}} />)
            : data.top5PV.map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:isMobile?10:20,padding:isMobile?"12px 0":"20px 0",borderBottom:"1px solid #ffffff18"}}>
                <div className="top5-rank" style={{fontFamily:"'Bebas Neue'",color:i===0?C:"#ffffff22",lineHeight:1}}>{a.rank}</div>
                <div style={{fontSize:isMobile?14:18,flexShrink:0}}>{a.emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:isMobile?12:14,fontWeight:700,color:i===0?C:CREAM,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div className="top5-pv" style={{fontFamily:"'Bebas Neue'",color:i===0?C:CREAM}}>{a.val.toLocaleString()}</div>
                  <div style={{fontSize:10,color:"#ffffff33",letterSpacing:1}}>累計PV</div>
                </div>
                <div className="top5-bar" style={{width:60,flexShrink:0}}>
                  <div style={{height:4,background:"#ffffff18",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",background:i===0?C:"#ffffff44",width:`${a.val/data.top5PV[0].val*100}%`,borderRadius:2}} />
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </section>

      {/* ── スキ TOP5 ── */}
      <section className="sec" style={{background:"#0e0a14",color:CREAM,borderTop:"1px solid #ffffff0a"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:36,flexWrap:"wrap"}}>
            <span className="badge" style={{background:"#ff6b9d44",color:"#ff9ec4"}}>LOVE</span>
            <h2 style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(28px,7vw,64px)",lineHeight:1}}>スキ ランキング</h2>
          </div>
          {loading
            ? [1,2,3,4,5].map(i=><Skeleton key={i} w="100%" h={56} style={{marginBottom:12}} />)
            : data.top5SK.length === 0
              ? <div style={{fontSize:13,color:"#ffffff44",padding:"24px 0"}}>スキデータが見つかりませんでした（like_count / スキ数 列を確認してください）</div>
              : data.top5SK.map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:isMobile?10:20,padding:isMobile?"12px 0":"20px 0",borderBottom:"1px solid #ffffff18"}}>
                  <div className="top5-rank" style={{fontFamily:"'Bebas Neue'",color:i===0?"#ff6b9d":"#ffffff22",lineHeight:1}}>{a.rank}</div>
                  <div style={{fontSize:isMobile?14:18,flexShrink:0}}>{a.emoji}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:isMobile?12:14,fontWeight:700,color:i===0?"#ff9ec4":CREAM,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div className="top5-pv" style={{fontFamily:"'Bebas Neue'",color:i===0?"#ff6b9d":CREAM}}>{a.val.toLocaleString()}</div>
                    <div style={{fontSize:10,color:"#ffffff33",letterSpacing:1}}>スキ数</div>
                  </div>
                  <div className="top5-bar" style={{width:60,flexShrink:0}}>
                    <div style={{height:4,background:"#ffffff18",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",background:i===0?"#ff6b9d":"#ffffff44",width:`${a.val/data.top5SK[0].val*100}%`,borderRadius:2}} />
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      </section>

      {/* ── WORST ── */}
      <section className="sec" style={{background:INK,color:CREAM,borderTop:"1px solid #ffffff0a"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <span className="badge" style={{background:"#ffffff22",color:CREAM,marginBottom:12,display:"inline-block"}}>HALL OF SHAME</span>
          <h2 style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(38px,10vw,80px)",lineHeight:.88,marginBottom:8}}>
            ワースト記事<br />
            <span style={{color:"#ffffff44",fontSize:"70%"}}>も、ネタになる。</span>
          </h2>
          <p style={{fontSize:12,color:"#ffffff44",marginBottom:32,letterSpacing:1}}>
            {loading?"—":`${data.stopPct}%の記事が「停止」判定。でも失敗ログこそが資産。`}
          </p>
          <div className="worst-grid">
            {loading
              ? [1,2,3].map(i=><Skeleton key={i} w="100%" h={160} />)
              : data.worst3.map((w,i)=>(
                <div
                  key={i}
                  className="worst-card"
                  onClick={()=>setActiveWorst(activeWorst===i?null:i)}
                  style={{background:activeWorst===i?C:"#ffffff0d",border:"1px solid #ffffff18",borderRadius:14,padding:isMobile?"18px 14px":"24px 20px"}}
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
          <div style={{marginTop:28,padding:isMobile?"16px":"24px 28px",background:"#ffffff08",borderRadius:14,border:"1px dashed #ffffff22",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
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

      {/* ── TREND ── */}
      <section className="sec" style={{background:"#fff8e7"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <span className="badge" style={{background:INK,color:CREAM,marginBottom:16,display:"inline-block"}}>STATUS</span>
          <h2 style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(30px,8vw,64px)",lineHeight:.9,marginBottom:36}}>
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
                <div key={s.s} style={{background:s.bg,border:`1px solid ${s.c}33`,borderRadius:16,padding:isMobile?"16px":"24px"}}>
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

      {/* ── FOOTER ── */}
      <section className="sec" style={{background:INK,color:CREAM,paddingBottom:60,textAlign:"center"}}>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(44px,13vw,110px)",lineHeight:.85,marginBottom:20}}>
          ログは<span style={{color:C}}>続く。</span>
        </div>
        <p style={{fontSize:14,color:"#ffffff55",maxWidth:460,margin:"0 auto",lineHeight:1.8}}>
          データで遊び、失敗をネタにし、また書く。<br />
          KITAcoreのnoteはまだ途中です。
        </p>
        <div style={{marginTop:36,fontSize:11,fontFamily:"'Syne',sans-serif",letterSpacing:3,color:"#ffffff33",borderBottom:"1px solid #ffffff22",paddingBottom:6,display:"inline-block"}}>
          {loading?"読み込み中…":`集計日 ${data.updatedAt} — 自動更新中`}
        </div>
      </section>

    </div>
  );
}
