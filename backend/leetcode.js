/**
 * leetcode.js — LeetCode GraphQL API integration layer
 *
 * Endpoint: https://leetcode.com/graphql  (POST, public — no API key)
 *
 * Public queries used (no auth required):
 *   - getUserProfile      → profile, stats, ranking, solved counts
 *   - getRecentSubmissions → last ≤20 public submissions per user
 *   - getContestHistory   → contest ranking + rating history
 *   - getDailyChallenge   → today's daily coding challenge
 *   - checkSolvedToday    → AC submission matching today's problem
 *
 * Rate limit: LeetCode doesn't publish a hard number but ~10 req/s is safe.
 * We cache every result for 60 s per username to stay well within limits.
 *
 * IMPORTANT: recentSubmissionList is public for any user (max 20 entries).
 * Full submission history beyond 20 requires the user's session cookie —
 * that is NOT implemented here (no auth scope).
 */

const LC_GRAPHQL = "https://leetcode.com/graphql";

// ─── Cache ────────────────────────────────────────────────────────────────────
const _cache = {};
const CACHE_TTL = 60_000; // 1 minute

function cacheGet(key) {
  const e = _cache[key];
  if (!e) return null;
  if (Date.now() > e.exp) { delete _cache[key]; return null; }
  return e.data;
}
function cacheSet(key, data) {
  _cache[key] = { data, exp: Date.now() + CACHE_TTL };
}

// ─── Core fetch ──────────────────────────────────────────────────────────────
async function lcQuery(query, variables = {}) {
  const res = await fetch(LC_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // LeetCode requires a Referer header on some queries
      "Referer": "https://leetcode.com",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`LeetCode HTTP ${res.status}`);

  const json = await res.json();
  if (json.errors?.length) {
    // Surface the first GraphQL error message
    throw new Error(`LeetCode GraphQL: ${json.errors[0].message}`);
  }
  return json.data;
}

// ─── GraphQL query strings ────────────────────────────────────────────────────

const Q_PROFILE = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      githubUrl
      twitterUrl
      linkedinUrl
      profile {
        realName
        userAvatar
        birthday
        ranking
        reputation
        websites
        countryName
        company
        school
        skillTags
        aboutMe
        starRating
      }
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      badges {
        id
        displayName
        icon
      }
    }
  }
`;

const Q_SUBMISSIONS = `
  query getRecentSubmissions($username: String!, $limit: Int) {
    recentSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
      statusDisplay
      lang
      runtime
      memory
    }
  }
`;

const Q_CONTEST = `
  query getUserContestRanking($username: String!) {
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      totalParticipants
      topPercentage
      badge {
        name
      }
    }
    userContestRankingHistory(username: $username) {
      attended
      trendDirection
      problemsSolved
      totalProblems
      finishTimeInSeconds
      rating
      ranking
      contest {
        title
        startTime
      }
    }
  }
`;

const Q_DAILY = `
  query getDailyChallenge {
    activeDailyCodingChallengeQuestion {
      date
      link
      question {
        questionFrontendId
        title
        titleSlug
        difficulty
        topicTags {
          name
          slug
        }
        acRate
      }
    }
  }
`;

// ─── Exported helpers ─────────────────────────────────────────────────────────

/**
 * getUserProfile(username)
 * Returns shaped profile + per-difficulty solve counts.
 */
async function getUserProfile(username) {
  const key = `lc:profile:${username}`;
  const hit = cacheGet(key);
  if (hit) return hit;

  const data = await lcQuery(Q_PROFILE, { username });
  const u = data.matchedUser;
  if (!u) throw new Error(`User "${username}" not found on LeetCode`);

  // Build a clean difficulty map: { All, Easy, Medium, Hard }
  const statsMap = {};
  for (const s of u.submitStats?.acSubmissionNum ?? []) {
    statsMap[s.difficulty] = { solved: s.count, submissions: s.submissions };
  }

  const result = {
    username:   u.username,
    realName:   u.profile?.realName   ?? null,
    avatar:     u.profile?.userAvatar ?? null,
    ranking:    u.profile?.ranking    ?? null,
    reputation: u.profile?.reputation ?? null,
    country:    u.profile?.countryName ?? null,
    company:    u.profile?.company    ?? null,
    school:     u.profile?.school     ?? null,
    githubUrl:  u.githubUrl           ?? null,
    linkedinUrl: u.linkedinUrl        ?? null,
    solved: {
      total:  statsMap["All"]?.solved    ?? 0,
      easy:   statsMap["Easy"]?.solved   ?? 0,
      medium: statsMap["Medium"]?.solved ?? 0,
      hard:   statsMap["Hard"]?.solved   ?? 0,
    },
    badges: (u.badges ?? []).map((b) => ({ id: b.id, name: b.displayName, icon: b.icon })),
  };

  cacheSet(key, result);
  return result;
}

/**
 * getRecentSubmissions(username, limit = 20)
 * Public max is 20 entries. Returns shaped list sorted newest-first.
 * Each item: { id, title, titleSlug, verdict, language, runtime, memory, timestamp, date, url }
 */
async function getRecentSubmissions(username, limit = 20) {
  const n   = Math.min(limit, 20); // LC hard cap for public endpoint
  const key = `lc:subs:${username}:${n}`;
  const hit = cacheGet(key);
  if (hit) return hit;

  const data = await lcQuery(Q_SUBMISSIONS, { username, limit: n });
  const raw  = data.recentSubmissionList ?? [];

  const result = raw.map((s) => {
    const ts = parseInt(s.timestamp, 10);
    return {
      id:        s.id,
      title:     s.title,
      titleSlug: s.titleSlug,
      verdict:   s.statusDisplay,          // "Accepted", "Wrong Answer", …
      accepted:  s.statusDisplay === "Accepted",
      language:  s.lang,
      runtime:   s.runtime  ?? null,
      memory:    s.memory   ?? null,
      timestamp: ts,
      date:      new Date(ts * 1000).toISOString().slice(0, 10),
      url:       `https://leetcode.com/problems/${s.titleSlug}/`,
    };
  });

  cacheSet(key, result);
  return result;
}

