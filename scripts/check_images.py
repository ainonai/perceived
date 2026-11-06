"""Decode shipped raster assets and record checksums after deliberate image changes.

Optional maintenance command: python3 scripts/check_images.py
Requires Pillow. The normal CI check verifies this manifest using only the stdlib.
"""
import hashlib, json, pathlib
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[1]

def main():
    rows=[]
    for path in sorted((ROOT/'assets').rglob('*')):
        if path.suffix.lower() not in {'.png','.webp','.jpg','.jpeg'}:continue
        with Image.open(path) as image:
            image.load()
            rows.append({'file':path.relative_to(ROOT).as_posix(),'width':image.width,'height':image.height,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    (ROOT/'assets/image-integrity.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(f'Decoded and recorded all {len(rows)} raster assets.')
if __name__=='__main__':main()
