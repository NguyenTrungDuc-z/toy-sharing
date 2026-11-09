import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { io } from 'socket.io-client'
import './App.css'
import App from './App.jsx'

// Cung cấp socket.io-client toàn cục cho realtime (thông báo + chat)
window.io = io


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
