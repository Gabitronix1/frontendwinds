import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { WindsurfProvider } from '@windsurf/react-auth'

ReactDOM.createRoot(document.getElementById('root')).render(
  <WindsurfProvider>
    <App />
  </WindsurfProvider>
)
