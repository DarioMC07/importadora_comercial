"""Extrae recursos de los PDF originales y genera una migración reproducible."""
from pathlib import Path
import pymupdf as fitz
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / 'Downloads'
OUT = ROOT / 'public' / 'aveli'
OUT.mkdir(parents=True, exist_ok=True)
catalog = fitz.open(DOWNLOADS / 'Catálogo AVÉLI_20261009_021736_0000.pdf')
manual = fitz.open(DOWNLOADS / 'Manual de identidad de AVÉLI_20261013_151323_0000.pdf')

def crop(page, box, name):
    w, h = page.rect.width, page.rect.height
    page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), clip=fitz.Rect(box[0]*w, box[1]*h, box[2]*w, box[3]*h)).save(str(OUT / name))

crop(manual[5], (.265, .085, .80, .66), 'logo.png')
blusas = [('Camisera clásica',75),('Satinada clásica',90),('De mangas abullonadas',85),('Péplum',85),('Cruzada',80),('Con capa de gasa',100),('De hombros descubiertos',80),('Asimétrica',85),('Halter',75),('De encaje',95)]
poleras = [('Básica cuello redondo',60),('Básica cuello cuadrado',65),('De escote drapeado',75),('De cuello barco',70),('De cuello alto sin mangas',65),('Polo',75),('Henley',70),('Térmica',80),('Cut-out',75),('Fruncida al costado',75)]
# Tonos aproximados de las muestras visuales; el catálogo no publica nombres oficiales.
colors = [
'#d5afaa,#e3d8c0,#541520,#ffffff,#000000', '#cfd0c8,#302c48,#d5afaa,#ffffff,#000000',
'#ece9db,#541520,#c79da0,#ffffff,#000000', '#f3ebde,#503655,#5b707c,#ffffff,#000000',
'#693f30,#302c48,#751725,#ffffff,#000000', '#192033,#f3ebde,#503655,#ffffff,#000000',
'#302c48,#542728,#808080,#ffffff,#000000', '#603736,#75794c,#d5afaa,#ffffff,#000000',
'#b87b85,#712637,#f3ebde,#ffffff,#000000', '#503655,#1e2031,#47051e,#3e231a,#000000',
'#1e2031,#c59595,#aa9278,#ffffff,#000000', '#c59595,#492c2c,#1e2031,#ffffff,#000000',
'#492c2c,#c8d1db,#f3ebde,#ffffff,#000000', '#570525,#5b707c,#503655,#ffffff,#000000',
'#1e2031,#c59595,#aa9278,#ffffff,#000000', '#223043,#3e231a,#496459,#ffffff,#000000',
'#751725,#503655,#f3ebde,#ffffff,#000000', '#302c48,#492c2c,#751725,#ffffff,#000000',
'#25252d,#503655,#f3ebde,#ffffff,#000000', '#75794c,#b87b85,#aa9278,#ffffff,#000000']
rows=[]
for group, entries, prefix, start in [('Blusas',blusas,'BL',4),('Poleras',poleras,'PL',10)]:
    for i,(name,price) in enumerate(entries):
        sku=f'AV-{prefix}{i+1:03}'
        crop(catalog[start+i//2], (.09,.215,.478,.54) if i%2==0 else (.09,.60,.478,.925), f'{sku}.png')
        rows.append(dict(sku=sku,name=('Blusa ' if prefix=='BL' else 'Polera ')+name[0].lower()+name[1:],category=group,sale_price=price,image_url=f'/aveli/{sku}.png',sizes='XS, S, M, L, XL',colors=colors[len(rows)],catalog_availability='Disponible',description='Siluetas delicadas para expresar tu estilo.' if prefix=='BL' else 'Esenciales modernos para cada momento.'))
sql="""-- Catálogo AVÉLI: sin inventar cantidades ni costos de compra.
alter table public.products
  add column if not exists image_url text,
  add column if not exists sizes text not null default '',
  add column if not exists colors text not null default '',
  add column if not exists catalog_availability text not null default 'Consultar disponibilidad';

insert into public.products (workspace_id, sku, name, category, sale_price, image_url, sizes, colors, catalog_availability, description)
select w.id, p.sku, p.name, p.category, p.sale_price, p.image_url, p.sizes, p.colors, p.catalog_availability, p.description
from public.seller_workspaces w
cross join jsonb_to_recordset($catalog$"""+json.dumps(rows,ensure_ascii=False)+"""$catalog$::jsonb)
as p(sku text, name text, category text, sale_price numeric, image_url text, sizes text, colors text, catalog_availability text, description text)
where w.slug = 'aveli'
on conflict (workspace_id, sku) do nothing;
"""
(ROOT/'supabase/migrations/0006_aveli_catalog.sql').write_text(sql,encoding='utf-8')
print(f'{len(rows)} prendas y logo extraídos; migración generada.')
if '--apply' in sys.argv:
    subprocess.run(['docker','exec','-i','supabase_db_import-marketplace','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'], input=sql.encode('utf-8'), check=True)
