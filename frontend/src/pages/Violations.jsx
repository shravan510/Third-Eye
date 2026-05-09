import React, { useState, useEffect, useRef } from 'react';

/* ─── Mock Data ──────────────────────────────────────────────── */
const mockViolations = [
  { id: 'V-8942', date: '2023-11-20 14:32', plate: 'MH-10-AB-1234', type: 'SPEEDING',      location: 'Vishrambagh Chowk, Sangli',  status: 'Pending',  speed: '67 km/h', evidenceImageUrl: null },
  { id: 'V-8941', date: '2023-11-20 14:15', plate: 'MH-10-CD-5678', type: 'HELMETLESS',    location: 'Vishrambagh Chowk, Sangli',  status: 'Verified', speed: null,       evidenceImageUrl: null },
  { id: 'V-8940', date: '2023-11-20 13:45', plate: 'MH-09-EF-9012', type: 'TRIPLE_RIDING', location: 'Pushparaj Chowk, Sangli',    status: 'Pending',  speed: null,       evidenceImageUrl: null },
  { id: 'V-8939', date: '2023-11-20 12:10', plate: 'MH-10-GH-3456', type: 'HELMETLESS',    location: 'Vishrambagh Market, Sangli', status: 'Verified', speed: null,       evidenceImageUrl: null },
  { id: 'V-8938', date: '2023-11-20 11:05', plate: 'MH-10-IJ-7890', type: 'SPEEDING',      location: 'Sangli–Miraj Road',          status: 'Verified', speed: '74 km/h',  evidenceImageUrl: null },
  { id: 'V-8937', date: '2023-11-19 18:22', plate: 'UNKNOWN',        type: 'HELMETLESS',    location: 'Vishrambagh Chowk, Sangli',  status: 'Pending',  speed: null,       evidenceImageUrl: null },
  { id: 'V-8936', date: '2023-11-19 16:45', plate: 'MH-10-KL-5555', type: 'TRIPLE_RIDING', location: 'Sangli–Miraj Road',          status: 'Pending',  speed: null,       evidenceImageUrl: null },
  { id: 'V-8935', date: '2023-11-19 14:10', plate: 'MH-09-MN-2233', type: 'SPEEDING',      location: 'Pushparaj Chowk, Sangli',    status: 'Verified', speed: '59 km/h',  evidenceImageUrl: null },
];

const TYPE_LABEL = {
  SPEEDING:      'Speeding',
  HELMETLESS:    'Helmetless',
  TRIPLE_RIDING: 'Triple Riding',
};

const TYPE_ICON = {
  SPEEDING:      '💨',
  HELMETLESS:    '⛑️',
  TRIPLE_RIDING: '🏍️',
};

const FILTERS = ['All', 'Pending', 'Verified', 'Rejected'];

/* ─── Toast Component ────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{t.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Evidence Image ─────────────────────────────────────────── */
function EvidenceImage({ url, plate, type }) {
  if (url) {
    return (
      <img
        src={url}
        alt={`Evidence for ${plate}`}
        className="review-evidence-img"
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
      />
    );
  }
  return (
    <div className="review-evidence-placeholder">
      <div className="evidence-cam-icon">📷</div>
      <div className="evidence-scanline" />
      <div className="evidence-plate-overlay">{plate}</div>
      <div className="evidence-label">CCTV · {TYPE_LABEL[type]} · No Image Captured</div>
    </div>
  );
}

