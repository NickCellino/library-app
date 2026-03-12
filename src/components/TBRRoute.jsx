import { useNavigate } from 'react-router-dom'
import TBRListsPage from './TBRListsPage'
import { useAuth } from '../hooks/useAuth'
import { useLists } from '../hooks/useLists'

function TBRRoute() {
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
          <p>Please sign in to view your TBR lists</p>
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

  const handleSelectTBRList = (tbrList) => {
    navigate(`/list/${tbrList.id}`)
  }

  const handleCreateTBRList = async (name) => {
    await addList(name)
  }

  return (
    <TBRListsPage
      tbrLists={lists}
      onBack={handleBack}
      onSelectTBRList={handleSelectTBRList}
      onCreateTBRList={handleCreateTBRList}
      loading={listsLoading}
    />
  )
}

export default TBRRoute
