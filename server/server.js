const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const apiRouter = require('./sweepstakes-backend-api-v6.js');
const { router: geofenceRouter } = require('./geofencing-kyc-service.js');

app.use('/api/compliance', geofenceRouter);
app.use('/api', apiRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy' });
});

if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CrownVault server listening on port ${PORT}`);
});
