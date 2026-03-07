import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import InstallInstructionsPage from './components/InstallInstructionsPage.jsx'
import ListDetailRoute from './components/ListDetailRoute.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/install" element={<InstallInstructionsPage />} />
        <Route path="/list/:listId" element={<ListDetailRoute />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
