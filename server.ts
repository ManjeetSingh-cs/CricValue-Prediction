import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Data
  const players = [
    {
      id: "1",
      name: "Virat Kohli",
      team: "RCB",
      role: "Batsman",
      nationality: "India",
      stats: {
        batting: { matches: 250, runs: 8000, average: 38.5, strikeRate: 130.2, highest: 113 },
        bowling: { matches: 250, wickets: 4, economy: 8.5, average: 92.0, best: "1/15" }
      },
      recentForm: [44, 18, 55, 1, 92],
      predictedValue: 175,
      valuationTrend: [
        { date: "Jan", value: 160 },
        { date: "Feb", value: 165 },
        { date: "Mar", value: 170 },
        { date: "Apr", value: 175 },
      ],
      performanceTrend: [
        { date: "M1", score: 44 },
        { date: "M2", score: 18 },
        { date: "M3", score: 55 },
        { date: "M4", score: 1 },
        { date: "M5", score: 92 },
      ]
    },
    {
      id: "2",
      name: "Jasprit Bumrah",
      team: "MI",
      role: "Bowler",
      nationality: "India",
      stats: {
        batting: { matches: 150, runs: 200, average: 10.5, strikeRate: 98.2, highest: 25 },
        bowling: { matches: 150, wickets: 165, economy: 6.8, average: 22.5, best: "5/10" }
      },
      recentForm: [2, 3, 1, 4, 2], // wickets
      predictedValue: 150,
      valuationTrend: [
        { date: "Jan", value: 140 },
        { date: "Feb", value: 145 },
        { date: "Mar", value: 148 },
        { date: "Apr", value: 150 },
      ],
      performanceTrend: [
        { date: "M1", score: 2 },
        { date: "M2", score: 3 },
        { date: "M3", score: 1 },
        { date: "M4", score: 4 },
        { date: "M5", score: 2 },
      ]
    },
    {
      id: "3",
      name: "Rashid Khan",
      team: "GT",
      role: "All-rounder",
      nationality: "Afghanistan",
      stats: {
        batting: { matches: 120, runs: 600, average: 18.5, strikeRate: 155.2, highest: 45 },
        bowling: { matches: 120, wickets: 150, economy: 6.5, average: 20.5, best: "4/15" }
      },
      recentForm: [1, 2, 0, 3, 1],
      predictedValue: 140,
      valuationTrend: [
        { date: "Jan", value: 130 },
        { date: "Feb", value: 135 },
        { date: "Mar", value: 138 },
        { date: "Apr", value: 140 },
      ],
      performanceTrend: [
        { date: "M1", score: 15 },
        { date: "M2", score: 25 },
        { date: "M3", score: 5 },
        { date: "M4", score: 30 },
        { date: "M5", score: 12 },
      ]
    },
    {
      id: "4",
      name: "Travis Head",
      team: "SRH",
      role: "Batsman",
      nationality: "Australia",
      stats: {
        batting: { matches: 80, runs: 2800, average: 35.5, strikeRate: 165.2, highest: 102 },
        bowling: { matches: 80, wickets: 10, economy: 9.5, average: 42.0, best: "2/10" }
      },
      recentForm: [89, 12, 102, 67, 34],
      predictedValue: 160,
      valuationTrend: [
        { date: "Jan", value: 80 },
        { date: "Feb", value: 110 },
        { date: "Mar", value: 140 },
        { date: "Apr", value: 160 },
      ],
      performanceTrend: [
        { date: "M1", score: 89 },
        { date: "M2", score: 12 },
        { date: "M3", score: 102 },
        { date: "M4", score: 67 },
        { date: "M5", score: 34 },
      ]
    },
    {
      id: "5",
      name: "Hardik Pandya",
      team: "MI",
      role: "All-rounder",
      nationality: "India",
      stats: {
        batting: { matches: 130, runs: 2500, average: 28.5, strikeRate: 145.2, highest: 91 },
        bowling: { matches: 130, wickets: 60, economy: 8.8, average: 32.5, best: "3/20" }
      },
      recentForm: [24, 1, 35, 2, 10],
      predictedValue: 130,
      valuationTrend: [
        { date: "Jan", value: 150 },
        { date: "Feb", value: 140 },
        { date: "Mar", value: 135 },
        { date: "Apr", value: 130 },
      ],
      performanceTrend: [
        { date: "M1", score: 24 },
        { date: "M2", score: 15 },
        { date: "M3", score: 35 },
        { date: "M4", score: 45 },
        { date: "M5", score: 10 },
      ]
    }
  ];

  // API Routes
  app.get("/api/players", (req, res) => {
    res.json(players);
  });

  app.post("/api/players", (req, res) => {
    const newPlayer = {
      ...req.body,
      id: (players.length + 1).toString(),
      valuationTrend: [{ date: "May", value: req.body.predictedValue }],
      performanceTrend: [{ date: "Initial", score: 50 }]
    };
    players.push(newPlayer);
    res.status(201).json(newPlayer);
  });

  app.get("/api/player/:id", (req, res) => {
    const player = players.find(p => p.id === req.params.id);
    if (player) {
      res.json(player);
    } else {
      res.status(404).json({ error: "Player not found" });
    }
  });

  app.post("/api/predict", (req, res) => {
    const { playerId } = req.body;
    const player = players.find(p => p.id === playerId);
    if (player) {
      // Dummy AI Logic: Random fluctuation based on recent form
      const avgForm = player.recentForm.reduce((a, b) => a + b, 0) / player.recentForm.length;
      const confidence = 0.85;
      const prediction = player.predictedValue * (1 + (avgForm / 200) * 0.1);
      res.json({
        predictedValue: Math.round(prediction),
        confidence,
        reasoning: `Based on recent performance of ${avgForm} units and historical data.`
      });
    } else {
      res.status(404).json({ error: "Player not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
