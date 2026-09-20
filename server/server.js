import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { initDb, run, get, all, getDatabaseStatus } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0";
const JWT_SECRET = process.env.JWT_SECRET;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL;
const FRONTEND_URLS = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !JWT_SECRET) {
  throw new Error("JWT_SECRET is required in production.");
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (FRONTEND_URLS.includes(origin)) return true;

  if (!isProduction) {
    try {
      const hostname = new URL(origin).hostname;
      return hostname === "localhost" || hostname === "127.0.0.1";
    } catch {
      return false;
    }
  }

  return false;
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: getDatabaseStatus() });
});

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

    const existing = await get("SELECT * FROM users WHERE identifier = $1", [identifier.trim()]);
    if (existing) {
      return res.status(400).json({ error: "User with this email/mobile already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `${role === "Farmer" ? "F" : "B"}-${Math.floor(100 + Math.random() * 900)}`;

    await run(
      "INSERT INTO users (id, role, name, identifier, password_hash) VALUES ($1, $2, $3, $4, $5)",
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

    const user = await get("SELECT * FROM users WHERE identifier = $1", [identifier.trim()]);
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
    const user = await get("SELECT id, role, name, identifier, created_at FROM users WHERE id = $1", [req.user.id]);
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

// Mandi / Market master data
app.get("/api/markets", async (req, res) => {
  try {
    const rows = await all("SELECT id, state, city, name FROM markets ORDER BY state, city, name");
    res.json(rows.map((row) => ({
      id: String(row.id),
      state: row.state,
      city: row.city,
      name: row.name,
    })));
  } catch (err) {
    console.error("Markets fetch error:", err);
    res.status(500).json({ error: "Failed to load markets" });
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
      marketId: r.market_id ? String(r.market_id) : undefined,
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
    const { crop, grade, declaredQuality, quantityQt, expectedPrice, city, mandi, marketId } = req.body;
    if (!crop || !grade || !quantityQt || !expectedPrice || !((city && mandi) || marketId)) {
      return res.status(400).json({ error: "Missing required produce lot fields." });
    }
    const id = `LOT-${Math.floor(2000 + Math.random() * 7000)}`;
    const farmerId = req.user.id;
    const farmerName = req.user.name;
    const market = await findMarketFromSelection({ marketId, city, mandi });
    if (!market) {
      return res.status(400).json({ error: "Selected mandi/market was not found." });
    }

    await run(
      `INSERT INTO lots (id, farmer_id, farmer_name, crop, grade, declared_quality, lab_status, quantity_qt, expected_price, city, mandi, reliability, status, market_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [id, farmerId, farmerName, crop, grade, declaredQuality || "Standard quality produce", "Pending", Number(quantityQt), Number(expectedPrice), market.city, market.name, 90, "Active", market.id]
    );

    const created = { id, farmerId, farmerName, crop, grade, declaredQuality: declaredQuality || "Standard quality produce", labStatus: "Pending", quantityQt: Number(quantityQt), expectedPrice: Number(expectedPrice), city: market.city, mandi: market.name, marketId: String(market.id), reliability: 90, status: "Active" };
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
      marketId: r.market_id ? String(r.market_id) : undefined,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch demands" });
  }
});

app.post("/api/demands", authenticateToken, async (req, res) => {
  try {
    const { crop, grade, quantityQt, minPrice, maxPrice, city, mandi, marketId } = req.body;
    if (!crop || !grade || !quantityQt || !minPrice || !maxPrice || !((city && mandi) || marketId)) {
      return res.status(400).json({ error: "Missing required demand fields." });
    }
    const id = `DEM-${Math.floor(900 + Math.random() * 800)}`;
    const buyerId = req.user.id;
    const buyerName = req.user.name;
    const market = await findMarketFromSelection({ marketId, city, mandi });
    if (!market) {
      return res.status(400).json({ error: "Selected mandi/market was not found." });
    }

    await run(
      `INSERT INTO demands (id, buyer_id, buyer_name, crop, grade, quantity_qt, min_price, max_price, city, mandi, market_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, buyerId, buyerName, crop, grade, Number(quantityQt), Number(minPrice), Number(maxPrice), market.city, market.name, market.id]
    );

    const created = { id, buyerId, buyerName, crop, grade, quantityQt: Number(quantityQt), minPrice: Number(minPrice), maxPrice: Number(maxPrice), city: market.city, mandi: market.name, marketId: String(market.id) };
    res.status(201).json(created);
  } catch (err) {
    console.error("Create demand error:", err);
    res.status(500).json({ error: "Failed to create requirement" });
  }
});

const DEAL_STATUSES = new Set(["NEGOTIATING", "COUNTER_OFFER", "AGREED", "PAYMENT_PENDING", "PAYMENT_SENT", "COMPLETED", "REJECTED", "CANCELLED"]);
const FINAL_STATUSES = new Set(["COMPLETED", "REJECTED", "CANCELLED"]);
const DEAL_SELECT = `
  SELECT
    d.*,
    COALESCE(m.id, l.market_id) AS market_id,
    m.state AS market_state,
    COALESCE(m.name, l.mandi) AS market_name,
    COALESCE(m.city, l.city) AS market_city
  FROM deals d
  LEFT JOIN lots l ON l.id = d.lot_id
  LEFT JOIN markets m ON m.id = COALESCE(d.market_id, l.market_id)
`;

function normalizeDealStatus(status) {
  const value = String(status || "NEGOTIATING").trim().toUpperCase().replace(/\s+/g, "_");
  if (value === "OFFER_SENT") return "NEGOTIATING";
  if (value === "PAYMENT_PENDING") return "PAYMENT_PENDING";
  if (DEAL_STATUSES.has(value)) return value;
  return "NEGOTIATING";
}

function derivePaymentStatus(row) {
  if (row.payment_status) return row.payment_status;
  if (row.payment_received) return "RECEIVED";
  if (row.payment_given) return "SENT";
  return "PENDING";
}

function formatDeal(row) {
  const status = normalizeDealStatus(row.status);
  const paymentStatus = derivePaymentStatus(row);
  return {
    id: row.id,
    farmer: row.farmer,
    buyer: row.buyer,
    farmerId: row.farmer_id,
    buyerId: row.buyer_id,
    lotId: row.lot_id,
    marketId: row.market_id ? String(row.market_id) : undefined,
    marketState: row.market_state || "",
    marketName: row.market_name || "",
    marketCity: row.market_city || "",
    crop: row.crop,
    quantityQt: Number(row.quantity_qt),
    grade: row.grade,
    agreedPrice: Number(row.agreed_price || 0),
    offer: Number(row.offer || 0),
    counterOffer: Number(row.counter_offer || 0),
    paymentGiven: Boolean(row.payment_given),
    paymentReceived: Boolean(row.payment_received),
    paymentStatus,
    transactionMode: row.transaction_mode,
    status,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findMarketBySelection(city, mandi) {
  return get("SELECT id, state, city, name FROM markets WHERE city = $1 AND name = $2", [city, mandi]);
}

async function findMarketFromSelection({ marketId, city, mandi }) {
  if (marketId) {
    const market = await get("SELECT id, state, city, name FROM markets WHERE id = $1", [marketId]);
    if (market) return market;
  }

  return findMarketBySelection(city, mandi);
}

async function findMarketForLot(lot) {
  if (lot.market_id) {
    const market = await get("SELECT id, state, city, name FROM markets WHERE id = $1", [lot.market_id]);
    if (market) return market;
  }

  return findMarketBySelection(lot.city, lot.mandi);
}

function formatOffer(row) {
  return {
    id: row.id,
    dealId: row.deal_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    quantity: Number(row.quantity),
    pricePerUnit: Number(row.price_per_unit),
    totalAmount: Number(row.total_amount),
    message: row.message || "",
    status: row.status,
    createdAt: row.created_at,
  };
}

function formatMessage(row) {
  return {
    id: row.id,
    dealId: row.deal_id,
    senderId: row.sender_id,
    sender: row.sender,
    text: row.message || row.text,
    time: row.time,
    createdAt: row.created_at,
  };
}

function isParticipant(deal, user) {
  return deal && (deal.buyer_id === user.id || deal.farmer_id === user.id);
}

async function getDealForUser(dealId, user) {
  const deal = await get(`${DEAL_SELECT} WHERE d.id = $1`, [dealId]);
  if (!deal) {
    const error = new Error("Deal not found");
    error.status = 404;
    throw error;
  }
  if (!isParticipant(deal, user)) {
    const error = new Error("You are not allowed to access this deal");
    error.status = 403;
    throw error;
  }
  return deal;
}

function assertMutable(deal) {
  if (FINAL_STATUSES.has(normalizeDealStatus(deal.status))) {
    const error = new Error("Completed, rejected or cancelled deals cannot be modified");
    error.status = 409;
    throw error;
  }
}

function validatePositiveNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    const error = new Error(`${label} must be greater than 0`);
    error.status = 400;
    throw error;
  }
  return parsed;
}

async function latestOffer(dealId) {
  return get("SELECT * FROM deal_offers WHERE deal_id = $1 ORDER BY created_at DESC LIMIT 1", [dealId]);
}

async function insertOffer({ deal, user, quantity, pricePerUnit, message, status = "PENDING" }) {
  const qty = validatePositiveNumber(quantity, "Quantity");
  const price = validatePositiveNumber(pricePerUnit, "Price per unit");
  const offerId = `OFF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const totalAmount = qty * price;

  await run(
    `INSERT INTO deal_offers (id, deal_id, sender_id, sender_role, quantity, price_per_unit, total_amount, message, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [offerId, deal.id, user.id, user.role, qty, price, totalAmount, message || "", status]
  );

  await run(
    `UPDATE deals
     SET quantity_qt = $1,
         offer = CASE WHEN $2 = 'Buyer' THEN $3 ELSE offer END,
         counter_offer = CASE WHEN $2 = 'Farmer' THEN $3 ELSE counter_offer END,
         agreed_price = $3,
         status = $4,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5`,
    [qty, user.role, price, user.role === "Buyer" ? "NEGOTIATING" : "COUNTER_OFFER", deal.id]
  );

  const created = await get("SELECT * FROM deal_offers WHERE id = $1", [offerId]);
  return formatOffer(created);
}

async function acceptLatestOffer(deal, user) {
  const offer = await latestOffer(deal.id);
  if (!offer) {
    const error = new Error("No offer exists for this deal");
    error.status = 400;
    throw error;
  }
  if (offer.deal_id !== deal.id) {
    const error = new Error("Offer does not belong to this deal");
    error.status = 400;
    throw error;
  }
  if (offer.sender_id === user.id) {
    const error = new Error("You cannot accept your own offer");
    error.status = 403;
    throw error;
  }

  await run("UPDATE deal_offers SET status = $1 WHERE id = $2", ["ACCEPTED", offer.id]);
  await run(
    `UPDATE deals
     SET quantity_qt = $1,
         agreed_price = $2,
         status = $3,
         payment_status = $4,
         payment_given = 0,
         payment_received = 0,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5`,
    [offer.quantity, offer.price_per_unit, "AGREED", "PENDING", deal.id]
  );
}

// Deals / Deal Room
app.post("/api/deals", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "Buyer") {
      return res.status(403).json({ error: "Only buyers can start a deal" });
    }

    const { lotId, quantity, pricePerUnit, message } = req.body;
    if (!lotId) return res.status(400).json({ error: "lotId is required" });

    const lot = await get("SELECT * FROM lots WHERE id = $1", [lotId]);
    if (!lot) return res.status(404).json({ error: "Lot not found" });
    if (lot.farmer_id === req.user.id) return res.status(400).json({ error: "Buyer cannot start a deal on their own lot" });
    const market = await findMarketForLot(lot);
    if (!market) {
      return res.status(400).json({ error: "Lot mandi/market was not found in the market master." });
    }

    const qty = validatePositiveNumber(quantity || lot.quantity_qt, "Quantity");
    const price = validatePositiveNumber(pricePerUnit || lot.expected_price, "Price per unit");
    const id = `DL-${Date.now()}`;
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    await run(
      `INSERT INTO deals (id, farmer, buyer, farmer_id, buyer_id, lot_id, market_id, crop, quantity_qt, grade, agreed_price, offer, counter_offer, payment_given, payment_received, transaction_mode, status, payment_status, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $11, 0, 0, $12, $13, $14, $15)`,
      [id, lot.farmer_name, req.user.name, lot.farmer_id, req.user.id, lot.id, market.id, lot.crop, qty, lot.grade, price, "Use FairTrade", "NEGOTIATING", "PENDING", today]
    );

    const deal = await get(`${DEAL_SELECT} WHERE d.id = $1`, [id]);
    await insertOffer({ deal, user: req.user, quantity: qty, pricePerUnit: price, message: message || "Initial offer" });
    await run("UPDATE lots SET status = $1 WHERE id = $2", ["In Deal", lot.id]);

    const created = await get(`${DEAL_SELECT} WHERE d.id = $1`, [id]);
    res.status(201).json(formatDeal(created));
  } catch (err) {
    console.error("Create deal error:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to create deal" });
  }
});

