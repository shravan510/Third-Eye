import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

const FINE_MAP = {
  'Helmetless':     500,
  'Triple Riding':  1500,
  'Speeding':       2000,
};

const SECTION_CODE = {
  'Helmetless':     'Sec 129 MV Act, 1988',
  'Triple Riding':  'Sec 128 MV Act, 1988',
  'Speeding':       'Sec 183 MV Act, 1988',
};

const TYPE_ICON = {
  'Helmetless':     '⛑️',
  'Triple Riding':  '🏍️',
  'Speeding':       '💨',
};

const mockChallans = [
  { id: 'CH-2023-0901', name: 'Rahul Patil',    plate: 'MH-10-CD-5678', violation: 'Helmetless',    location: 'Vishrambagh Chowk, Sangli',  camera: 'CAM_001', date: '20/11/2023', time: '14:32:00', officer: 'RTO-OFF-12', badge: 'MH-SNL-044', speed: null },
  { id: 'CH-2023-0900', name: 'Sneha Kulkarni', plate: 'MH-10-GH-3456', violation: 'Triple Riding', location: 'Vishrambagh Chowk, Sangli',  camera: 'CAM_001', date: '20/11/2023', time: '14:15:00', officer: 'RTO-OFF-12', badge: 'MH-SNL-044', speed: null },
  { id: 'CH-2023-0899', name: 'Amit Desai',     plate: 'MH-10-IJ-7890', violation: 'Speeding',      location: 'Sangli–Miraj Road',          camera: 'CAM_001', date: '20/11/2023', time: '13:45:22', officer: 'RTO-OFF-08', badge: 'MH-SNL-031', speed: '67 km/h (Limit: 40 km/h)' },
  { id: 'CH-2023-0898', name: 'Priya Joshi',    plate: 'MH-09-AB-1111', violation: 'Triple Riding', location: 'Pushparaj Chowk, Sangli',    camera: 'CAM_001', date: '19/11/2023', time: '12:10:05', officer: 'RTO-OFF-12', badge: 'MH-SNL-044', speed: null },
  { id: 'CH-2023-0897', name: 'Vishal More',    plate: 'MH-10-XY-9999', violation: 'Helmetless',    location: 'Vishrambagh Market, Sangli', camera: 'CAM_001', date: '18/11/2023', time: '11:05:40', officer: 'RTO-OFF-04', badge: 'MH-SNL-019', speed: null },
  { id: 'CH-2023-0896', name: 'Rohan Shinde',   plate: 'MH-10-KL-5555', violation: 'Speeding',      location: 'Sangli–Miraj Road',          camera: 'CAM_001', date: '18/11/2023', time: '09:55:10', officer: 'RTO-OFF-08', badge: 'MH-SNL-031', speed: '74 km/h (Limit: 40 km/h)' },
];

/* ── PDF Generation ─────────────────────────────────────────── */
const drawLine = (doc, y, x1 = 25, x2 = 585) => {
  doc.setDrawColor(60, 60, 80);
  doc.setLineWidth(0.3);
  doc.line(x1, y, x2, y);
};

const field = (doc, label, value, x, y, labelW = 90) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(130, 130, 150);
  doc.text(label.toUpperCase() + ':', x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 50);
  doc.text(String(value ?? '—'), x + labelW, y);
};

