'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PORT = Number(process.env.PORT || 3000);
const games = new Map();
const clients = new Map();
const POINTS_TO_FINISH = 120;
const ROUND_MS = 18000;
const COLORS = ['#e94d56','#f4ad45','#68d6c2','#79a7ff','#bf87ed','#f27cbe','#c3de67','#fd8e59','#84c6ef','#fff083'];
const QUESTIONS = [
 {cat:'HURTIG HOVEDREGNING',q:'Hvad er 7 × 8?',a:['54','56','58','64'],ok:1},
 {cat:'LOGIK',q:'Hvilket tal kommer næste? 2, 4, 8, 16, …',a:['18','24','30','32'],ok:3},
 {cat:'JULEVIDEN',q:'Hvilken dato er juleaften i Danmark?',a:['23. december','24. december','25. december','26. december'],ok:1},
 {cat:'HURTIG HOVEDREGNING',q:'Du har 100 kr. og bruger 37 kr. Hvad har du tilbage?',a:['53 kr.','63 kr.','67 kr.','73 kr.'],ok:1},
 {cat:'FIND DEN ANDERLEDES',q:'Hvilken hører IKKE til de andre?',a:['Hest','Pony','Æsel','Cykel'],ok:3},
 {cat:'LOGIK',q:'En time og et kvarter er hvor mange minutter?',a:['65','70','75','90'],ok:2},
 {cat:'JULEVIDEN',q:'Hvilket land forbindes julemandens landsby Rovaniemi med?',a:['Norge','Finland','Sverige','Island'],ok:1},
 {cat:'HURTIG HOVEDREGNING',q:'Hvad er halvdelen af 186?',a:['83','89','93','96'],ok:2},
 {cat:'FIND DEN ANDERLEDES',q:'Hvilket ord er IKKE et kortspil?',a:['Poker','Bridge','Whist','Ludo'],ok:3},
 {cat:'LOGIK',q:'Hvis fem heste har i alt 20 ben, hvor mange ben har otte heste?',a:['24','28','32','36'],ok:2},
 {cat:'HURTIG HOVEDREGNING',q:'Hvad er 15 % af 200?',a:['15','20','25','30'],ok:3},
 {cat:'JULEVIDEN',q:'Hvilken grød forbindes traditionelt med nissen?',a:['Havregrød','Risengrød','Byggrød','Øllebrød'],ok:1},
 {cat:'LOGIK',q:'Hvilket tal mangler? 3, 6, 9, 12, …',a:['13','14','15','18'],ok:2},
 {cat:'HURTIG HOVEDREGNING',q:'Hvad er 144 ÷ 12?',a:['10','11','12','14'],ok:2},
 {cat:'FIND DEN ANDERLEDES',q:'Hvilken er IKKE en måned?',a:['April','August','Juni','Mandag'],ok:3},
 {cat:'FINALEN',q:'Hvor mange sekunder er der på 3 minutter?',a:['120','150','180','240'],ok:2}
];
function rid(bytes=9){return crypto.randomBytes(bytes).toString('hex')}
function send(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data))}
function parseBody(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>20000){reject(new Error('For stor besked'));req.destroy();}});req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch{reject(new Error('Ugyldige data'))}});req.on('error',reject)})}
function publicGame(g,viewer){
 const index=g.index, q=index>=0 && index<QUESTIONS.length?QUESTIONS[index]:null;
 const isHost=viewer && viewer.role==='host';const isPlayer=viewer && viewer.role==='player';
 const p=isPlayer?g.players.find(x=>x.token===viewer.token):null;
 const reveal=g.phase==='reveal'||g.phase==='finished';
 const answers=g.answers;
 return {room:g.room,phase:g.phase,round:index+1,total:QUESTIONS.length,endsAt:g.endsAt,finish:POINTS_TO_FINISH,
 players:g.players.map(x=>({id:x.id,name:x.name,color:x.color,score:x.score,answered:!!answers[x.id],lastGain:x.lastGain})),
 question:q?{category:q.cat,text:q.q,options:q.a,...(reveal?{correct:q.ok}: {})}:null,
 myAnswer:p?(answers[p.id]?.choice ?? null):null,
 answeredCount:Object.keys(answers).length,
 ...(reveal?{results:g.players.map(x=>({id:x.id,choice:answers[x.id]?.choice??null,gain:x.lastGain}))}:{}) ,
 viewer:isHost?'host':isPlayer?'player':'guest',myId:p?.id||null,
 joinUrl:g.joinUrl
 };
}
function notify(g){const set=clients.get(g.room);if(!set)return;for(const entry of Array.from(set)){try{entry.res.write('data: '+JSON.stringify(publicGame(g,entry.viewer))+'\n\n')}catch{set.delete(entry)}}}
function verify(g,b){if(b.hostToken===g.hostToken)return {role:'host',token:b.hostToken};const p=g.players.find(x=>x.token===b.playerToken);return p?{role:'player',token:p.token}:null}
function reveal(g){if(g.phase!=='question')return;g.phase='reveal';clearTimeout(g.timer);const q=QUESTIONS[g.index];for(const p of g.players){const a=g.answers[p.id];const gain=a&&a.choice===q.ok ? 8+Math.max(0,Math.ceil(4*(g.endsAt-a.at)/ROUND_MS)) :0;p.score+=gain;p.lastGain=gain;}notify(g)}
function startRound(g){clearTimeout(g.timer);if(g.index+1>=QUESTIONS.length || g.players.some(p=>p.score>=POINTS_TO_FINISH)){g.phase='finished';g.endsAt=0;notify(g);return;}
 g.index++;g.phase='question';g.answers={};g.players.forEach(p=>p.lastGain=0);g.endsAt=Date.now()+ROUND_MS;g.timer=setTimeout(()=>reveal(g),ROUND_MS+150);notify(g)}
