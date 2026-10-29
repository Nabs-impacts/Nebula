import { useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import Sidebar from './components/common/Sidebar'
import Navbar from './components/common/Navbar'
import ReponsesNotifier from './components/common/ReponsesNotifier'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EntreprisesPage from './pages/EntreprisesPage'
import EntrepriseDetailPage from './pages/EntrepriseDetailPage'
import ParametresPage from './pages/ParametresPage'
import { DURATION } from './lib/motion'

function RouteProtegee({ children }) {
  const { estConnecte, chargement } = useAuth()

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg font-mono text-xs tracking-widest text-muted">
        CHARGEMENT…
      </div>
    )
  }

  if (!estConnecte) {
    return <Navigate to="/login" replace />
  }

  return children
}

function LayoutApplication({ children }) {
  const location = useLocation()
  const [menuOuvert, setMenuOuvert] = useState(false)

  return (
    <div className="min-h-screen bg-bg text-ink">
      <ReponsesNotifier />
      <Sidebar ouvert={menuOuvert} onFermer={() => setMenuOuvert(false)} />

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        <Navbar onOuvrirMenu={() => setMenuOuvert(true)} />
        <main className="flex-1 px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          {/* Transition douce entre pages : fade + léger slide, jamais de
              scroll-jacking ni de mouvement sur width/height. */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: DURATION.normal, ease: 'easeOut' }}
              className="mx-auto w-full max-w-7xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const { estConnecte } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={estConnecte ? <Navigate to="/entreprises" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          <RouteProtegee>
            <LayoutApplication>
              <DashboardPage />
            </LayoutApplication>
          </RouteProtegee>
        }
      />
      <Route
        path="/entreprises"
        element={
          <RouteProtegee>
            <LayoutApplication>
              <EntreprisesPage />
            </LayoutApplication>
          </RouteProtegee>
        }
      />
      <Route
        path="/entreprises/:id"
        element={
          <RouteProtegee>
            <LayoutApplication>
              <EntrepriseDetailPage />
            </LayoutApplication>
          </RouteProtegee>
        }
      />
      <Route
        path="/parametres"
        element={
          <RouteProtegee>
            <LayoutApplication>
              <ParametresPage />
            </LayoutApplication>
          </RouteProtegee>
        }
      />
      <Route path="*" element={<Navigate to={estConnecte ? '/entreprises' : '/login'} replace />} />
    </Routes>
  )
}
