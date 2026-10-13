import { useEffect, useRef, useState } from 'react'
import { MODELS, checkWebGPU, isCached, isGpuLost, loadEngine } from './llm/engine.js'
import { analyzeClause } from './llm/analyze.js'
import { splitClauses } from './contract/split.js'
import ContractInput from './components/ContractInput.jsx'
import Results from './components/Results.jsx'
import { parkReview, takeParkedReview } from './contract/resume.js'

// Read once per page load (not in a component, which StrictMode renders twice).
const parked = takeParkedReview()

export default function App() {
  const [gpu, setGpu] = useState(null)
  const [modelId, setModelId] = useState(MODELS[0].id)
  const [modelState, setModelState] = useState('idle') // idle | loading | ready | error
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [clauses, setClauses] = useState(parked?.clauses ?? null)
  const [activeId, setActiveId] = useState(null)
  const [running, setRunning] = useState(false)
  const [secondsPerClause, setSecondsPerClause] = useState(null)
  const [gpuLost, setGpuLost] = useState(false)
  const engine = useRef(null)
  const cancelled = useRef(false)

  // Shared by the preload and by review(), so the model only loads once.
  function ensureEngine(id = modelId) {
    if (!engine.current) {
      setModelState('loading')
      engine.current = loadEngine(id, (p) => setProgress(p.text))
        .then((llm) => {
          setModelState('ready')
          return llm
        })
        .catch((e) => {
          engine.current = null
          setError(String(e?.message ?? e))
          setModelState('error')
          return null
        })
    }
    return engine.current
  }

  useEffect(() => {
    checkWebGPU().then(async (result) => {
      setGpu(result)
      if (!result.ok) return
      const id = parked?.modelId ?? (result.f16 ? MODELS[0].id : MODELS[1].id)
      setModelId(id)
      if (parked) analyzeAll(parked.clauses, id)
      // Already downloaded on an earlier visit: get it ready straight away.
      else if (await isCached(id)) ensureEngine(id)
    })
  }, [])

  // ?debug exposes the model to the console, to try prompts without running a whole contract.
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('debug')) return
    globalThis.rtfp = { engine: () => engine.current, analyzeClause, chat: async (req) => (await engine.current).chat.completions.create(req) }
  }, [])

  // First sign the user is about to review something: start the one-time download.
  function onIntent() {
    if (gpu?.ok && modelState === 'idle') ensureEngine()
  }

  async function review(text) {
    const parsed = splitClauses(text)
    setClauses(parsed)
    await analyzeAll(parsed)
  }

  // Analyzes every clause that has no result yet, so a retry picks up where it stopped.
  async function analyzeAll(list, id = modelId) {
    setError('')
    setGpuLost(false)
    setRunning(true)
    cancelled.current = false

    const llm = await ensureEngine(id)
    if (!llm) {
      setRunning(false)
      return
    }

    const times = []
    for (const clause of list) {
      if (cancelled.current) break
      if (clause.skip || clause.result) continue
      setActiveId(clause.id)
      try {
        const { result, seconds } = await analyzeClause(llm, clause.text)
        times.push(seconds)
        setSecondsPerClause(times.reduce((a, b) => a + b, 0) / times.length)
        setClauses((prev) => prev.map((c) => (c.id === clause.id ? { ...c, result, error: undefined } : c)))
      } catch (e) {
        if (cancelled.current) break
        if (isGpuLost(e)) {
          engine.current = null
          setModelState('idle')
          setGpuLost(true)
          break
        }
        setClauses((prev) => prev.map((c) => (c.id === clause.id ? { ...c, error: String(e?.message ?? e) } : c)))
      }
    }
    setActiveId(null)
    setRunning(false)
  }

  function retry(smaller) {
    const id = smaller ? MODELS[1].id : modelId
    if (gpuLost && parkReview({ clauses, modelId: id })) {
      location.reload()
      return
    }
    if (smaller) {
      setModelId(id)
      engine.current = null
    }
    const pending = clauses.map((c) => ({ ...c, error: undefined }))
    setClauses(pending)
    analyzeAll(pending, id)
  }

  async function cancel() {
    cancelled.current = true
    ;(await engine.current)?.interruptGenerate()
  }

  function reset() {
    setClauses(null)
    setSecondsPerClause(null)
  }

  return (
    <main>
      <header>
        <h1>Read the Fine Print</h1>
        <p className="tagline">
          Spot the clauses that cost freelancers money, before you sign. The AI runs in your browser: your contract
          never leaves your computer.
        </p>
      </header>

      {gpu && !gpu.ok && (
        <p className="error">
          {gpu.reason} Read the Fine Print needs a browser with WebGPU, like recent Chrome or Edge on a laptop or
          desktop.
        </p>
      )}

      {modelState === 'loading' && (
        <div className="notice">
          <b>Getting the AI model ready.</b> The first time it downloads once (about 3 GB) and is then cached in your
          browser. You can paste your contract meanwhile.
          <p className="muted">{progress}</p>
        </div>
      )}
      {modelState === 'ready' && !clauses && <p className="muted">✓ AI model ready, running on your device.</p>}
      {error && <p className="error">{error}</p>}

      {clauses ? (
        <Results
          clauses={clauses}
          activeId={activeId}
          running={running}
          onCancel={cancel}
          onReset={reset}
          onRetry={retry}
          gpuLost={gpuLost}
          canUseSmaller={modelId !== MODELS[1].id}
          secondsPerClause={secondsPerClause}
        />
      ) : (
        <>
          <ContractInput onSubmit={review} onIntent={onIntent} disabled={!gpu?.ok} />
          <details className="advanced">
            <summary>Model</summary>
            <select value={modelId} onChange={(e) => setModelId(e.target.value)} disabled={modelState !== 'idle'}>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            {gpu?.ok && !gpu.f16 && <p className="muted">Your GPU lacks shader-f16; pick Gemma 3 1B.</p>}
          </details>
        </>
      )}

      <footer className="muted">Not legal advice. For anything high-stakes, ask a lawyer.</footer>
    </main>
  )
}
