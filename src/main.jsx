import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import InstallInstructionsPage from './components/InstallInstructionsPage.jsx'
import ListDetailRoute from './components/ListDetailRoute.jsx'
import ListsRoute from './components/ListsRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/install" element={<InstallInstructionsPage />} />
        <Route path="/lists" element={<ListsRoute />} />
        <Route path="/list/:listId" element={<ListDetailRoute />} />
        <Route path="/admin" element={<AdminRoute />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
