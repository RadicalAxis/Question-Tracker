import { useState } from "react";

const MOCK_TODAY = {
  date: "May 23, 2025",
  problem: {
    id: 2462,
    title: "Total Cost to Hire K Workers",
    link: "https://leetcode.com/problems/total-cost-to-hire-k-workers/",
    difficulty: "Medium",
    topics: ["Array", "Heap", "Greedy"],
    description:
      "You are given a 0-indexed integer array costs, where costs[i] is the cost of hiring the ith worker.",
  },
};

const FRIENDS = [
  { id: 1, name: "Arjun Mehta", initials: "AM", solved: true, time: "7:42 AM", language: "Python" },
  { id: 2, name: "Divya Nair", initials: "DN", solved: true, time: "9:15 AM", language: "C++" },
  { id: 3, name: "Kiran Rao", initials: "KR", solved: false, time: null, language: null },
  { id: 4, name: "Sahil Verma", initials: "SV", solved: true, time: "11:03 AM", language: "Java" },
  { id: 5, name: "Priya Iyer", initials: "PI", solved: false, time: null, language: null },
  { id: 6, name: "You", initials: "ME", solved: true, time: "8:30 AM", language: "JavaScript", isMe: true },
];

const CONTEST_HISTORY = [
  {
    id: 1,
    name: "Weekly Contest 399",
    date: "May 19, 2025",
    type: "Weekly",
    rank: 1204,
    totalParticipants: 28430,
    solved: 3,
    total: 4,
    rating: "+42",
    ratingAfter: 1876,
    problems: [
      { title: "Find the Number of Distinct Colors Among the Balls", difficulty: "Easy", solved: true },
      { title: "Maximizing the Minimum Game Score", difficulty: "Medium", solved: true },
      { title: "Minimum Jumps to Reach End", difficulty: "Medium", solved: true },
      { title: "Maximum Frequency After Subarray Operation", difficulty: "Hard", solved: false },
    ],
  },
  {
    id: 2,
    name: "Biweekly Contest 132",
    date: "May 10, 2025",
    type: "Biweekly",
    rank: 892,
    totalParticipants: 19240,
    solved: 4,
    total: 4,
    rating: "+78",
    ratingAfter: 1834,
    problems: [
      { title: "Count Partitions with Even Sum Difference", difficulty: "Easy", solved: true },
      { title: "Minimum Cost to Reach Every Position", difficulty: "Easy", solved: true },
      { title: "Count Substrings That Can Be Rearranged to Contain a String II", difficulty: "Medium", solved: true },
      { title: "Count Non-Decreasing Subarrays After K Operations", difficulty: "Hard", solved: true },
    ],
  },
  {
    id: 3,
    name: "Weekly Contest 398",
    date: "May 12, 2025",
    type: "Weekly",
    rank: 3102,
    totalParticipants: 27810,
    solved: 2,
    total: 4,
    rating: "-18",
    ratingAfter: 1756,
    problems: [
      { title: "Find Maximum Removals From Source String", difficulty: "Medium", solved: true },
      { title: "Find Sum of Array Product of Magical Sequences", difficulty: "Medium", solved: true },
      { title: "Maximum Product of a Letter Group", difficulty: "Hard", solved: false },
      { title: "Minimum Number of K-Consecutive Bit Flips", difficulty: "Hard", solved: false },
    ],
  },
  {
    id: 4,
    name: "Biweekly Contest 131",
    date: "Apr 26, 2025",
    type: "Biweekly",
    rank: 560,
    totalParticipants: 18990,
    solved: 4,
    total: 4,
    rating: "+91",
    ratingAfter: 1774,
    problems: [
      { title: "Longest Common Prefix After Operations", difficulty: "Medium", solved: true },
      { title: "Find the Number of Subsequences With Equal GCD", difficulty: "Medium", solved: true },
      { title: "Count Paths With the Given XOR Value", difficulty: "Medium", solved: true },
      { title: "Maximum Value Sum by Placing Three Rooks II", difficulty: "Hard", solved: true },
    ],
  },
];

const STREAK_DATA = [true,true,false,true,true,true,true,false,true,true,true,false,true,true,true,true,true,false,true,true,true,true,false,false,true,true,true,true,true,true,true,true,false,true,true,true,true,false,true,true,true,true,true,true,true,false,true,true,true,true,true,true,false,true,true,true,true,true,true,true];

const difficultyConfig = {
  Easy: { bg: "#eaf3de", text: "#3B6D11", dot: "#639922" },
  Medium: "#faeeda",
  Hard: "#fcebeb",
};

function DiffBadge({ difficulty }) {
  const configs = {
    Easy: { bg: "#eaf3de", color: "#27500A" },
    Medium: { bg: "#faeeda", color: "#633806" },
    Hard: { bg: "#fcebeb", color: "#791F1F" },
  };
  const c = configs[difficulty] || configs.Medium;
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, display: "inline-block" }}>
      {difficulty}
    </span>
  );
}

