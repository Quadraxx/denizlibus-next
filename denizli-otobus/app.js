/**
 * app.js — Denizli Ulaşım A.Ş.
 * Otobüsler duraklarda bekler, beklerken durak yanıp söner.
 */

/* ===== MAP ===== */
const map = L.map('map', { zoomControl: false }).setView([37.7750, 29.0864], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 19
}).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

/* ===== COLORS ===== */
const COLOR_HEX = { blue:'#0066ff', green:'#00c853', purple:'#aa00ff', orange:'#ff6d00', red:'#f50057' };
const hex = c => COLOR_HEX[c] || '#0066ff';

/* ===== ICONS ===== */
function createStopIcon(isFirst) {
    return L.divIcon({
        className:'',
        html:`<div class="stop-marker ${isFirst?'stop-marker--first':''}"><span class="stop-marker__label">${isFirst?'●':'D'}</span></div>`,
        iconSize:[30,30], iconAnchor:[15,15], popupAnchor:[0,-18]
    });
}
function createBusIcon(colorName) {
    const h = hex(colorName);
    return L.divIcon({
        className:'',
        html:`<div class="bus-live-marker" style="border-color:${h};box-shadow:0 0 0 5px ${h}33,0 4px 16px ${h}77">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="12" rx="3" fill="${h}"/>
                <circle cx="6.5" cy="17" r="1.8" fill="white"/><circle cx="17.5" cy="17" r="1.8" fill="white"/>
                <path d="M2 12h20M7 9h10" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
              </svg></div>`,
        iconSize:[36,36], iconAnchor:[18,18], popupAnchor:[0,-22]
    });
}
function createPulseIcon(h) {
    return L.divIcon({
        className:'',
        html:`<div class="stop-pulse-ring" style="border-color:${h}"></div>`,
        iconSize:[60,60], iconAnchor:[30,30]
    });
}
const userIcon = L.divIcon({
    className:'',
    html:`<div class="user-marker"><div class="user-marker__ring"></div></div>`,
    iconSize:[24,24], iconAnchor:[12,12]
});

/* ===== STATE ===== */
let activeRouteIndex=null, currentDirection='gidis';
let routeControl=null, stopMarkers=[], userMarker=null;
let detailInterval=null;
const liveBuses = {};
const activePulses = {};
const routeGeomSegs = {};

/* ===== DWELL CONFIG ===== */
const DWELL_SEC = 25; // durakta bekleme süresi

/* ===== BUS STATE (dwell / travel) ===== */
// direction: 'gidis' | 'donus'  — her otobus kendi yonunu sonsuz donguyle yapar
function getBusState(route, idx, direction) {
    const path = (direction==='gidis' ? route.gidis : route.donus).filter(id=>STOPS[id]);
    const routeSec = parseInt(route.time)*60;
    const n = path.length;
    const travelSec = Math.max(10,(routeSec - n*DWELL_SEC)/Math.max(1,n-1));
    const cycle = n*DWELL_SEC + (n-1)*travelSec;

    const now = new Date();
    const baseOff = route.id.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % parseInt(route.time) * 60;
    // Donus otobüsü yarım döngü geride başlasın ki hatlar birbirinden ayrışsın
    const dirOff = direction==='donus' ? Math.floor(cycle/2) : 0;
    const totalSec = now.getHours()*3600+now.getMinutes()*60+now.getSeconds()+baseOff+dirOff;
    let t = totalSec % cycle;

    if(t<DWELL_SEC) return {phase:'dwell',stopId:path[0],stopIdx:0,path,isGidis:direction==='gidis',route};
    t-=DWELL_SEC;
    for(let i=0;i<path.length-1;i++){
        if(t<travelSec) return {phase:'travel',fromIdx:i,toIdx:i+1,frac:t/travelSec,path,isGidis:direction==='gidis',route};
        t-=travelSec;
        if(t<DWELL_SEC) return {phase:'dwell',stopId:path[i+1],stopIdx:i+1,path,isGidis:direction==='gidis',route};
        t-=DWELL_SEC;
    }
    return {phase:'dwell',stopId:path[path.length-1],stopIdx:path.length-1,path,isGidis:direction==='gidis',route};
}

