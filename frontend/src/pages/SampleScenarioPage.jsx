import { Link, useNavigate, useParams } from "react-router"
import { getScenarioById } from "../data/mockData"
import { useUi } from "../state/useUi"

export default function SampleScenarioPage() {
  const navigate = useNavigate()
  const { scenarioId } = useParams()
  const { createNewChat, sendMessage, setSelectedMode } = useUi()
  const scenario = getScenarioById(scenarioId)

  async function runScenario(targetMode, promptText) {
    if (!scenario) {
      return
    }

    const prompt = typeof promptText === "string" && promptText.trim() ? promptText.trim() : scenario.samplePrompt
    const systemPrompt = scenario.systemPrompts?.[targetMode] || ""

    setSelectedMode(targetMode)
    const nextChatId = createNewChat({
      title: `${scenario.title} (${targetMode})`,
      scenarioId: scenario.id,
      systemPrompt,
    })
    navigate(`/chat/${nextChatId}`)
    await sendMessage(nextChatId, prompt, { systemPrompt })
  }

  if (!scenario) {
    return (
      <section className="flex h-full items-center justify-center rounded-box border border-base-300 bg-base-100 p-6">
        <div className="space-y-2 text-center">
          <p className="text-sm text-base-content/70">Scenario not found.</p>
          <Link className="btn btn-sm btn-primary" to="/samples">
            Back to Samples
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="h-full overflow-y-auto rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link to="/samples" className="btn btn-sm btn-ghost">
          Back
        </Link>
        <span className="badge badge-soft badge-warning">{scenario.category}</span>
      </div>

      <h2 className="text-2xl font-semibold">{scenario.title}</h2>
      <p className="mt-2 text-sm text-base-content/70">{scenario.summary}</p>

      <div className="mt-5 space-y-2">
        <p className="text-xs uppercase tracking-[0.16em] text-base-content/60">Sample Prompt</p>
        <div className="rounded-box border border-base-300 bg-base-200 p-3 text-sm">
          {scenario.samplePrompt}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-xs uppercase tracking-[0.16em] text-base-content/60">Prompt Examples</p>
        <div className="space-y-2">
          {(scenario.examples || []).map((example, index) => (
            <div key={`${scenario.id}-sample-${index}`} className="rounded-box border border-base-300 bg-base-100 p-3 text-sm">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-base-content/60">Example {index + 1}</p>
              <p className="mb-3">{example}</p>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-xs btn-soft" onClick={() => runScenario("unsecured", example)}>
                  Run Example (Unsecured)
                </button>
                <button className="btn btn-xs btn-primary" onClick={() => runScenario("secured", example)}>
                  Run Example (Secured)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-box border border-base-300 bg-base-200/60 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-base-content/60">Unsecured System Prompt</p>
          <p className="text-sm">{scenario.systemPrompts?.unsecured || "(none)"}</p>
        </div>
        <div className="rounded-box border border-base-300 bg-base-200/60 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-base-content/60">Secured System Prompt</p>
          <p className="text-sm">{scenario.systemPrompts?.secured || "(none)"}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button className="btn btn-primary btn-sm" onClick={() => runScenario("unsecured", scenario.samplePrompt)}>
          Run in Chat
        </button>
        <button className="btn btn-sm btn-soft" onClick={() => runScenario("secured", scenario.samplePrompt)}>
          Run in Secured Mode
        </button>
      </div>
    </section>
  )
}
