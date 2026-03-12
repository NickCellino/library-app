import { useState, useMemo } from 'react'
import BookList from './BookList'
import './TBRDetailModal.css'

function TBRDetailModal({ isOpen, onClose, tbrList, books, onAddBooks, onRemoveBook, onUpdateTBRListName, onDeleteTBRList }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const tbrListBooks = useMemo(() => {
    if (!tbrList) return []
    return books.filter(book => tbrList.bookIds.includes(book.id))
  }, [tbrList, books])

  const totalBooks = tbrListBooks.length
  const totalAuthors = useMemo(() => {
    const authors = new Set(tbrListBooks.map(book => book.author || 'Unknown Author'))
    return authors.size
  }, [tbrListBooks])

  if (!isOpen || !tbrList) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleStartEdit = () => {
    setEditName(tbrList.name)
    setEditing(true)
    setError('')
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditName('')
    setError('')
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setError('TBR list name cannot be empty')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onUpdateTBRListName({ ...tbrList, name: editName.trim() })
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="tbr-detail-modal-overlay" onClick={handleBackdropClick}>
      <div className="tbr-detail-modal">
        <button className="tbr-detail-modal-close" onClick={onClose}>×</button>

        <div className="tbr-detail-modal-header">
          {editing ? (
            <div className="tbr-detail-modal-edit-form">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={128}
                autoFocus
                disabled={saving}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
              />
              <div className="tbr-detail-modal-edit-actions">
                <button 
                  className="tbr-detail-modal-edit-cancel"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  className="tbr-detail-modal-edit-save"
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
              {error && <div className="tbr-detail-modal-edit-error">{error}</div>}
            </div>
          ) : (
            <h2 className="tbr-detail-modal-title" onClick={handleStartEdit}>
              {tbrList.name}
              <span className="tbr-detail-modal-edit-icon">✏️</span>
            </h2>
          )}
        </div>

        <div className="tbr-detail-modal-actions">
          <button className="tbr-detail-modal-add-btn" onClick={onAddBooks}>
            Add Books
          </button>
        </div>

        <div className="tbr-detail-modal-content">
          {tbrListBooks.length === 0 ? (
            <div className="tbr-detail-modal-empty">
              <div className="tbr-detail-modal-empty-icon">📚</div>
              <p className="tbr-detail-modal-empty-title">No books in this TBR list</p>
              <p className="tbr-detail-modal-empty-subtitle">Add books to get started</p>
            </div>
          ) : (
            <BookList
              books={tbrListBooks}
              onBookClick={() => {}}
              totalBooks={totalBooks}
              totalAuthors={totalAuthors}
              showRemove={true}
              onRemove={onRemoveBook}
            />
          )}
        </div>

        <div className="tbr-detail-modal-footer">
          <button 
            className="tbr-detail-modal-delete-btn"
            onClick={() => onDeleteTBRList()}
          >
            Delete TBR List
          </button>
        </div>
      </div>
    </div>
  )
}

export default TBRDetailModal
