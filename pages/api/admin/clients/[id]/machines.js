import { requireAdmin } from "../../../../../lib/auth";
import { readDb, writeDb, newMachine } from "../../../../../lib/db";
import { progressOf } from "../../../../../lib/stages";

export default async function handler(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return;

  const { id } = req.query;
  const db = await readDb();
  const client = db.clients.find((c) => c.id === id);
  if (!client) return res.status(404).json({ error: "Client not found" });

  if (req.method === "POST") {
    const { model, serial } = req.body || {};
    const machine = newMachine({
      model: (model || "").trim(),
      ...(serial && serial.trim() ? { serial: serial.trim() } : {}),
    });
    client.machines = client.machines || [];
    client.machines.push(machine);
    await writeDb(db);
    return res.status(201).json({ machine: { ...machine, progress: progressOf(machine) } });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
