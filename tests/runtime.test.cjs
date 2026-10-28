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
