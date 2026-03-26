import { Link } from "react-router"
import { sampleScenarios } from "../data/mockData"

export default function SamplesPage() {
  return (
    <section className="h-full overflow-y-auto rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.16em] text-base-content/60">Prompt Library</p>
        <h2 className="text-2xl font-semibold">Sample Attack Prompts</h2>
        <p className="mt-1 text-sm text-base-content/70">
          Curated prompts to demonstrate direct, indirect, and obfuscated injection behavior.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sampleScenarios.map((scenario) => (
          <article key={scenario.id} className="card card-border bg-base-100">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <h3 className="card-title text-base">{scenario.title}</h3>
                <span className="badge badge-soft badge-info">{scenario.category}</span>
              </div>
              <p className="text-sm text-base-content/70">{scenario.summary}</p>
              <p className="text-xs text-base-content/60">Examples: {scenario.examples?.length || 0}</p>
              <div className="rounded-box border border-base-300 bg-base-200 p-2 text-xs">
                {scenario.samplePrompt}
              </div>
              <div className="card-actions justify-end">
                <Link className="btn btn-sm btn-primary" to={`/samples/${scenario.id}`}>
                  View Scenario
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
