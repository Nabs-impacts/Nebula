import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { login as loginRequest, getProfil } from '../services/authService'
import { setAuthToken, setUnauthorizedHandler } from '../services/api'

export const AuthContext = createContext(null)

// NOTE: le token JWT est volontairement gardé en mémoire (state React), pas
// dans localStorage/sessionStorage, comme demandé dans les specs. Conséquence
// assumée : un rechargement de page (F5) déconnecte l'utilisateur.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [utilisateur, setUtilisateur] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState(null)

  const deconnecter = useCallback(() => {
    setToken(null)
    setUtilisateur(null)
    setAuthToken(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => deconnecter())
  }, [deconnecter])

  const connecter = useCallback(async (email, motDePasse) => {
    setChargement(true)
    setErreur(null)
    try {
      const { access_token } = await loginRequest(email, motDePasse)
      setAuthToken(access_token)
      const profil = await getProfil()
      setToken(access_token)
      setUtilisateur(profil)
      return profil
    } catch (err) {
      setAuthToken(null)
      const statut = err.response?.status
      if (statut === 401) {
        setErreur('Email ou mot de passe incorrect.')
      } else if (statut === 403) {
        setErreur('Ce compte est désactivé.')
      } else {
        setErreur("Impossible de se connecter au serveur. Réessayez.")
      }
      throw err
    } finally {
      setChargement(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      token,
      utilisateur,
      estConnecte: Boolean(token),
      chargement,
      erreur,
      connecter,
      deconnecter,
    }),
    [token, utilisateur, chargement, erreur, connecter, deconnecter],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
