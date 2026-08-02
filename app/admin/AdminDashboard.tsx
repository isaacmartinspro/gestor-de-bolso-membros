"use client";

import { useEffect, useState } from "react";

type Framework = {
  id: string;
  theme: string;
  title: string;
  difficulty: string;
  type: string;
  description: string;
  prompt: string;
};

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  status: string;
  expires_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  has_account: boolean;
};

type Notice = {
  id: string;
  message: string;
  active: boolean;
  created_at: string;
};

const THEME_OPTIONS = [
  "comercial", "vendas", "financeira", "planilha", "contratacao", "treinamento",
  "feedback", "monitoramento", "qualidade", "performance", "tempo", "mentor",
  "marketing", "revisor", "leitor", "apresentacoes",
];
const DIFF_OPTIONS = ["BÁSICO", "INTERMEDIÁRIO", "AVANÇADO"];
const TYPE_OPTIONS = ["FRAMEWORK", "TEMPLATE", "ANÁLISE", "GERAÇÃO"];

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export default function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<"subscribers" | "notices">("subscribers");

  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div className="auth-brand" style={{ marginBottom: 0 }}>
          <span className="dot" />
          Gestor de Bolso — Admin
        </div>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.78rem", color: "var(--ink-faint)" }}>
          {adminEmail}
        </span>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === "subscribers" ? "active" : ""}`} onClick={() => setTab("subscribers")}>
          Assinantes
        </button>
        <button className={`admin-tab ${tab === "notices" ? "active" : ""}`} onClick={() => setTab("notices")}>
          Avisos
        </button>
      </div>

      {tab === "subscribers" && <SubscribersTab />}
      {tab === "notices" && <NoticesTab />}
    </div>
  );
}

// ---------------- FRAMEWORKS ----------------

function emptyFrameworkForm() {
  return { theme: THEME_OPTIONS[0], title: "", difficulty: DIFF_OPTIONS[0], type: TYPE_OPTIONS[0], description: "", prompt: "" };
}

function FrameworksTab() {
  const [items, setItems] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyFrameworkForm());
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/frameworks");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    setEditingId(null);
    setForm(emptyFrameworkForm());
    setShowForm(true);
  }

  function startEdit(item: Framework) {
    setEditingId(item.id);
    setForm({
      theme: item.theme,
      title: item.title,
      difficulty: item.difficulty,
      type: item.type,
      description: item.description,
      prompt: item.prompt,
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const url = editingId ? `/api/admin/frameworks/${editingId}` : "/api/admin/frameworks";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      load();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este framework do catálogo?")) return;
    const res = await fetch(`/api/admin/frameworks/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Frameworks ({items.length})</h2>
          <button className="admin-btn admin-btn-primary" onClick={startNew}>
            + Novo framework
          </button>
        </div>

        {showForm && (
          <div className="admin-form">
            <div className="admin-form-row">
              <div>
                <label>Área</label>
                <select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
                  {THEME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Nível</label>
                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  {DIFF_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label>Título</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label>Descrição curta</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label>Prompt completo</label>
              <textarea value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="admin-btn admin-btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button className="admin-btn" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div className="admin-card">
        {loading ? (
          <p className="admin-empty">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="admin-empty">Nenhum framework cadastrado ainda.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Área</th>
                <th>Título</th>
                <th>Nível</th>
                <th>Tipo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.theme}</td>
                  <td>{it.title}</td>
                  <td>{it.difficulty}</td>
                  <td>{it.type}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn" onClick={() => startEdit(it)}>Editar</button>
                      <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(it.id)}>Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---------------- ASSINANTES ----------------

function SubscribersTab() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", plan: "anual", expiresInDays: "365" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/subscribers");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!form.email) return;
    setSaving(true);
    const res = await fetch("/api/admin/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ email: "", name: "", plan: "anual", expiresInDays: "365" });
      load();
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remover o acesso desta pessoa? Ela não vai mais conseguir entrar.")) return;
    const res = await fetch(`/api/admin/subscribers/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Assinantes ({items.length})</h2>
          <button className="admin-btn admin-btn-primary" onClick={() => setShowForm(!showForm)}>
            + Adicionar manualmente
          </button>
        </div>

        {showForm && (
          <div className="admin-form">
            <div className="admin-form-row">
              <div>
                <label>E-mail</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="pessoa@email.com" />
              </div>
              <div>
                <label>Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
              </div>
              <div>
                <label>Plano</label>
                <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                  <option value="mensal">Mensal</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              <div>
                <label>Validade (dias)</label>
                <input type="number" value={form.expiresInDays} onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="admin-btn admin-btn-primary" disabled={saving} onClick={handleAdd}>
                {saving ? "Adicionando..." : "Adicionar e enviar convite"}
              </button>
              <button className="admin-btn" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div className="admin-card">
        {loading ? (
          <p className="admin-empty">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="admin-empty">Nenhum assinante cadastrado ainda.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th>Desde</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>{s.name || "—"}</td>
                  <td>{s.email}</td>
                  <td>{s.plan}</td>
                  <td>{s.status}</td>
                  <td>{fmtDate(s.last_sign_in_at)}</td>
                  <td>{fmtDate(s.created_at)}</td>
                  <td>
                    <button className="admin-btn admin-btn-danger" onClick={() => handleRemove(s.id)}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---------------- AVISOS ----------------

function NoticesTab() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/notices");
    if (res.ok) setNotices(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const active = notices.find((n) => n.active);

  async function handlePublish() {
    if (!message.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("");
      load();
    }
  }

  async function handleRemove() {
    if (!confirm("Remover o aviso ativo do portal?")) return;
    const res = await fetch("/api/admin/notices", { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="admin-card">
        <h2>Aviso ativo no portal</h2>
        {loading ? (
          <p className="admin-empty">Carregando...</p>
        ) : active ? (
          <div>
            <p style={{ color: "var(--ink)", marginBottom: 12 }}>{active.message}</p>
            <button className="admin-btn admin-btn-danger" onClick={handleRemove}>Remover aviso</button>
          </div>
        ) : (
          <p className="admin-empty">Nenhum aviso ativo no momento.</p>
        )}
      </div>

      <div className="admin-card">
        <h2>Publicar novo aviso</h2>
        <div className="admin-form">
          <div>
            <label>Mensagem (aparece em destaque no topo do portal para todos os assinantes)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ex: Chegaram 10 novos frameworks de Marketing esta semana!" />
          </div>
          <button className="admin-btn admin-btn-primary" disabled={saving} onClick={handlePublish}>
            {saving ? "Publicando..." : "Publicar aviso"}
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h2>Histórico de avisos</h2>
        {notices.length === 0 ? (
          <p className="admin-empty">Nenhum aviso criado ainda.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mensagem</th>
                <th>Status</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((n) => (
                <tr key={n.id}>
                  <td>{n.message}</td>
                  <td>{n.active ? "Ativo" : "Encerrado"}</td>
                  <td>{fmtDate(n.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
