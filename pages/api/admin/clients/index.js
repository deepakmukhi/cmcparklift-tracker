import { requireAdmin } from "../../../../lib/auth";
import { readDb, writeDb, hashPassword, genId, publicClient } from "../../../../lib/db";

export default async function handler(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return;

  if (req.method === "GET") {
    const db = await readDb();
    return res.status(200).json({ clients: db.clients.map(publicClient) });
  }

  if (req.method === "POST") {
    const { username, password, name } = req.body || {};
    if (!username || !password || !name) {
      return res.status(400).json({ error: "Name, username and password are required." });
    }
    const db = await readDb();
    const exists = db.clients.some(
      (c) => c.username.trim().toLowerCase() === username.trim().toLowerCase()
    );
    if (exists) {
      return res.status(409).json({ error: "That username is already taken." });
    }
    const client = {
      id: genId("c"),
      username: username.trim(),
      password: hashPassword(password),
      name: name.trim(),
      machines: [],
      createdAt: Date.now(),
    };
    db.clients.push(client);
    await writeDb(db);
    return res.status(201).json({ client: publicClient(client) });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
