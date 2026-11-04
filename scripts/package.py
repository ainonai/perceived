"""Atomically package the ready-to-publish reader and editable sources."""
from pathlib import Path
import hashlib
import json
import os
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT.parent / 'Perceived_GitHub_Pages.zip'
EXCLUDED = {'node_modules', '__pycache__', '.git', 'qa'}

if __name__ == '__main__':
    descriptor, temporary = tempfile.mkstemp(prefix='perceived-', suffix='.zip.tmp', dir=ROOT.parent)
    os.close(descriptor)
    try:
        with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for file in sorted(ROOT.rglob('*')):
                relative = file.relative_to(ROOT)
                if not file.is_file() or any(part in EXCLUDED for part in relative.parts):
                    continue
                if file.suffix in {'.pyc', '.zip'} or file.name == '.DS_Store':
                    continue
                archive.write(file, relative)
        with zipfile.ZipFile(temporary) as archive:
            if archive.testzip() is not None:
                raise ValueError('Package integrity check failed')
            for line in (ROOT / 'ORIGINAL_SHA256SUMS.txt').read_text().splitlines():
                expected, filename = line.split('  ', 1)
                if hashlib.sha256(archive.read(filename)).hexdigest() != expected:
                    raise ValueError(f'Original source mismatch: {filename}')
            for row in json.loads((ROOT/'assets/image-integrity.json').read_text()):
                if hashlib.sha256(archive.read(row['file'])).hexdigest() != row['sha256']:
                    raise ValueError(f"Image integrity mismatch: {row['file']}")
            count = len(archive.namelist())
        with open(temporary, 'rb') as checked:
            os.fsync(checked.fileno())
        os.replace(temporary, DESTINATION)
        print(f'{DESTINATION} ({count} files, verified)')
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
