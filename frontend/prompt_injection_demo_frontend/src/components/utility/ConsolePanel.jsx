import { useUi } from "../../state/useUi"

const tabOptions = [
  { value: "logs", label: "Logs" },
  { value: "status", label: "Status" },
  { value: "messages", label: "Messages" },
]

function severityBadge(level) {
  if (level === "error") return "badge-error"
  if (level === "warning") return "badge-warning"
  if (level === "success") return "badge-success"
  return "badge-info"
}

export default function ConsolePanel() {
  const {
    consoleTab,
    setConsoleTab,
    consoleEvents,
    clearConsoleEvents,
    backendConnection,
    checkBackendConnection,
  } = useUi()
  const rows = consoleEvents.filter((event) => event.type === consoleTab)

  return (
    <div className="space-y-3">
      <div className="rounded-box border border-base-300 bg-base-100 p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Backend Console</p>
          <div className="flex items-center gap-2">
            <button className="btn btn-xs btn-ghost" onClick={() => checkBackendConnection()} disabled={backendConnection.checking}>
              {backendConnection.checking ? "Checking..." : "Check Ollama"}
            </button>
            <button className="btn btn-xs btn-ghost" onClick={clearConsoleEvents}>
              Clear
            </button>
          </div>
        </div>

        <div className="mb-3 rounded-box border border-base-300/70 bg-base-200/30 p-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="uppercase tracking-[0.12em] text-base-content/70">Backend Server</span>
            <span className={`badge badge-xs ${backendConnection.backendUp ? "badge-success" : "badge-error"}`}>
              {backendConnection.backendUp ? "Connected" : "Disconnected"}
            </span>
          </div>
          <p className="mt-1 text-base-content/70">{backendConnection.backendDetails}</p>
        </div>

        <div className="mb-3 rounded-box border border-base-300/70 bg-base-200/30 p-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="uppercase tracking-[0.12em] text-base-content/70">Ollama</span>
            <span className={`badge badge-xs ${backendConnection.ollamaConnected ? (backendConnection.modelAvailable ? "badge-success" : "badge-warning") : "badge-error"}`}>
              {backendConnection.ollamaConnected
                ? backendConnection.modelAvailable
                  ? "Connected"
                  : "Model Missing"
                : "Disconnected"}
            </span>
          </div>
          <p className="mt-1 text-base-content/70">{backendConnection.ollamaDetails}</p>
        </div>

        <div role="tablist" className="tabs tabs-border mb-3">
          {tabOptions.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              className={`tab ${consoleTab === tab.value ? "tab-active" : ""}`}
              onClick={() => setConsoleTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="rounded-box border border-dashed border-base-300 p-3 text-xs text-base-content/70">
            No backend events in this tab yet.
          </div>
        ) : (
          <div className="max-h-[48vh] overflow-auto rounded-box border border-base-300/70">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Source</th>
                  <th>Level</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap text-xs">{row.time}</td>
                    <td className="whitespace-nowrap text-xs uppercase">{row.source}</td>
                    <td>
                      <span className={`badge badge-xs ${severityBadge(row.level)}`}>{row.level}</span>
                    </td>
                    <td className="text-xs">{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
