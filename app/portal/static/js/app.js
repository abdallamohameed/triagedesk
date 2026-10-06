const API = window.TRIAGEDESK.coreApi;
const STATUS_API =
    window.TRIAGEDESK.statusApi;
let tickets = [];
let assets = [];
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
async function loadSystemStatus() {

    const coreStatus =
        document.getElementById(
            "coreStatus"
        );

    if (!coreStatus)
        return;


    try {

        const coreResponse =
            await fetch(
                "/api/core-health"
            );


        if (coreResponse.ok) {

            coreStatus.textContent =
                "Operational";

        } else {

            coreStatus.textContent =
                "Unavailable";

        }

    } catch (error) {

        coreStatus.textContent =
            "Unavailable";

    }


    try {

        const response =
            await fetch(
                `${STATUS_API}/api/status`
            );


        if (!response.ok)
            throw new Error();


        const info =
            await response.json();


        document.getElementById(
            "runtimeStatus"
        ).textContent =
            "Operational";


        document.getElementById(
            "runtimeApplication"
        ).textContent =
            info.application;


        document.getElementById(
            "runtimeHostname"
        ).textContent =
            info.hostname;


        document.getElementById(
            "runtimePlatform"
        ).textContent =
            info.platform;


        document.getElementById(
            "runtimeEnvironment"
        ).textContent =
            info.environment;


        document.getElementById(
            "runtimeVersion"
        ).textContent =
            info.version;


    } catch (error) {

        document.getElementById(
            "runtimeStatus"
        ).textContent =
            "Unavailable";

    }

}

async function fetchTickets() {

    try {

        const response =
            await fetch(
                `${API}/api/tickets`
            );

        tickets =
            await response.json();

        return tickets;

    } catch (error) {

        console.error(
            "Unable to load tickets",
            error
        );

        return [];

    }

}


async function fetchAssets() {

    try {

        const response =
            await fetch(
                `${API}/api/assets`
            );

        assets =
            await response.json();

        return assets;

    } catch (error) {

        console.error(
            "Unable to load assets",
            error
        );

        return [];

    }

}


