import os
import sqlite3
import subprocess
import sys
from pathlib import Path


def test_seed_handles_legacy_users_table_without_language_preference(tmp_path):
    db_path = tmp_path / "legacy.db"
    connection = sqlite3.connect(db_path)
    try:
        connection.execute(
            """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                email VARCHAR NOT NULL,
                password_hash VARCHAR NOT NULL,
                role VARCHAR NOT NULL,
                employee_id INTEGER,
                is_active BOOLEAN NOT NULL DEFAULT 1
            )
            """
        )
        connection.commit()
    finally:
        connection.close()

    backend_dir = Path(__file__).resolve().parents[1]
    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{db_path.as_posix()}"

    result = subprocess.run(
        [sys.executable, "seed.py"],
        cwd=backend_dir,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr

    verification_connection = sqlite3.connect(db_path)
    try:
        columns = {
            row[1]
            for row in verification_connection.execute("PRAGMA table_info(users)")
        }
        assert "language_preference" in columns
    finally:
        verification_connection.close()
