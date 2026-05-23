const supabase = require("./supabase");
const express = require("express");
const cf = require("./codeforces");
const lc = require("./leetcode");

const app = express();

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// HEALTH
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ==========================
// USERS (REAL DATABASE)
// ==========================

// GET ALL USERS
app.get("/users", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("*");

  console.log("SUPABASE DATA:", data);
  console.log("SUPABASE ERROR:", error);

  if (error) {
    return res.status(500).json({ error });
  }

  res.json(data);
});

// CREATE USER
app.post("/users", async (req, res) => {
  const { name, leetcode, codeforces } = req.body;

  if (!name || !leetcode || !codeforces) {
    return res.status(400).json({
      error: "name, leetcode and codeforces are required",
    });
  }

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        name,
        leetcode,
        codeforces,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json(error);
  }

  res.status(201).json(data);
});

// DELETE USER
app.delete("/users/:id", async (req, res) => {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", req.params.id);

  if (error) {
    return res.status(500).json(error);
  }

  res.json({
    success: true,
  });
});

// ==========================
// CODEFORCES
// ==========================

function cfHandler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      const msg = err.message || "Codeforces API error";

      const status = msg.toLowerCase().includes("not found")
        ? 404
        : 500;

      res.status(status).json({
        error: msg,
      });
    }
  };
}

// PROFILE
app.get(
  "/cf/:handle",
  cfHandler(async (req, res) => {
    const data = await cf.getUserInfo(req.params.handle);
    res.json(data);
  })
);

// RECENT SUBMISSIONS
app.get(
  "/cf/:handle/submissions",
  cfHandler(async (req, res) => {
    const count = Math.min(
      parseInt(req.query.count) || 20,
      100
    );

    const submissions = await cf.getRecentSubmissions(
      req.params.handle,
      count
    );

    res.json({
      handle: req.params.handle,
      submissions,
    });
  })
);

// RATING HISTORY
app.get(
  "/cf/:handle/rating",
  cfHandler(async (req, res) => {
    const history = await cf.getRatingHistory(
      req.params.handle
    );

    res.json({
      handle: req.params.handle,
      history,
    });
  })
);

// ==========================
// LEETCODE
// ==========================

function lcHandler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      const msg = err.message || "LeetCode API error";

      const status = msg.toLowerCase().includes("not found")
        ? 404
        : 500;

      res.status(status).json({
        error: msg,
      });
    }
  };
}

// DAILY
app.get(
  "/lc/daily",
  lcHandler(async (_req, res) => {
    const daily = await lc.getDailyChallenge();
    res.json(daily);
  })
);

// PROFILE
app.get(
  "/lc/:username",
  lcHandler(async (req, res) => {
    const profile = await lc.getUserProfile(
      req.params.username
    );

    res.json(profile);
  })
);

// SUBMISSIONS
app.get(
  "/lc/:username/submissions",
  lcHandler(async (req, res) => {
    const limit = Math.min(
      parseInt(req.query.limit) || 20,
      20
    );

    const submissions = await lc.getRecentSubmissions(
      req.params.username,
      limit
    );

    res.json({
      username: req.params.username,
      submissions,
    });
  })
);

// CONTESTS
app.get(
  "/lc/:username/contests",
  lcHandler(async (req, res) => {
    const contests = await lc.getContestHistory(
      req.params.username
    );

    res.json(contests);
  })
);

// ==========================
// ROOT
// ==========================

app.get("/", (_req, res) => {
  res.json({
    message: "Question Tracker API running",
  });
});

// ==========================
// 404
// ==========================

app.use((_req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// ==========================
// START SERVER
// ==========================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});