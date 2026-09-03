import { readDb, verifyPassword } from "../../lib/db";
import { setSessionCookie, getAdminCreds } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { role, username, password } = req.body || {};
  if (!role || !username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  if (role === "admin") {
    const creds = getAdminCreds();
    if (username.trim() === creds.username && password === creds.password) {
      setSessionCookie(res, { role: "admin" });
      return res.status(200).json({ ok: true, role: "admin" });
    }
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  if (role === "client") {
    const db = await readDb();
    const client = db.clients.find(
      (c) => c.username.trim().toLowerCase() === username.trim().toLowerCase()
    );
    if (!client || !verifyPassword(password, client.password)) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }
    setSessionCookie(res, { role: "client", clientId: client.id });
    return res.status(200).json({ ok: true, role: "client", name: client.name });
  }

  return res.status(400).json({ error: "Invalid role" });
}
