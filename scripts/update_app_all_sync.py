import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update ge, Ee, K, X, Y, be, we, De, handleMultiImport
target_section_regex = r'ge=de=>\{[\s\S]*?handleMultiImport=\{[\s\S]*?ae\(\);\s*\}'

# Let's find the exact block around ge=de=>
idx_ge = code.find('ge=de=>{')
idx_multi = code.find('handleMultiImport=({databaseItems', idx_ge)
idx_end = code.find('ae();', idx_multi) + 5

old_block = code[idx_ge:idx_end]

new_block = '''ge=de=>{
    const targetTab = (de.category === "CANCEL" ? "cancel" : de.category === "CENTRALIZED" ? "centralized" : de.category === "EACH SECTION" ? "each_section" : de.category === "NORMAL STANDARD" ? "normal_standard" : e);
    if(targetTab==="cancel"||(de.category||"").trim().toUpperCase()==="CANCEL"){
      setCancelInstruments(Re=>Re.map(U=>U.id===de.id?de:U));
    }else if(targetTab==="centralized"||(de.category||"").trim().toUpperCase()==="CENTRALIZED"){
      setCentInstruments(Re=>Re.map(U=>U.id===de.id?de:U));
    }else if(targetTab==="each_section"||(de.category||"").trim().toUpperCase()==="EACH SECTION"){
      setEachInstruments(Re=>Re.map(U=>U.id===de.id?de:U));
    }else if(targetTab==="normal_standard"||(de.category||"").trim().toUpperCase()==="NORMAL STANDARD"){
      setNsInstruments(Re=>Re.map(U=>U.id===de.id?de:U));
    }else{
      f(Re=>Re.map(U=>U.id===de.id?de:U));
    }
    B(de);
    ae();
    try{
      if(window.qapSupabase&&window.qapSupabase.isConfigured()){
        window.qapSupabase.upsertInstrument(de, targetTab);
      }
    }catch(err){}
  },
  Ee=de=>{
    const targetTab = (de.category === "CANCEL" ? "cancel" : de.category === "CENTRALIZED" ? "centralized" : de.category === "EACH SECTION" ? "each_section" : de.category === "NORMAL STANDARD" ? "normal_standard" : e);
    if(targetTab==="cancel"||(de.category||"").trim().toUpperCase()==="CANCEL"){
      setCancelInstruments(Re=>Re.some(te=>te.id===de.id)?Re.map(te=>te.id===de.id?de:te):[{...de,category:"CANCEL",status:de.status||"inactive"},...Re]);
    }else if(targetTab==="centralized"||(de.category||"").trim().toUpperCase()==="CENTRALIZED"){
      setCentInstruments(Re=>Re.some(te=>te.id===de.id)?Re.map(te=>te.id===de.id?de:te):[{...de,category:"CENTRALIZED"},...Re]);
    }else if(targetTab==="each_section"||(de.category||"").trim().toUpperCase()==="EACH SECTION"){
      setEachInstruments(Re=>Re.some(te=>te.id===de.id)?Re.map(te=>te.id===de.id?de:te):[{...de,category:"EACH SECTION"},...Re]);
    }else if(targetTab==="normal_standard"||(de.category||"").trim().toUpperCase()==="NORMAL STANDARD"){
      setNsInstruments(Re=>Re.some(te=>te.id===de.id)?Re.map(te=>te.id===de.id?de:te):[{...de,category:"NORMAL STANDARD"},...Re]);
    }else{
      f(Re=>Re.some(te=>te.id===de.id)?Re.map(te=>te.id===de.id?de:te):[de,...Re]);
    }
    ae();
    try{
      if(window.qapSupabase&&window.qapSupabase.isConfigured()){
        window.qapSupabase.upsertInstrument(de, targetTab);
      }
    }catch(err){}
  },
  F=de=>{
    const currentList=e==="centralized"?centInstruments:e==="each_section"?eachInstruments:e==="normal_standard"?nsInstruments:e==="cancel"?cancelInstruments:c;
    const Re=currentList.find(U=>U.id===de)||c.find(U=>U.id===de)||nsInstruments.find(U=>U.id===de)||centInstruments.find(U=>U.id===de)||eachInstruments.find(U=>U.id===de)||cancelInstruments.find(U=>U.id===de);
    Re&&u(Re);
  },
  K=()=>{
    if(!o)return;
    const de=o.id;
    const targetTab = (o.category === "CANCEL" ? "cancel" : o.category === "CENTRALIZED" ? "centralized" : o.category === "EACH SECTION" ? "each_section" : o.category === "NORMAL STANDARD" ? "normal_standard" : e);
    if(targetTab==="cancel"||(o.category||"").trim().toUpperCase()==="CANCEL"){
      setCancelInstruments(Re=>Re.filter(te=>te.id!==de).map((te,me)=>({...te,no:me+1})));
    }else if(targetTab==="centralized"||(o.category||"").trim().toUpperCase()==="CENTRALIZED"){
      setCentInstruments(Re=>Re.filter(te=>te.id!==de).map((te,me)=>({...te,no:me+1})));
    }else if(targetTab==="each_section"||(o.category||"").trim().toUpperCase()==="EACH SECTION"){
      setEachInstruments(Re=>Re.filter(te=>te.id!==de).map((te,me)=>({...te,no:me+1})));
    }else if(targetTab==="normal_standard"||(o.category||"").trim().toUpperCase()==="NORMAL STANDARD"){
      setNsInstruments(Re=>Re.filter(te=>te.id!==de).map((te,me)=>({...te,no:me+1})));
    }else{
      f(Re=>Re.filter(te=>te.id!==de).map((te,me)=>({...te,no:me+1})));
    }
    u(null);
    ae();
    try{
      if(window.qapSupabase&&window.qapSupabase.isConfigured()){
        window.qapSupabase.deleteInstrument(de, targetTab);
      }
    }catch(err){}
  },
  X=(de,Re)=>{
    const U=new Set(de);
    if(e==="cancel"){
      setCancelInstruments(te=>te.filter(Ne=>!U.has(Ne.id)).map((Ne,Fe)=>({...Ne,no:Fe+1})));
    }else if(e==="centralized"){
      setCentInstruments(te=>te.filter(Ne=>!U.has(Ne.id)).map((Ne,Fe)=>({...Ne,no:Fe+1})));
    }else if(e==="each_section"){
      setEachInstruments(te=>te.filter(Ne=>!U.has(Ne.id)).map((Ne,Fe)=>({...Ne,no:Fe+1})));
    }else if(e==="normal_standard"){
      setNsInstruments(te=>te.filter(Ne=>!U.has(Ne.id)).map((Ne,Fe)=>({...Ne,no:Fe+1})));
    }else{
      f(te=>te.filter(Ne=>!U.has(Ne.id)).map((Ne,Fe)=>({...Ne,no:Fe+1})));
    }
    ae();
    try{
      if(window.qapSupabase&&window.qapSupabase.isConfigured()){
        window.qapSupabase.deleteInstruments(Array.from(U), e);
      }
    }catch(err){}
  },
  Y=(de,Re,U)=>{
    const te=new Set(de);
    const updater=me=>me.map(Fe=>{
      if(!te.has(Fe.id))return Fe;
      let je;
      return Re==="auto"?je=P0({...Fe,status:void 0}):je=Re,{
        ...Fe,
        status:je,
        ...U!=null&&U.calDate?{calDate:U.calDate}:{},
        ...U!=null&&U.dueDate?{dueDate:U.dueDate}:{},
        ...U!=null&&U.calibratedBy?{calibratedBy:U.calibratedBy}:{},
        ...(U==null?void 0:U.notes)!==void 0?{notes:U.notes}:{}
      };
    });
    let updatedList = [];
    if(e==="cancel"){
      setCancelInstruments(prev => { const updated = updater(prev); updatedList = updated.filter(x => te.has(x.id)); return updated; });
    }else if(e==="centralized"){
      setCentInstruments(prev => { const updated = updater(prev); updatedList = updated.filter(x => te.has(x.id)); return updated; });
    }else if(e==="each_section"){
      setEachInstruments(prev => { const updated = updater(prev); updatedList = updated.filter(x => te.has(x.id)); return updated; });
    }else if(e==="normal_standard"){
      setNsInstruments(prev => { const updated = updater(prev); updatedList = updated.filter(x => te.has(x.id)); return updated; });
    }else{
      f(prev => { const updated = updater(prev); updatedList = updated.filter(x => te.has(x.id)); return updated; });
    }
    ae();
    try{
      if(window.qapSupabase&&window.qapSupabase.isConfigured()&&updatedList.length>0){
        window.qapSupabase.upsertInstruments(updatedList, e);
      }
    }catch(err){}
  },
  be=()=>{
    f([]);idbDelete(ah);try{localStorage.removeItem(ah)}catch{}
    setNsInstruments([]);idbDelete(nsStorageKey);try{localStorage.removeItem(nsStorageKey)}catch{}
    setCentInstruments([]);idbDelete(centStorageKey);try{localStorage.removeItem(centStorageKey)}catch{}
    setEachInstruments([]);idbDelete(eachStorageKey);try{localStorage.removeItem(eachStorageKey)}catch{}
    setCancelInstruments([]);idbDelete(cancelStorageKey);try{localStorage.removeItem(cancelStorageKey)}catch{}
    ae();
    try{
      if(window.qapSupabase&&window.qapSupabase.isConfigured()){
        window.qapSupabase.deleteAllInstruments("all");
      }
    }catch(err){}
  },
  we=()=>{
    if(e==="cancel"){
      setCancelInstruments(defaultCancel);safeSaveStorage(cancelStorageKey,defaultCancel);
    }else if(e==="centralized"){
      setCentInstruments(defaultCent);safeSaveStorage(centStorageKey,defaultCent);
    }else if(e==="each_section"){
      setEachInstruments(defaultEach);safeSaveStorage(eachStorageKey,defaultEach);
    }else if(e==="normal_standard"){
      setNsInstruments(defaultNs);safeSaveStorage(nsStorageKey,defaultNs);
    }else{
      f(iv);safeSaveStorage(ah,iv);
    }
    ae();
    try{
      if(window.qapSupabase&&window.qapSupabase.isConfigured()){
        window.qapSupabase.deleteAllInstruments(e);
      }
    }catch(err){}
  },
  De=(de,Re,targetPageOrSheet)=>{
    const isCancel=targetPageOrSheet==="cancel"||targetPageOrSheet==="CANCEL"||targetPageOrSheet==="CANCEL Y2026"||(importCfg&&(importCfg.sheet==="CANCEL"||importCfg.sheet==="CANCEL Y2026"||importCfg.page==="cancel"))||(!targetPageOrSheet&&e==="cancel");
    const isCent=targetPageOrSheet==="centralized"||targetPageOrSheet==="CENTRALIZED"||(importCfg&&(importCfg.sheet==="CENTRALIZED"||importCfg.page==="centralized"))||(!targetPageOrSheet&&e==="centralized");
    const isEach=targetPageOrSheet==="each_section"||targetPageOrSheet==="EACH SECTION"||targetPageOrSheet==="EACH"||(importCfg&&(importCfg.sheet==="EACH"||importCfg.page==="each_section"))||(!targetPageOrSheet&&e==="each_section");
    const isNs=targetPageOrSheet==="normal_standard"||targetPageOrSheet==="NORMAL STANDARD"||(importCfg&&(importCfg.sheet==="NORMAL STANDARD"||importCfg.page==="normal_standard"))||(!targetPageOrSheet&&e==="normal_standard");
    let targetTab = "calibration_all";
    let finalItems = de;
    if(isCancel){
      targetTab = "cancel";
      const fixed=de.map((item,idx)=>({...item,category:"CANCEL",status:item.status||"inactive"}));
      finalItems = fixed;
      if(Re==="replace"){
        setCancelInstruments(fixed.map((item,idx)=>({...item,no:idx+1})));
      }else{
        setCancelInstruments(prev=>{
          const start=prev.length;
          const mapped=fixed.map((item,idx)=>({...item,no:start+idx+1}));
          return[...prev,...mapped];
        });
      }
    }else if(isCent){
      targetTab = "centralized";
      const fixed=de.map((item,idx)=>({...item,category:"CENTRALIZED"}));
      finalItems = fixed;
      if(Re==="replace"){
        setCentInstruments(fixed.map((item,idx)=>({...item,no:idx+1})));
      }else{
        setCentInstruments(prev=>{
          const start=prev.length;
          const mapped=fixed.map((item,idx)=>({...item,no:start+idx+1}));
          return[...prev,...mapped];
        });
      }
    }else if(isEach){
      targetTab = "each_section";
      const fixed=de.map((item,idx)=>({...item,category:"EACH SECTION"}));
      finalItems = fixed;
      if(Re==="replace"){
        setEachInstruments(fixed.map((item,idx)=>({...item,no:idx+1})));
      }else{
        setEachInstruments(prev=>{
          const start=prev.length;
          const mapped=fixed.map((item,idx)=>({...item,no:start+idx+1}));
          return[...prev,...mapped];
        });
      }
    }else if(isNs){
      targetTab = "normal_standard";
      const fixed=de.map((item,idx)=>({...item,category:"NORMAL STANDARD"}));
      finalItems = fixed;
      if(Re==="replace"){
        setNsInstruments(fixed.map((item,idx)=>({...item,no:idx+1})));
      }else{
        setNsInstruments(prev=>{
          const start=prev.length;
          const mapped=fixed.map((item,idx)=>({...item,no:start+idx+1}));
          return[...prev,...mapped];
        });
      }
    }else{
      if(Re==="replace"){
        f(de.map((item,idx)=>({...item,no:idx+1})));
      }else{
        f(prev=>{
          const start=prev.length;
          const mapped=de.map((item,idx)=>({...item,no:start+idx+1}));
          return[...prev,...mapped];
        });
      }
    }
    ae();
    try{
      if(window.qapSupabase&&window.qapSupabase.isConfigured()){
        window.qapSupabase.pushSingleTable(targetTab, finalItems, Re);
      }
    }catch(err){}
  },
  handleMultiImport=({databaseItems,normalStandardItems,centralizedItems,eachSectionItems,cancelItems,mode})=>{
    const isRep=mode==="replace";
    if(databaseItems&&databaseItems.length>0){
      if(isRep)f(databaseItems.map((it,idx)=>({...it,no:idx+1})));
      else f(prev=>{const s=prev.length;return[...prev,...databaseItems.map((it,idx)=>({...it,no:s+idx+1}))]});
    }
    if(normalStandardItems&&normalStandardItems.length>0){
      const fixed=normalStandardItems.map(it=>({...it,category:"NORMAL STANDARD"}));
      if(isRep)setNsInstruments(fixed.map((it,idx)=>({...it,no:idx+1})));
      else setNsInstruments(prev=>{const s=prev.length;return[...prev,...fixed.map((it,idx)=>({...it,no:s+idx+1}))]});
    }
    if(centralizedItems&&centralizedItems.length>0){
      const fixed=centralizedItems.map(it=>({...it,category:"CENTRALIZED"}));
      if(isRep)setCentInstruments(fixed.map((it,idx)=>({...it,no:idx+1})));
      else setCentInstruments(prev=>{const s=prev.length;return[...prev,...fixed.map((it,idx)=>({...it,no:s+idx+1}))]});
    }
    if(eachSectionItems&&eachSectionItems.length>0){
      const fixed=eachSectionItems.map(it=>({...it,category:"EACH SECTION"}));
      if(isRep)setEachInstruments(fixed.map((it,idx)=>({...it,no:idx+1})));
      else setEachInstruments(prev=>{const s=prev.length;return[...prev,...fixed.map((it,idx)=>({...it,no:s+idx+1}))]});
    }
    if(cancelItems&&cancelItems.length>0){
      const fixed=cancelItems.map(it=>({...it,category:"CANCEL",status:it.status||"inactive"}));
      if(isRep)setCancelInstruments(fixed.map((it,idx)=>({...it,no:idx+1})));
      else setCancelInstruments(prev=>{const s=prev.length;return[...prev,...fixed.map((it,idx)=>({...it,no:s+idx+1}))]});
    }
    ae();
    try{
      if(window.qapSupabase&&window.qapSupabase.isConfigured()){
        if(isRep){
          window.qapSupabase.deleteAllInstruments("all").then(()=>{
            window.qapSupabase.pushAll({
              all: databaseItems || [],
              normalStandard: normalStandardItems || [],
              centralized: centralizedItems || [],
              eachSection: eachSectionItems || [],
              cancel: cancelItems || []
            });
          }).catch(console.warn);
        }else{
          window.qapSupabase.pushAll({
            all: databaseItems || [],
            normalStandard: normalStandardItems || [],
            centralized: centralizedItems || [],
            eachSection: eachSectionItems || [],
            cancel: cancelItems || []
          });
        }
      }
    }catch(err){}
  }'''

code = code[:idx_ge] + new_block + code[idx_end:]

# 2. Add focus & visibility auto-sync effect to keep all devices/screens in sync
focus_sync_effect = '''
  A.useEffect(() => {
    let timer = null;
    const triggerSync = () => {
      if (document.visibilityState === "visible" && window.qapSupabase && window.qapSupabase.isConfigured && window.qapSupabase.isConfigured()) {
        window.qapSupabase.pullAll().then(res => {
          if (res && res.ok && res.data) {
            handleSupabasePullData(res.data);
          }
        }).catch(() => {});
      }
    };
    window.addEventListener("focus", triggerSync);
    document.addEventListener("visibilitychange", triggerSync);
    timer = setInterval(triggerSync, 40000);
    return () => {
      window.removeEventListener("focus", triggerSync);
      document.removeEventListener("visibilitychange", triggerSync);
      if (timer) clearInterval(timer);
    };
  }, []);
'''

idx_app_mount = code.find('A.useEffect(()=>{let isMounted = true;')
if idx_app_mount != -1:
    code = code[:idx_app_mount] + focus_sync_effect + '\n  ' + code[idx_app_mount:]
    print("Added focus & background sync effect")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated app.js CRUD & Supabase sync completely")