function Avatar({ initials, isMe, solved }) {
  const base = isMe
    ? { bg: "#EEEDFE", color: "#3C3489" }
    : solved
    ? { bg: "#E1F5EE", color: "#085041" }
    : { bg: "#F1EFE8", color: "#5F5E5A" };
  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: base.bg, color: base.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0, border: isMe ? "1.5px solid #AFA9EC" : "none" }}>
      {initials}
    </div>
  );
}

function StreakGrid({ data }) {
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {week.map((solved, di) => (
            <div key={di} style={{ width: 10, height: 10, borderRadius: 2, background: solved ? "#1D9E75" : "#D3D1C7" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [activeContest, setActiveContest] = useState(null);
  const [tab, setTab] = useState("today");

  const solvedCount = FRIENDS.filter((f) => f.solved).length;
  const myStreak = STREAK_DATA.filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ borderBottom: "1px solid #21262d", padding: "0 24px", display: "flex", alignItems: "center", gap: 16, height: 56, background: "#161b22" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #1D9E75, #534AB7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px", color: "#e6edf3" }}>grind.dev</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 4, background: "#21262d", borderRadius: 8, padding: 3 }}>
          {["today", "contests", "stats"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "'Sora', sans-serif", background: tab === t ? "#30363d" : "transparent", color: tab === t ? "#e6edf3" : "#8b949e", transition: "all 0.15s" }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
          <div style={{ fontSize: 11, color: "#8b949e" }}>🔥 {myStreak}d</div>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#EEEDFE", color: "#3C3489", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>ME</div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
        {/* TODAY TAB */}
        {tab === "today" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Date + streak */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#8b949e", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Daily Challenge</div>
                <h1 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: "#e6edf3" }}>{MOCK_TODAY.date}</h1>
              </div>
              <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 10, padding: "10px 16px", display: "flex", gap: 20 }}>
                {[
                  { label: "group solved", value: `${solvedCount}/${FRIENDS.length}` },
                  { label: "your streak", value: `${myStreak}d 🔥` },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: "#e6edf3" }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "#8b949e", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Problem card */}
            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "#8b949e" }}>#{MOCK_TODAY.problem.id}</span>
                    <DiffBadge difficulty={MOCK_TODAY.problem.difficulty} />
                    {MOCK_TODAY.problem.topics.map((t) => (
                      <span key={t} style={{ fontSize: 11, color: "#8b949e", background: "#21262d", padding: "2px 8px", borderRadius: 99 }}>{t}</span>
                    ))}
                  </div>
                  <a href={MOCK_TODAY.problem.link} target="_blank" rel="noopener noreferrer" style={{ color: "#79c0ff", textDecoration: "none", fontSize: 17, fontFamily: "'Sora', sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    {MOCK_TODAY.problem.title}
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ opacity: 0.6 }}><path d="M5 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8M8 1h4v4M12 1 6 7" stroke="#79c0ff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </a>
                  <p style={{ fontSize: 13, color: "#8b949e", marginTop: 8, lineHeight: 1.6 }}>{MOCK_TODAY.problem.description}</p>
                </div>
                <a href={MOCK_TODAY.problem.link} target="_blank" rel="noopener noreferrer" style={{ background: "#1D9E75", color: "#fff", padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: "'Sora', sans-serif", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                  Solve →
                </a>
              </div>
            </div>

            {/* Friends grid */}
            <div>
              <div style={{ fontSize: 12, color: "#8b949e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Squad Progress</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                {FRIENDS.map((f) => (
                  <div key={f.id} style={{ background: "#161b22", border: `1px solid ${f.solved ? "#1b4332" : "#21262d"}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, transition: "border-color 0.2s" }}>
                    <Avatar initials={f.initials} isMe={f.isMe} solved={f.solved} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: f.isMe ? "#C0B8F8" : "#e6edf3", display: "flex", alignItems: "center", gap: 6 }}>
                        {f.name}
                        {f.isMe && <span style={{ fontSize: 10, background: "#EEEDFE", color: "#534AB7", padding: "1px 6px", borderRadius: 99 }}>you</span>}
                      </div>
                      {f.solved ? (
                        <div style={{ fontSize: 11, color: "#3fb950", marginTop: 2 }}>
                          ✓ solved at {f.time} · {f.language}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "#8b949e", marginTop: 2 }}>not yet solved</div>
                      )}
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: f.solved ? "#1b4332" : "#21262d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {f.solved ? (
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="#3fb950" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="2" fill="#484f58"/></svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTESTS TAB */}
        {tab === "contests" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#8b949e", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Contest History</div>
                <h1 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: "#e6edf3" }}>Your Performance</h1>
              </div>
              <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 10, padding: "10px 20px", display: "flex", gap: 20 }}>
                {[
                  { label: "rating", value: "1876" },
                  { label: "contests", value: CONTEST_HISTORY.length },
                  { label: "top %", value: "4.3%" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: "#e6edf3" }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "#8b949e", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contest list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {CONTEST_HISTORY.map((c) => {
                const isOpen = activeContest === c.id;
                const ratingPos = !c.rating.startsWith("-");
                return (
                  <div key={c.id} style={{ background: "#161b22", border: `1px solid ${isOpen ? "#30363d" : "#21262d"}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s" }}>
                    <button onClick={() => setActiveContest(isOpen ? null : c.id)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, textAlign: "left" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: c.type === "Weekly" ? "#0d2d1a" : "#1a1040", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: c.type === "Weekly" ? "#3fb950" : "#C0B8F8", fontWeight: 600, flexShrink: 0, border: `1px solid ${c.type === "Weekly" ? "#1b4332" : "#2d2060"}` }}>
                        {c.type === "Weekly" ? "WK" : "BW"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#e6edf3", fontFamily: "'Sora', sans-serif" }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "#8b949e", marginTop: 2 }}>{c.date} · Rank #{c.rank.toLocaleString()} of {c.totalParticipants.toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3" }}>{c.solved}/{c.total}</div>
                          <div style={{ fontSize: 11, color: "#8b949e" }}>solved</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: ratingPos ? "#3fb950" : "#f85149", minWidth: 44, textAlign: "right" }}>{c.rating}</div>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", opacity: 0.5 }}><path d="M3 5l4 4 4-4" stroke="#e6edf3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </button>

                    {isOpen && (
                      <div style={{ borderTop: "1px solid #21262d", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                        {c.problems.map((p, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: p.solved ? "#1b4332" : "#21262d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {p.solved ? (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="#3fb950" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              ) : (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 3l4 4M7 3L3 7" stroke="#f85149" strokeWidth="1.3" strokeLinecap="round"/></svg>
                              )}
                            </div>
                            <span style={{ fontSize: 13, color: p.solved ? "#e6edf3" : "#8b949e", flex: 1 }}>{p.title}</span>
                            <DiffBadge difficulty={p.difficulty} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {tab === "stats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: "#8b949e", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Overview</div>
              <h1 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: "#e6edf3" }}>Stats & Streaks</h1>
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {[
                { label: "Total Solved", value: "247", sub: "LeetCode" },
                { label: "Current Streak", value: `${myStreak}d`, sub: "personal best: 42d" },
                { label: "Contest Rating", value: "1876", sub: "top 4.3%" },
                { label: "Acceptance", value: "71.2%", sub: "avg rate" },
              ].map((s) => (
                <div key={s.label} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#e6edf3", fontFamily: "'Sora', sans-serif" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#484f58", marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Difficulty breakdown */}
            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 12, color: "#8b949e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Problems by difficulty</div>
              {[
                { label: "Easy", solved: 98, total: 850, color: "#1D9E75", bg: "#0d2d1a" },
                { label: "Medium", solved: 127, total: 1800, color: "#E9A23B", bg: "#2a1f09" },
                { label: "Hard", solved: 22, total: 780, color: "#E24B4A", bg: "#2d1010" },
              ].map((d) => (
                <div key={d.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#e6edf3" }}>{d.label}</span>
                    <span style={{ fontSize: 13, color: "#8b949e" }}>{d.solved} <span style={{ color: "#484f58" }}>/ {d.total}</span></span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "#21262d", overflow: "hidden" }}>
                    <div style={{ width: `${(d.solved / d.total) * 100}%`, height: "100%", background: d.color, borderRadius: 99, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Streak calendar */}
            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 12, color: "#8b949e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Daily activity · last 60 days</div>
              <StreakGrid data={STREAK_DATA} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#21262d" }} />
                <span style={{ fontSize: 11, color: "#8b949e" }}>missed</span>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#1D9E75", marginLeft: 8 }} />
                <span style={{ fontSize: 11, color: "#8b949e" }}>solved</span>
              </div>
            </div>

            {/* Friend leaderboard */}
            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 12, color: "#8b949e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Squad leaderboard · this month</div>
              {[
                { name: "Divya Nair", initials: "DN", solved: 62, streak: 28, rating: 2041 },
                { name: "Arjun Mehta", initials: "AM", solved: 58, streak: 21, rating: 1982 },
                { name: "You", initials: "ME", solved: 54, streak: myStreak, rating: 1876, isMe: true },
                { name: "Sahil Verma", initials: "SV", solved: 49, streak: 14, rating: 1754 },
                { name: "Kiran Rao", initials: "KR", solved: 31, streak: 7, rating: 1623 },
                { name: "Priya Iyer", initials: "PI", solved: 28, streak: 5, rating: 1589 },
              ].map((f, i) => (
                <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < 5 ? "1px solid #21262d" : "none" }}>
                  <span style={{ fontSize: 12, color: i < 3 ? ["#FFD700", "#C0C0C0", "#CD7F32"][i] : "#484f58", width: 18, textAlign: "center", fontWeight: 600 }}>{i + 1}</span>
                  <Avatar initials={f.initials} isMe={f.isMe} solved={true} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: f.isMe ? "#C0B8F8" : "#e6edf3", fontWeight: f.isMe ? 500 : 400 }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: "#8b949e" }}>{f.streak}d streak</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: "#e6edf3", fontWeight: 500 }}>{f.solved}</div>
                    <div style={{ fontSize: 11, color: "#484f58" }}>solved</div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 48 }}>
                    <div style={{ fontSize: 13, color: "#8b949e" }}>{f.rating}</div>
                    <div style={{ fontSize: 11, color: "#484f58" }}>rating</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
