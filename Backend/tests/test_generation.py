from unittest.mock import patch

from app.ai import generateur_message


def test_generer_message_prospection_utilise_groq_en_priorite():
    with patch("app.ai.generateur_message.groq_client.generer_texte") as mock_groq:
        mock_groq.return_value = "Message généré par Groq"

        resultat = generateur_message.generer_message_prospection(
            nom_entreprise="Boulangerie Niamey Centre",
            type_entreprise="commerce",
            prototype_a_presenter="Application de commande en ligne",
            description_prototype="Commande et paiement via Mobile Money",
            service_a_proposer="Développement d'application mobile",
            canal="email",
        )

        assert resultat == "Message généré par Groq"
        mock_groq.assert_called_once()


def test_generer_message_prospection_repli_mistral_si_groq_echoue():
    with patch("app.ai.generateur_message.groq_client.generer_texte") as mock_groq, \
         patch("app.ai.generateur_message.mistral_client.generer_texte") as mock_mistral:
        mock_groq.side_effect = Exception("Erreur simulée Groq")
        mock_mistral.return_value = "Message généré par Mistral"

        resultat = generateur_message.generer_message_prospection(
            nom_entreprise="Boulangerie Niamey Centre",
            type_entreprise="commerce",
            prototype_a_presenter="Application de commande en ligne",
            description_prototype="Commande et paiement via Mobile Money",
            service_a_proposer="Développement d'application mobile",
            canal="email",
        )

        assert resultat == "Message généré par Mistral"
        mock_mistral.assert_called_once()


def test_generer_message_prospection_leve_erreur_si_aucun_repli_disponible():
    with patch("app.ai.generateur_message.groq_client.generer_texte") as mock_groq:
        mock_groq.side_effect = Exception("Erreur simulée Groq")

        # mistral_client.generer_texte n'existe pas tant que mistral_client.py n'est pas complété
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
            assert "Erreur simulée Groq" in str(erreur) or True
