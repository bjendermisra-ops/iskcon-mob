import tempfile,shutil,subprocess,json
from pathlib import Path
from PIL import Image
source=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as td:
 r=Path(td)/'repo';r.mkdir()
 for name in ['scripts','stickers']:
  shutil.copytree(source/name,r/name)
 for name in ['catalog-config.json','legacy-packs.json']:
  shutil.copy2(source/name,r/name)
 # Isolate tests from real uploaded sticker packs.
 shutil.rmtree(r/'stickers');(r/'stickers/bal-krishna/static/pack-01').mkdir(parents=True);(r/'stickers/bal-krishna/animated/pack-01').mkdir(parents=True)
 def run(ok=True):
  p=subprocess.run(['python3',str(r/'scripts/build_catalog.py')],capture_output=True,text=True)
  assert (p.returncode==0)==ok,p.stdout+p.stderr
 p=r/'stickers/bal-krishna/static/pack-01'
 for i in range(3):Image.new('RGBA',(650,420),(20*i,130,190,200)).save(p/f'कृष्ण {i}.png')
 run();d=json.loads((r/'packs.json').read_text());assert len(d['packs'])==3
 new=next(p for p in d['packs'] if p.get('category')=='Bal Krishna');assert len(new['stickers'])==3
 for s in new['stickers']:
  f=r/'generated'/new['id']/s['file'];assert Image.open(f).size==(512,512);assert f.stat().st_size<=102400
 a=r/'stickers/bal-krishna/animated/pack-01'
 for i in range(3):
  frames=[Image.new('RGBA',(512,512),c) for c in [(255,0,0,100),(0,255,0,100)]]
  frames[0].save(a/f'{i}.webp',save_all=True,append_images=frames[1:],duration=100,loop=0)
 run();assert len(json.loads((r/'packs.json').read_text())['packs'])==4
 before=(r/'packs.json').read_bytes();Image.new('RGB',(10,10)).save(a/'bad.webp');run(False);assert before==(r/'packs.json').read_bytes()
 (a/'bad.webp').unlink();(p/'कृष्ण 0.png').unlink();run(False);assert before==(r/'packs.json').read_bytes()
 print('PASS: Unicode filenames, conversion, dimensions, size, animated files, wrong-type rejection, minimum pack count, failed-build catalog preservation')
