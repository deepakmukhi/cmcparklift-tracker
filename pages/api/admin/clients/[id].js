import { requireAdmin } from "../../../../lib/auth";
import { readDb, writeDb, hashPassword } from "../../../../lib/db";
import { progressOf } from "../../../../lib/stages";

export default async function handler(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return;

  const { id } = req.query;
  const db = await readDb();
  const client = db.clients.find((c) => c.id === id);
  if (!client) return res.status(404).json({ error: "Client not found" });

  if (req.method === "GET") {
    return res.status(200).json({
      client: {
        id: client.id,
        username: client.username,
        name: client.name,
        machines: (client.machines || []).map((m) => ({
          id: m.id,
          model: m.model,
          serial: m.serial,
          progress: progressOf(m),
        })),
      },
    });
  }

  if (req.method === "PUT") {
    const { username, password, name } = req.body || {};
    if (username && username.trim()) {
      const taken = db.clients.some(
        (c) => c.id !== id && c.username.trim().toLowerCase() === username.trim().toLowerCase()
      );
      if (taken) return res.status(409).json({ error: "That username is already taken." });
      client.username = username.trim();
    }
    if (name && name.trim()) client.name = name.trim();
    if (password && password.trim()) client.password = hashPassword(password.trim());
    await writeDb(db);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    db.clients = db.clients.filter((c) => c.id !== id);
    await writeDb(db);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
