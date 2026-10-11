/* ===========================================================================
 *  Does the species list on the marketing site still match the app's data?
 *  -------------------------------------------------------------------------
 *  site/ is its own Cloudflare Pages project rooted at site/, so it cannot
 *  reach ../ and cannot read js/data/plants.js. The 48 rows in
 *  site/index.html are therefore a copy, exactly like site/fonts/ is a copy
 *  of css/fonts/ — and a copy with nothing checking it goes stale in silence.
 *
 *  This compares the names and the count of the rows, and the pet-safe
 *  figure the copy quotes. The copy deliberately states no number of
 *  species, because the list grows, so this also fails if one creeps back
 *  in ("48 species", "Forty-eight of"): that figure is the one that was
 *  written down once and left to go wrong.
 *  It also checks that every species has its photograph in img/species/,
 *  because Store.speciesPhoto() builds the path from the id without looking
 *  and a missing file shows as a broken image rather than an error.
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
// Copy only: the text, and the attributes a reader sees or hears
// (placeholders, labels, alt text, meta descriptions), not the rows'
// data-find keys or the markup's comments.
const bare=html.replace(/<!--[\s\S]*?-->/g,'');
const said=[...bare.matchAll(/\s(?:placeholder|aria-label|alt|title|content)="([^"]*)"/g)].map(m=>m[1]).join(' ');
const copy=bare.replace(/<[^>]+>/g,' ')+' '+said;
const stated=copy.match(/\b\d+\s+species\b|\b(?:twenty|thirty|forty|fifty|sixty)[- ]\w+\s+(?:of|species|houseplants)\b/i);
const safeOk=new RegExp(`${safe} safe for cats`).test(html);
if(miss.length||extra.length||got.length!==want.length||stated||!safeOk){
  console.error('site/index.html species list is out of date.');
  if(miss.length)  console.error('  missing from site :', miss.join(', '));
  if(extra.length) console.error('  not in PLANT_DATA :', extra.join(', '));
  if(got.length!==want.length) console.error(`  count: site ${got.length}, data ${want.length}`);
  if(stated)  console.error(`  the copy states a species count ("${stated[0]}"); it goes stale as the list grows`);
  if(!safeOk)  console.error(`  the copy no longer says ${safe} safe for cats and dogs`);
  process.exit(1);
}
const noPhoto=c.window.PLANT_DATA.filter(p=>!fs.existsSync(`img/species/${p.id}.webp`)).map(p=>p.id);
if(noPhoto.length){console.error('species with no photograph in img/species/:', noPhoto.join(', '));process.exit(1);}
console.log(`site species list matches PLANT_DATA — ${want.length} species, ${safe} pet safe`);
