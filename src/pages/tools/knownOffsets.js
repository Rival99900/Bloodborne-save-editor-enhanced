import bosses from "../../../src-tauri/resources/bosses.json";

// Offsets (relative to the flag region) already documented in the editor, so a
// comparison can name the bytes it recognises. Flags page entries + boss flags.
const KNOWN_OFFSETS = new Map([
  [1083, "Flag: Lady Maria dialogue"],
  [6689, "Flag: Doll legacy lullaby"],
  [4127, "Flag: Blood-addled co-op"],
]);

for (const boss of bosses) {
  for (const flag of boss.flags ?? []) {
    const label = flag._comment === "mp" ? `Boss area multiplayer: ${boss.name}` : `Boss: ${boss.name}`;
    const previous = KNOWN_OFFSETS.get(flag.rel_offset);
    KNOWN_OFFSETS.set(flag.rel_offset, previous && !previous.includes(boss.name) ? `${previous} / ${boss.name}` : label);
  }
}

export default KNOWN_OFFSETS;
