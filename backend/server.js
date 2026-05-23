/**
 * grind.dev — Challenge Tracker Backend
 * Node.js + Express, in-memory storage, no auth
 *
 * Start:  node server.js
 * Port:   3001 (or set PORT env var)
 */

const express  = require("express");
const cf       = require("./codeforces");
const lc       = require("./leetcode");
const app      = express();

app.use(express.json());

// ─── CORS (allow the React dev server to call this) ──────────────────────────
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ─── IN-MEMORY STORE ─────────────────────────────────────────────────────────

let users = [
  { id: 1, username: "arjun_m",   displayName: "Arjun Mehta",  initials: "AM", rating: 1982, streak: 21, totalSolved: 58  },
  { id: 2, username: "divya_n",   displayName: "Divya Nair",   initials: "DN", rating: 2041, streak: 28, totalSolved: 62  },
  { id: 3, username: "kiran_r",   displayName: "Kiran Rao",    initials: "KR", rating: 1623, streak: 7,  totalSolved: 31  },
  { id: 4, username: "sahil_v",   displayName: "Sahil Verma",  initials: "SV", rating: 1754, streak: 14, totalSolved: 49  },
  { id: 5, username: "priya_i",   displayName: "Priya Iyer",   initials: "PI", rating: 1589, streak: 5,  totalSolved: 28  },
  { id: 6, username: "me",        displayName: "You",          initials: "ME", rating: 1876, streak: 38, totalSolved: 54  },
];

// Each entry: who solved which problem on which date
let solveLog = [
  { id: 1, userId: 1, problemId: 2462, date: "2025-05-23", language: "Python",     solvedAt: "07:42" },
  { id: 2, userId: 2, problemId: 2462, date: "2025-05-23", language: "C++",        solvedAt: "09:15" },
  { id: 3, userId: 4, problemId: 2462, date: "2025-05-23", language: "Java",       solvedAt: "11:03" },
  { id: 4, userId: 6, problemId: 2462, date: "2025-05-23", language: "JavaScript", solvedAt: "08:30" },
];

let problems = [
  {
    id: 2462,
    title:      "Total Cost to Hire K Workers",
    link:       "https://leetcode.com/problems/total-cost-to-hire-k-workers/",
    difficulty: "Medium",
    topics:     ["Array", "Heap", "Greedy"],
    description:"You are given a 0-indexed integer array costs, where costs[i] is the cost of hiring the ith worker.",
    date:       "2025-05-23",   // the daily date this was assigned
    isDaily:    true,
  },
  {
    id: 2461,
    title:      "Maximum Sum of Distinct Subarrays With Length K",
    link:       "https://leetcode.com/problems/maximum-sum-of-distinct-subarrays-with-length-k/",
    difficulty: "Medium",
    topics:     ["Array", "Sliding Window", "Hash Table"],
    description:"Given an integer array nums and an integer k, find the maximum subarray sum of all subarrays of nums that meet the following conditions.",
    date:       "2025-05-22",
    isDaily:    false,
  },
];

let contests = [
  {
    id: 1,
    name:              "Weekly Contest 399",
    date:              "2025-05-19",
    type:              "Weekly",
    rank:              1204,
    totalParticipants: 28430,
    rating:            42,
    ratingAfter:       1876,
    userId:            6,
    problems: [
      { title: "Find the Number of Distinct Colors Among the Balls",  difficulty: "Easy",   solved: true  },
      { title: "Maximizing the Minimum Game Score",                   difficulty: "Medium", solved: true  },
      { title: "Minimum Jumps to Reach End",                         difficulty: "Medium", solved: true  },
      { title: "Maximum Frequency After Subarray Operation",         difficulty: "Hard",   solved: false },
    ],
  },
  {
    id: 2,
    name:              "Biweekly Contest 132",
    date:              "2025-05-10",
    type:              "Biweekly",
    rank:              892,
    totalParticipants: 19240,
    rating:            78,
    ratingAfter:       1834,
    userId:            6,
    problems: [
      { title: "Count Partitions with Even Sum Difference",                              difficulty: "Easy",   solved: true },
      { title: "Minimum Cost to Reach Every Position",                                   difficulty: "Easy",   solved: true },
      { title: "Count Substrings That Can Be Rearranged to Contain a String II",         difficulty: "Medium", solved: true },
      { title: "Count Non-Decreasing Subarrays After K Operations",                     difficulty: "Hard",   solved: true },
    ],
  },
  {
    id: 3,
    name:              "Weekly Contest 398",
    date:              "2025-05-12",
    type:              "Weekly",
    rank:              3102,
    totalParticipants: 27810,
    rating:            -18,
    ratingAfter:       1756,
    userId:            6,
    problems: [
      { title: "Find Maximum Removals From Source String",          difficulty: "Medium", solved: true  },
      { title: "Find Sum of Array Product of Magical Sequences",    difficulty: "Medium", solved: true  },
      { title: "Maximum Product of a Letter Group",                 difficulty: "Hard",   solved: false },
      { title: "Minimum Number of K-Consecutive Bit Flips",        difficulty: "Hard",   solved: false },
    ],
  },
];

