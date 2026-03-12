import { useState, useMemo } from 'react'
import BookList from '../library/BookList'
import AddToTBRListModal from './AddToTBRListModal'
import DeleteTBRListConfirmModal from './DeleteTBRListConfirmModal'
import './TBRListDetailPage.css'

function TBRListDetailPage({ 
  tbrList, 
  books, 
  onBack, 
  onRemoveBook, 
  onUpdateTBRListName, 
  onDeleteTBRList,
  addBookToTBRList,
  addBook
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const tbrListBooks = useMemo(() => {
    if (!tbrList) return []
    return books.filter(book => tbrList.bookIds.includes(book.id))
  }, [tbrList, books])

  const totalBooks = tbrListBooks.length
  const totalAuthors = useMemo(() => {
    const authors = new Set(tbrListBooks.map(book => book.author || 'Unknown Author'))
    return authors.size
  }, [tbrListBooks])

  if (!tbrList) return null

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
    <div className="tbr-detail-page">
      <header className="tbr-detail-header">
        <div className="container">
          <div className="tbr-detail-header-content">
            <button className="tbr-detail-back-btn" onClick={onBack}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            
            {editing ? (
              <div className="tbr-detail-edit-form">
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
                <div className="tbr-detail-edit-actions">
                  <button 
                    className="tbr-detail-edit-cancel"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button 
                    className="tbr-detail-edit-save"
                    onClick={handleSaveEdit}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {error && <div className="tbr-detail-edit-error">{error}</div>}
              </div>
            ) : (
              <h1 className="tbr-detail-title" onClick={handleStartEdit}>
                {tbrList.name}
                <span className="tbr-detail-edit-icon">✏️</span>
              </h1>
            )}
          </div>
        </div>
      </header>

      <div className="container">
        <div className="tbr-detail-actions">
          <button className="tbr-detail-add-btn" onClick={() => setShowAddModal(true)}>
            Add Books
          </button>
          <button 
            className="tbr-detail-delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete TBR List
          </button>
        </div>
      </div>

      <main className="tbr-detail-main">
        <div className="container">
          {tbrListBooks.length === 0 ? (
            <div className="tbr-detail-empty">
              <div className="tbr-detail-empty-icon">📚</div>
              <p className="tbr-detail-empty-title">No books in this TBR list</p>
              <p className="tbr-detail-empty-subtitle">Add books to get started</p>
            </div>
          ) : (
            <BookList
              books={tbrListBooks}
              onBookClick={() => {}}
              totalBooks={totalBooks}
              totalAuthors={totalAuthors}
              showRemove={true}
              onRemove={(bookId) => onRemoveBook(bookId)}
            />
          )}
        </div>
      </main>

      {showAddModal && (
        <AddToTBRListModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          tbrList={tbrList}
          books={books}
          onAddBook={(bookId) => addBookToTBRList(tbrList.id, bookId)}
          onAddNewBook={async (book) => {
            await addBook(book)
            await addBookToTBRList(tbrList.id, book.id)
          }}
        />
      )}

      {showDeleteConfirm && (
        <DeleteTBRListConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => onDeleteTBRList()}
          tbrList={tbrList}
          books={books}
        />
      )}
    </div>
  )
}

export default TBRListDetailPage
