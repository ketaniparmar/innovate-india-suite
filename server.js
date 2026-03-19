require('dotenv').config();
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const PptxGenJS = require('pptxgenjs');
const ExcelJS = require('exceljs');
const archiver = require('archiver');
const { Resend } = require('resend');
const Razorpay = require('razorpay');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. SECURE CREDENTIALS (WITH SAFETY FALLBACKS) ---
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_123');
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// ============================================================================
// 2. LEAD ROUTING API
// ============================================================================
app.post('/api/admin/send-lead', async (req, res) => {
    const { action, client, beds } = req.body;
    try {
        await resend.emails.send({
            from: 'Innovate IndAI System <reports@hospitalprojectconsultancy.com>',
            to: 'director@hospitalprojectconsultancy.com',
            subject: `🔥 NEW PLATFORM LEAD: ${action} | ${client.name}`,
            html: `<div style="font-family: Arial, sans-serif; padding: 30px; background: #0A2540; color: white;">
                    <h2>New Lead Captured</h2>
                    <p><strong>Action:</strong> ${action}</p>
                    <p><strong>Name:</strong> ${client.name}</p>
                    <p><strong>Phone:</strong> ${client.phone}</p>
                    <p><strong>Beds:</strong> ${beds}</p>
                </div>`
        });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("[EMAIL ERROR]:", error);
        res.status(500).json({ success: false });
    }
});

// ============================================================================
// 3. RAZORPAY ORDER CREATOR
// ============================================================================
app.post('/api/admin/create-order', async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100,
            currency: "INR",
            receipt: "order_" + Math.random().toString(36).substring(7),
        };
        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: "Order failed" });
    }
});

