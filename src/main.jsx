import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import InstallInstructionsPage from './components/InstallInstructionsPage.jsx'
import TBRDetailRoute from './components/TBRDetailRoute.jsx'
import TBRRoute from './components/TBRRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/install" element={<InstallInstructionsPage />} />
        <Route path="/lists" element={<TBRRoute />} />
        <Route path="/list/:listId" element={<TBRDetailRoute />} />
        <Route path="/admin" element={<AdminRoute />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
