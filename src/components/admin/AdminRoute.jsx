import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAdmin } from '../../hooks/useAdmin'
import { isAdmin } from '../../config/adminConfig'
import AdminPage from './AdminPage'

const isEmulatorMode = import.meta.env.VITE_USE_EMULATOR === 'true'

function AdminRoute() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const admin = useAdmin(user)
  
  const userIsAdmin = (user?.email && isAdmin(user.email)) || isEmulatorMode

  useEffect(() => {
    if (user && userIsAdmin) {
      admin.fetchUsers()
    }
  }, [user, userIsAdmin])

  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-state">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  if (!user) {
    navigate('/')
    return null
  }

  if (!userIsAdmin) {
    navigate('/')
    return null
  }

  return (
    <AdminPage 
      admin={admin}
      onBack={() => navigate('/')}
    />
  )
}

export default AdminRoute
