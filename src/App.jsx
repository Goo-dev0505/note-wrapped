import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";

/* ── Fonts & Animations ───────────────────────────── */
const styleEl = document.createElement("style");
styleEl.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+JP:wght@400;700;900&family=Syne:wght@700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  .fu{animation:fadeUp .7s cubic-bezier(.22,1,.36,1) both}
  .d1{animation-delay:.1s}.d2{animation-delay:.2s}.d3{animation-delay:.35s}.d4{animation-delay:.5s}
  .ticker-wrap{overflow:hidden;white-space:nowrap;border-top:2px solid #1a0f00;border-bottom:2px solid #1a0f00;padding:10px 0}
  .ticker-inner{display:inline-block;animation:ticker 26s linear infinite;font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:2px;color:#d44a00}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-family:'Syne',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase}
  .skeleton{background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:8px}
  .worst-card{transition:all .3s;cursor:pointer}
  .worst-card:hover{transform:translateY(-4px)}
`;
document.head.appendChild(styleEl);

/* ── 除外記事リスト ────────────────────────────────
   ワースト表示から除外したいタイトルをここに追加
──────────────────────────────────────────────────── */
const EXCLUDED_TITLES = [
  // 例: 'テスト投稿',
  // 例: 'メモ',
];

/* ── CSV Parser ───────────────────────────────────── */
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
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
    ])
      .then(([dailyRaw, rankRaw, trendRaw, follRaw]) => {
        const daily = parseCSV(dailyRaw);
        const ranking = parseCSV(rankRaw);
        const trend = parseCSV(trendRaw);
        const followers = parseCSV(follRaw);

        // ── Latest snapshot ──
        const latest = daily[daily.length - 1];
        const first = daily[0];
        const totalPV = parseInt(latest["ビュー合計"] || latest["pv"] || 0);
        const totalSK = parseInt(latest["スキ合計"] || latest["sk"] || 0);
        const totalArt = parseInt(latest["記事数"] || 0);
        const firstPV = parseInt(first["ビュー合計"] || first["pv"] || 0);
        const firstSK = parseInt(first["スキ合計"] || first["sk"] || 0);
        const pvGrowth = firstPV > 0 ? Math.round((totalPV - firstPV) / firstPV * 100) : 0;
        const skGrowth = firstSK > 0 ? Math.round((totalSK - firstSK) / firstSK * 100) : 0;

        // ── Latest follower count ──
        const lastFollower = followers.length > 0
          ? parseInt(followers[followers.length - 1]["フォロワー数"] || 0)
          : 0;

        // ── Growth chart ──
        const step = Math.max(1, Math.floor(daily.length / 16));
        const growthChart = daily
          .filter((_, i) => i % step === 0 || i === daily.length - 1)
          .map(r => ({
            d: (r["日付"] || "").replace("2025/", "").replace("2026/", "").replace(/^0/, ""),
            v: parseInt(r["ビュー合計"] || 0),
            s: parseInt(r["スキ合計"] || 0),
          }));

        // ── TOP 5 from period_ranking ──
        const EMOJIS = ["💀","🔧","🔬","🎨","⚗️","🏆","✨","🎯","📊","🚀"];
        const top5 = ranking
          .sort((a, b) => parseInt(b["期間増加PV"] || 0) - parseInt(a["期間増加PV"] || 0))
          .slice(0, 5)
          .map((r, i) => ({
            rank: String(i + 1).padStart(2, "0"),
            title: (r["title"] || "").replace(/ #\d+$/, "").slice(0, 32),
            pv: parseInt(r["期間増加PV"] || 0),
            avg: parseFloat(r["1日平均PV"] || 0).toFixed(1),
            emoji: EMOJIS[i],
          }));

        // ── Trend counts ──
        const trendCounts = {};
        trend.forEach(r => {
          const s = r["状態"] || r["state"] || "";
          trendCounts[s] = (trendCounts[s] || 0) + 1;
        });

        // ── Worst 3 articles (EXCLUDED_TITLES で除外) ──
        const ROASTS = [
          "タイトルだけで完結してた。",
          "投稿した本人が一番驚いている。",
          "来ると思ってた。来なかった。",
          "短すぎたのか、長すぎたのか。謎は深まるばかり。",
          "存在は確認されている。",
        ];
        const worst3 = ranking
          .filter(r =>
            parseInt(r["期間増加PV"] || 0) > 0 &&
            !EXCLUDED_TITLES.includes((r["title"] || "").trim())
          )
          .sort((a, b) => parseInt(a["期間増加PV"] || 0) - parseInt(b["期間増加PV"] || 0))
          .slice(0, 3)
          .map((r, i) => ({
            title: (r["title"] || "").replace(/ #\d+$/, "").slice(0, 28),
            pv: parseInt(r["期間増加PV"] || 0),
            roast: ROASTS[i % ROASTS.length],
          }));

        // ── Ticker text ──
        const rising = trendCounts["🔥 急上昇"] || 0;
        const cont = trendCounts["🟢 継続"] || 0;
        const slow = trendCounts["⚠️ 減速"] || 0;
        const stop = trendCounts["💤 停止"] || 0;
        const skiRate = latest["スキ率(%)"] || latest["スキ率"] || "—";

        // ── Follower milestones ──
        const follData = followers.filter(r => r["フォロワー数"]);
        const follFirst = follData[0];
        const follLast = follData[follData.length - 1];
        const follMilestone = follData.find(r => parseInt(r["フォロワー数"]) >= 900);

        setData({
          totalPV, totalSK, totalArt, pvGrowth, skGrowth,
          lastFollower, growthChart, top5, trendCounts,
          worst3, skiRate,
          tickerText: `🔥 急上昇 ${rising}記事 · 🟢 継続 ${cont}記事 · ⚠️ 減速 ${slow}記事 · 💤 停止 ${stop}記事 · スキ率 ${parseFloat(skiRate).toFixed(1)}% · `,
          stopPct: totalArt > 0 ? Math.round(stop / (rising + cont + slow + stop) * 100) : 51,
          follFirst: follFirst ? { date: follFirst["日付"], v: parseInt(follFirst["フォロワー数"]) } : { date: "—", v: 0 },
          follLast: follLast ? { date: follLast["日付"].replace("2026/", ""), v: parseInt(follLast["フォロワー数"]) } : { date: "—", v: 0 },
          follMilestone: follMilestone ? { date: follMilestone["日付"].replace("2026/", ""), v: parseInt(follMilestone["フォロワー数"]) } : null,
          rising, cont, slow, stop,
          updatedAt: latest["日付"] || "",
        });
      })
      .catch(e => setError(e.message));
  }, []);

  return { data, error };
}

/* ── Skeleton loader ─────────────────────────────── */
function Skeleton({ w = "100%", h = 32, style: s = {} }) {
  return <div className="skeleton" style={{ width: w, height: h, ...s }} />;
}

/* ── Main Component ──────────────────────────────── */
const C = "#d44a00";
const INK = "#1a0f00";
const CREAM = "#fffbf2";

export default function KitaWrapped() {
  const { data, error } = useNoteData();
  const [activeWorst, setActiveWorst] = useState(null);

  if (error) return (
    <div style={{ background: INK, color: "#f87171", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "monospace", gap: 12 }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 14 }}>CSVが読み込めませんでした</div>
      <div style={{ fontSize: 11, color: "#64748b" }}>{error}</div>
      <div style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>public/data/ にCSVを置いてください</div>
    </div>
  );

  const loading = !data;

  return (
    <div style={{ fontFamily: "'Noto Sans JP',sans-serif", background: CREAM, color: INK, minHeight: "100vh" }}>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: INK, color: CREAM, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%,#2a1500,transparent 60%),radial-gradient(circle at 80% 20%,#300a00,transparent 50%)", pointerEvents: "none" }} />

        <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1, borderBottom: "1px solid #ffffff18" }}>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 3, color: C }}>KITACORE</span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, letterSpacing: 2, color: "#ffffff44" }}>
            NOTE REPORT {loading ? "—" : data.updatedAt.slice(0, 7).replace("/", ".")}
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px 48px", position: "relative", zIndex: 1 }}>
          <div className="fu d1" style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(72px,13vw,160px)", lineHeight: .88, letterSpacing: "-2px", color: CREAM }}>
            DATA<br /><span style={{ color: C }}>×</span><br />NOTE
          </div>
          <div className="fu d2" style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(13px,2vw,17px)", color: "#ffffff88", marginTop: 24, maxWidth: 480, lineHeight: 1.7 }}>
            {loading ? "データ読み込み中…" : `${data.totalArt}本の記事・${data.updatedAt}集計。ログは続く。`}
          </div>

          <div className="fu d3" style={{ display: "flex", gap: 32, marginTop: 48, flexWrap: "wrap" }}>
            {loading
              ? [1, 2, 3, 4].map(i => <Skeleton key={i} w={80} h={64} />)
              : [
                { n: data.totalPV.toLocaleString(), u: "累計PV" },
                { n: data.totalSK.toLocaleString(), u: "累計スキ" },
                { n: data.lastFollower.toLocaleString(), u: "フォロワー" },
                { n: data.totalArt.toLocaleString(), u: "総記事数" },
              ].map(k => (
                <div key={k.u}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(36px,6vw,60px)", color: C, lineHeight: 1 }}>{k.n}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, color: "#ffffff55", letterSpacing: 2, marginTop: 4 }}>{k.u}</div>
                </div>
              ))
            }
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", fontFamily: "'Syne',sans-serif", fontSize: 10, letterSpacing: 3, color: "#ffffff33" }}>SCROLL ↓</div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker-wrap" style={{ background: "#fff8e7" }}>
        <div className="ticker-inner">
          {loading ? "　データ読み込み中…　".repeat(8) : (data.tickerText + "　").repeat(4)}
        </div>
      </div>

      {/* ── GROWTH ── */}
      <section style={{ padding: "80px 32px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <span className="badge" style={{ background: C, color: "#fff", marginBottom: 16 }}>GROWTH</span>
            {loading
              ? <><Skeleton w="80%" h={72} style={{ marginTop: 12 }} /><Skeleton w="60%" h={20} style={{ marginTop: 16 }} /></>
              : <>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(44px,7vw,80px)", lineHeight: .9, marginTop: 12 }}>
                  集計開始→今<br /><span style={{ color: C }}>+{data.pvGrowth}%</span>
                </h2>
                <p style={{ marginTop: 24, lineHeight: 1.8, color: "#5a3a1a", fontSize: 14 }}>
                  スキの伸びは <strong>+{data.skGrowth}%</strong> とPVを上回る。<br />
                  「数字より質」が育ってる証拠。
                </p>
                <div style={{ marginTop: 28, display: "flex", gap: 20 }}>
                  <div style={{ borderLeft: `3px solid ${C}`, paddingLeft: 12 }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: C }}>+{data.skGrowth}%</div>
                    <div style={{ fontSize: 11, color: "#999", letterSpacing: 1 }}>スキ増加率</div>
                  </div>
                  <div style={{ borderLeft: "3px solid #ccc", paddingLeft: 12 }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: INK }}>{parseFloat(data.skiRate).toFixed(1)}%</div>
                    <div style={{ fontSize: 11, color: "#999", letterSpacing: 1 }}>平均スキ率</div>
                  </div>
                </div>
              </>
            }
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px 16px", boxShadow: "0 4px 32px #d44a0018" }}>
            <div style={{ fontSize: 11, color: "#999", letterSpacing: 2, marginBottom: 8, fontFamily: "'Syne',sans-serif" }}>TOTAL PV GROWTH</div>
            {loading
              ? <Skeleton w="100%" h={180} />
              : <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data.growthChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" />
                  <XAxis dataKey="d" tick={{ fill: "#aaa", fontSize: 9 }} interval={2} />
                  <YAxis tick={{ fill: "#aaa", fontSize: 9 }} tickFormatter={v => `${Math.round(v / 1000)}K`} />
                  <Line type="monotone" dataKey="v" stroke={C} strokeWidth={2.5} dot={false} name="PV" />
                  <Tooltip
                    contentStyle={{ background: INK, border: "none", borderRadius: 8, fontSize: 12, color: CREAM }}
                    formatter={v => [v.toLocaleString(), "累計PV"]}
                  />
                </LineChart>
              </ResponsiveContainer>
            }
          </div>
        </div>
      </section>

      {/* ── TOP 5 ── */}
      <section style={{ background: INK, color: CREAM, padding: "80px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 48 }}>
            <span className="badge" style={{ background: C, color: "#fff" }}>HALL OF FAME</span>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(36px,6vw,64px)", lineHeight: 1 }}>30日間ランキング</h2>
          </div>
          {loading
            ? [1, 2, 3, 4, 5].map(i => <Skeleton key={i} w="100%" h={56} style={{ marginBottom: 12 }} />)
            : data.top5.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px 0", borderBottom: "1px solid #ffffff18" }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(32px,5vw,56px)", color: i === 0 ? C : "#ffffff22", lineHeight: 1, minWidth: 60 }}>{a.rank}</div>
                <div style={{ fontSize: 18, flexShrink: 0 }}>{a.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? C : CREAM, lineHeight: 1.3 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: "#ffffff44", marginTop: 4 }}>1日平均 {a.avg} PV</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: i === 0 ? C : CREAM }}>{a.pv}</div>
                  <div style={{ fontSize: 10, color: "#ffffff33", letterSpacing: 1 }}>PV/30日</div>
                </div>
                <div style={{ width: 70, flexShrink: 0 }}>
                  <div style={{ height: 4, background: "#ffffff18", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: i === 0 ? C : "#ffffff44", width: `${a.pv / data.top5[0].pv * 100}%`, borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </section>

      {/* ── WORST (Hall of Shame) ── */}
      <section style={{ padding: "80px 32px", background: INK, color: CREAM, borderTop: "1px solid #ffffff0a" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <span className="badge" style={{ background: "#ffffff22", color: CREAM, marginBottom: 12, display: "inline-block" }}>HALL OF SHAME</span>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(44px,7vw,80px)", lineHeight: .88, marginBottom: 8 }}>
            ワースト記事<br />
            <span style={{ color: "#ffffff44", fontSize: "70%" }}>も、ネタになる。</span>
          </h2>
          <p style={{ fontSize: 12, color: "#ffffff44", marginBottom: 40, letterSpacing: 1 }}>
            {loading ? "—" : `${data.stopPct}%の記事が「停止」判定。でも失敗ログこそが資産。`}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {loading
              ? [1, 2, 3].map(i => <Skeleton key={i} w="100%" h={160} />)
              : data.worst3.map((w, i) => (
                <div
                  key={i}
                  className="worst-card"
                  onClick={() => setActiveWorst(activeWorst === i ? null : i)}
                  style={{
                    background: activeWorst === i ? C : "#ffffff0d",
                    border: "1px solid #ffffff18",
                    borderRadius: 14, padding: "24px 20px",
                  }}
                >
                  <div style={{ fontSize: 30, marginBottom: 12 }}>
                    {["😶", "😑", "🫣"][i]}
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, lineHeight: 1.3, marginBottom: 8, color: CREAM }}>
                    「{w.title}」
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 40, color: activeWorst === i ? "#fff" : C, lineHeight: 1 }}>
                    {w.pv} PV
                  </div>
                  {activeWorst === i
                    ? <div style={{ marginTop: 14, fontSize: 12, lineHeight: 1.7, color: "#fff", fontStyle: "italic", borderTop: "1px solid #ffffff44", paddingTop: 12 }}>
                      💬 {w.roast}
                    </div>
                    : <div style={{ fontSize: 10, color: "#ffffff33", marginTop: 12 }}>タップで詳細 →</div>
                  }
                </div>
              ))
            }
          </div>

          <div style={{ marginTop: 32, padding: "24px 28px", background: "#ffffff08", borderRadius: 14, border: "1px dashed #ffffff22", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ fontSize: 28 }}>🏆</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: CREAM }}>
                {loading ? "—" : `全${data.totalArt}記事中、${data.stopPct}%が「活動停止」状態`}
              </div>
              <div style={{ fontSize: 12, color: "#ffffff55", marginTop: 4, lineHeight: 1.6 }}>
                「note記事の寿命は5日間」──自ら証明した仮説通り。<br />
                <strong style={{ color: C }}>失敗データを記事にして一番PVを取ったのがワイや。</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TREND ── */}
      <section style={{ background: "#fff8e7", padding: "80px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <span className="badge" style={{ background: INK, color: CREAM, marginBottom: 16, display: "inline-block" }}>STATUS</span>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(36px,6vw,64px)", lineHeight: .9, marginBottom: 40 }}>
            記事の「今」を<br />4分類で見ると
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { s: "🔥 急上昇", key: "rising", desc: "昨日PVが伸び中。アルゴリズムに乗ってる。", c: C, bg: "#d44a0008" },
              { s: "🟢 継続", key: "cont", desc: "ピークを過ぎても安定して読まれ続ける。", c: "#22c55e", bg: "#22c55e08" },
              { s: "⚠️ 減速", key: "slow", desc: "落ちてきてるが生きてる。リライト候補。", c: "#ca8a04", bg: "#ca8a0408" },
              { s: "💤 停止", key: "stop", desc: "7日間PVほぼゼロ。でも「寿命の証拠」として機能中。", c: "#64748b", bg: "#64748b08" },
            ].map((s) => {
              const n = loading ? 0 : (data[s.key] || 0);
              const total = loading ? 1 : (data.rising + data.cont + data.slow + data.stop || 1);
              return (
                <div key={s.s} style={{ background: s.bg, border: `1px solid ${s.c}33`, borderRadius: 16, padding: "24px" }}>
                  <div style={{ fontSize: 18, marginBottom: 8 }}>{s.s}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                    {loading
                      ? <Skeleton w={60} h={48} />
                      : <><span style={{ fontFamily: "'Bebas Neue'", fontSize: 52, color: s.c, lineHeight: 1 }}>{n}</span>
                        <span style={{ fontSize: 14, color: s.c, fontWeight: 700 }}>記事</span>
                        <span style={{ fontSize: 12, color: "#999", marginLeft: "auto" }}>{Math.round(n / total * 100)}%</span>
                      </>
                    }
                  </div>
                  <div style={{ height: 4, background: `${s.c}22`, borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: s.c, width: `${Math.round(n / total * 100)}%`, borderRadius: 2, transition: "width .8s" }} />
                  </div>
                  <p style={{ fontSize: 12, color: "#5a3a1a", lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <section style={{ background: INK, color: CREAM, padding: "80px 32px 60px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(48px,9vw,110px)", lineHeight: .85, marginBottom: 24 }}>
          ログは<br /><span style={{ color: C }}>続く。</span>
        </div>
        <p style={{ fontSize: 14, color: "#ffffff55", maxWidth: 460, margin: "0 auto", lineHeight: 1.8 }}>
          データで遊び、失敗をネタにし、また書く。<br />
          KITAcoreのnoteはまだ途中です。
        </p>
        <div style={{ marginTop: 40, fontSize: 11, fontFamily: "'Syne',sans-serif", letterSpacing: 3, color: "#ffffff33", borderBottom: "1px solid #ffffff22", paddingBottom: 6, display: "inline-block" }}>
          {loading ? "読み込み中…" : `集計日 ${data.updatedAt} — 自動更新中`}
        </div>
      </section>

    </div>
  );
}
