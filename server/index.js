import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { setupDatabase } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Email Transporter
async function createTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    // If user provided a real SMTP (like Gmail)
    return nodemailer.createTransport({
      service: 'gmail', // Standard gmail service
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to Ethereal Email (Fake SMTP service for testing)
    const testAccount = await nodemailer.createTestAccount();
    console.log("No SMTP credentials found in .env. Using Ethereal Mock Email.");
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }
}

let db;
let transporter;

// Start Server & Connect Database
async function startServer() {
  try {
    db = await setupDatabase();
    transporter = await createTransporter();

    app.listen(PORT, () => {
      console.log(`Backend Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

// API Endpoint to handle Form Submissions
app.post("/api/inquire", async (req, res) => {
  const { name, email, selection, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and Email are required." });
  }

  try {
    // 1. Save to SQLite Database
    const result = await db.run(
      `INSERT INTO inquiries (name, email, objective, message) VALUES (?, ?, ?, ?)`,
      [name, email, selection || "Unspecified", message || ""]
    );
    
    console.log(`Saved inquiry #${result.lastID} to database for ${email}`);

    // 2. Send Automated Email to the Submitter
    const mailOptions = {
      from: '"HondaJet Test Server" <noreply@hondajet-test.com>', // sender address
      to: email, // list of receivers (the submitter)
      subject: "Inquiry Received (Test Environment)", // Subject line
      text: "Thank you for your inquiry. Please note that this website is just a test website built by a developer who is learning web development.", // plain text body
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #f59e0b;">HondaJet - Inquiry Received</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for submitting your inquiry regarding: <strong>${selection}</strong>.</p>
          <p style="padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b;">
            <strong>Developer Notice:</strong> This website is just a test website by a developer who is learning web development.
          </p>
          <p>Your original message:</p>
          <blockquote style="color: #666; font-style: italic;">
            "${message || 'No additional message provided.'}"
          </blockquote>
        </div>
      `, 
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    
    // If using Ethereal, log the preview URL
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    // 3. Respond to Frontend
    res.status(200).json({ success: true, message: "Inquiry saved and email sent." });

  } catch (error) {
    console.error("Error processing inquiry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

startServer();
