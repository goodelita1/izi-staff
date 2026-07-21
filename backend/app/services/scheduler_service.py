import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.services.backup_service import BackupService

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def _run_backup() -> None:
    try:
        info = BackupService().create()
        logger.info("Scheduled backup created: %s", info["filename"])
    except Exception as exc:
        logger.error("Scheduled backup failed: %s", exc)


def start() -> None:
    global _scheduler
    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        _run_backup,
        trigger=IntervalTrigger(hours=24),
        id="auto_backup",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Backup scheduler started (interval: 24h)")


def stop() -> None:
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Backup scheduler stopped")
