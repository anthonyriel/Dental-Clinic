import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

test('install metadata uses Dentaprime and icons with real advertised dimensions', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'))
  assert.equal(manifest.name,'Dentaprime')
  assert.equal(manifest.short_name,'Dentaprime')
  assert.equal(manifest.display,'standalone')
  assert.equal(manifest.start_url,'/')
  assert.equal(manifest.scope,'/')
  assert(manifest.icons.some(icon=>icon.sizes==='192x192' && icon.purpose==='any'))
  assert(manifest.icons.some(icon=>icon.sizes==='512x512' && icon.purpose==='any'))
  for (const icon of [...manifest.icons,{src:'/app-icons/apple-touch-icon.png',sizes:'180x180'}]) {
    const bytes = await readFile(new URL('../public'+icon.src,import.meta.url))
    assert.equal(bytes.subarray(1,4).toString(),'PNG')
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`,icon.sizes)
  }
})

test('service worker only caches generic offline assets, never patient/API responses', async () => {
  const handlers = {}, cached = []
  const offline = {offline:true}
  const context = {
    URL,
    self: { location:{origin:'https://clinic.example'},addEventListener:(name,handler)=>{handlers[name]=handler},skipWaiting:async()=>{},clients:{claim:async()=>{}} },
    caches: {open:async()=>({addAll:async paths=>cached.push(...paths)}),match:async()=>offline},
    fetch:async()=>{throw new Error('offline')},
  }
  vm.runInNewContext(await readFile(new URL('../public/sw.js',import.meta.url),'utf8'),context)
  let pending
  handlers.install({waitUntil:promise=>{pending=promise}})
  await pending
  assert.deepEqual(cached,['/offline.html','/app-icons/icon-192.png'])
  for (const request of [
    {url:'https://project.supabase.co/rest/v1/appointments',method:'GET',mode:'cors'},
    {url:'https://clinic.example/api/book',method:'POST',mode:'cors'},
    {url:'https://clinic.example/assets/app.js',method:'GET',mode:'cors'},
  ]) handlers.fetch({request,respondWith:()=>assert.fail('Private or application request intercepted')})
  handlers.fetch({request:{url:'https://clinic.example/dashboard',method:'GET',mode:'navigate'},respondWith:promise=>{pending=promise}})
  assert.equal(await pending,offline)
  const live = {ok:true}
  context.fetch = async()=>live
  handlers.fetch({request:{url:'https://clinic.example/dashboard',method:'GET',mode:'navigate'},respondWith:promise=>{pending=promise}})
  assert.equal(await pending,live)
})
