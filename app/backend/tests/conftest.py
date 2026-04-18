import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ["DATABASE_URL"] = "sqlite:///./test_inventory.db"

import database  # noqa: E402
import main  # noqa: E402
import models  # noqa: E402


@pytest.fixture(autouse=True)
def reset_database():
    models.Base.metadata.drop_all(bind=database.engine)
    models.Base.metadata.create_all(bind=database.engine)
    with database.SessionLocal() as db:
        main.ensure_product_columns(db)
    yield
    models.Base.metadata.drop_all(bind=database.engine)


@pytest.fixture
def client():
    with TestClient(main.app) as test_client:
        yield test_client


@pytest.fixture
def supplier_payload():
    return {
        "name": "Acme Supplier",
        "contact_email": "ops@acme.com",
        "phone": "1234567890",
    }
