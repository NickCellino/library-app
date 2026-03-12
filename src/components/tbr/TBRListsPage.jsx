import { useState } from 'react'
import { formatRelativeTime } from '../../utils/dateUtils'
import './TBRListsPage.css'

function TBRListsPage({ tbrLists, onBack, onSelectTBRList, onCreateTBRList, loading }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTBRListName, setNewTBRListName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreateTBRList = async (e) => {
    e.preventDefault()
    if (!newTBRListName.trim()) return

    setCreating(true)
    setError('')
    try {
      await onCreateTBRList(newTBRListName.trim())
      setNewTBRListName('')
      setShowCreateForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <button
              className="header-back-btn"
              onClick={onBack}
              aria-label="Back to library"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="logo">My TBR Lists</h1>
            <div className="header-right">
              {!showCreateForm && (
                <button 
                  className="tbr-lists-add-btn"
                  onClick={() => setShowCreateForm(true)}
                >
                  Add TBR List
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {showCreateForm && (
            <form className="tbr-lists-create-form" onSubmit={handleCreateTBRList}>
              <input
                type="text"
                placeholder="TBR list name..."
                value={newTBRListName}
                onChange={(e) => setNewTBRListName(e.target.value)}
                maxLength={128}
                autoFocus
                disabled={creating}
              />
              <div className="tbr-lists-create-actions">
                <button 
                  type="button" 
                  className="tbr-lists-create-cancel"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewTBRListName('')
                    setError('')
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="tbr-lists-create-submit"
                  disabled={!newTBRListName.trim() || creating}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
              {error && <div className="tbr-lists-create-error">{error}</div>}
            </form>
          )}

          <div className="tbr-lists-content">
            {loading ? (
              <div className="tbr-lists-loading">Loading...</div>
            ) : tbrLists.length === 0 ? (
              <div className="tbr-lists-empty">
                <div className="tbr-lists-empty-icon">📚</div>
                <p className="tbr-lists-empty-title">No TBR lists yet</p>
                <p className="tbr-lists-empty-subtitle">Create your first TBR list to organize your books</p>
              </div>
            ) : (
              <div className="tbr-lists-items">
                {tbrLists.map(tbrList => (
                  <div 
                    key={tbrList.id} 
                    className="tbr-lists-item"
                    onClick={() => onSelectTBRList(tbrList)}
                  >
                    <div className="tbr-lists-item-info">
                      <div className="tbr-lists-item-name">{tbrList.name}</div>
                      <div className="tbr-lists-item-meta">
                        <span>{tbrList.bookIds.length} {tbrList.bookIds.length === 1 ? 'book' : 'books'}</span>
                        <span className="tbr-lists-item-separator">·</span>
                        <span>{formatRelativeTime(tbrList.updatedAt)}</span>
                      </div>
                    </div>
                    <svg 
                      className="tbr-lists-item-arrow" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default TBRListsPage
