import { useState } from "react"
import { useNavigate } from "react-router"
import { PanelRightOpen, SendHorizontal, Square } from "lucide-react"
import { MenuIcon } from "../ui/menu"
import MarkdownMessage from "./MarkdownMessage"
import { attackScenarios } from "../../data/mockData"
import { useUi } from "../../state/useUi"

function modeBadgeClass(mode) {
  return mode === "secured" ? "badge-success" : "badge-warning"
}

export default function ChatWorkspace({ chatId }) {
  const navigate = useNavigate()
  const {
    selectedMode,
    setSidebarOpen,
    setUtilityPanelOpen,
    chats,
    sendMessage,
    stopStreaming,
    isChatStreaming,
    createNewChat,
  } = useUi()
  const [draftMessage, setDraftMessage] = useState("")

  const chat = chatId === "new" ? null : chats.find((item) => item.id === chatId)
  const streaming = chat ? isChatStreaming(chat.id) : false

  function handleCreateChat() {
    const nextChatId = createNewChat()
    navigate(`/chat/${nextChatId}`)
  }

  async function handleSend() {
    if (!chat) {
      return
    }

    const didSend = await sendMessage(chat.id, draftMessage)
    if (!didSend) return

    setDraftMessage("")
  }

  function handleMessageKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      if (streaming) {
        return
      }
      handleSend()
    }
  }

  function handleStop() {
    if (!chat) return
    stopStreaming(chat.id)
  }

  function handleRunSamplePrompt() {
    const firstSample = attackScenarios[0]
    if (!firstSample) {
      return
    }

    setDraftMessage(firstSample.samplePrompt)
  }

  if (!chat) {
    return (
      <section className="flex h-full min-h-0 flex-col items-center justify-center rounded-box border border-base-300 bg-base-100 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-base-content/60">New Session</p>
        <h2 className="mt-2 text-2xl font-semibold">No active chat selected</h2>
        <p className="mt-2 max-w-md text-sm text-base-content/70">
          Create a new chat to start testing prompt injection scenarios and to persist your session locally.
        </p>
        <button className="btn btn-primary mt-5" onClick={handleCreateChat}>
          Create Chat
        </button>
      </section>
    )
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      <header className="flex items-center justify-between border-b border-base-300 px-4 py-3">
        <div className="flex items-center gap-3">
          <button className="btn btn-square btn-sm btn-ghost lg:hidden" onClick={() => setSidebarOpen(true)}>
            <MenuIcon size={18} />
          </button>
          <div>
            <h2 className="text-sm font-semibold sm:text-base">{chat.title}</h2>
            <p className="text-xs text-base-content/60">Chat ID: {chat.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`badge badge-soft ${modeBadgeClass(selectedMode)}`}>
            {selectedMode === "secured" ? "Secured Demo" : "Unsecured Demo"}
          </span>
          {streaming ? <span className="badge badge-soft badge-info">Streaming</span> : null}
          <button className="btn btn-square btn-sm btn-ghost lg:hidden" onClick={() => setUtilityPanelOpen(true)}>
            <PanelRightOpen className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="space-y-4">
          {chat.messages.map((message, index) => {
            const isUser = message.role === "user"
            return (
              <div key={`${chat.id}-${index}`} className={`chat ${isUser ? "chat-end" : "chat-start"}`}>
                <div className="chat-header text-xs text-base-content/60">
                  {isUser ? "Analyst" : "Assistant"}
                </div>
                <div
                  className={`chat-bubble max-w-[85%] sm:max-w-[75%] ${
                    isUser ? "chat-bubble-primary" : "chat-bubble-neutral"
                  }`}
                >
                  <MarkdownMessage text={message.text} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <footer className="border-t border-base-300 px-4 py-3 sm:px-6">
        <label className="fieldset">
          <span className="fieldset-legend text-xs text-base-content/70">Send Message</span>
          <textarea
            className="textarea textarea-bordered h-24 w-full"
            placeholder="Type a message or paste an attack prompt for testing"
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            onKeyDown={handleMessageKeyDown}
            disabled={streaming}
          />
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={streaming || !draftMessage.trim()}>
            <SendHorizontal className="mr-1 h-4 w-4" />
            Send
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleStop} disabled={!streaming}>
            <Square className="mr-1 h-3.5 w-3.5" />
            Stop
          </button>
          <button className="btn btn-soft btn-sm" onClick={handleRunSamplePrompt} disabled={streaming}>
            Run Sample Prompt
          </button>
        </div>
      </footer>
    </section>
  )
}
