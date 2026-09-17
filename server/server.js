import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { initDb, run, get, all } from "./db.js";

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "fairtrade_sih_secret_key_2026";

app.use(cors());
app.use(express.json());

// Initialize database
await initDb();

// Helper Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

// ---------------- API ROUTES ----------------

// Authentication: Signup
app.post("/api/auth/register", async (req, res) => {
  try {
    const { role, name, identifier, password } = req.body;
    if (!role || !name || !identifier || !password) {
      return res.status(400).json({ error: "Role, Name, Email/Mobile and Password are required." });
    }

    const existing = await get("SELECT * FROM users WHERE identifier = ?", [identifier.trim()]);
    if (existing) {
      return res.status(400).json({ error: "User with this email/mobile already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `${role === "Farmer" ? "F" : "B"}-${Math.floor(100 + Math.random() * 900)}`;

    await run(
      "INSERT INTO users (id, role, name, identifier, password_hash) VALUES (?, ?, ?, ?, ?)",
      [userId, role, name.trim(), identifier.trim(), hashedPassword]
    );

    const userPayload = { id: userId, role, name: name.trim(), identifier: identifier.trim() };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: userPayload });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Failed to create account. Please try again." });
  }
});

// Authentication: Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Email/Mobile and Password are required." });
    }

    const user = await get("SELECT * FROM users WHERE identifier = ?", [identifier.trim()]);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials. User not found." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials. Incorrect password." });
    }

    const userPayload = { id: user.id, role: user.role, name: user.name, identifier: user.identifier };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: userPayload });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// Auth check / Current User
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await get("SELECT id, role, name, identifier, created_at FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user details" });
  }
});

// Market Quotes (Live Stock & Price Prediction)
app.get("/api/market-quotes", async (req, res) => {
  try {
    const rows = await all("SELECT * FROM market_quotes");
    const formatted = rows.map((r) => ({
      id: r.id,
      state: r.state,
      city: r.city,
      mandi: r.mandi,
      crop: r.crop,
      grade: r.grade,
      currentPrice: r.current_price,
      change: r.change_val,
      high: r.high,
      low: r.low,
      updatedAt: r.updated_at,
      confidence: r.confidence,
      forecast: JSON.parse(r.forecast_json),
    }));
    res.json(formatted);
  } catch (err) {
    console.error("Market quotes fetch error:", err);
    res.status(500).json({ error: "Failed to load market quotes" });
  }
});

