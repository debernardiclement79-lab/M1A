import {setPassword} from './auth.mjs';
const name=process.argv[2];
if(!name||!process.stdin.isTTY){console.error('Utilisation locale : node account.mjs NOM_UTILISATEUR (terminal interactif requis)');process.exit(1);}
process.stdout.write('Nouveau mot de passe (12 caractères minimum, saisie masquée) : ');
process.stdin.setRawMode(true);process.stdin.resume();let password='';
process.stdin.on('data',async chunk=>{for(const c of chunk.toString()){if(c==='\u0003')process.exit(1);if(c==='\r'||c==='\n'){process.stdin.setRawMode(false);process.stdin.pause();try{await setPassword(name,password);console.log('\nCompte enregistré. Sessions et clés précédentes révoquées.');process.exit(0);}catch(e){console.error('\n'+e.message);process.exit(1);}}else if(c==='\u007f')password=password.slice(0,-1);else password+=c;}});
