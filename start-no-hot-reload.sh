#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting production-like server without hot reloading ===${NC}"
echo -e "${YELLOW}Using single-copy architecture: Data files only in server/data${NC}"

# Kill any existing processes
echo -e "${YELLOW}Stopping any existing processes...${NC}"
pkill -f "npm run start" || true
pkill -f "npm run server" || true
pkill -f "node server/server.js" || true
pkill -f "serve -s build" || true

# Verify and create server data directory
echo -e "${YELLOW}Setting up server data directory...${NC}"
mkdir -p ./server/data 2>/dev/null || true

# Check for data files in server/data and create minimal versions if they don't exist
echo -e "${YELLOW}Checking for required data files...${NC}"

# Check dataset.json
if [ ! -f "./server/data/dataset.json" ]; then
  echo -e "${YELLOW}Creating empty dataset.json in server/data...${NC}"
  echo '{"لسان العرب":{}}' > ./server/data/dataset.json
  echo -e "${GREEN}Created minimal dataset.json${NC}"
else
  echo -e "${GREEN}Found existing dataset.json${NC}"
fi

# Check resources.json
if [ ! -f "./server/data/resources.json" ]; then
  echo -e "${YELLOW}WARNING: resources.json not found in server/data!${NC}"
  echo -e "${YELLOW}Creating minimal resources.json for testing...${NC}"
  echo '{"لسان العرب":{"أبا":"الأباء بالفتح والمد: القًّصَبُ، والواحدة أباءَهٌ.","أبب":"الأبُّ: المَرْعى."}}' > ./server/data/resources.json
  echo -e "${GREEN}Created minimal resources.json${NC}"
else
  echo -e "${GREEN}Found existing resources.json${NC}"
fi

# Start the server with verbose logging in development mode
echo -e "${YELLOW}Starting API server in development mode with verbose logging...${NC}"
NODE_ENV=development node server/server.js > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo -e "${YELLOW}Waiting for server to start...${NC}"
sleep 3

# Test API endpoints
echo -e "${YELLOW}Testing API endpoints...${NC}"
curl -s http://localhost:3001/api/get-dataset > /dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}WARNING: API server not responding. Check server.log for details.${NC}"
else
  echo -e "${GREEN}API server is working${NC}"
fi

# Also test the special route that serves files directly from server/data
echo -e "${YELLOW}Testing special routes...${NC}"
curl -s http://localhost:3001/assets/data/dataset.json > /dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}WARNING: Special /assets/data/ route not responding. Check server.log for details.${NC}"
else
  echo -e "${GREEN}Special /assets/data/ route is working${NC}"
fi

# Create a temporary .env file to ensure development mode
echo -e "${YELLOW}Creating temporary .env file for development mode...${NC}"
cat > .env << EOL
REACT_APP_DISABLE_WEBSOCKET=true
WDS_SOCKET_PORT=0
GENERATE_SOURCEMAP=false
NODE_ENV=development
REACT_APP_ENV=development
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ASSETS_URL=http://localhost:3001
EOL

# Build the React app
echo -e "${YELLOW}Building React app in development mode...${NC}"
npm run build

# Clean up the temporary .env file
rm .env

# No need to copy data files to build directory in the single-copy architecture

# Start the React app with development environment
echo -e "${YELLOW}Starting React app with development API endpoints...${NC}"
REACT_APP_API_URL=http://localhost:3001/api REACT_APP_ENV=development NODE_ENV=development npx serve -s build > client.log 2>&1 &
REACT_PID=$!

echo -e "${BLUE}=== Servers started successfully ===${NC}"
echo -e "${GREEN}Your application should now be running at: ${YELLOW}http://localhost:3000${NC}"
echo -e "${GREEN}The API endpoint is available at: ${YELLOW}http://localhost:3001/api${NC}"
echo -e "${GREEN}Data is served from: ${YELLOW}server/data${NC} (single-copy architecture)"
echo ""
echo -e "${YELLOW}Server logs: ${GREEN}server.log${NC}"
echo -e "${YELLOW}Client logs: ${GREEN}client.log${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Wait for Ctrl+C
trap "kill $SERVER_PID $REACT_PID; echo -e '${RED}Servers stopped${NC}'; exit" INT
wait