function label(value) {

    return value
        .replace("-", " ")
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


async function loadDashboard() {

    const recentContainer =
        document.getElementById(
            "recentTickets"
        );

    if (!recentContainer)
        return;


    await Promise.all([
        fetchTickets(),
        fetchAssets()
    ]);


    const open =
        tickets.filter(
            t =>
                t.status === "open"
                ||
                t.status ===
                "in-progress"
        ).length;


    const critical =
        tickets.filter(
            t =>
                t.priority ===
                "critical"
        ).length;


    const resolved =
        tickets.filter(
            t =>
                t.status ===
                "resolved"
        ).length;


    const online =
        assets.filter(
            a =>
                a.status ===
                "online"
        ).length;


    const offline =
        assets.filter(
            a =>
                a.status ===
                "offline"
        ).length;


    document.getElementById(
        "openTickets"
    ).textContent = open;


    document.getElementById(
        "criticalTickets"
    ).textContent = critical;


    document.getElementById(
        "resolvedTickets"
    ).textContent = resolved;


    document.getElementById(
        "assetCount"
    ).textContent =
        assets.length;


    document.getElementById(
        "onlineAssets"
    ).textContent = online;


    document.getElementById(
        "offlineAssets"
    ).textContent = offline;


    recentContainer.innerHTML =
        tickets
        .slice(0, 4)
        .map(
            ticket => `

            <div class="ticket-item">

                <div class="ticket-meta">

                    <strong>
                        ${escapeHtml(ticket.id)}
                        — ${escapeHtml(ticket.issue)}
                    </strong>

                    <small>
                        ${escapeHtml(ticket.user)}
                        •
                        ${escapeHtml(ticket.department)}
                    </small>

                </div>

                <span
                    class="
                        badge
                        priority-${ticket.priority}
                    "
                >
                    ${label(
                        ticket.priority
                    )}
                </span>

            </div>

        `
        )
        .join("");

}


async function loadTicketPage() {

    const table =
        document.getElementById(
            "ticketTable"
        );

    if (!table)
        return;


    await fetchTickets();

    renderTickets();


    document
    .getElementById(
        "ticketSearch"
    )
    .addEventListener(
        "input",
        renderTickets
    );


    document
    .getElementById(
        "ticketStatusFilter"
    )
    .addEventListener(
        "change",
        renderTickets
    );


    document
    .getElementById(
        "ticketPriorityFilter"
    )
    .addEventListener(
        "change",
        renderTickets
    );

}


function renderTickets() {

    const table =
        document.getElementById(
            "ticketTable"
        );


    const search =
        document
        .getElementById(
            "ticketSearch"
        )
        .value
        .toLowerCase();


    const status =
        document
        .getElementById(
            "ticketStatusFilter"
        )
        .value;


    const priority =
        document
        .getElementById(
            "ticketPriorityFilter"
        )
        .value;


    const filtered =
        tickets.filter(
            ticket => {

                const text =
                    `
                    ${escapeHtml(ticket.user)}
                    ${escapeHtml(ticket.issue)}
                    ${escapeHtml(ticket.department)}
                    ${escapeHtml(ticket.technician)}
                    `
                    .toLowerCase();


                const searchOk =
                    text.includes(
                        search
                    );


                const statusOk =
                    status === "all"
                    ||
                    ticket.status
                    === status;


                const priorityOk =
                    priority === "all"
                    ||
                    ticket.priority
                    === priority;


                return (
                    searchOk
                    &&
                    statusOk
                    &&
                    priorityOk
                );

            }
        );


    table.innerHTML =
        filtered
        .map(
            ticket => `

            <tr>

                <td>

    <a
        class="ticket-link"
        href="/tickets/${encodeURIComponent(ticket.id)}"
    >
        ${escapeHtml(ticket.id)}
    </a>

</td>

                <td>
                    ${escapeHtml(ticket.user)}
                </td>

                <td>
                    ${escapeHtml(ticket.issue)}
                </td>

                <td>
                    ${escapeHtml(ticket.department)}
                </td>

                <td>

                    <span
                        class="
                            badge
                            priority-${ticket.priority}
                        "
                    >

                        ${label(
                            ticket.priority
                        )}

                    </span>

                </td>

                <td>
                    ${escapeHtml(ticket.technician)}
                </td>

                <td>

                    <span
                        class="
                            badge
                            status-${ticket.status}
                        "
                    >

                        ${label(
                            ticket.status
                        )}

                    </span>

                </td>

            </tr>

        `
        )
        .join("");

}


function openTicketModal() {

    document
    .getElementById(
        "ticketModal"
    )
    .classList
    .remove("hidden");

}


function closeTicketModal() {

    document
    .getElementById(
        "ticketModal"
    )
    .classList
    .add("hidden");

}


const ticketForm =
    document.getElementById(
        "ticketForm"
    );


if (ticketForm) {

    ticketForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const payload = {

                user:
                    document
                    .getElementById(
                        "ticketUser"
                    )
                    .value,

                department:
                    document
                    .getElementById(
                        "ticketDepartment"
                    )
                    .value,

                issue:
                    document
                    .getElementById(
                        "ticketIssue"
                    )
                    .value,

                priority:
                    document
                    .getElementById(
                        "ticketPriority"
                    )
                    .value,

                technician:
                    document
                    .getElementById(
                        "ticketTechnician"
                    )
                    .value

            };


            const response =
                await fetch(
                    `${API}/api/tickets`,
                    {

                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )

                    }
                );


            if (response.ok) {

                ticketForm.reset();

                closeTicketModal();

                await fetchTickets();

                renderTickets();

            }

        }
    );

}


async function loadAssetsPage() {

    const table =
        document.getElementById(
            "assetTable"
        );

    if (!table)
        return;


    await fetchAssets();

    renderAssets();


    document
    .getElementById(
        "assetSearch"
    )
    .addEventListener(
        "input",
        renderAssets
    );


    document
    .getElementById(
        "assetStatusFilter"
    )
    .addEventListener(
        "change",
        renderAssets
    );


    document
    .getElementById(
        "assetTypeFilter"
    )
    .addEventListener(
        "change",
        renderAssets
    );

}


