/* ============================================================
   SILDE screens — Schedule, Map, Destinations, Secret
   ============================================================ */
const { useState:uS, useRef:uR, useEffect:uE } = React;

/* ---- shared: run timeline ---- */
function RunList({entry, showNow, now, editable, onEditTime}){
  return entry.runs.map((run,ri)=>{
    const allPast = showNow ? run.stops.every(s=>s.time<=now) : false;
    let nowDone=false;
    return h('div',{className:'run',key:ri},
      h('div',{className:'run-lbl'}, h(Icon,{name:'car'}), h('b',null,run.departTime), run.departLabel.replace(run.departTime,'').trim()),
      run.stops.map((s,si)=>{
        const past = showNow ? s.time<=now : false;
        const insertNow = showNow && !past && !nowDone; if(insertNow) nowDone=true;
        return h(React.Fragment,{key:si},
          insertNow && h('div',{className:'tl-now'}, h('span',{className:'nd'}, h(Icon,{name:'navigate',size:15,fill:true})), h('span',null,'いまここ')),
          h('div',{className:'tl'+(past?' past':'')},
            h('span',{className:'tl-dot '+(s.type==='pick'?'dot-pick':'dot-drop')}),
            editable
              ? h('input',{className:'tl-time',type:'time',value:s.time,style:{border:'none',background:'transparent',width:58,padding:0,outline:'none'},
                  onChange:e=>onEditTime(ri,si,e.target.value)})
              : h('span',{className:'tl-time'},s.time),
            h('span',{className:'tl-name'},s.name),
            h('span',{className:'tl-badge '+(s.type==='pick'?'badge-pick':'badge-drop')}, s.type==='pick'?'迎え':'店着'),
            s.min!=null && h('span',{className:'tl-min'},s.min+'分')
          ));
      }),
      allPast && h('div',{className:'run-done'}, h(Icon,{name:'check',size:13}),'完了')
    );
  });
}

/* ---- battery card ---- */
function BatteryCard({battery}){
  const users=[{key:'hee',label:'ひーちゃん',dot:'var(--accent)'},{key:'shun',label:'しゅん',dot:'var(--drop)'}];
  const ago=(iso)=>{const s=Math.floor((Date.now()-new Date(iso).getTime())/1000);return s<60?'今さっき':s<3600?Math.floor(s/60)+'分前':Math.floor(s/3600)+'時間前';};
  return h('div',{className:'batt-card'}, users.map(u=>{
    const d=battery[u.key]; if(!d) return h('div',{className:'batt',key:u.key},h('span',{className:'st'},'データなし'));
    const lv=Math.max(0,Math.min(100,d.level));
    const col=d.charging?'#34c759':lv<15?'#ff453a':lv<30?'#ffcc00':'var(--accent)';
    return h('div',{className:'batt',key:u.key},
      h('div',{className:'who'},
        h('div',{className:'nm'}, h('span',{className:'udot',style:{background:u.dot}}), u.label),
        h('div',{className:'st'}, d.charging?'充電中':ago(d.at))),
      h('div',{style:{display:'flex',alignItems:'center',gap:7}},
        h('div',{className:'batt-glyph'}, h('div',{className:'batt-fill',style:{width:lv+'%',background:col}})),
        h('div',{className:'pct'}, lv, h('small',null,'%'))));
  }));
}

