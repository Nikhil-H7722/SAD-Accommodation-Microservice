import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .api import admin as admin_api
from .api import auth as auth_api
from .api import booking as booking_api
from .config import settings
from .db import SessionLocal
from .errors import DomainError
from .services import booking

log = logging.getLogger("accommodation")


def _run_expiry() -> int:
    with SessionLocal() as db:
        return booking.expire_holds(db)


async def _expiry_loop() -> None:
    """Every EXPIRY_JOB_SECONDS: release beds whose hold time has run out."""
    while True:
        await asyncio.sleep(settings.expiry_job_seconds)
        try:
            released = await asyncio.to_thread(_run_expiry)
            if released:
                log.info("released %s expired bed holds", released)
        except Exception:  # the loop must never die
            log.exception("expire_holds failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.environment != "dev" and settings.jwt_secret == "change-me-in-production":
        raise RuntimeError("Set JWT_SECRET before running outside development")
    task = asyncio.create_task(_expiry_loop())
    yield
    task.cancel()


app = FastAPI(title="Accommodation Service", version="0.1.0", lifespan=lifespan)


@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, exc: DomainError):
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    details = {".".join(str(p) for p in e["loc"] if p != "body"): e["msg"] for e in exc.errors()}
    return JSONResponse(status_code=422, content={"error": {"code": "VALIDATION_ERROR", "message": "Some fields are missing or invalid.", "details": details}})


@app.get(f"{settings.api_prefix}/health")
def health():
    return {"status": "ok"}


app.include_router(auth_api.router, prefix=settings.api_prefix)
app.include_router(booking_api.router, prefix=settings.api_prefix)
app.include_router(admin_api.router, prefix=settings.api_prefix)
