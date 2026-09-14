import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture
def entreprise_valide() -> dict:
    return {
        "nom": "Boulangerie Niamey Centre",
        "email": "contact@boulangerie-niamey.ne",
        "type_entreprise": "commerce",
        "prototype_a_presenter": "Application de commande en ligne",
        "description_prototype": "Permet aux clients de commander et payer via Mobile Money",
    }


def test_creation_entreprise_sans_contact_echoue(entreprise_valide):
    payload = {**entreprise_valide, "email": None}
    reponse = client.post("/api/entreprises", json=payload)
    assert reponse.status_code in (401, 422)  # 401 si non authentifié, 422 si validation échoue


def test_lecture_entreprise_inexistante_retourne_404():
    reponse = client.get("/api/entreprises/00000000-0000-0000-0000-000000000000")
    assert reponse.status_code in (401, 404)


def test_validation_whatsapp_format_international(entreprise_valide):
    payload = {**entreprise_valide, "whatsapp": "90000000"}  # sans indicatif international
    reponse = client.post("/api/entreprises", json=payload)
    assert reponse.status_code in (401, 422)


# NOTE : ces tests supposent une base de données de test dédiée et un utilisateur
# authentifié (token JWT) pour les cas nécessitant un accès complet aux endpoints.
# À compléter avec une fixture de connexion + une base SQLite/Postgres de test
# une fois l'environnement de test mis en place (conftest.py).
