from __future__ import annotations

import tempfile
import unittest
import zipfile
from pathlib import Path

from scripts.import_dataset import import_dataset


class DatasetImportTests(unittest.TestCase):
    def make_archive(self, root: Path, unsafe: bool = False) -> Path:
        archive = root / ("unsafe.zip" if unsafe else "ppe.zip")
        with zipfile.ZipFile(archive, "w") as output:
            if unsafe:
                output.writestr("../outside.txt", "must not extract")
                return archive
            output.writestr("data.yaml", "path: .\ntrain: train/images\nval: valid/images\nnames: [Mask]\n")
            output.writestr("train/images/frame.jpg", b"not decoded by the importer")
            output.writestr("train/labels/frame.txt", "0 0.5 0.5 0.25 0.25\n")
            output.writestr("valid/images/frame.jpg", b"not decoded by the importer")
            output.writestr("valid/labels/frame.txt", "0 0.5 0.5 0.25 0.25\n")
        return archive

    def test_import_writes_portable_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest = import_dataset(self.make_archive(root), root / "registry", "Safety Samples", False)
            destination = root / "registry" / "safety-samples"
            self.assertEqual(manifest["class_count"], 1)
            self.assertTrue((destination / ".ppe-dataset").is_file())
            self.assertEqual((destination / "data.local.yaml").read_text(encoding="utf-8").splitlines()[0], "path: .")
            self.assertNotIn(str(root), (destination / "data.local.yaml").read_text(encoding="utf-8"))

    def test_zip_path_traversal_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaises(ValueError):
                import_dataset(self.make_archive(root, unsafe=True), root / "registry", "Unsafe", False)
            self.assertFalse((root / "outside.txt").exists())


if __name__ == "__main__":
    unittest.main()
