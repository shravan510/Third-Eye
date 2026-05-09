const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const FineSetting = require('../models/postgres/FineSetting');

const generateChallanPDF = async (challan, violation) => {
    // Resolve fine amount from DB
    let fineAmount = 0;
    let legalSection = '';
    let fineDescription = '';
    try {
        const setting = await FineSetting.findOne({
            where: { violation_type: (challan.violation_type || '').toUpperCase() },
        });
        if (setting) {
            fineAmount = setting.amount;
            legalSection = setting.section;
            fineDescription = setting.description;
        }
    } catch (_) {
        // Non-fatal: proceed with zero amount if DB unavailable
    }

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });

            // Build output path: ../evidence/<camera_id>/<date>/challan_<id>.pdf
            const dateStr = new Date().toISOString().slice(0, 10);
            const evidenceBase = path.resolve(process.env.EVIDENCE_BASE_PATH || '../evidence');
            const dir = path.join(evidenceBase, challan.camera_id || 'UNKNOWN', dateStr);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const pdfFilename = `challan_${challan.id}.pdf`;
            const pdfPath = path.join(dir, pdfFilename);

            doc.pipe(fs.createWriteStream(pdfPath));

            // ── Header ───────────────────────────────────────────────────────────
            doc.fontSize(20).text('Government of Maharashtra', { align: 'center' });
            doc.fontSize(14).text('RTO Traffic Violation Notice', { align: 'center' });
            doc.moveDown();

            // ── Challan ID ───────────────────────────────────────────────────────
            doc.fontSize(10).font('Helvetica').fillColor('grey')
               .text(`Challan ID: ${challan.id}`, { align: 'right' });
            doc.fillColor('black').moveDown(0.5);

            // ── Section 1: Vehicle ────────────────────────────────────────────────
            doc.fontSize(12).font('Helvetica-Bold').text('Section 1 — Vehicle Details');
            doc.font('Helvetica')
               .text(`Vehicle Number: ${challan.vehicle_number || 'UNKNOWN'}`)
               .text('Owner Details: [To be filled by RTO — integration pending]');
            doc.moveDown();

            // ── Section 2: Violation ──────────────────────────────────────────────
            doc.font('Helvetica-Bold').text('Section 2 — Violation Details');
            doc.font('Helvetica')
               .text(`Violation Type: ${challan.violation_type}`)
               .text(`Description: ${fineDescription || challan.violation_description || 'Automated detection'}`)
               .text(`Legal Section: ${legalSection}`);
            if (violation && violation.speed_kmh) {
                doc.text(`Recorded Speed: ${violation.speed_kmh} km/h (Limit: ${violation.speed_limit_kmh} km/h)`);
            }
            doc.moveDown();

            // ── Section 3: Fine ───────────────────────────────────────────────────
            doc.font('Helvetica-Bold').text('Section 3 — Fine Amount');
            doc.font('Helvetica')
               .fontSize(16).fillColor('#c0392b')
               .text(`Fine: ₹${fineAmount}`, { align: 'center' })
               .fillColor('black').fontSize(12);
            doc.moveDown();

            // ── Section 4: Evidence ───────────────────────────────────────────────
            doc.font('Helvetica-Bold').text('Section 4 — Evidence');
            doc.font('Helvetica')
               .text(`Evidence saved to internal records: ${challan.evidence_thumbnail_path || 'N/A'}`);
            doc.moveDown();

            // ── Section 5: Incident Details ───────────────────────────────────────
            doc.font('Helvetica-Bold').text('Section 5 — Incident Details');
            doc.font('Helvetica')
               .text(`Date / Time: ${challan.timestamp || new Date().toISOString()}`)
               .text(`Location: ${challan.location_name || 'Unknown'}`)
               .text(`Camera ID: ${challan.camera_id || 'Unknown'}`);
            doc.moveDown();

            // ── Section 6: Verification ───────────────────────────────────────────
            doc.font('Helvetica-Bold').text('Section 6 — Verification');
            doc.font('Helvetica')
               .text(`Verified by Officer Badge: ${challan.officer_id || 'N/A'}`)
               .text(`Generated At: ${challan.generated_at || new Date().toISOString()}`);

            doc.moveDown(2);
            doc.fontSize(10)
               .text('This is a computer-generated document. For queries contact your nearest RTO office.', { align: 'center' });

            doc.end();

            // Return relative path so it can be served via /evidence/...
            const relativePath = path.join(challan.camera_id || 'UNKNOWN', dateStr, pdfFilename);
            resolve(relativePath);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateChallanPDF };
