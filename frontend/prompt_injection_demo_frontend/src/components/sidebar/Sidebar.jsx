import { useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router"
import { ChevronDown, MoreHorizontal, ShieldAlert } from "lucide-react"
import { MessageSquarePlusIcon } from "../ui/message-square-plus"
import { SearchIcon } from "../ui/search"
import { SquarePenIcon } from "../ui/square-pen"
import { DeleteIcon } from "../ui/delete"
import { FlaskIcon } from "../ui/flask"
import { ShieldCheckIcon } from "../ui/shield-check"
import { demoModes } from "../../data/mockData"
import { useUi } from "../../state/useUi"

function chatLinkClass(isActive) {
  return `rounded-xl px-3 py-2 transition ${
    isActive ? "bg-base-300/75" : "hover:bg-base-300/45"
  }`
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { selectedMode, setSelectedMode, setSidebarOpen, chats, createNewChat, renameChat, deleteChat } = useUi()
  const [editingChatId, setEditingChatId] = useState(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [openMenuChatId, setOpenMenuChatId] = useState(null)
  const [chatSearch, setChatSearch] = useState("")

  const normalizedQuery = chatSearch.trim().toLowerCase()
  const filteredChats = chats.filter((chat) => {
    if (!normalizedQuery) return true
    return chat.title.toLowerCase().includes(normalizedQuery)
  })

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!event.target.closest("[data-chat-menu]")) {
        setOpenMenuChatId(null)
      }
    }

    document.addEventListener("click", handleDocumentClick)
    return () => {
      document.removeEventListener("click", handleDocumentClick)
    }
  }, [])

  useEffect(() => {
    function handleEscape(event) {
      if (event.key !== "Escape") {
        return
      }

      setOpenMenuChatId(null)
      if (editingChatId) {
        setEditingChatId(null)
        setEditingTitle("")
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [editingChatId])

  function handleCreateChat() {
    const nextChatId = createNewChat()
    navigate(`/chat/${nextChatId}`)
    setSidebarOpen(false)
  }

  function handleStartRename(chatId, currentTitle) {
    setOpenMenuChatId(null)
    setEditingChatId(chatId)
    setEditingTitle(currentTitle)
  }

  function handleCommitRename(chatId) {
    const didRename = renameChat(chatId, editingTitle)
    if (!didRename) {
      return
    }
    setEditingChatId(null)
    setEditingTitle("")
  }

  function handleDeleteChat(chatId) {
    setOpenMenuChatId(null)
    deleteChat(chatId)
    navigate("/chat/new")
  }

  function handleCancelRename() {
    setEditingChatId(null)
    setEditingTitle("")
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto rounded-2xl border border-base-300/70 bg-base-100/90 p-3 shadow-xl shadow-black/10">
      <div className="mb-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">Prompt Injection</p>
            <h1 className="text-xl font-semibold">Cyber Range</h1>
          </div>
          <button className="btn btn-circle btn-ghost btn-sm lg:hidden" onClick={() => setSidebarOpen(false)}>
            x
          </button>
        </div>

        <button className="btn btn-neutral btn-sm mb-3 w-full justify-start" onClick={handleCreateChat}>
          <MessageSquarePlusIcon size={16} className="mr-2" />
          New chat
        </button>

        <label className="input input-sm mb-2 w-full">
          <SearchIcon size={16} className="mr-2 text-base-content/60" />
          <input
            type="text"
            placeholder="Search chats"
            value={chatSearch}
            onChange={(event) => setChatSearch(event.target.value)}
            aria-label="Search chats"
          />
        </label>

        <label className="fieldset">
          <span className="fieldset-legend text-xs text-base-content/70">Mode</span>
          <div className="relative">
            <select
              className="select select-sm w-full appearance-none"
              value={selectedMode}
              onChange={(event) => setSelectedMode(event.target.value)}
            >
              {demoModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/60" />
          </div>
        </label>
      </div>

      <div className="rounded-xl border border-base-300/70 bg-base-200/35 p-2">
        <div className="px-2 py-2 text-xs uppercase tracking-[0.16em] text-base-content/60">Chats</div>
        {chats.length === 0 ? (
          <div className="rounded-box border border-dashed border-base-300 p-3 text-xs text-base-content/70">
            No chats yet. Create your first session.
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="rounded-box border border-dashed border-base-300 p-3 text-xs text-base-content/70">
            No chats match "{chatSearch}".
          </div>
        ) : (
          <ul className="space-y-1 pr-1">
            {filteredChats.map((chat) => (
              <li key={chat.id}>
                {editingChatId === chat.id ? (
                  <div className="rounded-xl bg-base-300/50 p-2">
                    <input
                      className="input input-sm mb-2 w-full"
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          handleCommitRename(chat.id)
                        }
                        if (event.key === "Escape") {
                          event.preventDefault()
                          handleCancelRename()
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button className="btn btn-xs btn-neutral" onClick={() => handleCommitRename(chat.id)}>
                        Save
                      </button>
                      <button className="btn btn-xs btn-ghost" onClick={handleCancelRename}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group flex items-center gap-1">
                    <NavLink
                      to={`/chat/${chat.id}`}
                      className={({ isActive }) => `${chatLinkClass(isActive)} min-w-0 flex-1`}
                      onClick={() => {
                        setOpenMenuChatId(null)
                        setSidebarOpen(false)
                      }}
                    >
                      <p className="truncate text-sm font-medium">{chat.title}</p>
                      <p className="text-xs text-base-content/60">{chat.updatedAt}</p>
                    </NavLink>

                    <details className="dropdown dropdown-end" open={openMenuChatId === chat.id} data-chat-menu>
                      <summary
                        className="btn btn-square btn-ghost btn-xs list-none"
                        onClick={(event) => {
                          event.preventDefault()
                          setOpenMenuChatId((previous) => (previous === chat.id ? null : chat.id))
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </summary>
                      <ul className="menu dropdown-content rounded-box z-20 mt-1 w-44 border border-base-300 bg-base-100 p-1 shadow-xl">
                        <li>
                          <button onClick={() => handleStartRename(chat.id, chat.title)}>
                            <SquarePenIcon size={14} className="mr-1" />
                            Rename chat
                          </button>
                        </li>
                        <li>
                          <button className="text-error" onClick={() => handleDeleteChat(chat.id)}>
                            <DeleteIcon size={14} className="mr-1" />
                            Delete chat
                          </button>
                        </li>
                      </ul>
                    </details>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-base-300/70 bg-base-200/35 p-2">
        <div className="px-2 py-2 text-xs uppercase tracking-[0.16em] text-base-content/60">Explore</div>
        <ul className="menu w-full p-0 text-sm">
          <li>
            <NavLink to="/samples" onClick={() => setSidebarOpen(false)}>
              <FlaskIcon size={16} className="mr-2" />
              Sample Prompts
            </NavLink>
          </li>
          <li>
            <a className="pointer-events-none opacity-60">
              <ShieldAlert className="mr-2 h-4 w-4" />
              Attack Scenarios (Soon)
            </a>
          </li>
          <li>
            <a className="pointer-events-none opacity-60">
              <ShieldCheckIcon size={16} className="mr-2" />
              Defense Notes (Soon)
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