function renderAssets() {

    const table =
        document.getElementById(
            "assetTable"
        );


    const search =
        document
        .getElementById(
            "assetSearch"
        )
        .value
        .toLowerCase();


    const status =
        document
        .getElementById(
            "assetStatusFilter"
        )
        .value;


    const type =
        document
        .getElementById(
            "assetTypeFilter"
        )
        .value;


    const filtered =
        assets.filter(
            asset => {

                const text =
                    `
                    ${asset.id}
                    ${asset.hostname}
                    ${asset.user}
                    ${asset.department}
                    ${asset.ip}
                    `
                    .toLowerCase();


                const searchOk =
                    text.includes(search);


                const statusOk =
                    status === "all"
                    ||
                    asset.status
                    === status;


                const typeOk =
                    type === "all"
                    ||
                    asset.type
                    === type;


                return (
                    searchOk
                    &&
                    statusOk
                    &&
                    typeOk
                );

            }
        );


    table.innerHTML =
        filtered
        .map(
            asset => `

            <tr>

                <td>

    <a
        class="ticket-link"
        href="/assets/${encodeURIComponent(asset.id)}"
    >
        ${asset.id}
    </a>

</td>

                <td>
                    ${asset.hostname}
                </td>

                <td>
                    ${asset.user}
                </td>

                <td>
                    ${asset.type}
                </td>

                <td>
                    ${asset.os}
                </td>

                <td>
                    ${asset.ip}
                </td>

                <td>
                    ${asset.department}
                </td>

                <td
                    class="
                        asset-${asset.status}
                    "
                >
                    ●
                    ${label(
                        asset.status
                    )}
                </td>

            </tr>

        `
        )
        .join("");

}
async function loadTicketDetails() {

    const container =
        document.getElementById(
            "ticketDetails"
        );

    if (!container)
        return;


    const ticketId =
        container.dataset.ticketId;


    try {

        const response =
            await fetch(
                `${API}/api/tickets/${ticketId}`
            );


        if (!response.ok) {

            container.innerHTML = `
                <div class="panel details-card">
                    Ticket not found.
                </div>
            `;

            return;

        }


        const ticket =
            await response.json();


        container.innerHTML = `

            <div class="details-header">

                <div>

                    <a
                        href="/tickets"
                        class="back-link"
                    >
                        ← Back to Tickets
                    </a>

                    <p class="eyebrow">
                        SUPPORT INCIDENT
                    </p>

                    <h2>
                        ${escapeHtml(ticket.id)}
                    </h2>

                    <p class="details-issue">
                        ${escapeHtml(ticket.issue)}
                    </p>

                </div>


                <span
                    class="
                        badge
                        status-${ticket.status}
                        large-badge
                    "
                >
                    ${label(ticket.status)}
                </span>

            </div>


            <div class="details-layout">


                <div class="panel details-card">

                    <h3>
                        Incident Information
                    </h3>


                    <div class="detail-row">

                        <span>User</span>

                        <strong>
                            ${escapeHtml(ticket.user)}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>Department</span>

                        <strong>
                            ${escapeHtml(ticket.department)}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>Issue</span>

                        <strong>
                            ${escapeHtml(ticket.issue)}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>Priority</span>

                        <span
                            class="
                                badge
                                priority-${ticket.priority}
                            "
                        >
                            ${label(ticket.priority)}
                        </span>

                    </div>


                    <div class="detail-row">

                        <span>Assigned Technician</span>

                        <strong>
                            ${escapeHtml(ticket.technician)}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>Status</span>

                        <span
                            class="
                                badge
                                status-${ticket.status}
                            "
                        >
                            ${label(ticket.status)}
                        </span>

                    </div>

                </div>


                <div class="panel details-card">

                    <h3>
                        Update Ticket
                    </h3>


                    <form id="updateTicketForm">

                        <label>
                            Status
                        </label>

                        <select id="updateStatus">

                            <option
                                value="open"
                                ${
                                    ticket.status ===
                                    "open"
                                    ?
                                    "selected"
                                    :
                                    ""
                                }
                            >
                                Open
                            </option>

                            <option
                                value="in-progress"
                                ${
                                    ticket.status ===
                                    "in-progress"
                                    ?
                                    "selected"
                                    :
                                    ""
                                }
                            >
                                In Progress
                            </option>

                            <option
                                value="resolved"
                                ${
                                    ticket.status ===
                                    "resolved"
                                    ?
                                    "selected"
                                    :
                                    ""
                                }
                            >
                                Resolved
                            </option>

                        </select>


                        <label>
                            Priority
                        </label>

                        <select id="updatePriority">

                            <option
                                value="low"
                                ${
                                    ticket.priority ===
                                    "low"
                                    ?
                                    "selected"
                                    :
                                    ""
                                }
                            >
                                Low
                            </option>

                            <option
                                value="medium"
                                ${
                                    ticket.priority ===
                                    "medium"
                                    ?
                                    "selected"
                                    :
                                    ""
                                }
                            >
                                Medium
                            </option>

                            <option
                                value="high"
                                ${
                                    ticket.priority ===
                                    "high"
                                    ?
                                    "selected"
                                    :
                                    ""
                                }
                            >
                                High
                            </option>

                            <option
                                value="critical"
                                ${
                                    ticket.priority ===
                                    "critical"
                                    ?
                                    "selected"
                                    :
                                    ""
                                }
                            >
                                Critical
                            </option>

                        </select>


                        <label>
                            Technician
                        </label>

                        <input
                            id="updateTechnician"
                            value="${escapeHtml(ticket.technician)}"
                        >


                        <button
                            type="submit"
                            class="
                                primary-btn
                                full-width
                            "
                        >
                            Save Changes
                        </button>

                    </form>

                </div>

            </div>

        `;


        document
        .getElementById(
            "updateTicketForm"
        )
        .addEventListener(
            "submit",
            event =>
                updateTicket(
                    event,
                    ticketId
                )
        );


    } catch (error) {

        console.error(error);

        container.innerHTML = `
            Unable to load ticket.
        `;

    }

}



