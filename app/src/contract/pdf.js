import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

// Rebuilds the text of a PDF line by line, adding a blank line where the
// vertical gap between lines is large (a new paragraph), so the clause
// splitter sees the same structure as pasted text.
export async function extractPdfText(file) {
  const pdf = await getDocument({ data: await file.arrayBuffer() }).promise
  const pages = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n)
    const { items } = await page.getTextContent()
    let text = ''
    let lastY = null
    let lineHeight = 12
    for (const item of items) {
      const y = item.transform[5]
      if (lastY !== null && Math.abs(lastY - y) > 1) {
        text += lastY - y > lineHeight * 1.6 ? '\n\n' : '\n'
      }
      text += item.str
      if (item.height) lineHeight = item.height
      lastY = y
    }
    pages.push(text)
  }
  return pages.join('\n\n')
}