/* ===== POSITION FROM STATE ===== */
function posFromState(state, idx) {
    if (state.phase === 'dwell') {
        const s = STOPS[state.stopId];
        return s ? { lat:s.coords[0], lng:s.coords[1], atStop:state.stopId } : null;
    }
    const { fromIdx, toIdx, frac, path, isGidis } = state;
    const segs = routeGeomSegs[idx];
    if (segs) {
        const segArr = isGidis ? segs.gidis : segs.donus;
        const seg = segArr?.[fromIdx];
        if (seg && seg.length >= 2) {
            const p = posAlongPolyline(seg, frac);
            if (p) return { lat:p[0], lng:p[1], atStop:null };
        }
    }
    // Fallback: straight line
    const f = STOPS[path[fromIdx]], t2 = STOPS[path[toIdx]];
    if (!f || !t2) return null;
    return { lat: f.coords[0]+(t2.coords[0]-f.coords[0])*frac, lng: f.coords[1]+(t2.coords[1]-f.coords[1])*frac, atStop:null };
}

/* ===== POLYLINE HELPERS ===== */
function posAlongPolyline(coords, frac) {
    if (!coords?.length) return null;
    if (frac <= 0) return coords[0];
    if (frac >= 1) return coords[coords.length-1];
    const dists=[]; let total=0;
    for (let i=0;i<coords.length-1;i++) {
        const d=Math.hypot(coords[i+1][0]-coords[i][0],coords[i+1][1]-coords[i][1]);
        dists.push(d); total+=d;
    }
    const target=total*frac; let acc=0;
    for (let i=0;i<dists.length;i++) {
        if (acc+dists[i]>=target) {
            const t=dists[i]===0?0:(target-acc)/dists[i];
            return [coords[i][0]+(coords[i+1][0]-coords[i][0])*t, coords[i][1]+(coords[i+1][1]-coords[i][1])*t];
        }
        acc+=dists[i];
    }
    return coords[coords.length-1];
}

function splitPolyByStops(poly, stopIds) {
    const valid = stopIds.filter(id=>STOPS[id]);
    const indices = valid.map(id => {
        const c=STOPS[id].coords; let minD=Infinity, minI=0;
        poly.forEach((p,i)=>{ const d=Math.hypot(p[0]-c[0],p[1]-c[1]); if(d<minD){minD=d;minI=i;} });
        return minI;
    });
    return indices.slice(0,-1).map((si,i) => {
        const ei=indices[i+1];
        return si<=ei ? poly.slice(si,ei+1) : poly.slice(ei,si+1).reverse();
    });
}

