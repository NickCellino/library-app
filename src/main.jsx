import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import InstallInstructionsPage from './components/common/InstallInstructionsPage.jsx'
import TBRListDetailRoute from './components/tbr/TBRListDetailRoute.jsx'
import TBRListsRoute from './components/tbr/TBRListsRoute.jsx'
import AdminRoute from './components/admin/AdminRoute.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/install" element={<InstallInstructionsPage />} />
        <Route path="/lists" element={<TBRListsRoute />} />
        <Route path="/list/:listId" element={<TBRListDetailRoute />} />
        <Route path="/admin" element={<AdminRoute />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
