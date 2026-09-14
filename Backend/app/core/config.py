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
    brevo_sender_name: str = "Tenora"

    # WhatsApp (Meta Cloud API)
    whatsapp_phone_number_id: str
    whatsapp_business_account_id: str
    whatsapp_access_token: str
    whatsapp_api_version: str = "v20.0"

    # IA (génération des messages)
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    mistral_api_key: str | None = None
    mistral_model: str = "mistral-small-latest"


settings = Settings()
