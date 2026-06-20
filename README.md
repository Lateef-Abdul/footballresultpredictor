# 🏆 FIFA 2026 World Cup Predictor

A machine learning-powered web application that predicts FIFA World Cup 2026 match outcomes using Monte Carlo simulations and Gradient Boosting models.

## 📊 Features

- **Machine Learning Predictions**: Uses 11,019+ historical matches to predict match outcomes
- **Monte Carlo Simulations**: 10,000+ tournament simulations to forecast champion probabilities
- **Real-time Predictions**: Single match prediction with win/draw/loss probabilities
- **Tournament Schedule**: Complete 2026 World Cup match schedule with venues
- **RESTful API**: FastAPI backend with comprehensive endpoints
- **Interactive UI**: Modern React frontend with TailwindCSS styling

## 🏗️ Architecture

```
football-prediction/
├── backend/           # FastAPI server
│   ├── predictor.py   # ML model & predictions
│   ├── main.py        # FastAPI app
│   └── requirements.txt
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
└── data/              # Training data
    ├── results.csv    # 49K+ historical matches
    ├── fifa_rankings.csv
    ├── elo_ratings.csv
    └── head_to_head.csv
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python3 predictor.py      # Train the model
python3 -m uvicorn main:app --reload --port 8000
```

Backend will run on `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Predict Match
```bash
POST /predict
{
  "home_team": "Argentina",
  "away_team": "France",
  "tournament": "FIFA World Cup",
  "neutral": true
}
```

Response:
```json
{
  "home_team": "Argentina",
  "away_team": "France",
  "home_win": 0.205,
  "draw": 0.637,
  "away_win": 0.158
}
```

### Batch Predictions
```bash
POST /batch-predict
[
  {"home_team": "Argentina", "away_team": "France", "neutral": true},
  {"home_team": "Brazil", "away_team": "Germany", "neutral": true}
]
```

### Tournament Simulation
```bash
POST /simulate
{
  "iterations": 10000
}
```

Response:
```json
{
  "champion_probabilities": [
    {"team": "Argentina", "probability": 15.3},
    {"team": "France", "probability": 12.8},
    ...
  ]
}
```

### Get Teams
```bash
GET /teams
```

### Get Schedule
```bash
GET /schedule
```

## 🎯 Model Details

### Training Data
- **49,477 international football matches** (1872-2026)
- **11,063 recent matches** (2015+) used for ML training
- **72 World Cup 2026 matches** scheduled

### Features Used
- **Elo Ratings**: Current team strength ratings
- **Head-to-Head**: Historical matchup records
- **Recent Form**: Last 5 matches performance
- **Tournament Importance**: Weight by tournament type
- **Neutral Venue**: Host nation adjustments

### Model
- **Algorithm**: Gradient Boosting Classifier (scikit-learn)
- **Training Matches**: 11,019
- **Accuracy**: Optimized for draw predictions in group stage

## 🔧 Configuration

### Adjust Simulation Iterations
Edit `frontend/src/App.jsx` and change:
```javascript
iterations: 10000  // Change this value
```

### Add More Training Data
Add matches to `data/results.csv` with columns:
- date, home_team, away_team, home_score, away_score, tournament, city, country, neutral

## 📈 Tournament Simulation Logic

1. **Group Stage**: Simulates 64 group matches with possible draws
2. **Knockout Stage**: Simulates 64 knockout matches
   - If draw → Extra Time & Penalties (50-50 chance)
   - Winner advances to next round
3. **10,000 Iterations**: Aggregates results for probability calculation

## 🎨 UI Features

- **Tournament Simulation**: Run complete tournament prediction
- **Upcoming Matches**: Browse 2026 schedule
- **Match Prediction**: Click any match to get prediction probabilities
- **Champion Probabilities**: View top 16 team chances to win
- **Real-time Updates**: Live prediction results

## 📊 Data Sources

- **Historical Matches**: Internal dataset (49K+ matches)
- **FIFA Rankings**: Current official rankings
- **Elo Ratings**: Calculated team strengths
- **Head-to-Head**: Derived from match history
- **2026 Schedule**: Official FIFA World Cup schedule

## 🔐 Performance Notes

- Model training: ~30 seconds on modern CPU
- Single prediction: <100ms
- 10,000 simulations: ~2-3 seconds
- Vectorized operations for memory efficiency

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version (3.8+)
python3 --version

# Reinstall dependencies
pip install -r backend/requirements.txt --force-reinstall
```

### Frontend build issues
```bash
# Clear node_modules and reinstall
rm -rf frontend/node_modules
cd frontend
npm install
```

### API connection errors
- Ensure backend is running: `http://localhost:8000/health`
- Check CORS is enabled in `backend/main.py`
- Frontend proxy configured in `frontend/vite.config.js`

## 📝 Future Enhancements

- [ ] Player-level predictions (squad composition)
- [ ] Live match updates during tournament
- [ ] Custom team strength adjustments
- [ ] Historical accuracy tracking
- [ ] Export predictions to PDF/Excel
- [ ] Real-time odds comparison

## 📄 License

MIT License - Feel free to use for educational purposes

## 👨‍💻 Development

Built with:
- Backend: FastAPI, Scikit-learn, Pandas
- Frontend: React 18, Vite, TailwindCSS
- Visualization: Recharts, Canvas-Confetti

---

**Enjoy predicting! ⚽🌎**
