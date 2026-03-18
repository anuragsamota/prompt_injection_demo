import { useUi } from "../../state/useUi"
import ConsolePanel from "./ConsolePanel"
import SystemPromptPanel from "./SystemPromptPanel"

export default function UtilityPanel({ mobile = false }) {
  const { utilityTab, setUtilityTab, setUtilityPanelOpen } = useUi()

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="rounded-box border border-base-300 bg-base-100 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-base-content/60">Utilities</p>
            <h2 className="text-sm font-semibold">Prompt + Console</h2>
          </div>
          {mobile ? (
            <button className="btn btn-xs btn-ghost" onClick={() => setUtilityPanelOpen(false)}>
              Close
            </button>
          ) : null}
        </div>

        <div role="tablist" className="tabs tabs-box bg-base-200 p-1">
          <button
            role="tab"
            className={`tab flex-1 ${utilityTab === "systemPrompt" ? "tab-active" : ""}`}
            onClick={() => setUtilityTab("systemPrompt")}
          >
            System Prompt
          </button>
          <button
            role="tab"
            className={`tab flex-1 ${utilityTab === "console" ? "tab-active" : ""}`}
            onClick={() => setUtilityTab("console")}
          >
            Console
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {utilityTab === "systemPrompt" ? <SystemPromptPanel /> : <ConsolePanel />}
      </div>
    </div>
  )
}
