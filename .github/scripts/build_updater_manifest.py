"""Generate permanent release URLs; draft browser_download_url values are unstable."""
import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote


def build_manifest(release, tag, repository, signatures, notes, date):
    if not re.fullmatch(r"v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?", tag):
        raise ValueError("Invalid release version")
    if not re.fullmatch(r"[\w.-]+/[\w.-]+", repository):
        raise ValueError("Invalid repository")
    if release["tag_name"] != tag:
        raise ValueError("Unexpected release tag")
    version = tag[1:]
    assets = release["assets"]
    names = [asset["name"] for asset in assets]
    platforms = {}

    def entry(name):
        for required in [name, name + ".sig"]:
            if names.count(required) != 1:
                raise ValueError(f"Missing or duplicate release asset: {required}")
        signature = signatures.get(name + ".sig", "").strip()
        if not signature:
            raise ValueError("Empty updater signature")
        return {
            "url": f"https://github.com/{repository}/releases/download/{quote(tag, safe='')}/{quote(name, safe='')}",
            "signature": signature,
        }

    prefix = f"Bloodborne_Save_Editor_Enhanced_{version}_"
    for platform, suffix in [("windows-x86_64", "x64-setup.exe"), ("linux-x86_64", "amd64.AppImage")]:
        platforms[platform] = entry(prefix + suffix)
    # The Windows MSI package is optional (added in 0.7.1). The updater picks the
    # entry of the installer type the user installed with: `<os>-<arch>-<installer>`.
    msi = [name for name in names if name.startswith(prefix + "x64") and name.endswith(".msi")]
    if len(msi) > 1:
        raise ValueError("Several MSI packages in the release")
    if msi:
        platforms["windows-x86_64-nsis"] = platforms["windows-x86_64"]
        platforms["windows-x86_64-msi"] = entry(msi[0])
    localized = notes["versions"].get(version, notes["default"])
    return {"version": version, "notes": localized["en"], "localized_notes": localized,
            "pub_date": date, "platforms": platforms}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--release", required=True, type=Path)
    parser.add_argument("--tag", required=True)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--signatures", required=True, type=Path)
    parser.add_argument("--notes", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    signatures = {p.name: p.read_text().strip() for p in args.signatures.glob("*.sig")}
    manifest = build_manifest(json.loads(args.release.read_text()), args.tag, args.repository,
                              signatures, json.loads(args.notes.read_text()),
                              datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    args.output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
