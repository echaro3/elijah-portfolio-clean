import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import ElijahCharoPortfolio from './App'
import { initializeAnalytics } from '../transitionplanner/src/analytics'
import '../transitionplanner/src/analytics.css'

initializeAnalytics()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ElijahCharoPortfolio />
  </React.StrictMode>
)