/* ===== FETCH GEOMETRY ===== */
async function fetchGeometry(stopIds) {
    const valid=stopIds.filter(id=>STOPS[id]);
    if (valid.length<2) return valid.map(id=>[...STOPS[id].coords]);
    const coordStr=valid.map(id=>`${STOPS[id].coords[1]},${STOPS[id].coords[0]}`).join(';');
    try {
        const res=await fetch(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`);
        const data=await res.json();
        if (data.code==='Ok'&&data.routes?.[0]) return data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);
    } catch(e) { console.warn('OSRM fail',e); }
    return valid.map(id=>[...STOPS[id].coords]);
}

async function fetchAllGeometries() {
    for (let i=0;i<ROUTES.length;i++) {
        await new Promise(r=>setTimeout(r,i*500));
        const r=ROUTES[i];
        const [gPoly,dPoly]=await Promise.all([fetchGeometry(r.gidis),fetchGeometry(r.donus)]);
        routeGeomSegs[i]={
            gidis:splitPolyByStops(gPoly,r.gidis),
            donus:splitPolyByStops(dPoly,r.donus)
        };
    }
}

/* ===== PULSE STOPS ===== */
function updatePulses(dwellingStops) {
    Object.keys(activePulses).forEach(sid=>{
        if(!dwellingStops.has(sid)){map.removeLayer(activePulses[sid]);delete activePulses[sid];}
    });
    dwellingStops.forEach(sid=>{
        if(!activePulses[sid]&&STOPS[sid]){
            // Find route color for this stop
            let col='blue';
            Object.values(liveBuses).forEach(b=>{
                const st=getBusState(b.route,ROUTES.indexOf(b.route));
                if(st.phase==='dwell'&&st.stopId===sid) col=b.route.color;
            });
            activePulses[sid]=L.marker(STOPS[sid].coords,{icon:createPulseIcon(hex(col)),zIndexOffset:-100}).addTo(map);
        }
    });
}

/* ===== BUS POPUP ===== */
function busPop(route, state, pos) {
    const h=hex(route.color);
    const nextId = state.phase==='dwell' ? state.path[Math.min(state.stopIdx+1,state.path.length-1)] : state.path[state.toIdx];
    const next=STOPS[nextId];
    const label=state.phase==='dwell' ? `🚌 Durakta bekliyor` : `🚌 Seyahat ediyor`;
    return `<div style="min-width:155px;line-height:1.65;font-family:Inter,sans-serif">
        <b style="font-size:14px">Hat ${route.id}</b><br>
        <span style="color:#888;font-size:12px">${route.name}</span><br>
        <span style="font-size:12px">${label}</span><br>
        ${next?`<span style="color:${h};font-weight:700;font-size:13px">→ ${next.name}</span>`:''}
        <br><span style="font-size:12px">${state.isGidis?'Gidiş':'Dönüş'}</span>
    </div>`;
}

/* ===== ANIMATION ===== */
function startBusAnimations() {
    // Her hat icin 2 otobus: gidis + donus
    ROUTES.forEach((route,idx)=>{
        ['gidis','donus'].forEach(dir=>{
            const key=`${idx}_${dir}`;
            const state=getBusState(route,idx,dir);
            const pos=posFromState(state,idx);
            if(!pos) return;
            const marker=L.marker([pos.lat,pos.lng],{icon:createBusIcon(route.color),zIndexOffset:500})
                .addTo(map)
                .bindPopup(busPop(route,state,pos));

            // Tıklanınca detay panelini aç + doğru yönü seç
            marker.on('click',()=>{
                openDetail(idx);
                setTimeout(()=>setDetailDirection(dir),80);
            });

            liveBuses[key]={marker,route,idx,dir};
        });
    });

    setInterval(()=>{
        const dwellingNow=new Set();
        Object.entries(liveBuses).forEach(([key,bus])=>{
            const state=getBusState(bus.route,bus.idx,bus.dir);
            const pos=posFromState(state,bus.idx);
            if(!pos) return;
            bus.marker.setLatLng([pos.lat,pos.lng]);
            bus.marker.bindPopup(busPop(bus.route,state,pos));
            if(pos.atStop) dwellingNow.add(pos.atStop+bus.dir);
        });
        updatePulses(dwellingNow);
    },1000);

    fetchAllGeometries();
}

/* ===== OCC ===== */
const _occ={};
function getOcc(id){
    if(!_occ[id]){
        const p=(id.split('').reduce((a,c)=>a+c.charCodeAt(0),0)*37%80)+10;
        _occ[id]={pct:p,color:p<40?'#00c853':p<75?'#ffab00':'#f50057',text:p<40?'Müsait':p<75?'Normal':'Yoğun'};
    }
    return _occ[id];
}

/* ===== RENDER LIST ===== */
function renderRouteList(data=ROUTES){
    const list=document.getElementById('routesList');
    list.innerHTML='';
    document.getElementById('routeCount').innerText=data.length+' hat';
    if(!data.length){list.innerHTML=`<p style="text-align:center;color:#8e8e93;padding:30px 0;font-size:14px">Sonuç bulunamadı</p>`;return;}
    data.forEach(r=>{
        const idx=ROUTES.indexOf(r),o=getOcc(r.id),h=hex(r.color);
        // Live bus state labels for this route
        const stG=getBusState(r,idx,'gidis');
        const stD=getBusState(r,idx,'donus');
        const gLabel=stG.phase==='dwell'?'Durakta':'Seyahatte';
        const dLabel=stD.phase==='dwell'?'Durakta':'Seyahatte';
        list.insertAdjacentHTML('beforeend',`
          <div class="route-card" onclick="openDetail(${idx})">
            <div class="card-badge" style="background:linear-gradient(135deg,${h},${h}99)">${r.id}</div>
            <div class="card-info">
              <div class="card-title">${r.name}</div>
              <div class="card-buses">
                <div class="bus-pill" style="border-color:${h}22;background:${h}11">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="${h}" style="flex-shrink:0">
                    <rect x="2" y="6" width="20" height="12" rx="3"/>
                    <circle cx="6.5" cy="17" r="1.5" fill="white"/>
                    <circle cx="17.5" cy="17" r="1.5" fill="white"/>
                    <path d="M2 12h20" stroke="white" stroke-width="1.5"/>
                  </svg>
                  <span style="color:${h};font-weight:600">→</span>
                  <span>${gLabel}</span>
                </div>
                <div class="bus-pill" style="border-color:${h}22;background:${h}11">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="${h}" style="flex-shrink:0">
                    <rect x="2" y="6" width="20" height="12" rx="3"/>
                    <circle cx="6.5" cy="17" r="1.5" fill="white"/>
                    <circle cx="17.5" cy="17" r="1.5" fill="white"/>
                    <path d="M2 12h20" stroke="white" stroke-width="1.5"/>
                  </svg>
                  <span style="color:${h};font-weight:600">←</span>
                  <span>${dLabel}</span>
                </div>
              </div>
              <div class="card-meta">
                <span class="occ-tag" style="color:${o.color}"><span class="occ-dot" style="background:${o.color};box-shadow:0 0 5px ${o.color}66"></span>%${o.pct} ${o.text}</span>
                <span class="card-time"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${r.time}</span>
              </div>
            </div>
            <div class="card-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></div>
          </div>`);
    });
}


/* ===== DETAIL ===== */
function openDetail(idx){
    activeRouteIndex=idx; currentDirection='gidis';
    const r=ROUTES[idx],h=hex(r.color);
    document.getElementById('detailId').innerText='Hat '+r.id;
    document.getElementById('detailId').style.color=h;
    document.getElementById('detailName').innerText=r.name;
    document.getElementById('detailDesc').innerText=r.description||'';
    document.getElementById('tabGidis').classList.add('active');
    document.getElementById('tabDonus').classList.remove('active');
    document.getElementById('mainPanel').classList.add('hidden');
    document.getElementById('detailPanel').classList.add('active');
    renderTimeline(); renderRouteOnMap();
    if(detailInterval) clearInterval(detailInterval);
    detailInterval=setInterval(renderTimeline,1000);
}
function closeDetail(){
    if(detailInterval){clearInterval(detailInterval);detailInterval=null;}
    document.getElementById('mainPanel').classList.remove('hidden');
    document.getElementById('detailPanel').classList.remove('active');
    clearRouteMap(); activeRouteIndex=null;
}
function setDetailDirection(dir){
    if(detailInterval){clearInterval(detailInterval);detailInterval=null;}
    currentDirection=dir;
    document.getElementById('tabGidis').classList.toggle('active',dir==='gidis');
    document.getElementById('tabDonus').classList.toggle('active',dir==='donus');
    renderTimeline(); renderRouteOnMap();
    detailInterval=setInterval(renderTimeline,1000);
}

/* ===== LIVE TIMELINE ===== */
function getStopETAs(routeIdx, direction) {
    const r=ROUTES[routeIdx];
    const routeSec=parseInt(r.time)*60;
    const pg=r.gidis.filter(id=>STOPS[id]);
    const pd=r.donus.filter(id=>STOPS[id]);
    const tg=Math.max(10,(routeSec-pg.length*DWELL_SEC)/Math.max(1,pg.length-1));
    const td=Math.max(10,(routeSec-pd.length*DWELL_SEC)/Math.max(1,pd.length-1));
    const gCycle=pg.length*DWELL_SEC+(pg.length-1)*tg;
    const dCycle=pd.length*DWELL_SEC+(pd.length-1)*td;
    const fullCycle=gCycle+dCycle;
    const now=new Date();
    const offset=r.id.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%parseInt(r.time)*60;
    const totalSec=now.getHours()*3600+now.getMinutes()*60+now.getSeconds()+offset;
    const t=totalSec%fullCycle;
    const dirCycle=direction==='gidis'?gCycle:dCycle;
    const dirStart=direction==='gidis'?0:gCycle;
    let elapsed=t-dirStart;
    if(elapsed<0) elapsed+=fullCycle;
    elapsed=elapsed%dirCycle;
    const path=direction==='gidis'?pg:pd;
    const travelSec=direction==='gidis'?tg:td;
    const arrivals=[0];
    for(let i=0;i<path.length-1;i++) arrivals.push(arrivals[i]+DWELL_SEC+travelSec);
    return path.map((id,i)=>({
        id, secs:arrivals[i]-elapsed,
        isDwell:elapsed>=arrivals[i]&&elapsed<arrivals[i]+DWELL_SEC
    }));
}

function renderTimeline(){
    if(activeRouteIndex===null) return;
    const r=ROUTES[activeRouteIndex];
    const path=(currentDirection==='gidis'?r.gidis:r.donus).filter(id=>STOPS[id]);
    const h=hex(r.color);
    const etas=getStopETAs(activeRouteIndex,currentDirection);
    document.getElementById('timelineList').innerHTML=path.map((id,i)=>{
        const s=STOPS[id],eta=etas[i],isLast=i===path.length-1;
        const isCurrent=eta?.isDwell;
        const isPassed=eta&&eta.secs<-DWELL_SEC;
        let label,dotStyle,nameStyle='';
        if(isCurrent){
            label='🚌 Şimdi burada';
            dotStyle=`background:${h};border-color:${h};box-shadow:0 0 0 5px ${h}44`;
        } else if(isPassed){
            label='Geçildi';
            dotStyle='background:#2a2a2a;border-color:#444';
            nameStyle='color:#555;text-decoration:line-through';
        } else {
            const mins=Math.max(1,Math.ceil((eta?.secs||60)/60));
            label=`${mins} dk kaldı`;
            dotStyle=`border-color:${h}`;
        }
        const lineClr=isPassed?'#333':h;
        return `<div class="time-stop">
            ${!isLast?`<div class="time-line" style="background:linear-gradient(to bottom,${lineClr},${lineClr}22)"></div>`:''}
            <div class="time-dot" style="${dotStyle}"></div>
            <div class="time-content">
              <div class="stop-name" style="${nameStyle}">${s.name}</div>
              <div class="stop-meta" style="${isCurrent?`color:${h};font-weight:600`:isPassed?'color:#555':''}">${label} · ${s.zone}</div>
            </div>
          </div>`;
    }).join('');
}

/* ===== MAP ROUTE ===== */
function renderRouteOnMap(){
    clearRouteMap();
    const r=ROUTES[activeRouteIndex];
    const path=(currentDirection==='gidis'?r.gidis:r.donus).filter(id=>STOPS[id]);
    const h=hex(r.color);
    const segMin=Math.max(1,Math.ceil(parseInt(r.time)/Math.max(1,path.length-1)));
    path.forEach((id,i)=>{
        const s=STOPS[id];
        stopMarkers.push(L.marker(s.coords,{icon:createStopIcon(i===0)}).addTo(map)
            .bindPopup(`<div style="min-width:140px;line-height:1.6"><b>${s.name}</b><br><span style="color:#888;font-size:12px">Hat ${r.id} · ${s.zone}</span><br><span style="color:${h};font-weight:600;font-size:13px">${i===0?'🚌 Başlangıç':`⏱ +${i*segMin} dk`}</span></div>`));
    });
    const wps=path.map(id=>L.latLng(STOPS[id].coords[0],STOPS[id].coords[1]));
    routeControl=L.Routing.control({
        waypoints:wps,router:L.Routing.osrmv1({serviceUrl:'https://router.project-osrm.org/route/v1'}),
        addWaypoints:false,draggableWaypoints:false,fitSelectedRoutes:true,show:false,
        lineOptions:{styles:[{color:h,weight:6,opacity:0.88}]},createMarker:()=>null
    }).addTo(map);
}
function clearRouteMap(){
    if(routeControl){map.removeControl(routeControl);routeControl=null;}
    stopMarkers.forEach(m=>map.removeLayer(m));stopMarkers=[];
}

/* ===== NEAREST ===== */
function findNearestStop(){
    if(!navigator.geolocation) return alert('Konum desteklenmiyor.');
    navigator.geolocation.getCurrentPosition(pos=>{
        const {latitude:lat,longitude:lng}=pos.coords;
        if(userMarker) map.removeLayer(userMarker);
        userMarker=L.marker([lat,lng],{icon:userIcon}).addTo(map);
        let nearest=null,minD=Infinity;
        Object.values(STOPS).forEach(s=>{const d=Math.hypot(s.coords[0]-lat,s.coords[1]-lng);if(d<minD){minD=d;nearest=s;}});
        if(nearest){
            L.popup().setLatLng(nearest.coords).setContent(`<b>📍 En Yakın Durak</b><br>${nearest.name}<br><span style="color:#0066ff">${(minD*111).toFixed(2)} km uzaklıkta</span>`).openOn(map);
            map.flyTo(nearest.coords,16,{duration:1.5});
        }
    });
}

/* ===== SEARCH ===== */
document.getElementById('searchInput').addEventListener('input',e=>{
    const val=e.target.value.toLowerCase().trim();
    renderRouteList(val?ROUTES.filter(r=>r.id.toLowerCase().includes(val)||r.name.toLowerCase().includes(val)||r.gidis.some(id=>STOPS[id]?.name.toLowerCase().includes(val))):ROUTES);
});

/* ===== CLOCK ===== */
function tick(){const el=document.getElementById('clock');if(el)el.innerText=new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});}
tick();setInterval(tick,1000);

/* ===== RESIZE ===== */
setTimeout(()=>map.invalidateSize(),400);
window.addEventListener('resize',()=>setTimeout(()=>map.invalidateSize(),200));

/* ===== INIT ===== */
renderRouteList();
startBusAnimations();
/* ===== LOADER CLOSE ===== */
window.addEventListener("load", () => {
    setTimeout(() => {
        const loader = document.getElementById("splashLoader");
        if (loader) loader.classList.add("fade-out");
    }, 2800);
});
