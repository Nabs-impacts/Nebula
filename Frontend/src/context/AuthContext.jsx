import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { login as loginRequest, getProfil } from '../services/authService'
import { setAuthToken, setUnauthorizedHandler } from '../services/api'

export const AuthContext = createContext(null)

const CLE_TOKEN = 'nebula_token'
const CLE_PROFIL = 'nebula_profil'

function lireStockage(cle) {
  try {
    const valeur = localStorage.getItem(cle)
    if (valeur !== null) return valeur
  } catch {
    // localStorage indisponible (navigation privée stricte) : on tente le repli.
  }

  try {
    return sessionStorage.getItem(cle)
  } catch {
    return null
  }
}

function ecrireStockage(cle, valeur) {
  try {
    if (valeur === null) localStorage.removeItem(cle)
    else localStorage.setItem(cle, valeur)
    return
  } catch {
    // localStorage indisponible : on tente le repli ci-dessous.
  }

  try {
    if (valeur === null) sessionStorage.removeItem(cle)
    else sessionStorage.setItem(cle, valeur)
  } catch {
    // Aucun stockage disponible : la session reste en mémoire.
  }
}

function lireToken() {
  return lireStockage(CLE_TOKEN)
}

function lireProfil() {
  const brut = lireStockage(CLE_PROFIL)
  if (!brut) return null
  try {
    return JSON.parse(brut)
  } catch {
    return null
  }
}

function ecrireToken(token) {
  ecrireStockage(CLE_TOKEN, token)
}

function ecrireProfil(profil) {
  ecrireStockage(CLE_PROFIL, profil ? JSON.stringify(profil) : null)
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(lireToken)
  const [utilisateur, setUtilisateur] = useState(lireProfil)
  const [chargement, setChargement] = useState(Boolean(lireToken()))
  const [erreur, setErreur] = useState(null)

  const deconnecter = useCallback(() => {
    setToken(null)
    setUtilisateur(null)
    setAuthToken(null)
    ecrireToken(null)
    ecrireProfil(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => deconnecter())
  }, [deconnecter])

  // Restaure la session au rechargement de la page (F5) ou à la réouverture du
  // navigateur. Le profil en cache permet d'afficher l'interface même si le
  // backend est momentanément indisponible (redémarrage) : on ne déconnecte
  // que si le serveur répond explicitement 401 (token invalide/expiré).
  useEffect(() => {
    const tokenSauvegarde = lireToken()
    if (!tokenSauvegarde) {
      setChargement(false)
      return
    }

    let annule = false
    setAuthToken(tokenSauvegarde)
    setChargement(true)
    getProfil()
      .then((profil) => {
        if (annule) return
        setUtilisateur(profil)
        ecrireProfil(profil)
      })
      .catch((err) => {
        if (annule) return
        if (err.response?.status === 401) deconnecter()
        // Erreur réseau / 5xx : on conserve le token et le profil en cache.
        // Le backend redémarre souvent pendant le développement.
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })

    return () => {
      annule = true
    }
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
      ecrireToken(access_token)
      ecrireProfil(profil)
      return profil
    } catch (err) {
      setAuthToken(null)
      const statut = err.response?.status
      if (statut === 401) {
        setErreur('Email ou mot de passe incorrect.')
      } else if (statut === 403) {
        setErreur('Ce compte est désactivé.')
      } else {
        setErreur('Impossible de se connecter au serveur. Réessayez.')
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
