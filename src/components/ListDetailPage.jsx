import { useState, useMemo } from 'react'
import BookList from './BookList'
import AddToListModal from './AddToListModal'
import DeleteListConfirmModal from './DeleteListConfirmModal'
import './ListDetailPage.css'

function ListDetailPage({ 
  list, 
  books, 
  onBack, 
  onRemoveBook, 
  onUpdateListName, 
  onDeleteList,
  addBookToList,
  addBook
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const listBooks = useMemo(() => {
    if (!list) return []
    return books.filter(book => list.bookIds.includes(book.id))
  }, [list, books])

  const totalBooks = listBooks.length
  const totalAuthors = useMemo(() => {
    const authors = new Set(listBooks.map(book => book.author || 'Unknown Author'))
    return authors.size
  }, [listBooks])

  if (!list) return null

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
    <div className="list-detail-page">
      <header className="list-detail-header">
        <div className="container">
          <div className="list-detail-header-content">
            <button className="list-detail-back-btn" onClick={onBack}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            
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
              <h1 className="list-detail-title" onClick={handleStartEdit}>
                {list.name}
                <span className="list-detail-edit-icon">✏️</span>
              </h1>
            )}
          </div>
        </div>
      </header>

      <div className="container">
        <div className="list-detail-actions">
          <button className="list-detail-add-btn" onClick={() => setShowAddModal(true)}>
            Add Books
          </button>
          <button 
            className="list-detail-delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete List
          </button>
        </div>
      </div>

      <main className="list-detail-main">
        <div className="container">
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
              onRemove={(bookId) => onRemoveBook(bookId)}
            />
          )}
        </div>
      </main>

      {showAddModal && (
        <AddToListModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          list={list}
          books={books}
          onAddBook={(bookId) => addBookToList(list.id, bookId)}
          onAddNewBook={async (book) => {
            await addBook(book)
            await addBookToList(list.id, book.id)
          }}
        />
      )}

      {showDeleteConfirm && (
        <DeleteListConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => onDeleteList()}
          list={list}
          books={books}
        />
      )}
    </div>
  )
}

export default ListDetailPage
