import { getSession } from "../../lib/auth";
import { readDb } from "../../lib/db";

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(200).json({ authenticated: false });

  if (session.role === "admin") {
    return res.status(200).json({ authenticated: true, role: "admin" });
  }

  if (session.role === "client") {
    const db = await readDb();
    const client = db.clients.find((c) => c.id === session.clientId);
    if (!client) return res.status(200).json({ authenticated: false });
    return res
      .status(200)
      .json({ authenticated: true, role: "client", name: client.name, clientId: client.id });
  }

  return res.status(200).json({ authenticated: false });
}
