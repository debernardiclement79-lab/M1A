const base=process.argv[2]||'http://127.0.0.1:3000';
for(const [path,status] of [['/healthz',200],['/',200],['/api/state',401]]){
 const response=await fetch(new URL(path,base),{signal:AbortSignal.timeout(10000)});
 if(response.status!==status)throw new Error(`${path}: HTTP ${response.status}, attendu ${status}`);
 if(path==='/healthz'&&(await response.json()).status!=='ok')throw new Error('État serveur inattendu.');
 console.log(`${path} : OK (${status})`);
}
