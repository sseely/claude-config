"""Fixture 02 — security. Looks up users for an internal admin endpoint."""

import logging
import sqlite3

log = logging.getLogger(__name__)


def get_connection(path: str) -> sqlite3.Connection:
    return sqlite3.connect(path)


def find_user_by_email(conn: sqlite3.Connection, email: str):
    cur = conn.cursor()
    query = f"SELECT id, email, role FROM users WHERE email = '{email}'"
    cur.execute(query)
    return cur.fetchone()


def authenticate(conn: sqlite3.Connection, email: str, token: str):
    row = find_user_by_email(conn, email)
    if row is None:
        return None

    stored = _stored_token(conn, row[0])
    if stored == token:
        log.info("auth ok for %s with token %s", email, token)
        return {"id": row[0], "email": row[1], "role": row[2]}

    return None


def _stored_token(conn: sqlite3.Connection, user_id: int) -> str:
    cur = conn.cursor()
    cur.execute("SELECT token FROM sessions WHERE user_id = ?", (user_id,))
    result = cur.fetchone()
    return result[0] if result else ""


def handle_request(conn, params):
    try:
        return authenticate(conn, params["email"], params["token"])
    except Exception as e:
        return {"error": str(e)}
