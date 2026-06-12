/* ============================================================
   SILDE core — icon set, mock data, pure time-calc utilities
   Exposes globals: Icon, SILDE_DATA, sutil
   ============================================================ */
const { createElement: h } = React;

/* ---------- ICON SET (line, ~1.9 stroke) ---------- */
const ICONS = {
  calendar:'M3 4h18v18H3zM3 9h18M8 2v4M16 2v4',
  flag:'M4 22V4M4 4c3-2 6 2 9 0s5-2 7-1v10c-2-1-4 0-7 1s-6-2-9 0',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0',
  users:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2 20a7 7 0 0 1 14 0M17 4.5a3.5 3.5 0 0 1 0 7M22 20a6.5 6.5 0 0 0-5-6.3',
  home:'M3 11l9-8 9 8M5 9v11h5v-6h4v6h5V9',
  pin:'M12 22s7-6.4 7-12A7 7 0 0 0 5 10c0 5.6 7 12 7 12ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  lock:'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  settings:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z|M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M16.9 16.9l2.1 2.1M19.1 4.9l-2.1 2.1M7 16.9l-2.1 2.1',
  plus:'M12 5v14M5 12h14',
  minus:'M5 12h14',
  copy:'M9 9h11v11H9zM5 15H4V4h11v1',
  share:'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v14',
  trash:'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14',
  edit:'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  chevron:'M6 9l6 6 6-6',
  chevronR:'M9 6l6 6-6 6',
  clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  car:'M5 13l1.5-5h11L19 13M5 13h14v5H5zM7 18v2M17 18v2M7.5 15.5h.01M16.5 15.5h.01',
  sparkle:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z',
  check:'M4 12l5 5L20 6',
  checkCircle:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 12l2.5 2.5 5-5',
  x:'M6 6l12 12M18 6L6 18',
  navigate:'M3 11l18-8-8 18-2-8-8-2Z',
  bolt:'M13 2L4 14h6l-1 8 9-12h-6l1-8Z',
  inbox:'M3 13h5l1 3h6l1-3h5M3 13l3-9h12l3 9v6H3z',
  moon:'M21 12.8A8 8 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z',
  sun:'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  phone:'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z',
  type:'M4 6V4h16v2M9 20h6M12 4v16',
  pencil:'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  arrowRight:'M5 12h14M13 6l6 6-6 6',
};
function Icon({name, size=20, fill=false, style, strokeWidth=1.9, className}){
  const d = ICONS[name] || '';
  const parts = d.split('|');
  return h('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:fill?'currentColor':'none',
    stroke:fill?'none':'currentColor','strokeWidth':strokeWidth,strokeLinecap:'round',strokeLinejoin:'round',style,className},
    parts.map((p,i)=>h('path',{key:i,d:p})));
}
function Paw({size=22,style}){
  return h('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'currentColor',style},
    h('ellipse',{cx:12,cy:15.5,rx:5,ry:4}),
    h('circle',{cx:6.5,cy:9.5,r:2}),h('circle',{cx:17.5,cy:9.5,r:2}),
    h('circle',{cx:9.5,cy:6,r:1.8}),h('circle',{cx:14.5,cy:6,r:1.8}));
}

/* ---------- pure time utilities (ported) ---------- */
const sutil = {
  p2:n=>String(n).padStart(2,'0'),
  fmtDV(d){return `${d.getFullYear()}-${sutil.p2(d.getMonth()+1)}-${sutil.p2(d.getDate())}`},
  normDV(v){if(!v)return'';const m=String(v).replace(/\//g,'-').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);return m?m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0'):''},
  fmtDL(v){if(!v)return'';const d=new Date(sutil.normDV(v)+'T00:00:00');if(isNaN(d))return'';return `${d.getMonth()+1}/${d.getDate()}(${'日月火水木金土'[d.getDay()]})`},
  fmtDLFull(v){if(!v)return'';const d=new Date(sutil.normDV(v)+'T00:00:00');if(isNaN(d))return'';return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日(${'日月火水木金土'[d.getDay()]})`},
  fmtMonth(v){if(!v)return'';const d=new Date(sutil.normDV(v)+'T00:00:00');if(isNaN(d))return'';return `${d.getFullYear()}年${d.getMonth()+1}月`},
  addMin(t,m){const[h,mm]=t.split(':').map(Number);const x=h*60+mm+Number(m);return `${sutil.p2(Math.floor(x/60)%24)}:${sutil.p2(((x%60)+60)%60)}`},
  subMin(t,m){const[h,mm]=t.split(':').map(Number);let x=h*60+mm-Number(m);if(x<0)x+=1440;return `${sutil.p2(Math.floor(x/60)%24)}:${sutil.p2(x%60)}`},
  ceil5(m){return Math.ceil(Number(m)/5)*5},
  round5(t){const[h,m]=t.split(':').map(Number);const x=Math.floor((h*60+m)/5)*5;return `${sutil.p2(Math.floor(x/60)%24)}:${sutil.p2(x%60)}`},
  todayVal(){return sutil.fmtDV(new Date())},
  nowHHMM(dbg){if(dbg)return dbg;const d=new Date();return sutil.p2(d.getHours())+':'+sutil.p2(d.getMinutes())},
};

/* ---------- GAS ---------- */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbymJJag2hZIXnudvejecWckv2YTzexAMPE7dSgcf-OQuj1Jk_BpygOXL489KBwD11W-sA/exec';

async function gasGet(action='all'){
  const res = await fetch(`${GAS_URL}?action=${action}&_=${Date.now()}`);
  if (!res.ok) throw new Error('HTTP '+res.status);
  return res.json();
}
function gasPost(data){
  if (!GAS_URL) return;
  const d = JSON.parse(JSON.stringify(data));
  if (d.payload){ delete d.payload.shunTxt; delete d.payload.boyTxt; }
  const action = d.action; delete d.action;
  fetch(`${GAS_URL}?action=${action}&data=${encodeURIComponent(JSON.stringify(d))}`, {mode:'no-cors'})
    .catch(e=>console.warn('GAS post failed:',e));
}

/* ---------- DEFAULT DATA (replaced on load) ---------- */
const SILDE_DATA = {
  girls:[], places:[], depLocs:[], memo:'',
  battery:{}, location:{}, secret:{url:'',text:''},
  history:[],
};

function rebuildTexts(e){
  let shun=[e.dateLabel,''],boy=[e.dateLabel,''];
  e.runs.forEach((run,ri)=>{
    shun.push(run.departLabel);
    run.stops.forEach(s=>{shun.push(`${s.min}分`);shun.push(`${s.time} ${s.name}${s.type==='pick'?'迎え':'着'}`);boy.push(`${s.time} ${s.name}${s.type==='pick'?'迎え':'着'}`);});
    if(ri<e.runs.length-1){shun.push('');boy.push('');}
  });
  e.shunTxt=shun.join('\n');e.boyTxt=boy.join('\n');
}

Object.assign(window,{h,Icon,Paw,sutil,SILDE_DATA,rebuildTexts,gasGet,gasPost});
