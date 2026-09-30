import unittest
from build_updater_manifest import build_manifest


class ManifestTests(unittest.TestCase):
    def setUp(self):
        self.names = [f"Bloodborne_Save_Editor_Enhanced_0.6.0_{suffix}" for suffix in ["x64-setup.exe", "amd64.AppImage"]]
        self.release = {"tag_name": "v0.6.0", "assets": [
            {"name": n, "browser_download_url": f"https://github.com/owner/repo/releases/download/untagged-stale/{n}"}
            for name in self.names for n in [name, name + ".sig"]]}
        self.signatures = {name + ".sig": "signature-fixture" for name in self.names}
        self.notes = {"default": {"en": "Default"}, "versions": {"0.6.0": {"en": "New", "fr": "Nouveau"}}}

    def build(self):
        return build_manifest(self.release, "v0.6.0", "Rival99900/Bloodborne-save-editor-enhanced", self.signatures, self.notes, "2026-09-29T22:30:00Z")

    def test_temporary_draft_urls_never_enter_published_manifest(self):
        result = self.build()
        for entry in result["platforms"].values():
            self.assertNotIn("untagged-", entry["url"])
            self.assertIn("/releases/download/v0.6.0/", entry["url"])
            self.assertEqual(entry["signature"], "signature-fixture")
        self.assertEqual(result["localized_notes"]["fr"], "Nouveau")

    def test_missing_or_duplicate_assets_rejected(self):
        for assets in [self.release["assets"][:-1], self.release["assets"] + [self.release["assets"][0]]]:
            with self.subTest(assets=len(assets)):
                self.release["assets"] = assets
                with self.assertRaises(ValueError): self.build()

    def test_wrong_tag_rejected(self):
        self.release["tag_name"] = "v0.5.0"
        with self.assertRaises(ValueError): self.build()

    def test_empty_signature_rejected(self):
        self.signatures[self.names[0] + ".sig"] = " \n"
        with self.assertRaises(ValueError): self.build()


if __name__ == "__main__":
    unittest.main(verbosity=2)