/* ================= SCHEDULE (home) ================= */
function ScheduleScreen({history, battery, debugTime, setDebugTime, openHistDetail, onEditTodayTime, histPage, setHistPage}){
  const sliderRef=uR(null);
  const today=sutil.todayVal();
  const now=sutil.nowHHMM(debugTime);
  const todayEntry=history.find(x=>x.dateVal===today);
  const others=history.filter(x=>x.dateVal!==today);
  const monthMap={};
  others.forEach(e=>{const m=sutil.fmtMonth(e.dateVal);(monthMap[m]=monthMap[m]||[]).push(e);});
  const [openMonths,setOpenMonths]=uS(()=>{const k=Object.keys(monthMap).sort((a,b)=>b.localeCompare(a));return k.length?{[k[0]]:true}:{};});

  const onScroll=()=>{const s=sliderRef.current;if(!s)return;setHistPage(s.scrollLeft>s.offsetWidth*0.5?1:0);};
  const goPage=(i)=>{const s=sliderRef.current;if(s)s.scrollTo({left:i*s.offsetWidth,behavior:'smooth'});};

  return h('div',{className:'page',style:{overflow:'hidden',display:'flex',flexDirection:'column'}},
    h('div',{className:'dots'},
      h('span',{className:'dot'+(histPage===0?' active':''),onClick:()=>goPage(0)}),
      h('span',{className:'dot'+(histPage===1?' active':''),onClick:()=>goPage(1)})),
    h('div',{ref:sliderRef,onScroll,style:{display:'flex',flex:1,minHeight:0,overflowX:'auto',scrollSnapType:'x mandatory',scrollbarWidth:'none'}},
      // PAGE 0: today
      h('div',{style:{minWidth:'100%',scrollSnapAlign:'start',overflowY:'auto',padding:'4px 16px 200px'}},
        h('div',{className:'page-inner',style:{padding:0}},
          h('div',{className:'today-card fade-in'},
            todayEntry
              ? [h('div',{className:'today-hd',key:'h'},
                   h('div',null,h('div',{className:'lbl'},'TODAY'),h('div',{className:'date'},sutil.fmtDLFull(todayEntry.dateVal))),
                   h('span',{className:'chip'},todayEntry.runs.length+'便')),
                 h(RunList,{key:'r',entry:todayEntry,showNow:true,now,editable:true,onEditTime:(ri,si,v)=>onEditTodayTime(todayEntry.id,ri,si,v)}),
                 h('div',{className:'action-bar',key:'a'},
                   h('button',{className:'act',onClick:()=>openHistDetail(todayEntry.id)}, h(Icon,{name:'edit'}),'編集'),
                   h('button',{className:'act',onClick:()=>window.__silde.copy(todayEntry.shunTxt)}, h(Icon,{name:'copy'}),'コピー'),
                   h('button',{className:'act',onClick:()=>window.__silde.share(todayEntry.boyTxt)}, h(Icon,{name:'share'}),'共有'))]
              : [h('div',{className:'today-hd',key:'h'}, h('div',null,h('div',{className:'lbl'},'TODAY'),h('div',{className:'date'},sutil.fmtDLFull(today)))),
                 h('div',{className:'today-empty',key:'e'}, h(Icon,{name:'inbox',size:42,style:{marginBottom:12}}),
                   h('p',null,'今日のスケジュールはまだありません'), h('small',null,'右下のボタンから作成してね'))]),
          h(BatteryCard,{battery}),
          h('div',{className:'testrow'},
            h(Icon,{name:'clock',size:16,className:'tl-ico'}),
            h('span',{className:'tlbl'},'テスト時刻'),
            h('input',{className:'inp',type:'time',value:debugTime||'',onChange:e=>setDebugTime(e.target.value)}),
            h('button',{className:'clr',onClick:()=>setDebugTime('')},'リセット')))),
      // PAGE 1: months
      h('div',{style:{minWidth:'100%',scrollSnapAlign:'start',overflowY:'auto',padding:'4px 16px 200px'}},
        h('div',{className:'page-inner',style:{padding:0}},
          Object.keys(monthMap).length===0
            ? h('div',{className:'today-empty',style:{marginTop:40}}, h(Icon,{name:'inbox',size:42,style:{marginBottom:12}}), h('p',null,'保存された履歴はまだありません'))
            : Object.entries(monthMap).sort((a,b)=>b[0].localeCompare(a[0])).map(([month,entries])=>{
                const open=!!openMonths[month];
                return h('div',{className:'macc'+(open?' open':''),key:month},
                  h('div',{className:'macc-hd',onClick:()=>setOpenMonths(o=>({...o,[month]:!o[month]}))},
                    h('span',{className:'macc-title'},month),
                    h('div',{className:'macc-r'}, h('span',{className:'macc-count'},entries.length+'件'), h(Icon,{name:'chevron',size:16,className:'macc-arr'}))),
                  h('div',{className:'macc-body',style:{maxHeight:open?entries.length*80+'px':0}},
                    entries.sort((a,b)=>b.dateVal.localeCompare(a.dateVal)).map(e=>{
                      const names=e.runs.flatMap(r=>r.stops.filter(s=>s.type==='pick').map(s=>s.name)).join('・');
                      return h('div',{className:'hitem',key:e.id,onClick:()=>openHistDetail(e.id)},
                        h('div',null, h('div',{className:'hd-date'},sutil.fmtDLFull(e.dateVal)),
                          h('div',{className:'hd-sub'}, h(Icon,{name:'users',size:12}), names||'データなし')),
                        h('div',{className:'hitem-r'}, h('span',{className:'hbadge'},e.runs.length+'便'), h(Icon,{name:'chevronR',size:15,className:'harr'})));
                    })));
              }))))
  );
}

