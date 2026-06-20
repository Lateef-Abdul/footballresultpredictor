import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import PoissonRegressor
import joblib
from datetime import datetime
import os
import math

# Get the project root directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')

class WorldCupPredictor:
    def __init__(self):
        self.results_df = pd.read_csv(os.path.join(DATA_DIR, 'results.csv'))
        self.fifa_df = pd.read_csv(os.path.join(DATA_DIR, 'fifa_rankings.csv'))
        self.elo_df = pd.read_csv(os.path.join(DATA_DIR, 'elo_ratings.csv'))
        self.h2h_df = pd.read_csv(os.path.join(DATA_DIR, 'head_to_head.csv'))

        self.home_encoder = LabelEncoder()
        self.away_encoder = LabelEncoder()
        self.model = None
        self.home_goals_model = None
        self.away_goals_model = None
        self.feature_scaler = None

    def create_features(self, home_team, away_team, tournament, neutral=False):
        """Create feature vector for a match"""
        features = {}

        # Get team ratings
        home_elo = self.elo_df[self.elo_df['team'] == home_team]['elo_rating'].values
        away_elo = self.elo_df[self.elo_df['team'] == away_team]['elo_rating'].values

        home_elo = home_elo[0] if len(home_elo) > 0 else 1600
        away_elo = away_elo[0] if len(away_elo) > 0 else 1600

        features['elo_diff'] = home_elo - away_elo
        features['home_elo'] = home_elo
        features['away_elo'] = away_elo

        # Get historical h2h
        h2h_record = self.h2h_df[
            ((self.h2h_df['team_a'] == home_team) & (self.h2h_df['team_b'] == away_team)) |
            ((self.h2h_df['team_a'] == away_team) & (self.h2h_df['team_b'] == home_team))
        ]

        if len(h2h_record) > 0:
            record = h2h_record.iloc[0]
            if record['team_a'] == home_team:
                features['h2h_wins'] = record['team_a_wins']
                features['h2h_losses'] = record['team_b_wins']
            else:
                features['h2h_wins'] = record['team_b_wins']
                features['h2h_losses'] = record['team_a_wins']
            features['h2h_draws'] = record['draws']
        else:
            features['h2h_wins'] = 0
            features['h2h_losses'] = 0
            features['h2h_draws'] = 0

        # Get team form (last 5 matches average goals)
        home_recent = self.results_df[
            (self.results_df['home_team'] == home_team) &
            (self.results_df['home_score'].notna())
        ].tail(5)

        away_recent = self.results_df[
            (self.results_df['away_team'] == away_team) &
            (self.results_df['away_score'].notna())
        ].tail(5)

        features['home_form'] = home_recent['home_score'].mean() if len(home_recent) > 0 else 1.5
        features['away_form'] = away_recent['away_score'].mean() if len(away_recent) > 0 else 1.5

        # Neutral venue
        features['neutral'] = 1.0 if neutral else 0.0

        # Tournament importance
        tournament_weights = {
            'FIFA World Cup': 3.0,
            'FIFA World Cup qualification': 2.5,
            'Friendly': 1.0
        }
        features['tournament_weight'] = tournament_weights.get(tournament, 1.5)

        return features

    def train_score_models(self):
        """Train Poisson regression models for predicting goals"""
        print("Training score prediction models...")

        train_df = self.results_df[
            (self.results_df['home_score'].notna()) &
            (self.results_df['date'] >= '2015-01-01')
        ].copy()

        X = []
        home_goals = []
        away_goals = []

        for _, row in train_df.iterrows():
            try:
                features = self.create_features(
                    row['home_team'],
                    row['away_team'],
                    row['tournament'],
                    row['neutral']
                )
                X.append(list(features.values()))
                home_goals.append(int(row['home_score']))
                away_goals.append(int(row['away_score']))
            except:
                continue

        X = np.array(X)

        self.home_goals_model = PoissonRegressor(alpha=0.1)
        self.away_goals_model = PoissonRegressor(alpha=0.1)

        self.home_goals_model.fit(X, home_goals)
        self.away_goals_model.fit(X, away_goals)

        print(f"✓ Score models trained on {len(X)} matches")

    def train(self):
        """Train the model"""
        print("Training prediction model...")

        # Prepare training data
        train_df = self.results_df[
            (self.results_df['home_score'].notna()) &
            (self.results_df['date'] >= '2015-01-01')
        ].copy()

        X = []
        y = []

        for _, row in train_df.iterrows():
            try:
                features = self.create_features(
                    row['home_team'],
                    row['away_team'],
                    row['tournament'],
                    row['neutral']
                )
                X.append(list(features.values()))

                # Outcome: 0=away win, 1=draw, 2=home win
                if row['home_score'] > row['away_score']:
                    y.append(2)
                elif row['home_score'] < row['away_score']:
                    y.append(0)
                else:
                    y.append(1)
            except:
                continue

        X = np.array(X)
        y = np.array(y)

        # Train model
        self.model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.model.fit(X, y)

        # Train score models
        self.train_score_models()

        # Save model
        model_path = os.path.join(SCRIPT_DIR, 'model.pkl')
        joblib.dump(self.model, model_path)
        joblib.dump(self.home_goals_model, os.path.join(SCRIPT_DIR, 'home_goals_model.pkl'))
        joblib.dump(self.away_goals_model, os.path.join(SCRIPT_DIR, 'away_goals_model.pkl'))
        print(f"✓ Model trained on {len(X)} matches")

    def predict_match(self, home_team, away_team, tournament='Friendly', neutral=False):
        """Predict match outcome and probable score"""
        if self.model is None:
            self.train()

        features = self.create_features(home_team, away_team, tournament, neutral)
        X = np.array([list(features.values())])

        proba = self.model.predict_proba(X)[0]

        # Predict scores using Poisson regression
        home_goals_raw = float(self.home_goals_model.predict(X)[0])
        away_goals_raw = float(self.away_goals_model.predict(X)[0])

        # Use ELO difference to adjust predictions (stronger team should score more)
        elo_diff = features['elo_diff']
        elo_factor = 1.0 + (elo_diff / 400.0) * 0.3  # Modest ELO adjustment

        home_goals_pred = max(0.3, home_goals_raw * elo_factor)
        away_goals_pred = max(0.3, away_goals_raw * (1.0 / elo_factor))

        # Clamp to reasonable values
        home_goals_pred = min(4.0, home_goals_pred)
        away_goals_pred = min(4.0, away_goals_pred)

        # Generate probable scorelines based on Poisson distribution
        probable_scores = []
        for h in range(0, 6):
            for a in range(0, 6):
                try:
                    home_prob = (np.exp(-home_goals_pred) * (home_goals_pred ** h)) / math.factorial(h)
                    away_prob = (np.exp(-away_goals_pred) * (away_goals_pred ** a)) / math.factorial(a)
                    score_prob = home_prob * away_prob
                    if score_prob > 0.005:
                        probable_scores.append({
                            'score': f"{h}-{a}",
                            'probability': float(score_prob)
                        })
                except:
                    continue

        probable_scores.sort(key=lambda x: x['probability'], reverse=True)

        return {
            'home_team': home_team,
            'away_team': away_team,
            'away_win': float(proba[0]),
            'draw': float(proba[1]),
            'home_win': float(proba[2]),
            'predicted_home_goals': round(home_goals_pred, 2),
            'predicted_away_goals': round(away_goals_pred, 2),
            'probable_scores': probable_scores[:5]
        }

    def simulate_tournament(self, n_iterations=1000):
        """Monte Carlo tournament simulation (optimized)"""
        # Load upcoming tournament matches (not yet played)
        wc_matches = self.results_df[
            self.results_df['home_score'].isna()
        ].copy()

        if len(wc_matches) == 0:
            return [("No upcoming matches", 0.0)]

        print(f"Simulating {len(wc_matches)} tournament matches {n_iterations} times...")

        # Pre-compute predictions for all matches
        match_predictions = {}
        for _, match in wc_matches.iterrows():
            key = (match['home_team'], match['away_team'])
            if key not in match_predictions:
                pred = self.predict_match(
                    match['home_team'],
                    match['away_team'],
                    match['tournament'],
                    match['neutral']
                )
                match_predictions[key] = pred

        champions = {}

        for iteration in range(n_iterations):
            for _, match in wc_matches.iterrows():
                key = (match['home_team'], match['away_team'])
                pred = match_predictions[key]

                r = np.random.random()
                if r < pred['away_win']:
                    winner = match['away_team']
                elif r < pred['away_win'] + pred['draw']:
                    winner = match['away_team'] if np.random.random() > 0.5 else match['home_team']
                else:
                    winner = match['home_team']

                champions[winner] = champions.get(winner, 0) + 1

            if (iteration + 1) % 100 == 0 and n_iterations > 500:
                print(f"  Completed {iteration + 1}/{n_iterations} simulations")

        # Normalize probabilities to 100%
        total = sum(champions.values())
        results = {
            team: (count / total) * 100
            for team, count in champions.items()
        }

        return sorted(results.items(), key=lambda x: x[1], reverse=True)

if __name__ == "__main__":
    predictor = WorldCupPredictor()
    predictor.train()

    # Test prediction
    print("\n" + "="*60)
    print("TEST PREDICTION")
    print("="*60)
    pred = predictor.predict_match('Argentina', 'France', 'FIFA World Cup', True)
    print(f"\n{pred['home_team']} vs {pred['away_team']}")
    print(f"  Home Win: {pred['home_win']:.2%}")
    print(f"  Draw: {pred['draw']:.2%}")
    print(f"  Away Win: {pred['away_win']:.2%}")
