import { Route, Routes } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Actividad from '../pages/Actividad'
import Billetera from '../pages/Billetera'
import CrearSubasta from '../pages/CrearSubasta'
import DetalleSubasta from '../pages/DetalleSubasta'
import Inicio from '../pages/Inicio'
import Perfil from '../pages/Perfil'
import Subastas from '../pages/Subastas'

function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/subastas" element={<Subastas />} />
        <Route path="/subastas/:id" element={<DetalleSubasta />} />
        <Route path="/crear-subasta" element={<CrearSubasta />} />
        <Route path="/billetera" element={<Billetera />} />
        <Route path="/actividad" element={<Actividad />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>
    </Routes>
  )
}

export default AppRouter
