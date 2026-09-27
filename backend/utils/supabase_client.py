import logging
import uuid
from typing import Any, Dict, List, Optional
from config import settings

logger = logging.getLogger(__name__)

# Fallback in-memory database storage for development/demo mode when real key is not yet set
class MockQueryBuilder:
    def __init__(self, table_name: str, store: Dict[str, List[Dict[str, Any]]]):
        self.table_name = table_name
        self.store = store
        self._filters = []
        self._order_field = None
        self._order_desc = False
        self._action = "select"
        self._payload = None

    def select(self, columns: str = "*"):
        self._action = "select"
        return self

    def insert(self, data: Any):
        self._action = "insert"
        self._payload = data if isinstance(data, list) else [data]
        return self

    def update(self, data: Dict[str, Any]):
        self._action = "update"
        self._payload = data
        return self

    def delete(self):
        self._action = "delete"
        return self

    def eq(self, column: str, value: Any):
        self._filters.append((column, "eq", str(value)))
        return self

    def neq(self, column: str, value: Any):
        self._filters.append((column, "neq", str(value)))
        return self

    def in_(self, column: str, values: List[Any]):
        self._filters.append((column, "in", [str(v) for v in values]))
        return self

    def order(self, column: str, desc: bool = False):
        self._order_field = column
        self._order_desc = desc
        return self

    def execute(self):
        table_rows = self.store.setdefault(self.table_name, [])
        
        if self._action == "insert":
            inserted = []
            for item in self._payload:
                new_row = dict(item)
                if "id" not in new_row:
                    new_row["id"] = str(uuid.uuid4())
                table_rows.append(new_row)
                inserted.append(new_row)
            return MockResponse(data=inserted)

        # Apply filters
        matched_rows = []
        for row in table_rows:
            matches = True
            for col, op, val in self._filters:
                row_val = str(row.get(col, ""))
                if op == "eq" and row_val != val:
                    matches = False
                    break
                elif op == "neq" and row_val == val:
                    matches = False
                    break
                elif op == "in" and row_val not in val:
                    matches = False
                    break
            if matches:
                matched_rows.append(row)

        if self._action == "update":
            for row in matched_rows:
                row.update(self._payload)
            return MockResponse(data=matched_rows)

        if self._action == "delete":
            for row in matched_rows:
                if row in table_rows:
                    table_rows.remove(row)
            return MockResponse(data=matched_rows)

        # Select action
        result = list(matched_rows)
        if self._order_field:
            result.sort(key=lambda x: x.get(self._order_field, 0), reverse=self._order_desc)

        return MockResponse(data=result)


class MockResponse:
    def __init__(self, data: Any):
        self.data = data


class MockSupabaseClient:
    def __init__(self):
        self.store: Dict[str, List[Dict[str, Any]]] = {
            "users": [],
            "hr_users": [],
            "candidates": [],
            "jobs": [],
            "job_requirements": [],
            "candidate_skills": [],
            "applications": [],
            "matching_results": []
        }

    def table(self, table_name: str):
        return MockQueryBuilder(table_name, self.store)

    def truncate_all(self):
        """Clear all records from all tables."""
        for key in self.store:
            self.store[key] = []


_client_instance = None

def get_supabase():
    """
    Initialize or return the cached Supabase client.
    If valid credentials are provided, connects to real Supabase.
    Otherwise, gracefully utilizes the local structured database adapter.
    """
    global _client_instance
    if _client_instance is not None:
        return _client_instance

    if settings.is_supabase_configured():
        try:
            from supabase import create_client
            _client_instance = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            logger.info("Connected to Supabase PostgreSQL at %s", settings.SUPABASE_URL)
            return _client_instance
        except Exception as e:
            logger.error("Failed to initialize Supabase client: %s. Falling back to local store.", e)

    # Use clean local structured store
    logger.info("Running with local database adapter.")
    _client_instance = MockSupabaseClient()
    return _client_instance
