import React, { useState } from 'react';

const mockViolations = [
  { id: 'V-8942', date: '2023-11-20 14:32', plate: 'MH-10-AB-1234', type: 'SPEEDING',      location: 'Vishrambagh Chowk, Sangli',  status: 'Pending',  speed: '67 km/h' },
  { id: 'V-8941', date: '2023-11-20 14:15', plate: 'MH-10-CD-5678', type: 'HELMETLESS',    location: 'Vishrambagh Chowk, Sangli',  status: 'Verified', speed: null },
  { id: 'V-8940', date: '2023-11-20 13:45', plate: 'MH-09-EF-9012', type: 'TRIPLE_RIDING', location: 'Pushparaj Chowk, Sangli',    status: 'Pending',  speed: null },
  { id: 'V-8939', date: '2023-11-20 12:10', plate: 'MH-10-GH-3456', type: 'HELMETLESS',    location: 'Vishrambagh Market, Sangli', status: 'Verified', speed: null },
  { id: 'V-8938', date: '2023-11-20 11:05', plate: 'MH-10-IJ-7890', type: 'SPEEDING',      location: 'Sangli–Miraj Road',          status: 'Verified', speed: '74 km/h' },
  { id: 'V-8937', date: '2023-11-19 18:22', plate: 'UNKNOWN',        type: 'HELMETLESS',    location: 'Vishrambagh Chowk, Sangli',  status: 'Pending',  speed: null },
  { id: 'V-8936', date: '2023-11-19 16:45', plate: 'MH-10-KL-5555', type: 'TRIPLE_RIDING', location: 'Sangli–Miraj Road',          status: 'Pending',  speed: null },
  { id: 'V-8935', date: '2023-11-19 14:10', plate: 'MH-09-MN-2233', type: 'SPEEDING',      location: 'Pushparaj Chowk, Sangli',    status: 'Verified', speed: '59 km/h' },
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

const FILTERS = ['All', 'Pending', 'Verified'];

export default function Violations() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const displayed = mockViolations.filter(v => {
    const matchFilter = filter === 'All' || v.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || v.plate.toLowerCase().includes(q) || v.location.toLowerCase().includes(q) || TYPE_LABEL[v.type]?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div className="page-wrapper">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Violations Log</h1>
            <p>AI-detected traffic violations from Sangli CCTV network · {mockViolations.length} records</p>
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
                      ({mockViolations.filter(v => v.status === f).length})
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
          { label: 'Total', val: mockViolations.length, color: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#93C5FD' },
          { label: 'Pending',  val: mockViolations.filter(v => v.status === 'Pending').length,  color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#FCD34D' },
          { label: 'Verified', val: mockViolations.filter(v => v.status === 'Verified').length, color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)',  text: '#6EE7B7' },
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
              <th>Date & Time</th>
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
                  <button className="btn btn-ghost btn-sm">Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
