import { useRef, useEffect, useState } from 'react'

function HamburgerMenu({ isOpen, onClose, onAddBook, onImport, onExport, onLoadTestData, onClearAll, hasBooks, user, onSignOut, isAdmin, onOpenAdmin }) {
  const fileInputRef = useRef(null)
  const [showDevTools, setShowDevTools] = useState(false)

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

  if (!isOpen) return null

  return (
    <div className="hamburger-overlay" onClick={onClose}>
      <div className="hamburger-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="hamburger-close" onClick={onClose} aria-label="Close menu">
          ✕
        </button>

        <nav className="hamburger-nav">
          <button className="hamburger-item" onClick={() => handleAction(onAddBook)}>
            <span className="hamburger-icon">📖</span>
            Add Book
          </button>

          <button className="hamburger-item" onClick={handleImportClick}>
            <span className="hamburger-icon">📥</span>
            Import Library
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {hasBooks && (
            <button className="hamburger-item" onClick={() => handleAction(onExport)}>
              <span className="hamburger-icon">📤</span>
              Export Library
            </button>
          )}

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
