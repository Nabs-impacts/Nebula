"""Template email HTML aux couleurs de la marque Nebula.

Le rendu utilise des tableaux et du CSS inline pour rester compatible avec
les clients mail (Gmail, Outlook, Apple Mail). Aucune police distante n'est
chargée : Space Grotesk / Inter sont déclarées avec des fallbacks sûrs.
"""
import html
import re

from app.core.config import settings
from app.integrations.whatsapp.wa_link_fallback import normaliser_numero_whatsapp

FOND = "#F7F8FC"
TEXTE = "#12162B"
PRIMAIRE = "#6D4AFF"
SECONDAIRE = "#22D3EE"
FOOTER_FOND = "#0B1020"
FOOTER_TEXTE = "#C9CFEA"
BORDURE = "#E6E9F5"
TEXTE_SECONDAIRE = "#5B607A"

POLICE_TITRE = "'Space Grotesk', 'Trebuchet MS', Arial, sans-serif"
POLICE_CORPS = "'Inter', 'Helvetica Neue', Arial, sans-serif"


def _url_publique(url: str) -> str | None:
    """Garde uniquement une URL https publique (jamais localhost ni http)."""
    if not url or not url.startswith("https://"):
        return None
    hote = url.split("/")[2].split(":")[0].lower()
    if hote in ("localhost", "127.0.0.1", "0.0.0.0") or hote.endswith(".local"):
        return None
    return url


def _logo_url(*, blanc: bool = False) -> str | None:
    """URL publique du logo, avec repli sur le frontend déployé. None si injoignable."""
    explicite = settings.agence_logo_blanc_url if blanc else settings.agence_logo_url
    if explicite:
        return _url_publique(explicite)
    fichier = "nebula-logo-blanc.png" if blanc else "nebula-logo.png"
    return _url_publique(f"{settings.frontend_url.rstrip('/')}/branding/{fichier}")


def _logo_html(*, largeur: int, blanc: bool = False) -> str:
    """Logo en image si l'URL est publique, sinon wordmark texte (jamais d'image cassée)."""
    url = _logo_url(blanc=blanc)
    if url:
        return (
            f'<img src="{_echapper(url)}" width="{largeur}" alt="Nebula" '
            f'style="display:block;border:0;height:auto;max-width:{largeur}px;">'
        )
    couleur = "#FFFFFF" if blanc else PRIMAIRE
    taille = 22 if blanc else 28
    return (
        f'<span style="font-family:{POLICE_TITRE};font-size:{taille}px;font-weight:700;'
        f'letter-spacing:-0.03em;color:{couleur};">nebula</span>'
    )


def _echapper(texte: str) -> str:
    return html.escape(texte or "", quote=True)


def _corps_sans_signature(texte: str) -> str:
    """Retire une éventuelle signature rédigée par l'IA avant le bloc signé."""
    index = texte.lower().rfind("cordialement")
    if index != -1:
        return texte[:index].strip()
    return texte.strip()


def _corps_vers_html(texte: str) -> str:
    paragraphes = [p.strip() for p in _corps_sans_signature(texte).split("\n\n") if p.strip()]
    return "".join(
        f'<p style="margin:0 0 16px;font-family:{POLICE_CORPS};font-size:16px;'
        f'line-height:1.7;color:{TEXTE};">{_echapper(p).replace(chr(10), "<br>")}</p>'
        for p in paragraphes
    )


def _preheader(texte: str) -> str:
    resume = re.sub(r"\s+", " ", _corps_sans_signature(texte)).strip()
    return _echapper(resume[:120])


def _telephone_lien(numero: str) -> str:
    return re.sub(r"[^\d+]", "", numero)


def _lien_whatsapp_html() -> str:
    """Ligne discrète vers WhatsApp, uniquement si AGENCE_WHATSAPP est renseigné."""
    numero = normaliser_numero_whatsapp(settings.agence_whatsapp)
    if numero is None:
        return ""
    return (
        '<br><a href="https://wa.me/'
        f'{numero}" style="color:{PRIMAIRE};text-decoration:none;font-size:12px;">'
        "Vous préférez WhatsApp ? Écrivez-nous</a>"
    )