// Auto-increment helpers
const nextId = (arr) => (arr.length === 0 ? 1 : Math.max(...arr.map((x) => x.id)) + 1);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Attach solved status for a given date to each user */
function enrichUsersForDate(date) {
  return users.map((u) => {
    const log = solveLog.find((s) => s.userId === u.id && s.date === date);
    return {
      ...u,
      solvedToday: !!log,
      solvedAt:    log?.solvedAt  ?? null,
      language:    log?.language  ?? null,
    };
  });
}

/** 404 helper */
const notFound = (res, entity) => res.status(404).json({ error: `${entity} not found` });

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// ── Health ─────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ══════════════════════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════════════════════

// GET  /users              — list all users
app.get("/users", (_req, res) => res.json(users));

// GET  /users/:id          — single user
app.get("/users/:id", (req, res) => {
  const user = users.find((u) => u.id === +req.params.id);
  if (!user) return notFound(res, "User");
  res.json(user);
});

// POST /users              — create user
// Body: { username, displayName, initials }
app.post("/users", (req, res) => {
  const { username, displayName, initials } = req.body;
  if (!username || !displayName || !initials)
    return res.status(400).json({ error: "username, displayName and initials are required" });

  if (users.find((u) => u.username === username))
    return res.status(409).json({ error: "username already taken" });

  const user = { id: nextId(users), username, displayName, initials, rating: 1500, streak: 0, totalSolved: 0 };
  users.push(user);
  res.status(201).json(user);
});

// PATCH /users/:id         — update user fields
app.patch("/users/:id", (req, res) => {
  const idx = users.findIndex((u) => u.id === +req.params.id);
  if (idx === -1) return notFound(res, "User");

  const allowed = ["displayName", "initials", "rating", "streak", "totalSolved"];
  allowed.forEach((key) => { if (req.body[key] !== undefined) users[idx][key] = req.body[key]; });
  res.json(users[idx]);
});

// DELETE /users/:id
app.delete("/users/:id", (req, res) => {
  const idx = users.findIndex((u) => u.id === +req.params.id);
  if (idx === -1) return notFound(res, "User");
  users.splice(idx, 1);
  res.sendStatus(204);
});

// ══════════════════════════════════════════════════════════════════════════════
//  PROBLEMS
// ══════════════════════════════════════════════════════════════════════════════

// GET  /problems                    — all problems (optional ?difficulty=Medium&topic=Heap)
app.get("/problems", (req, res) => {
  let result = [...problems];
  if (req.query.difficulty)
    result = result.filter((p) => p.difficulty === req.query.difficulty);
  if (req.query.topic)
    result = result.filter((p) => p.topics.includes(req.query.topic));
  res.json(result);
});

// GET  /problems/today              — today's daily problem + squad solve status
app.get("/problems/today", (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const problem = problems.find((p) => p.date === today && p.isDaily);
  if (!problem) return res.status(404).json({ error: "No daily problem set for today" });

  const squad = enrichUsersForDate(today);
  res.json({ problem, squad, date: today });
});

// GET  /problems/:id                — single problem
app.get("/problems/:id", (req, res) => {
  const problem = problems.find((p) => p.id === +req.params.id);
  if (!problem) return notFound(res, "Problem");
  res.json(problem);
});