/* ================= MAP ================= */
function MapScreen({girls, places, depLocs, location, battery}){
  // mock positioned markers (% coords on stylized canvas)
  const pins=[
    ...places.map((p,i)=>({...p,emoji:'home',cls:'p',x:58,y:38,bg:'var(--accent)'})),
    ...girls.map((g,i)=>({...g,emoji:'user',cls:'g',x:[30,72,44,64][i%4],y:[58,62,30,74][i%4],bg:'var(--accent-press)'})),
    ...depLocs.map((d,i)=>({...d,emoji:'flag',cls:'d',x:[22,80][i%2],y:[40,24][i%2],bg:'var(--drop)'})),
  ];
  const live=[{key:'shun',label:'し',x:52,y:50,bg:'#3a6ea5'},{key:'hee',label:'ひ',x:42,y:60,bg:'var(--accent)'}];
  return h('div',{className:'map-screen fade-in'},
    h('div',{className:'map-canvas'},
      h(MapBackdrop),
      pins.map((p,i)=>h('div',{className:'mk',key:'p'+i,style:{left:p.x+'%',top:p.y+'%'}},
        h('div',{className:'mk-pin',style:{background:p.bg}}, h(Icon,{name:p.emoji,size:14})),
        h('div',{className:'mk-lbl'},p.name))),
      live.map((u,i)=>h('div',{className:'live',key:'l'+i,style:{left:u.x+'%',top:u.y+'%'}},
        h('div',{className:'pulse',style:{background:u.bg}}),
        h('div',{className:'core',style:{background:u.bg}},u.label)))),
    h('div',{className:'map-legend'},
      h('span',{className:'lchip'}, h('span',{className:'ld',style:{background:'var(--accent)'}}),'場所'),
      h('span',{className:'lchip'}, h('span',{className:'ld',style:{background:'var(--accent-press)'}}),'女の子'),
      h('span',{className:'lchip'}, h('span',{className:'ld',style:{background:'var(--drop)'}}),'出発地'),
      h('span',{className:'lchip'}, h('span',{className:'ld',style:{background:'#3a6ea5'}}),'しゅん'),
      h('span',{className:'lchip'}, h('span',{className:'ld',style:{background:'var(--accent)'}}),'ひーちゃん')),
    h('div',{className:'map-bottom'}, h(BatteryCard,{battery})));
}
function MapBackdrop(){
  // abstract refined map: soft fields + roads
  return h('div',{className:'map-bg',style:{
    background:'var(--surface-3)'}},
    h('svg',{width:'100%',height:'100%',viewBox:'0 0 400 800',preserveAspectRatio:'xMidYMid slice',style:{position:'absolute',inset:0,opacity:.9}},
      h('rect',{width:400,height:800,fill:'var(--surface-3)'}),
      // water / park blobs
      h('path',{d:'M-20 120 Q80 80 160 140 T360 120 L420 60 L-20 60 Z',fill:'var(--surface-2)',opacity:.7}),
      h('ellipse',{cx:90,cy:560,rx:120,ry:90,fill:'var(--drop-soft)',opacity:.6}),
      h('ellipse',{cx:330,cy:300,rx:70,ry:60,fill:'var(--accent-soft)',opacity:.5}),
      // roads
      ...[[0,200,400,260],[0,440,400,400],[120,0,180,800],[300,0,260,800]].map((r,i)=>
        h('line',{key:i,x1:r[0],y1:r[1],x2:r[2],y2:r[3],stroke:'var(--surface)',strokeWidth:10,opacity:.9})),
      ...[[0,200,400,260],[0,440,400,400],[120,0,180,800],[300,0,260,800]].map((r,i)=>
        h('line',{key:'c'+i,x1:r[0],y1:r[1],x2:r[2],y2:r[3],stroke:'var(--line)',strokeWidth:11,opacity:.4,strokeDasharray:'1 16'}))
    ));
}

/* ================= DESTINATIONS (master) ================= */
function MasterScreen({girls, places, depLocs, openEdit}){
  const Section=(title,icon,list,render,addLabel,onAdd,btnClass)=>h('div',{className:'card'},
    h('div',{className:'card-head'}, h(Icon,{name:icon}), h('span',{className:'ch-title'},title)),
    h('div',{className:'card-pad'},
      h('div',{className:'mlist'}, list.length?list.map(render):h('div',{className:'empty-note'},'まだ登録なし')),
      h('button',{className:'btn '+(btnClass||'btn-soft'),onClick:onAdd,style:{marginTop:12}}, h(Icon,{name:'plus'}),addLabel)));
  return h('div',{className:'page fade-in'}, h('div',{className:'page-inner'},
    Section('出発地','flag',depLocs,d=>h('div',{className:'mrow',key:d.id},
        h('div',{className:'mav d'}, h(Icon,{name:'flag'})),
        h('div',{className:'mc-info'}, h('div',{className:'mc-name'},d.name), h('div',{className:'mc-sub'},d.addr||'住所なし')),
        h('button',{className:'btn btn-ghost btn-sm',onClick:()=>openEdit('dep',d)},'編集')),'出発地を追加',()=>openEdit('dep',null)),
    Section('女の子','users',girls,g=>h('div',{className:'mrow',key:g.id},
        h('div',{className:'mav g'}, h(Icon,{name:'user'})),
        h('div',{className:'mc-info'}, h('div',{className:'mc-name'},g.name), h('div',{className:'mc-sub'},g.nick+' / '+g.addr)),
        h('button',{className:'btn btn-ghost btn-sm',onClick:()=>openEdit('girl',g)},'編集')),'女の子を追加',()=>openEdit('girl',null)),
    Section('送り先','home',places,p=>h('div',{className:'mrow',key:p.id},
        h('div',{className:'mav p'}, h(Icon,{name:'home'})),
        h('div',{className:'mc-info'}, h('div',{className:'mc-name'},p.name), h('div',{className:'mc-sub'},p.addr)),
        h('button',{className:'btn btn-ghost btn-sm',onClick:()=>openEdit('place',p)},'編集')),'送り先を追加',()=>openEdit('place',null),'btn-ghost')
  ));
}

/* ================= SECRET ================= */
function SecretScreen({secret, setSecret, showToast}){
  const [unlocked,setUnlocked]=uS(false);
  const [pw,setPw]=uS(''); const [err,setErr]=uS(false);
  const [u,setU]=uS(secret.url); const [tx,setTx]=uS(secret.text);
  const autoUnlock=false; // surprise date not yet reached
  uE(()=>{setU(secret.url);setTx(secret.text);},[secret]);

  if(autoUnlock){
    return h('div',{className:'page fade-in'}, h('div',{className:'page-inner'},
      secret.url&&secret.text
        ? h('div',{className:'secret-link-wrap'}, h('a',{className:'secret-link',href:secret.url,target:'_blank'},secret.text))
        : h('div',{className:'secret-meta'},'登録なし')));
  }
  const admin=h('div',{className:'secret-content'},
    h('label',{className:'fl'},'URL'),
    h('input',{className:'inp',type:'url',value:u,onChange:e=>setU(e.target.value),placeholder:'https://...',style:{marginBottom:12}}),
    h('label',{className:'fl'},'表示テキスト'),
    h('input',{className:'inp',type:'text',value:tx,onChange:e=>setTx(e.target.value),placeholder:'サプライズで表示する文言'}),
    h('div',{style:{display:'flex',gap:8,marginTop:14}},
      h('button',{className:'btn btn-primary',style:{flex:1},onClick:()=>{setSecret({url:u.trim(),text:tx.trim()});showToast('保存しました');}}, h(Icon,{name:'check'}),'保存'),
      secret.url&&h('button',{className:'btn btn-danger btn-sm',onClick:()=>{setSecret({url:'',text:''});showToast('削除しました');}}, h(Icon,{name:'trash'}))));
  return h('div',{className:'page fade-in'}, h('div',{className:'page-inner'},
    h('div',{style:{textAlign:'center',padding:'14px 0 18px'}},
      h('div',{style:{fontSize:13,color:'var(--tx-2)',fontWeight:700}},'指定の日時を過ぎると自動で公開されます'),
      h('div',{className:'countdown'}, h(Icon,{name:'clock'}),'公開まで あと 12日')),
    h('div',{className:'secret-wrap'}, admin,
      !unlocked && h('div',{className:'secret-overlay'},
        h(Icon,{name:'lock',size:42,className:'lock'}),
        h('div',{className:'pl'},'パスワードを入力'),
        h('input',{className:'inp secret-pw',type:'password',value:pw,style:{textAlign:'center',maxWidth:200,borderColor:err?'#e05a5a':undefined},
          placeholder:err?'違います…もう一度':'••••••',
          onChange:e=>{setPw(e.target.value);setErr(false);},
          onKeyDown:e=>{if(e.key==='Enter'){if(pw==='2101103')setUnlocked(true);else{setErr(true);setPw('');}}}}),
        h('button',{className:'btn btn-primary',style:{maxWidth:200},onClick:()=>{if(pw==='2101103')setUnlocked(true);else{setErr(true);setPw('');}}}, h(Icon,{name:'lock',size:16}),'解除'),
        h('div',{style:{fontSize:11,color:'var(--tx-3)'}},'ヒント: 6桁の数字')))));
}

Object.assign(window,{ScheduleScreen,MapScreen,MasterScreen,SecretScreen,BatteryCard,RunList});