// Produce Lots
app.get("/api/lots", async (req, res) => {
  try {
    const rows = await all("SELECT * FROM lots ORDER BY created_at DESC");
    const formatted = rows.map((r) => ({
      id: r.id,
      farmerId: r.farmer_id,
      farmerName: r.farmer_name,
      crop: r.crop,
      grade: r.grade,
      declaredQuality: r.declared_quality,
      labStatus: r.lab_status,
      quantityQt: r.quantity_qt,
      expectedPrice: r.expected_price,
      city: r.city,
      mandi: r.mandi,
      reliability: r.reliability,
      status: r.status,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lots" });
  }
});

app.post("/api/lots", authenticateToken, async (req, res) => {
  try {
    const { crop, grade, declaredQuality, quantityQt, expectedPrice, city, mandi } = req.body;
    if (!crop || !grade || !quantityQt || !expectedPrice || !city || !mandi) {
      return res.status(400).json({ error: "Missing required produce lot fields." });
    }
    const id = `LOT-${Math.floor(2000 + Math.random() * 7000)}`;
    const farmerId = req.user.id;
    const farmerName = req.user.name;

    await run(
      `INSERT INTO lots (id, farmer_id, farmer_name, crop, grade, declared_quality, lab_status, quantity_qt, expected_price, city, mandi, reliability, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, farmerId, farmerName, crop, grade, declaredQuality || "Standard quality produce", "Pending", Number(quantityQt), Number(expectedPrice), city, mandi, 90, "Active"]
    );

    const created = { id, farmerId, farmerName, crop, grade, declaredQuality: declaredQuality || "Standard quality produce", labStatus: "Pending", quantityQt: Number(quantityQt), expectedPrice: Number(expectedPrice), city, mandi, reliability: 90, status: "Active" };
    res.status(201).json(created);
  } catch (err) {
    console.error("Create lot error:", err);
    res.status(500).json({ error: "Failed to create produce lot" });
  }
});

// Buyer Requirements / Demands
app.get("/api/demands", async (req, res) => {
  try {
    const rows = await all("SELECT * FROM demands ORDER BY created_at DESC");
    const formatted = rows.map((r) => ({
      id: r.id,
      buyerId: r.buyer_id,
      buyerName: r.buyer_name,
      crop: r.crop,
      grade: r.grade,
      quantityQt: r.quantity_qt,
      minPrice: r.min_price,
      maxPrice: r.max_price,
      city: r.city,
      mandi: r.mandi,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch demands" });
  }
});

app.post("/api/demands", authenticateToken, async (req, res) => {
  try {
    const { crop, grade, quantityQt, minPrice, maxPrice, city, mandi } = req.body;
    if (!crop || !grade || !quantityQt || !minPrice || !maxPrice || !city || !mandi) {
      return res.status(400).json({ error: "Missing required demand fields." });
    }
    const id = `DEM-${Math.floor(900 + Math.random() * 800)}`;
    const buyerId = req.user.id;
    const buyerName = req.user.name;

    await run(
      `INSERT INTO demands (id, buyer_id, buyer_name, crop, grade, quantity_qt, min_price, max_price, city, mandi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, buyerId, buyerName, crop, grade, Number(quantityQt), Number(minPrice), Number(maxPrice), city, mandi]
    );

    const created = { id, buyerId, buyerName, crop, grade, quantityQt: Number(quantityQt), minPrice: Number(minPrice), maxPrice: Number(maxPrice), city, mandi };
    res.status(201).json(created);
  } catch (err) {
    console.error("Create demand error:", err);
    res.status(500).json({ error: "Failed to create requirement" });
  }
});

// Deals / Deal Room
app.get("/api/deals", async (req, res) => {
  try {
    const rows = await all("SELECT * FROM deals ORDER BY created_at DESC");
    const formatted = rows.map((r) => ({
      id: r.id,
      farmer: r.farmer,
      buyer: r.buyer,
      farmerId: r.farmer_id,
      buyerId: r.buyer_id,
      lotId: r.lot_id,
      crop: r.crop,
      quantityQt: r.quantity_qt,
      grade: r.grade,
      agreedPrice: r.agreed_price,
      offer: r.offer,
      counterOffer: r.counter_offer,
      paymentGiven: Boolean(r.payment_given),
      paymentReceived: Boolean(r.payment_received),
      transactionMode: r.transaction_mode,
      status: r.status,
      date: r.date,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});

app.get("/api/deals/:id", async (req, res) => {
  try {
    const r = await get("SELECT * FROM deals WHERE id = ?", [req.params.id]);
    if (!r) return res.status(404).json({ error: "Deal not found" });
    const formatted = {
      id: r.id,
      farmer: r.farmer,
      buyer: r.buyer,
      farmerId: r.farmer_id,
      buyerId: r.buyer_id,
      lotId: r.lot_id,
      crop: r.crop,
      quantityQt: r.quantity_qt,
      grade: r.grade,
      agreedPrice: r.agreed_price,
      offer: r.offer,
      counterOffer: r.counter_offer,
      paymentGiven: Boolean(r.payment_given),
      paymentReceived: Boolean(r.payment_received),
      transactionMode: r.transaction_mode,
      status: r.status,
      date: r.date,
    };
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch deal details" });
  }
});

app.patch("/api/deals/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionMode, paymentGiven, paymentReceived, status } = req.body;

    const existing = await get("SELECT * FROM deals WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ error: "Deal not found" });

    const newMode = transactionMode !== undefined ? transactionMode : existing.transaction_mode;
    const newGiven = paymentGiven !== undefined ? (paymentGiven ? 1 : 0) : existing.payment_given;
    const newReceived = paymentReceived !== undefined ? (paymentReceived ? 1 : 0) : existing.payment_received;
    const newStatus = status !== undefined ? status : existing.status;

    await run(
      `UPDATE deals SET transaction_mode = ?, payment_given = ?, payment_received = ?, status = ? WHERE id = ?`,
      [newMode, newGiven, newReceived, newStatus, id]
    );

    const updated = await get("SELECT * FROM deals WHERE id = ?", [id]);
    res.json({
      id: updated.id,
      farmer: updated.farmer,
      buyer: updated.buyer,
      farmerId: updated.farmer_id,
      buyerId: updated.buyer_id,
      lotId: updated.lot_id,
      crop: updated.crop,
      quantityQt: updated.quantity_qt,
      grade: updated.grade,
      agreedPrice: updated.agreed_price,
      offer: updated.offer,
      counterOffer: updated.counter_offer,
      paymentGiven: Boolean(updated.payment_given),
      paymentReceived: Boolean(updated.payment_received),
      transactionMode: updated.transaction_mode,
      status: updated.status,
      date: updated.date,
    });
  } catch (err) {
    console.error("Update deal error:", err);
    res.status(500).json({ error: "Failed to update deal" });
  }
});

// Chat Messages for Deal Room
app.get("/api/deals/:id/chat", async (req, res) => {
  try {
    const rows = await all("SELECT * FROM chat_messages WHERE deal_id = ? ORDER BY created_at ASC", [req.params.id]);
    const formatted = rows.map((r) => ({
      id: r.id,
      dealId: r.deal_id,
      sender: r.sender,
      text: r.text,
      time: r.time,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to load chat messages" });
  }
});

app.post("/api/deals/:id/chat", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text cannot be empty" });
    }

    const msgId = `MSG-${Date.now()}`;
    const sender = req.user.name || (req.user.role === "Farmer" ? "Farmer" : "Buyer");
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    await run(
      `INSERT INTO chat_messages (id, deal_id, sender, text, time) VALUES (?, ?, ?, ?, ?)`,
      [msgId, id, sender, text.trim(), time]
    );

    res.status(201).json({ id: msgId, dealId: id, sender, text: text.trim(), time });
  } catch (err) {
    console.error("Send chat error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Sample / Quality registration
app.post("/api/quality/samples", authenticateToken, async (req, res) => {
  try {
    const { lotId } = req.body;
    const sampleId = `FT-SMP-2026-${Math.floor(3000 + Math.random() * 6000)}`;

    if (lotId) {
      await run("UPDATE lots SET lab_status = ? WHERE id = ?", ["Submitted", lotId]);
    }

    res.json({ sampleId, status: "Submitted", message: "Sample registered successfully for lab testing." });
  } catch (err) {
    res.status(500).json({ error: "Failed to register sample" });
  }
});

app.listen(PORT, () => {
  console.log(`FairTrade Backend API server running on port ${PORT}`);
});
