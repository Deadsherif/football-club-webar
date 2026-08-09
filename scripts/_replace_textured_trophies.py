"""Replace public trophy GLBs with textured models."""
from __future__ import annotations

import re
import shutil
from pathlib import Path

SRC_DIR = Path(r'D:\AhmedRashad\FirstOption\FirstOption\ALAHLY\trophies') / '3D-models textured'
DST_DIR = Path(r'D:\AhmedRashad\FirstOption\FirstOption\ALAHLY\football-club-webar\public\models\trophies')

SLUG = {
    'Egyptian Premier League': 'egyptian-premier-league',
    'Egypt Cup': 'egypt-cup',
    'Egyptian Super Cup': 'egyptian-super-cup',
    'Sultan Hussein Cup': 'sultan-hussein-cup',
    'Cairo League': 'cairo-league',
    'CAF Champions League': 'caf-champions-league',
    'CAF Confederation Cup': 'caf-confederation-cup',
    'CAF Super Cup': 'caf-super-cup',
    'FIFA African-Asian-Pacific Cup': 'fifa-african-asian-pacific-cup',
    'Afro-Asian Club Championship': 'afro-asian-club-championship',
    'Arab Club Champions Cup': 'arab-club-champions-cup',
    "Arab Cup Winners' Cup": 'arab-cup-winners-cup',
    'FIFA Club World Cup': 'fifa-club-world-cup',
}


def norm(s: str) -> str:
    s = s.replace('\u2013', '-').replace('\u2014', '-').replace('\u2011', '-')
    return re.sub(r'\s+', ' ', s.strip()).lower()


def resolve(name: str) -> str | None:
    n = norm(name)
    for c in SLUG:
        if norm(c) == n:
            return c
    if 'african' in n and 'pacific' in n:
        return 'FIFA African-Asian-Pacific Cup'
    if 'arab' in n and 'winners' in n:
        return "Arab Cup Winners' Cup"
    if 'club world' in n or 'club-world' in n:
        return 'FIFA Club World Cup'
    if 'afro-asian' in n or 'afroasian' in n.replace('-', ''):
        return 'Afro-Asian Club Championship'
    if 'arab' in n and 'champions' in n:
        return 'Arab Club Champions Cup'
    return None


def main() -> None:
    src_files = list(SRC_DIR.glob('*.glb'))
    if not src_files:
        raise SystemExit(f'No GLBs in {SRC_DIR}')

    for canon, slug in SLUG.items():
        match = None
        for p in src_files:
            resolved = resolve(p.stem)
            if resolved == canon or norm(p.stem) == norm(canon):
                match = p
                break
            if canon.startswith('FIFA African') and 'african' in norm(p.stem) and 'pacific' in norm(p.stem):
                match = p
                break
        if not match:
            raise SystemExit(f'Missing source for {canon!r}')

        dest = DST_DIR / f'{slug}.glb'
        old = dest.stat().st_size if dest.exists() else 0
        shutil.copy2(match, dest)
        print(f'{match.name!r} => {dest.name}  ({old} => {dest.stat().st_size})')


if __name__ == '__main__':
    main()
