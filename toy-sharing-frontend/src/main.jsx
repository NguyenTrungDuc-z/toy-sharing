import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { io } from 'socket.io-client'
import axios from 'axios'
import { ConfigProvider, App as AntdApp } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { toyShareTheme } from './theme'
import { API_BASE } from './config'
import './App.css'
import App from './App.jsx'

// Địa chỉ backend tập trung: axios dùng baseURL, lời gọi chỉ cần đường dẫn tương đối "/api/..."
axios.defaults.baseURL = API_BASE

// Cung cấp socket.io-client toàn cục cho realtime (thông báo + chat)
window.io = io

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={toyShareTheme} locale={viVN}>
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </StrictMode>,
)
