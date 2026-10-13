const LIGHT = { red: '🔴', yellow: '🟡', green: '🟢' }

export default function ClauseCard({ clause, active }) {
  const { result, error, skip } = clause
  const level = result?.level
  const icon = skip ? '⚪' : error ? '⚠️' : level ? LIGHT[level] : active ? '⏳' : '·'

  return (
    <article className={`clause ${level ?? (skip ? 'skipped' : 'pending')}`}>
      <h3>
        <span className="light">{icon}</span> {clause.title}
      </h3>
      {result && (
        <>
          <p>{result.explanation}</p>
          {result.pushback && (
            <p className="pushback">
              <b>Ask for:</b> {result.pushback}
            </p>
          )}
        </>
      )}
      {error && <p className="error">Couldn't analyze this clause: {error}</p>}
      {skip && <p className="muted">Skipped ({skip}).</p>}
      {active && !result && <p className="muted">Reading…</p>}
      <details>
        <summary>Original text</summary>
        <blockquote>{clause.text}</blockquote>
      </details>
    </article>
  )
}
