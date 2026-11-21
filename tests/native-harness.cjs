const sourceTest=!process.env.DAYMARK_EXE;
const {chromium}=require('../node_modules/playwright-core'),{spawn}=require('child_process'),net=require('net'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),C=require('../ui/core.js');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function launch(profile){let server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let port=server.address().port;await new Promise(r=>server.close(r));let child=spawn(sourceTest?require('../node_modules/electron'):path.resolve(process.env.DAYMARK_EXE||'outputs/Daymark-1.5/Daymark-win32-x64/Daymark.exe'),[...(sourceTest?[path.resolve(__dirname,'..')]:[]),'--remote-debugging-port='+port],{env:{...process.env,DAYMARK_TEST_DATA:profile},windowsHide:true,stdio:['ignore','pipe','pipe']}),errors='';child.stderr.on('data',d=>errors+=d);child.stdout.on('data',d=>errors+=d);child.on('error',e=>errors+=e.stack);let ready=false;for(let i=0;i<150;i++){if(child.exitCode!==null)throw Error('App exited ('+child.exitCode+'): '+errors);try{let r=await fetch('http://127.0.0.1:'+port+'/json/version');if(r.ok){ready=true;break}}catch{}await wait(100)}if(!ready){child.kill();throw Error('No desktop connection: '+errors)}let browser=await chromium.connectOverCDP('http://127.0.0.1:'+port),context=browser.contexts()[0],page;for(let i=0;i<100;i++){page=context.pages().find(p=>p.url().includes('index.html'));if(page)break;await wait(50)}if(!page)throw Error('No calendar page: '+errors);await page.locator('#saveState').filter({hasText:'Saved on this computer'}).waitFor();return {browser,context,page,child,close:async()=>{await page.evaluate(()=>window.desktop.quitApp());for(let i=0;i<100&&child.exitCode===null;i++)await wait(50);if(child.exitCode===null){child.kill();throw Error('Native close did not complete')}await browser.close()}}}









module.exports={launch,wait};
