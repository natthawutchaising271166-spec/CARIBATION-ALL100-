with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

idx1 = code.find('handleMultiImport=({databaseItems')
idx2 = code.find('fe=de=>{C(de),_(!0)};', idx1)

fixed_handler = '''handleMultiImport=({databaseItems,normalStandardItems,centralizedItems,eachSectionItems,cancelItems,mode})=>{
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
  },'''

code = code[:idx1] + fixed_handler + code[idx2:]

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed syntax in app.js")
