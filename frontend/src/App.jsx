import React, { useState, useEffect } from 'react'
import axios from 'axios'
import confetti from 'canvas-confetti'
//import './App.css'

function App() {
  const [teams, setTeams] = useState([])
  const [schedule, setSchedule] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [simulationResults, setSimulationResults] = useState(null)

  const API_BASE = 'http://localhost:8000'

  useEffect(() => {
    fetchTeams()
    fetchSchedule()
  }, [])

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_BASE}/teams`)
      setTeams(res.data.teams)
    } catch (err) {
      console.error('Error fetching teams:', err)
    }
  }

  const fetchSchedule = async () => {
    try {
      const res = await axios.get(`${API_BASE}/schedule`)
      setSchedule(res.data.schedule)
    } catch (err) {
      console.error('Error fetching schedule:', err)
    }
  }

  const predictMatch = async (match) => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/predict`, {
        home_team: match.home_team,
        away_team: match.away_team,
        tournament: 'FIFA World Cup',
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
        iterations: 10000
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
          <h1 className="text-5xl font-bold text-white mb-2">⚽ FIFA 2026 Predictor</h1>
          <p className="text-xl text-gray-200">Monte Carlo Tournament Simulation</p>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tournament Simulation */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tournament Simulation</h2>
            <button
              onClick={simulateTournament}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'Simulating...' : 'Run 10,000 Simulations'}
            </button>

            {simulationResults && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Champion Probabilities</h3>
                <div className="space-y-2">
                  {simulationResults.map((result, idx) => (
                    <div key={idx} className="flex items-center">
                      <span className="w-24 font-medium text-gray-700">{result.team}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${result.probability}%` }}
                        >
                          <span className="text-white text-sm font-bold">
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
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {schedule.slice(0, 10).map((day, dayIdx) => (
                <div key={dayIdx}>
                  <h3 className="font-semibold text-gray-600 text-sm mb-2">{day.date}</h3>
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
          </div>

          {/* Match Prediction */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Prediction</h2>
            {selectedMatch ? (
              <div>
                <h3 className="font-bold text-gray-800 mb-4">
                  {selectedMatch.home_team} vs {selectedMatch.away_team}
                </h3>
                {prediction ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <div className="text-sm text-gray-600">Home Win</div>
                      <div className="text-2xl font-bold text-green-600">
                        {(prediction.home_win * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <div className="text-sm text-gray-600">Draw</div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {(prediction.draw * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-red-50 p-3 rounded border border-red-200">
                      <div className="text-sm text-gray-600">Away Win</div>
                      <div className="text-2xl font-bold text-red-600">
                        {(prediction.away_win * 100).toFixed(1)}%
                      </div>
                    </div>
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
