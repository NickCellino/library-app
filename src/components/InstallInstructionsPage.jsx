import { Link } from 'react-router-dom'
import './InstallInstructionsPage.css'

function InstallInstructionsPage() {
  return (
    <div className="install-page">
      <div className="install-page-container">
        <Link to="/" className="install-back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Library
        </Link>

        <h1 className="install-page-title">Install as App</h1>

        <div className="install-content">
          <div className="install-intro">
            <p>Add Library to your iPhone home screen for quick access and an app-like experience.</p>
          </div>

          <div className="install-steps">
            <div className="install-step">
              <div className="install-step-number">1</div>
              <div className="install-step-content">
                <h3>Open in Safari</h3>
                <p>Make sure you're viewing this page in Safari (not Chrome or other browsers)</p>
              </div>
            </div>

            <div className="install-step">
              <div className="install-step-number">2</div>
              <div className="install-step-content">
                <h3>Tap the Share button</h3>
                <p>Look for the <span className="install-icon">⬆️</span> share icon at the bottom (or top) of Safari</p>
              </div>
            </div>

            <div className="install-step">
              <div className="install-step-number">3</div>
              <div className="install-step-content">
                <h3>Select "Add to Home Screen"</h3>
                <p>Scroll down the share menu and tap "Add to Home Screen"</p>
              </div>
            </div>

            <div className="install-step">
              <div className="install-step-number">4</div>
              <div className="install-step-content">
                <h3>Tap "Add"</h3>
                <p>Confirm to add the Library app icon to your home screen</p>
              </div>
            </div>
          </div>

          <div className="install-note">
            <p><strong>Note:</strong> Once installed, open the app from your home screen to use it like a native app.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstallInstructionsPage
