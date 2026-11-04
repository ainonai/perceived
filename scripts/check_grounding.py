"""Check that the audited reading paragraphs still match their recorded source pointers.

This validates coverage, text integrity, video identity, and timestamp existence.
It does not claim that a hash or a matching timestamp verifies a scientific proposition.
"""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
CHAPTERS=['attraction','biology','relationships','living','reality','society']

def check():
    ledger=json.loads((ROOT/'editorial/source-grounding.json').read_text())['paragraphs']
    catalog={v['ordinal']:v for v in json.loads((ROOT/'original/SOURCE_CORPUS/CATALOG.json').read_text())['videos']}
    corpus=(ROOT/'original/SOURCE_CORPUS/JULIUS_KNOWLEDGEBASE.md').read_text()
    sections=re.split(r'(?m)(?=^# )',corpus)
    sections=[s for s in sections if re.search(r'^- Video: https://www.youtube.com/watch',s,re.M)]
    records={(r['chapter'],r['paragraph']):r for r in ledger}
    count=links=0;used=set()
    note=re.compile(r'\s*\[V(\d{3}) · (\d\d):(\d\d)\]\((https://www.youtube.com/watch\?v=[^&\s)]+)&t=(\d+)s\)')
    for key in CHAPTERS:
        paragraphs=[p.strip() for p in (ROOT/f'editorial/{key}.md').read_text().split('\n\n') if p.strip() and not p.startswith('#')]
        for i,p in enumerate(paragraphs,1):
            row=records[(key,i)];matches=list(note.finditer(p))
            assert matches,(key,i,'missing source note')
            body=note.sub('',p).strip()
            assert hashlib.sha256(body.encode()).hexdigest()==row['sha256'],(key,i,'paragraph changed after audit')
            pointers=[]
            for m in matches:
                ordinal,minutes,seconds,url,offset=m.groups();ordinal=int(ordinal);offset=int(offset)
                assert int(minutes)*60+int(seconds)==offset,(key,i,'timestamp mismatch')
                assert catalog[ordinal]['video_url']==url,(key,i,'video mismatch')
                h,rem=divmod(offset,3600);minute,second=divmod(rem,60)
                stamp=f'{h:02d}:{minute:02d}:{second:02d}'
                assert offset==0 or f'[{stamp}]' in sections[ordinal-1],(key,i,'timestamp absent from consolidation')
                pointers.append((ordinal,stamp));used.add(ordinal);links+=1
            assert pointers==[(s['video'],s['time']) for s in row['sources']],(key,i,'pointer order mismatch')
            count+=1
    assert count==len(ledger)
    report={'status':'PASS','chapters':len(CHAPTERS),'sourceLinkedParagraphs':count,'timestampLinks':links,'distinctSourceVideos':len(used),'basis':'Supplied transcript consolidation; source coverage and pointer checks, not a new viewing or scientific verification.'}
    (ROOT/'source-grounding-report.json').write_text(json.dumps(report,indent=2)+'\n')
    return report
if __name__=='__main__': print(json.dumps(check(),indent=2))
