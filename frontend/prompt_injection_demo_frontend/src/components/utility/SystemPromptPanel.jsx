import { useUi } from "../../state/useUi"

export default function SystemPromptPanel() {
  const {
    draftSystemPrompt,
    setDraftSystemPrompt,
    promptScope,
    setPromptScope,
    activeChatId,
    applySystemPrompt,
    resetSystemPromptDraft,
    syncDraftSystemPrompt,
  } = useUi()

  function handleScopeChange(nextScope) {
    setPromptScope(nextScope)
    syncDraftSystemPrompt(activeChatId, nextScope)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-box border border-base-300 bg-base-100 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">System Prompt</p>
          <span className="badge badge-soft badge-info">Active</span>
        </div>

        <label className="fieldset">
          <span className="fieldset-legend text-xs text-base-content/70">Scope</span>
          <select
            className="select select-sm select-bordered w-full"
            value={promptScope}
            onChange={(event) => handleScopeChange(event.target.value)}
          >
            <option value="chat">This Chat</option>
            <option value="global">Global Default</option>
          </select>
        </label>

        <label className="fieldset mt-2">
          <span className="fieldset-legend text-xs text-base-content/70">Prompt Text</span>
          <textarea
            className="textarea textarea-bordered h-48 w-full"
            value={draftSystemPrompt}
            onChange={(event) => setDraftSystemPrompt(event.target.value)}
          />
        </label>

        <div className="mt-3 flex gap-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => applySystemPrompt(activeChatId)}
            disabled={promptScope === "chat" && !activeChatId}
          >
            Apply
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => resetSystemPromptDraft(activeChatId)}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
