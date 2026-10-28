const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../temple-runtime.js'), 'utf8');
async function boot({installed=12, online=true, status=200, manifest, fail=false, native=false}={}) {
  const elements=[], events={}, requests=[];
  function el(tag) {
    const e={tag,children:[],hidden:false,textContent:'',classList:{add(){}},setAttribute(){},
      append(...xs){this.children.push(...xs)},appendChild(x){this.children.push(x)},
      addEventListener(){},remove(){this.removed=true},focus(){document.activeElement=this}};
    elements.push(e);return e;
  }
  const document={readyState:'complete',hidden:false,currentScript:{src:'https://example.test/iskcon-mob/temple-runtime.js'},
    createElement:el,documentElement:{classList:{add(){}}},head:el('head'),body:el('body'),
    addEventListener(name,fn){events[name]=fn}};
  const window={addEventListener(name,fn){events[name]=fn},
    AndroidBridge:installed ? {getAppVersionCode(){return installed}, isInternetValidated(){return native}} : undefined};
  const context={window,document,navigator:{onLine:online},location:{href:'https://example.test/iskcon-mob/dev.html'},
    URL,AbortController,setTimeout,clearTimeout,setInterval(){},sessionStorage:{getItem(){return null},setItem(){}},
    async fetch(url){requests.push(url);if(fail)throw Error('network');return {ok:status===200,status,async json(){return manifest || {latestVersionCode:13,updateUrl:'https://play.google.com/store/apps/details?id=test'}}}}};
  vm.runInNewContext(source,context);await new Promise(resolve=>setImmediate(resolve));
  return {elements,requests,events,context,byId(id){return elements.find(e=>e.id===id)}};
}
test('native v12 receives update on subpage with root-relative manifest',async()=>{
 const b=await boot();assert.ok(b.byId('temple-update'));
 assert.match(b.requests[0],/^https:\/\/example.test\/iskcon-mob\/version.json\?/);
});
test('same APK and ordinary web browser do not receive update page',async()=>{
 for(const installed of [13,0])assert.equal((await boot({installed})).byId('temple-update'),undefined);
});
test('offline does not fetch; online recovery fetches and clears banner',async()=>{
 const b=await boot({online:false});assert.equal(b.requests.length,0);assert.match(b.byId('temple-connection').textContent,/No internet/);
 b.context.navigator.onLine=true;b.events.online();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(b.byId('temple-connection').hidden,true);assert.ok(b.byId('temple-update'));
});
test('HTTP failure is service error, not fake offline or cached-content claim',async()=>{
 const b=await boot({status:503});assert.match(b.byId('temple-connection').textContent,/service unavailable/);
 assert.equal(b.byId('temple-update'),undefined);
});
test('network failure distinguishes native validation and preserves page',async()=>{
 assert.match((await boot({fail:true,native:false})).byId('temple-connection').textContent,/No working internet/);
 assert.match((await boot({fail:true,native:true})).byId('temple-connection').textContent,/service could not be reached/);
});
test('forced update has no Later; unsafe URL never opens gate',async()=>{
 const b=await boot({manifest:{latestVersionCode:14,forceUpdate:true,updateUrl:'https://play.google.com/test'}});
 assert.equal(b.elements.filter(e=>e.tag==='button' && /Later/.test(e.textContent)).length,0);
 assert.equal((await boot({manifest:{latestVersionCode:14,updateUrl:'javascript:alert(1)'}})).byId('temple-update'),undefined);
});
