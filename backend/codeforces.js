/**
 * codeforces.js — Codeforces API integration layer
 *
 * Public endpoints used (no API key required):
 *   user.info    → https://codeforces.com/api/user.info?handles=<handle>
 *   user.status  → https://codeforces.com/api/user.status?handle=<handle>&from=1&count=<n>
 *   user.rating  → https://codeforces.com/api/user.rating?handle=<handle>
 *
 * CF rate limit: max 5 requests / second.
 * We apply a small per-call delay and cache results per handle per minute.
 */

const CF_BASE = "https://codeforces.com/api";

// ─── Simple in-memory cache ────────────────────────────────────────────────
// Structure: { [cacheKey]: { data, expiresAt } }
const _cache = {};
const CACHE_TTL_MS = 60_000; // 1 minute

function cacheGet(key) {
  const entry = _cache[key];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { delete _cache[key]; return null; }
  return entry.data;
}
function cacheSet(key, data) {
  _cache[key] = { data, expiresAt: Date.now() + CACHE_TTL_MS };
}

// ─── HTTP helper ──────────────────────────────────────────────────────────
async function cfFetch(method, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${CF_BASE}/${method}${qs ? "?" + qs : ""}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`CF HTTP ${res.status} for ${url}`);

  const json = await res.json();
  if (json.status !== "OK") throw new Error(`CF API error: ${json.comment}`);
  return json.result;
}

// ─── Exported helpers ─────────────────────────────────────────────────────

/**
 * getUserInfo(handle)
 * Returns basic profile: handle, rating, maxRating, rank, maxRank, avatar.
 */
async function getUserInfo(handle) {
  const key = `info:${handle}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const [user] = await cfFetch("user.info", { handles: handle });

  const result = {
    handle:    user.handle,
    rating:    user.rating    ?? null,
    maxRating: user.maxRating ?? null,
    rank:      user.rank      ?? "unrated",
    maxRank:   user.maxRank   ?? "unrated",
    avatar:    user.titlePhoto,
  };
  cacheSet(key, result);
  return result;
}

/**
 * getRecentSubmissions(handle, count = 20)
 * Returns last `count` submissions, shaped for our API.
 * Each item: { id, contestId, problem, verdict, language, timestamp, url }
 */
async function getRecentSubmissions(handle, count = 20) {
  const key = `status:${handle}:${count}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const raw = await cfFetch("user.status", { handle, from: 1, count });

  const result = raw.map((s) => ({
    id:        s.id,
    contestId: s.contestId ?? null,
    problem: {
      contestId: s.problem.contestId ?? null,
      index:     s.problem.index,
      name:      s.problem.name,
      rating:    s.problem.rating ?? null,
      tags:      s.problem.tags   ?? [],
    },
    verdict:   s.verdict,          // "OK", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED", …
    language:  s.programmingLanguage,
    timestamp: s.creationTimeSeconds,
    date:      new Date(s.creationTimeSeconds * 1000).toISOString().slice(0, 10),
    url:       s.contestId
      ? `https://codeforces.com/contest/${s.contestId}/problem/${s.problem.index}`
      : `https://codeforces.com/problemset/problem/${s.problem.contestId}/${s.problem.index}`,
  }));

  cacheSet(key, result);
  return result;
}

/**
 * getRatingHistory(handle)
 * Returns array of contest rating-change events, newest first.
 * Each item: { contestId, contestName, rank, ratingBefore, ratingAfter, delta, date }
 */
async function getRatingHistory(handle) {
  const key = `rating:${handle}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const raw = await cfFetch("user.rating", { handle });

  const result = raw
    .map((r) => ({
      contestId:   r.contestId,
      contestName: r.contestName,
      rank:        r.rank,
      ratingBefore: r.oldRating,
      ratingAfter:  r.newRating,
      delta:        r.newRating - r.oldRating,
      date:         new Date(r.ratingUpdateTimeSeconds * 1000).toISOString().slice(0, 10),
    }))
    .reverse(); // newest first

  cacheSet(key, result);
  return result;
}

/**
 * checkSolvedToday(handle, problemName)
 * Returns true if the user has an accepted submission matching `problemName`
 * (case-insensitive, partial match) submitted today (UTC).
 *
 * We scan the most recent 50 submissions — enough to catch any reasonable
 * daily-problem attempt without hammering the CF rate limit.
 */
async function checkSolvedToday(handle, problemName) {
  const today = new Date().toISOString().slice(0, 10);
  const subs  = await getRecentSubmissions(handle, 50);

  const normalise = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const needle    = normalise(problemName);

  const match = subs.find(
    (s) =>
      s.date === today &&
      s.verdict === "OK" &&
      normalise(s.problem.name).includes(needle)
  );

  return {
    solved: !!match,
    submission: match ?? null,
  };
}

module.exports = { getUserInfo, getRecentSubmissions, getRatingHistory, checkSolvedToday };
