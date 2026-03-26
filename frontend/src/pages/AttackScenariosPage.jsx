import { Link } from "react-router"
import { attackScenarios } from "../data/mockData"
import { useUi } from "../state/useUi"

export default function AttackScenariosPage() {
  const { chats } = useUi()

  return (
    <section className="h-full overflow-y-auto rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.16em] text-base-content/60">Attack Library</p>
        <h2 className="text-2xl font-semibold">Attack Scenarios</h2>
        <p className="mt-1 text-sm text-base-content/70">
          Start scenario-specific chats with preloaded prompts and system rules for secured or unsecured testing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {attackScenarios.map((scenario) => {
          const scenarioChatCount = chats.filter((chat) => chat.scenarioId === scenario.id).length
          return (
            <article key={scenario.id} className="card card-border bg-base-100">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h3 className="card-title text-base">{scenario.title}</h3>
                  <span className="badge badge-soft badge-error">{scenario.category}</span>
                </div>

                <p className="text-sm text-base-content/70">{scenario.summary}</p>

                <div className="rounded-box border border-base-300 bg-base-200 p-2 text-xs">
                  <p className="mb-1 font-semibold">Primary Prompt</p>
                  <p>{scenario.samplePrompt}</p>
                </div>

                <div className="text-xs text-base-content/70">Related chats: {scenarioChatCount}</div>

                <div className="card-actions justify-end">
                  <Link className="btn btn-sm btn-primary" to={`/attack-scenarios/${scenario.id}`}>
                    Open Scenario
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
