import { Route, Routes } from 'react-router-dom'
import RutaProtegida from '../components/common/RutaProtegida'
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
        <Route
          path="/crear-subasta"
          element={(
            <RutaProtegida>
              <CrearSubasta />
            </RutaProtegida>
          )}
        />
        <Route
          path="/billetera"
          element={(
            <RutaProtegida>
              <Billetera />
            </RutaProtegida>
          )}
        />
        <Route
          path="/actividad"
          element={(
            <RutaProtegida>
              <Actividad />
            </RutaProtegida>
          )}
        />
        <Route
          path="/perfil"
          element={(
            <RutaProtegida>
              <Perfil />
            </RutaProtegida>
          )}
        />
      </Route>
    </Routes>
  )
}

export default AppRouter
