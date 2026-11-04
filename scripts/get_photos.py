"""Refresh real photographs from the credit manifest without replacing generated artwork.

Requires Pillow and an internet connection. Existing files survive failed downloads.
"""
import concurrent.futures, io, json, os, pathlib, tempfile, urllib.request, urllib.parse
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'assets/photo-credits.json'

def save_verified(image, destination, quality):
    data=io.BytesIO()
    image.save(data, 'WEBP', quality=quality, method=6)
    encoded=data.getvalue()
    with Image.open(io.BytesIO(encoded)) as check:check.load()
    descriptor, temporary=tempfile.mkstemp(prefix='photo-',suffix='.tmp',dir=destination.parent)
    try:
        with os.fdopen(descriptor,'wb') as output:
            output.write(encoded);output.flush();os.fsync(output.fileno())
        os.replace(temporary,destination)
    finally:
        if os.path.exists(temporary):os.unlink(temporary)

def download(row):
    if 'download_url' not in row or row['creator'].startswith('AI-generated'):
        return row
    try:
        parsed = urllib.parse.urlsplit(row['download_url'])
        query = dict(urllib.parse.parse_qsl(parsed.query))
        if 'images.unsplash.com' in parsed.netloc:
            query.update(w='2560', q='92', fit='max', fm='jpg')
            query.pop('h', None)
        elif 'science.nasa.gov' in parsed.netloc:
            query.update(w='1617', h='2800', fit='clip')
        url = urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(query)))
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(request, timeout=50).read()
        image = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert('RGB')
        image.thumbnail((3840, 3840))
        save_verified(image, ROOT / row['file'], 92)
        save_verified(ImageOps.fit(image, (1200, 800)), ROOT / row['thumbnail'], 90)
        return {**row, 'download_url': url, 'width': image.width, 'height': image.height}
    except Exception as error:
        print(f"Kept existing {row['id']}: {error}")
        return row

if __name__ == '__main__':
    rows = json.loads(MANIFEST.read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        refreshed = list(pool.map(download, rows))
    MANIFEST.write_text(json.dumps(refreshed, indent=2))
