"""Validate folder packs; preserve explicit legacy packs. Run from repository root."""
import hashlib, io, json, os, re, shutil, tempfile
from pathlib import Path
from urllib.parse import quote
from PIL import Image, ImageOps
ROOT=Path(__file__).resolve().parents[1]
def run():
 cfg=json.loads((ROOT/'catalog-config.json').read_text())
 packs=json.loads((ROOT/'legacy-packs.json').read_text())['packs']
 base=f"https://raw.githubusercontent.com/{cfg['repository']}/{cfg['branch']}/"
 errors=[]; warnings=[]
 # Legacy links are preserved, but missing local assets must not be installable.
 for pack in packs:
  if pack.get('baseUrl','').rstrip('/') == base.rstrip('/'):
   missing=[s['file'] for s in pack['stickers'] if not (ROOT/s['file']).is_file()]
   pack['available']=not missing
   pack['missingFiles']=missing
   if missing:warnings.append(pack['name']+': missing '+', '.join(missing))
 stage=Path(tempfile.mkdtemp(prefix='sticker-build-'))
 try:
  for folder in sorted((ROOT/'stickers').glob('*/*/*')):
   if not folder.is_dir():continue
   category,kind,slug=folder.relative_to(ROOT/'stickers').parts
   if kind not in ('static','animated'):
    errors.append(f'{folder}: use static or animated');continue
   files=sorted(p for p in folder.iterdir() if p.is_file() and not p.name.startswith('.') and p.name!='pack.json')
   if not files:continue
   if not 3<=len(files)<=30:
    errors.append(f'{folder.relative_to(ROOT)}: {len(files)} files; need 3–30. Use pack-02 for another pack.');continue
   meta=json.loads((folder/'pack.json').read_text()) if (folder/'pack.json').exists() else {}
   key='/'.join((category,kind,slug));pid='bhakti_'+hashlib.sha256(key.encode()).hexdigest()[:20]
   dest=stage/pid;dest.mkdir();stickers=[];digest=hashlib.sha256();first=None
   for source in files:
    try:
     if source.suffix.lower() not in ('.png','.jpg','.jpeg','.webp'):raise ValueError('use PNG/JPG/WebP for static or animated WebP')
     with Image.open(source) as im:
      animated=bool(getattr(im,'is_animated',False))
      if animated!=(kind=='animated'):raise ValueError('static/animated folder mismatch')
      if animated:
       if im.format!='WEBP' or im.size!=(512,512):raise ValueError('animated file must be 512 × 512 WebP')
       total=0
       for i in range(im.n_frames):
        im.seek(i);im.load();ms=im.info.get('duration',0)
        if ms<8:raise ValueError('each frame must last at least 8 ms')
        total+=ms
       if total>10000:raise ValueError('animation exceeds 10 seconds')
       data=source.read_bytes()
       if len(data)>500*1024:raise ValueError('animation exceeds 500 KB')
       im.seek(0);frame=im.convert('RGBA')
      else:
       frame=ImageOps.exif_transpose(im).convert('RGBA')
       frame.thumbnail((480,480),Image.Resampling.LANCZOS)
       canvas=Image.new('RGBA',(512,512));canvas.alpha_composite(frame,((512-frame.width)//2,(512-frame.height)//2));frame=canvas
       for quality in (90,80,70,60,45,30):
        out=io.BytesIO();frame.save(out,'WEBP',quality=quality,method=6);data=out.getvalue()
        if len(data)<=100*1024:break
       if len(data)>100*1024:raise ValueError('cannot compress below 100 KB')
      if frame.getextrema()[3][0]==255:warnings.append(f'{source.name}: opaque background; no automatic background removal')
      if first is None:first=frame.copy()
      # ASCII filenames independent of uploaded names, safe for the native downloader.
      name='s_'+hashlib.sha256(source.name.encode()).hexdigest()[:16]+'.webp'
      (dest/name).write_bytes(data);digest.update(name.encode());digest.update(data)
      stickers.append({'file':name,'image':base+'generated/'+pid+'/'+name,'emojis':meta.get('emojis',['🙏','🌸'])[:3]})
    except Exception as exc:errors.append(f'{source.relative_to(ROOT)}: {exc}')
   if len(stickers)!=len(files):continue
   first.thumbnail((96,96));tray=Image.new('RGBA',(96,96));tray.alpha_composite(first,((96-first.width)//2,(96-first.height)//2));tray.save(dest/'tray.png')
   digest.update((dest/'tray.png').read_bytes())
   packs.append(dict(id=pid,name=meta.get('name',cfg['categories'].get(category,category.replace('-',' ').title())+' • '+slug.replace('-',' ').title()),publisher=cfg['publisher'],category=cfg['categories'].get(category,category.replace('-',' ').title()),animated=kind=='animated',baseUrl=base+'generated/'+pid+'/',tray='tray.png',image_data_version=digest.hexdigest()[:16],stickers=stickers))
  if errors:raise ValueError('\n'.join(errors))
  ids=[p['id'] for p in packs]
  if len(ids)!=len(set(ids)):raise ValueError('Duplicate pack IDs')
  # Nothing published until every new local pack validates.
  target=ROOT/'generated';target.mkdir(exist_ok=True)
  for p in stage.iterdir():shutil.copytree(p,target/p.name,dirs_exist_ok=True)
  temp=ROOT/'packs.json.tmp';temp.write_text(json.dumps({'packs':packs},ensure_ascii=False,indent=2));temp.replace(ROOT/'packs.json')
  print(f'Published {len(packs)} packs. Existing remote legacy files are not validated.')
  for w in warnings:print('WARNING:',w)
 finally:shutil.rmtree(stage)
if __name__=='__main__':run()