// POST /problems                    — add a problem
// Body: { id, title, link, difficulty, topics, description, date, isDaily }
app.post("/problems", (req, res) => {
  const { id, title, link, difficulty, topics, description, date } = req.body;
  if (!id || !title || !link || !difficulty || !date)
    return res.status(400).json({ error: "id, title, link, difficulty and date are required" });

  if (problems.find((p) => p.id === id))
    return res.status(409).json({ error: "Problem id already exists" });

  const problem = {
    id, title, link,
    difficulty,
    topics:      topics      ?? [],
    description: description ?? "",
    date,
    isDaily:     req.body.isDaily ?? false,
  };
  problems.push(problem);
  res.status(201).json(problem);
});

// PATCH /problems/:id               — update problem fields
app.patch("/problems/:id", (req, res) => {
  const idx = problems.findIndex((p) => p.id === +req.params.id);
  if (idx === -1) return notFound(res, "Problem");

  const allowed = ["title", "link", "difficulty", "topics", "description", "date", "isDaily"];
  allowed.forEach((key) => { if (req.body[key] !== undefined) problems[idx][key] = req.body[key]; });
  res.json(problems[idx]);
});

// DELETE /problems/:id
app.delete("/problems/:id", (req, res) => {
  const idx = problems.findIndex((p) => p.id === +req.params.id);
  if (idx === -1) return notFound(res, "Problem");
  problems.splice(idx, 1);
  res.sendStatus(204);
});

// ══════════════════════════════════════════════════════════════════════════════
//  SOLVE LOG  (who solved what, when)
// ══════════════════════════════════════════════════════════════════════════════

// GET  /solves                      — all solve entries (?userId=6&date=2025-05-23)
app.get("/solves", (req, res) => {
  let result = [...solveLog];
  if (req.query.userId)    result = result.filter((s) => s.userId    === +req.query.userId);
  if (req.query.problemId) result = result.filter((s) => s.problemId === +req.query.problemId);
  if (req.query.date)      result = result.filter((s) => s.date      === req.query.date);
  res.json(result);
});

// POST /solves                      — mark a problem as solved
// Body: { userId, problemId, date, language }
app.post("/solves", (req, res) => {
  const { userId, problemId, date, language } = req.body;
  if (!userId || !problemId || !date)
    return res.status(400).json({ error: "userId, problemId and date are required" });

  if (!users.find((u) => u.id === userId))
    return res.status(404).json({ error: "User not found" });
  if (!problems.find((p) => p.id === problemId))
    return res.status(404).json({ error: "Problem not found" });
  if (solveLog.find((s) => s.userId === userId && s.problemId === problemId && s.date === date))
    return res.status(409).json({ error: "Already marked as solved for this date" });

  const entry = {
    id: nextId(solveLog),
    userId,
    problemId,
    date,
    language: language ?? "Unknown",
    solvedAt: new Date().toTimeString().slice(0, 5),
  };
  solveLog.push(entry);

  // bump user's totalSolved
  const userIdx = users.findIndex((u) => u.id === userId);
  if (userIdx !== -1) users[userIdx].totalSolved += 1;

  res.status(201).json(entry);
});

// DELETE /solves/:id
app.delete("/solves/:id", (req, res) => {
  const idx = solveLog.findIndex((s) => s.id === +req.params.id);
  if (idx === -1) return notFound(res, "Solve entry");
  solveLog.splice(idx, 1);
  res.sendStatus(204);
});

// ══════════════════════════════════════════════════════════════════════════════
//  CONTESTS
// ══════════════════════════════════════════════════════════════════════════════

// GET  /contests                    — all contests (?userId=6&type=Weekly)
app.get("/contests", (req, res) => {
  let result = [...contests];
  if (req.query.userId) result = result.filter((c) => c.userId === +req.query.userId);
  if (req.query.type)   result = result.filter((c) => c.type   === req.query.type);
  // Sort newest first
  result.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(result);
});

// GET  /contests/:id                — single contest with full problem list
app.get("/contests/:id", (req, res) => {
  const contest = contests.find((c) => c.id === +req.params.id);
  if (!contest) return notFound(res, "Contest");
  res.json(contest);
});

