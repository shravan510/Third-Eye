import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VIOLATION_ICONS = {
  SPEEDING:      '💨',
  HELMETLESS:    '⛑️',
  TRIPLE_RIDING: '🏍️',
};

const DEFAULT_TYPES = [
  { violation_type: 'SPEEDING',      section: 'Section 112 MV Act', description: 'Exceeding speed limit',            amount: 2000 },
  { violation_type: 'HELMETLESS',    section: 'Section 129 MV Act', description: 'Not wearing helmet',               amount: 1000 },
  { violation_type: 'TRIPLE_RIDING', section: 'Section 128 MV Act', description: 'Carrying excess pillion riders',   amount: 1000 },
];

/* ─── Add/Edit Modal ────────────────────────────────────────── */
function AddFineModal({ onClose, onAdded, existingTypes }) {
  const [form, setForm] = useState({ violation_type: '', amount: '', section: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    const vt = form.violation_type.trim().toUpperCase().replace(/\s+/g, '_');
    const amt = parseInt(form.amount, 10);
    if (!vt) return setError('Violation type is required.');
    if (isNaN(amt) || amt < 0) return setError('Enter a valid non-negative amount.');
    if (!form.section.trim()) return setError('Legal section is required.');
    if (!form.description.trim()) return setError('Description is required.');
    if (existingTypes.includes(vt)) return setError(`Fine for '${vt}' already exists. Edit it below.`);

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/fine-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ violation_type: vt, amount: amt, section: form.section.trim(), description: form.description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add fine setting.');
      onAdded(data);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--border-color)', background: 'var(--input-bg, #1e293b)',
    color: 'var(--text-bright)', fontSize: '0.88rem', outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5, display: 'block' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 460,
        background: 'var(--panel-bg, #0f172a)',
        border: '1px solid var(--border-color)',
        borderRadius: 16, padding: '28px 26px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)' }}>➕ Add Fine Type</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Violation Type</label>
            <input
              style={inputStyle}
              placeholder="e.g. WRONG_SIDE"
              value={form.violation_type}
              onChange={e => set('violation_type', e.target.value)}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Spaces auto-converted to underscores, uppercased.</div>
          </div>
          <div>
            <label style={labelStyle}>Fine Amount (₹)</label>
            <input type="number" min="0" style={inputStyle} placeholder="e.g. 5000" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Legal Section</label>
            <input style={inputStyle} placeholder="e.g. Section 119 MV Act" value={form.section} onChange={e => set('section', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input style={inputStyle} placeholder="Short description of the offence" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.82rem' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? '⏳ Saving…' : '✅ Add Fine Type'}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 18px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'transparent',
                color: 'var(--text-muted)', fontSize: '0.88rem', cursor: 'pointer',
              }}
            >Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Seed Banner ───────────────────────────────────────────── */
function SeedBanner({ onSeed, seeding }) {
  return (
    <div style={{
      padding: '18px 22px', borderRadius: 12, marginBottom: 22,
      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ fontWeight: 700, color: '#fcd34d', marginBottom: 4 }}>⚠️ No fine settings found</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          The database has no fine entries. Click to load the 3 standard violation types (Speeding, Helmetless, Triple Riding).
        </div>
      </div>
      <button
        onClick={onSeed}
        disabled={seeding}
        style={{
          padding: '9px 20px', borderRadius: 8, border: 'none',
          background: 'rgba(245,158,11,0.2)', color: '#fcd34d',
          fontWeight: 700, fontSize: '0.85rem', cursor: seeding ? 'wait' : 'pointer',
          border: '1px solid rgba(245,158,11,0.4)', whiteSpace: 'nowrap',
        }}
      >
        {seeding ? '⏳ Seeding…' : '🌱 Seed Default Fines'}
      </button>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function FineSettings() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  const [settings, setSettings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [feedback, setFeedback]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [seeding, setSeeding]     = useState(false);

  const loadSettings = () => {
    setLoading(true);
    fetch('http://localhost:3000/api/fine-settings')
      .then(r => r.json())
      .then(data => { setSettings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadSettings(); }, []);

  /* Seed default entries one by one */
  const handleSeed = async () => {
    setSeeding(true);
    const token = localStorage.getItem('token');
    const existing = settings.map(s => s.violation_type);
    const toInsert = DEFAULT_TYPES.filter(d => !existing.includes(d.violation_type));
    const added = [];
    for (const entry of toInsert) {
      try {
        const res = await fetch('http://localhost:3000/api/fine-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(entry),
        });
        if (res.ok) added.push(await res.json());
      } catch { /* skip */ }
    }
    setSettings(prev => [...prev, ...added]);
    setSeeding(false);
  };

  const startEdit = (row) => { setEditingId(row.id); setEditValue(String(row.amount)); setFeedback({}); };
  const cancelEdit = () => { setEditingId(null); setEditValue(''); };

  const saveEdit = async (row) => {
    const amount = parseInt(editValue, 10);
    if (isNaN(amount) || amount < 0) {
      setFeedback(f => ({ ...f, [row.id]: { type: 'error', msg: 'Enter a valid non-negative integer.' } }));
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/fine-settings/${row.violation_type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Update failed'); }
      const updated = await res.json();
      setSettings(prev => prev.map(s => s.id === updated.id ? updated : s));
      setEditingId(null);
      setFeedback(f => ({ ...f, [row.id]: { type: 'success', msg: `Updated to ₹${updated.amount}` } }));
      setTimeout(() => setFeedback(f => { const n = { ...f }; delete n[row.id]; return n; }), 3000);
    } catch (e) {
      setFeedback(f => ({ ...f, [row.id]: { type: 'error', msg: e.message } }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 860, margin: '0 auto' }}>
      {showAdd && (
        <AddFineModal
          onClose={() => setShowAdd(false)}
          onAdded={row => setSettings(prev => [...prev, row])}
          existingTypes={settings.map(s => s.violation_type)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-bright)' }}>
            ⚙️ Fine Settings
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Configure fine amounts per violation type. Changes take effect on the next challan generated.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: '9px 20px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
          }}
        >
          ➕ Add Fine Type
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Loading settings…</div>
      ) : (
        <>
          {settings.length === 0 && (
            <SeedBanner onSeed={handleSeed} seeding={seeding} />
          )}

          {settings.length > 0 && (
            <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr 140px', padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <span>Violation Type</span>
                <span>Legal Section</span>
                <span>Fine Amount (₹)</span>
                <span></span>
              </div>

              {settings.map((row, idx) => {
                const isEditing = editingId === row.id;
                const fb = feedback[row.id];
                return (
                  <div
                    key={row.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.6fr 1fr 140px',
                      alignItems: 'center',
                      padding: '16px 20px',
                      borderBottom: idx < settings.length - 1 ? '1px solid var(--border-color)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Violation Type */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.4rem' }}>{VIOLATION_ICONS[row.violation_type] || '⚠️'}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: '0.9rem' }}>
                          {row.violation_type.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.description}</div>
                      </div>
                    </div>

                    {/* Legal Section */}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {row.section}
                    </div>

                    {/* Fine Amount */}
                    <div>
                      {isEditing ? (
                        <input
                          type="number" min="0"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(row); if (e.key === 'Escape') cancelEdit(); }}
                          style={{
                            width: 100, padding: '6px 10px', borderRadius: 6,
                            border: '1px solid var(--accent-blue, #3b82f6)',
                            background: 'var(--input-bg, #1e293b)',
                            color: 'var(--text-bright)', fontSize: '0.95rem', outline: 'none',
                          }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-bright)', fontFamily: 'monospace' }}>
                          ₹{row.amount.toLocaleString('en-IN')}
                        </span>
                      )}
                      {fb && (
                        <div style={{ fontSize: '0.72rem', marginTop: 4, color: fb.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red, #ef4444)' }}>
                          {fb.msg}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(row)} disabled={saving}
                            style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: 'var(--accent-green)', color: '#fff', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
                          >Save</button>
                          <button
                            onClick={cancelEdit}
                            style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}
                          >Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(row)} className="btn btn-ghost btn-sm">✏️ Edit</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <p style={{ marginTop: 16, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
        Fine amounts are governed by the Motor Vehicles Act, 1988 (as amended). Adjust only on official instruction.
      </p>
    </div>
  );
}
