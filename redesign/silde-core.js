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

/* ---------- MOCK DATA ---------- */
const _t = new Date();
const _today = sutil.fmtDV(_t);
const _d = (off)=>{const x=new Date();x.setDate(x.getDate()+off);return sutil.fmtDV(x)};

const SILDE_DATA = {
  girls:[
    {id:1,name:'さな',nick:'さなマンション前',addr:'大阪市北区中崎西2-1-1'},
    {id:2,name:'みく',nick:'みくさん自宅',addr:'大阪市福島区福島3-2-5'},
    {id:3,name:'ゆい',nick:'ゆいハイツ前',addr:'大阪市西区新町1-4-8'},
    {id:4,name:'りお',nick:'りおさんコンビニ',addr:'大阪市淀川区十三本町2-3'},
  ],
  places:[{id:1,name:'Venus',addr:'大阪市中央区東心斎橋1-1-1'}],
  depLocs:[
    {id:1,name:'自宅',addr:'大阪市都島区網島町5-1'},
    {id:2,name:'梅田オフィス',addr:'大阪市北区梅田1-1-3'},
  ],
  memo:'今日は雨予報☔️ 早めに出発。\nさなちゃん、出発前に電話します。',
  battery:{
    hee:{level:82,charging:true, at:new Date(Date.now()-40*1000).toISOString()},
    shun:{level:47,charging:false,at:new Date(Date.now()-6*60*1000).toISOString()},
  },
  location:{
    shun:{lat:34.71,lng:135.50,at:new Date(Date.now()-12*1000).toISOString()},
    hee:{lat:34.69,lng:135.49,at:new Date(Date.now()-4*1000).toISOString()},
  },
  secret:{url:'',text:''},
  // pre-built history entries (runs already computed)
  history:[
    {id:101,dateVal:_today,dateLabel:sutil.fmtDL(_today),
     runs:[{departLabel:'18:05 梅田オフィス出発',departTime:'18:05',stops:[
        {time:'18:25',name:'さな',type:'pick',min:20},
        {time:'18:40',name:'みく',type:'pick',min:15},
        {time:'18:50',name:'Venus',type:'drop',min:10},
      ]},
      {departLabel:'19:35 Venus出発',departTime:'19:35',stops:[
        {time:'19:55',name:'ゆい',type:'pick',min:20},
        {time:'20:10',name:'Venus',type:'drop',min:15},
      ]}]},
    {id:95,dateVal:_d(-2),dateLabel:sutil.fmtDL(_d(-2)),
     runs:[{departLabel:'18:10 自宅出発',departTime:'18:10',stops:[
        {time:'18:35',name:'りお',type:'pick',min:25},
        {time:'18:50',name:'さな',type:'pick',min:15},
        {time:'19:00',name:'Venus',type:'drop',min:10},
      ]}]},
    {id:88,dateVal:_d(-9),dateLabel:sutil.fmtDL(_d(-9)),
     runs:[{departLabel:'17:50 自宅出発',departTime:'17:50',stops:[
        {time:'18:15',name:'みく',type:'pick',min:25},
        {time:'18:25',name:'Venus',type:'drop',min:10},
      ]}]},
    {id:74,dateVal:_d(-34),dateLabel:sutil.fmtDL(_d(-34)),
     runs:[{departLabel:'18:20 梅田オフィス出発',departTime:'18:20',stops:[
        {time:'18:40',name:'ゆい',type:'pick',min:20},
        {time:'18:55',name:'さな',type:'pick',min:15},
        {time:'19:05',name:'Venus',type:'drop',min:10},
      ]}]},
    {id:60,dateVal:_d(-41),dateLabel:sutil.fmtDL(_d(-41)),
     runs:[{departLabel:'19:00 自宅出発',departTime:'19:00',stops:[
        {time:'19:20',name:'りお',type:'pick',min:20},
        {time:'19:30',name:'Venus',type:'drop',min:10},
      ]}]},
  ],
};
// rebuild copy-text for each history entry
function rebuildTexts(e){
  let shun=[e.dateLabel,''],boy=[e.dateLabel,''];
  e.runs.forEach((run,ri)=>{
    shun.push(run.departLabel);
    run.stops.forEach(s=>{shun.push(`${s.min}分`);shun.push(`${s.time} ${s.name}${s.type==='pick'?'迎え':'着'}`);boy.push(`${s.time} ${s.name}${s.type==='pick'?'迎え':'着'}`);});
    if(ri<e.runs.length-1){shun.push('');boy.push('');}
  });
  e.shunTxt=shun.join('\n');e.boyTxt=boy.join('\n');
}
SILDE_DATA.history.forEach(rebuildTexts);

Object.assign(window,{h,Icon,Paw,sutil,SILDE_DATA,rebuildTexts});
