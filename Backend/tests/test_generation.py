import json
from unittest.mock import patch

from app.ai import generateur_message


def _reponse_json(objet: str, corps: str) -> str:
    return json.dumps({"objet": objet, "corps": corps, "angle": "Observation test"})


def test_generer_message_prospection_utilise_groq_en_priorite():
    with patch("app.ai.generateur_message.groq_client.generer_texte") as mock_groq:
        mock_groq.return_value = _reponse_json("Un site pour votre garage", "Message généré par Groq")

        resultat = generateur_message.generer_message_prospection(
            nom_entreprise="Boulangerie Niamey Centre",
            type_entreprise="commerce",
            prototype_a_presenter="Application de commande en ligne",
            description_prototype="Commande et paiement via Mobile Money",
            service_a_proposer="Développement d'application mobile",
            canal="email",
        )

        assert resultat.corps.startswith("Message généré par Groq")
        assert "contactez-nous" in resultat.corps
        assert resultat.objet == "Un site pour votre garage"
        assert resultat.angle == "Observation test"
        mock_groq.assert_called_once()


def test_generer_message_prospection_repli_mistral_si_groq_echoue():
    with patch("app.ai.generateur_message.groq_client.generer_texte") as mock_groq, \
         patch("app.ai.generateur_message.mistral_client.generer_texte") as mock_mistral:
        mock_groq.side_effect = Exception("Erreur simulée Groq")
        mock_mistral.return_value = _reponse_json("Un site pour votre commerce", "Message généré par Mistral")

        resultat = generateur_message.generer_message_prospection(
            nom_entreprise="Boulangerie Niamey Centre",
            type_entreprise="commerce",
            prototype_a_presenter="Application de commande en ligne",
            description_prototype="Commande et paiement via Mobile Money",
            service_a_proposer="Développement d'application mobile",
            canal="email",
        )

        assert resultat.corps.startswith("Message généré par Mistral")
        mock_mistral.assert_called_once()


def test_generer_message_prospection_leve_erreur_si_aucun_repli_disponible():
    with patch("app.ai.generateur_message.groq_client.generer_texte") as mock_groq, \
         patch("app.ai.generateur_message.mistral_client.generer_texte") as mock_mistral:
        mock_groq.side_effect = Exception("Erreur simulée Groq")
        mock_mistral.side_effect = Exception("Erreur simulée Mistral")

        try:
            generateur_message.generer_message_prospection(
                nom_entreprise="Test",
                type_entreprise="commerce",
                prototype_a_presenter="Test",
                description_prototype="Test",
                service_a_proposer="Test",
                canal="email",
            )
            assert False, "Une exception aurait dû être levée"
        except Exception as erreur:
            assert "Mistral" in str(erreur)


def test_parse_reponse_non_json_utilise_le_texte_brut():
    resultat = generateur_message._parser_reponse("Bonjour, voici un message brut.", "Garage Sahel")
    assert resultat.corps == "Bonjour, voici un message brut."
    assert resultat.objet.startswith("Une idée pour")
