"""Rebuild display-only effect labels; preserve source IDs, signs and magnitudes.

Run with --check to detect stale catalogs without modifying them.
Labels describe the property; a signed source value expresses its increase/decrease.
Unsigned rune levels remain unsigned (never invent a percent or multiplier).
"""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = 'ATK DOWN|ATK UP|ATK UP at full HP|ATK UP near death|ATK vs beasts DOWN|ATK vs beasts UP|ATK vs kin UP|ATK vs open foes UP|ATK vs the kin DOWN|ATK vs the kin UP|Add all types of RES|Add arcane ATK|Add blood ATK|Add bolt ATK|Add fire ATK|Add frenzy RES|Add physical ATK|Add rapid poison RES|Add rapid poison effect|Add slow poison RES|Add slow poison effect|All DMG reduction|Arcane ATK UP|Arcane DMG Reduction|Arcane scaling|Blood ATK UP|Bloodtinge scaling|Blunt ATK UP|Bolt ATK UP|Bolt DMG Reduction|Boosts Max HP|Boosts Max Stamina|Boosts max HP during co-op|Boosts rally potential|Charge ATKs UP|Cont. heal near death|Embrace hidden|Enable kos parasite|Falling damage reduced|Fire ATK UP|Fire DMG Reduction|HP continues to recover|HP gradually depletes|Increased Discovery|Increases stamina costs|Max QS bullets held UP|Max vials held UP|Milkweed 2nd hidden|More Blood Echoes from V.ATKs|More echoes from slain enemies|No Effect|Phys. UP at full HP|Phys. UP near death|Physical ATK UP|Physical DMG reduction|Reduces stamina costs|SKL scaling|STR scaling|Small increase in item discovery|Stamina recovery speed UP|Temp. boost to transform|Thrust ATK UP|Ups visceral ATK|V.ATKs grant QS bullets|V.ATKs restore HP|Vial HP recovery UP|WPN durability DOWN|WPN durability UP'.split('|')
KEYS = 'attack|attack|attackFull|attackLow|beasts|beasts|kin|open|kin|kin|resAll|arcane|blood|bolt|fire|resFrenzy|physical|resRapid|rapid|resSlow|slow|reduceAll|arcane|reduceArcane|scaleArcane|blood|scaleBlood|blunt|bolt|reduceBolt|hp|stamina|coopHp|rally|charge|healLow|embrace|kos|fall|fire|reduceFire|heal|drain|discovery|costUp|bullets|vials|milkweed|echoVisceral|echoKill|none|physFull|physLow|physical|reducePhysical|costDown|scaleSkill|scaleStrength|discoverySmall|staminaRegen|transform|thrust|visceral|visceralBullets|visceralHp|vialRecovery|durability|durability'.split('|')
assert len(SOURCE) == len(KEYS)
FAMILIES = dict(zip(SOURCE, KEYS))
NUMBER = re.compile(r' ([+-]?\d+(?:\.\d+)?%?)$')

def translated(source, labels):
    match = NUMBER.search(source)
    family = source[:match.start()] if match else source
    if family not in FAMILIES:
        raise ValueError(f'Unreviewed effect family: {source}')
    label = labels[FAMILIES[family]]
    return f'{label} : {match[1]}' if match else label

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    labels = json.loads((Path(__file__).parent / 'effect_labels.json').read_text())
    upgrades = json.loads((ROOT / 'src-tauri/resources/upgrades.json').read_text())
    sources = {entry['effect'] for group in ('gemEffects', 'runeEffects') for entry in upgrades[group].values()}
    changes = 0
    for lang, words in labels.items():
        assert set(words) == set(KEYS) and all(v.strip() for v in words.values()), lang
        path = ROOT / 'src/i18n/effectTranslations' / f'{lang}.json'
        data = json.loads(path.read_text())
        for source in sources:
            value = translated(source, words)
            # Preserve signs, magnitudes, percent markers and internal level numbers.
            tokens = r'[+-]?\d+(?:\.\d+)?%?'
            assert re.findall(tokens, source) == re.findall(tokens, value), (lang, source)
            assert not re.search(r'[+-]\s*[+-]|\b(?:WPN|UP|DOWN|Bloodtinge|HP|SKL|STR|QS)\b|V\.ATK', value), (lang, source)
            if data['effects'].get(source) != value:
                changes += 1
                if not args.check:
                    data['effects'][source] = value
        if not args.check:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f'{len(sources)} effects, {len(FAMILIES)} source families, {len(labels)} locales; changed/stale entries: {changes}')
    if args.check and changes:
        raise SystemExit(1)

if __name__ == '__main__':
    main()
