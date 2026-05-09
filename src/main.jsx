import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import ElijahCharoPortfolio from './App'
import LandingPageGenerator from './tools/LandingPageGenerator'

function Root() {
  const normalizedPath = window.location.pathname.replace(/\/$/, '') || '/'

  if (normalizedPath === '/tools/landing-page-generator') {
    return <LandingPageGenerator />
  }

  return <ElijahCharoPortfolio />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
