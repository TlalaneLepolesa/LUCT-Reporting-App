const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('LUCT Reporting System Backend is Active');
});

app.get('/api/status', (req, res) => {
  res.json({ 
    system: "Active", 
    uptime: "Online", 
    database: "Connected (Firebase)" 
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});