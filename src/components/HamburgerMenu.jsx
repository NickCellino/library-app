import { useEffect, useState } from 'react'

function HamburgerMenu({ isOpen, onClose, onAddBook, onSearchBooks, onLoadTestData, onClearAll, hasBooks, user, onSignOut, isAdmin, onOpenAdmin, onTestVision, onShowLists }) {
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
          <button className="hamburger-item" onClick={() => handleAction(onSearchBooks)}>
            <span className="hamburger-icon">🔍</span>
            Add Book (Search)
          </button>

          <button className="hamburger-item" onClick={() => handleAction(onAddBook)}>
            <span className="hamburger-icon">📖</span>
            Add Book (Manual)
          </button>

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

          <button className="hamburger-item" onClick={() => handleAction(onShowLists)}>
            <span className="hamburger-icon">📚</span>
            My Lists
          </button>

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
