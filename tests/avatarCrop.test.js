import test from 'node:test'
import assert from 'node:assert/strict'
import { initialCrop, zoomCrop, cropRectangle, drawAvatar } from '../src/lib/avatarCrop.js'

test('cropper fits portrait and landscape photos to the same square coordinates', () => {
  assert.deepEqual(cropRectangle(800,400,initialCrop), {x:-200,y:0,width:800,height:400})
  assert.deepEqual(cropRectangle(400,800,initialCrop), {x:0,y:-200,width:400,height:800})
})

test('zoom has no old slider bounds and remains anchored under the pointer', () => {
  assert.equal(zoomCrop(initialCrop,0.001).zoom,0.001)
  assert.equal(zoomCrop(initialCrop,1000).zoom,1000)
  const anchor = {x:100,y:150}
  const next = zoomCrop(initialCrop,2,anchor)
  assert.deepEqual(next,{zoom:2,x:100,y:50})
  assert.deepEqual(zoomCrop(next,0.5,anchor),initialCrop)
  assert.deepEqual(zoomCrop(initialCrop,0),initialCrop)
  assert.deepEqual(zoomCrop(initialCrop,Infinity),initialCrop)
})

test('unrestricted pan is preserved in the saved image, including outside the frame', () => {
  const crop = {zoom:0.5,x:2000,y:-2000}
  assert.deepEqual(cropRectangle(400,400,crop),{x:2100,y:-1900,width:200,height:200})
  const draws = []
  const context = {fillRect(...args){draws.push(['background',...args])},drawImage(...args){draws.push(['image',...args])}}
  const canvas = {getContext(){return context}}
  const image = {naturalWidth:400,naturalHeight:400}
  drawAvatar(canvas,image,crop)
  assert.equal(canvas.width,400); assert.equal(canvas.height,400)
  assert.equal(context.fillStyle,'#0f172a')
  assert.deepEqual(draws,[['background',0,0,400,400],['image',image,2100,-1900,200,200]])
})
