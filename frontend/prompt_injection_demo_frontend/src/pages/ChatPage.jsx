import { useEffect, useEffectEvent } from "react"
import { useParams } from "react-router"
import ChatWorkspace from "../components/chat/ChatWorkspace"
import { useUi } from "../state/useUi"

export default function ChatPage() {
  const { chatId = "new" } = useParams()
  const { setActiveChatId, syncDraftSystemPrompt } = useUi()

  const syncActiveChat = useEffectEvent((nextChatId) => {
    if (nextChatId === "new") {
      setActiveChatId(null)
      syncDraftSystemPrompt(null)
      return
    }

    setActiveChatId(nextChatId)
    syncDraftSystemPrompt(nextChatId)
  })

  useEffect(() => {
    syncActiveChat(chatId)
  }, [chatId])

  return <ChatWorkspace chatId={chatId} />
}
