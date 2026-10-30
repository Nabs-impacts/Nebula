import uuid
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.api.routes import messages as messages_route
from app.db.base import get_db
from app.integrations.whatsapp.wa_link_fallback import (
    generer_lien_wa_me,
    normaliser_numero_whatsapp,
)
from app.main import app
from app.models.entreprise import StatutProspection
from app.models.message import CanalMessage, StatutEnvoi


class FauxDb:
    def __init__(self):
        self.commits = 0

    def commit(self):
        self.commits += 1

    def refresh(self, _objet):
        return None


def _message(canal=CanalMessage.WHATSAPP, statut=StatutEnvoi.EN_ATTENTE, est_relance=False):
    return SimpleNamespace(
        id=uuid.uuid4(),
        entreprise_id=uuid.uuid4(),
        canal=canal,
        sujet=None,
        angle=None,
        contenu_genere="Bonjour, une idée pour votre entreprise.",
        contenu_final=None,
        est_relance=est_relance,
        statut_envoi=statut,
        date_generation=datetime.now(timezone.utc),
        date_envoi=None,
        identifiant_externe=None,
    )


def _entreprise():
    return SimpleNamespace(
        id=uuid.uuid4(),
        nom="Boulangerie Niamey Centre",
        whatsapp="87773982",
        statut=StatutProspection.NOUVEAU,
    )


@pytest.fixture
def client_authentifie():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=uuid.uuid4())
    app.dependency_overrides[get_db] = lambda: FauxDb()
    client = TestClient(app)
    try:
        yield client
    finally:
        app.dependency_overrides.clear()


def _preparer_message(monkeypatch, message, entreprise):
    monkeypatch.setattr(messages_route.message_service, "obtenir_message", lambda db, mid: message)
    monkeypatch.setattr(
        messages_route.entreprise_service,
        "obtenir_entreprise",
        lambda db, eid: entreprise,
    )


def test_marquer_envoye_manuellement_whatsapp_nominal(client_authentifie, monkeypatch):
    message = _message()
    entreprise = _entreprise()
    _preparer_message(monkeypatch, message, entreprise)

    appele_meta = {"oui": False}

    def _interdit(*_args, **_kwargs):
        appele_meta["oui"] = True

    monkeypatch.setattr(messages_route.envoi_service, "envoyer_message_texte", _interdit)

    reponse = client_authentifie.post(
        f"/api/messages/{message.id}/marquer-envoye-manuellement"
    )

    assert reponse.status_code == 200
    assert message.statut_envoi == StatutEnvoi.ENVOYE
    assert message.date_envoi is not None
    assert entreprise.statut == StatutProspection.EN_ATTENTE_REPONSE
    assert appele_meta["oui"] is False


def test_marquer_envoye_manuellement_relance_passe_en_relance_envoyee(client_authentifie, monkeypatch):
    message = _message(est_relance=True)
    entreprise = _entreprise()
    _preparer_message(monkeypatch, message, entreprise)

    reponse = client_authentifie.post(
        f"/api/messages/{message.id}/marquer-envoye-manuellement"
    )

    assert reponse.status_code == 200
    assert message.statut_envoi == StatutEnvoi.ENVOYE
    assert entreprise.statut == StatutProspection.RELANCE_ENVOYEE


def test_marquer_envoye_manuellement_message_deja_envoye_refuse(client_authentifie, monkeypatch):
    message = _message(statut=StatutEnvoi.ENVOYE)
    entreprise = _entreprise()
    _preparer_message(monkeypatch, message, entreprise)

    reponse = client_authentifie.post(
        f"/api/messages/{message.id}/marquer-envoye-manuellement"
    )

    assert reponse.status_code == 409
    assert "déjà" in reponse.json()["detail"].lower()
    assert message.statut_envoi == StatutEnvoi.ENVOYE


def test_marquer_envoye_manuellement_canal_email_refuse(client_authentifie, monkeypatch):
    message = _message(canal=CanalMessage.EMAIL)
    entreprise = _entreprise()
    _preparer_message(monkeypatch, message, entreprise)

    reponse = client_authentifie.post(
        f"/api/messages/{message.id}/marquer-envoye-manuellement"
    )

    assert reponse.status_code == 400
    assert "whatsapp" in reponse.json()["detail"].lower()
    assert message.statut_envoi == StatutEnvoi.EN_ATTENTE
    assert entreprise.statut == StatutProspection.NOUVEAU


@pytest.mark.parametrize(
    ("entree", "attendu"),
    [
        ("87 77 39 82", "22787773982"),
        ("+227 87773982", "22787773982"),
        ("00227 87773982", "22787773982"),
        ("22787773982", "22787773982"),
        ("+227 (87) 77-39-82", "22787773982"),
        ("", None),
        (None, None),
        ("invalide", None),
        ("12345", None),
        ("0000", None),
    ],
)
def test_normalisation_numero_whatsapp(entree, attendu):
    assert normaliser_numero_whatsapp(entree) == attendu


def test_generer_lien_wa_me_encode_le_message_et_normalise_le_numero():
    lien = generer_lien_wa_me("87 77 39 82", "Bonjour & à bientôt")

    assert lien == (
        "https://wa.me/22787773982?text=Bonjour%20%26%20%C3%A0%20bient%C3%B4t"
    )


def test_envoi_automatique_whatsapp_sans_token_ne_sollicite_pas_meta(monkeypatch):
    from app.services import envoi_service

    monkeypatch.setattr(envoi_service.settings, "whatsapp_access_token", "")

    appele_meta = {"oui": False}

    def _interdit(*_args, **_kwargs):
        appele_meta["oui"] = True

    monkeypatch.setattr(envoi_service, "envoyer_message_texte", _interdit)

    message = _message()
    entreprise = _entreprise()

    with pytest.raises(ValueError, match="Ouvrir dans WhatsApp"):
        envoi_service.envoyer_message(FauxDb(), message, entreprise)

    assert appele_meta["oui"] is False
    assert message.statut_envoi == StatutEnvoi.ECHEC
