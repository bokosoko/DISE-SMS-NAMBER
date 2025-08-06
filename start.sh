#!/bin/bash

echo "🚀 Starting DispoSMS Application..."
echo "=================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Navigate to project directory
cd /home/ubuntu/disposms-nodejs

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found, using default environment variables"
else
    echo "✅ Environment file found"
fi

# Start the application
echo "🌟 Starting DispoSMS server..."
echo "📍 Server will be available at: http://localhost:5000"
echo "🔗 API endpoints at: http://localhost:5000/api"
echo "💻 Frontend at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================="

# Start the server
node server.js

