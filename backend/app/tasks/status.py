from datetime import date, datetime, timezone
from uuid import uuid4

CollectionStatus = dict[str, str | None]

_statuses: dict[str, CollectionStatus] = {}
_latest_by_period: dict[str, str] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _period_key(data_inicio: date, data_fim: date | None = None) -> str:
    return f"{data_inicio}:{data_fim}" if data_fim else data_inicio.isoformat()


def create_collection_status(data_inicio: date, data_fim: date | None = None) -> CollectionStatus:
    job_id = str(uuid4())
    status: CollectionStatus = {
        "job_id": job_id,
        "status": "queued",
        "data_inicio": data_inicio.isoformat(),
        "data_fim": data_fim.isoformat() if data_fim else None,
        "message": "Coleta aguardando execucao.",
        "started_at": None,
        "finished_at": None,
    }
    _statuses[job_id] = status
    _latest_by_period[_period_key(data_inicio, data_fim)] = job_id
    return status


def mark_collection_running(job_id: str) -> None:
    status = _statuses[job_id]
    status["status"] = "running"
    status["message"] = "Coleta em andamento."
    status["started_at"] = _now()


def mark_collection_finished(job_id: str, status_value: str, message: str) -> None:
    status = _statuses[job_id]
    status["status"] = status_value
    status["message"] = message
    status["finished_at"] = _now()


def get_collection_status(job_id: str) -> CollectionStatus | None:
    return _statuses.get(job_id)


def get_latest_collection_status(data_inicio: date, data_fim: date | None = None) -> CollectionStatus | None:
    job_id = _latest_by_period.get(_period_key(data_inicio, data_fim))
    if not job_id:
        return None
    return get_collection_status(job_id)
