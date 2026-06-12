/* ============================================================
   SILDE sheets — Sheet shell, Create, Settings, Master edit, Detail
   ============================================================ */
const { useState:zS, useRef:zR, useEffect:zE } = React;

function Sheet({open, title, icon, onClose, closeText, children}){
  return h('div',{className:'sheet-wrap'+(open?' open':'')},
    h('div',{className:'sb',onClick:onClose}),
    h('div',{className:'sheet'},
      h('div',{className:'sheet-grip'}, h('span',{className:'bar'})),
      h('div',{className:'sheet-hd'},
        h('div',{className:'ttl'}, icon&&h(Icon,{name:icon}), title),
        closeText
          ? h('button',{className:'sheet-x text',onClick:onClose},closeText)
          : h('button',{className:'sheet-x',onClick:onClose}, h(Icon,{name:'x'}))),
      h('div',{className:'sheet-body'}, children)));
}

/* ================= CREATE SCHEDULE ================= */
let _uid=0;
function CreateSheet({open, nonce, girls, places, depLocs, onSave, showToast}){
  const store=places[0]||{name:'Venus',addr:''};
  const blankRow=()=>({uid:++_uid,girlId:'',customName:'',shiftTime:'19:00',mins:{}});
  const [date,setDate]=zS(sutil.todayVal());
  const [depMode,setDepMode]=zS('saved');
  const [depSel,setDepSel]=zS('');
  const [manName,setManName]=zS(''),[manAddr,setManAddr]=zS(''),[manTime,setManTime]=zS('18:30');
  const [rows,setRows]=zS([blankRow()]);
  const [calc,setCalc]=zS({});           // {key:true} calculating
  const [built,setBuilt]=zS(null);
  const [outTab,setOutTab]=zS('shun');
  const resultRef=zR(null);

  zE(()=>{ if(open){ setDate(sutil.todayVal());setDepMode('saved');setDepSel('');setManName('');setManAddr('');setManTime('18:30');setRows([blankRow()]);setBuilt(null);setCalc({}); } },[nonce]);

  const depName=()=> depMode==='manual' ? (manName||'出発地') : (depLocs.find(d=>d.id==depSel)?.name||'出発地');
  const depAddr=()=> depMode==='manual' ? manAddr.trim() : (depLocs.find(d=>d.id==depSel)?.addr||'').trim();
  const girlName=(r)=> r.girlId==='_c' ? (r.customName||'???') : (girls.find(g=>g.id==r.girlId)?.name||'???');
  const girlAddr=(r)=> { const g=girls.find(x=>x.id==r.girlId); return g?String(g.addr||'').trim():''; };

  const groups=()=>{const m={};rows.forEach(r=>{(m[r.shiftTime||'_n']=m[r.shiftTime||'_n']||[]).push(r);});return m;};
  const buildSegments=(group,isFirst,startLabel,startAddr)=>{
    const segs=[]; const sa=String(store.addr||'').trim();
    segs.push({key:'start_to_0',from:startLabel,to:girlName(group[0]),fromAddr:startAddr||'',toAddr:girlAddr(group[0])});
    for(let i=0;i<group.length-1;i++) segs.push({key:`${i}_to_${i+1}`,from:girlName(group[i]),to:girlName(group[i+1]),fromAddr:girlAddr(group[i]),toAddr:girlAddr(group[i+1])});
    segs.push({key:`${group.length-1}_to_store`,from:girlName(group[group.length-1]),to:store.name,fromAddr:girlAddr(group[group.length-1]),toAddr:sa});
    return segs;
  };
  const autoDep=()=>{
    const g=groups();const times=Object.keys(g).filter(k=>k!=='_n').sort();
    if(!times.length)return null;
    const fg=g[times[0]];const segs=buildSegments(fg,true,depName());const ref=fg[0];
    for(const s of segs){if(!ref.mins[s.key])return null;}
    let cur=sutil.subMin(times[0],10);
    [...segs].reverse().forEach(s=>{cur=sutil.subMin(cur,sutil.ceil5(ref.mins[s.key]));});
    return sutil.round5(cur);
  };

  const setMin=(refUid,key,val)=>setRows(rs=>rs.map(r=>r.uid===refUid?{...r,mins:{...r.mins,[key]:val}}:r));
  const stepShift=(uid,delta)=>setRows(rs=>rs.map(r=>{
    if(r.uid!==uid)return r;
    let [hh,mm]=(r.shiftTime||'19:00').split(':').map(Number);let t=hh*60+mm+delta*30;t=((t%1440)+1440)%1440;t=Math.round(t/30)*30;
    return {...r,shiftTime:`${sutil.p2(Math.floor(t/60))}:${sutil.p2(t%60)}`};
  }));
  const autoCalc=(refUid,key,from,to)=>{
    setCalc(c=>({...c,[refUid+key]:true}));
    setTimeout(()=>{
      let hsh=0;const s=from+'>'+to;for(let i=0;i<s.length;i++)hsh=(hsh*31+s.charCodeAt(i))%1000;
      const v=sutil.ceil5(10+hsh%18); // 10-28
      setMin(refUid,key,String(v));
      setCalc(c=>{const n={...c};delete n[refUid+key];return n;});
      showToast(`${from} → ${to}\n${v}分`);
    },650);
  };

  const generate=()=>{
    const g=groups();const times=Object.keys(g).filter(k=>k!=='_n').sort();
    if(!times.length)return showToast('出勤時間を入れてね');
    for(const t of times){const grp=g[t];
      if(grp.some(r=>!r.girlId&&!r.customName))return showToast('名前が未入力の子がいるよ');
      const segs=buildSegments(grp,times.indexOf(t)===0,depName());const ref=grp[0];
      for(const s of segs)if(!ref.mins[s.key])return showToast(`移動時間が未入力:\n${s.from} → ${s.to}`);
    }
    const runs=[];
    times.forEach((st,gi)=>{
      const grp=g[st];const isFirst=gi===0;const startLabel=isFirst?depName():store.name;const ref=grp[0];
      const arr=sutil.subMin(st,10);const T=new Array(grp.length+2);T[grp.length+1]=arr;
      for(let i=grp.length-1;i>=0;i--){const key=i===grp.length-1?`${i}_to_store`:`${i}_to_${i+1}`;T[i+1]=sutil.round5(sutil.subMin(T[i+2],sutil.ceil5(ref.mins[key])));}
      T[0]=sutil.round5(sutil.subMin(T[1],sutil.ceil5(ref.mins['start_to_0'])));
      const dep=(isFirst&&depMode==='manual')?(manTime||T[0]):T[0];
      const stops=[];grp.forEach((r,i)=>{const mk=i===0?'start_to_0':`${i-1}_to_${i}`;stops.push({time:T[i+1],name:girlName(r),type:'pick',min:ref.mins[mk]});});
      stops.push({time:arr,name:store.name,type:'drop',min:ref.mins[`${grp.length-1}_to_store`]});
      runs.push({departTime:dep,departLabel:`${dep} ${startLabel}出発`,stops});
    });
    const entry={id:Date.now(),dateVal:date,dateLabel:sutil.fmtDL(date),runs};
    rebuildTexts(entry);
    setBuilt(entry);
    setTimeout(()=>resultRef.current&&resultRef.current.scrollIntoView({behavior:'smooth',block:'start'}),60);
  };

  const ad=autoDep();
  const g=groups();const times=Object.keys(g).filter(k=>k!=='_n').sort();

  return [
    // DATE
    h('div',{className:'card',key:'date'},
      h('div',{className:'card-head'}, h(Icon,{name:'calendar'}), h('span',{className:'ch-title'},'日付')),
      h('div',{className:'card-pad',style:{display:'flex',gap:8,alignItems:'center'}},
        h('input',{className:'inp',type:'date',value:date,onChange:e=>setDate(e.target.value),style:{flex:1}}),
        h('button',{className:'btn btn-ghost btn-sm',onClick:()=>setDate(sutil.todayVal())},'今日'),
        h('button',{className:'btn btn-ghost btn-sm',onClick:()=>{const x=new Date();x.setDate(x.getDate()+1);setDate(sutil.fmtDV(x));}},'明日'))),
    // DEPARTURE
    h('div',{className:'card',key:'dep'},
      h('div',{className:'card-head'}, h(Icon,{name:'flag'}), h('span',{className:'ch-title'},'出発地')),
      h('div',{className:'card-pad'},
        h('div',{className:'seg',style:{marginBottom:13}},
          h('button',{className:depMode==='saved'?'sel':'',onClick:()=>setDepMode('saved')}, h(Icon,{name:'pin'}),'登録済み'),
          h('button',{className:depMode==='manual'?'sel':'',onClick:()=>setDepMode('manual')}, h(Icon,{name:'pencil'}),'直接入力')),
        depMode==='saved'
          ? h('div',null, h('label',{className:'fl'},'出発地を選ぶ'),
              h('select',{className:'inp',value:depSel,onChange:e=>setDepSel(e.target.value)},
                h('option',{value:''},'— 選択 —'), depLocs.map(d=>h('option',{key:d.id,value:d.id},d.name+(d.addr?` (${d.addr})`:'')))))
          : h('div',null,
              h('div',{className:'field'}, h('label',{className:'fl'},'出発地名'), h('input',{className:'inp',value:manName,onChange:e=>setManName(e.target.value),placeholder:'○○カフェ、友達の家など'})),
              h('div',{className:'field'}, h('label',{className:'fl'},'住所（任意）'), h('input',{className:'inp',value:manAddr,onChange:e=>setManAddr(e.target.value),placeholder:'大阪市北区梅田1-1-1'})),
              h('div',{className:'field'}, h('label',{className:'fl'},'出発時刻（手動）'), h('input',{className:'inp',type:'time',value:manTime,onChange:e=>setManTime(e.target.value)}))),
        depMode==='saved' && h('div',{className:'auto-dep'},
          h('div',null,
            h('div',{className:'lbl'}, h(Icon,{name:'sparkle'}),'逆算した出発時刻'),
            h('div',{className:'big',style:{color:ad?'var(--tx)':'var(--tx-3)'}}, ad||'--:--'),
            h('div',{className:'note'},'移動時間を入れると自動更新')),
          h(Icon,{name:'car',size:38,className:'glyph'})))),
    // GIRLS
    h('div',{className:'card',key:'girls'},
      h('div',{className:'card-head'}, h(Icon,{name:'users'}), h('span',{className:'ch-title'},'女の子の出勤情報')),
      h('div',{className:'card-pad'},
        rows.map((r,i)=>{
          const g0=girls.find(x=>x.id==r.girlId);
          return h('div',{className:'grow',key:r.uid},
            h('div',{className:'grow-hd'},
              h('span',{className:'grow-badge'}, h(Icon,{name:'user'}),(i+1)+'人目'),
              rows.length>1 && h('button',{className:'grow-rm',onClick:()=>setRows(rs=>rs.filter(x=>x.uid!==r.uid))}, h(Icon,{name:'x'}))),
            h('label',{className:'fl'},'女の子'),
            h('select',{className:'inp',value:r.girlId,onChange:e=>setRows(rs=>rs.map(x=>x.uid===r.uid?{...x,girlId:e.target.value,customName:''}:x)),style:{marginBottom:9}},
              h('option',{value:''},'— 選択 —'), girls.map(g=>h('option',{key:g.id,value:g.id},g.name)), h('option',{value:'_c'},'直接入力')),
            r.girlId==='_c'
              ? h('input',{className:'inp',placeholder:'名前',value:r.customName,onChange:e=>setRows(rs=>rs.map(x=>x.uid===r.uid?{...x,customName:e.target.value}:x)),style:{marginBottom:9}})
              : g0&&h('div',{className:'addr-tag'}, h(Icon,{name:'pin'}), g0.nick),
            h('label',{className:'fl'},'出勤時間'),
            h('div',{className:'stepper'},
              h('button',{onClick:()=>stepShift(r.uid,-1)}, h(Icon,{name:'minus'})),
              h('div',{className:'val'}, r.shiftTime),
              h('button',{onClick:()=>stepShift(r.uid,1)}, h(Icon,{name:'plus'}))),
            h('div',{className:'stepper-hint'},'30分単位で調整'));
        }),
        h('button',{className:'btn btn-soft',onClick:()=>setRows(rs=>[...rs,blankRow()])}, h(Icon,{name:'plus'}),'女の子を追加'),
        // segment minutes
        times.length>0 && h('div',{style:{marginTop:16}},
          h('div',{style:{fontSize:14,fontWeight:700,color:'var(--accent-ink)',marginBottom:10,display:'flex',alignItems:'center',gap:7}}, h(Icon,{name:'navigate',size:16}),'区間ごとの移動時間'),
          times.map((st,gi)=>{
            const grp=g[st];const segs=buildSegments(grp,gi===0,gi===0?depName():store.name);const ref=grp[0];
            return h('div',{className:'seg-group',key:st},
              h('div',{className:'gh'}, h(Icon,{name:'clock'}),`${st} 出勤グループ（${grp.length}人）`),
              segs.map(s=>h('div',{key:s.key},
                h('div',{className:'seg-line'}, h(Icon,{name:'pin'}), s.from+' → '+s.to),
                h('div',{className:'minrow'},
                  h('input',{className:'inp',type:'number',min:1,max:90,placeholder:'分',value:ref.mins[s.key]||'',onChange:e=>setMin(ref.uid,s.key,e.target.value)}),
                  h('span',{className:'u'},'分'),
                  h('button',{className:'bmap'+(calc[ref.uid+s.key]?' calc':''),onClick:()=>autoCalc(ref.uid,s.key,s.from,s.to)},
                    h(Icon,{name:'navigate',size:13}), calc[ref.uid+s.key]?'計算中':'自動')))));
          }))
      )),
    h('button',{className:'btn btn-grad',key:'gen',onClick:generate}, h(Icon,{name:'sparkle'}),'スケジュール生成'),
    // RESULT
    built && h('div',{key:'res',ref:resultRef,style:{marginTop:6}},
      h('div',{className:'card'},
        h('div',{className:'card-head'}, h(Icon,{name:'calendar'}), h('span',{className:'ch-title'},'スケジュール'),
          h('span',{className:'ch-right'}, h('span',{className:'hbadge',style:{fontSize:11,fontWeight:700,color:'var(--accent-ink)',background:'var(--accent-soft)',padding:'4px 10px',borderRadius:999}},built.dateLabel))),
        h(RunList,{entry:built,showNow:false})),
      h('div',{className:'card'},
        h('div',{className:'card-head'}, h(Icon,{name:'copy'}), h('span',{className:'ch-title'},'コピー用テキスト')),
        h('div',{className:'card-pad'},
          h('div',{className:'seg',style:{marginBottom:12}},
            h('button',{className:outTab==='shun'?'sel':'',onClick:()=>setOutTab('shun')}, h(Icon,{name:'moon'}),'しゅんくん用'),
            h('button',{className:outTab==='boy'?'sel':'',onClick:()=>setOutTab('boy')}, h(Icon,{name:'share'}),'ボーイさん用')),
          h('div',{className:'obox '+outTab}, outTab==='shun'?built.shunTxt:built.boyTxt),
          h('button',{className:'btn btn-primary',style:{marginTop:12},onClick:()=>window.__silde.copy(outTab==='shun'?built.shunTxt:built.boyTxt)}, h(Icon,{name:'copy'}),(outTab==='shun'?'しゅんくん用':'ボーイさん用')+'をコピー'))),
      h('button',{className:'btn btn-grad',onClick:()=>onSave(built)}, h(Icon,{name:'check'}),'このスケジュールを保存'))
  ];
}

