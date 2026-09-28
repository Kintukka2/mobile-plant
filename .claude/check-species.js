/* ===========================================================================
 *  Does the species list on the marketing site still match the app's data?
 *  -------------------------------------------------------------------------
 *  site/ is its own Cloudflare Pages project rooted at site/, so it cannot
 *  reach ../ and cannot read js/data/plants.js. The 48 rows in
 *  site/index.html are therefore a copy, exactly like site/fonts/ is a copy
 *  of css/fonts/ — and a copy with nothing checking it goes stale in silence.
 *  Add a 49th species and the site keeps saying 48 with no error anywhere.
 *
 *  This compares the names, the count, and the two figures the copy quotes.
 *
 *    node .claude/check-species.js
 *
 *  To regenerate the rows after a change, see CLAUDE.md § The two things in
 *  here that are not the app.
 * ======================================================================== */
const vm=require('vm'),fs=require('fs');const c={console,window:{}};
vm.createContext(c);['js/data/lookups.js','js/data/plants.js','js/data/problems.js']
.forEach(f=>vm.runInContext(fs.readFileSync(f,'utf8'),c));
const want=c.window.PLANT_DATA.map(p=>p.common);
const html=fs.readFileSync('site/index.html','utf8');
const got=[...html.matchAll(/<span class="sp-name">([^<]*)<\/span>/g)].map(m=>m[1]);
const safe=c.window.PLANT_DATA.filter(p=>p.tox.cats==='safe'&&p.tox.dogs==='safe').length;
const miss=want.filter(n=>!got.includes(n)), extra=got.filter(n=>!want.includes(n));
const counted=new RegExp(`${want.length} SPECIES|${want.length} species`).test(html);
const safeOk=new RegExp(`${safe} safe for cats`).test(html);
if(miss.length||extra.length||got.length!==want.length||!counted||!safeOk){
  console.error('site/index.html species list is out of date.');
  if(miss.length)  console.error('  missing from site :', miss.join(', '));
  if(extra.length) console.error('  not in PLANT_DATA :', extra.join(', '));
  if(got.length!==want.length) console.error(`  count: site ${got.length}, data ${want.length}`);
  if(!counted) console.error(`  the copy no longer says ${want.length} species`);
  if(!safeOk)  console.error(`  the copy no longer says ${safe} safe for cats and dogs`);
  process.exit(1);
}
console.log(`site species list matches PLANT_DATA — ${want.length} species, ${safe} pet safe`);
