import json
import unittest

from build_prefs_json import ROOT, gather_preferences


class PreferencesCatalogTest(unittest.TestCase):
    def test_generated_catalogs_match_source_and_keep_callsign_keys(self):
        generated = gather_preferences()
        entries = {item["key"]: item for item in generated["preferenceIndex"]}

        self.assertEqual(entries["callsign_category"]["label"], "Callsign")
        self.assertEqual(
            entries["com.atakmap.app.preferences.CallSignPreferenceFragment"]["label"],
            "Callsign",
        )
        self.assertNotIn("Callsign", entries)

        public_copy = ROOT.parent.parent / "public" / "docs" / "prefs" / "atak-preferences.json"
        for path in (ROOT / "atak-preferences.json", public_copy):
            with path.open(encoding="utf-8") as catalog_file:
                self.assertEqual(json.load(catalog_file), generated)


if __name__ == "__main__":
    unittest.main()
