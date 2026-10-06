CREATE SEQUENCE IF NOT EXISTS ticket_number_seq
START WITH 1045;


CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(20) PRIMARY KEY
        DEFAULT ('INC-' || nextval('ticket_number_seq')),

    "user" VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    issue TEXT NOT NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    technician VARCHAR(100) NOT NULL DEFAULT 'Unassigned',
    status VARCHAR(30) NOT NULL DEFAULT 'open'
);


CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(20) PRIMARY KEY,

    hostname VARCHAR(100) NOT NULL,
    "user" VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    os VARCHAR(100) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    department VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL
);


INSERT INTO tickets
(id, "user", department, issue, priority, technician, status)
VALUES
(
    'INC-1041',
    'Sara Ali',
    'Finance',
    'VPN authentication failed',
    'critical',
    'Ibrahim',
    'open'
),
(
    'INC-1042',
    'Omar Adel',
    'Sales',
    'Printer is offline',
    'medium',
    'Ahmed',
    'in-progress'
),
(
    'INC-1043',
    'Mahmoud Samir',
    'HR',
    'Outlook not syncing',
    'high',
    'Ibrahim',
    'resolved'
),
(
    'INC-1044',
    'Mona Khaled',
    'Operations',
    'Laptop running very slowly',
    'medium',
    'Omar',
    'open'
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO assets
(id, hostname, "user", type, os, ip, department, status)
VALUES
(
    'LT-021',
    'FIN-LT-021',
    'Sara Ali',
    'Laptop',
    'Windows 11',
    '10.10.20.15',
    'Finance',
    'online'
),
(
    'PC-014',
    'SAL-PC-014',
    'Omar Adel',
    'Desktop',
    'Windows 10',
    '10.10.20.25',
    'Sales',
    'offline'
),
(
    'SRV-01',
    'APP-SRV-01',
    'Infrastructure',
    'Server',
    'Linux',
    '10.10.10.10',
    'IT',
    'online'
)
ON CONFLICT (id) DO NOTHING;


SELECT setval(
    'ticket_number_seq',
    GREATEST(
        1044,
        COALESCE(
            (
                SELECT MAX(
                    CAST(SUBSTRING(id FROM 5) AS INTEGER)
                )
                FROM tickets
                WHERE id ~ '^INC-[0-9]+$'
            ),
            1044
        )
    ),
    true
);