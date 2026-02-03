import { useRef, useEffect, useState } from 'react'
import { loadSoundPreferences, saveSoundPreferences } from '../utils/soundManager'

function HamburgerMenu({ isOpen, onClose, onAddBook, onSearchBooks, onImport, onExport, onLoadTestData, onClearAll, hasBooks, user, onSignOut, isAdmin, onOpenAdmin, onTestVision }) {
  const fileInputRef = useRef(null)
  const [showDevTools, setShowDevTools] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    const prefs = loadSoundPreferences()
    setSoundEnabled(prefs.enabled)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    onImport(e)
    onClose()
  }

  const handleAction = (action) => {
    action()
    onClose()
  }

  const handleSoundToggle = () => {
    const newState = !soundEnabled
    setSoundEnabled(newState)
    saveSoundPreferences(newState, null)
  }

  if (!isOpen) return null

  return (
    <div className="hamburger-overlay" onClick={onClose}>
      <div className="hamburger-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="hamburger-close" onClick={onClose} aria-label="Close menu">
          ✕
        </button>

        <nav className="hamburger-nav">
          <button className="hamburger-item" onClick={() => handleAction(onSearchBooks)}>
            <span className="hamburger-icon">🔍</span>
            Add Book (Search)
          </button>

          <button className="hamburger-item" onClick={() => handleAction(onAddBook)}>
            <span className="hamburger-icon">📖</span>
            Add Book (Manual)
          </button>

          <div className="hamburger-divider" />

          <div className="hamburger-item hamburger-toggle" onClick={handleSoundToggle}>
            <span className="hamburger-icon">{soundEnabled ? '🔔' : '🔕'}</span>
            <span className="hamburger-toggle-label">Scan Sound</span>
            <div className={`hamburger-toggle-switch ${soundEnabled ? 'on' : ''}`}>
              <span className="hamburger-toggle-knob" />
            </div>
          </div>

          <div className="hamburger-divider" />

          {isAdmin && (
            <>
              <div className="hamburger-divider" />

              <button
                className="hamburger-item hamburger-dev-toggle"
                onClick={() => setShowDevTools(!showDevTools)}
              >
                <span className="hamburger-icon">⚙️</span>
                Dev Tools
                <span className={`hamburger-chevron ${showDevTools ? 'open' : ''}`}>›</span>
              </button>

              {showDevTools && (
                <div className="hamburger-dev-section">
                  <button className="hamburger-item hamburger-item-sub" onClick={() => handleAction(onLoadTestData)}>
                    <span className="hamburger-icon">🧪</span>
                    Load Test Data
                  </button>

                  {hasBooks && (
                    <button className="hamburger-item hamburger-item-sub hamburger-item-danger" onClick={() => handleAction(onClearAll)}>
                      <span className="hamburger-icon">🗑️</span>
                      Clear All Books
                    </button>
                  )}

                  <button className="hamburger-item hamburger-item-sub" onClick={() => handleAction(onOpenAdmin)}>
                    <span className="hamburger-icon">👤</span>
                    Admin Panel
                  </button>

                  <button className="hamburger-item hamburger-item-sub" onClick={() => handleAction(onTestVision)}>
                    <span className="hamburger-icon">📷</span>
                    Test Book Vision
                  </button>
                </div>
              )}
            </>
          )}

          <div className="hamburger-divider" />

          <div className="hamburger-auth-section">
            <div className="hamburger-user-info">
              <span className="hamburger-user-email">{user.email}</span>
              <span className="hamburger-sync-status">Synced</span>
            </div>
            <button className="hamburger-item" onClick={() => handleAction(onSignOut)}>
              <span className="hamburger-icon">🚪</span>
              Sign Out
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default HamburgerMenu
