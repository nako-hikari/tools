const CACHE='nako-3d-viewer-v2';
const CORE=[
 "./",
 "index.html",
 "manifest.webmanifest",
 "vendor/three.min.js",
 "vendor/OrbitControls.js",
 "vendor/TransformControls.js",
 "vendor/GLTFLoader.js",
 "vendor/fflate.min.js",
 "vendor/FBXLoader.js",
 "vendor/RGBELoader.js",
 "vendor/CopyShader.js",
 "vendor/LuminosityHighPassShader.js",
 "vendor/EffectComposer.js",
 "vendor/RenderPass.js",
 "vendor/ShaderPass.js",
 "vendor/MaskPass.js",
 "vendor/UnrealBloomPass.js",
 "vendor/jszip.min.js",
 "vendor/fzstd.min.js",
 "vendor/nako.css",
 "vendor/ui/close.png",
 "vendor/ui/copy.png",
 "vendor/ui/download.png",
 "vendor/ui/expand.png",
 "vendor/ui/eye_closed.png",
 "vendor/ui/eye_open.png",
 "vendor/ui/folder.png",
 "vendor/ui/github.png",
 "vendor/ui/hand.png",
 "vendor/ui/home.png",
 "vendor/ui/kofi.png",
 "vendor/ui/moon.png",
 "vendor/ui/settings.png",
 "vendor/ui/sparkle_1.png",
 "vendor/ui/sun.png",
 "vendor/ui/tiktok.png",
 "vendor/ui/youtube.png"
];
const OPTIONAL=['icon.png'];
self.addEventListener('install',e=>{
 e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  await Promise.all(CORE.map(u=>c.add(new Request(u,{cache:'reload'}))));
  await Promise.all(OPTIONAL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',e=>{
 e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting();});
async function fromCache(req){return caches.match(req,{ignoreSearch:true});}
async function staleWhileRevalidate(req){
 const c=await caches.open(CACHE);
 const hit=await c.match(req,{ignoreSearch:true});
 const net=fetch(req).then(res=>{if(res&&res.ok)c.put(req,res.clone());return res;}).catch(()=>null);
 if(hit){net.catch(()=>{});return hit;}
 const res=await net;
 return res||Response.error();
}
async function cacheFirst(req){
 const hit=await fromCache(req);
 if(hit)return hit;
 try{
  const res=await fetch(req);
  if(res&&res.ok){const c=await caches.open(CACHE);c.put(req,res.clone());}
  return res;
 }catch(err){return Response.error();}
}
self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  e.respondWith((async()=>{
   const hit=await caches.match(new URL('index.html',self.registration.scope).href,{ignoreSearch:true});
   if(hit){e.waitUntil(staleWhileRevalidate(new Request(new URL('index.html',self.registration.scope).href)).catch(()=>{}));return hit;}
   try{return await fetch(req);}catch(err){return Response.error();}
  })());
  return;
 }
 if(url.pathname.includes('/vendor/')){e.respondWith(cacheFirst(req));return;}
 e.respondWith(staleWhileRevalidate(req));
});