app.get("/api/deals", authenticateToken, async (req, res) => {
  try {
    const rows = await all(
      `${DEAL_SELECT} WHERE d.buyer_id = $1 OR d.farmer_id = $1 ORDER BY d.created_at DESC`,
      [req.user.id]
    );
    res.json(rows.map(formatDeal));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});

app.get("/api/deals/:id", authenticateToken, async (req, res) => {
  try {
    const deal = await getDealForUser(req.params.id, req.user);
    res.json(formatDeal(deal));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to fetch deal details" });
  }
});

app.get("/api/deals/:id/offers", authenticateToken, async (req, res) => {
  try {
    await getDealForUser(req.params.id, req.user);
    const rows = await all("SELECT * FROM deal_offers WHERE deal_id = $1 ORDER BY created_at ASC", [req.params.id]);
    res.json(rows.map(formatOffer));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to fetch offer history" });
  }
});

app.post("/api/deals/:id/offers", authenticateToken, async (req, res) => {
  try {
    const deal = await getDealForUser(req.params.id, req.user);
    assertMutable(deal);
    const offer = await insertOffer({
      deal,
      user: req.user,
      quantity: req.body.quantity,
      pricePerUnit: req.body.pricePerUnit,
      message: req.body.message,
    });
    res.status(201).json(offer);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to send offer" });
  }
});

app.post("/api/deals/:id/counter", authenticateToken, async (req, res) => {
  try {
    const deal = await getDealForUser(req.params.id, req.user);
    assertMutable(deal);
    const offer = await insertOffer({
      deal,
      user: req.user,
      quantity: req.body.quantity,
      pricePerUnit: req.body.pricePerUnit,
      message: req.body.message || "Counter offer",
    });
    res.status(201).json(offer);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to send counter offer" });
  }
});

app.post("/api/deals/:id/accept", authenticateToken, async (req, res) => {
  try {
    const deal = await getDealForUser(req.params.id, req.user);
    assertMutable(deal);
    await acceptLatestOffer(deal, req.user);
    const updated = await get(`${DEAL_SELECT} WHERE d.id = $1`, [deal.id]);
    res.json(formatDeal(updated));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to accept offer" });
  }
});

app.post("/api/deals/:id/reject", authenticateToken, async (req, res) => {
  try {
    const deal = await getDealForUser(req.params.id, req.user);
    assertMutable(deal);
    const offer = await latestOffer(deal.id);
    if (offer) await run("UPDATE deal_offers SET status = $1 WHERE id = $2", ["REJECTED", offer.id]);
    await run("UPDATE deals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", ["REJECTED", deal.id]);
    const updated = await get(`${DEAL_SELECT} WHERE d.id = $1`, [deal.id]);
    res.json(formatDeal(updated));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to reject offer" });
  }
});

app.post("/api/deals/:id/payment-sent", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "Buyer") return res.status(403).json({ error: "Only buyer can mark payment sent" });
    const deal = await getDealForUser(req.params.id, req.user);
    assertMutable(deal);
    if (normalizeDealStatus(deal.status) !== "PAYMENT_PENDING" && normalizeDealStatus(deal.status) !== "AGREED") {
      return res.status(409).json({ error: "Payment can be sent only after offer agreement" });
    }
    await run(
      `UPDATE deals SET payment_given = 1, payment_status = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      ["SENT", "PAYMENT_SENT", deal.id]
    );
    const updated = await get(`${DEAL_SELECT} WHERE d.id = $1`, [deal.id]);
    res.json(formatDeal(updated));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to mark payment sent" });
  }
});

app.post("/api/deals/:id/payment-received", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "Farmer") return res.status(403).json({ error: "Only farmer can mark payment received" });
    const deal = await getDealForUser(req.params.id, req.user);
    assertMutable(deal);
    if (!deal.payment_given && derivePaymentStatus(deal) !== "SENT") {
      return res.status(409).json({ error: "Buyer must mark payment sent before farmer confirms receipt" });
    }
    await run(
      `UPDATE deals SET payment_received = 1, payment_status = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      ["RECEIVED", "COMPLETED", deal.id]
    );
    const updated = await get(`${DEAL_SELECT} WHERE d.id = $1`, [deal.id]);
    res.json(formatDeal(updated));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to mark payment received" });
  }
});

