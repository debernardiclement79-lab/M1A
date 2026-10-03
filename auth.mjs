import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
const dir=process.env.M1A_DATA_DIR?new URL('file://'+process.env.M1A_DATA_DIR+'/'):new URL('./data/',import.meta.url);await mkdir(dir,{recursive:true,mode:0o700});
let db={users:[],sessions:[],keys:[]};try{db=JSON.parse(await readFile(new URL('auth.json',dir),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
let queue=Promise.resolve();async function save(){const text=JSON.stringify(db);queue=queue.then(async()=>{await writeFile(new URL('auth.tmp',dir),text,{mode:0o600});await rename(new URL('auth.tmp',dir),new URL('auth.json',dir));});await queue;}
const hash=t=>createHash('sha256').update(t).digest('hex');
const derive=(p,s)=>scryptSync(p,s,64).toString('hex');
export async function setPassword(name,password){if(!/^[a-zA-Z0-9_-]{1,64}$/.test(name)||password.length<12)throw new Error('Nom : lettres/chiffres/tiret ; mot de passe : 12 caractères minimum.');const salt=randomBytes(16).toString('hex');let u=db.users.find(u=>u.name===name);if(!u){u={id:randomBytes(16).toString('hex'),name};db.users.push(u);}Object.assign(u,{salt,password:derive(password,salt)});db.sessions=db.sessions.filter(s=>s.user!==u.id);db.keys=db.keys.filter(k=>k.user!==u.id);await save();}
const attempts=new Map();
export async function login(name,password,ip){refresh();const now=Date.now();const old=attempts.get(ip);const a=old&&now-old.start<900000?old:{start:now,count:0};attempts.set(ip,a);if(++a.count>15)throw new Error('Trop de tentatives. Réessayez dans 15 minutes.');if(attempts.size>10000)for(const[k,v]of attempts)if(now-v.start>900000)attempts.delete(k);const u=db.users.find(u=>u.name===name);const computed=derive(password,u?.salt||'invalid');if(!u||!timingSafeEqual(Buffer.from(computed,'hex'),Buffer.from(u.password,'hex')))return null;attempts.delete(ip);const token=randomBytes(32).toString('base64url');db.sessions=db.sessions.filter(s=>s.expires>now);db.sessions.push({hash:hash(token),user:u.id,expires:now+7*86400000});await save();return token;}
// La commande locale peut changer le mot de passe pendant que le serveur tourne.
function refresh(){try{db=JSON.parse(readFileSync(new URL('auth.json',dir),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}}
export function authenticate(req){refresh();const bearer=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];const cookie=req.headers.cookie?.match(/(?:^|; )m1a=([^;]+)/)?.[1];const entry=bearer?db.keys.find(k=>k.hash===hash(bearer)):cookie?db.sessions.find(s=>s.hash===hash(cookie)&&s.expires>Date.now()):null;return entry?db.users.find(u=>u.id===entry.user):null;}
export async function logout(req){const token=req.headers.cookie?.match(/(?:^|; )m1a=([^;]+)/)?.[1];db.sessions=db.sessions.filter(s=>s.hash!==hash(token||''));await save();}
export async function createKey(user,name){const token='m1a_'+randomBytes(32).toString('base64url');const key={id:randomBytes(12).toString('hex'),user,name:name.slice(0,80),hash:hash(token),createdAt:new Date().toISOString()};db.keys.push(key);await save();return {id:key.id,token};}
export function listKeys(user){return db.keys.filter(k=>k.user===user).map(({hash,user,...k})=>k);}
export async function revokeKey(user,id){db.keys=db.keys.filter(k=>!(k.user===user&&k.id===id));await save();}
