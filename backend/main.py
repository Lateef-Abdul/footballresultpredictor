from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from predictor import WorldCupPredictor

app = FastAPI(title="World Cup Predictor API")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize predictor
predictor = WorldCupPredictor()
model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
try:
    predictor.model = joblib.load(model_path)
except:
    predictor.train()

class MatchPredictionRequest(BaseModel):
    home_team: str
    away_team: str
    tournament: str = "FIFA World Cup"
    neutral: bool = True

class TournamentSimulationRequest(BaseModel):
    iterations: int = 10000

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict_match(request: MatchPredictionRequest):
    """Predict a single match outcome"""
    try:
        result = predictor.predict_match(
            request.home_team,
            request.away_team,
            request.tournament,
            request.neutral
        )
        return result
    except Exception as e:
        return {"error": str(e)}

@app.post("/simulate")
async def simulate_tournament(request: TournamentSimulationRequest = None):
    """Run Monte Carlo tournament simulation"""
    try:
        iterations = request.iterations if request else 10000
        results = predictor.simulate_tournament(iterations)

        # Format results
        formatted = [
            {"team": team, "probability": prob}
            for team, prob in results[:16]
        ]
        return {"champion_probabilities": formatted}
    except Exception as e:
        return {"error": str(e)}

@app.get("/teams")
async def get_teams():
    """Get all teams in the dataset"""
    teams = sorted(predictor.results_df['home_team'].unique().tolist())
    return {"teams": teams}

@app.post("/batch-predict")
async def batch_predict(matches: list):
    """Predict multiple matches at once"""
    try:
        results = []
        for match in matches:
            pred = predictor.predict_match(
                match['home_team'],
                match['away_team'],
                match.get('tournament', 'FIFA World Cup'),
                match.get('neutral', True)
            )
            results.append(pred)
        return {"predictions": results}
    except Exception as e:
        return {"error": str(e)}

@app.get("/schedule")
async def get_tournament_schedule():
    """Get 2026 World Cup schedule"""
    try:
        wc_2026 = predictor.results_df[
            (predictor.results_df['date'] >= '2026-06-01')
        ].copy()

        # Group by date
        schedule = []
        for date in sorted(wc_2026['date'].unique()):
            matches = wc_2026[wc_2026['date'] == date]
            day_matches = []
            for _, match in matches.iterrows():
                day_matches.append({
                    'home_team': match['home_team'],
                    'away_team': match['away_team'],
                    'city': match['city'],
                    'country': match['country'],
                    'date': str(match['date'])
                })
            schedule.append({"date": date, "matches": day_matches})

        return {"schedule": schedule}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
