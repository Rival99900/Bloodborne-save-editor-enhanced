#!/usr/bin/env python3
"""Exercise release preparation without network calls or real credentials."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
OLD_SHA = "820bf555945e326552b689fb9e2d56af8e769474"
NEW_SHA = "a" * 40
MOCK_GH = '''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
a = sys.argv[1:]
state = json.loads(Path(os.environ["MOCK_STATE"]).read_text())
with open(os.environ["MOCK_CALLS"], "a") as log:
    log.write(json.dumps(a) + "\\n")
if a == ["api", "user", "--jq", ".login"]:
    print(state.get("owner", "Rival99900"))
elif "--paginate" in a:
    print(json.dumps([state["releases"]]))
elif "--method" in a:
    method = a[a.index("--method") + 1]
    if method == "POST":
        assert "draft=true" in a
        assert "body=@.github/release-notes/v0.5.0.md" in a
        print(json.dumps(state["created"]))
    elif method == "PATCH" and "/releases/" in a[3]:
        release = dict(state["releases"][0])
        release["target_commitish"] = next(x.split("=", 1)[1] for x in a if x.startswith("target_commitish="))
        print(json.dumps(release))
    elif method in ("PATCH", "DELETE"):
        print("{}")
    else:
        sys.exit(91)
elif "/git/ref/tags/" in a[1]:
    print(state["tag_sha"])
else:
    sys.exit(92)
'''


def draft(sha=NEW_SHA, **changes):
    value = dict(id=393144615, tag_name="v0.5.0", draft=True,
                 target_commitish=sha, author={"login": "Rival99900"}, assets=[])
    value.update(changes)
    return value


class PrepareReleaseTests(unittest.TestCase):
    def run_script(self, releases, tag_sha=NEW_SHA, **state):
        with tempfile.TemporaryDirectory() as directory:
            tmp = Path(directory)
            for name, source in {"gh": MOCK_GH, "git": f"#!/bin/sh\necho {NEW_SHA}\n"}.items():
                (tmp / name).write_text(source)
                (tmp / name).chmod(0o755)
            (tmp / "state").write_text(json.dumps(dict(
                releases=releases, tag_sha=tag_sha, created=draft(), **state)))
            result = subprocess.run(["bash", "scripts/prepare_release.sh"], cwd=ROOT,
                env={**os.environ, "PATH": f"{tmp}:{os.environ['PATH']}",
                     "GH_TOKEN": "test-only", "RELEASE_TAG": "v0.5.0",
                     "GITHUB_REPOSITORY": "Rival99900/Bloodborne-save-editor-enhanced",
                     "GITHUB_OUTPUT": str(tmp / "output"), "MOCK_STATE": str(tmp / "state"),
                     "MOCK_CALLS": str(tmp / "calls")}, capture_output=True, text=True)
            calls = [json.loads(line) for line in (tmp / "calls").read_text().splitlines()]
            output = (tmp / "output").read_text() if (tmp / "output").exists() else ""
            return result, calls, output

    def test_creation_does_not_requery_stale_release_list(self):
        result, calls, output = self.run_script([])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(sum("--paginate" in c for c in calls), 1)
        self.assertTrue(any("POST" in c for c in calls))
        self.assertEqual(output, "release_id=393144615\n")

    def test_failed_empty_draft_is_reused_and_retargeted(self):
        result, calls, output = self.run_script([draft(OLD_SHA)], tag_sha=OLD_SHA)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(sum("PATCH" in c for c in calls), 2)
        self.assertFalse(any("POST" in c or "DELETE" in c for c in calls))
        self.assertEqual(output, "release_id=393144615\n")

    def test_retry_current_draft_preserves_uploaded_assets(self):
        result, calls, _ = self.run_script([draft(assets=[{"name": "installer.exe"}])])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(any("--method" in c for c in calls))

    def test_unexpected_states_fail_without_mutation(self):
        cases = [
            {"releases": [draft()], "tag_sha": "b" * 40},
            {"releases": [draft(OLD_SHA, assets=[{"name": "installer.exe"}])], "tag_sha": OLD_SHA},
            {"releases": [draft(OLD_SHA, id=999)], "tag_sha": OLD_SHA},
            {"releases": [draft(draft=False)]},
            {"releases": [draft(author={"login": "someone-else"})]},
            {"releases": [draft(), draft()]},
            {"releases": [], "owner": "someone-else"},
        ]
        for case in cases:
            with self.subTest(case=case):
                result, calls, output = self.run_script(**case)
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse(any("--method" in c for c in calls))
                self.assertEqual(output, "")


if __name__ == "__main__":
    unittest.main(verbosity=2)
