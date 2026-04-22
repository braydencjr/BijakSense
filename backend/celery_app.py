"""Celery worker configuration."""
from celery import Celery
from config import settings

celery_app = Celery(
    "merchantmind",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "tasks.ingest_signals",
        "tasks.process_signals",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kuala_Lumpur",
    enable_utc=True,
    beat_schedule={
        "ingest-signals-every-15min": {
            "task": "tasks.ingest_signals.run_ingest",
            "schedule": 900.0,
        },
    },
)
