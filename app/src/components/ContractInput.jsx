import { useState } from 'react'
import { extractPdfText } from '../contract/pdf.js'

export default function ContractInput({ onSubmit, onIntent, disabled }) {
  const [text, setText] = useState('')
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  async function readFile(file) {
    onIntent()
    setError('')
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setText(await extractPdfText(file))
      } else {
        setText(await file.text())
      }
    } catch (e) {
      setError(`Couldn't read that file: ${e?.message ?? e}`)
    }
  }

  async function loadSample() {
    onIntent()
    setText(await (await fetch(`${import.meta.env.BASE_URL}sample-contract.txt`)).text())
  }

  return (
    <section
      className={`input ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) readFile(file)
      }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={onIntent}
        placeholder="Paste your client's contract here, or drop a PDF or .txt file."
        rows={14}
      />
      <div className="actions">
        <label className="button secondary">
          Open file…
          <input
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain"
            hidden
            onChange={(e) => e.target.files[0] && readFile(e.target.files[0])}
          />
        </label>
        <button className="secondary" onClick={loadSample}>Try a sample contract</button>
        <button onClick={() => onSubmit(text)} disabled={disabled || text.trim().length < 60}>
          Review contract
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  )
}
