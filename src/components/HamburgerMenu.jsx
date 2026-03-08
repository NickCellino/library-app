import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Modern, minimal wireframe-style SVG icons
const Icons = {
  lists: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  book: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  testTube: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2.5H9.5a1 1 0 0 0-1 1v11.06a5 5 0 0 0 2.25 4.18l.14.09a4 4 0 0 0 4.22 0l.14-.09a5 5 0 0 0 2.25-4.18v-11.06a1 1 0 0 0-1-1z"/>
      <path d="M9.5 6h5"/>
      <path d="M9.5 10h5"/>
    </svg>
  ),
  trash: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  camera: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  ),
  signOut: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" x2="9" y1="12" y2="12"/>
    </svg>
  ),
}

function HamburgerMenu({ isOpen, onClose, onAddBook, onSearchBooks, onLoadTestData, onClearAll, hasBooks, user, onSignOut, isAdmin, onTestVision, onShowLists }) {
  const [showDevTools, setShowDevTools] = useState(false)
  const navigate = useNavigate()

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
          <button className="hamburger-item" onClick={() => handleAction(onShowLists)}>
            <span className="hamburger-icon">{Icons.lists}</span>
            My Lists
          </button>

          <button className="hamburger-item" onClick={() => handleAction(onSearchBooks)}>
            <span className="hamburger-icon">{Icons.search}</span>
            Add Book (Search)
          </button>

          <button className="hamburger-item" onClick={() => handleAction(onAddBook)}>
            <span className="hamburger-icon">{Icons.book}</span>
            Add Book (Manual)
          </button>

          {isAdmin && (
            <>
              <div className="hamburger-divider" />

              <button
                className="hamburger-item hamburger-dev-toggle"
                onClick={() => setShowDevTools(!showDevTools)}
              >
                <span className="hamburger-icon">{Icons.settings}</span>
                Dev Tools
                <span className={`hamburger-chevron ${showDevTools ? 'open' : ''}`}>›</span>
              </button>

              {showDevTools && (
                <div className="hamburger-dev-section">
                  <button className="hamburger-item hamburger-item-sub" onClick={() => handleAction(onLoadTestData)}>
                    <span className="hamburger-icon">{Icons.testTube}</span>
                    Load Test Data
                  </button>

                  {hasBooks && (
                    <button className="hamburger-item hamburger-item-sub hamburger-item-danger" onClick={() => handleAction(onClearAll)}>
                      <span className="hamburger-icon">{Icons.trash}</span>
                      Clear All Books
                    </button>
                  )}

                  <button className="hamburger-item hamburger-item-sub" onClick={() => { onClose(); navigate('/admin'); }}>
                    <span className="hamburger-icon">{Icons.user}</span>
                    Admin Panel
                  </button>

                  <button className="hamburger-item hamburger-item-sub" onClick={() => handleAction(onTestVision)}>
                    <span className="hamburger-icon">{Icons.camera}</span>
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
              <span className="hamburger-icon">{Icons.signOut}</span>
              Sign Out
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default HamburgerMenu
