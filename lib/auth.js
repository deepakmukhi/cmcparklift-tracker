import crypto from "crypto";

const COOKIE_NAME = "ptl_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function getSecret() {
  return process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";
}

// Admin credentials. Defaults match what was requested; override via
// Vercel env vars ADMIN_USERNAME / ADMIN_PASSWORD to change them without
// touching code.
export function getAdminCreds() {
  return {
    username: process.env.ADMIN_USERNAME || "cmcparklift",
    password: process.env.ADMIN_PASSWORD || "CMC2026@",
  };
}

function sign(payloadB64) {
  return crypto.createHmac("sha256", getSecret()).update(payloadB64).digest("hex");
}

export function createSessionToken(session) {
  const payload = { ...session, exp: Date.now() + SESSION_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const expectedSig = sign(payloadB64);
  const a = Buffer.from(sig || "");
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export function setSessionCookie(res, session) {
  const token = createSessionToken(session);
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

export function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token);
}

export function requireAdmin(req, res) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    res.status(401).json({ error: "Not authorized" });
    return null;
  }
  return session;
}

export function requireClient(req, res) {
  const session = getSession(req);
  if (!session || session.role !== "client") {
    res.status(401).json({ error: "Not authorized" });
    return null;
  }
  return session;
}
