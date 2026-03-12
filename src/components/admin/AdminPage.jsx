import { useState, useEffect } from 'react'
import BookCard from '../library/BookCard'
import './AdminPage.css'

function AdminPage({ admin, onBack }) {
  const [activeTab, setActiveTab] = useState('books')

  useEffect(() => {
    if (admin.selectedUser && activeTab === 'lists') {
      admin.fetchUserLists(admin.selectedUser)
    }
  }, [admin.selectedUser, activeTab])

  const getBooksOnList = (list, allBooks) => {
    return list.bookIds.map(bookId => {
      const book = allBooks.find(b => b.id === bookId)
      return book || { id: bookId, title: 'Missing Book', author: 'Unknown' }
    })
  }

  const selectedUserData = admin.users.find(u => u.uid === admin.selectedUser)

  if (admin.selectedList) {
    const list = admin.userLists.find(l => l.id === admin.selectedList)
    const booksOnList = list ? getBooksOnList(list, admin.userBooks) : []
    
    return (
      <div className="app">
        <div className="admin-page">
          <header className="admin-header">
            <button className="admin-back" onClick={admin.clearSelectedList}>
              ←
            </button>
            <h1>{list?.name || 'List'}</h1>
          </header>
          
          <div className="admin-content">
            {admin.loading ? (
              <div className="admin-loading">
                <div className="loading-spinner" />
              </div>
            ) : (
              <div className="admin-books">
                {booksOnList.length === 0 ? (
                  <div className="admin-empty">No books on this list</div>
                ) : (
                  booksOnList.map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onClick={() => {}}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (admin.selectedUser) {
    return (
      <div className="app">
        <div className="admin-page">
          <header className="admin-header">
            <button className="admin-back" onClick={admin.clearSelectedUser}>
              ←
            </button>
            <h1>{selectedUserData?.email || 'User'}</h1>
          </header>

          <div className="admin-tabs">
            <button 
              className={`admin-tab ${activeTab === 'books' ? 'active' : ''}`}
              onClick={() => setActiveTab('books')}
            >
              Books
            </button>
            <button 
              className={`admin-tab ${activeTab === 'lists' ? 'active' : ''}`}
              onClick={() => setActiveTab('lists')}
            >
              Lists
            </button>
          </div>
          
          <div className="admin-content">
            {admin.loading ? (
              <div className="admin-loading">
                <div className="loading-spinner" />
              </div>
            ) : activeTab === 'books' ? (
              <div className="admin-books">
                {admin.userBooks.length === 0 ? (
                  <div className="admin-empty">No books</div>
                ) : (
                  admin.userBooks.map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onClick={() => {}}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="admin-lists">
                {admin.userLists.length === 0 ? (
                  <div className="admin-empty">No lists</div>
                ) : (
                  admin.userLists.map(list => (
                    <button
                      key={list.id}
                      className="admin-list-item"
                      onClick={() => admin.setSelectedList(list.id)}
                    >
                      <div className="admin-list-name">{list.name}</div>
                      <div className="admin-list-count">{list.bookIds?.length || 0} books</div>
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

  return (
    <div className="app">
      <div className="admin-page">
        <header className="admin-header">
          <button className="admin-back" onClick={onBack}>
            ← Library
          </button>
          <h1>Admin Panel</h1>
        </header>

        <div className="admin-content">
          {admin.loading ? (
            <div className="admin-loading">
              <div className="loading-spinner" />
            </div>
          ) : (
            <div className="admin-users">
              {admin.users.length === 0 ? (
                <div className="admin-empty">No users</div>
              ) : (
                admin.users.map(u => (
                  <button
                    key={u.uid}
                    className="admin-user-item"
                    onClick={() => admin.fetchUserBooks(u.uid)}
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

export default AdminPage
