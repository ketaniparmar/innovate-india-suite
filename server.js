require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.SUPABASE_URL || 'https://udljxsjkqdrpqmxamwkd.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkbGp4c2prcWRycHFteGFtd2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Mzg1NDAsImV4cCI6MjA4ODAxNDU0MH0.gXuw6cNBRr8HCAOOsB3Z3xYuUDeIvDlXXIcvhuTKe_c';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- GMAIL SETUP (Hardcoded safely as strings) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'innovateindiasurat@gmail.com',
        pass: 'nolgiakguylscrnh' // Spaces must be removed for it to work!
    }
});

app.use(cors({
    origin: ['http://localhost:5173', 'https://innovate-indai.vercel.app'],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

app.post('/api/admin/generate-pdf', async (req, res) => {
    const { email, projectName, bedCount, specialtyFocus, cityTier, totalArea, numFloors } = req.body;
    let browser;

    try {
        console.log("--- STARTING GENERATION ---");

        try {
            await supabase.from('projects').insert([{ 
                project_name: projectName, director_email: email, tier: "Tier " + cityTier, 
                bed_capacity: bedCount, specialty_focus: specialtyFocus, total_built_up_area: totalArea,
                num_floors: numFloors, status: 'feasibility_lead'
            }]);
        } catch (dbErr) { console.error("DB Error:", dbErr.message); }

        browser = await puppeteer.launch({ 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'], 
            headless: "new" 
        });
        
        const page = await browser.newPage();
        
        const htmlContent = `
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica', Arial, sans-serif; padding: 40px; color: #010810; }
                .header { text-align: center; border-bottom: 4px solid #D4AF37; padding-bottom: 20px; }
                .stat-box { background: #f4f7f9; border-left: 6px solid #D4AF37; padding: 25px; margin: 30px 0; }
                .footer { margin-top: 50px; font-size: 11px; color: #718096; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 style="margin:0; font-size: 28px;">INNOVATE INDIA</h1>
                <p style="letter-spacing: 3px; font-weight: bold; color: #1a365d;">STRATEGIC FEASIBILITY REPORT</p>
            </div>
            <div style="margin-top: 40px;">
                <p><strong>Project Name:</strong> ${projectName}</p>
                <p><strong>Proposed Capacity:</strong> ${bedCount} Beds</p>
                <p><strong>Target Specialty:</strong> ${specialtyFocus}</p>
                <p><strong>Built-up Area:</strong> ${totalArea.toLocaleString()} Sq. Ft.</p>
            </div>
            <div class="stat-box">
                <p style="text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Estimated Project CAPEX</p>
                <h2 style="margin:0; font-size: 32px; color: #2b6cb0;">₹${(bedCount * 0.52).toFixed(2)} - ₹${(bedCount * 0.78).toFixed(2)} Cr</h2>
            </div>
            <div class="footer">
                <p>Innovate India Hospital Project Consultancy</p>
            </div>
        </body>
        </html>`;

        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 120000 });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, timeout: 120000 });
        await browser.close();

        console.log("Sending Email...");
        
        const mailOptions = {
            from: '"Innovate India Desk" <innovateindiasurat@gmail.com>',
            to: email,
            subject: "Confidential: Hospital Feasibility Brief | " + projectName,
            html: "<h2>Feasibility Analysis Ready</h2><p>Dear Director,</p><p>We have completed the initial capital expenditure modeling for your project.</p><p>The detailed feasibility brief is attached to this email as a PDF.</p><br/><p>Regards,<br/><strong>Innovate India Strategy Desk</strong></p>",
            attachments: [{ filename: "Project_Report.pdf", content: pdfBuffer }]
        };

        await transporter.sendMail(mailOptions);
        console.log("SUCCESS! Email sent.");
        res.status(200).json({ success: true });

    } catch (err) {
        if (browser) await browser.close();
        console.error("CRITICAL ERROR:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Engine live on port " + PORT));