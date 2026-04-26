import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './App.css'

const RANGE_OPTIONS = [
  { value: '1m', label: '1 Month' },
  { value: '7d', label: '7 Days' },
  { value: '1d', label: '1 Day' },
  { value: '1h', label: '1 Hour' },
]

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

function App() {
  const [selectedRange, setSelectedRange] = useState('1d')
  const [stocks, setStocks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchTrendingStocks = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await axios.get(`${API_BASE_URL}/api/stocks/trending`, {
          params: { range: selectedRange },
        })
        setStocks(response.data)
      } catch (error) {
        const serverData = error.response?.data
        const detailedError = serverData?.details?.[0]?.message
        const serverError = serverData?.error
        setErrorMessage(detailedError || serverError || 'Could not load trending stocks.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendingStocks()
  }, [selectedRange])

  const topStock = useMemo(() => {
    if (stocks.length === 0) return null
    return stocks[0]
  }, [stocks])

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(price)

  const formatTrend = (trend) => `${trend >= 0 ? '+' : ''}${trend.toFixed(2)}%`

  return (
    <main className="app">
      <header className="app-header">
        <p className="kicker">Stock Bros</p>
        <h1>Trending Stocks</h1>
        <p className="subtitle">
          Track top momentum and pick the strongest uptrend across time ranges.
        </p>
      </header>

      <section className="range-selector" aria-label="Select trend range">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={selectedRange === option.value ? 'active' : ''}
            onClick={() => setSelectedRange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </section>

      {isLoading ? (
        <p className="status">Loading trending stocks...</p>
      ) : errorMessage ? (
        <p className="status error">{errorMessage}</p>
      ) : (
        <>
          {topStock && (
            <section className="top-stock">
              <p className="label">Most Uptrend ({RANGE_OPTIONS.find((x) => x.value === selectedRange)?.label})</p>
              <div className="top-stock-row">
                <h2>{topStock.symbol}</h2>
                <span className={topStock.trend >= 0 ? 'trend positive' : 'trend negative'}>
                  {formatTrend(topStock.trend)}
                </span>
              </div>
              <p className="price">{formatPrice(topStock.latest)}</p>
            </section>
          )}

          <section className="stock-list">
            <div className="stock-list-header">
              <span>Symbol</span>
              <span>Price</span>
              <span>Trend</span>
            </div>
            {stocks.map((stock) => (
              <article key={stock.symbol} className="stock-row">
                <span className="symbol">{stock.symbol}</span>
                <span>{formatPrice(stock.latest)}</span>
                <span className={stock.trend >= 0 ? 'trend positive' : 'trend negative'}>
                  {formatTrend(stock.trend)}
                </span>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  )
}

export default App
