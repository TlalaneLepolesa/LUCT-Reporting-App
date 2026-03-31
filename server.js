const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

// Main route
app.get('/', (req, res) => {
  res.send('LUCT Reporting System Backend is Active');
});

// Mock endpoint for Monitoring [cite: 44, 51, 58, 64]
app.get('/api/status', (req, res) => {
  res.json({ 
    system: "Active", 
    uptime: "99.9%", 
    database: "Connected (Firebase)" 
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});