// POST /contests                    — add a contest result
// Body: { name, date, type, rank, totalParticipants, rating, ratingAfter, userId, problems[] }
app.post("/contests", (req, res) => {
  const { name, date, type, rank, totalParticipants, rating, ratingAfter, userId, problems: probs } = req.body;
  if (!name || !date || !type || rank == null || !userId)
    return res.status(400).json({ error: "name, date, type, rank and userId are required" });

  if (!users.find((u) => u.id === userId))
    return res.status(404).json({ error: "User not found" });

  const contest = {
    id: nextId(contests),
    name, date, type,
    rank,
    totalParticipants: totalParticipants ?? 0,
    rating:            rating            ?? 0,
    ratingAfter:       ratingAfter       ?? 0,
    userId,
    problems:          probs             ?? [],
  };
  contests.push(contest);

  // Update user rating
  if (ratingAfter != null) {
    const userIdx = users.findIndex((u) => u.id === userId);
    if (userIdx !== -1) users[userIdx].rating = ratingAfter;
  }

  res.status(201).json(contest);
});

// PATCH /contests/:id               — update a contest entry
app.patch("/contests/:id", (req, res) => {
  const idx = contests.findIndex((c) => c.id === +req.params.id);
  if (idx === -1) return notFound(res, "Contest");

  const allowed = ["name", "date", "type", "rank", "totalParticipants", "rating", "ratingAfter", "problems"];
  allowed.forEach((key) => { if (req.body[key] !== undefined) contests[idx][key] = req.body[key]; });
  res.json(contests[idx]);
});

// DELETE /contests/:id
app.delete("/contests/:id", (req, res) => {
  const idx = contests.findIndex((c) => c.id === +req.params.id);
  if (idx === -1) return notFound(res, "Contest");
  contests.splice(idx, 1);
  res.sendStatus(204);
});

// ══════════════════════════════════════════════════════════════════════════════
//  CODEFORCES  (live proxy — results cached 60 s per handle)
// ══════════════════════════════════════════════════════════════════════════════

// Shared error wrapper so CF errors don't crash the process
function cfHandler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      const msg = err.message ?? "Codeforces API error";
      // Surface CF-specific messages (e.g. "handles: User with handle XXX not found")
      const status = msg.toLowerCase().includes("not found") ? 404 : 502;
      res.status(status).json({ error: msg });
    }
  };
}

// GET /cf/:handle
// Basic profile: handle, rating, maxRating, rank, maxRank, avatar URL
app.get(
  "/cf/:handle",
  cfHandler(async (req, res) => {
    const data = await cf.getUserInfo(req.params.handle);
    res.json(data);
  })
);

// GET /cf/:handle/submissions?count=20
// Recent submissions — problem name, rating, contestId, verdict, language, date
app.get(
  "/cf/:handle/submissions",
  cfHandler(async (req, res) => {
    const count = Math.min(parseInt(req.query.count) || 20, 100);
    const subs  = await cf.getRecentSubmissions(req.params.handle, count);
    res.json({ handle: req.params.handle, count: subs.length, submissions: subs });
  })
);

// GET /cf/:handle/rating
// Contest rating-change history, newest first
app.get(
  "/cf/:handle/rating",
  cfHandler(async (req, res) => {
    const history = await cf.getRatingHistory(req.params.handle);
    res.json({ handle: req.params.handle, count: history.length, history });
  })
);

// GET /cf/:handle/solved-today?problem=<name>
// Detects whether the user has an accepted submission for <problem> today (UTC).
// If ?problem= is omitted, falls back to today's daily problem title.
app.get(
  "/cf/:handle/solved-today",
  cfHandler(async (req, res) => {
    let problemName = req.query.problem ?? "";

    // Fall back to today's daily problem if no name supplied
    if (!problemName) {
      const today   = new Date().toISOString().slice(0, 10);
      const daily   = problems.find((p) => p.date === today && p.isDaily);
      if (!daily) {
        return res.status(400).json({ error: "No daily problem set for today and no ?problem= provided" });
      }
      problemName = daily.title;
    }

    const { solved, submission } = await cf.checkSolvedToday(req.params.handle, problemName);

    res.json({
      handle:      req.params.handle,
      problemName,
      date:        new Date().toISOString().slice(0, 10),
      solved,
      // Full submission detail when found
      submission: submission
        ? {
            id:        submission.id,
            contestId: submission.contestId,
            problem: {
              name:   submission.problem.name,
              rating: submission.problem.rating,
              index:  submission.problem.index,
            },
            verdict:   submission.verdict,
            language:  submission.language,
            timestamp: submission.timestamp,
            url:       submission.url,
          }
        : null,
    });
  })
);