def _lien_whatsapp_texte() -> str:
    numero = normaliser_numero_whatsapp(settings.agence_whatsapp)
    if numero is None:
        return ""
    return f"\nVous préférez WhatsApp ? Écrivez-nous : https://wa.me/{numero}"


def construire_email(*, sujet: str, corps: str) -> tuple[str, str]:
    """Retourne (html, texte) prêts pour Brevo."""
    sujet_sur = _echapper(sujet)
    html_corps = _corps_vers_html(corps)
    preheader = _preheader(corps)

    html_email = f"""<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>{sujet_sur}</title>
</head>
<body style="margin:0;padding:0;background:{FOND};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    {preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{FOND};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="padding:0 4px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    {_logo_html(largeur=180)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#FFFFFF;border:1px solid {BORDURE};border-radius:8px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:4px;background:{PRIMAIRE};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:30px 32px 4px;">
                    <p style="margin:0 0 10px;font-family:{POLICE_CORPS};font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:{PRIMAIRE};">
                      Nebula · Agence web
                    </p>
                    <h1 style="margin:0;font-family:{POLICE_TITRE};font-size:24px;line-height:1.3;letter-spacing:-0.02em;color:{TEXTE};">
                      {sujet_sur}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 32px 0;">
                    {html_corps}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 32px 28px;">
                    <a href="{_echapper(settings.agence_cta_url)}" style="display:inline-block;background:{PRIMAIRE};color:#FFFFFF;font-family:{POLICE_CORPS};font-size:15px;font-weight:600;line-height:1;text-decoration:none;padding:14px 22px;border-radius:8px;">
                      {_echapper(settings.agence_cta_label)}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 30px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid {BORDURE};">
                      <tr>
                        <td style="padding-top:20px;vertical-align:top;font-family:{POLICE_CORPS};font-size:13px;line-height:1.7;color:{TEXTE};">
                          <strong style="font-weight:600;">{_echapper(settings.agence_signature)}</strong><br>
                          <span style="color:{TEXTE_SECONDAIRE};">Agence web · {_echapper(settings.agence_adresse)}</span><br>
                          <a href="tel:{_telephone_lien(settings.agence_telephone_1)}" style="color:{TEXTE};text-decoration:none;">{_echapper(settings.agence_telephone_1)}</a>
                          · <a href="tel:{_telephone_lien(settings.agence_telephone_2)}" style="color:{TEXTE};text-decoration:none;">{_echapper(settings.agence_telephone_2)}</a><br>
                          <a href="{_echapper(settings.agence_site_web)}" style="color:{PRIMAIRE};text-decoration:none;">{_echapper(settings.agence_site_web.replace('https://', '').replace('http://', ''))}</a>{_lien_whatsapp_html()}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background:{FOOTER_FOND};padding:24px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="left" style="vertical-align:middle;">
                          {_logo_html(largeur=132, blanc=True)}
                        </td>
                        <td align="right" style="vertical-align:middle;font-family:{POLICE_CORPS};font-size:11px;line-height:1.6;color:{FOOTER_TEXTE};">
                          {_echapper(settings.agence_adresse)}<br>
                          <a href="{_echapper(settings.agence_site_web)}" style="color:{FOOTER_TEXTE};text-decoration:none;">Site web</a>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:14px;font-family:{POLICE_CORPS};font-size:10px;line-height:1.7;color:{FOOTER_TEXTE};opacity:0.75;">
                          Vous recevez cet email car nous avons identifié votre entreprise.
                          Pour ne plus être contacté, répondez « STOP » à cet email.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    texte = (
        f"{_corps_sans_signature(corps)}\n\n"
        f"—\n{settings.agence_signature}\n"
        f"Agence web · {settings.agence_adresse}\n"
        f"{settings.agence_telephone_1} · {settings.agence_telephone_2}\n"
        f"{settings.agence_site_web}{_lien_whatsapp_texte()}\n\n"
        "Pour ne plus être contacté, répondez « STOP » à cet email."
    )
    return html_email, texte
