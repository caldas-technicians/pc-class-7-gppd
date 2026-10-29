const S={d:"sonido/disparo.mp3",c:"sonido/correcto.mp3",e:"sonido/error.mp3"};
/* Audio de baja latencia: se decodifica una vez y se dispara al instante */
const AC=window.AudioContext||window.webkitAudioContext;let ctx,buf={},pool={};
async function loadSound(k){
  const src=S[k];
  pool[k]=[new Audio(src),new Audio(src),new Audio(src)];pool[k].i=0;pool[k].forEach(a=>{a.preload="auto";a.load()});
  try{
    let ab;
    if(src.startsWith("data:")){const b=atob(src.split(",")[1]),u=new Uint8Array(b.length);for(let j=0;j<b.length;j++)u[j]=b.charCodeAt(j);ab=u.buffer}
    else ab=await (await fetch(src)).arrayBuffer();
    ctx=ctx||new AC({latencyHint:"interactive"});
    const d=await ctx.decodeAudioData(ab),ch=d.getChannelData(0);let s=0;
    while(s<ch.length&&Math.abs(ch[s])<.01)s++;           /* salta el silencio inicial del mp3 */
    buf[k]={d,off:Math.max(0,s/d.sampleRate-.005)};
  }catch(_){}
}
Object.keys(S).forEach(loadSound);
const unlock=()=>{if(ctx&&ctx.state!=="running")ctx.resume()};
addEventListener("pointerdown",unlock,{capture:true});
const play=k=>{
  if(ctx&&buf[k]){unlock();const s=ctx.createBufferSource();s.buffer=buf[k].d;s.connect(ctx.destination);s.start(0,buf[k].off);return}
  const p=pool[k],a=p[p.i++%p.length];a.currentTime=0;a.play().catch(()=>{});
};
const M=["GET","POST","PUT","DELETE"];
const B={
GET:["Leer la lista de personajes en /character","Consultar un solo personaje en /character/1","Pedir la página 2 con ?page=2","Filtrar con ?name=rick&status=alive","Abrir la URL de la API en el navegador para ver el JSON","Traer los diez usuarios de JSONPlaceholder","Pedir las publicaciones de un usuario en /users/3/posts","Consultar el clima de una ciudad sin cambiar nada en el servidor","Leer información de forma segura e idempotente","Mostrar el catálogo en /v1/productos","Pedir /character/99999 para ver qué responde la API","La galería necesita traer personajes desde la API en vivo","Las APIs públicas sin clave del curso solo permiten esto: leer"],
POST:["Registrar un usuario nuevo con los datos en el cuerpo","Enviar un producto nuevo para insertarlo en la tienda","Publicar un comentario nuevo en una entrada","Crear un pedido de compra nuevo","Insertar un registro nuevo enviado en el cuerpo de la petición","Agregar una canción nueva a la lista","Crear una cuenta nueva en la plataforma","Subir una reseña nueva de un restaurante","Añadir un personaje nuevo al catálogo","Crear una tarea nueva en el tablero","Guardar en el servidor el formulario de misión como registro nuevo","Dar de alta un cliente nuevo"],
PUT:["Reemplazar por completo los datos del producto 42","Sustituir todo el perfil del usuario con id 7","Reemplazar todos los campos del personaje /character/5","Sustituir por completo un recurso existente identificado por su ID","Reemplazar la ficha completa de un estudiante","Sobrescribir el producto con una versión completa nueva","Reemplazar el post 15 por una versión entera nueva","Sustituir toda la configuración de una cuenta","Reemplazar la receta 8 con todos sus datos nuevos","Reemplazar la dirección de envío completa del pedido","Reescribir por completo el comentario 9","Sustituir totalmente los datos del libro 3"],
DELETE:["Eliminar la cuenta de un usuario","Borrar de forma definitiva el producto 42","Remover el comentario 8","Quitar el personaje /character/12 del servidor","Cancelar y eliminar el pedido 100","Remover de forma definitiva el recurso indicado en la ruta","Borrar la foto 21","Eliminar el post 4","Quitar al usuario 9 del sistema","Borrar una lista de reproducción completa","Eliminar la reseña 30","Remover la tarea 2 del tablero","Eliminar un evento del calendario"]};
const ALL=[];M.forEach((m,i)=>B[m].forEach(t=>ALL.push([t,i])));
const $=id=>document.getElementById(id);
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};