// Backward-compatible restricted patch route for transaction mode only.
app.patch("/api/deals/:id", authenticateToken, async (req, res) => {
  try {
    const deal = await getDealForUser(req.params.id, req.user);
    const newMode = req.body.transactionMode !== undefined ? req.body.transactionMode : deal.transaction_mode;
    await run("UPDATE deals SET transaction_mode = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [newMode, deal.id]);
    const updated = await get(`${DEAL_SELECT} WHERE d.id = $1`, [deal.id]);
    res.json(formatDeal(updated));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to update deal" });
  }
});

// Chat Messages for Deal Room
app.get("/api/deals/:id/messages", authenticateToken, async (req, res) => {
  try {
    await getDealForUser(req.params.id, req.user);
    const rows = await all("SELECT * FROM chat_messages WHERE deal_id = $1 ORDER BY created_at ASC", [req.params.id]);
    res.json(rows.map(formatMessage));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to load chat messages" });
  }
});

app.post("/api/deals/:id/messages", authenticateToken, async (req, res) => {
  try {
    const deal = await getDealForUser(req.params.id, req.user);
    const text = String(req.body.message || req.body.text || "").trim();
    if (!text) return res.status(400).json({ error: "Message text cannot be empty" });

    const msgId = `MSG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const sender = req.user.name || (req.user.role === "Farmer" ? deal.farmer : deal.buyer);
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    await run(
      `INSERT INTO chat_messages (id, deal_id, sender_id, sender, text, message, time) VALUES ($1, $2, $3, $4, $5, $5, $6)`,
      [msgId, deal.id, req.user.id, sender, text, time]
    );

    const created = await get("SELECT * FROM chat_messages WHERE id = $1", [msgId]);
    res.status(201).json(formatMessage(created));
  } catch (err) {
    console.error("Send chat error:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to send message" });
  }
});

app.get("/api/deals/:id/chat", authenticateToken, async (req, res) => {
  try {
    await getDealForUser(req.params.id, req.user);
    const rows = await all("SELECT * FROM chat_messages WHERE deal_id = $1 ORDER BY created_at ASC", [req.params.id]);
    res.json(rows.map(formatMessage));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to load chat messages" });
  }
});

app.post("/api/deals/:id/chat", authenticateToken, async (req, res) => {
  req.url = `/api/deals/${req.params.id}/messages`;
  res.status(410).json({ error: "Use /api/deals/:id/messages for deal chat" });
});

// Sample / Quality registration
app.post("/api/quality/samples", authenticateToken, async (req, res) => {
  try {
    const { lotId } = req.body;
    const sampleId = `FT-SMP-2026-${Math.floor(3000 + Math.random() * 6000)}`;

    if (lotId) {
      await run("UPDATE lots SET lab_status = $1 WHERE id = $2", ["Submitted", lotId]);
    }

    res.json({ sampleId, status: "Submitted", message: "Sample registered successfully for lab testing." });
  } catch (err) {
    res.status(500).json({ error: "Failed to register sample" });
  }
});

async function callMlPrediction(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.ML_API_TIMEOUT_MS) || 10000);

  try {
    if (!ML_SERVICE_URL) {
      const configError = new Error("ML_SERVICE_URL is required to call the ML prediction service.");
      configError.status = 503;
      throw configError;
    }

    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.detail || data.error || "ML prediction service failed.";
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("ML prediction service timed out.");
      timeoutError.status = 504;
      throw timeoutError;
    }

    if (error.status) throw error;
    const unavailable = new Error("ML prediction service is unavailable. Please start the FastAPI ML service.");
    unavailable.status = 503;
    throw unavailable;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePredictionPayload(source) {
  const payload = {
    crop: String(source.crop || "").trim(),
    state: String(source.state || "").trim(),
    district: String(source.district || source.city || "").trim(),
    market: String(source.market || source.mandi || "").trim(),
    prediction_days: Number(source.prediction_days || source.predictionDays || 7),
  };

  if (!payload.crop || !payload.state || !payload.district || !payload.market) {
    const error = new Error("crop, state, district and market are required.");
    error.status = 400;
    throw error;
  }

  if (!Number.isFinite(payload.prediction_days) || payload.prediction_days < 1 || payload.prediction_days > 30) {
    const error = new Error("prediction_days must be between 1 and 30.");
    error.status = 400;
    throw error;
  }

  payload.prediction_days = Math.round(payload.prediction_days);
  return payload;
}

app.post("/api/ml/predict", async (req, res) => {
  try {
    const payload = normalizePredictionPayload(req.body || {});
    res.json(await callMlPrediction(payload));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to get ML prediction" });
  }
});

app.get("/api/ml/predict", async (req, res) => {
  try {
    const payload = normalizePredictionPayload(req.query || {});
    res.json(await callMlPrediction(payload));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to get ML prediction" });
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`FairTrade Backend API server running on ${HOST}:${PORT}`);
  initializeDatabase();
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing process or set PORT to a different value.`);
    process.exit(1);
  }

  console.error("Backend server failed to start:", error);
  process.exit(1);
});

async function initializeDatabase() {
  try {
    const initialized = await initDb();
    if (initialized) {
      console.log("FairTrade database initialized successfully");
    }
  } catch (error) {
    console.error("FairTrade database initialization failed:", error);
  }
}
