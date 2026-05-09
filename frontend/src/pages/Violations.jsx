import React, { useState, useEffect } from 'react';
import ReviewModal from '../components/ReviewModal';

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


/* ─── Main Page ──────────────────────────────────────────────── */
export default function Violations() {
  const [violations, setViolations] = useState([]);
  const [filter, setFilter]         = useState('All');
  const [search, setSearch]         = useState('');
  const [reviewing, setReviewing]   = useState(null);
  const [toasts, setToasts]         = useState([]);

  // Date / type filter state
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [fetching, setFetching]   = useState(false);

  const fetchViolations = (params = new URLSearchParams()) => {
    setFetching(true);
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/api/violations?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        setViolations(Array.isArray(data) ? data : []);
      })
      .catch(() => setViolations([]))
      .finally(() => setFetching(false));
  };

  // Load all violations on mount
  useEffect(() => { fetchViolations(); }, []);


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
    const vStatus = (v.status || 'PENDING').toUpperCase();
    const matchFilter = filter === 'All' || vStatus === filter.toUpperCase();
    const q = search.toLowerCase();
    const matchSearch = !q
      || (v.plate_number || v.plate || '').toLowerCase().includes(q)
      || (v.location_name || v.location || '').toLowerCase().includes(q)
      || TYPE_LABEL[v.violation_type || v.type]?.toLowerCase().includes(q);
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

      {/* ── Date / Type Filter Bar ───────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end',
        background: 'var(--panel-bg)', border: '1px solid var(--border-color)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 18,
      }}>
        {/* From date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>From</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            style={{
              padding: '7px 10px', borderRadius: 8, fontFamily: 'inherit', fontSize: '0.85rem',
              background: 'var(--panel-bg)', color: 'var(--text-bright)',
              border: '1px solid var(--border-color)', outline: 'none', colorScheme: 'dark',
            }}
          />
        </div>

        {/* To date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>To</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            style={{
              padding: '7px 10px', borderRadius: 8, fontFamily: 'inherit', fontSize: '0.85rem',
              background: 'var(--panel-bg)', color: 'var(--text-bright)',
              border: '1px solid var(--border-color)', outline: 'none', colorScheme: 'dark',
            }}
          />
        </div>

        {/* Violation type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Violation Type</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{
              padding: '7px 10px', borderRadius: 8, fontFamily: 'inherit', fontSize: '0.85rem',
              background: 'var(--panel-bg)', color: 'var(--text-bright)',
              border: '1px solid var(--border-color)', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="ALL">ALL</option>
            <option value="SPEEDING">SPEEDING</option>
            <option value="HELMETLESS">HELMETLESS</option>
            <option value="TRIPLE_RIDING">TRIPLE RIDING</option>
          </select>
        </div>

        {/* Apply */}
        <button
          className="btn btn-primary btn-sm"
          disabled={fetching}
          onClick={() => {
            const params = new URLSearchParams();
            if (fromDate) params.append('from', fromDate);
            if (toDate)   params.append('to', toDate);
            if (typeFilter !== 'ALL') params.append('violation_type', typeFilter);
            fetchViolations(params);
          }}
          style={{ alignSelf: 'flex-end', padding: '8px 20px' }}
        >
          {fetching ? '⏳ Loading…' : '🔍 Apply Filter'}
        </button>

        {/* Clear */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setFromDate(''); setToDate(''); setTypeFilter('ALL');
            fetchViolations();
          }}
          style={{ alignSelf: 'flex-end', padding: '8px 16px' }}
        >
          ✕ Clear
        </button>

        {/* Result count */}
        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Showing <strong style={{ color: 'var(--text-bright)' }}>{violations.length}</strong> violation{violations.length !== 1 ? 's' : ''}
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
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                  {v.created_at ? new Date(v.created_at).toLocaleString('en-IN') : (v.date || '—')}
                </td>
                <td>
                  <span className="plate-chip">{v.plate_number || v.plate || 'UNKNOWN'}</span>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: '1.1rem' }}>{TYPE_ICON[v.violation_type || v.type]}</span>
                    <span className={`badge ${(v.violation_type || v.type || '').toLowerCase()}`}>{TYPE_LABEL[v.violation_type || v.type] || v.violation_type || v.type}</span>
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', maxWidth: 200 }}>{v.location_name || v.location || '—'}</td>
                <td style={{ fontSize: '0.85rem', color: (v.speed_kmh || v.speed) ? '#FCA5A5' : 'var(--text-muted)' }}>
                  {v.speed_kmh ? `${v.speed_kmh} km/h` : (v.speed || '—')}
                </td>
                <td>
                  <span className={`status-dot ${(v.status || 'pending').toLowerCase()}`}>{v.status || 'PENDING'}</span>
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
