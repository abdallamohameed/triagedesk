from flask import Flask, render_template
import os

app = Flask(__name__)

CORE_API = os.getenv("CORE_API", "http://localhost:8081")
STATUS_API = os.getenv(
    "STATUS_API",
    "http://localhost:8082"
)

@app.route("/status")
def system_status():
    return render_template(
        "status.html",
        core_api=CORE_API,
        status_api=STATUS_API
    )

@app.route("/")
def dashboard():
    return render_template(
        "dashboard.html",
        core_api=CORE_API,
    )

@app.route("/assets/<asset_id>")
def asset_details(asset_id):
    return render_template(
        "asset-details.html",
        core_api=CORE_API,
        asset_id=asset_id,
        
    )

@app.route("/tickets")
def tickets():
    return render_template(
        "tickets.html",
        core_api=CORE_API,
        
    )


@app.route("/assets")
def assets():
    return render_template(
        "assets.html",
        core_api=CORE_API,
        
    )

@app.route("/tickets/<ticket_id>")
def ticket_details(ticket_id):
    return render_template(
        "ticket-details.html",
        core_api=CORE_API,
        ticket_id=ticket_id,
       
    )

@app.route("/health")
def health():
    return {
        "status": "ok",
        "service": "portal"
    }, 200


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8080))
    )