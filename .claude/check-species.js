/* ===========================================================================
 *  Does the species list on the marketing site still match the app's data?
 *  -------------------------------------------------------------------------
 *  site/ is its own Cloudflare Pages project rooted at site/, so it cannot
 *  reach ../ and cannot read js/data/plants.js. The rows in
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
// Search reads the tags and the Pet safe filter reads the ratings, so a
// pet-safe tag on a 'mild' plant (Mint, once) put it in front of a reader
// searching for pet-safe plants without the filter ever agreeing.
const tagOff=c.window.PLANT_DATA.filter(p=>p.tags.includes('pet-safe')!==(p.tox.cats==='safe'&&p.tox.dogs==='safe')).map(p=>p.id);
if(tagOff.length){console.error('pet-safe tag disagrees with tox.cats/tox.dogs:', tagOff.join(', '));process.exit(1);}
// A problems id that is neither a symptom nor a cause is dropped without a
// word by describe() and diagnose(), so a typo there loses the plant its
// warning and its prone bonus and nothing anywhere says so.
const D=c.window.PROBLEM_DATA;
const badProb=c.window.PLANT_DATA.flatMap(p=>p.problems.filter(x=>!D.SYMPTOMS[x]&&!D.CAUSES[x]).map(x=>p.id+' ('+x+')'));
if(badProb.length){console.error('problems ids that are neither a symptom nor a cause:', badProb.join(', '));process.exit(1);}
// Every light rung once, between ideal, tolerates and avoid: a rung left
// out gets the vague "poor" verdict, which is wrong for a plant that the
// light would really scorch or starve.
const RUNGS=['low','medium','bright-indirect','direct'];
const badLight=c.window.PLANT_DATA.filter(p=>RUNGS.some(r=>[p.light.ideal].concat(p.light.tolerates||[],p.light.avoid||[]).filter(x=>x===r).length!==1)).map(p=>p.id);
if(badLight.length){console.error('light rungs not rated exactly once:', badLight.join(', '));process.exit(1);}
// A plant with no cause in problems gets no species weighting in diagnosis.
const noCause=c.window.PLANT_DATA.filter(p=>!p.problems.some(x=>D.CAUSES[x])).map(p=>p.id);
if(noCause.length){console.error('problems lists with no cause id:', noCause.join(', '));process.exit(1);}
// water.seasons: only the four season keys, days of 0 or more, and at least
// one season with water, or the plant would never be watered at all.
const SEASONS=['spring','summer','autumn','winter'];
const badSeasons=c.window.PLANT_DATA.filter(p=>p.water.seasons).filter(p=>{const o=p.water.seasons,k=Object.keys(o);
  return k.some(x=>!SEASONS.includes(x))||k.some(x=>typeof o[x]!=='number'||o[x]<0)||!SEASONS.some(x=>(typeof o[x]==='number'?o[x]:(x==='spring'||x==='summer'?p.water.warm:p.water.cool))>0);}).map(p=>p.id);
if(badSeasons.length){console.error('water.seasons malformed or never waters:', badSeasons.join(', '));process.exit(1);}
// A feed is either never, with the reason the feeding card shows, or a
// positive number of days, with any seasons of its own among the four.
const badFeed=c.window.PLANT_DATA.filter(p=>p.fert.never?!p.fert.note:!(p.fert.everyDays>0)||(p.fert.seasons&&(!Array.isArray(p.fert.seasons)||!p.fert.seasons.length||p.fert.seasons.some(x=>!SEASONS.includes(x))))).map(p=>p.id);
if(badFeed.length){console.error('fert needs everyDays > 0 and valid seasons, or never with a note:', badFeed.join(', '));process.exit(1);}
const badMethod=c.window.PLANT_DATA.filter(p=>p.water.method&&!c.window.LOOKUPS.WATER_METHODS[p.water.method]).map(p=>p.id+' ('+p.water.method+')');
if(badMethod.length){console.error('water.method not in LOOKUPS.WATER_METHODS:', badMethod.join(', '));process.exit(1);}
// Last, so a species written ahead of its photograph still gets every
// other check while the photograph is on its way.
const noPhoto=c.window.PLANT_DATA.filter(p=>!fs.existsSync(`img/species/${p.id}.webp`)).map(p=>p.id);
if(noPhoto.length){console.error('species with no photograph in img/species/:', noPhoto.join(', '));process.exit(1);}
console.log(`site species list matches PLANT_DATA — ${want.length} species, ${safe} pet safe`);
