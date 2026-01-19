import { useRef, useEffect } from 'react'

function HamburgerMenu({ isOpen, onClose, onAddBook, onImport, onExport, onLoadTestData, onClearAll, hasBooks }) {
  const fileInputRef = useRef(null)

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

          <div className="hamburger-divider" />

          <button className="hamburger-item" onClick={() => handleAction(onLoadTestData)}>
            <span className="hamburger-icon">🧪</span>
            Load Test Data
          </button>

          {hasBooks && (
            <button className="hamburger-item hamburger-item-danger" onClick={() => handleAction(onClearAll)}>
              <span className="hamburger-icon">🗑️</span>
              Clear All Books
            </button>
          )}
        </nav>
      </div>
    </div>
  )
}

export default HamburgerMenu
