from flask import Flask, jsonify, request
import os
import psycopg
from psycopg.rows import dict_row
import socket

app = Flask(__name__)
def get_db_connection():
    return psycopg.connect(
        host=os.environ["DB_HOST"],
        port=os.environ["DB_PORT"],
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        row_factory=dict_row
    )
ALLOWED_PRIORITIES = {
    "low",
    "medium",
    "high",
    "critical"
}

ALLOWED_STATUSES = {
    "open",
    "in-progress",
    "resolved"
}

@app.route("/api/tickets", methods=["GET"])
def get_tickets():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    id,
                    "user",
                    department,
                    issue,
                    priority,
                    technician,
                    status
                FROM tickets
                ORDER BY id DESC
            """)

            tickets = cur.fetchall()

    return jsonify(tickets)

@app.route("/api/tickets/<ticket_id>", methods=["GET"])
def get_ticket(ticket_id):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    id,
                    "user",
                    department,
                    issue,
                    priority,
                    technician,
                    status
                FROM tickets
                WHERE id = %s
            """, (ticket_id,))

            ticket = cur.fetchone()

    if ticket is None:
        return jsonify({"error": "ticket not found"}), 404

    return jsonify(ticket)


@app.route("/api/tickets", methods=["POST"])
def create_ticket():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "valid JSON body required"
        }), 400

    required_fields = [
        "user",
        "department",
        "issue"
    ]

    missing_fields = [
        field
        for field in required_fields
        if not str(data.get(field, "")).strip()
    ]

    if missing_fields:
        return jsonify({
            "error": "missing required fields",
            "fields": missing_fields
        }), 400

    priority = str(
        data.get("priority", "medium")
    ).strip().lower()

    if priority not in ALLOWED_PRIORITIES:
        return jsonify({
            "error": "invalid priority"
        }), 400

    technician = str(
        data.get("technician")
        or "Unassigned"
    ).strip()

    if not technician:
        technician = "Unassigned"

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO tickets (
                    "user",
                    department,
                    issue,
                    priority,
                    technician,
                    status
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING
                    id,
                    "user",
                    department,
                    issue,
                    priority,
                    technician,
                    status
            """, (
                str(data["user"]).strip(),
                str(data["department"]).strip(),
                str(data["issue"]).strip(),
                priority,
                technician,
                "open"
            ))

            ticket = cur.fetchone()

    return jsonify(ticket), 201

@app.route("/api/tickets/<ticket_id>", methods=["PATCH"])
def update_ticket(ticket_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not data:
        return jsonify({
            "error": "valid JSON body required"
        }), 400

    allowed_fields = {
        "status",
        "priority",
        "technician"
    }

    unknown_fields = set(data.keys()) - allowed_fields

    if unknown_fields:
        return jsonify({
            "error": "unsupported fields",
            "fields": sorted(unknown_fields)
        }), 400

    if "status" in data:
        data["status"] = str(
            data["status"]
        ).strip().lower()

        if data["status"] not in ALLOWED_STATUSES:
            return jsonify({
                "error": "invalid status"
            }), 400

    if "priority" in data:
        data["priority"] = str(
            data["priority"]
        ).strip().lower()

        if data["priority"] not in ALLOWED_PRIORITIES:
            return jsonify({
                "error": "invalid priority"
            }), 400

    if "technician" in data:
        data["technician"] = str(
            data["technician"]
        ).strip()

        if not data["technician"]:
            data["technician"] = "Unassigned"

    with get_db_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                SELECT id
                FROM tickets
                WHERE id = %s
            """, (ticket_id,))

            if cur.fetchone() is None:
                return jsonify({
                    "error": "ticket not found"
                }), 404

            if "status" in data:
                cur.execute("""
                    UPDATE tickets
                    SET status = %s
                    WHERE id = %s
                """, (
                    data["status"],
                    ticket_id
                ))

            if "priority" in data:
                cur.execute("""
                    UPDATE tickets
                    SET priority = %s
                    WHERE id = %s
                """, (
                    data["priority"],
                    ticket_id
                ))

            if "technician" in data:
                cur.execute("""
                    UPDATE tickets
                    SET technician = %s
                    WHERE id = %s
                """, (
                    data["technician"],
                    ticket_id
                ))

            cur.execute("""
                SELECT
                    id,
                    "user",
                    department,
                    issue,
                    priority,
                    technician,
                    status
                FROM tickets
                WHERE id = %s
            """, (ticket_id,))

            ticket = cur.fetchone()

    return jsonify(ticket)

@app.route("/api/assets", methods=["GET"])
def get_assets():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    id,
                    hostname,
                    "user",
                    type,
                    os,
                    ip,
                    department,
                    status
                FROM assets
                ORDER BY id
            """)

            assets = cur.fetchall()

    return jsonify(assets)


@app.route("/api/assets/<asset_id>", methods=["GET"])
def get_asset(asset_id):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    id,
                    hostname,
                    "user",
                    type,
                    os,
                    ip,
                    department,
                    status
                FROM assets
                WHERE id = %s
            """, (asset_id,))

            asset = cur.fetchone()

    if asset is None:
        return jsonify({"error": "asset not found"}), 404

    return jsonify(asset)


@app.route("/health")
@app.route("/api/core-health")
def health():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("SELECT COUNT(*) AS count FROM tickets")
                ticket_count = cur.fetchone()["count"]

                cur.execute("SELECT COUNT(*) AS count FROM assets")
                asset_count = cur.fetchone()["count"]

        return jsonify({
            "status": "ok",
            "service": "core-api",
            "instance": os.getenv("EC2_INSTANCE_ID", "local"),
            "container": socket.gethostname(),
            "database": "connected",
            "tickets": ticket_count,
            "assets": asset_count
        }), 200

    except psycopg.Error:
        app.logger.exception("Database health check failed")

        return jsonify({
            "status": "error",
            "service": "core-api",
            "database": "unavailable"
        }), 503


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8081))
    )