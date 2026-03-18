import { useContext } from "react"
import { UiContext } from "./uiContextValue"

export function useUi() {
  const context = useContext(UiContext)
  if (!context) {
    throw new Error("useUi must be used inside UiProvider")
  }
  return context
}
