import { useState } from 'react'
import { formatRelativeTime } from '../utils/dateUtils'
import './ListsViewModal.css'

function ListsViewModal({ isOpen, onClose, lists, onSelectList, onCreateList, onDeleteList, loading }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!newListName.trim()) return

    setCreating(true)
    setError('')
    try {
      await onCreateList(newListName.trim())
      setNewListName('')
      setShowCreateForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteClick = (e, list) => {
    e.stopPropagation()
    onDeleteList(list)
  }

  return (
    <div className="lists-overlay" onClick={handleBackdropClick}>
      <div className="lists-modal">
        <button className="lists-close" onClick={onClose}>×</button>

        <div className="lists-header">
          <h2>My Lists</h2>
          {!showCreateForm && (
            <button 
              className="lists-create-btn"
              onClick={() => setShowCreateForm(true)}
            >
              +
            </button>
          )}
        </div>

        {showCreateForm && (
          <form className="lists-create-form" onSubmit={handleCreateList}>
            <input
              type="text"
              placeholder="List name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              maxLength={128}
              autoFocus
              disabled={creating}
            />
            <div className="lists-create-actions">
              <button 
                type="button" 
                className="lists-create-cancel"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewListName('')
                  setError('')
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="lists-create-submit"
                disabled={!newListName.trim() || creating}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
            {error && <div className="lists-create-error">{error}</div>}
          </form>
        )}

        <div className="lists-content">
          {loading ? (
            <div className="lists-loading">Loading...</div>
          ) : lists.length === 0 ? (
            <div className="lists-empty">
              <div className="lists-empty-icon">📚</div>
              <p className="lists-empty-title">No lists yet</p>
              <p className="lists-empty-subtitle">Create your first list to organize your books</p>
              {!showCreateForm && (
                <button 
                  className="lists-empty-btn"
                  onClick={() => setShowCreateForm(true)}
                >
                  Create List
                </button>
              )}
            </div>
          ) : (
            <div className="lists-items">
              {lists.map(list => (
                <div 
                  key={list.id} 
                  className="lists-item"
                  onClick={() => onSelectList(list)}
                >
                  <div className="lists-item-info">
                    <div className="lists-item-name">{list.name}</div>
                    <div className="lists-item-meta">
                      <span>{list.bookIds.length} {list.bookIds.length === 1 ? 'book' : 'books'}</span>
                      <span className="lists-item-separator">·</span>
                      <span>{formatRelativeTime(list.updatedAt)}</span>
                    </div>
                  </div>
                  <button 
                    className="lists-item-delete"
                    onClick={(e) => handleDeleteClick(e, list)}
                    title="Delete list"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ListsViewModal
