import os
import sys

# Isolate unit tests to run against mock database
# so dummy test IDs never collide with or pollute the live Cloud Supabase database
os.environ["SUPABASE_KEY"] = ""

import backend.utils.supabase_client as sbc
import utils.supabase_client as root_sbc
from backend.utils.supabase_client import MockSupabaseClient

sbc._client_instance = MockSupabaseClient()
root_sbc._client_instance = MockSupabaseClient()
