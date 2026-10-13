import { useState } from 'react'
import ClauseCard from './ClauseCard.jsx'
import { buildEmail } from '../contract/email.js'

const FILTERS = [
  { id: 'issues', label: 'Issues only' },
  { id: 'all', label: 'All clauses' },
]

export default function Results({
  clauses,
  activeId,
  running,
  onCancel,
  onReset,
  onRetry,
  gpuLost,
  canUseSmaller,
  secondsPerClause,
}) {
  const [filter, setFilter] = useState('issues')
  const [copied, setCopied] = useState(false)

  const toAnalyze = clauses.filter((c) => !c.skip)
  const done = toAnalyze.filter((c) => c.result || c.error).length
  const remaining = toAnalyze.length - done
  const unfinished = toAnalyze.some((c) => !c.result)
  const eta = secondsPerClause ? Math.ceil((remaining * secondsPerClause) / 60) : null
  const count = (level) => clauses.filter((c) => c.result?.level === level).length

  const visible =
    filter === 'all'
      ? clauses
      : clauses.filter((c) => c.id === activeId || c.error || (c.result && c.result.level !== 'green'))
  const email = buildEmail(clauses)

  async function copyEmail() {
    await navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section>
      <div className="summary">
        <span className="chip red">🔴 {count('red')} to change</span>
        <span className="chip yellow">🟡 {count('yellow')} to negotiate</span>
        <span className="chip green">🟢 {count('green')} fine</span>
      </div>

      {gpuLost && !running && (
        <div className="notice">
          <b>Your graphics card ran out of memory</b> after {done} of {toAnalyze.length} clauses. Close other tabs and
          apps, then pick up where it stopped. The page reloads and keeps what's already done.
          <div className="actions">
            <button onClick={() => onRetry(false)}>Reload and continue</button>
            {canUseSmaller && (
              <button className="secondary" onClick={() => onRetry(true)}>Continue with a smaller model</button>
            )}
          </div>
        </div>
      )}
      {!gpuLost && !running && unfinished && (
        <div className="actions">
          <button className="secondary" onClick={() => onRetry(false)}>Analyze the remaining clauses</button>
        </div>
      )}

      {running ? (
        <div className="progress">
          <progress value={done} max={toAnalyze.length} />
          <span>
            Reading clause {Math.min(done + 1, toAnalyze.length)} of {toAnalyze.length}
            {eta !== null && remaining > 0 ? ` · about ${eta} min left` : ''}
          </span>
          <button className="secondary" onClick={onCancel}>Stop</button>
        </div>
      ) : (
        <div className="actions">
          <button onClick={copyEmail} disabled={!email}>{copied ? 'Copied ✓' : 'Copy email to client'}</button>
          <button className="secondary" onClick={onReset}>Review another contract</button>
        </div>
      )}

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f.id} className={filter === f.id ? 'tab active' : 'tab'} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {visible.map((c) => (
        <ClauseCard key={c.id} clause={c} active={c.id === activeId} />
      ))}
      {!running && filter === 'issues' && visible.length === 0 && (
        <p className="muted">Nothing to flag. Still read it before you sign.</p>
      )}
    </section>
  )
}
