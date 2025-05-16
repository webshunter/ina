#!/bin/bash

set -e

# Remove system nodejs if exists
if command -v node >/dev/null 2>&1 && ! command -v nvm >/dev/null 2>&1; then
  echo ">>> Removing system Node.js..."
  sudo apt remove -y nodejs || true
fi

# Install nvm if not present
if ! command -v nvm >/dev/null 2>&1; then
  echo ">>> Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Install and use Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Show node and npm version
node -v
npm -v

# Pull latest code from git
if [ -d .git ]; then
  echo ">>> Pulling latest code from git..."
  git pull
fi

# Install dependencies
npm install --force

# (Optional) Build step
# npm run build

# Restart app with pm2
if command -v pm2 >/dev/null 2>&1; then
  echo ">>> Restarting app with pm2..."
  pm2 restart hubunk-ai-coach || pm2 start index.js --name hubunk-ai-coach
else
  echo ">>> Installing pm2..."
  npm install -g pm2
  pm2 start index.js --name hubunk-ai-coach
fi

echo ">>> Deployment complete!" 