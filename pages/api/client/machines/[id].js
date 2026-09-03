import { requireClient } from "../../../../lib/auth";
import { readDb } from "../../../../lib/db";
import { progressOf } from "../../../../lib/stages";

export default async function handler(req, res) {
  const session = requireClient(req, res);
  if (!session) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query;
  const db = await readDb();
  const client = db.clients.find((c) => c.id === session.clientId);
  if (!client) return res.status(404).json({ error: "Not found" });

  const machine = (client.machines || []).find((m) => m.id === id);
  if (!machine) return res.status(404).json({ error: "Machine not found" });

  return res.status(200).json({ machine, progress: progressOf(machine), clientName: client.name });
}
