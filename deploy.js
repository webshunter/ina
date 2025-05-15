require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
const port = process.env.DEPLOY_PORT || 9001;
const webhookSecret = process.env.WEBHOOK_SECRET || 'your_default_secret';

// Gunakan raw body agar bisa digunakan untuk verifikasi signature
app.use(express.raw({ type: ['application/json', 'application/x-www-form-urlencoded'] }));

// Logging setiap request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Verifikasi HMAC SHA256 signature
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', webhookSecret);
  const digest = 'sha256=' + hmac.update(req.body).digest('hex');

  console.log('Signature:', signature);
  console.log('Digest:   ', digest);

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Fungsi untuk menjalankan command shell
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command error: ${error.message}`);
        return reject(error);
      }
      if (stderr) console.error(`stderr: ${stderr}`);
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Endpoint utama webhook
app.post('/', async (req, res) => {
  try {
    // Verifikasi signature
    if (!verifySignature(req)) {
      console.error('Signature mismatch');
      return res.status(401).json({ status: 'error', message: 'Invalid signature' });
    }

    // Parse JSON setelah verifikasi
    const payload = JSON.parse(req.body.toString());

    const event = req.headers['x-github-event'];
    if (event !== 'push') {
      console.log(`Ignoring event: ${event}`);
      return res.status(200).json({ status: 'ignored', message: `Ignoring event: ${event}` });
    }

    console.log('Received push event, running deploy...');

    try {
      const output = await runCommand('npm run deploy');
      return res.json({ status: 'success', message: 'Deployment completed', output });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: 'Deployment failed', error: err.message });
    }

  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Webhook server is running' });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Webhook server listening on port ${port}`);
});
