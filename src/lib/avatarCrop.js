export const CROP_SIZE = 400
export const initialCrop = { zoom: 1, x: 0, y: 0 }

export function zoomCrop(crop, factor, anchor = { x: 200, y: 200 }) {
  const zoom = crop.zoom * factor
  const x = anchor.x - 200 - (anchor.x - 200 - crop.x) * factor
  const y = anchor.y - 200 - (anchor.y - 200 - crop.y) * factor
  return zoom > 0 && [zoom, x, y].every(Number.isFinite) ? { zoom, x, y } : crop
}

export function cropRectangle(width, height, crop) {
  const scale = Math.max(CROP_SIZE / width, CROP_SIZE / height) * crop.zoom
  return { x: (CROP_SIZE - width * scale) / 2 + crop.x, y: (CROP_SIZE - height * scale) / 2 + crop.y, width: width * scale, height: height * scale }
}

export function drawAvatar(canvas, image, crop) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Image editing is not supported in this browser.')
  canvas.width = CROP_SIZE; canvas.height = CROP_SIZE
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE)
  const rect = cropRectangle(image.naturalWidth, image.naturalHeight, crop)
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height)
}
