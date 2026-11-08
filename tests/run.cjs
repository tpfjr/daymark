const {spawnSync}=require('node:child_process'),path=require('node:path');for(let name of ['planner-ux.cjs','planner-ux-electron.cjs','calendar-hours.cjs','notes.mjs','backup.cjs','storage.cjs','release.cjs','retention.cjs','signing.cjs']){let r=spawnSync(process.execPath,[path.join(__dirname,name)],{stdio:'inherit',timeout:60000});if(r.status!==0)process.exit(1)}

let result=spawnSync(process.execPath,[path.join(__dirname,'regression-run.cjs')],{stdio:'inherit'});if(result.status!==0)process.exit(1);
