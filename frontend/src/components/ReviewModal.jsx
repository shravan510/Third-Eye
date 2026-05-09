import React, { useState, useEffect, useRef } from 'react';

/* ─── Helpers ─────────────────────────────────────────────────── */
const TYPE_LABEL  = { SPEEDING: 'Speeding', HELMETLESS: 'Helmetless', TRIPLE_RIDING: 'Triple Riding' };
const TYPE_ICON   = { SPEEDING: '💨', HELMETLESS: '⛑️', TRIPLE_RIDING: '🏍️' };
const TYPE_COLOR  = { SPEEDING: '#ef4444', HELMETLESS: '#f97316', TRIPLE_RIDING: '#a855f7' };
const TYPE_BG     = { SPEEDING: 'rgba(239,68,68,0.12)', HELMETLESS: 'rgba(249,115,22,0.12)', TRIPLE_RIDING: 'rgba(168,85,247,0.12)' };

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function buildEvidenceUrl(v) {
  // Prefer evidence_path if it is already a full relative path
  if (!v) return null;
  const base = 'http://localhost:3000/evidence';
  // The AI engine stores filenames; the backend serves them under /evidence/<camera_id>/<date>/<file>
  if (v.evidence_path && v.evidence_path.startsWith('/')) {
    return `http://localhost:3000${v.evidence_path}`;
  }
  const dateStr = v.created_at ? new Date(v.created_at).toISOString().slice(0, 10) : '';
  const camId   = v.camera_id || 'UNKNOWN';
  if (v.evidence_path) return `${base}/${camId}/${dateStr}/${v.evidence_path}`;
  return null;
}

/* ─── Evidence Panel ──────────────────────────────────────────── */
function EvidencePanel({ violation }) {
  const url = buildEvidenceUrl(violation);
  const isVideo = url && (url.endsWith('.mp4') || url.endsWith('.avi') || url.endsWith('.webm'));

  if (isVideo) {
    return (
      <video
        src={url}
        controls autoPlay muted loop
        style={{ width: '100%', maxHeight: 280, borderRadius: 10, background: '#000', objectFit: 'contain' }}
      />
    );
  }
  if (url) {
    return (
      <img
        src={url}
        alt="Evidence"
        style={{ width: '100%', maxHeight: 280, borderRadius: 10, objectFit: 'contain', background: '#000' }}
        onError={e => { e.target.style.display = 'none'; }}
      />
    );
  }
  return (
    <div style={{
      width: '100%', height: 200, borderRadius: 10,
      background: 'rgba(255,255,255,0.03)',
      border: '1px dashed var(--border-color)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 8, color: 'var(--text-muted)',
    }}>
      <span style={{ fontSize: '2.5rem' }}>📷</span>
      <span style={{ fontSize: '0.85rem' }}>No evidence recorded</span>
    </div>
  );
}

/* ─── Detail Row ──────────────────────────────────────────────── */
function DetailRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-bright)', fontWeight: 500 }}>{children}</span>
    </div>
  );
}