function getGame(room){return games.get(String(room||'').trim().toUpperCase())}
async function api(req,res,pathname){
 let b;try{b=await parseBody(req)}catch(e){return send(res,400,{error:e.message})}
 if(pathname==='/api/create'){
  const room=crypto.randomBytes(3).toString('hex').toUpperCase();const g={room,hostToken:rid(16),players:[],index:-1,phase:'lobby',answers:{},endsAt:0,timer:null,joinUrl:''};
  g.joinUrl=`${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}/?room=${room}`;games.set(room,g);return send(res,200,{room,hostToken:g.hostToken});
 }
 const g=getGame(b.room);if(!g)return send(res,404,{error:'Spillet findes ikke. Opret et nyt på værtsskærmen.'});
 if(pathname==='/api/join'){
  if(b.playerToken){let p=g.players.find(x=>x.token===b.playerToken);if(p)return send(res,200,{playerToken:p.token,playerId:p.id});}
  if(g.phase!=='lobby')return send(res,400,{error:'Løbet er startet. Vent på næste løb.'});
  if(g.players.length>=10)return send(res,400,{error:'Der er allerede 10 spillere.'});
  const name=String(b.name||'').trim().slice(0,20).replace(/[<>]/g,'');if(name.length<2)return send(res,400,{error:'Skriv et navn på mindst 2 tegn.'});
  if(g.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))return send(res,400,{error:'Navnet er allerede taget.'});
  const p={id:rid(6),name,token:rid(16),score:0,color:COLORS[g.players.length],lastGain:0};g.players.push(p);send(res,200,{playerToken:p.token,playerId:p.id});notify(g);return;
 }
 const viewer=verify(g,b);if(!viewer)return send(res,403,{error:'Du har ikke adgang til dette spil. Prøv at joine igen.'});
 if(pathname==='/api/state')return send(res,200,publicGame(g,viewer));
 if(pathname==='/api/control'){
  if(viewer.role!=='host')return send(res,403,{error:'Kun værten kan styre løbet.'});
  if(b.action==='start'){if(g.phase!=='lobby')return send(res,400,{error:'Løbet er allerede startet.'});if(!g.players.length)return send(res,400,{error:'Mindst én hest skal deltage.'});startRound(g);}
  else if(b.action==='next'){if(g.phase!=='reveal')return send(res,400,{error:'Afslør først resultatet.'});startRound(g)}
  else if(b.action==='reveal'){reveal(g)}
  else if(b.action==='restart'){clearTimeout(g.timer);g.phase='lobby';g.index=-1;g.answers={};g.endsAt=0;g.players.forEach(p=>{p.score=0;p.lastGain=0});notify(g)}
  else return send(res,400,{error:'Ukendt handling'});
  return send(res,200,{ok:true});
 }
 if(pathname==='/api/answer'){
  if(viewer.role!=='player')return send(res,403,{error:'Kun spillere kan svare'});
  if(g.phase!=='question'||Date.now()>g.endsAt)return send(res,400,{error:'Runden er lukket'});
  const p=g.players.find(x=>x.token===viewer.token);if(g.answers[p.id])return send(res,400,{error:'Du har allerede svaret'});
  if(!Number.isInteger(b.choice)||b.choice<0||b.choice>3)return send(res,400,{error:'Vælg en mulighed'});
  g.answers[p.id]={choice:b.choice,at:Date.now()};send(res,200,{ok:true});if(Object.keys(g.answers).length===g.players.length)reveal(g);else notify(g);return;
 }
 send(res,404,{error:'Ikke fundet'});
}
const FILES={'/':'index.html','/host':'host.html','/app.js':'app.js','/style.css':'style.css'};
const TYPES={'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8'};
const server=http.createServer(async (req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(req.method==='POST'&&pathname.startsWith('/api/'))return api(req,res,pathname).catch(e=>send(res,500,{error:e.message}));
 if(req.method==='GET'&&pathname==='/api/events'){
  const u=new URL(req.url,'http://localhost');const g=getGame(u.searchParams.get('room'));if(!g)return send(res,404,{error:'Spil ikke fundet'});
  const viewer=verify(g,{hostToken:u.searchParams.get('hostToken'),playerToken:u.searchParams.get('playerToken')});if(!viewer)return send(res,403,{error:'Ingen adgang'});
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
  if(!clients.has(g.room))clients.set(g.room,new Set());const entry={res,viewer};clients.get(g.room).add(entry);
  res.write('data: '+JSON.stringify(publicGame(g,viewer))+'\n\n');const ping=setInterval(()=>{try{res.write(': ping\n\n')}catch{}},15000);
  req.on('close',()=>{clearInterval(ping);clients.get(g.room)?.delete(entry)});return;
 }
 if(req.method==='GET' && FILES[pathname]){
  const file=path.join(__dirname,'public',FILES[pathname]);res.writeHead(200,{'content-type':TYPES[path.extname(file)],'cache-control':'no-cache'});fs.createReadStream(file).pipe(res);return;
 }
 send(res,404,{error:'Siden findes ikke'});
});
server.listen(PORT,'0.0.0.0',()=>console.log(`Hestevæddeløb online på port ${PORT}`));
