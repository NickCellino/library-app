import { useParams, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import TBRListDetailPage from './TBRListDetailPage'
import { useAuth } from '../../hooks/useAuth'
import { useBooks } from '../../hooks/useBooks'
import { useLists } from '../../hooks/useLists'

function TBRListDetailRoute() {
  const { listId } = useParams()
  const navigate = useNavigate()
  
  const { user, loading: authLoading } = useAuth()
  const { books, loading: booksLoading, addBook } = useBooks(user)
  const { 
    lists, 
    loading: listsLoading, 
    updateList, 
    deleteList, 
    addBookToList, 
    removeBookFromList 
  } = useLists(user)

  const tbrList = useMemo(() => {
    return lists.find(l => l.id === listId)
  }, [lists, listId])

  // Show loading state while any data is loading
  if (authLoading || booksLoading || listsLoading) {
    return (
      <div className="app">
        <div className="loading-state">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  // Not signed in - show sign in prompt
  if (!user) {
    return (
      <div className="app">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h2>Sign in required</h2>
          <p>Please sign in to view this TBR list</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Go to Library
          </button>
        </div>
      </div>
    )
  }

  // TBR List not found - show helpful message instead of redirecting
  if (!tbrList) {
    return (
      <div className="app">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2>TBR list not found</h2>
          <p>This TBR list may have been deleted or you don't have access to it</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Back to Library
          </button>
        </div>
      </div>
    )
  }

  const handleBack = () => {
    navigate('/lists')
  }

  const handleDeleteTBRList = async () => {
    await deleteList(listId)
    navigate('/lists')
  }

  return (
    <TBRListDetailPage
      tbrList={tbrList}
      books={books}
      onBack={handleBack}
      onRemoveBook={(bookId) => removeBookFromList(listId, bookId)}
      onUpdateTBRListName={updateList}
      onDeleteTBRList={handleDeleteTBRList}
      addBookToTBRList={addBookToList}
      addBook={addBook}
    />
  )
}

export default TBRListDetailRoute
