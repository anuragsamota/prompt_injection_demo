import { useEffect, useRef, useState } from "react"
import {
  createEmptyChat,
  consoleEvents,
  defaultSystemPrompt,
  formatRelativeNow,
  getInitialChats,
} from "../data/mockData"
import {
  getBackendConnectionStatus,
  getBackendHealthStatus,
  streamAssistantReply,
} from "../services/chatEngine"
import { loadPersistedState, savePersistedState } from "./persistence"
import { UiContext } from "./uiContextValue"

export function UiProvider({ children }) {
  const [persisted] = useState(() => loadPersistedState())

  const [selectedMode, setSelectedMode] = useState(persisted?.selectedMode ?? "unsecured")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [utilityPanelOpen, setUtilityPanelOpen] = useState(false)
  const [utilityTab, setUtilityTab] = useState(persisted?.utilityTab ?? "systemPrompt")
  const [consoleTab, setConsoleTab] = useState(persisted?.consoleTab ?? "logs")
  const [promptScope, setPromptScope] = useState(persisted?.promptScope ?? "chat")
  const [globalSystemPrompt, setGlobalSystemPrompt] = useState(
    persisted?.globalSystemPrompt ?? defaultSystemPrompt,
  )
  const [chatSystemPrompts, setChatSystemPrompts] = useState(persisted?.chatSystemPrompts ?? {})
  const [draftSystemPrompt, setDraftSystemPrompt] = useState(
    persisted?.draftSystemPrompt ?? defaultSystemPrompt,
  )
  const [chats, setChats] = useState(() => persisted?.chats ?? getInitialChats())
  const [activeChatId, setActiveChatId] = useState(persisted?.activeChatId ?? null)
  const [consoleEventList, setConsoleEventList] = useState(persisted?.consoleEvents ?? consoleEvents)
  const [streamingByChat, setStreamingByChat] = useState({})
  const [backendConnection, setBackendConnection] = useState({
    backendUp: false,
    backendDetails: "Not checked yet",
    ollamaConnected: false,
    modelAvailable: false,
    ollamaDetails: "Not checked yet",
    checking: false,
    model: null,
  })
  const streamControllersRef = useRef({})

  useEffect(() => {
    savePersistedState({
      selectedMode,
      utilityTab,
      consoleTab,
      promptScope,
      globalSystemPrompt,
      chatSystemPrompts,
      draftSystemPrompt,
      chats,
      activeChatId,
      consoleEvents: consoleEventList,
    })
  }, [
    selectedMode,
    utilityTab,
    consoleTab,
    promptScope,
    globalSystemPrompt,
    chatSystemPrompts,
    draftSystemPrompt,
    chats,
    activeChatId,
    consoleEventList,
  ])

  function createNewChat() {
    const nextId = `chat-${Date.now()}`
    const nextChat = createEmptyChat(nextId)
    setChats((prevChats) => [nextChat, ...prevChats])
    setActiveChatId(nextId)
    return nextId
  }

  function appendUserMessage(chatId, userText) {
    const cleanText = userText.trim()
    if (!cleanText) {
      return false
    }

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id !== chatId) {
          return chat
        }

        const nextTitle = chat.title === "New Chat" ? cleanText.slice(0, 40) : chat.title
        return {
          ...chat,
          title: nextTitle,
          updatedAt: formatRelativeNow(),
          messages: [...chat.messages, { role: "user", text: cleanText }],
        }
      }),
    )

    return true
  }

  function isChatStreaming(chatId) {
    return Boolean(streamingByChat[chatId])
  }

  function setChatStreaming(chatId, isStreaming) {
    setStreamingByChat((previous) => {
      if (!isStreaming) {
        const next = { ...previous }
        delete next[chatId]
        return next
      }

      return {
        ...previous,
        [chatId]: true,
      }
    })
  }

  function updateAssistantDraft(chatId, nextText) {
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id !== chatId) {
          return chat
        }

        const nextMessages = [...chat.messages]
        const lastMessage = nextMessages[nextMessages.length - 1]

        if (lastMessage?.role === "assistant" && lastMessage.streaming) {
          nextMessages[nextMessages.length - 1] = {
            ...lastMessage,
            text: nextText,
          }
        } else {
          nextMessages.push({
            role: "assistant",
            text: nextText,
            streaming: true,
          })
        }

        return {
          ...chat,
          updatedAt: formatRelativeNow(),
          messages: nextMessages,
        }
      }),
    )
  }

  function finalizeAssistantMessage(chatId, nextText) {
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id !== chatId) {
          return chat
        }

        const nextMessages = [...chat.messages]
        const lastMessage = nextMessages[nextMessages.length - 1]

        if (lastMessage?.role === "assistant" && lastMessage.streaming) {
          nextMessages[nextMessages.length - 1] = {
            role: "assistant",
            text: nextText,
          }
        } else if (nextText) {
          nextMessages.push({
            role: "assistant",
            text: nextText,
          })
        }

        return {
          ...chat,
          updatedAt: formatRelativeNow(),
          messages: nextMessages,
        }
      }),
    )
  }

  async function sendMessage(chatId, userText) {
    const cleanText = userText.trim()
    if (!cleanText || !chatId || isChatStreaming(chatId)) {
      return false
    }

    const chatExists = chats.some((chat) => chat.id === chatId)
    if (!chatExists) {
      return false
    }

    const targetChat = chats.find((chat) => chat.id === chatId)
    if (!targetChat) {
      return false
    }

    const historyMessages = targetChat.messages.map((message) => ({
      role: message.role,
      content: message.text,
    }))

    const ollamaMessages = [
      { role: "system", content: getActiveSystemPrompt(chatId) },
      ...historyMessages,
      { role: "user", content: cleanText },
    ]

    const sessionStart = historyMessages.length === 0

    appendUserMessage(chatId, cleanText)
    setActiveChatId(chatId)
    setChatStreaming(chatId, true)

    const controller = new AbortController()
    streamControllersRef.current[chatId] = controller

    addConsoleEvent({
      type: "logs",
      level: "info",
      source: "chat",
      message: `Sending message to ${selectedMode} backend`,
    })

    let streamedText = ""

    try {
      streamedText = await streamAssistantReply({
        messages: ollamaMessages,
        sessionStart,
        options: selectedMode === "secured" ? { temperature: 0.2 } : { temperature: 0.7 },
        signal: controller.signal,
        onToken: (partialText) => {
          streamedText = partialText
          updateAssistantDraft(chatId, partialText)
        },
        onEvent: (event) => addConsoleEvent(event),
      })

      finalizeAssistantMessage(chatId, streamedText)
      return true
    } catch (error) {
      if (error?.name === "AbortError") {
        finalizeAssistantMessage(chatId, streamedText)
        addConsoleEvent({
          type: "status",
          level: "warning",
          source: "chat",
          message: `Stream stopped for ${chatId}`,
        })
        return false
      }

      finalizeAssistantMessage(chatId, streamedText || "Unable to generate response.")
      addConsoleEvent({
        type: "status",
        level: "error",
        source: "backend",
        message: "Failed to process message",
      })
      return false
    } finally {
      setChatStreaming(chatId, false)
      delete streamControllersRef.current[chatId]
    }
  }

  function stopStreaming(chatId) {
    if (!chatId) {
      return
    }

    streamControllersRef.current[chatId]?.abort()
  }

  function renameChat(chatId, nextTitle) {
    const cleanTitle = nextTitle.trim()
    if (!cleanTitle) {
      return false
    }

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id !== chatId) {
          return chat
        }

        return {
          ...chat,
          title: cleanTitle,
          updatedAt: formatRelativeNow(),
        }
      }),
    )

    return true
  }

  function deleteChat(chatId) {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId))
    setChatSystemPrompts((prevPrompts) => {
      const nextPrompts = { ...prevPrompts }
      delete nextPrompts[chatId]
      return nextPrompts
    })

    if (activeChatId === chatId) {
      setActiveChatId(null)
      syncDraftSystemPrompt(null)
    }

    addConsoleEvent({
      type: "logs",
      level: "info",
      source: "chat",
      message: `Deleted ${chatId}`,
    })
  }

  function addConsoleEvent({ type, level, source, message }) {
    const nextEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      type,
      level,
      source,
      time: new Date().toLocaleTimeString(),
      message,
    }

    setConsoleEventList((prevEvents) => [nextEvent, ...prevEvents])
  }

  function clearConsoleEvents() {
    setConsoleEventList([])
  }

  async function checkBackendConnection({ silent = false } = {}) {
    setBackendConnection((prev) => ({ ...prev, checking: true }))

    try {
      const backendStatus = await getBackendHealthStatus()

      if (!backendStatus.backendUp) {
        setBackendConnection({
          backendUp: false,
          backendDetails: backendStatus.details,
          ollamaConnected: false,
          modelAvailable: false,
          ollamaDetails: "Unknown because backend is unreachable",
          checking: false,
          model: null,
        })

        if (!silent) {
          addConsoleEvent({
            type: "status",
            level: "error",
            source: "backend",
            message: "Backend server is not reachable",
          })
        }

        return {
          backendUp: false,
          ollamaConnected: false,
          modelAvailable: false,
        }
      }

      const status = await getBackendConnectionStatus()
      setBackendConnection({
        backendUp: true,
        backendDetails: backendStatus.details,
        ollamaConnected: status.connected,
        modelAvailable: status.modelAvailable,
        ollamaDetails: status.details,
        checking: false,
        model: status.model || null,
      })

      if (!silent) {
        addConsoleEvent({
          type: "status",
          level: status.connected && status.modelAvailable ? "success" : "warning",
          source: "ollama",
          message: status.connected
            ? status.modelAvailable
              ? `Connected to Ollama (${status.model})`
              : `Connected, but model missing (${status.model})`
            : "Ollama not reachable",
        })
      }

      return status
    } catch (error) {
      const details = String(error?.message || error)
      setBackendConnection({
        backendUp: false,
        backendDetails: details,
        ollamaConnected: false,
        modelAvailable: false,
        ollamaDetails: details,
        checking: false,
        model: null,
      })

      if (!silent) {
        addConsoleEvent({
          type: "status",
          level: "error",
          source: "ollama",
          message: "Failed to check Ollama connection",
        })
      }

      return {
        backendUp: false,
        ollamaConnected: false,
        modelAvailable: false,
        details,
      }
    }
  }

  useEffect(() => {
    const activeControllers = streamControllersRef.current

    return () => {
      Object.values(activeControllers).forEach((controller) => {
        controller.abort()
      })
    }
  }, [])

  useEffect(() => {
    checkBackendConnection({ silent: true })
    // Intentionally run once on provider mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function getActiveSystemPrompt(chatId) {
    return chatSystemPrompts[chatId] ?? globalSystemPrompt
  }

  function syncDraftSystemPrompt(chatId, scope = promptScope) {
    if (!chatId) {
      setDraftSystemPrompt(globalSystemPrompt)
      return
    }

    if (scope === "chat") {
      setDraftSystemPrompt(getActiveSystemPrompt(chatId))
      return
    }

    setDraftSystemPrompt(globalSystemPrompt)
  }

  function applySystemPrompt(chatId) {
    const trimmed = draftSystemPrompt.trim()
    if (!trimmed) {
      return
    }

    if (promptScope === "global") {
      setGlobalSystemPrompt(trimmed)
      addConsoleEvent({
        type: "status",
        level: "success",
        source: "system-prompt",
        message: "Global system prompt updated",
      })
      return
    }

    if (!chatId) {
      return
    }

    setChatSystemPrompts((prev) => ({
      ...prev,
      [chatId]: trimmed,
    }))

    addConsoleEvent({
      type: "status",
      level: "success",
      source: "system-prompt",
      message: `System prompt applied for ${chatId}`,
    })
  }

  function resetSystemPromptDraft(chatId) {
    if (promptScope === "global") {
      setDraftSystemPrompt(defaultSystemPrompt)
      return
    }

    if (!chatId) {
      setDraftSystemPrompt(defaultSystemPrompt)
      return
    }

    const activePrompt = chatSystemPrompts[chatId] ?? defaultSystemPrompt
    setDraftSystemPrompt(activePrompt)
  }

  const value = {
    selectedMode,
    setSelectedMode,
    sidebarOpen,
    setSidebarOpen,
    utilityPanelOpen,
    setUtilityPanelOpen,
    utilityTab,
    setUtilityTab,
    consoleTab,
    setConsoleTab,
    promptScope,
    setPromptScope,
    globalSystemPrompt,
    setGlobalSystemPrompt,
    chatSystemPrompts,
    setChatSystemPrompts,
    draftSystemPrompt,
    setDraftSystemPrompt,
    syncDraftSystemPrompt,
    applySystemPrompt,
    resetSystemPromptDraft,
    getActiveSystemPrompt,
    chats,
    activeChatId,
    setActiveChatId,
    createNewChat,
    appendUserMessage,
    sendMessage,
    stopStreaming,
    isChatStreaming,
    backendConnection,
    checkBackendConnection,
    renameChat,
    deleteChat,
    consoleEvents: consoleEventList,
    addConsoleEvent,
    clearConsoleEvents,
  }

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}
