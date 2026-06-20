import React, { useState, useEffect } from 'react'
import axios from 'axios'
import confetti from 'canvas-confetti'

function App() {
  const [teams, setTeams] = useState([])
  const [schedule, setSchedule] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [simulationResults, setSimulationResults] = useState(null)
  const [simulationIterations, setSimulationIterations] = useState(1000)

  const API_BASE = 'http://localhost:8000'

  useEffect(() => {
    fetchTeams()
    fetchTournaments()
  }, [])

  useEffect(() => {
    if (selectedTournament) {
      fetchSchedule(selectedTournament)
    }
  }, [selectedTournament])

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_BASE}/teams`)
      setTeams(res.data.teams)
    } catch (err) {
      console.error('Error fetching teams:', err)
    }
  }

  const fetchTournaments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tournaments`)
      setTournaments(res.data.tournaments)
      if (res.data.tournaments.length > 0) {
        setSelectedTournament(res.data.tournaments[0])
      }
    } catch (err) {
      console.error('Error fetching tournaments:', err)
    }
  }

  const fetchSchedule = async (tournament) => {
    try {
      const res = await axios.get(`${API_BASE}/schedule`, {
        params: { tournament }
      })
      setSchedule(res.data.schedule)
    } catch (err) {
      console.error('Error fetching schedule:', err)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const predictMatch = async (match) => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/predict`, {
        home_team: match.home_team,
        away_team: match.away_team,
        tournament: match.tournament,
        neutral: true
      })
      setPrediction(res.data)
      setSelectedMatch(match)
    } catch (err) {
      console.error('Error predicting:', err)
    }
    setLoading(false)
  }

  const simulateTournament = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/simulate`, {
        iterations: simulationIterations
      })
      setSimulationResults(res.data.champion_probabilities)
      triggerConfetti()
    } catch (err) {
      console.error('Error simulating:', err)
    }
    setLoading(false)
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-800 to-red-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">⚽ Football Predictor</h1>
          <p className="text-xl text-gray-200">Match Predictions & Tournament Simulation</p>
        </header>

        {/* Tournament Filter */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Select Tournament</h2>
          <select
            value={selectedTournament || ''}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tournaments.map((tournament) => (
              <option key={tournament} value={tournament}>
                {tournament}
              </option>
            ))}
          </select>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tournament Simulation */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tournament Simulation</h2>
            <div className="flex gap-4 items-end mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Simulations</label>
                <input
                  type="number"
                  value={simulationIterations}
                  onChange={(e) => setSimulationIterations(Math.max(100, parseInt(e.target.value) || 1000))}
                  min="100"
                  max="10000"
                  step="100"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={simulateTournament}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Simulating...' : 'Run Simulations'}
              </button>
            </div>

            {simulationResults && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Champion Probabilities</h3>
                <div className="space-y-3 overflow-x-auto">
                  {simulationResults.map((result, idx) => (
                    <div key={idx} className="flex items-center gap-3 min-w-max md:min-w-0">
                      <span className="font-medium text-gray-700 w-32 flex-shrink-0">{result.team}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 min-w-fit">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full flex items-center justify-center px-2"
                          style={{ width: `${Math.max(result.probability, 15)}%` }}
                        >
                          <span className="text-white text-xs font-bold whitespace-nowrap">
                            {result.probability.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Matches */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Upcoming Matches</h2>
            {schedule.length === 0 ? (
              <p className="text-gray-500">No upcoming matches for this tournament</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {schedule.slice(0, 15).map((day, dayIdx) => (
                  <div key={dayIdx}>
                    <h3 className="font-semibold text-gray-600 text-sm mb-2">{formatDate(day.date)}</h3>
                    {day.matches.map((match, idx) => (
                      <button
                        key={idx}
                        onClick={() => predictMatch(match)}
                        className="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded p-3 text-left transition mb-2"
                      >
                        <div className="font-semibold text-gray-800">
                          {match.home_team} vs {match.away_team}
                        </div>
                        <div className="text-sm text-gray-600">{match.city}, {match.country}</div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Match Prediction */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Prediction</h2>
            {selectedMatch ? (
              <div>
                <h3 className="font-bold text-gray-800 mb-2">
                  {selectedMatch.home_team} vs {selectedMatch.away_team}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{selectedMatch.tournament}</p>
                {prediction ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="text-sm text-gray-600">{selectedMatch.home_team} Win</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(prediction.home_win * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="text-sm text-gray-600">Draw</div>
                      <div className="text-2xl font-bold text-gray-600">
                        {(prediction.draw * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded border border-orange-200">
                      <div className="text-sm text-gray-600">{selectedMatch.away_team} Win</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {(prediction.away_win * 100).toFixed(1)}%
                      </div>
                    </div>

                    {prediction.probable_scores && prediction.probable_scores.length > 0 && (
                      <div className="mt-5 pt-5 border-t">
                        <div className="text-sm font-semibold text-gray-700 mb-3">Probable Scores</div>
                        <div className="space-y-2">
                          {prediction.probable_scores.map((score, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700 font-medium">{score.score}</span>
                              <span className="text-gray-600">{(score.probability * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                          Expected: {prediction.predicted_home_goals.toFixed(1)} - {prediction.predicted_away_goals.toFixed(1)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">{loading ? 'Loading...' : 'Select a match'}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Select a match to see prediction</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
