require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const port = process.env.DEPLOY_PORT || 9000;
const webhookSecret = process.env.WEBHOOK_SECRET;

app.use(express.json());

// Fungsi untuk memverifikasi signature dari GitHub
const verifyGithubWebhook = (req) => {
  if (!webhookSecret) {
    console.warn('Webhook secret tidak dikonfigurasi!');
    return true;
  }

  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', webhookSecret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

// Fungsi untuk menjalankan perintah shell
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        return reject(error);
      }
      console.log(`Output: ${stdout}`);
      resolve(stdout);
    });
  });
};

app.post('/webhook', async (req, res) => {
  try {
    // Verifikasi webhook
    if (!verifyGithubWebhook(req)) {
      console.error('Verifikasi webhook gagal');
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Periksa jika ini adalah push event
    const event = req.headers['x-github-event'];
    if (event !== 'push') {
      return res.json({ status: 'ignored', message: 'Bukan push event' });
    }

    console.log('Received webhook, starting deployment...');
    
    // Jalankan script deployment
    await runCommand('npm run deploy');
    
    console.log('Deployment completed successfully');
    res.json({ status: 'success', message: 'Deployment completed' });
  } catch (error) {
    console.error('Deployment failed:', error);
    res.status(500).json({ status: 'error', message: 'Deployment failed' });
  }
});

app.listen(port, () => {
  console.log(`Deployment server listening on port ${port}`);
}); 