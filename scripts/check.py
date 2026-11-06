"""Check the generated static site and preservation of the supplied archive."""
from collections import Counter
import hashlib, json, pathlib, re, sys, xml.etree.ElementTree as ET
from html.parser import HTMLParser

ROOT=pathlib.Path(__file__).resolve().parents[1]

class Inspect(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids=[]; self.links=[]; self.assets=[]; self.images=[]; self.scripts=[]; self.event_handlers=[]; self.metadata={}; self.canonical=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='a' and a.get('href'):self.links.append(a['href'])
        if tag in ('img','script') and a.get('src'):self.assets.append(a['src'])
        if tag=='link' and a.get('href'):self.assets.append(a['href'])
        if tag=='meta':self.metadata[a.get('property') or a.get('name')]=a.get('content')
        if tag=='link' and a.get('rel')=='canonical':self.canonical=a.get('href')
        if tag=='img':
            self.images.append(a)
            if a.get('srcset'):
                self.assets.extend(item.strip().split()[0] for item in a['srcset'].split(',') if item.strip())
        if tag=='script':self.scripts.append(a.get('src','inline theme setup'))
        self.event_handlers.extend((tag,k,v) for k,v in attrs if k.startswith('on'))

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    from check_grounding import check as check_grounding, source_catalog
    catalog=source_catalog()
    grounding=check_grounding(catalog)
    html=(ROOT/'index.html').read_text(encoding='utf-8');p=Inspect();p.feed(html);counts=Counter(p.ids);errors=[]
    duplicates=[k for k,n in counts.items() if n>1]
    if duplicates:errors.append(('duplicate IDs',duplicates))
    missing=sorted(set(h[1:] for h in p.links if h.startswith('#') and h[1:] not in counts))
    if missing:errors.append(('missing anchors',missing))
    local=set(h.split('#')[0].split('?')[0] for h in p.links+p.assets if not h.startswith(('https:','http:','#','mailto:')))
    missingfiles=sorted(h for h in local if h and not (ROOT/h).is_file())
    if missingfiles:errors.append(('missing local files',missingfiles))
    if any(re.match(r'^(?:javascript|data|vbscript):',u,re.I) for u in p.links+p.assets):errors.append(('unsafe URL scheme',True))
    if p.event_handlers:errors.append(('inline event handlers',p.event_handlers))
    if any('alt' not in im for im in p.images):errors.append(('images missing alt text',True))
    if any(s.startswith(('https:','http:')) for s in p.scripts):errors.append(('external script dependency',True))
    deferred=re.compile(r'(?:fuller|detailed|complete) (?:account|article|reference) (?:preserves|retains|includes|explains|contains|rejects)',re.I)
    for chapter in (ROOT/'editorial').glob('*.md'):
        if deferred.search(chapter.read_text(encoding='utf-8')):errors.append(('reading chapter defers its explanation',chapter.name))
    reading_sections = re.findall(
        r'<section id="([^"]+)"[^>]*data-search-label="(?:Reading edition · [^"]+|Research methods)"[^>]*>(.*?)</section>',
        html, re.S,
    )
    for identifier, section in reading_sections:
        reading, separator, notes = section.partition('<details class="example-notes">')
        external_links = re.findall(r'<a\b[^>]*href="(https://[^"]+)"', reading)
        cited = re.findall(
            r'<sup class="example-citation">(.*?)</sup>', reading, re.S,
        )
        pointers = re.findall(r'<a\b[^>]*href="(https://[^"]+)"[^>]*>(\d+)</a>', ''.join(cited))
        note_list = re.findall(r'<li><a\b[^>]*href="(https://[^"]+)"', notes.partition('</details>')[0])
        if external_links != [url for url, _ in pointers] or (
            external_links and not separator
        ) or any(
            not 1 <= int(number) <= len(note_list) or note_list[int(number) - 1] != url
            for url, number in pointers
        ):
            errors.append(('reading citation does not match its numbered note', identifier))
    expected=json.loads((ROOT/'build-report.json').read_text(encoding='utf-8'))
    for label,pattern,number in [('sources',r'class="details-box source-entry"',len(catalog)),('evidence reviews',r'class="details-box evidence-claim"',27),('questions',r'class="details-box faq"',34),('glossary terms',r'class="glossary-item"',55+len(json.loads((ROOT/'editorial/terminology.json').read_text(encoding='utf-8'))))]:
        n=len(re.findall(pattern,html))
        if n!=number:errors.append((label,n,number))
    if expected['videoTranscripts']!=len(catalog):errors.append(('build source count mismatch',expected['videoTranscripts'],len(catalog)))
    for ordinal in catalog:
        anchor=f'source-v{ordinal:03d}'
        if anchor not in counts or anchor+'-text' not in counts:errors.append(('source anchors missing',ordinal))
    notes=json.loads((ROOT/'editorial/evidence-notes.json').read_text(encoding='utf-8'))
    if [n['number'] for n in notes]!=list(range(1,28)):errors.append(('evidence note coverage',True))
    if html.count('class="original-review"')!=27:errors.append(('original review entries missing',True))
    for note in notes:
        if note['category'] not in {'research','methods','theory','unreviewed'}:errors.append(('unknown research filter',note['number']))
        for ref in re.findall(r'\[R(\d+)\]',note['findings']+note['scope']):
            if not 1<=int(ref)<=55:errors.append(('research reference missing',ref))
    if html.count('data-glossary-origin="original"')!=55:errors.append(('original glossary definitions not preserved',True))
    extra_terms=json.loads((ROOT/'editorial/terminology.json').read_text(encoding='utf-8'))
    if html.count('data-glossary-origin="added"')!=len(extra_terms):errors.append(('additional glossary count mismatch',True))
    for term in extra_terms:
        if term['chapter'] not in counts:errors.append(('glossary chapter missing',term['term']))
        if not term.get('aliases') or not term.get('videos'):errors.append(('glossary provenance missing',term['term']))
    actual=[]
    for f in sorted((ROOT/'original').rglob('*')):
        if f.is_file():actual.append((f.relative_to(ROOT).as_posix(),digest(f)))
    manifest=ROOT/'ORIGINAL_SHA256SUMS.txt'
    if manifest.exists():
        recorded=[(line.split('  ',1)[1],line.split('  ',1)[0]) for line in manifest.read_text(encoding='utf-8').splitlines() if line]
        if recorded!=sorted(actual):errors.append(('original archive hash mismatch',True))
    else:errors.append(('missing original hash manifest',True))
    for f in (ROOT/'assets/diagrams').glob('*.svg'):ET.parse(f)
    diagram_links=0
    ledger=(ROOT/'original/DIAGRAMS/README.md').read_text(encoding='utf-8')
    statuses={m[0]:m[2] for m in re.findall(r'^\| (D\d\d-E\d\d) \| (.*?) \| (.*?) \|',ledger,re.M)}
    for source in sorted((ROOT/'original/DIAGRAMS').glob('*.mmd')):
        data=json.loads((ROOT/'assets/diagrams'/source.with_suffix('.json').name).read_text(encoding='utf-8'))
        text=source.read_text(encoding='utf-8')
        old_nodes={m[0]:m[1] for m in re.findall(r'^\s+(\w+)\["([^"]+)"\]',text,re.M)}
        if old_nodes!={x['name']:x['label'] for x in data['nodes']}:errors.append(('diagram node mismatch',source.name))
        old_edges={m[2]:(m[0],m[4],m[3]) for m in re.findall(r'^\s+(\w+)\s+(-->|-\.->)\|"(D\d\d-E\d\d): ([^"]+)"\|\s*(\w+)',text,re.M)}
        new_edges={x['id']:(x['tail'],x['head'],x['label']) for x in data['edges']}
        if old_edges!=new_edges:errors.append(('diagram edge mismatch',source.name))
        for edge in data['edges']:
            if edge['status']!=statuses[edge['id']]:errors.append(('diagram status mismatch',edge['id']))
        svg_ids={e.get('id') for e in ET.parse(ROOT/'assets/diagrams'/source.with_suffix('.svg').name).iter()}
        if not set(old_edges).issubset(svg_ids):errors.append(('diagram SVG IDs missing',source.name))
        diagram_links+=len(old_edges)
    if diagram_links!=77:errors.append(('diagram link total',diagram_links))
    space=json.loads((ROOT/'idea-space-data.json').read_text(encoding='utf-8'))
    map_urls={n:v['url'] for n,v in space['videos'].items()}
    if map_urls!={str(n):v['video_url'] for n,v in catalog.items()}:errors.append(('graph source catalog mismatch',True))
    node_ids=[n['id'] for n in space['nodes']]
    if len(node_ids)!=len(set(node_ids)):errors.append(('duplicate graph node IDs',True))
    for n in space['nodes']:
        if n['href'] not in counts:errors.append(('graph destination missing',n['href']))
        for v in n.get('videos',[]):
            if str(v) not in space['videos']:errors.append(('graph video missing',v))
    for edge in space['edges']:
        if edge['from'] not in node_ids or edge['to'] not in node_ids:errors.append(('graph endpoint missing',edge))
        for eid in edge.get('sourceEdges',[]):
            if eid not in statuses:errors.append(('graph source link missing',eid))
    for svg in (ROOT/'assets/overviews').glob('*.svg'):ET.parse(svg)
    if re.search(r'&lt;a id=&quot;d0\d',html):errors.append(('escaped diagram anchor rendered as text',True))
    for css in (ROOT/'assets').glob('*.css'):
        for match in re.finditer(r"url\(['\"]?([^)'\"]+)",css.read_text(encoding='utf-8')):
            value=match.group(1)
            if not value.startswith(('data:','https:','http:','#')) and not (css.parent/value).is_file():errors.append(('missing CSS asset',value))
    image_manifest=json.loads((ROOT/'assets/image-integrity.json').read_text(encoding='utf-8'))
    recorded_images={row['file'] for row in image_manifest}
    actual_images={f.relative_to(ROOT).as_posix() for f in (ROOT/'assets').rglob('*') if f.suffix.lower() in {'.png','.webp','.jpg','.jpeg'}}
    if recorded_images!=actual_images:errors.append(('unrecorded or missing raster assets',sorted(actual_images^recorded_images)))
    for row in image_manifest:
        file=ROOT/row['file']
        if not file.is_file() or digest(file)!=row['sha256']:errors.append(('image checksum mismatch',row['file']))
    if 'sound-panel' in html or 'music-config.js' in html:errors.append(('removed audio UI still present',True))
    if not all(marker in html for marker in ('id="space-close"','id="space-backdrop"','id="vocab-popover"')):errors.append(('missing reading controls',True))
    config=json.loads((ROOT/'site.config.json').read_text(encoding='utf-8'))
    expected_image=config['url'].rstrip('/')+'/assets/artwork/channel-avatar.png'
    if p.metadata.get('og:image')!=expected_image:errors.append(('incorrect social image URL',p.metadata.get('og:image')))
    if p.metadata.get('og:url')!=config['url'] or p.canonical!=config['url']:errors.append(('incorrect canonical URL',True))
    if p.metadata.get('twitter:card')!='summary':errors.append(('missing compact preview',True))
    header=(ROOT/'assets/artwork/channel-avatar.png').read_bytes()[:24]
    width,height=int.from_bytes(header[16:20],'big'),int.from_bytes(header[20:24],'big')
    if header[:8]!=b'\x89PNG\r\n\x1a\n' or (width,height)!=(160,160) or (p.metadata.get('og:image:width'),p.metadata.get('og:image:height'))!=(str(width),str(height)):errors.append(('incorrect social card dimensions',True))
    report={'status':'PASS' if not errors else 'FAIL','uniqueIds':len(counts),'internalLinks':sum(x.startswith('#') for x in p.links),'brokenInternalLinks':len(missing),'localReferences':len(local),'missingLocalFiles':len(missingfiles),'preservedOriginalFiles':len(actual),'preservedDiagramLinks':diagram_links,'graphNodes':len(node_ids),'graphConnections':len(space['edges']),'decodedRasterAssets':len(image_manifest),'imagesWithAltText':len(p.images),'externalScriptDependencies':0,'sourceLinkedReadingParagraphs':grounding['sourceLinkedParagraphs'],'counts':expected,'errors':errors}
    (ROOT/'validation-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8',newline='\n')
    print(json.dumps(report,indent=2));return bool(errors)

if __name__=='__main__':sys.exit(main())
