import { CreateWebWorkerMLCEngine, hasModelInCache } from '@mlc-ai/web-llm'

export const MODELS = [
  { id: 'gemma-4-E2B-it-q4f16_1-MLC', label: 'Gemma 4 E2B (~3.4 GB VRAM)' },
  { id: 'gemma3-1b-it-q4f16_1-MLC', label: 'Gemma 3 1B (~0.7 GB VRAM, fallback)' },
]

export async function checkWebGPU() {
  if (!navigator.gpu) return { ok: false, reason: 'This browser has no WebGPU.' }
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) return { ok: false, reason: 'WebGPU is present but no GPU adapter was found.' }
  return { ok: true, f16: adapter.features.has('shader-f16') }
}

let worker = null

export function loadEngine(modelId, onProgress) {
  // A reload after a lost GPU must not leave the old model holding memory.
  worker?.terminate()
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
  return CreateWebWorkerMLCEngine(worker, modelId, {
    initProgressCallback: (p) => onProgress(p),
  })
}

// WebGPU drops the device when the GPU runs out of memory; after that every
// call fails with one of these, so the model has to be loaded again.
export function isGpuLost(error) {
  return /device (was )?lost|deleted object|already been disposed/i.test(String(error?.message ?? error))
}

export async function isCached(modelId) {
  try {
    return await hasModelInCache(modelId)
  } catch {
    return false
  }
}
