import httpx

from app.integrations.email.brevo_client import _detail_erreur_brevo


def _reponse(code: int, payload: dict) -> httpx.Response:
    return httpx.Response(code, json=payload, request=httpx.Request("POST", "https://api.brevo.com"))


def test_erreur_401_ip_non_autorisee_est_explicite():
    detail = _detail_erreur_brevo(
        _reponse(
            401,
            {
                "message": (
                    "We have detected you are using an unrecognised IP address "
                    "2a09:bac5:4d6d:150f::219:66."
                )
            },
        )
    )
    assert "IP" in detail
    assert "Brevo" in detail
    assert "2a09:bac5:4d6d:150f::219:66" in detail
    assert "authorised_ips" in detail


def test_erreur_401_sans_ip_parle_de_cle_api():
    detail = _detail_erreur_brevo(_reponse(401, {"message": "Unauthorized"}))
    assert "BREVO_API_KEY" in detail
