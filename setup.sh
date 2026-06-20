#!/bin/bash

echo "🏆 FIFA 2026 World Cup Predictor - Quick Start"
echo "=============================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Check if Node/npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo ""
echo "📦 Installing Backend Dependencies..."
cd backend
pip install -q -r requirements.txt
echo "✓ Backend dependencies installed"

echo ""
echo "🤖 Training ML Model..."
python3 predictor.py > /dev/null 2>&1
echo "✓ Model trained"

echo ""
echo "📦 Installing Frontend Dependencies..."
cd ../frontend
npm install -q > /dev/null 2>&1
echo "✓ Frontend dependencies installed"

echo ""
echo "✅ Setup Complete!"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  python3 -m uvicorn main:app --reload"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
