"""Check that the audited reading paragraphs still match their recorded source pointers.

This validates coverage, text integrity, video identity, and timestamp existence.
It does not claim that a hash or a matching timestamp verifies a scientific proposition.
"""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
CHAPTERS=['attraction','biology','relationships','living','reality','society']

UPDATES=ROOT/'editorial/updates'

def source_catalog():
    baseline=json.loads((ROOT/'original/SOURCE_CORPUS/CATALOG.json').read_text(encoding='utf-8'))['videos']
    updates=json.loads((UPDATES/'videos.json').read_text(encoding='utf-8'))
    catalog = {video['ordinal']: video for video in baseline}
    ids = {video['video_id'] for video in baseline}
    for entry in updates:
        ordinal = entry['ordinal']
        video_id = entry['video_id']
        assert ordinal == len(catalog) + 1, (ordinal, 'invalid update ordinal')
        assert entry['status'] == 'reviewed', (video_id, 'update requires review')
        assert video_id not in ids, (video_id, 'duplicate source video ID')
        ids.add(video_id)
        catalog[ordinal] = {**entry, 'video_url': 'https://www.youtube.com/watch?v=' + video_id}
    return catalog

def check(catalog=None):
    if catalog is None:
        catalog=source_catalog()
    ledger=json.loads((ROOT/'editorial/source-grounding.json').read_text(encoding='utf-8'))['paragraphs']
    corpus=(ROOT/'original/SOURCE_CORPUS/JULIUS_KNOWLEDGEBASE.md').read_text(encoding='utf-8')
    sections=re.split(r'(?m)(?=^# )',corpus)
    sections=[s for s in sections if re.search(r'^- Video: https://www.youtube.com/watch',s,re.M)]
    baseline_count=len(sections)
    sections.extend((UPDATES/(v['video_id']+'.md')).read_text(encoding='utf-8')
                    for n,v in catalog.items() if n>baseline_count)
    records={(r['chapter'],r['paragraph']):r for r in ledger}
    count=links=0;used=set()
    note=re.compile(r'\s*\[V(\d{3,}) · ((?:\d\d:)?\d\d:\d\d)\]\((https://www.youtube.com/watch\?v=[^&\s)]+)&t=(\d+)s\)')
    for key in CHAPTERS:
        paragraphs=[p.strip() for p in (ROOT/f'editorial/{key}.md').read_text(encoding='utf-8').split('\n\n') if p.strip() and not p.startswith('#')]
        for i,p in enumerate(paragraphs,1):
            row=records[(key,i)];matches=list(note.finditer(p))
            assert matches,(key,i,'missing source note')
            body=note.sub('',p).strip()
            assert hashlib.sha256(body.encode()).hexdigest()==row['sha256'],(key,i,'paragraph changed after audit')
            pointers=[]
            for m in matches:
                ordinal,time,url,offset=m.groups();ordinal=int(ordinal);offset=int(offset)
                time_parts=[int(part) for part in time.split(':')]
                assert sum(part*60**i for i,part in enumerate(reversed(time_parts)))==offset,(key,i,'timestamp mismatch')
                assert catalog[ordinal]['video_url']==url,(key,i,'video mismatch')
                h,rem=divmod(offset,3600);minute,second=divmod(rem,60)
                stamp=f'{h:02d}:{minute:02d}:{second:02d}'
                assert (offset==0 and ordinal<=baseline_count) or f'[{stamp}]' in sections[ordinal-1],(key,i,'timestamp absent from consolidation')
                pointers.append((ordinal,stamp));used.add(ordinal);links+=1
            assert pointers==[(s['video'],s['time']) for s in row['sources']],(key,i,'pointer order mismatch')
            count+=1
    assert count==len(ledger)
    basis = 'Supplied transcript consolidation; source coverage and pointer checks, not a new viewing or scientific verification.'
    if any(ordinal > baseline_count for ordinal in used):
        basis = 'Supplied transcript consolidation and reviewed additions; source coverage and pointer checks.'
    report={'status':'PASS','chapters':len(CHAPTERS),'sourceLinkedParagraphs':count,'timestampLinks':links,'distinctSourceVideos':len(used),'basis':basis}
    (ROOT/'source-grounding-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
    return report
if __name__=='__main__': print(json.dumps(check(),indent=2))
