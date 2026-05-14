import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { PrivacyPage } from './pages/PrivacyPage.tsx'
import { TermsPage } from './pages/TermsPage.tsx'
import './index.css'

const path = window.location.pathname

let Page: React.ReactNode
if (path === '/privacy') {
  Page = <PrivacyPage />
} else if (path === '/terms') {
  Page = <TermsPage />
} else {
  Page = <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{Page}</React.StrictMode>,
)
