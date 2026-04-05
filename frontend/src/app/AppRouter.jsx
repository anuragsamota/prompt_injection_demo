import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import AppLayout from "../layout/AppLayout"
import ChatPage from "../pages/ChatPage"
import { UiProvider } from "../state/uiContext"

export default function AppRouter() {
  return (
    <UiProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate replace to="/chat/new" />} />
            <Route path="/chat/:chatId" element={<ChatPage />} />
            <Route path="*" element={<Navigate replace to="/chat/new" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UiProvider>
  )
}