const generatePDF = (c) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595, M = 28;

  // ── Dark header band ──────────────────────────────────────────
  doc.setFillColor(15, 20, 50);
  doc.rect(0, 0, W, 70, 'F');

  // Ashoka chakra placeholder circle
  doc.setFillColor(30, 40, 80);
  doc.circle(52, 35, 22, 'F');
  doc.setFillColor(230, 170, 20);
  doc.circle(52, 35, 14, 'S');
  doc.setFontSize(18);
  doc.setTextColor(230, 170, 20);
  doc.text('☸', 44, 41);

  // Title in header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('GOVERNMENT OF MAHARASHTRA', W / 2, 26, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(180, 200, 255);
  doc.text('Regional Transport Office — Sangli District  |  Motor Vehicles Act, 1988', W / 2, 44, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(120, 150, 220);
  doc.text('RTO Sangli, District Sangli, Maharashtra — 416 416  |  www.mahatraffic.maharashtra.gov.in', W / 2, 60, { align: 'center' });

  // ── Challan banner ────────────────────────────────────────────
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 70, W, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(255, 255, 255);
  doc.text('E-CHALLAN — MOTOR VEHICLE TRAFFIC VIOLATION NOTICE', W / 2, 87, { align: 'center' });

  // ── Meta strip ────────────────────────────────────────────────
  doc.setFillColor(240, 242, 250);
  doc.rect(0, 94, W, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 90);
  doc.text(`Challan No: ${c.id}`, M, 110);
  doc.text(`Date: ${c.date}   Time: ${c.time}`, W / 2, 110, { align: 'center' });
  doc.text(`Issued Under: ${SECTION_CODE[c.violation] || 'MV Act, 1988'}`, W - M, 110, { align: 'right' });

  // ── SECTION 1 ─────────────────────────────────────────────────
  let y = 142;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setFillColor(220, 225, 245);
  doc.rect(M, y - 11, W - 2 * M, 16, 'F');
  doc.setTextColor(30, 30, 70);
  doc.text('SECTION 1  —  VEHICLE & OWNER DETAILS', M + 6, y);
  y += 16;

  field(doc, 'Owner Name',  c.name,         M,     y, 80);
  field(doc, 'Vehicle No.', c.plate,        320,   y, 70);
  y += 16;
  field(doc, 'Vehicle Type','Two Wheeler',  M,     y, 80);
  field(doc, 'State',       'Maharashtra',  320,   y, 70);
  y += 16;
  field(doc, 'Reg. Auth.', 'RTO Sangli',    M,     y, 80);
  field(doc, 'District',   'Sangli',        320,   y, 70);
  y += 10; drawLine(doc, y);

  // ── SECTION 2 ─────────────────────────────────────────────────
  y += 14;
  doc.setFillColor(220, 225, 245);
  doc.rect(M, y - 11, W - 2 * M, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 70);
  doc.text('SECTION 2  —  VIOLATION DETAILS', M + 6, y);
  y += 16;

  field(doc, 'Violation',   c.violation,    M,   y, 80);
  field(doc, 'Statute',     SECTION_CODE[c.violation] || '—', 320, y, 70);
  y += 16;
  field(doc, 'Location',    c.location,     M,   y, 80);
  y += 16;
  if (c.speed) {
    field(doc, 'Recorded Speed', c.speed,   M,   y, 80);
    y += 16;
  }
  field(doc, 'Camera',      c.camera,       M,   y, 80);
  field(doc, 'Timestamp',   `${c.date} ${c.time}`, 320, y, 70);
  y += 14;
  field(doc, 'Detection',   'Automated AI (Third Eye Traffic System v1.0 — YOLO + ByteTrack)', M, y, 80);
  y += 10; drawLine(doc, y);

  // ── SECTION 3: Fine ───────────────────────────────────────────
  y += 14;
  doc.setFillColor(220, 225, 245);
  doc.rect(M, y - 11, W - 2 * M, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 70);
  doc.text('SECTION 3  —  FINE & PENALTY', M + 6, y);
  y += 18;

  const fine = FINE_MAP[c.violation] ?? 0;
  doc.setFillColor(255, 245, 245);
  doc.setDrawColor(180, 30, 30);
  doc.setLineWidth(0.6);
  doc.rect(M, y - 13, W - 2 * M, 38, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(140, 20, 20);
  doc.text(`Violation: ${c.violation}`, M + 10, y);

  doc.setFontSize(16);
  doc.text(`Rs. ${fine}/-`, W - M - 10, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 50, 50);
  doc.text(`(${SECTION_CODE[c.violation]} — Compoundable Offence)`, M + 10, y + 16);
  doc.text('Pay within 60 days from date of notice.', W - M - 10, y + 16, { align: 'right' });

  y += 46;
  field(doc, 'Online Payment', 'mahatraffic.maharashtra.gov.in  |  UPI: rto.mahatraffic@sbi', M, y, 100);
  y += 10; drawLine(doc, y);

  // ── SECTION 4: Officer ────────────────────────────────────────
  y += 14;
  doc.setFillColor(220, 225, 245);
  doc.rect(M, y - 11, W - 2 * M, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 70);
  doc.text('SECTION 4  —  ISSUING OFFICER DETAILS', M + 6, y);
  y += 16;

  field(doc, 'Officer ID',    c.officer,                    M,   y, 80);
  field(doc, 'Badge No.',     c.badge,                      320, y, 70);
  y += 16;
  field(doc, 'Department',    'Maharashtra Traffic Police', M,   y, 80);
  field(doc, 'Station',       'RTO Sangli, Dist. Sangli',   320, y, 70);
  y += 10; drawLine(doc, y);

  // ── SECTION 5: Digital Verification ──────────────────────────
  y += 14;
  doc.setFillColor(220, 225, 245);
  doc.rect(M, y - 11, W - 2 * M, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 70);
  doc.text('SECTION 5  —  DIGITAL VERIFICATION & INTEGRITY', M + 6, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 80);
  doc.text('This challan was cryptographically signed using HMAC-SHA256 under the IT Act, 2000. It is tamper-proof', M, y);
  y += 12;
  doc.text('and legally valid without a physical stamp. Verification: Third Eye Traffic AI System v1.0.', M, y);
  y += 12;
  field(doc, 'Verified By',  'AI Detection + Officer Review', M, y, 80);
  y += 10; drawLine(doc, y);

  // ── Appeals ───────────────────────────────────────────────────
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 80);
  doc.text('NOTICE OF APPEAL:', M, y);
  doc.setFont('helvetica', 'normal');
  y += 12;
  doc.setFontSize(8);
  doc.text('To contest this challan, appear before the RTO officer within 30 days with this challan, vehicle RC, and driving licence.', M, y);

  // ── Footer ────────────────────────────────────────────────────
  doc.setFillColor(15, 20, 50);
  doc.rect(0, 808, W, 35, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 150, 200);
  doc.text('Computer-generated electronic challan. Physical stamp not required.  |  Third Eye Traffic System © Govt. of Maharashtra, 2023', W / 2, 822, { align: 'center' });
  doc.setTextColor(100, 110, 170);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, W / 2, 834, { align: 'center' });

  return doc;
};

