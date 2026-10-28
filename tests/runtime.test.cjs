const {test} = require('node:test');
const assert = require('node:assert/strict');
const {updateFor} = require('../temple-runtime.js');
const valid = {latestVersionCode: 14, updateUrl: 'https://play.google.com/store/apps/details?id=com.iskcon.hadapsar.santosh.in'};
test('newer APK offers update; same/newer installed APK does not', () => {
  assert.equal(updateFor(valid, 13).code, 14);
  assert.equal(updateFor(valid, 14), null);
  assert.equal(updateFor(valid, 15), null);
});
test('web browser and missing bridge version never receive APK gate', () => {
  for (const v of [0, -1, NaN, undefined, '13']) assert.equal(updateFor(valid, v), null);
});
test('reject malformed version and unsafe update URL', () => {
  for (const v of [null, {}, {...valid, latestVersionCode:'14'}, {...valid, latestVersionCode:14.5},
    {...valid, updateUrl:'javascript:alert(1)'}, {...valid, updateUrl:'http://example.com'},
    {...valid, updateUrl:'https://user:pass@example.com'}]) assert.equal(updateFor(v, 13), null);
});
test('forceUpdate must be explicit boolean; remote text stays data', () => {
  assert.equal(updateFor({...valid, forceUpdate:true}, 13).force, true);
  assert.equal(updateFor({...valid, forceUpdate:'true'}, 13).force, false);
  assert.equal(updateFor({...valid, title:'<script>bad()</script>'}, 13).title, '<script>bad()</script>');
});
const {linkTarget} = require('../temple-runtime.js');
const base = 'https://bjendermisra-ops.github.io/iskcon-mob/temple-runtime.js';
test('internal pages stay internal; social/store/other repositories stay external', () => {
  assert.equal(linkTarget('schedule.html',base).internal,true);
  assert.equal(linkTarget('https://bjendermisra-ops.github.io/iskcon-mob/dev.html',base).internal,true);
  for(const url of ['https://youtu.be/123','https://www.instagram.com/test','https://play.google.com/store/apps/details?id=test','https://bjendermisra-ops.github.io/another-project/','https://evil.test/iskcon-mob/'])
    assert.equal(linkTarget(url,base).internal,false,url);
});
test('legacy intent links become safe HTTPS handoffs; unsafe links are rejected', () => {
  assert.equal(linkTarget('intent://youtube.com/watch?v=123#Intent;scheme=https;S.browser_fallback_url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3D123;end',base).url,'https://youtube.com/watch?v=123');
  for(const value of ['javascript:alert(1)','file:///secret','data:text/html,test','https://u:p@example.com','https://example.com\\@evil.test/'])assert.equal(linkTarget(value,base),null);
});
