const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateChallanPDF = async (challan, violation) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            
            const pdfFilename = `challan_${challan.id}.pdf`;
            const dir = path.resolve(process.env.EVIDENCE_BASE_PATH || '../evidence');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            
            const pdfPath = path.resolve(dir, pdfFilename);
            
            doc.pipe(fs.createWriteStream(pdfPath));
            
            // Header
            doc.fontSize(20).text('Government of Maharashtra', { align: 'center' });
            doc.fontSize(14).text('RTO Traffic Violation Notice', { align: 'center' });
            doc.moveDown();
            
            // Section 1: Vehicle Details
            doc.fontSize(12).font('Helvetica-Bold').text('Section 1 - Vehicle Details');
            doc.font('Helvetica').text(`Vehicle Number: ${challan.vehicle_number}`);
            doc.text(`Owner Details: [TO BE FILLED BY RTO SERVER — INTEGRATION PENDING]`);
            doc.moveDown();

            // Section 2: Violation Details
            doc.font('Helvetica-Bold').text('Section 2 - Violation Details');
            doc.font('Helvetica').text(`Violation Type: ${challan.violation_type}`);
            doc.text(`Description: ${challan.violation_description}`);
            if (violation.speed_kmh) {
                doc.text(`Recorded Speed: ${violation.speed_kmh} km/h (Limit: ${violation.speed_limit_kmh} km/h)`);
            }
            doc.moveDown();

            // Section 3: Evidence
            doc.font('Helvetica-Bold').text('Section 3 - Evidence');
            doc.font('Helvetica').text(`Evidence saved to internal records: ${challan.evidence_thumbnail_path}`);
            doc.moveDown();

            // Section 4: Incident Details
            doc.font('Helvetica-Bold').text('Section 4 - Incident Details');
            doc.font('Helvetica').text(`Timestamp: ${challan.timestamp}`);
            doc.text(`Location: ${challan.location_name}`);
            doc.text(`Camera ID: ${challan.camera_id}`);
            doc.moveDown();

            // Section 5: Verification
            doc.font('Helvetica-Bold').text('Section 5 - Verification');
            doc.font('Helvetica').text(`Verified by Officer Badge: ${challan.officer_id}`);
            doc.text(`Generated At: ${challan.generated_at}`);
            
            doc.moveDown(2);
            doc.fontSize(10).text('This is a computer-generated document. For queries contact your nearest RTO office.', { align: 'center' });
            
            doc.end();
            
            resolve(pdfFilename);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateChallanPDF };
