import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "fairtrade.db");

const db = new sqlite3.Database(dbPath);

// Helper function to run SQL commands returning a Promise
export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// Helper function to get a single row
export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper function to get all rows
export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Seed & Database initialization
export async function initDb() {
  db.serialize();

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      identifier TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS lots (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      farmer_name TEXT NOT NULL,
      crop TEXT NOT NULL,
      grade TEXT NOT NULL,
      declared_quality TEXT NOT NULL,
      lab_status TEXT NOT NULL,
      quantity_qt REAL NOT NULL,
      expected_price REAL NOT NULL,
      city TEXT NOT NULL,
      mandi TEXT NOT NULL,
      reliability REAL NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS demands (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      crop TEXT NOT NULL,
      grade TEXT NOT NULL,
      quantity_qt REAL NOT NULL,
      min_price REAL NOT NULL,
      max_price REAL NOT NULL,
      city TEXT NOT NULL,
      mandi TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      farmer TEXT NOT NULL,
      buyer TEXT NOT NULL,
      farmer_id TEXT,
      buyer_id TEXT,
      lot_id TEXT NOT NULL,
      crop TEXT NOT NULL,
      quantity_qt REAL NOT NULL,
      grade TEXT NOT NULL,
      agreed_price REAL NOT NULL,
      offer REAL NOT NULL,
      counter_offer REAL NOT NULL,
      payment_given INTEGER DEFAULT 0,
      payment_received INTEGER DEFAULT 0,
      transaction_mode TEXT NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS market_quotes (
      id TEXT PRIMARY KEY,
      state TEXT NOT NULL,
      city TEXT NOT NULL,
      mandi TEXT NOT NULL,
      crop TEXT NOT NULL,
      grade TEXT NOT NULL,
      current_price REAL NOT NULL,
      change_val REAL NOT NULL,
      high REAL NOT NULL,
      low REAL NOT NULL,
      updated_at TEXT NOT NULL,
      confidence REAL NOT NULL,
      forecast_json TEXT NOT NULL
    )
  `);

  // Seed default demo users if users table is empty
  const userCount = await get("SELECT COUNT(*) as count FROM users");
  if (userCount.count === 0) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await run(
      `INSERT INTO users (id, role, name, identifier, password_hash) VALUES (?, ?, ?, ?, ?)`,
      ["F-101", "Farmer", "Ramesh Meena", "ramesh@fairtrade.org", hashedPassword]
    );
    await run(
      `INSERT INTO users (id, role, name, identifier, password_hash) VALUES (?, ?, ?, ?, ?)`,
      ["B-101", "Buyer", "Shakti Foods Pvt Ltd", "shakti@fairtrade.org", hashedPassword]
    );
  }

  // Seed market quotes if table is empty
  const quoteCount = await get("SELECT COUNT(*) as count FROM market_quotes");
  if (quoteCount.count === 0) {
    const locations = [
      { state: "Rajasthan", city: "Kota", mandis: ["Ramganj Mandi", "Kota Krishi Upaj Mandi"] },
      { state: "Rajasthan", city: "Jaipur", mandis: ["Chandpole Mandi", "Sanganer Mandi"] },
      { state: "Rajasthan", city: "Bundi", mandis: ["Bundi Mandi", "Keshoraipatan Mandi"] },
      { state: "Rajasthan", city: "Alwar", mandis: ["Alwar Mandi", "Khairthal Mandi"] },
      { state: "Rajasthan", city: "Ajmer", mandis: ["Ajmer Mandi", "Kishangarh Mandi"] },
      { state: "Rajasthan", city: "Jodhpur", mandis: ["Mandor Mandi", "Jodhpur Grain Mandi"] },
      { state: "Delhi", city: "Delhi", mandis: ["Narela Mandi", "Najafgarh Mandi"] },
    ];
    const crops = ["Wheat", "Rice", "Mustard", "Maize", "Gram"];
    const grades = ["FAQ", "A", "Premium", "Lab Verified", "Organic"];

    const baseByCrop = { Wheat: 2575, Rice: 3120, Mustard: 5870, Maize: 2240, Gram: 5520 };
    const gradePremium = { FAQ: 0, A: 85, Premium: 180, "Lab Verified": 240, Organic: 360 };
    const cityLift = { Kota: 70, Jaipur: 115, Bundi: 35, Alwar: 95, Ajmer: 55, Jodhpur: 130, Delhi: 175 };

    function forecast(base, seed) {
      return [
        { label: "Today", actual: base, low: base - 38, high: base + 44, confidence: 96 },
        ...Array.from({ length: 7 }, (_, index) => {
          const wave = Math.round(Math.sin((seed + index) * 0.8) * 34 + index * 13 - 16);
          const predicted = base + wave;
          return {
            label: `Day ${index + 1}`,
            predicted,
            low: predicted - 48 - index * 3,
            high: predicted + 52 + index * 4,
            confidence: 91 - index * 3,
          };
        }),
      ];
    }

    for (let lIdx = 0; lIdx < locations.length; lIdx++) {
      const loc = locations[lIdx];
      for (let mIdx = 0; mIdx < loc.mandis.length; mIdx++) {
        const mandi = loc.mandis[mIdx];
        for (let cIdx = 0; cIdx < crops.length; cIdx++) {
          const crop = crops[cIdx];
          for (let gIdx = 0; gIdx < grades.length; gIdx++) {
            const grade = grades[gIdx];
            const spread = lIdx * 18 + mIdx * 24 + cIdx * 31 + gIdx * 9;
            const currentPrice = baseByCrop[crop] + cityLift[loc.city] + gradePremium[grade] + spread;
            const changeVal = Math.round(Math.sin(spread) * 46);
            const id = `${loc.city}-${mandi}-${crop}-${grade}`.replace(/\s+/g, "-");
            const forecastObj = forecast(currentPrice, spread);

            await run(
              `INSERT INTO market_quotes (id, state, city, mandi, crop, grade, current_price, change_val, high, low, updated_at, confidence, forecast_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                loc.state,
                loc.city,
                mandi,
                crop,
                grade,
                currentPrice,
                changeVal,
                currentPrice + 86,
                currentPrice - 74,
                "17 Sep 2026, 11:10 AM",
                88 + ((cIdx + gIdx) % 7),
                JSON.stringify(forecastObj),
              ]
            );
          }
        }
      }
    }
  }

  // Seed initial produce lots if table is empty
  const lotCount = await get("SELECT COUNT(*) as count FROM lots");
  if (lotCount.count === 0) {
    const defaultLots = [
      { id: "LOT-1042", farmer_id: "F-101", farmer_name: "Ramesh Meena", crop: "Wheat", grade: "FAQ", declared_quality: "11.8% moisture, bold grain", lab_status: "Verified", quantity_qt: 180, expected_price: 2680, city: "Kota", mandi: "Ramganj Mandi", reliability: 92, status: "Active" },
      { id: "LOT-1043", farmer_id: "F-102", farmer_name: "Sushila Gurjar", crop: "Mustard", grade: "Premium", declared_quality: "Clean seed, low admixture", lab_status: "Submitted", quantity_qt: 95, expected_price: 6160, city: "Jaipur", mandi: "Sanganer Mandi", reliability: 88, status: "Matched" },
      { id: "LOT-1044", farmer_id: "F-103", farmer_name: "Iqbal Khan", crop: "Gram", grade: "Lab Verified", declared_quality: "Large grain, 1.2% foreign matter", lab_status: "Verified", quantity_qt: 120, expected_price: 5900, city: "Ajmer", mandi: "Ajmer Mandi", reliability: 95, status: "In Deal" },
      { id: "LOT-1045", farmer_id: "F-104", farmer_name: "Neelam Yadav", crop: "Rice", grade: "A", declared_quality: "Fine grain, polished sample", lab_status: "Pending", quantity_qt: 210, expected_price: 3360, city: "Delhi", mandi: "Narela Mandi", reliability: 84, status: "Active" },
      { id: "LOT-1046", farmer_id: "F-105", farmer_name: "Mahendra Singh", crop: "Maize", grade: "Organic", declared_quality: "Chemical-free cultivation record", lab_status: "Submitted", quantity_qt: 75, expected_price: 2820, city: "Bundi", mandi: "Bundi Mandi", reliability: 90, status: "Active" }
    ];

    for (const item of defaultLots) {
      await run(
        `INSERT INTO lots (id, farmer_id, farmer_name, crop, grade, declared_quality, lab_status, quantity_qt, expected_price, city, mandi, reliability, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.farmer_id, item.farmer_name, item.crop, item.grade, item.declared_quality, item.lab_status, item.quantity_qt, item.expected_price, item.city, item.mandi, item.reliability, item.status]
      );
    }
  }

  // Seed demands if table is empty
  const demandCount = await get("SELECT COUNT(*) as count FROM demands");
  if (demandCount.count === 0) {
    const defaultDemands = [
      { id: "DEM-781", buyer_id: "B-101", buyer_name: "Shakti Foods Pvt Ltd", crop: "Wheat", grade: "FAQ", quantity_qt: 150, min_price: 2550, max_price: 2750, city: "Kota", mandi: "Ramganj Mandi" },
      { id: "DEM-782", buyer_id: "B-102", buyer_name: "Delhi Agro Mart", crop: "Rice", grade: "A", quantity_qt: 200, min_price: 3200, max_price: 3480, city: "Delhi", mandi: "Narela Mandi" },
      { id: "DEM-783", buyer_id: "B-103", buyer_name: "Marwar Oil Mills", crop: "Mustard", grade: "Premium", quantity_qt: 80, min_price: 5900, max_price: 6250, city: "Jaipur", mandi: "Sanganer Mandi" }
    ];
    for (const item of defaultDemands) {
      await run(
        `INSERT INTO demands (id, buyer_id, buyer_name, crop, grade, quantity_qt, min_price, max_price, city, mandi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.buyer_id, item.buyer_name, item.crop, item.grade, item.quantity_qt, item.min_price, item.max_price, item.city, item.mandi]
      );
    }
  }

  // Seed deals if table is empty
  const dealCount = await get("SELECT COUNT(*) as count FROM deals");
  if (dealCount.count === 0) {
    const defaultDeals = [
      { id: "DL-9001", farmer: "Iqbal Khan", buyer: "Kisan Retail Chain", farmer_id: "F-103", buyer_id: "B-105", lot_id: "LOT-1044", crop: "Gram", quantity_qt: 120, grade: "Lab Verified", agreed_price: 5860, offer: 5800, counter_offer: 5920, payment_given: 1, payment_received: 0, transaction_mode: "Use FairTrade", status: "Payment Pending", date: "17 Sep 2026" },
      { id: "DL-9002", farmer: "Ramesh Meena", buyer: "Shakti Foods Pvt Ltd", farmer_id: "F-101", buyer_id: "B-101", lot_id: "LOT-1042", crop: "Wheat", quantity_qt: 150, grade: "FAQ", agreed_price: 2705, offer: 2660, counter_offer: 2725, payment_given: 1, payment_received: 1, transaction_mode: "Use FairTrade", status: "Completed", date: "16 Sep 2026" }
    ];
    for (const item of defaultDeals) {
      await run(
        `INSERT INTO deals (id, farmer, buyer, farmer_id, buyer_id, lot_id, crop, quantity_qt, grade, agreed_price, offer, counter_offer, payment_given, payment_received, transaction_mode, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.farmer, item.buyer, item.farmer_id, item.buyer_id, item.lot_id, item.crop, item.quantity_qt, item.grade, item.agreed_price, item.offer, item.counter_offer, item.payment_given, item.payment_received, item.transaction_mode, item.status, item.date]
      );
    }
  }

  // Seed chat messages if table is empty
  const chatCount = await get("SELECT COUNT(*) as count FROM chat_messages");
  if (chatCount.count === 0) {
    await run(
      `INSERT INTO chat_messages (id, deal_id, sender, text, time) VALUES (?, ?, ?, ?, ?)`,
      ["MSG-1", "DL-9001", "Iqbal Khan", "Quality sample is verified. Loading can be arranged tomorrow morning.", "10:15 AM"]
    );
    await run(
      `INSERT INTO chat_messages (id, deal_id, sender, text, time) VALUES (?, ?, ?, ?, ?)`,
      ["MSG-2", "DL-9001", "Kisan Retail Chain", "Agreed at Rs 5,860/Qt. Please share payment confirmation after weighing.", "10:22 AM"]
    );
  }
}
