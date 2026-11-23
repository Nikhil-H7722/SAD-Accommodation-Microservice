from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://accommodation:accommodation@localhost:5432/campus_mobility_accommodation"
    hold_minutes: int = 30            # how long an unpaid bed is held (an assumption, see the API document)
    expiry_job_seconds: int = 60      # how often old holds are released
    api_prefix: str = "/api/v1/accommodation"

    environment: str = "dev"          # anything other than "dev" refuses to start with the default secret
    jwt_secret: str = "change-me-in-production"
    jwt_expire_minutes: int = 60
    otp_ttl_seconds: int = 300        # a 6-digit code works for 5 minutes
    otp_max_attempts: int = 5         # wrong guesses allowed per code
    otp_resend_cooldown_seconds: int = 30

    email_backend: str = "console"    # "console" prints the code in the server log (development only), "smtp" sends it
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "no-reply@example.test"


settings = Settings()
