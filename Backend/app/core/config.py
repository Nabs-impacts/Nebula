from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"

    # Base de données
    database_url: str

    # Sécurité / Auth
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Redis / File d'attente
    redis_url: str = "redis://localhost:6379/0"

    # Brevo (email)
    brevo_api_key: str
    brevo_sender_email: str
    brevo_sender_name: str = "Nebula"
    brevo_reply_to: str | None = None  # boîte qui reçoit les réponses (défaut : l'expéditeur)

    # Réception IMAP (boîte Gmail de réception des réponses)
    imap_enabled: bool = False
    imap_host: str = "imap.gmail.com"
    imap_port: int = 993
    imap_user: str = ""
    imap_password: str = ""
    imap_folder: str = "INBOX"
    imap_poll_minutes: int = 5
    imap_lookback_days: int = 7

    # WhatsApp (Meta Cloud API)
    whatsapp_phone_number_id: str
    whatsapp_business_account_id: str
    whatsapp_access_token: str
    whatsapp_api_version: str = "v20.0"

    # Identité de l'agence (utilisée dans les prompts et les signatures)
    agence_nom: str = "Nebula"
    agence_signature: str = "L'équipe Nebula"
    agence_telephone_1: str = "87773982"
    agence_telephone_2: str = "80181172"
    agence_site_web: str = "https://tenora-digital.store"
    agence_preuve_clients: str = "plus d'une cinquantaine de clients satisfaits"
    agence_argument_prix: str = "des tarifs adaptés aux entreprises locales"
    agence_adresse: str = "Niamey, Niger"
    agence_logo_url: str = ""
    agence_logo_blanc_url: str = ""
    agence_icone_url: str = ""
    agence_cta_label: str = "Voir la maquette"
    agence_cta_url: str = "https://tenora-digital.store"

    # IA (génération des messages)
    ia_prioritaire: str = "groq"  # "groq" ou "mistral"
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    mistral_api_key: str | None = None
    mistral_model: str = "mistral-small-latest"


settings = Settings()
