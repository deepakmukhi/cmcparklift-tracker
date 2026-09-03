import { requireAdmin } from "../../../../lib/auth";
import { readDb, writeDb } from "../../../../lib/db";
import { progressOf } from "../../../../lib/stages";

function findMachine(db, id) {
  for (const client of db.clients) {
    const machine = (client.machines || []).find((m) => m.id === id);
    if (machine) return { client, machine };
  }
  return null;
}

export default async function handler(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return;

  const { id } = req.query;
  const db = await readDb();
  const found = findMachine(db, id);
  if (!found) return res.status(404).json({ error: "Machine not found" });
  const { client, machine } = found;

  if (req.method === "GET") {
    return res.status(200).json({ machine, clientName: client.name, progress: progressOf(machine) });
  }

  if (req.method === "PUT") {
    const { model, serial, stages } = req.body || {};
    if (typeof model === "string") machine.model = model.trim();
    if (typeof serial === "string" && serial.trim()) machine.serial = serial.trim();
    if (stages && typeof stages === "object") machine.stages = stages;
    await writeDb(db);
    return res.status(200).json({ machine, progress: progressOf(machine) });
  }

  if (req.method === "DELETE") {
    client.machines = client.machines.filter((m) => m.id !== id);
    await writeDb(db);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
