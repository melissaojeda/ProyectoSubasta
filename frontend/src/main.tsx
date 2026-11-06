import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { SesionProvider } from './sesion/SesionContext'
import { TiempoRealProvider } from './tiempo-real/TiempoRealContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <TiempoRealProvider>
          <App />
        </TiempoRealProvider>
      </SesionProvider>
    </BrowserRouter>
  </StrictMode>,
)
