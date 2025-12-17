document.addEventListener("DOMContentLoaded", async function() {
    await loadLastUpdatedTimestamp();
    await loadExitLogsTabulator();
    await loadNextExecutions();
});

const EXIT_CODES = {
    OK: 1,
    WARNING: 30,
    ERROR: 40,
    CRITICAL: 50,
    FATAL: -999
};

const EXIT_STATUS_MAP = {
    [EXIT_CODES.OK]: { label: "OK", class: "exit-ok" },
    [EXIT_CODES.WARNING]: { label: "WARNING", class: "exit-warning" },
    [EXIT_CODES.ERROR]: { label: "ERROR", class: "exit-error" },
    [EXIT_CODES.CRITICAL]: { label: "CRITICAL", class: "exit-critical" },
    [EXIT_CODES.FATAL]: { label: "FATAL", class: "exit-fatal" }
};

const utcIsoToLuxonAkt = (utcIso) => luxon.DateTime.fromISO(utcIso, {zone: "utc"}).setZone("America/Anchorage")

const utcIsoToLongAktString = (utcIso) => {
    luxonAkt = utcIsoToLuxonAkt(utcIso);
    return luxonAkt.toLocaleString({
        weekday: "long",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    });
}

const loadLastUpdatedTimestamp = async () => {
    try {
        const response = await fetch("data/last_updated.json");
        const data_gen_timestamp = await response.json();
        const last_updated = utcIsoToLongAktString(data_gen_timestamp.last_updated);
        document.getElementById("last-updated").textContent = last_updated;
    } catch (error) {
        console.error("Error loading last updated timestamp:", error);
    }
};

const getExitStatusLabel = (exitCode) => {
    const status = EXIT_STATUS_MAP[exitCode];
    if (status) { return status.label; }
    console.warn("Unrecognized exit code:", exitCode);
    return "UNKNOWN";
};

const getExitStatusClass = (exitCode) => {
    const status = EXIT_STATUS_MAP[exitCode];
    if (status) { return status.class; }
    console.warn("Unrecognized exit code:", exitCode);
    return "";
};

const loadExitLogsTabulator = async () => {
    try {
        const response = await fetch("data/exit_log.json");
        const exitLogs = await response.json();

        const mobileQuery = window.matchMedia("(max-width: 768px)");

        const table = new Tabulator("#exit-log-table", {
            data: exitLogs,
            height:"100%",
            layout: mobileQuery.matches ? "fitDataStretch" : "fitColumns",
            pagination:true,
            paginationSize:25,
            paginationSizeSelector:[25, 50, 100, true],
            paginationButtonCount:0,
            resizableColumnFit:true,
            columns: [
                {
                    title: "Date",
                    field: "date",
                    sorter: "date",
                    sorterParams: {format: "MM-dd"},
                    resizable: "header",
                    headerFilter: "date",
                    headerFilterParams: {format: "MM-dd"},
                    mutator: (value) => utcIsoToLuxonAkt(value).toFormat("MM-dd"),
                },
                {
                    title: "Time",
                    field: "time",
                    sorter: "time",
                    sorterParams:{format: "HH:mm:ss"},
                    resizable: "header",
                    headerFilter: "time",
                    headerFilterParams: {format: "HH:mm:ss"},
                    headerFilterFunc: ">=",
                    mutator: (value) => utcIsoToLuxonAkt(value).toFormat("HH:mm:ss"),
                },
                {
                    title: "Project",
                    field: "project_name",
                    sorter: "string",
                    resizable: "header",
                    headerFilter: "list",
                    headerFilterParams: {valuesLookup: "active"},
                },
                {
                    title: "Status",
                    field: "exit_code",
                    sorter: "string",
                    hozAlign: "center",
                    resizable: "header",
                    headerFilter: "list",
                    headerFilterParams: {
                        valuesLookup: () => Object.entries(EXIT_CODES).map(([label, value]) => ({label, value}))
                    },
                    formatter: (cell) => getExitStatusLabel(cell.getValue()),
                }
            ],
            rowFormatter: (row) => {
                const exitCode = row.getData().exit_code;
                row.getElement().classList.add(getExitStatusClass(exitCode));
            }
        });
    } catch (error) {
        console.error("Error loading exit logs:", error);
    }
};

const loadNextExecutions = async () => {
    try {
        const response = await fetch("data/next_task_executions.json");
        const executions = await response.json();

        const container = document.getElementById("next-executions-list");

        for (const [projectName, executionTime] of Object.entries(executions)) {
            const item = document.createElement("div");
            item.className = "execution-item";
            item.innerHTML = `
                <strong>${projectName}</strong>
                <time>${utcIsoToLongAktString(executionTime)}</time>
            `;
            container.appendChild(item);
        }
    } catch (error) {
        console.error("Error loading next executions:", error);
    }
};
