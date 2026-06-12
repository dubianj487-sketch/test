/* ============================================================
   SILDE — App shell (GAS integrated)
   ============================================================ */
const { useState:aS, useEffect:aE, useRef:aR } = React;

function clone(x){return JSON.parse(JSON.stringify(x));}
const LS={ get:(k,d)=>localStorage.getItem(k)||d, set:(k,v)=>localStorage.setItem(k,v) };

function App(){
  const [tab,setTab]=aS('hist');
  const [theme,setTheme]=aS(LS.get('silde_theme','cute'));
  const [mode,setMode]=aS(LS.get('silde_mode','light'));
  const [font,setFont]=aS(LS.get('silde_font','maru'));
  const [loading,setLoading]=aS(true);

  const [girls,setGirls]=aS([]);
  const [places,setPlaces]=aS([]);
  const [depLocs,setDepLocs]=aS([]);
  const [history,setHistory]=aS([]);
  const [memo,setMemo]=aS('');
  const [secret,setSecret]=aS({url:'',text:''});
  const [battery,setBattery]=aS({});
  const [location,setLocation]=aS({});

  const [toast,setToast]=aS('');
  const [debugTime,setDebugTime]=aS('');
  const [histPage,setHistPage]=aS(0);
  const [memoOpen,setMemoOpen]=aS(false);

  const [sched,setSched]=aS({open:false,nonce:0});
  const [settingsOpen,setSettingsOpen]=aS(false);
  const [masterEdit,setMasterEdit]=aS({open:false,type:'dep',item:null});
  const [mf,setMf]=aS({});
  const [detail,setDetail]=aS({open:false,id:null});
  const [overwrite,setOverwrite]=aS({open:false,entry:null});

  const toastT=aR(null);
  const memoDebT=aR(null);
  const showToast=(m)=>{setToast(m);if(toastT.current)clearTimeout(toastT.current);toastT.current=setTimeout(()=>setToast(''),2300);};
  const copy=(t)=>{try{navigator.clipboard&&navigator.clipboard.writeText(t);}catch(e){}showToast('コピーしました');};
  const share=(t)=>{ if(navigator.share){navigator.share({text:t}).catch(()=>{});} else copy(t); };
  aE(()=>{window.__silde={copy,share,showToast};},[]);

  // Initial load from GAS
  aE(()=>{
    gasGet('all').then(data=>{
      if(data.girls) setGirls(data.girls);
      if(data.places) setPlaces(data.places);
      if(data.depLocs) setDepLocs(data.depLocs);
      if(data.history) setHistory(data.history.map(e=>{rebuildTexts(e);return e;}));
      if(data.memo!=null) setMemo(data.memo);
      if(data.secret) setSecret(data.secret);
      if(data.battery) setBattery(data.battery);
      if(data.location) setLocation(data.location);
    }).catch(e=>console.warn('GAS load failed:',e))
    .finally(()=>setLoading(false));
  },[]);

  // Poll every 10s for live data
  aE(()=>{
    const id=setInterval(()=>{
      if(document.hidden)return;
      gasGet('all').then(data=>{
        if(data.battery) setBattery(data.battery);
        if(data.location) setLocation(data.location);
        if(data.history) setHistory(data.history.map(e=>{rebuildTexts(e);return e;}));
      }).catch(()=>{});
    },10000);
    return ()=>clearInterval(id);
  },[]);

  // Theme / dark-mode application
  const prefersDark = typeof window!=='undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = mode==='dark' || (mode==='auto' && prefersDark);
  aE(()=>{
    LS.set('silde_theme',theme);LS.set('silde_mode',mode);LS.set('silde_font',font);
    const m=document.getElementById('theme-color-meta');
    if(m){
      const isDark=mode==='dark'||(mode==='auto'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches);
      m.content=theme==='cool'?(isDark?'#0e1320':'#eef2f7'):(isDark?'#181318':'#c06d96');
    }
  },[theme,mode,font]);

  const openMaster=(type,item)=>{ setMf(item?clone(item):{}); setMasterEdit({open:true,type,item}); };
  const saveMaster=()=>{
    const {type,item}=masterEdit; const f=mf;
    if(!String(f.name||'').trim())return showToast('名前を入れてね');
    const currentList={dep:depLocs,girl:girls,place:places}[type];
    const setter={dep:setDepLocs,girl:setGirls,place:setPlaces}[type];
    const actionMap={dep:'saveDepLocs',girl:'saveGirls',place:'savePlaces'};
    const keyMap={dep:'depLocs',girl:'girls',place:'places'};
    let next;
    if(item) next=currentList.map(x=>x.id===item.id?{...x,...f}:x);
    else { const id=Math.max(0,...currentList.map(x=>x.id))+1; next=[...currentList,{...f,id}]; }
    setter(next);
    gasPost({action:actionMap[type],[keyMap[type]]:next});
    setMasterEdit({open:false,type,item:null}); showToast('保存しました');
  };
  const delMaster=()=>{
    const {type,item}=masterEdit; if(!item)return;
    const currentList={dep:depLocs,girl:girls,place:places}[type];
    const setter={dep:setDepLocs,girl:setGirls,place:setPlaces}[type];
    const actionMap={dep:'saveDepLocs',girl:'saveGirls',place:'savePlaces'};
    const keyMap={dep:'depLocs',girl:'girls',place:'places'};
    const next=currentList.filter(x=>x.id!==item.id);
    setter(next);
    gasPost({action:actionMap[type],[keyMap[type]]:next});
    setMasterEdit({open:false,type,item:null}); showToast('削除しました');
  };

  const onSaveSchedule=(entry)=>{
    const exists=history.find(x=>x.dateVal===entry.dateVal);
    if(exists){ setOverwrite({open:true,entry}); return; }
    setHistory(hh=>[entry,...hh]);
    gasPost({action:'saveSchedule',payload:entry});
    setSched({open:false,nonce:sched.nonce}); setTab('hist'); showToast('保存しました '+entry.dateLabel);
  };
  const doOverwrite=()=>{
    const entry=overwrite.entry;
    setHistory(hh=>hh.map(x=>x.dateVal===entry.dateVal?{...entry,id:x.id}:x));
    gasPost({action:'saveSchedule',payload:entry});
    setOverwrite({open:false,entry:null}); setSched({open:false,nonce:sched.nonce}); setTab('hist'); showToast('上書きしました '+entry.dateLabel);
  };
  const editTime=(id,ri,si,v)=>setHistory(hh=>hh.map(e=>{
    if(e.id!==id)return e; const ne=clone(e); ne.runs[ri].stops[si].time=v; rebuildTexts(ne);
    gasPost({action:'updateSchedule',payload:ne});
    return ne;
  }));
  const delHist=(id)=>{
    setHistory(hh=>hh.filter(x=>x.id!==id));
    gasPost({action:'deleteSchedule',id});
    setDetail({open:false,id:null}); showToast('削除しました');
  };

  const onMemoChange=(val)=>{
    setMemo(val);
    if(memoDebT.current)clearTimeout(memoDebT.current);
    memoDebT.current=setTimeout(()=>gasPost({action:'saveMemo',memo:val}),1500);
  };

  const saveSecretGAS=(s)=>{
    setSecret(s);
    gasPost({action:'saveSecret',payload:s});
  };

  const detailEntry=detail.id!=null?history.find(x=>x.id===detail.id):null;

  const tabMeta={hist:{t:'スケジュール',s:'今日の送迎タイムライン'},map:{},master:{t:'行き先',s:'出発地・女の子・送り先のマスター'},secret:{t:'シークレット',s:'隠しページ'}};

  const memoStyle={transform:memoOpen?'translateY(0)':'translateY(calc(100% - 86px))'};

  if(loading) return h('div',{className:'phone '+(theme==='cute'?'theme-cute':'theme-cool')+(dark?' dark':''),
    style:{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}},
    h('div',{style:{textAlign:'center',color:'var(--accent)'}},
      h('div',{style:{width:36,height:36,border:'3px solid var(--line-2)',borderTopColor:'var(--accent)',
        borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}),
      h('div',{style:{fontSize:13,fontWeight:600}},'読み込み中...')));

  return h('div',{className:'phone '+(theme==='cute'?'theme-cute':'theme-cool')+(dark?' dark':'')+(font==='system'?' font-system':'')},
    tab!=='map' && h('div',{className:'topbar'},
      h('h1',{translate:'no'}, h('span',{className:'brand-dot'}), h('span',{className:'wordmark',translate:'no'},'SILDE')),
      h('div',{style:{textAlign:'right'}},
        h('div',{style:{fontSize:13,fontWeight:700}},tabMeta[tab].t),
        h('div',{className:'sub'},tabMeta[tab].s))),

    tab==='hist' && h(ScheduleScreen,{history,battery,debugTime,setDebugTime,histPage,setHistPage,
      openHistDetail:(id)=>setDetail({open:true,id}),
      onEditTodayTime:editTime}),
    tab==='map' && h(MapScreen,{girls,places,depLocs,location,battery}),
    tab==='master' && h(MasterScreen,{girls,places,depLocs,openEdit:openMaster}),
    tab==='secret' && h(SecretScreen,{secret,setSecret:saveSecretGAS,showToast}),

    tab==='hist' && h('div',{className:'memo',style:memoStyle},
      h('div',{className:'memo-handle',onClick:()=>setMemoOpen(o=>!o)}, h('span',{className:'bar'})),
      h('div',{className:'memo-hd'}, h(Icon,{name:'edit'}),'共有メモ'),
      h('textarea',{value:memo,onChange:e=>onMemoChange(e.target.value),placeholder:'ここに共有メモを入力...',onFocus:()=>setMemoOpen(true)})),

    tab==='hist' && h('button',{className:'fab',onClick:()=>{setSettingsOpen(false);setSched(s=>({open:true,nonce:s.nonce+1}));}},
      h(Paw,{size:18,style:{position:'absolute',top:8,color:'rgba(255,255,255,.6)'}}),
      h(Icon,{name:'plus',size:26,strokeWidth:2.4,style:{marginTop:4}})),

    h('div',{className:'bnav'},
      [['hist','calendar','スケジュール'],['map','navigate','マップ'],['master','pin','行き先'],['secret','lock','シークレット']].map(([k,ic,lb])=>
        h('button',{key:k,className:'nb'+(tab===k?' active':''),onClick:()=>{setTab(k);setSettingsOpen(false);}},
          h('span',{className:'nb-ico'}, h(Icon,{name:ic,size:22})), lb)),
      h('button',{className:'nb'+(settingsOpen?' active':''),onClick:()=>{setSettingsOpen(true);setSched(s=>({...s,open:false}));}},
        h('span',{className:'nb-ico'}, h(Icon,{name:'settings',size:22})),'設定')),

    h('div',{className:'sheet-wrap'+(sched.open?' open':'')},
      h('div',{className:'sb',onClick:()=>setSched(s=>({...s,open:false}))}),
      h('div',{className:'sheet'},
        h('div',{className:'sheet-grip'}, h('span',{className:'bar'})),
        h('div',{className:'sheet-hd'},
          h('div',{className:'ttl'}, h(Icon,{name:'car'}),'スケジュール作成'),
          h('button',{className:'sheet-x text',onClick:()=>setSched(s=>({...s,open:false}))},'キャンセル')),
        h('div',{className:'sheet-body'},
          h(CreateSheet,{open:sched.open,nonce:sched.nonce,girls,places,depLocs,onSave:onSaveSchedule,showToast})))),

    h(Sheet,{open:settingsOpen,title:'設定',icon:'settings',onClose:()=>setSettingsOpen(false)},
      h(SettingsBody,{theme,setTheme,mode,setMode,font,setFont,showToast})),

    h(Sheet,{open:masterEdit.open,
      title:(masterEdit.item?'編集':'登録')+' · '+({dep:'出発地',girl:'女の子',place:'送り先'}[masterEdit.type]),
      icon:({dep:'flag',girl:'user',place:'home'}[masterEdit.type]),
      onClose:()=>setMasterEdit(m=>({...m,open:false}))},
      masterFields(masterEdit.type,mf,(k,v)=>setMf(o=>({...o,[k]:v}))),
      h('button',{className:'btn btn-primary',onClick:saveMaster}, h(Icon,{name:'check'}),'保存'),
      masterEdit.item && h('button',{className:'btn btn-danger',onClick:delMaster}, h(Icon,{name:'trash'}),'削除')),

    h(Sheet,{open:detail.open,title:detailEntry?sutil.fmtDLFull(detailEntry.dateVal):'詳細',icon:'calendar',onClose:()=>setDetail({open:false,id:null})},
      detailEntry && [
        h(RunList,{key:'r',entry:detailEntry,showNow:false,editable:true,onEditTime:(ri,si,v)=>editTime(detailEntry.id,ri,si,v)}),
        h('div',{className:'action-bar',key:'a',style:{marginTop:14,borderTop:'1px solid var(--line-2)'}},
          h('button',{className:'act',onClick:()=>copy(detailEntry.shunTxt)}, h(Icon,{name:'moon'}),'しゅん用'),
          h('button',{className:'act',onClick:()=>copy(detailEntry.boyTxt)}, h(Icon,{name:'copy'}),'ボーイ用'),
          h('button',{className:'act',onClick:()=>share(detailEntry.boyTxt)}, h(Icon,{name:'share'}),'共有'),
          h('button',{className:'act danger',onClick:()=>delHist(detailEntry.id)}, h(Icon,{name:'trash'}),'削除'))]),

    h(Sheet,{open:overwrite.open,title:'上書き確認',icon:'calendar',onClose:()=>setOverwrite({open:false,entry:null})},
      h('p',{style:{fontSize:14,lineHeight:1.7,color:'var(--tx)',marginBottom:18}},
        (overwrite.entry?overwrite.entry.dateLabel:'')+' のスケジュールはすでに保存されています。上書きしますか？'),
      h('button',{className:'btn btn-primary',onClick:doOverwrite}, h(Icon,{name:'check'}),'上書きして保存'),
      h('button',{className:'btn btn-ghost',onClick:()=>setOverwrite({open:false,entry:null})},'キャンセル')),

    h('div',{className:'toast'+(toast?' show':'')},toast)
  );
}

function SettingsBody({theme,setTheme,mode,setMode,font,setFont,showToast}){
  const pill=(sel,onClick,children)=>h('button',{className:'sett-pill'+(sel?' sel':''),onClick},children);
  return [
    h('div',{className:'sett-sec',key:'t'},
      h('div',{className:'sett-lbl'},'テーマ'),
      h('div',{className:'sett-row'},
        pill(theme==='cute',()=>setTheme('cute'), [h('span',{className:'sw-swatch',key:1,style:{background:'#c06d96'}}),'かわいい']),
        pill(theme==='cool',()=>setTheme('cool'), [h('span',{className:'sw-swatch',key:1,style:{background:'#3a6ea5'}}),'かっこいい']))),
    h('div',{className:'sett-sec',key:'c'},
      h('div',{className:'sett-lbl'},'カラーモード'),
      h('div',{className:'sett-row'},
        pill(mode==='light',()=>setMode('light'), [h(Icon,{name:'sun',size:15,key:1}),'ライト']),
        pill(mode==='dark',()=>setMode('dark'), [h(Icon,{name:'moon',size:15,key:1}),'ダーク']),
        pill(mode==='auto',()=>setMode('auto'), [h(Icon,{name:'phone',size:15,key:1}),'自動']))),
    h('div',{className:'sett-sec',key:'f'},
      h('div',{className:'sett-lbl'},'フォント'),
      h('div',{className:'sett-row'},
        pill(font==='maru',()=>setFont('maru'),'あ まるゴシック'),
        pill(font==='system',()=>setFont('system'),'A システム'))),
    h('div',{className:'sett-sec',key:'o'},
      h('div',{className:'sett-lbl'},'位置共有 URL',h('span',{className:'note'},'· タップでコピー')),
      h('div',{className:'ovrow',onClick:()=>{window.__silde.copy(GAS_URL+'?user=shun');}},
        h('span',{className:'nm'}, h('span',{className:'udot',style:{background:'var(--drop)'}}),'しゅん'),
        h('span',{className:'u'},GAS_URL+'?user=shun'), h('span',{className:'cp'},h(Icon,{name:'copy'}))),
      h('div',{className:'ovrow',onClick:()=>{window.__silde.copy(GAS_URL+'?user=hee');}},
        h('span',{className:'nm'}, h('span',{className:'udot',style:{background:'var(--accent)'}}),'ひーちゃん'),
        h('span',{className:'u'},GAS_URL+'?user=hee'), h('span',{className:'cp'},h(Icon,{name:'copy'}))))
  ];
}

ReactDOM.createRoot(document.getElementById('app')).render(h(App));
