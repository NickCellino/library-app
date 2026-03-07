import { useState, useMemo } from 'react'
import BookList from './BookList'
import './ListDetailModal.css'

function ListDetailModal({ isOpen, onClose, list, books, onAddBooks, onRemoveBook, onUpdateListName, onDeleteList }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const listBooks = useMemo(() => {
    if (!list) return []
    return books.filter(book => list.bookIds.includes(book.id))
  }, [list, books])

  const totalBooks = listBooks.length
  const totalAuthors = useMemo(() => {
    const authors = new Set(listBooks.map(book => book.author || 'Unknown Author'))
    return authors.size
  }, [listBooks])

  if (!isOpen || !list) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleStartEdit = () => {
    setEditName(list.name)
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
      setError('List name cannot be empty')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onUpdateListName({ ...list, name: editName.trim() })
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="list-detail-overlay" onClick={handleBackdropClick}>
      <div className="list-detail-modal">
        <button className="list-detail-close" onClick={onClose}>×</button>

        <div className="list-detail-header">
          {editing ? (
            <div className="list-detail-edit-form">
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
              <div className="list-detail-edit-actions">
                <button 
                  className="list-detail-edit-cancel"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  className="list-detail-edit-save"
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
              {error && <div className="list-detail-edit-error">{error}</div>}
            </div>
          ) : (
            <h2 className="list-detail-title" onClick={handleStartEdit}>
              {list.name}
              <span className="list-detail-edit-icon">✏️</span>
            </h2>
          )}
        </div>

        <div className="list-detail-actions">
          <button className="list-detail-add-btn" onClick={onAddBooks}>
            Add Books
          </button>
        </div>

        <div className="list-detail-content">
          {listBooks.length === 0 ? (
            <div className="list-detail-empty">
              <div className="list-detail-empty-icon">📚</div>
              <p className="list-detail-empty-title">No books in this list</p>
              <p className="list-detail-empty-subtitle">Add books to get started</p>
            </div>
          ) : (
            <BookList
              books={listBooks}
              onBookClick={() => {}}
              totalBooks={totalBooks}
              totalAuthors={totalAuthors}
              showRemove={true}
              onRemove={onRemoveBook}
            />
          )}
        </div>

        <div className="list-detail-footer">
          <button 
            className="list-detail-delete-btn"
            onClick={() => onDeleteList()}
          >
            Delete List
          </button>
        </div>
      </div>
    </div>
  )
}

export default ListDetailModal
