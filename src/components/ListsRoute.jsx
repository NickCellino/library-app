import { useNavigate } from 'react-router-dom'
import ListsPage from './ListsPage'
import { useAuth } from '../hooks/useAuth'
import { useLists } from '../hooks/useLists'

function ListsRoute() {
  const navigate = useNavigate()
  
  const { user, loading: authLoading } = useAuth()
  const { 
    lists, 
    loading: listsLoading, 
    addList
  } = useLists(user)

  // Show loading state while any data is loading
  if (authLoading || listsLoading) {
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
          <p>Please sign in to view your lists</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Go to Library
          </button>
        </div>
      </div>
    )
  }

  const handleBack = () => {
    navigate('/')
  }

  const handleSelectList = (list) => {
    navigate(`/list/${list.id}`)
  }

  const handleCreateList = async (name) => {
    await addList(name)
  }

  return (
    <ListsPage
      lists={lists}
      onBack={handleBack}
      onSelectList={handleSelectList}
      onCreateList={handleCreateList}
      loading={listsLoading}
    />
  )
}

export default ListsRoute
