import { Outlet } from "react-router"
import Sidebar from "../components/sidebar/Sidebar"
import UtilityPanel from "../components/utility/UtilityPanel"
import { useUi } from "../state/useUi"

export default function AppLayout() {
  const { sidebarOpen, setSidebarOpen, utilityPanelOpen, setUtilityPanelOpen } = useUi()

  return (
    <div className="h-screen overflow-hidden bg-base-200/95">
      <div className="mx-auto flex h-full max-w-[1860px] gap-3 p-3 lg:gap-3 lg:p-3">
        <aside className="hidden w-[18rem] min-w-[18rem] lg:block">
          <Sidebar />
        </aside>

        <main className="min-w-0 flex-1 rounded-2xl border border-base-300/70 bg-base-100/85">
          <Outlet />
        </main>

        <aside className="hidden w-[24rem] min-w-[24rem] lg:block xl:w-[25rem] xl:min-w-[25rem]">
          <UtilityPanel />
        </aside>
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
          <div className="absolute left-0 top-0 h-full w-[18.75rem] bg-base-200 p-3">
            <Sidebar />
          </div>
        </div>
      ) : null}

      {utilityPanelOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={() => setUtilityPanelOpen(false)}
            aria-label="Close utility panel"
          />
          <div className="absolute right-0 top-0 h-full w-[20rem] bg-base-200 p-3 sm:w-[24rem]">
            <UtilityPanel mobile />
          </div>
        </div>
      ) : null}
    </div>
  )
}