// GET /cf/:handle/squad-check?problem=<name>
// Convenience: check every *local* user that has a cfHandle stored,
// plus an ad-hoc list via ?handles=alice,bob,carol
// Returns one row per handle with their solved status.
app.get(
  "/cf/squad-check",
  cfHandler(async (req, res) => {
    // Collect handles: local users with cfHandle set + ?handles= param
    const adhoc = req.query.handles ? req.query.handles.split(",").map((h) => h.trim()) : [];
    const local = users.filter((u) => u.cfHandle).map((u) => u.cfHandle);
    const all   = [...new Set([...local, ...adhoc])].filter(Boolean);

    if (all.length === 0) {
      return res.status(400).json({
        error: "No handles found. Add cfHandle to users or pass ?handles=alice,bob",
      });
    }

    let problemName = req.query.problem ?? "";
    if (!problemName) {
      const today = new Date().toISOString().slice(0, 10);
      const daily = problems.find((p) => p.date === today && p.isDaily);
      if (!daily) return res.status(400).json({ error: "No daily problem set for today" });
      problemName = daily.title;
    }

    // Fire requests with a small stagger to stay under CF's 5 req/s limit
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const results = [];
    for (let i = 0; i < all.length; i++) {
      if (i > 0) await delay(210); // ~4.7 req/s
      const handle = all[i];
      try {
        const { solved, submission } = await cf.checkSolvedToday(handle, problemName);
        results.push({ handle, solved, submission: submission ?? null, error: null });
      } catch (e) {
        results.push({ handle, solved: false, submission: null, error: e.message });
      }
    }

    res.json({ problemName, date: new Date().toISOString().slice(0, 10), results });
  })
);

// ══════════════════════════════════════════════════════════════════════════════
//  LEETCODE  (live GraphQL proxy — results cached 60 s per username)
// ══════════════════════════════════════════════════════════════════════════════

// Shared error wrapper — surfaces LeetCode GraphQL errors cleanly
function lcHandler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      const msg    = err.message ?? "LeetCode API error";
      const status = msg.toLowerCase().includes("not found") ? 404 : 502;
      res.status(status).json({ error: msg });
    }
  };
}

// GET /lc/daily
// Today's daily coding challenge: id, title, difficulty, topics, acceptance rate, link
app.get(
  "/lc/daily",
  lcHandler(async (_req, res) => {
    const daily = await lc.getDailyChallenge();
    res.json(daily);
  })
);

// GET /lc/:username
// Public profile: ranking, solved counts by difficulty, badges, country, company
app.get(
  "/lc/:username",
  lcHandler(async (req, res) => {
    const profile = await lc.getUserProfile(req.params.username);
    res.json(profile);
  })
);

// GET /lc/:username/submissions?limit=20
// Last ≤20 public submissions: title, verdict, language, runtime, memory, date, url
// NOTE: LeetCode's public GraphQL endpoint hard-caps at 20 without a session cookie.
app.get(
  "/lc/:username/submissions",
  lcHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 20);
    const subs  = await lc.getRecentSubmissions(req.params.username, limit);
    res.json({
      username:    req.params.username,
      count:       subs.length,
      note:        "Public endpoint is capped at 20 submissions. Auth not implemented.",
      submissions: subs,
    });
  })
);

// GET /lc/:username/contests
// Contest rating summary + full history (attended contests only), newest first
app.get(
  "/lc/:username/contests",
  lcHandler(async (req, res) => {
    const data = await lc.getContestHistory(req.params.username);
    res.json({ username: req.params.username, ...data });
  })
);

