import { useEffect } from 'react'
import './AdminPanel.css'

function AdminPanel({ onClose, users, userBooks, loading, selectedUser, fetchUsers, fetchUserBooks, clearSelectedUser }) {
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const selectedUserData = users.find(u => u.uid === selectedUser)

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>
        <button className="admin-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2 className="admin-title">
          {selectedUser ? (
            <>
              <button className="admin-back" onClick={clearSelectedUser} aria-label="Back">
                ←
              </button>
              {selectedUserData?.email || 'User Books'}
            </>
          ) : (
            'Admin Panel'
          )}
        </h2>

        <div className="admin-content">
          {loading ? (
            <div className="admin-loading">
              <div className="loading-spinner" />
            </div>
          ) : selectedUser ? (
            <div className="admin-books">
              {userBooks.length === 0 ? (
                <div className="admin-empty">No books</div>
              ) : (
                userBooks.map(book => (
                  <div key={book.id} className="admin-book-item">
                    <div className="admin-book-title">{book.title}</div>
                    <div className="admin-book-author">{book.author}</div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="admin-users">
              {users.length === 0 ? (
                <div className="admin-empty">No users</div>
              ) : (
                users.map(u => (
                  <button
                    key={u.uid}
                    className="admin-user-item"
                    onClick={() => fetchUserBooks(u.uid)}
                  >
                    <div className="admin-user-email">{u.email}</div>
                    <div className="admin-user-count">{u.bookCount || 0} books</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
