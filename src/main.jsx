import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
// Must load before any slice fires a request: enables cookie auth + 401 auto-logout
import './utils/api'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </Provider>
)