/* ================= MASTER EDIT ================= */
function MasterEditSheet({open, edit, onSave, onDelete}){
  // edit = {type:'dep'|'girl'|'place', item|null}
  const [f,setF]=zS({});
  zE(()=>{ if(open) setF(edit?.item?{...edit.item}:{}); },[open,edit]);
  if(!edit) return h(Sheet,{open:false,onClose:()=>{}});
  const t=edit.type;
  const titles={dep:'出発地',girl:'女の子',place:'送り先'};
  const upd=(k,v)=>setF(o=>({...o,[k]:v}));
  return null; // rendered inline by App via fields below
}

/* fields renderer used by App's sheet */
function masterFields(t,f,upd){
  if(t==='dep') return [
    h('div',{className:'field',key:1}, h('label',{className:'fl'},'場所名'), h('input',{className:'inp',value:f.name||'',onChange:e=>upd('name',e.target.value),placeholder:'職場・家など'})),
    h('div',{className:'field',key:2}, h('label',{className:'fl'},'住所（任意）'), h('input',{className:'inp',value:f.addr||'',onChange:e=>upd('addr',e.target.value),placeholder:'大阪市〇〇区…'}))];
  if(t==='girl') return [
    h('div',{className:'field',key:1}, h('label',{className:'fl'},'名前'), h('input',{className:'inp',value:f.name||'',onChange:e=>upd('name',e.target.value),placeholder:'さな'})),
    h('div',{className:'field',key:2}, h('label',{className:'fl'},'迎え場所（通称）'), h('input',{className:'inp',value:f.nick||'',onChange:e=>upd('nick',e.target.value),placeholder:'さなマンション前'})),
    h('div',{className:'field',key:3}, h('label',{className:'fl'},'住所'), h('input',{className:'inp',value:f.addr||'',onChange:e=>upd('addr',e.target.value),placeholder:'大阪市北区〇〇 1-2-3'}))];
  return [
    h('div',{className:'field',key:1}, h('label',{className:'fl'},'場所名'), h('input',{className:'inp',value:f.name||'',onChange:e=>upd('name',e.target.value),placeholder:'Venus'})),
    h('div',{className:'field',key:2}, h('label',{className:'fl'},'住所'), h('input',{className:'inp',value:f.addr||'',onChange:e=>upd('addr',e.target.value),placeholder:'大阪市中央区〇〇'}))];
}

Object.assign(window,{Sheet,CreateSheet,masterFields});
