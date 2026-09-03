import { requireClient } from "../../../../lib/auth";
import { readDb } from "../../../../lib/db";
import { progressOf } from "../../../../lib/stages";

export default async function handler(req, res) {
  const session = requireClient(req, res);
  if (!session) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const db = await readDb();
  const client = db.clients.find((c) => c.id === session.clientId);
  if (!client) return res.status(404).json({ error: "Not found" });

  const machines = (client.machines || []).map((m) => ({
    id: m.id,
    model: m.model,
    serial: m.serial,
    progress: progressOf(m),
  }));
  return res.status(200).json({ clientName: client.name, machines });
}