// ============================================================================
// 4. CONSOLIDATED INTELLIGENCE ENGINE (RAM OPTIMIZED + BUFFERED)
// ============================================================================
app.post('/api/admin/generate-pdf', async (req, res) => {
    const { email, projectName, bedCount, totalArea, cityTier, plan = "", addons = [] } = req.body;
    
    try {
        console.log(`--- STARTING INTELLIGENCE BUILD: ${projectName} ---`);

        // --- A. CALCULATION ENGINE ---
        const beds = Math.max(1, Number(bedCount) || 100);
        const area = Math.max(1, Number(totalArea) || 85000);
        const occupancy = 0.65;
        const arpoB = beds > 150 ? 22000 : 15000;
        const cps = cityTier === 1 ? 4200 : 3500;
        const hardCost = area * cps;
        const totalCapex = (hardCost + (hardCost * 0.45)) * 1.15;
        const annualRev = (beds * occupancy * arpoB * 365) / 1.15; 
        const ebitda = annualRev * 0.32;
        const netProfit = ebitda - (annualRev * 0.08);
        const roi = (netProfit / totalCapex) * 100;
        const emi = ((totalCapex * 0.70) * 0.105) + ((totalCapex * 0.70) / 10); 
        const dscr = ebitda / emi;
        const fINR = (val) => `Rs. ${(val / 10000000).toFixed(2)} Cr`;

        // 🧠 AI Intelligence Logic
        let score = 0;
        if (occupancy >= 0.65) score += 20;
        if (roi > 18) score += 20;
        if (dscr > 1.3) score += 20;
        if ((area/beds) >= 900) score += 40; 

        const swot = {
            strengths: roi > 18 ? ["High ROI Potential", "NABH Spatial Compliance"] : ["Standard Industry Margins"],
            weaknesses: totalCapex > 500000000 ? ["High Initial Debt Burden"] : ["Standard Stabilization Period"],
            opportunities: ["Regional Specialty Gap", "High-Margin OT Integration"],
            threats: ["Local Competitor Expansion", "Regulatory Shifts"]
        };

        // --- B. GENERATE PDF BUFFER ---
        const browser = await puppeteer.launch({ 
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, // Auto-detects environment
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage', 
                '--single-process'
            ] 
        });
        
        let htmlContent = `
            <html>
            <style>
                body { font-family: Arial, sans-serif; color: #0A2540; padding: 40px; }
                .page { page-break-after: always; }
                .box { background: #f8fafc; border-left: 5px solid #0A2540; padding: 20px; margin: 20px 0; }
                .score-bar { background: #eee; height: 15px; width: 100%; border-radius: 10px; margin: 10px 0; overflow: hidden; }
                .score-fill { background: #D4AF37; height: 100%; width: ${score}%; }
            </style>
            <body>
                <div class="page">
                    <h1 style="color: #D4AF37; border-bottom: 2px solid;">INNOVATE INDAI</h1>
                    <p style="text-transform: uppercase; letter-spacing: 2px;">Investment Intelligence Report</p>
                    <h2>${projectName}</h2>
                    <div class="box">
                        <h3>Intelligence Score: ${score}/100</h3>
                        <div class="score-bar"><div class="score-fill"></div></div>
                        <p><strong>Estimated CAPEX:</strong> ${fINR(totalCapex)}</p>
                        <p><strong>Projected ROI:</strong> ${roi.toFixed(1)}%</p>
                        <p><strong>Scale:</strong> ${beds} Beds | ${area.toLocaleString()} Sqft</p>
                    </div>
                </div>
        `;

        // Advanced Pages for Paid Tiers
        if (!isFree) {
            htmlContent += `
                <div class="page">
                    <h3>Bank Loan Readiness</h3>
                    <p><strong>DSCR:</strong> ${dscr.toFixed(2)} (Target: > 1.30)</p>
                    <p><strong>Est. Annual EMI:</strong> ${fINR(emi)}</p>
                    <hr/>
                    <h3>Strategic SWOT</h3>
                    <p><strong>Strengths:</strong> ${swot.strengths.join(", ")}</p>
                    <p><strong>Weaknesses:</strong> ${swot.weaknesses.join(", ")}</p>
                </div>
            `;
        }
        htmlContent += `</body></html>`;

        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        //// Build ZIP in Memory
        const archive = archiver('zip', { zlib: { level: 0 } });
        const buffers = [];

        archive.on('data', (chunk) => buffers.push(chunk));

        return new Promise((resolve, reject) => {
            archive.on('end', () => {
                const finalBuffer = Buffer.concat(buffers);
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Disposition', `attachment; filename="Hospital_Master_Kit.zip"`);
                res.send(finalBuffer);
                resolve();
            });
            // ... archive.append() steps below this

            // Add Files
            archive.append(pdfBuffer, { name: '1_Intelligence_Report.pdf' });

            // Optional Excel
            if (plan.includes("Complete") || addons.includes("excel")) {
                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet('P&L');
                sheet.addRow(['Project Metric', 'Year 1 Projection']);
                sheet.addRow(['Gross Revenue', fINR(annualRev)]);
                sheet.addRow(['EBITDA', fINR(ebitda)]);
                workbook.xlsx.writeBuffer().then(buf => archive.append(buf, { name: '2_Financial_Model.xlsx' }));
            }

            // Optional PPT
            if (plan.includes("Investor") || plan.includes("Complete") || addons.includes("script")) {
                let pptx = new PptxGenJS();
                let slide = pptx.addSlide();
                slide.background = { color: "0A2540" };
                slide.addText(projectName, { x: 1, y: 2, w: 8, fontSize: 36, color: "D4AF37", align: "center" });
                pptx.write({ outputType: "nodebuffer" }).then(buf => archive.append(buf, { name: '3_Investor_Deck.pptx' }));
            }

            archive.finalize();
        });

    } catch (error) {
        console.error("FATAL ERROR:", error);
        if (!res.headersSent) res.status(500).json({ error: "Generation Engine Timeout" });
    }
});

// LISTEN ON PORT 10000
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Engine running on port ${PORT}`));