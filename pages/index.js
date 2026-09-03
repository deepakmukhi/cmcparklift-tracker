import { useEffect, useState } from "react";
import Head from "next/head";
import Timeline from "../components/Timeline";
import { progressOf, currentStageInfo } from "../lib/stages";

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

const STAGE_ORDER = ["pending", "in_progress", "done"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null); // { role, name, clientId }
  const [view, setView] = useState("landing");

  useEffect(() => {
    api("/api/me")
      .then((d) => {
        if (d.authenticated) {
          setSession(d);
          setView(d.role === "admin" ? "admin-clients" : "client-machines");
        }
      })
      .finally(() => setBooting(false));
  }, []);

  async function logout() {
    await api("/api/logout", { method: "POST" });
    setSession(null);
    setView("landing");
  }

  if (booting) return null;

  return (
    <div className="app">
      <Head>
        <title>Parklift Tracker</title>
      </Head>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><span>&#9670;</span></div>
          <div className="brand-text">
            <span className="brand-name">PARKLIFT TRACKER</span>
            <span className="brand-sub">Production &amp; shipping status</span>
          </div>
        </div>
        <div className="topbar-actions">
          {session ? (
            <button className="link-btn" onClick={logout}>Log out</button>
          ) : view !== "landing" ? (
            <button className="link-btn" onClick={() => setView("landing")}>Back</button>
          ) : null}
        </div>
      </header>

      <main>
        {view === "landing" && <Landing setView={setView} />}
        {view === "client-login" && <ClientLogin onLoggedIn={(d) => { setSession(d); setView("client-machines"); }} />}
        {view === "admin-login" && <AdminLogin onLoggedIn={(d) => { setSession(d); setView("admin-clients"); }} />}
        {view === "client-machines" && session && <ClientMachines />}
        {view === "admin-clients" && session && <AdminClients />}
      </main>
    </div>
  );
}

/* ---------------- Landing ---------------- */
function Landing({ setView }) {
  return (
    <section>
      <p className="eyebrow">Welcome</p>
      <h1>Sign in to check your machine's status</h1>
      <div className="role-choice">
        <button className="primary-btn" onClick={() => setView("client-login")}>Client login</button>
        <button className="secondary-btn" onClick={() => setView("admin-login")}>Admin / team login</button>
      </div>
    </section>
  );
}

/* ---------------- Client login ---------------- */
function ClientLogin({ onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const d = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ role: "client", username, password }),
      });
      onLoggedIn(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <p className="eyebrow">Client access</p>
      <h1>Log in to see your machines</h1>
      <div className="lookup-card">
        <form className="lookup-form" onSubmit={submit}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button className="primary-btn" disabled={loading} type="submit">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>
    </section>
  );
}

/* ---------------- Admin login ---------------- */
function AdminLogin({ onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const d = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ role: "admin", username, password }),
      });
      onLoggedIn(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <p className="eyebrow">Team access</p>
      <h1>Admin login</h1>
      <div className="lookup-card">
        <form className="lookup-form" onSubmit={submit}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button className="primary-btn" disabled={loading} type="submit">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>
    </section>
  );
}

/* ---------------- Client: machines list + detail ---------------- */
function ClientMachines() {
  const [clientName, setClientName] = useState("");
  const [machines, setMachines] = useState([]);
  const [selected, setSelected] = useState(null); // full machine object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const d = await api("/api/client/machines");
      setClientName(d.clientName);
      setMachines(d.machines);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openMachine(id) {
    setError("");
    try {
      const d = await api(`/api/client/machines/${id}`);
      setSelected(d.machine);
    } catch (err) {
      setError(err.message);
    }
  }

  if (selected) {
    const pct = progressOf(selected);
    const cur = currentStageInfo(selected);
    return (
      <section>
        <div className="tag-card">
          <div className="tag-grommet"></div>
          <div className="tag-head">
            <div>
              <p className="tag-client">{clientName}</p>
              <p className="tag-model">{selected.model || "No model set"}</p>
            </div>
            <span className="tag-serial">{selected.serial}</span>
          </div>
          <div className="progress-wrap">
            <div className="progress-label"><span>Overall progress</span><span>{pct}%</span></div>
            <div className="progress-track"><div className="progress-fill" style={{ width: pct + "%" }}></div></div>
          </div>
          <div className="current-stage-banner">
            {cur.status === "done" && pct === 100 ? (
              <><b>Complete</b> &mdash; {cur.label}</>
            ) : (
              <>Current stage: <b>{cur.label}</b></>
            )}
          </div>
          <Timeline stages={selected.stages} editable={false} />
        </div>
        <button className="text-btn" onClick={() => setSelected(null)}>&larr; Back to my machines</button>
      </section>
    );
  }

  return (
    <section>
      <div className="admin-header">
        <h1>{clientName ? `${clientName}'s machines` : "My machines"}</h1>
      </div>
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p className="hint-text">Loading...</p>
      ) : machines.length === 0 ? (
        <div className="empty-state">No machines have been added to your account yet.</div>
      ) : (
        <div className="admin-list">
          {machines.map((m) => (
            <div className="list-item" key={m.id} onClick={() => openMachine(m.id)}>
              <div>
                <div className="li-title">{m.model || "Untitled model"}</div>
                <div className="li-meta"><span className="li-serial">{m.serial}</span></div>
              </div>
              <div className="li-progress">{m.progress}%</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- Admin: clients list ---------------- */
function AdminClients() {
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showNewClient, setShowNewClient] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const d = await api("/api/admin/clients");
      setClients(d.clients);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (selectedClientId) {
    return (
      <ClientDetail
        clientId={selectedClientId}
        onBack={() => { setSelectedClientId(null); load(); }}
      />
    );
  }

  const filtered = clients
    .filter((c) => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.username.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section>
      <div className="admin-header">
        <h1>Clients</h1>
        <button className="primary-btn" onClick={() => setShowNewClient(true)}>+ Add client</button>
      </div>
      {showNewClient && (
        <NewClientForm
          onCancel={() => setShowNewClient(false)}
          onCreated={() => { setShowNewClient(false); load(); }}
        />
      )}
      <input
        className="search-input"
        placeholder="Search by client name or username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p className="hint-text">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No clients yet. Add one to start tracking their machines.</div>
      ) : (
        <div className="admin-list">
          {filtered.map((c) => (
            <div className="list-item" key={c.id} onClick={() => setSelectedClientId(c.id)}>
              <div>
                <div className="li-title">{c.name}</div>
                <div className="li-meta">Username: <span className="li-serial">{c.username}</span></div>
              </div>
              <div className="li-progress">{c.machineCount} machine{c.machineCount === 1 ? "" : "s"}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NewClientForm({ onCancel, onCreated }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/admin/clients", {
        method: "POST",
        body: JSON.stringify({ name, username, password }),
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="editor-fields">
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <label>Client name<input placeholder="e.g. Al Fanar Trading Co." value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Login username<input placeholder="e.g. alfanar" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label>Login password<input type="text" placeholder="Set a password for this client" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="error-text">{error}</p>}
        <div className="editor-actions">
          <button className="primary-btn" disabled={loading} type="submit">{loading ? "Creating..." : "Create client"}</button>
          <button className="secondary-btn" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Admin: single client detail ---------------- */
function ClientDetail({ clientId, onBack }) {
  const [client, setClient] = useState(null);
  const [error, setError] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [showNewMachine, setShowNewMachine] = useState(false);
  const [editingCreds, setEditingCreds] = useState(false);

  useEffect(() => { load(); }, [clientId]);

  async function load() {
    try {
      const d = await api(`/api/admin/clients/${clientId}`);
      setClient(d.client);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteClient() {
    if (!confirm(`Delete client "${client.name}" and all their machines? This can't be undone.`)) return;
    await api(`/api/admin/clients/${clientId}`, { method: "DELETE" });
    onBack();
  }

  if (selectedMachineId) {
    return (
      <MachineEditor
        machineId={selectedMachineId}
        onBack={() => { setSelectedMachineId(null); load(); }}
      />
    );
  }

  if (!client) return <p className="hint-text">Loading...</p>;

  return (
    <section>
      <button className="text-btn" style={{ marginTop: 0 }} onClick={onBack}>&larr; Back to clients</button>
      <div className="admin-header" style={{ marginTop: "14px" }}>
        <h1>{client.name}</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary-btn" onClick={() => setEditingCreds((v) => !v)}>
            {editingCreds ? "Close" : "Edit login"}
          </button>
          <button className="primary-btn" onClick={() => setShowNewMachine(true)}>+ Add machine</button>
        </div>
      </div>

      {editingCreds && (
        <EditClientCreds
          client={client}
          onSaved={() => { setEditingCreds(false); load(); }}
          onDelete={deleteClient}
        />
      )}

      {showNewMachine && (
        <NewMachineForm
          clientId={clientId}
          onCancel={() => setShowNewMachine(false)}
          onCreated={() => { setShowNewMachine(false); load(); }}
        />
      )}

      {error && <p className="error-text">{error}</p>}

      {client.machines.length === 0 ? (
        <div className="empty-state">No machines yet for this client. Add one to start tracking.</div>
      ) : (
        <div className="admin-list">
          {client.machines.map((m) => (
            <div className="list-item" key={m.id} onClick={() => setSelectedMachineId(m.id)}>
              <div>
                <div className="li-title">{m.model || "Untitled model"}</div>
                <div className="li-meta"><span className="li-serial">{m.serial}</span></div>
              </div>
              <div className="li-progress">{m.progress}%</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EditClientCreds({ client, onSaved, onDelete }) {
  const [name, setName] = useState(client.name);
  const [username, setUsername] = useState(client.username);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api(`/api/admin/clients/${client.id}`, {
        method: "PUT",
        body: JSON.stringify({ name, username, password: password || undefined }),
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="editor-fields">
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <label>Client name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Login username<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label>New password<input type="text" placeholder="Leave blank to keep current password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="error-text">{error}</p>}
        <div className="editor-actions">
          <button className="primary-btn" disabled={loading} type="submit">{loading ? "Saving..." : "Save changes"}</button>
          <button className="danger-btn" type="button" onClick={onDelete}>Delete client</button>
        </div>
      </form>
    </div>
  );
}

function NewMachineForm({ clientId, onCancel, onCreated }) {
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api(`/api/admin/clients/${clientId}/machines`, {
        method: "POST",
        body: JSON.stringify({ model, serial }),
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="editor-fields">
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <label>Model<input placeholder="e.g. Parklift PL-4000" value={model} onChange={(e) => setModel(e.target.value)} /></label>
        <label>Serial number (optional, auto-generated if left blank)<input placeholder="e.g. CMC-2026-014" value={serial} onChange={(e) => setSerial(e.target.value)} /></label>
        {error && <p className="error-text">{error}</p>}
        <div className="editor-actions">
          <button className="primary-btn" disabled={loading} type="submit">{loading ? "Adding..." : "Add machine"}</button>
          <button className="secondary-btn" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Admin: machine editor ---------------- */
function MachineEditor({ machineId, onBack }) {
  const [machine, setMachine] = useState(null);
  const [clientName, setClientName] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [machineId]);

  async function load() {
    try {
      const d = await api(`/api/admin/machines/${machineId}`);
      setMachine(d.machine);
      setClientName(d.clientName);
      setModel(d.machine.model);
      setSerial(d.machine.serial);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveMeta(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const d = await api(`/api/admin/machines/${machineId}`, {
        method: "PUT",
        body: JSON.stringify({ model, serial }),
      });
      setMachine(d.machine);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cycleStage(key) {
    const cur = machine.stages[key].status;
    const next = STAGE_ORDER[(STAGE_ORDER.indexOf(cur) + 1) % STAGE_ORDER.length];
    const newStages = {
      ...machine.stages,
      [key]: { status: next, date: next === "done" ? todayStr() : "" },
    };
    setMachine({ ...machine, stages: newStages }); // optimistic
    try {
      await api(`/api/admin/machines/${machineId}`, {
        method: "PUT",
        body: JSON.stringify({ stages: newStages }),
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  async function deleteMachine() {
    if (!confirm("Delete this machine? This can't be undone.")) return;
    await api(`/api/admin/machines/${machineId}`, { method: "DELETE" });
    onBack();
  }

  if (!machine) return <p className="hint-text">Loading...</p>;

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <button className="text-btn" style={{ margin: 0 }} onClick={onBack}>&larr; Back to {clientName || "client"}'s machines</button>
      </div>
      <div className="editor-fields">
        <form onSubmit={saveMeta} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label>Model<input value={model} onChange={(e) => setModel(e.target.value)} /></label>
          <label>Serial number<input value={serial} onChange={(e) => setSerial(e.target.value)} /></label>
          <div className="editor-actions">
            <button className="primary-btn" disabled={saving} type="submit">{saving ? "Saving..." : "Save details"}</button>
            <button className="danger-btn" type="button" onClick={deleteMachine}>Delete machine</button>
          </div>
        </form>
      </div>
      {error && <p className="error-text">{error}</p>}
      <p className="eyebrow" style={{ marginTop: "28px" }}>Tap a stage to advance its status</p>
      <Timeline stages={machine.stages} editable={true} onStageClick={cycleStage} />
    </section>
  );
}
