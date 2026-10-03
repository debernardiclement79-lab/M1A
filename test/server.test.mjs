import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
test('comptes, isolation, synchronisation, documents, clés et réinitialisation',async()=>{
 const dir=await mkdtemp(tmpdir()+'/m1a-test-');process.env.M1A_DATA_DIR=dir;delete process.env.MODEL_BASE_URL;delete process.env.MODEL_NAME;
 const {setPassword}=await import('../auth.mjs');const {server}=await import('../server.mjs');await setPassword('alice','test-password-alice');await setPassword('bob','test-password-bob');await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 async function call(path,data,cookie,token){const res=await fetch(base+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};}
 let stream;
 try{
 assert.equal((await call('/api/state')).status,401);
 assert.equal((await call('/api/login',{name:'alice',password:'wrong'})).status,401);
 const a=(await call('/api/login',{name:'alice',password:'test-password-alice'})).cookie;const b=(await call('/api/login',{name:'bob',password:'test-password-bob'})).cookie;
 const c=(await call('/api/conversations',{},a)).body;
 assert.equal((await call('/api/state',null,b)).body.conversations.length,0);
 assert.equal((await call('/api/messages',{conversationId:c.id,content:'vol'},b)).status,404);
 stream=await fetch(base+'/api/events',{headers:{Cookie:a}});const reader=stream.body.getReader();await reader.read();
 const r=await call('/api/messages',{conversationId:c.id,content:'Bonjour',documents:[{name:'note.txt',text:'Document de test'}]},a);assert.equal(r.status,200);assert.equal(r.body.messages.length,2);assert.match(r.body.messages[1].content,/démonstration/);assert.equal(r.body.messages[0].documents[0].text,'Document de test');
 const update=await reader.read();assert.match(new TextDecoder().decode(update.value),/Bonjour/);await reader.cancel();stream=null;
 const key=(await call('/api/keys',{name:'test'},a)).body;assert.ok(key.token.startsWith('m1a_'));assert.equal((await call('/api/state',null,null,key.token)).status,200);assert.ok(!(await call('/api/keys',null,a)).body.keys[0].hash);
 await call('/api/keys',{revoke:key.id},a);assert.equal((await call('/api/state',null,null,key.token)).status,401);
 const resetKey=(await call('/api/keys',{name:'reset-test'},a)).body;
 await promisify(execFile)(process.execPath,['--input-type=module','-e',`import {setPassword} from ${JSON.stringify(new URL('../auth.mjs',import.meta.url).href)};await setPassword('alice','replacement-password');`],{env:process.env});
 assert.equal((await call('/api/state',null,a)).status,401);assert.equal((await call('/api/state',null,null,resetKey.token)).status,401);assert.equal((await call('/api/login',{name:'alice',password:'replacement-password'})).status,200);
 assert.equal((await call('/api/reset',{},b)).status,404);
 const csrf=await fetch(base+'/api/conversations',{method:'POST',headers:{Cookie:b,Origin:'https://untrusted.example','Content-Type':'application/json'},body:'{}'});assert.equal(csrf.status,403);
 assert.equal((await call('/healthz')).body.status,'ok');
 assert.equal(JSON.parse(await readFile(dir+'/conversations.json','utf8')).conversations[0].messages.length,2);
 let request;
 const provider=http.createServer(async(req,res)=>{let text='';for await(const chunk of req)text+=chunk;request={url:req.url,authorization:req.headers.authorization,body:JSON.parse(text)};res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:'Réponse du modèle test'}}]}));});
 await new Promise(r=>provider.listen(0,'127.0.0.1',r));
 try{process.env.MODEL_BASE_URL='http://127.0.0.1:'+provider.address().port+'/v1';process.env.MODEL_NAME='test-model';process.env.MODEL_API_KEY='test-only-key';const real=await call('/api/messages',{conversationId:c.id,content:'Analyser la note'},(await call('/api/login',{name:'alice',password:'replacement-password'})).cookie);assert.equal(real.body.messages.at(-1).content,'Réponse du modèle test');assert.equal(request.url,'/v1/chat/completions');assert.equal(request.authorization,'Bearer test-only-key');assert.equal(request.body.model,'test-model');assert.match(request.body.messages[1].content,/Document de test/);}finally{delete process.env.MODEL_BASE_URL;delete process.env.MODEL_NAME;delete process.env.MODEL_API_KEY;provider.closeAllConnections();await new Promise(r=>provider.close(r));}

 }finally{if(stream)await stream.body.cancel();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
