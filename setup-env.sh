#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up HUBUNK environment...${NC}\n"

# Check if .env exists
if [ -f .env ]; then
    echo -e "${YELLOW}Warning: .env file already exists. Creating backup...${NC}"
    cp .env .env.backup
fi

# Create new .env file
cat > .env << EOL
# Server Configuration
PORT=3000
NODE_ENV=development

# Security
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

# Database
DB_PATH=./data/database.sqlite

# OpenAI Configuration
OPENAI_API_KEY=

# Heygen Configuration
HEYGEN_API_KEY=
HEYGEN_AVATAR_ID=

# Storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOL

echo -e "${GREEN}Created .env file with secure random secrets${NC}"
echo -e "${YELLOW}Please edit .env and add your API keys for:${NC}"
echo "- OpenAI"
echo "- Heygen"
echo "- Cloudinary"
echo -e "\n${GREEN}You can now start the application with:${NC}"
echo "npm run dev" 