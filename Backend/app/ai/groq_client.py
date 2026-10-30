import time
import httpx

from app.ai.exceptions import ErreurIA, LimiteDebitIAErreur, ReponseIACoupeeOuVide
from app.core.config import settings
from app.core.logging import logger

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def generer_texte(
    prompt_systeme: str,
    prompt_utilisateur: str,
    temperature: float = 0.6,
    max_tokens: int | None = None,
    demander_json: bool = True,
) -> str:
    """Appelle l'API Groq avec gestion stricte de la troncature, 429 et JSON mode."""
    if not settings.groq_api_key:
        raise ErreurIA("GROQ_API_KEY non configurée")

    tokens = max_tokens or settings.ia_max_tokens
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    base_payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": prompt_systeme},
            {"role": "user", "content": prompt_utilisateur},
        ],
        "temperature": temperature,
        "max_tokens": tokens,
    }

    if "gpt-oss" in settings.groq_model.lower():
        base_payload["reasoning_effort"] = settings.groq_reasoning_effort

    payload = dict(base_payload)
    if demander_json:
        payload["response_format"] = {"type": "json_object"}

    debut = time.time()
    try:
        with httpx.Client(timeout=float(settings.ia_timeout_secondes)) as client:
            reponse = client.post(GROQ_API_URL, headers=headers, json=payload)

            # Repli sans response_format si le modèle ou l'API retourne 400
            if reponse.status_code == 400 and demander_json:
                logger.warning("Groq a renvoyé 400 avec json_object, nouvel essai sans response_format")
                payload_sans_json = dict(base_payload)
                reponse = client.post(GROQ_API_URL, headers=headers, json=payload_sans_json)

            if reponse.status_code == 429:
                retry_after = reponse.headers.get("Retry-After")
                if retry_after and retry_after.isdigit() and int(retry_after) <= 5:
                    time.sleep(int(retry_after))
                    reponse = client.post(GROQ_API_URL, headers=headers, json=payload)
                else:
                    raise LimiteDebitIAErreur(f"Limite Groq atteinte (Retry-After: {retry_after})")

            reponse.raise_for_status()
            donnees = reponse.json()
            choix = donnees.get("choices", [{}])[0]
            finish_reason = choix.get("finish_reason")
            contenu = choix.get("message", {}).get("content", "").strip()
            duree = round(time.time() - debut, 2)

            if finish_reason == "length" or not contenu:
                logger.warning(
                    f"Groq réponse invalide: finish_reason={finish_reason}, longueur={len(contenu)}, durée={duree}s"
                )
                raise ReponseIACoupeeOuVide(f"Réponse coupée ou vide (finish_reason={finish_reason})")

            return contenu
    except httpx.HTTPStatusError as erreur:
        duree = round(time.time() - debut, 2)
        logger.error(f"Erreur Groq HTTP {erreur.response.status_code} après {duree}s")
        raise ErreurIA(f"Erreur HTTP Groq: {erreur.response.status_code}") from erreur
    except httpx.RequestError as erreur:
        duree = round(time.time() - debut, 2)
        logger.error(f"Erreur réseau Groq après {duree}s : {erreur}")
        raise ErreurIA(f"Erreur réseau Groq: {erreur}") from erreur
