import { BOSS_NAME_KEYS, isBossDefeated } from '../pages/bosses/bossProgression';
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
export const REVISION_LABEL_KEYS = ['genericChange','quantityChanged','weaponLevelChanged','itemAdded','equipmentAdded','upgradeAdded','itemReplaced','upgradeEdited','upgradeConverted','slotShapeChanged','slotGemChanged','statsUpdated','characterUpdated','bossUpdated','flagUpdated'].map(key => `revision.${key}`);
export function buildSaveDiff(before, after, limit = 200) {
  const rows = []; let total = 0;
  const add = row => { if (equal(row.before,row.after)) return; total++; if (rows.length < limit) rows.push(JSON.parse(JSON.stringify(row))); };
  if (!before || !after) return {rows, omitted: 0};
  const oldStats = new Map((before.stats ?? []).map(s => [s.name,s.value]));
  for (const stat of after.stats ?? []) add({label:`statNames.${stat.name}`,before:oldStats.get(stat.name),after:stat.value});
  add({label:'characterForm.name',before:before.username?.string,after:after.username?.string});
  for (const axis of ['x','y','z']) add({label:'diff.position',suffix:axis.toUpperCase(),before:before.position?.coordinates?.[axis],after:after.position?.coordinates?.[axis]});
  add({label:'diff.map',before:before.position?.loaded_map,after:after.position?.loaded_map});
  add({label:'diff.playtime',before:before.playtime == null ? undefined : before.playtime / 1000,after:after.playtime == null ? undefined : after.playtime / 1000});
  const oldBosses = new Map((before.bosses ?? []).map(b => [b.name,b]));
  for (const boss of after.bosses ?? []) {
    const old = oldBosses.get(boss.name);
    if (old) add({label:BOSS_NAME_KEYS[boss.name] ? `bossNames.${BOSS_NAME_KEYS[boss.name]}` : 'sidebar.bosses',suffix:BOSS_NAME_KEYS[boss.name] ? '' : boss.name,type:'boss',before:isBossDefeated(old),after:isBossDefeated(boss)});
  }
  for (const location of ['inventory','storage']) for (const family of ['articles','upgrades']) {
    const map = save => {
      const records = new Map();
      for (const item of Object.values(save[location]?.[family] ?? {}).flat()) {
        // Native handles survive category changes. Identical handles use a stable occurrence index.
        const base = String(family === 'articles' ? item.first_part : item.id);
        let key = base, index = 0;
        while (records.has(key)) key = `${base}:${++index}`;
        records.set(key,item);
      }
      return records;
    };
    const a = map(before), b = map(after);
    for (const id of new Set([...a.keys(),...b.keys()])) {
      const old = a.get(id), next = b.get(id), item = next ?? old;
      const name = record => record?.info?.item_name ?? record?.info?.name ?? (record ? String(record.id) : undefined);
      const meta = {location,name:name(item)};
      add({...meta,label:'diff.item',type:'name',before:name(old),after:name(next)});
      if (!old || !next) continue;
      for (const field of ['amount','shape','effects','slots','id']) {
        const value = record => field === 'slots' ? record.slots?.map(s => ({shape:s.shape,gem:s.gem?.id ?? null,effects:s.gem?.effects ?? []})) : record[field];
        add({...meta,label:`diff.${field}`,type:field,before:value(old),after:value(next)});
      }
    }
  }
  return {rows,omitted:total-rows.length};
}
