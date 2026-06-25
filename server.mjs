// server.mjs
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // make sure this is installed!
import axios from 'axios'; // add axios for API requests
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable CORS with all origins
app.use(cors());
app.use(express.json());

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      companyName, 
      product, 
      termLength, 
      coverageAmount 
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !companyName) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing required fields'
      });
    }
    
    // Create email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0a855c;">Quote Request</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Customer Email:</strong> ${email}</p>
          <p><strong>Term Length:</strong> ${termLength} years</p>
          <p><strong>Coverage Amount:</strong> $${coverageAmount}</p>
          <p><strong>Insurance Company:</strong> ${companyName}</p>
          ${product ? `<p><strong>Product:</strong> ${product}</p>` : ''}
        </div>
      </div>
    `;
    
    // Prepare email data
    const emailData = {
      sender: {
        name: "Lifestein Quote Tool",
        email: "mattmims@insurems.com"
      },
      to: [
        {
          email: "mattmims@lifestein.com",
          name: "Matt Mims"
        },
        {
          email: "teamtejas7@gmail.com",
          name: "Team"
        }
      ],
      subject: `Quote Request - ${companyName}`,
      htmlContent: htmlContent
    };
    
    // Send the email using Brevo API
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    
    if (!BREVO_API_KEY) {
      console.error('Brevo API key is missing');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Email service not properly configured'
      });
    }
    
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });
    
    return res.json({
      success: true,
      message: 'Email sent successfully'
    });
    
  } catch (error) {
    console.error('Email sending error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});

// API routes first
app.post('/api/quote', async (req, res) => {
  try {
    // Get the original payload from the request
    const originalPayload = req.body.COMPULIFE;
    
    if (!originalPayload) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing COMPULIFE data in request body'
      });
    }
    
    // Create a reformatted payload with only the needed fields in the exact order needed
    const formattedPayload = {
      BirthMonth: originalPayload.BirthMonth || "1",
      BirthYear: originalPayload.BirthYear || "1990",
      Birthday: originalPayload.Birthday || "1",
      CompRating: originalPayload.CompRating || "4",
      FaceAmount: originalPayload.FaceAmount || "500000",
      Health: originalPayload.Health || "PP",
      LANGUAGE: originalPayload.LANGUAGE || "E",
      ModeUsed: originalPayload.ModeUsed || "M",
      NewCategory: originalPayload.NewCategory || "5",
      REMOTE_IP: "122.182.211.105", // Hard-coded for consistency
      Sex: originalPayload.Sex || "M",
      Smoker: originalPayload.Smoker || "N",
      SortOverride1: "M", // Hard-coded to match curl example
      State: originalPayload.State || "5", // Hard-coded to match curl example
      UserLocation: "json", // Hard-coded to match curl example
      NitocinePouch: originalPayload.NitocinePouch === "Y" ? true:false
    };
    
    // Prepare the API URL with query parameters
    const COMPULIFE_DOMAIN = process.env.COMPULIFE_DOMAIN || 'compulifeapi.com';
    const COMPULIFE_AUTH_ID = process.env.COMPULIFE_AUTH_ID || '760903F14';
    const REMOTE_IP = process.env.REMOTE_IP || '74.113.157.69';
    
    // Convert the payload to a URL-encoded JSON string
    const compulifeParamValue = encodeURIComponent(JSON.stringify(formattedPayload));
    
    // Build the full URL with query parameters - avoid using template literals with URL params
    const apiUrl = `https://${COMPULIFE_DOMAIN}/api/request/?COMPULIFEAUTHORIZATIONID=${COMPULIFE_AUTH_ID}&REMOTE_IP=${REMOTE_IP}&COMPULIFE=${compulifeParamValue}`;
    
    console.log("Processing quote request...");
    
    // Make the GET request to the CompuLife API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CompuLife API Error (${response.status}):`, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to get quote from CompuLife',
        details: errorText,
        status: response.status
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('Server Error:', err.message || err);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: err.message || 'Unknown error'
    });
  }
});

// Serve static files after API routes
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route handler - must be the last route
app.use((req, res, next) => {
  // If the request is for an API endpoint but didn't match our defined API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For all other routes, serve the index.html from the dist folder
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