async function updateTicket(
    event,
    ticketId
) {

    event.preventDefault();


    const payload = {

        status:
            document
            .getElementById(
                "updateStatus"
            )
            .value,

        priority:
            document
            .getElementById(
                "updatePriority"
            )
            .value,

        technician:
            document
            .getElementById(
                "updateTechnician"
            )
            .value

    };


    const response =
        await fetch(
            `${API}/api/tickets/${ticketId}`,
            {

                method: "PATCH",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


    if (response.ok) {

        await loadTicketDetails();

    } else {

        alert(
            "Unable to update ticket"
        );

    }

}

async function loadAssetDetails() {

    const container =
        document.getElementById(
            "assetDetails"
        );

    if (!container)
        return;


    const assetId =
        container.dataset.assetId;


    try {

        const response =
            await fetch(
                `${API}/api/assets/${assetId}`
            );


        if (!response.ok) {

            container.innerHTML = `
                <div class="panel details-card">
                    Asset not found.
                </div>
            `;

            return;

        }


        const asset =
            await response.json();


        container.innerHTML = `

            <div class="details-header">

                <div>

                    <a
                        href="/assets"
                        class="back-link"
                    >
                        ← Back to Assets
                    </a>

                    <p class="eyebrow">
                        MANAGED DEVICE
                    </p>

                    <h2>
                        ${asset.id}
                    </h2>

                    <p class="details-issue">
                        ${asset.hostname}
                    </p>

                </div>


                <span
                    class="
                        badge
                        ${asset.status === "online"
                            ? "status-resolved"
                            : "priority-critical"}
                        large-badge
                    "
                >
                    ${label(asset.status)}
                </span>

            </div>


            <div class="details-layout">


                <div class="panel details-card">

                    <h3>
                        Asset Information
                    </h3>


                    <div class="detail-row">

                        <span>Asset ID</span>

                        <strong>
                            ${asset.id}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>Hostname</span>

                        <strong>
                            ${asset.hostname}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>Assigned User</span>

                        <strong>
                            ${asset.user}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>Department</span>

                        <strong>
                            ${asset.department}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>Device Type</span>

                        <strong>
                            ${asset.type}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>Operating System</span>

                        <strong>
                            ${asset.os}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>IP Address</span>

                        <strong>
                            ${asset.ip}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>Status</span>

                        <strong>
                            ${label(asset.status)}
                        </strong>

                    </div>

                </div>


                <div class="panel details-card">

                    <h3>
                        Quick Summary
                    </h3>

                    <p>
                        This device is registered in the
                        TriageDesk asset inventory.
                    </p>

                    <div class="asset-summary-box">

                        <span>
                            Owner
                        </span>

                        <strong>
                            ${asset.user}
                        </strong>

                    </div>

                    <div class="asset-summary-box">

                        <span>
                            Department
                        </span>

                        <strong>
                            ${asset.department}
                        </strong>

                    </div>

                    <div class="asset-summary-box">

                        <span>
                            Connectivity
                        </span>

                        <strong>
                            ${label(asset.status)}
                        </strong>

                    </div>

                </div>

            </div>

        `;


    } catch (error) {

        console.error(error);

        container.innerHTML = `
            Unable to load asset.
        `;

    }

}
loadDashboard();
loadTicketPage();
loadAssetsPage();
loadTicketDetails();
loadAssetDetails();
loadSystemStatus();