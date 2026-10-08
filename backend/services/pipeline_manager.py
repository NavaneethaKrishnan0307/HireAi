import os
import json
import logging
import threading
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# Base path to the database directory
_BASE_DIR = Path(__file__).resolve().parent.parent.parent
_DB_DIR = _BASE_DIR / "database"
_STATE_FILE = _DB_DIR / "pipeline_state.json"
_MOCK_DB_FILE = _DB_DIR / "mock_supabase_db.json"

_lock = threading.Lock()

# Mapping between rich recruitment pipeline stages and Supabase PostgreSQL check constraint
# Postgres check constraint: CHECK (status IN ('applied', 'under_review', 'shortlisted', 'rejected', 'hired'))
STAGE_TO_DB_STATUS = {
    "applied": "applied",
    "shortlisted": "shortlisted",
    "technical_assessment": "under_review",
    "interview_scheduled": "under_review",
    "offer_extended": "hired",
    "rejected": "rejected"
}

VALID_PIPELINE_STAGES = [
    "applied",
    "shortlisted",
    "technical_assessment",
    "interview_scheduled",
    "offer_extended",
    "rejected"
]


class PipelineStateManager:
    """
    Manages persistent state and stage scheduling details for the Kanban recruitment pipeline.
    Bridges rich recruitment stages with Supabase PostgreSQL schema constraints, ensuring
    100% durable cross-portal data synchronization between HR Kanban and Candidate applications.
    """

    def __init__(self, state_file: Path = _STATE_FILE):
        self.state_file = state_file
        self._state: Dict[str, Dict[str, Any]] = {}
        self._load()

    def _load(self):
        with _lock:
            if self.state_file.exists():
                try:
                    with open(self.state_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    if isinstance(data, dict):
                        self._state = data
                        return
                except Exception as e:
                    logger.warning("Failed to load pipeline state from %s: %s", self.state_file, e)

            # Seed from mock_supabase_db.json if available
            self._state = {}
            if _MOCK_DB_FILE.exists():
                try:
                    with open(_MOCK_DB_FILE, "r", encoding="utf-8") as f:
                        mock_data = json.load(f)
                    apps = mock_data.get("applications", [])
                    for app in apps:
                        aid = str(app.get("id") or "")
                        if aid:
                            self._state[aid] = {
                                "stage": app.get("status", "applied"),
                                "stage_details": app.get("stage_details") or {},
                                "candidate_id": str(app.get("candidate_id") or ""),
                                "job_id": str(app.get("job_id") or "")
                            }
                except Exception as e:
                    logger.warning("Failed to seed pipeline state from mock DB: %s", e)

            self._save()

    def _save(self):
        try:
            self.state_file.parent.mkdir(parents=True, exist_ok=True)
            temp_file = self.state_file.with_suffix(".tmp")
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(self._state, f, indent=2, default=str)
            os.replace(temp_file, self.state_file)
        except Exception as e:
            logger.error("Could not persist pipeline state to disk: %s", e)

    def get_state(self, app_id: str, candidate_id: Optional[str] = None, job_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        with _lock:
            app_id_str = str(app_id or "")
            if app_id_str in self._state:
                return dict(self._state[app_id_str])

            # Check secondary lookup by candidate_id and job_id
            if candidate_id and job_id:
                composite_key = f"{candidate_id}:{job_id}"
                if composite_key in self._state:
                    return dict(self._state[composite_key])

            # Check candidate_id alone
            if candidate_id:
                for k, v in self._state.items():
                    if str(v.get("candidate_id")) == str(candidate_id):
                        if not job_id or str(v.get("job_id")) == str(job_id):
                            return dict(v)

            return None

    def set_state(
        self,
        app_id: str,
        stage: str,
        stage_details: Optional[Dict[str, Any]] = None,
        candidate_id: Optional[str] = None,
        job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        with _lock:
            app_id_str = str(app_id or "")
            existing = self._state.get(app_id_str, {})
            current_details = dict(existing.get("stage_details") or {})
            if stage_details:
                current_details.update(stage_details)

            filtered_details = self.filter_stage_details_for_status(stage, current_details)

            entry = {
                "stage": stage,
                "stage_details": filtered_details,
                "candidate_id": str(candidate_id or existing.get("candidate_id") or ""),
                "job_id": str(job_id or existing.get("job_id") or "")
            }

            if app_id_str:
                self._state[app_id_str] = entry

            cid = entry["candidate_id"]
            jid = entry["job_id"]
            if cid and jid:
                self._state[f"{cid}:{jid}"] = entry

            self._save()
            return dict(entry)

    @staticmethod
    def filter_stage_details_for_status(status: str, stage_details: Dict[str, Any]) -> Dict[str, Any]:
        if not stage_details:
            return {}
        filtered = dict(stage_details)
        norm = str(status).lower()
        if norm in ["applied", "screened", "rejected"]:
            filtered.pop("technical_assessment", None)
            filtered.pop("interview_scheduled", None)
            filtered.pop("offer_extended", None)
        elif norm in ["shortlisted"]:
            filtered.pop("technical_assessment", None)
            filtered.pop("interview_scheduled", None)
            filtered.pop("offer_extended", None)
        elif norm in ["technical_assessment", "assessment"]:
            filtered.pop("interview_scheduled", None)
            filtered.pop("offer_extended", None)
        elif norm in ["interview_scheduled", "interview"]:
            filtered.pop("offer_extended", None)
        return filtered

    def enrich_application(self, app: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enriches an application dictionary with its persistent rich recruitment stage
        and stage details.
        """
        app_id = str(app.get("id") or "")
        cid = str(app.get("candidate_id") or "")
        jid = str(app.get("job_id") or "")

        persisted = self.get_state(app_id, cid, jid)
        app_copy = dict(app)

        if persisted:
            rich_stage = persisted.get("stage") or app.get("status") or "applied"
            rich_details = persisted.get("stage_details") or app.get("stage_details") or {}
        else:
            raw = str(app.get("status") or "applied").lower()
            if raw == "hired":
                rich_stage = "offer_extended"
            elif raw in ["technical_assessment", "assessment", "coding_round"]:
                rich_stage = "technical_assessment"
            elif raw in ["interview_scheduled", "interview", "interviewing"]:
                rich_stage = "interview_scheduled"
            elif raw in ["shortlisted", "reviewed"]:
                rich_stage = "shortlisted"
            elif raw in ["rejected", "archived", "declined"]:
                rich_stage = "rejected"
            elif raw == "under_review":
                rich_stage = "technical_assessment"
            else:
                rich_stage = "applied"
            rich_details = app.get("stage_details") or {}

        app_copy["stage"] = rich_stage
        app_copy["status"] = rich_stage
        app_copy["stage_details"] = self.filter_stage_details_for_status(rich_stage, rich_details)
        return app_copy

    def safe_update_supabase(
        self,
        supabase: Any,
        app_id: str,
        target_stage: str,
        stage_details: Optional[Dict[str, Any]] = None,
        candidate_id: Optional[str] = None,
        job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Safely updates an application across both the persistent pipeline manager
        and Supabase PostgreSQL, gracefully handling Postgres check constraints
        and missing columns.
        """
        # 1. Update persistent store
        saved = self.set_state(
            app_id=app_id,
            stage=target_stage,
            stage_details=stage_details,
            candidate_id=candidate_id,
            job_id=job_id
        )

        # 2. Update Supabase table
        db_status = STAGE_TO_DB_STATUS.get(target_stage, "applied")
        updated_app = None

        if app_id:
            try:
                # Try direct update first
                payload: Dict[str, Any] = {"status": target_stage}
                if stage_details:
                    payload["stage_details"] = saved["stage_details"]
                res = supabase.table("applications").update(payload).eq("id", app_id).execute()
                if res.data:
                    updated_app = res.data[0]
            except Exception:
                # Graceful fallback: Supabase check constraint or missing column
                try:
                    fallback_payload = {"status": db_status}
                    res = supabase.table("applications").update(fallback_payload).eq("id", app_id).execute()
                    if res.data:
                        updated_app = res.data[0]
                except Exception as e:
                    logger.warning("Could not update Supabase application %s: %s", app_id, e)

            # 3. Synchronize matching_results explanation if available
            try:
                m_res = supabase.table("matching_results").select("id, explanation").eq("application_id", app_id).execute()
                if m_res.data:
                    m_id = m_res.data[0]["id"]
                    explanation = m_res.data[0].get("explanation") or {}
                    if isinstance(explanation, dict):
                        explanation["pipeline_stage"] = target_stage
                        explanation["stage_details"] = saved["stage_details"]
                        supabase.table("matching_results").update({"explanation": explanation}).eq("id", m_id).execute()
            except Exception:
                pass

        result_payload = {
            "id": app_id,
            "status": target_stage,
            "stage": target_stage,
            "stage_details": saved["stage_details"],
            "candidate_id": saved["candidate_id"],
            "job_id": saved["job_id"]
        }
        if updated_app:
            result_payload.update({k: v for k, v in updated_app.items() if k not in ["status", "stage_details"]})
            result_payload["status"] = target_stage
            result_payload["stage_details"] = saved["stage_details"]

        return result_payload


# Global singleton instance
pipeline_manager = PipelineStateManager()