/* ── Card Component ─────────────────────────────────────────── */
function ChallanCard({ c }) {
  const fine = FINE_MAP[c.violation] ?? 0;
  const [generating, setGenerating] = useState(false);

  const handleAction = async (action) => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 300));
    const doc = generatePDF(c);
    if (action === 'open') {
      window.open(doc.output('bloburl'), '_blank');
    } else {
      doc.save(`Challan_${c.id}.pdf`);
    }
    setGenerating(false);
  };

  return (
    <div className="challan-card">
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div className="challan-id">{c.id}</div>
          <h3 className="challan-name">{c.name}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontSize: '1.6rem' }}>{TYPE_ICON[c.violation]}</span>
          <span className={`badge ${c.violation.toLowerCase().replace(' ', '_')}`}>{c.violation}</span>
        </div>
      </div>

      {/* Meta grid */}
      <div className="challan-meta">
        <div className="meta-item">
          <span className="meta-label">Vehicle</span>
          <span className="plate-chip" style={{ fontSize: '0.8rem' }}>{c.plate}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Fine Amount</span>
          <span className="meta-value amount">₹{fine}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Location</span>
          <span className="meta-value" style={{ fontSize: '0.82rem' }}>{c.location}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Date & Time</span>
          <span className="meta-value" style={{ fontSize: '0.82rem' }}>{c.date} {c.time}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Officer</span>
          <span className="meta-value" style={{ fontSize: '0.82rem' }}>{c.officer}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Badge</span>
          <span className="meta-value" style={{ fontSize: '0.82rem' }}>{c.badge}</span>
        </div>
      </div>

      {/* Section chip */}
      <div style={{ marginBottom: 16, padding: '6px 12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 7, fontSize: '0.75rem', color: '#93C5FD' }}>
        ⚖️ {SECTION_CODE[c.violation]}
      </div>

      {/* Actions */}
      <div className="challan-actions">
        <button
          onClick={() => handleAction('open')}
          disabled={generating}
          className="btn btn-ghost"
          style={{ flex: 1, gap: 6 }}
        >
          {generating ? '⏳ Generating…' : '📄 Generate PDF'}
        </button>
        <button
          onClick={() => handleAction('download')}
          disabled={generating}
          className="btn btn-primary"
          style={{ flex: 1, gap: 6 }}
        >
          ⬇️ Download PDF
        </button>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function Challans() {
  const [search, setSearch] = useState('');

  const displayed = mockChallans.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.plate.toLowerCase().includes(q) || c.violation.toLowerCase().includes(q);
  });

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Issued Challans</h1>
            <p>Govt. of Maharashtra e-challans generated by the Third Eye AI system · {mockChallans.length} issued</p>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>🔍</span>
            <input
              type="text"
              placeholder="Search name, plate, type…"
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
                width: 240,
              }}
            />
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, padding: '14px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
        {[
          { icon: '📋', label: 'Total Challans',  val: mockChallans.length },
          { icon: '₹',  label: 'Total Fines',     val: `₹${mockChallans.reduce((s,c) => s + (FINE_MAP[c.violation]||0), 0).toLocaleString()}` },
          { icon: '💨', label: 'Speeding',         val: mockChallans.filter(c => c.violation === 'Speeding').length },
          { icon: '🏍️', label: 'Triple Riding',    val: mockChallans.filter(c => c.violation === 'Triple Riding').length },
        ].map(({ icon, label, val }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ fontSize: '1.4rem' }}>{icon}</span>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-bright)' }}>{val}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 600 }}>No challans match your search.</div>
        </div>
      ) : (
        <div className="challan-grid">
          {displayed.map(c => <ChallanCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}