/* ─── ReviewModal ─────────────────────────────────────────────── */
export default function ReviewModal({ violation, onClose, onVerify, onReject }) {
  const [fineInfo, setFineInfo]         = useState(null);
  const [challan, setChallan]           = useState(null);
  const [generatingChallan, setGenerating] = useState(false);
  const [challanDone, setChallanDone]   = useState(false);
  const [actionDone, setActionDone]     = useState(null);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingReject, setLoadingReject] = useState(false);
  const [editingFine, setEditingFine]   = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const overlayRef = useRef(null);

  const vtype   = (violation.violation_type || violation.type || '').toUpperCase();
  const plate   = violation.plate_number   || violation.plate   || 'UNKNOWN';
  const speed   = violation.speed_kmh      || violation.speed   || null;
  const location = violation.location_name || violation.location || '—';
  const camId   = violation.camera_id     || '—';
  const createdAt = violation.created_at  || null;
  const statusRaw = (violation.status || 'PENDING').toUpperCase();
  const isPending = statusRaw === 'PENDING';

  useEffect(() => {
    fetch('http://localhost:3000/api/fine-settings')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const match = data.find(s => s.violation_type === vtype);
          setFineInfo(match || null);
          if (match) setCustomAmount(String(match.amount));
        }
      })
      .catch(() => {});
  }, [vtype]);

  // ESC to close
  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOverlayClick = e => { if (e.target === overlayRef.current) onClose(); };

  const handleGenerateChallan = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const body = {};
      const parsed = parseInt(customAmount, 10);
      if (!isNaN(parsed) && parsed >= 0 && fineInfo && parsed !== fineInfo.amount) {
        body.custom_amount = parsed;
      }
      const res = await fetch(`http://localhost:3000/api/challans/generate/${violation.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Challan generation failed');
      setChallan({ challan_id: data.challan_id, pdf_url: data.pdf_url });
      setChallanDone(true);
    } catch (e) {
      alert(`Challan Error: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // ── Verify ────────────────────────────────────────────────────
  const handleVerify = async () => {
    setLoadingVerify(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/violations/${violation.id}/verify`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      setActionDone('verified');
      if (onVerify) onVerify(violation.id);
      setTimeout(onClose, 1500);
    } catch (e) {
      alert(`Verify error: ${e.message}`);
    } finally {
      setLoadingVerify(false);
    }
  };

  // ── Reject ────────────────────────────────────────────────────
  const handleReject = async () => {
    setLoadingReject(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/violations/${violation.id}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      setActionDone('rejected');
      if (onReject) onReject(violation.id);
      setTimeout(onClose, 1500);
    } catch (e) {
      alert(`Reject error: ${e.message}`);
    } finally {
      setLoadingReject(false);
    }
  };

  const accentColor = TYPE_COLOR[vtype] || '#94a3b8';
  const accentBg    = TYPE_BG[vtype]   || 'rgba(148,163,184,0.1)';

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'rm-fadein 0.2s ease',
      }}
    >
      <style>{`
        @keyframes rm-fadein { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 680px) { .rm-body { flex-direction: column !important; } }
      `}</style>

      <div style={{
        width: '100%', maxWidth: 860,
        background: 'var(--panel-bg, #0f172a)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: `linear-gradient(to right, ${accentBg}, transparent)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.6rem' }}>{TYPE_ICON[vtype] || '⚠️'}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  background: accentBg, color: accentColor,
                  border: `1px solid ${accentColor}44`,
                }}>
                  {TYPE_LABEL[vtype] || vtype}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {challanDone && challan?.challan_id ? `Challan #${challan.challan_id.slice(0,8)}` : 'Pending'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Violation ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{violation.id}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
              borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)',
              fontSize: '1rem', flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* ── Body (scrollable) ──────────────────────────────── */}
        <div className="rm-body" style={{ display: 'flex', gap: 0, overflowY: 'auto', flex: 1 }}>

          {/* Left: Evidence */}
          <div style={{
            flex: '0 0 55%', padding: '20px',
            borderRight: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Evidence</div>
            <EvidencePanel violation={violation} />
          </div>

          {/* Right: Details + Actions */}
          <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Detail card */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              borderRadius: 10, padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px',
            }}>
              <DetailRow label="Plate Number">
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-bright)', letterSpacing: 1 }}>{plate}</span>
              </DetailRow>
              <DetailRow label="Violation Type">
                <span style={{ color: accentColor, fontWeight: 600 }}>{TYPE_LABEL[vtype] || vtype}</span>
              </DetailRow>
              <DetailRow label="Speed">
                {vtype === 'SPEEDING' && speed
                  ? <span style={{ color: '#fca5a5', fontWeight: 700 }}>{speed} km/h</span>
                  : <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                }
              </DetailRow>
              <DetailRow label="Camera ID">
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{camId}</span>
              </DetailRow>
              <DetailRow label="Location">
                <span style={{ fontSize: '0.85rem' }}>📍 {location}</span>
              </DetailRow>
              <DetailRow label="Date & Time">
                <span style={{ fontSize: '0.82rem' }}>{fmtDate(createdAt)}</span>
              </DetailRow>
            </div>

            {/* Fine info */}
            {fineInfo && (
              <div style={{
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Fine Amount</div>
                    {editingFine ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span style={{ color: '#34d399', fontWeight: 700, fontSize: '1.2rem' }}>₹</span>
                        <input
                          type="number"
                          min="0"
                          value={customAmount}
                          onChange={e => setCustomAmount(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingFine(false); }}
                          autoFocus
                          style={{
                            width: 110, padding: '5px 9px', borderRadius: 6,
                            border: '1px solid #34d399',
                            background: 'rgba(16,185,129,0.1)', color: '#34d399',
                            fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => setEditingFine(false)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                        >✓ Set</button>
                        <button
                          onClick={() => { setCustomAmount(String(fineInfo.amount)); setEditingFine(false); }}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}
                        >Reset</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
                          ₹{parseInt(customAmount || fineInfo.amount, 10).toLocaleString('en-IN')}
                          {parseInt(customAmount, 10) !== fineInfo.amount && (
                            <span style={{ fontSize: '0.72rem', color: '#fbbf24', marginLeft: 8, fontFamily: 'inherit' }}>★ Custom</span>
                          )}
                        </div>
                        {isPending && !challanDone && (
                          <button
                            onClick={() => setEditingFine(true)}
                            style={{
                              padding: '3px 10px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600,
                              border: '1px solid rgba(16,185,129,0.35)', background: 'transparent',
                              color: '#34d399', cursor: 'pointer',
                            }}
                          >✏️ Edit</button>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Legal Section</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{fineInfo.section}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action done feedback */}
            {actionDone && (
              <div style={{
                padding: '12px 16px', borderRadius: 10, textAlign: 'center', fontWeight: 700,
                background: actionDone === 'verified' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: actionDone === 'verified' ? '#34d399' : '#f87171',
                border: `1px solid ${actionDone === 'verified' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                {actionDone === 'verified' ? '✅ Violation Verified — Closing…' : '❌ Violation Rejected — Closing…'}
              </div>
            )}

            {/* Challan success */}
            {challanDone && challan && (
              <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: '#93c5fd', fontWeight: 600, fontSize: '0.88rem' }}>✔ Challan Generated</span>
                <a
                  href={`http://localhost:3000${challan.pdf_url}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '6px 14px', borderRadius: 6, background: 'rgba(59,130,246,0.2)',
                    border: '1px solid rgba(59,130,246,0.4)', color: '#93c5fd',
                    textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
                  }}
                >
                  ⬇ Download PDF
                </a>
              </div>
            )}

            {/* Action Buttons */}
            {!actionDone && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                {/* Generate Challan */}
                {!challanDone ? (
                  <button
                    onClick={handleGenerateChallan}
                    disabled={generatingChallan || !isPending}
                    style={{
                      flex: '1 1 100%', padding: '10px 16px', borderRadius: 8, fontWeight: 700,
                      fontSize: '0.88rem', cursor: generatingChallan ? 'wait' : 'pointer',
                      background: 'rgba(59,130,246,0.15)', color: '#93c5fd',
                      border: '1px solid rgba(59,130,246,0.35)',
                      opacity: generatingChallan || !isPending ? 0.5 : 1,
                    }}
                  >
                    {generatingChallan ? '⏳ Generating…' : '📋 Generate Challan'}
                  </button>
                ) : null}

                {/* Verify */}
                <button
                  onClick={handleVerify}
                  disabled={loadingVerify || loadingReject || !isPending}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: 8, fontWeight: 700,
                    fontSize: '0.88rem', cursor: 'pointer',
                    background: 'rgba(16,185,129,0.15)', color: '#34d399',
                    border: '1px solid rgba(16,185,129,0.35)',
                    opacity: !isPending ? 0.4 : 1,
                  }}
                >
                  {loadingVerify ? '⏳ Verifying…' : '✅ Verify'}
                </button>

                {/* Reject */}
                <button
                  onClick={handleReject}
                  disabled={loadingVerify || loadingReject || !isPending}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: 8, fontWeight: 700,
                    fontSize: '0.88rem', cursor: 'pointer',
                    background: 'rgba(239,68,68,0.12)', color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.3)',
                    opacity: !isPending ? 0.4 : 1,
                  }}
                >
                  {loadingReject ? '⏳ Rejecting…' : '❌ Reject'}
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
