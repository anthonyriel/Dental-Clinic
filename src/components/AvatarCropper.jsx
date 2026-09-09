import { useEffect, useRef, useState } from 'react'
import { Camera, Minus, Plus, RotateCcw, Check, X } from 'lucide-react'
import { CROP_SIZE, initialCrop, zoomCrop, drawAvatar } from '../lib/avatarCrop'

export default function AvatarCropper({ src, onSave, onCancel }) {
  const [crop, setCrop] = useState(initialCrop)
  const [image, setImage] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const preview = useRef(null)
  const surface = useRef(null)
  const pointers = useRef(new Map())
  const saving = useRef(false)

  useEffect(() => {
    let active = true
    const photo = new Image()
    photo.crossOrigin = 'anonymous'
    photo.onload = () => { if (active) setImage(photo) }
    photo.onerror = () => { if (active) setError('Could not load this image. Please choose another photo.') }
    photo.src = src
    return () => { active = false }
  }, [src])

  useEffect(() => {
    if (image && preview.current) drawAvatar(preview.current, image, crop)
  }, [image, crop])

  useEffect(() => {
    const element = surface.current
    function wheel(e) {
      e.preventDefault()
      if (saving.current) return
      const rect = element.getBoundingClientRect()
      const units = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1
      setCrop(value => zoomCrop(value, Math.exp(-e.deltaY * units * 0.002), { x: (e.clientX - rect.left) * CROP_SIZE / rect.width, y: (e.clientY - rect.top) * CROP_SIZE / rect.height }))
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [])

  function point(e) {
    const rect = surface.current.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * CROP_SIZE / rect.width, y: (e.clientY - rect.top) * CROP_SIZE / rect.height }
  }
  function pointerDown(e) {
    if (saving.current || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, point(e))
  }
  function pointerMove(e) {
    if (saving.current || !pointers.current.has(e.pointerId)) return
    const before = [...pointers.current.values()]
    const previous = pointers.current.get(e.pointerId)
    const current = point(e)
    pointers.current.set(e.pointerId, current)
    const after = [...pointers.current.values()]
    if (before.length === 2) {
      const midpoint = points => ({ x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 })
      const distance = points => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
      const start = midpoint(before), end = midpoint(after)
      const factor = distance(before) > 0 ? distance(after) / distance(before) : 1
      setCrop(value => {
        const next = zoomCrop(value, factor, start)
        return { ...next, x: next.x + end.x - start.x, y: next.y + end.y - start.y }
      })
    } else if (before.length === 1) {
      setCrop(value => ({ ...value, x: value.x + current.x - previous.x, y: value.y + current.y - previous.y }))
    }
  }
  function pointerEnd(e) { pointers.current.delete(e.pointerId) }
  function keyboard(e) {
    if (saving.current) return
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    if (moves[e.key]) {
      e.preventDefault()
      const [x, y] = moves[e.key], amount = e.shiftKey ? 25 : 5
      setCrop(value => ({ ...value, x: value.x + x * amount, y: value.y + y * amount }))
    } else if (['+', '=', '-'].includes(e.key)) {
      e.preventDefault(); setCrop(value => zoomCrop(value, e.key === '-' ? 1 / 1.2 : 1.2))
    }
  }
  async function save() {
    if (!image || saving.current) return
    saving.current = true; setBusy(true); setError(''); pointers.current.clear()
    try {
      const canvas = document.createElement('canvas')
      drawAvatar(canvas, image, crop)
      const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image could not be processed.')), 'image/jpeg', 0.95))
      await onSave(blob)
    } catch (err) { setError(err.message || 'Could not save your photo. Please retry.') }
    finally { saving.current = false; setBusy(false) }
  }

  return <section className="bg-slate-900 text-white p-5 sm:p-8 rounded-3xl space-y-5" aria-label="Adjust profile photo">
    <h3 className="font-bold text-lg flex items-center gap-2"><Camera size={20}/> Adjust your photo</h3>
    <p id="crop-instructions" className="text-sm text-slate-300">Drag to move. Scroll or pinch to zoom. You can move the photo freely beyond the frame.</p>
    <div ref={surface} tabIndex={0} role="group" aria-label="Photo crop preview" aria-describedby="crop-instructions" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} onKeyDown={keyboard} className="relative w-full max-w-80 aspect-square mx-auto overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing outline-offset-4" style={{ touchAction: 'none', background: '#0f172a' }}>
      <canvas ref={preview} width={400} height={400} className="block w-full h-full pointer-events-none"/>
      <div className="absolute inset-0 rounded-full border-2 border-[#67c4c7] pointer-events-none" style={{ boxShadow: '0 0 0 100px rgb(0 0 0 / .45)' }}/>
      {!image && <p className="absolute inset-0 flex items-center justify-center pointer-events-none">{error ? 'Preview unavailable' : 'Loading photo…'}</p>}
    </div>
    <fieldset disabled={busy || !image} className="space-y-4">
      <div className="flex items-center justify-center flex-wrap gap-3">
        <button type="button" aria-label="Zoom out" className="p-3 rounded-xl bg-slate-700" onClick={() => setCrop(value => zoomCrop(value, 1 / 1.2))}><Minus size={20}/></button>
        <label className="text-sm">Zoom %<input key={crop.zoom} type="number" step="any" aria-label="Zoom percentage" defaultValue={Number((crop.zoom * 100).toPrecision(6))} onBlur={e => { const percentage = Number(e.target.value); if (percentage > 0 && Number.isFinite(percentage)) setCrop(value => zoomCrop(value, percentage / 100 / value.zoom)); else e.target.value = Number((crop.zoom * 100).toPrecision(6)) }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }} className="ml-2 w-24 rounded-lg p-2 text-slate-900"/></label>
        <button type="button" aria-label="Zoom in" className="p-3 rounded-xl bg-slate-700" onClick={() => setCrop(value => zoomCrop(value, 1.2))}><Plus size={20}/></button>
        <button type="button" className="flex items-center gap-2 p-3 rounded-xl bg-slate-700 text-sm" onClick={() => setCrop(initialCrop)}><RotateCcw size={16}/> Reset</button>
      </div>
    </fieldset>
    <p className="text-xs text-slate-300">The circle shows your profile-photo area. Empty areas stay dark. Keyboard: arrow keys move; + and − zoom.</p>
    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
    <div className="flex flex-wrap justify-center gap-3"><button type="button" disabled={busy} className="btn bg-slate-700 text-white" onClick={onCancel}><X size={16}/>Cancel</button><button type="button" disabled={busy || !image} className="btn btn-primary" onClick={save}><Check size={16}/>{busy ? 'Saving…' : 'Save photo'}</button></div>
  </section>
}