/* ─── Review Modal ───────────────────────────────────────────── */
function ReviewModal({ violation, onClose, onVerify, onReject }) {
  const [notes, setNotes] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingReject, setLoadingReject] = useState(false);
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleVerify = async () => {
    setLoadingVerify(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`/api/violations/${violation.id}/verify`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        });
      } else {
        await new Promise(r => setTimeout(r, 800)); // simulate API
      }
      onVerify(violation.id, notes);
    } catch {
      await new Promise(r => setTimeout(r, 800));
      onVerify(violation.id, notes);
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleReject = async () => {
    setLoadingReject(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`/api/violations/${violation.id}/reject`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        });
      } else {
        await new Promise(r => setTimeout(r, 800));
      }
      onReject(violation.id, notes);
    } catch {
      await new Promise(r => setTimeout(r, 800));
      onReject(violation.id, notes);
    } finally {
      setLoadingReject(false);
    }
  };

  const isLoading = loadingVerify || loadingReject;
  const isPending = violation.status === 'Pending';

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label={`Reviewing ${violation.id}`}>

        {/* Status Bar */}
        <div className="modal-status-bar">
          <span className="modal-status-dot" />
          <span className="modal-status-text">
            Reviewing <strong>{violation.id}</strong> · {isPending ? 'Pending Officer Decision' : `Already ${violation.status}`}
          </span>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {/* Evidence Image */}
        <div className="modal-evidence-wrap">
          <EvidenceImage url={violation.evidenceImageUrl} plate={violation.plate} type={violation.type} />
        </div>

        {/* Details Grid */}
        <div className="modal-details-grid">

          <div className="modal-detail-item">
            <span className="meta-label">Violation ID</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{violation.id}</span>
          </div>

          <div className="modal-detail-item">
            <span className="meta-label">Date &amp; Time</span>
            <span className="meta-value" style={{ fontSize: '0.88rem' }}>{violation.date}</span>
          </div>

          <div className="modal-detail-item">
            <span className="meta-label">Plate Number</span>
            <span className="plate-chip">{violation.plate}</span>
          </div>

          <div className="modal-detail-item">
            <span className="meta-label">Violation Type</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: '1.1rem' }}>{TYPE_ICON[violation.type]}</span>
              <span className={`badge ${violation.type.toLowerCase()}`}>{TYPE_LABEL[violation.type]}</span>
            </span>
          </div>

          <div className="modal-detail-item" style={{ gridColumn: '1 / -1' }}>
            <span className="meta-label">Location</span>
            <span className="meta-value" style={{ fontSize: '0.88rem' }}>📍 {violation.location}</span>
          </div>

          {violation.speed && (
            <div className="modal-detail-item">
              <span className="meta-label">Recorded Speed</span>
              <span style={{ color: '#FCA5A5', fontWeight: 700, fontSize: '1rem' }}>{violation.speed}</span>
            </div>
          )}

          <div className="modal-detail-item">
            <span className="meta-label">Current Status</span>
            <span className={`status-dot ${violation.status.toLowerCase()}`}>{violation.status}</span>
          </div>

        </div>

        {/* Officer Notes */}
        <div className="modal-notes-wrap">
          <label className="meta-label" htmlFor="officer-notes" style={{ display: 'block', marginBottom: 8 }}>
            Officer Notes
          </label>
          <textarea
            id="officer-notes"
            className="officer-notes-textarea"
            placeholder="Add remarks, observations, or justification for your decision…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button
            id="btn-reject-violation"
            className="btn btn-danger-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleReject}
            disabled={isLoading}
          >
            {loadingReject ? (
              <><span className="spinner" /> Rejecting…</>
            ) : (
              <>❌ Reject Violation</>
            )}
          </button>
          <button
            id="btn-verify-challan"
            className="btn btn-verify"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleVerify}
            disabled={isLoading}
          >
            {loadingVerify ? (
              <><span className="spinner" /> Issuing…</>
            ) : (
              <>✅ Verify &amp; Issue Challan</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function Violations() {
  const [violations, setViolations] = useState(mockViolations);
  const [filter, setFilter]         = useState('All');
  const [search, setSearch]         = useState('');
  const [reviewing, setReviewing]   = useState(null); // violation object or null
  const [toasts, setToasts]         = useState([]);

  /* Toast helper */
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  /* Verify handler */
  const handleVerify = (id) => {
    setViolations(prev =>
      prev.map(v => v.id === id ? { ...v, status: 'Verified' } : v)
    );
    setReviewing(null);
    showToast(`${id} verified — Challan issued successfully.`, 'success');
  };

  /* Reject handler */
  const handleReject = (id) => {
    setViolations(prev =>
      prev.map(v => v.id === id ? { ...v, status: 'Rejected' } : v)
    );
    setReviewing(null);
    showToast(`${id} rejected — Violation dismissed.`, 'warning');
  };

  const displayed = violations.filter(v => {
    const matchFilter = filter === 'All' || v.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || v.plate.toLowerCase().includes(q)
      || v.location.toLowerCase().includes(q)
      || TYPE_LABEL[v.type]?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div className="page-wrapper">

      <Toast toasts={toasts} />

      {reviewing && (
        <ReviewModal
          violation={reviewing}
          onClose={() => setReviewing(null)}
          onVerify={handleVerify}
          onReject={handleReject}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Violations Log</h1>
            <p>AI-detected traffic violations from Sangli CCTV network · {violations.length} records</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>🔍</span>
              <input
                type="text"
                placeholder="Search plate, location…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  paddingLeft: 32, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 9,
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: 220,
                }}
              />
            </div>
            {/* Filters */}
            <div className="filter-group">
              {FILTERS.map(f => (
                <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f}
                  {f !== 'All' && (
                    <span style={{ marginLeft: 5, fontSize: '0.75rem', opacity: 0.7 }}>
                      ({violations.filter(v => v.status === f).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',    val: violations.length,                                      color: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)',  text: '#93C5FD' },
          { label: 'Pending',  val: violations.filter(v => v.status === 'Pending').length,  color: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  text: '#FCD34D' },
          { label: 'Verified', val: violations.filter(v => v.status === 'Verified').length, color: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  text: '#6EE7B7' },
          { label: 'Rejected', val: violations.filter(v => v.status === 'Rejected').length, color: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.3)',   text: '#FCA5A5' },
        ].map(({ label, val, color, border, text }) => (
          <div key={label} style={{ padding: '10px 20px', background: color, border: `1px solid ${border}`, borderRadius: 10, color: text, fontWeight: 700, fontSize: '0.9rem', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '1.3rem' }}>{val}</span>
            <span style={{ fontWeight: 400, fontSize: '0.8rem', opacity: 0.8 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date &amp; Time</th>
              <th>Plate</th>
              <th>Type</th>
              <th>Location</th>
              <th>Speed</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px' }}>
                  No violations match your filters.
                </td>
              </tr>
            ) : displayed.map(v => (
              <tr key={v.id}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{v.id}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{v.date}</td>
                <td>
                  <span className="plate-chip">{v.plate}</span>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: '1.1rem' }}>{TYPE_ICON[v.type]}</span>
                    <span className={`badge ${v.type.toLowerCase()}`}>{TYPE_LABEL[v.type]}</span>
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', maxWidth: 200 }}>{v.location}</td>
                <td style={{ fontSize: '0.85rem', color: v.speed ? '#FCA5A5' : 'var(--text-muted)' }}>
                  {v.speed || '—'}
                </td>
                <td>
                  <span className={`status-dot ${v.status.toLowerCase()}`}>{v.status}</span>
                </td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setReviewing(v)}
                    id={`btn-review-${v.id}`}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
