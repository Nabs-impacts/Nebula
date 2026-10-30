from app.core.config import settings
from app.integrations.email.template_email import construire_email


def test_template_email_contient_logo_da_et_cta():
    html_email, texte_email = construire_email(
        sujet="Une idée pour Sahel Auto",
        corps="Bonjour,\n\nJ'ai repéré votre garage à Niamey.\n\nSouhaitez-vous en discuter ?",
    )

    assert "Une idée pour Sahel Auto" in html_email
    assert "/branding/nebula-logo.png" in html_email
    assert "/branding/nebula-logo-blanc.png" in html_email
    assert "/branding/nebula-icone.png" in html_email
    assert "#6D4AFF" in html_email
    assert "#22D3EE" in html_email
    assert "#0B1020" in html_email
    assert settings.agence_cta_url in html_email
    assert "Souhaitez-vous en discuter ?" in html_email
    assert "STOP" in texte_email


def test_template_email_ajoute_lien_whatsapp_si_configure(monkeypatch):
    monkeypatch.setattr(settings, "agence_whatsapp", "87 77 39 82")

    html_email, texte_email = construire_email(sujet="Une idée", corps="Bonjour,\n\nUne idée simple.")

    assert "https://wa.me/22787773982" in html_email
    assert "Vous préférez WhatsApp ? Écrivez-nous" in html_email
    assert "https://wa.me/22787773982" in texte_email


def test_template_email_sans_lien_whatsapp_si_non_configure(monkeypatch):
    monkeypatch.setattr(settings, "agence_whatsapp", "")

    html_email, texte_email = construire_email(sujet="Une idée", corps="Bonjour,\n\nUne idée simple.")

    assert "wa.me" not in html_email
    assert "Vous préférez WhatsApp" not in texte_email


def test_template_email_retire_une_signature_existante():
    html_email, _ = construire_email(
        sujet="Votre site",
        corps="Bonjour,\n\nUne idée simple.\n\nCordialement,\nJean Tenora\n80181172",
    )

    assert "Une idée simple." in html_email
    assert "Cordialement,\nJean Tenora" not in html_email
    assert html_email.count("Agence web") >= 2
