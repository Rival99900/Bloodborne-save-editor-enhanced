# Face Import Examples

This directory contains small, valid Bloodborne face-data files for testing the **Character → Import face** workflow.

Each file contains only the 235-byte appearance block exported by the editor. The files do **not** contain character names, inventory entries, progression, statistics, or other save-data sections.

## Included examples

| File | Purpose |
|---|---|
| `alfredFace` | Existing valid example face. |
| `eustaceFace` | Existing valid example face. |
| `iosefkaFace` | Existing valid example face. |
| `samuelFace` | Existing valid example face. |
| `sample-hunter-a.face` | Anonymous test face exported from a repository test fixture. |
| `sample-hunter-b.face` | Anonymous test face exported from a repository test fixture. |
| `sample-hunter-c.face` | Anonymous test face exported from a repository test fixture. |
| `sample-hunter-d.face` | Anonymous test face exported from a repository test fixture. |

## How to use

1. Open a decrypted Bloodborne character save in the editor.
2. Go to **Character**.
3. Select **Import face**.
4. Choose one of the files in this folder.
5. A success notification confirms that the face data was applied.
6. Save the edited character only after reviewing the result.

> Face import is protected by a statistics guard. The editor cancels the operation and restores the original bytes if an import would change Max HP, Stamina, or any other character statistic.