// GET /lc/:username/solved-today?slug=two-sum
// Checks if the user has an Accepted submission for a given problem today (UTC).
// ?slug= is the LeetCode titleSlug (e.g. "two-sum", "total-cost-to-hire-k-workers").
// Omit ?slug= to auto-check against today's daily challenge.
app.get(
  "/lc/:username/solved-today",
  lcHandler(async (req, res) => {
    const result = await lc.checkSolvedToday(req.params.username, req.query.slug ?? undefined);
    res.json(result);
  })
);

// GET /lc/squad-check?slug=two-sum&usernames=alice,bob,carol
// Bulk check: resolve solved-today for every username in ?usernames=
// OR for all local users that have a lcUsername field set.
// Falls back to today's daily challenge slug if ?slug= is omitted.
app.get(
  "/lc/squad-check",
  lcHandler(async (req, res) => {
    // Gather usernames from local store + ad-hoc query param
    const adhoc = req.query.usernames ? req.query.usernames.split(",").map((u) => u.trim()) : [];
    const local = users.filter((u) => u.lcUsername).map((u) => u.lcUsername);
    const all   = [...new Set([...local, ...adhoc])].filter(Boolean);

    if (all.length === 0) {
      return res.status(400).json({
        error: "No usernames found. Add lcUsername to users or pass ?usernames=alice,bob",
      });
    }

    // Resolve slug — prefer query param, otherwise fetch today's daily
    let slug = req.query.slug ?? "";
    if (!slug) {
      const daily = await lc.getDailyChallenge();
      slug = daily.titleSlug;
    }

    // Stagger requests slightly — LC GraphQL is tolerant but polite is better
    const delay   = (ms) => new Promise((r) => setTimeout(r, ms));
    const results = [];
    for (let i = 0; i < all.length; i++) {
      if (i > 0) await delay(150);
      const username = all[i];
      try {
        const { solved, submission } = await lc.checkSolvedToday(username, slug);
        results.push({ username, solved, submission: submission ?? null, error: null });
      } catch (e) {
        results.push({ username, solved: false, submission: null, error: e.message });
      }
    }

    res.json({
      titleSlug: slug,
      date:      new Date().toISOString().slice(0, 10),
      results,
    });
  })
);

// ─── CATCH-ALL 404 ───────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ─── START ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🟢  grind.dev API running on http://localhost:${PORT}`);
  console.log(`\n  Resources:`);
  console.log(`    GET  /health`);
  console.log(`    GET  /users           POST /users`);
  console.log(`    GET  /users/:id       PATCH /users/:id       DELETE /users/:id`);
  console.log(`    GET  /problems        POST /problems`);
  console.log(`    GET  /problems/today  (daily problem + squad status)`);
  console.log(`    GET  /problems/:id    PATCH /problems/:id    DELETE /problems/:id`);
  console.log(`    GET  /solves          POST /solves            DELETE /solves/:id`);
  console.log(`    GET  /contests        POST /contests`);
  console.log(`    GET  /contests/:id    PATCH /contests/:id    DELETE /contests/:id`);
  console.log(`\n  Codeforces (live, cached 60s):`);
  console.log(`    GET  /cf/:handle                            profile`);
  console.log(`    GET  /cf/:handle/submissions?count=20       recent submissions`);
  console.log(`    GET  /cf/:handle/rating                     rating history`);
  console.log(`    GET  /cf/:handle/solved-today?problem=      check today's solve`);
  console.log(`    GET  /cf/squad-check?handles=a,b&problem=   bulk squad check`);
  console.log(`\n  LeetCode (live GraphQL, cached 60s):`);
  console.log(`    GET  /lc/daily                              today's daily challenge`);
  console.log(`    GET  /lc/squad-check?usernames=a,b&slug=    bulk squad check`);
  console.log(`    GET  /lc/:username                          profile + solve counts`);
  console.log(`    GET  /lc/:username/submissions?limit=20     recent submissions (max 20)`);
  console.log(`    GET  /lc/:username/contests                 contest rating + history`);
  console.log(`    GET  /lc/:username/solved-today?slug=       check today's solve\n`);
});
