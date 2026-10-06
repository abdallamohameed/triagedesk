from flask import Flask, jsonify
import socket
import platform
import os

app = Flask(__name__)





def runtime_info():
    return {
        "application": "TriageDesk",
        "service": "status-service",
        "hostname": socket.gethostname(),
        "platform": platform.system(),
        "environment": os.getenv("APP_ENV", "local"),
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "status": "healthy"
    }


@app.route("/api/status")
def status():
    return jsonify(runtime_info())


@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "status-service"
    }), 200


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8082))
    )