/* cubos */
const row=$("row");
M.forEach((m,i)=>{const t=document.createElement("div");t.className="t "+m;t.dataset.k=i;
t.innerHTML='<div class="cube">'+[0,1,2,3,4,5].map(()=>'<div class="f">'+m+'</div>').join("")+'</div>';
row.appendChild(t)});
const cubes=[...row.children];

/* apuntar */
const gw=$("gw"),gun=$("gun"),cross=$("cross");
let flip=1;
function aim(e){
  cross.style.transform=`translate(${e.clientX}px,${e.clientY}px)`;
  const r=gw.getBoundingClientRect(),px=r.left+r.width*.22,py=r.top+r.height*.62;
  const dx=e.clientX-px,dy=e.clientY-py;flip=dx<0?-1:1;
  gun.style.transform=`rotate(${Math.atan2(dy,dx)*180/Math.PI}deg) scaleY(${flip})`;
}
addEventListener("pointermove",aim);
aim({clientX:innerWidth/2,clientY:innerHeight/3});

/* juego */
let q=[],i=0,score=0,streak=0,fails=[],hits=0,deadline=0,timer=null,locked=true,playing=false;
const msg=$("msg"),bar=$("bar");
function say(t,c){msg.textContent=t;msg.style.color=c;msg.classList.add("on");setTimeout(()=>msg.classList.remove("on"),900)}
function hud(){$("hProg").textContent=`Caso ${Math.min(i+1,q.length)}/${q.length}`;$("hScore").textContent=score+" pts";$("hStreak").textContent="Racha "+streak}
function start(n){q=n>=50?shuf(ALL):shuf(ALL).slice(0,n);i=0;score=0;streak=0;fails=[];hits=0;playing=true;$("menu").classList.add("hide");$("end").classList.add("hide");show()}
function show(){
  if(i>=q.length)return finish();
  cubes.forEach(c=>c.classList.remove("ok","bad","hint"));
  $("qtext").textContent=q[i][0];hud();locked=false;deadline=Date.now()+15000;tick();
  clearInterval(timer);timer=setInterval(tick,100);
}
function tick(){
  const left=Math.max(0,deadline-Date.now()),s=Math.ceil(left/1000);
  $("time").textContent=s;bar.firstElementChild.style.width=(left/150)+"%";
  const low=s<=5;$("time").classList.toggle("low",low);bar.classList.toggle("low",low);
  if(left<=0&&!locked){resolve(-1)}
}
function resolve(k){
  if(locked)return;locked=true;clearInterval(timer);
  const right=q[i][1],left=Math.max(0,deadline-Date.now());
  if(k===right){
    const pts=100+Math.floor(left/1000)*3+streak*10;score+=pts;streak++;hits++;
    setTimeout(()=>play("c"),150);cubes[k].classList.add("ok");say("¡CORRECTO! +"+pts,"#7dff9a");
  }else{
    streak=0;fails.push([q[i][0],M[right],k<0]);
    setTimeout(()=>play("e"),k<0?0:150);
    if(k>=0)cubes[k].classList.add("bad");
    cubes[right].classList.add("hint");
    say(k<0?"¡SE ACABÓ EL TIEMPO! Era "+M[right]:"Era "+M[right],"#ff8a9c");
    document.body.classList.add("shake");setTimeout(()=>document.body.classList.remove("shake"),300);
  }
  hud();i++;setTimeout(show,1300);
}
function finish(){
  playing=false;locked=true;
  const n=q.length,pct=Math.round(hits/n*100);
  $("eTitle").textContent=pct>=80?"¡VICTORIA!":pct>=50?"¡BUEN TIRO!":"A PRACTICAR";
  $("eStats").innerHTML=`✅ Correctas: <b>${hits}</b><br>❌ Incorrectas: <b>${n-hits}</b><br>⭐ Puntaje: <b>${score}</b>`;
  $("end").classList.remove("hide");
}
addEventListener("pointerdown",e=>{
  aim(e);if(!playing||locked)return;
  play("d");gun.classList.remove("rec");void gun.offsetWidth;gun.classList.add("rec");
  const h=document.createElement("div");h.className="hole";h.style.left=e.clientX+"px";h.style.top=e.clientY+"px";document.body.appendChild(h);setTimeout(()=>h.remove(),1700);
  const t=e.target.closest&&e.target.closest(".t");
  if(t)resolve(+t.dataset.k);
});
document.querySelectorAll("[data-n]").forEach(b=>b.addEventListener("click",()=>start(+b.dataset.n)));
$("again").addEventListener("click",()=>{$("end").classList.add("hide");$("menu").classList.remove("hide")});
