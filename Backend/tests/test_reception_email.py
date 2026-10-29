import email
from datetime import datetime, timezone

from app.services.reception_service import (
    _est_un_message_a_ignorer,
    analyser_message,
    decoder_entete,
)

EXEMPLE_EML_REPONSE_PROSPECT = """From: =?UTF-8?B?U2Fow6lsIEF1dG8gTmlhbWV5?= <contact@sahelauto.ne>
To: Nebula <tenorashopne@gmail.com>
Subject: =?UTF-8?B?UmU6IFVuZSBpZMOpZSBwb3VyIFNhaGVsIEF1dG8=?=
Date: Thu, 29 Oct 2026 10:15:00 +0100
Message-ID: <CABc123_xyz789@mail.gmail.com>
In-Reply-To: <brevo-uuid-456@smtp-relay.mailin.fr>
References: <brevo-uuid-456@smtp-relay.mailin.fr>
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="boundary-12345"

--boundary-12345
Content-Type: text/plain; charset="utf-8"
Content-Transfer-Encoding: 8bit

Bonjour l'équipe Nebula,

Merci pour votre message. Nous sommes effectivement intéressés par la création d'un site vitrine avec prise de rendez-vous pour notre atelier.

Pouvez-vous nous contacter au 80 12 34 56 demain matin pour en discuter ?

Le mer. 28 oct. 2026 à 15:30, Nebula <contact@tenora-digital.store> a écrit :
> Bonjour Sahel Auto,
> Nous avons conçu une maquette de votre futur site web...
> Cordialement,
> L'équipe Nebula

--
Envoyé depuis mon iPhone
--boundary-12345
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: 8bit

<html><body><p>Bonjour l'équipe Nebula,</p><p>Merci pour votre message...</p></body></html>
--boundary-12345--
""".encode("utf-8")


EXEMPLE_EML_HTML_SEUL = """From: Garage Moderne <info@garagemoderne.com>
To: Nebula <tenorashopne@gmail.com>
Subject: =?ISO-8859-1?Q?Votre_proposition_de_cr=E9ation_de_site?=
Date: Thu, 29 Oct 2026 09:00:00 +0000
Message-ID: <msg-999@garagemoderne.com>
MIME-Version: 1.0
Content-Type: text/html; charset="iso-8859-1"
Content-Transfer-Encoding: 8bit

<!DOCTYPE html>
<html>
<head><style>p { color: red; }</style></head>
<body>
  <p>Bonjour,</p>
  <p>Votre offre nous int&eacute;resse beaucoup.<br>Quel est votre d&eacute;lai d'ex&eacute;cution ?</p>
  <br>
  <div class="gmail_quote">
    -----Message d'origine-----<br>
    De : contact@tenora-digital.store<br>
    Objet : Une idée pour votre entreprise
  </div>
</body>
</html>
""".encode("iso-8859-1")


def test_analyser_message_extrait_metadonnees_et_nettoie_citations():
    resultat = analyser_message(EXEMPLE_EML_REPONSE_PROSPECT)

    assert resultat["message_id"] == "<CABc123_xyz789@mail.gmail.com>"
    assert resultat["adresse_expediteur"] == "contact@sahelauto.ne"
    assert "contact@sahelauto.ne" in resultat["expediteur"]
    assert "Auto" in resultat["expediteur"]
    assert "Une idée pour Sahel" in resultat["objet"]
    assert resultat["in_reply_to"] == "<brevo-uuid-456@smtp-relay.mailin.fr>"
    assert "<brevo-uuid-456@smtp-relay.mailin.fr>" in resultat["references"]

    # Date
    assert isinstance(resultat["recu_le"], datetime)

    # Corps nettoyé : le message utile est présent
    assert "Bonjour l'équipe Nebula," in resultat["extrait"]
    assert "80 12 34 56" in resultat["extrait"]

    # Citations et signatures retirées
    assert "Le mer. 28 oct. 2026 à 15:30" not in resultat["extrait"]
    assert "Nous avons conçu une maquette" not in resultat["extrait"]
    assert "Envoyé depuis mon iPhone" not in resultat["extrait"]


def test_analyser_message_repli_sur_html_nettoye():
    resultat = analyser_message(EXEMPLE_EML_HTML_SEUL)

    assert resultat["adresse_expediteur"] == "info@garagemoderne.com"
    assert "Votre proposition de création de site" in resultat["objet"]
    assert "Votre offre nous intéresse beaucoup." in resultat["extrait"]
    assert "délai d'exécution" in resultat["extrait"]

    # Le bloc de citation après "-----Message d'origine-----" doit être supprimé
    assert "-----Message d'origine-----" not in resultat["extrait"]
    assert "contact@tenora-digital.store" not in resultat["extrait"]
    # Balises HTML et styles purgés
    assert "<style>" not in resultat["extrait"]
    assert "<body>" not in resultat["extrait"]


def test_messages_a_ignorer():
    assert _est_un_message_a_ignorer({
        "adresse_expediteur": "mailer-daemon@googlemail.com",
        "auto_submitted": "",
        "precedence": "",
    }) is True

    assert _est_un_message_a_ignorer({
        "adresse_expediteur": "prospect@example.com",
        "auto_submitted": "auto-replied",
        "precedence": "",
    }) is True

    assert _est_un_message_a_ignorer({
        "adresse_expediteur": "prospect@example.com",
        "auto_submitted": "no",
        "precedence": "bulk",
    }) is True

    assert _est_un_message_a_ignorer({
        "adresse_expediteur": "client@entreprise.ne",
        "auto_submitted": "no",
        "precedence": "",
    }) is False
