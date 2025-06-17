import { useState } from "react"
import axios from "axios"
import CanvasBuilder from "./components/CanvasBuilder"

const API_BASE = "http://localhost:8080"

function App() {
  const [sessionId, setSessionId] = useState(null)
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const initializeCanvas = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await axios.post(`${API_BASE}/api/canvas/init`, canvasDimensions)
      setSessionId(response.data.sessionId)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to initialize canvas")
    } finally {
      setLoading(false)
    }
  }

  const resetCanvas = () => {
    setSessionId(null)
    setError("")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">🎨 Canvas Builder</h1>
          <p className="text-gray-600 mt-2">Create beautiful designs and export them as PDF</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!sessionId ? (
          <div className="flex justify-center">
            <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Initialize Your Canvas</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canvas Width:</label>
                  <input
                    type="number"
                    min="100"
                    max="2000"
                    value={canvasDimensions.width}
                    onChange={(e) =>
                      setCanvasDimensions((prev) => ({
                        ...prev,
                        width: Number.parseInt(e.target.value) || 800,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canvas Height:</label>
                  <input
                    type="number"
                    min="100"
                    max="2000"
                    value={canvasDimensions.height}
                    onChange={(e) =>
                      setCanvasDimensions((prev) => ({
                        ...prev,
                        height: Number.parseInt(e.target.value) || 600,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
                )}

                <button
                  onClick={initializeCanvas}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  {loading ? "Initializing..." : "Create Canvas"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <CanvasBuilder
            sessionId={sessionId}
            apiBase={API_BASE}
            canvasDimensions={canvasDimensions}
            onReset={resetCanvas}
          />
        )}
      </main>
    </div>
  )
}

export default App
