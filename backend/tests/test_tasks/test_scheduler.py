from app.tasks import scheduler


def clear_scheduler_jobs():
    scheduler.scheduler.remove_all_jobs()


def test_configurar_jobs_uses_configured_schedule(monkeypatch):
    clear_scheduler_jobs()
    monkeypatch.setattr(scheduler.settings, "scheduler_enabled", True)
    monkeypatch.setattr(scheduler.settings, "scheduler_collection_hour", 9)
    monkeypatch.setattr(scheduler.settings, "scheduler_collection_minute", 30)
    monkeypatch.setattr(scheduler.settings, "scheduler_backup_hour", 13)
    monkeypatch.setattr(scheduler.settings, "scheduler_backup_minute", 15)
    monkeypatch.setattr(scheduler.settings, "scheduler_stats_interval_hours", 4)

    scheduler.configurar_jobs()

    jobs = {job["id"]: job for job in scheduler.listar_jobs()}
    assert set(jobs) == {"coleta_diaria", "coleta_diaria_backup", "atualizar_stats"}
    assert "hour='9'" in jobs["coleta_diaria"]["trigger"]
    assert "minute='30'" in jobs["coleta_diaria"]["trigger"]
    assert "hour='13'" in jobs["coleta_diaria_backup"]["trigger"]
    assert "minute='15'" in jobs["coleta_diaria_backup"]["trigger"]
    assert "4:00:00" in jobs["atualizar_stats"]["trigger"]


def test_configurar_jobs_does_not_register_when_disabled(monkeypatch):
    clear_scheduler_jobs()
    monkeypatch.setattr(scheduler.settings, "scheduler_enabled", False)

    scheduler.configurar_jobs()

    assert scheduler.listar_jobs() == []
