import crypto from "crypto";
import { freshStages } from "./stages";

const DB_KEY = "parklift-db";

// ---------- Password hashing (scrypt, salted) ----------
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const check = crypto.scryptSync(String(password), salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(check, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function emptyDb() {
  return { clients: [] };
}

// ---------- Storage backend ----------
// Uses Upstash Redis in production (env vars auto-injected once you attach
// an "Upstash for Redis" store to the project from the Vercel dashboard).
// Falls back to a local JSON file so `npm run dev` works with zero setup.
let kvClient = null;
function hasKv() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}
async function getKv() {
  if (!kvClient) {
    const { Redis } = await import("@upstash/redis");
    kvClient = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
  return kvClient;
}

const LOCAL_DB_PATH = "/tmp/parklift-db.local.json";

async function readLocal() {
  const fs = await import("fs");
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
async function writeLocal(data) {
  const fs = await import("fs");
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data), "utf8");
}

export async function readDb() {
  let data;
  if (hasKv()) {
    const kv = await getKv();
    data = await kv.get(DB_KEY);
  } else {
    data = await readLocal();
  }
  if (!data) {
    data = emptyDb();
    await writeDb(data);
  }
  return data;
}

export async function writeDb(data) {
  if (hasKv()) {
    const kv = await getKv();
    await kv.set(DB_KEY, data);
  } else {
    await writeLocal(data);
  }
}

// ---------- Helpers ----------
export function genId(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function publicClient(c) {
  return {
    id: c.id,
    username: c.username,
    name: c.name,
    machineCount: (c.machines || []).length,
  };
}

export function newMachine(overrides = {}) {
  return {
    id: genId("m"),
    model: "",
    serial: "SERIAL-" + Math.floor(1000 + Math.random() * 9000),
    stages: freshStages(),
    createdAt: Date.now(),
    ...overrides,
  };
}
