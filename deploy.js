require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const port = process.env.DEPLOY_PORT || 9001;
const webhookSecret = process.env.WEBHOOK_SECRET || '966e4df9766f355222c47520796a779c364595ff5e652092424b925d01abdd50';

// Middleware untuk logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// Error handler untuk JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parsing error:', err);
    return res.status(400).json({ status: 'error', message: 'Invalid JSON' });
  }
  next();
});

// Fungsi untuk memverifikasi signature dari GitHub
const verifyGithubWebhook = (req) => {
  try {
    if (!webhookSecret) {
      console.warn('Webhook secret tidak dikonfigurasi!');
      return true;
    }

    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
      console.error('Tidak ada signature di header');
      return false;
    }

    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    
    console.log('Received signature:', signature);
    console.log('Calculated digest:', digest);
    
    const result = signature === digest;
    console.log('Signature verification result:', result);
    return result;
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return false;
  }
};

// Fungsi untuk menjalankan perintah shell
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (stderr) console.error(`Stderr: ${stderr}`);
      if (error) {
        console.error(`Error: ${error}`);
        return reject(error);
      }
      console.log(`Output: ${stdout}`);
      resolve(stdout);
    });
  });
};

// Root endpoint untuk GitHub webhook
app.post('/', async (req, res) => {
  console.log('Received webhook request');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    // Verifikasi webhook
    const isValid = verifyGithubWebhook(req);
    console.log('Webhook verification result:', isValid);
    
    if (!isValid) {
      console.error('Verifikasi webhook gagal');
      return res.status(401).json({ 
        status: 'error', 
        message: 'Unauthorized - Signature verification failed' 
      });
    }

    // Periksa jika ini adalah push event
    const event = req.headers['x-github-event'];
    console.log('Event type:', event);
    
    if (event !== 'push') {
      console.log(`Ignoring non-push event: ${event}`);
      return res.json({ 
        status: 'ignored', 
        message: `Bukan push event (${event})` 
      });
    }

    console.log('Processing push event...');
    console.log('Received webhook, starting deployment...');
    
    try {
      // Jalankan script deployment
      console.log('Running deployment command...');
      const output = await runCommand('npm run deploy');
      console.log('Deployment output:', output);
      console.log('Deployment completed successfully');
      
      return res.json({ 
        status: 'success', 
        message: 'Deployment completed',
        output 
      });
    } catch (deployError) {
      console.error('Deployment error:', deployError);
      return res.status(500).json({ 
        status: 'error', 
        message: `Deployment failed: ${deployError.message}`,
        error: deployError 
      });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error: ' + error.message 
    });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  return res.json({ 
    status: 'ok', 
    message: 'Webhook server is running',
    secret_configured: !!webhookSecret
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Deployment server listening on port ${port}`);
  console.log(`Webhook secret ${webhookSecret ? 'is' : 'is NOT'} configured`);
}); 