/**
 * getContestHistory(username)
 * Returns contest rating info + per-contest history, newest first.
 */
async function getContestHistory(username) {
  const key = `lc:contest:${username}`;
  const hit = cacheGet(key);
  if (hit) return hit;

  const data = await lcQuery(Q_CONTEST, { username });

  const ranking = data.userContestRanking ?? null;
  const history = (data.userContestRankingHistory ?? [])
    .filter((c) => c.attended)
    .map((c) => ({
      contestTitle:       c.contest?.title      ?? "Unknown",
      startTime:          c.contest?.startTime  ?? null,
      date:               c.contest?.startTime
        ? new Date(c.contest.startTime * 1000).toISOString().slice(0, 10)
        : null,
      rank:               c.ranking,
      rating:             Math.round(c.rating),
      problemsSolved:     c.problemsSolved,
      totalProblems:      c.totalProblems,
      finishTimeSeconds:  c.finishTimeInSeconds,
      trendDirection:     c.trendDirection,      // "UP" | "DOWN" | "NONE"
    }))
    .sort((a, b) => (b.startTime ?? 0) - (a.startTime ?? 0));

  const result = {
    summary: ranking
      ? {
          contestsAttended: ranking.attendedContestsCount,
          rating:           Math.round(ranking.rating),
          globalRanking:    ranking.globalRanking,
          totalParticipants: ranking.totalParticipants,
          topPercentage:    ranking.topPercentage,
          badge:            ranking.badge?.name ?? null,
        }
      : null,
    history,
  };

  cacheSet(key, result);
  return result;
}

/**
 * getDailyChallenge()
 * Returns today's daily problem. Cached for 60 s (changes once per day anyway).
 */
async function getDailyChallenge() {
  const key = "lc:daily";
  const hit = cacheGet(key);
  if (hit) return hit;

  const data     = await lcQuery(Q_DAILY);
  const daily    = data.activeDailyCodingChallengeQuestion;
  if (!daily) throw new Error("LeetCode daily challenge not available");

  const result = {
    date:       daily.date,
    link:       `https://leetcode.com${daily.link}`,
    questionId: daily.question.questionFrontendId,
    title:      daily.question.title,
    titleSlug:  daily.question.titleSlug,
    difficulty: daily.question.difficulty,
    topics:     daily.question.topicTags.map((t) => t.name),
    acceptanceRate: parseFloat((daily.question.acRate ?? 0).toFixed(1)),
  };

  cacheSet(key, result);
  return result;
}

/**
 * checkSolvedToday(username, titleSlug?)
 * Checks if the user has an "Accepted" submission for the given problem today.
 * If titleSlug is omitted, fetches today's daily challenge slug automatically.
 *
 * NOTE: recentSubmissionList is public but capped at 20 entries.
 * If the user submits heavily, a same-day solve may fall outside the window.
 */
async function checkSolvedToday(username, titleSlug) {
  // Resolve slug from daily challenge if not provided
  if (!titleSlug) {
    const daily = await getDailyChallenge();
    titleSlug   = daily.titleSlug;
  }

  const today = new Date().toISOString().slice(0, 10);
  const subs  = await getRecentSubmissions(username, 20);

  const match = subs.find(
    (s) =>
      s.date === today &&
      s.accepted &&
      s.titleSlug === titleSlug
  );

  return {
    username,
    titleSlug,
    date:       today,
    solved:     !!match,
    submission: match ?? null,
  };
}

module.exports = {
  getUserProfile,
  getRecentSubmissions,
  getContestHistory,
  getDailyChallenge,
  checkSolvedToday,
};
