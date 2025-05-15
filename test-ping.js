const crypto = require('crypto');

const webhookSecret = '966e4df9766f355222c47520796a779c364595ff5e652092424b925d01abdd50';
const payload = {
  "zen": "Testing webhook",
  "hook_id": 1234567,
  "hook": {
    "type": "Repository",
    "id": 1234567,
    "active": true
  }
};

const payloadString = JSON.stringify(payload);
const signature = 'sha256=' + crypto.createHmac('sha256', webhookSecret)
  .update(payloadString)
  .digest('hex');

console.log('Signature:', signature);
console.log('Payload:', payloadString);
console.log('\nCurl command:');
console.log(`curl -X POST http://145.223.22.181:9001/ \\
  -H "Content-Type: application/json" \\
  -H "X-GitHub-Event: ping" \\
  -H "X-Hub-Signature-256: ${signature}" \\
  -d '${payloadString}'`); 