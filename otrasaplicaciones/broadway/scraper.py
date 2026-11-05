#!/usr/bin/env python3
"""
Scraper de cartelera para Cines Broadway Valladolid.
Fuentes: eCartelera + FilmAffinity
Genera: cartelera.json en la raíz del repositorio.
"""

import json, re, time
from datetime import datetime
from urllib.request import urlopen, Request
from urllib.parse import urlencode, quote
from html.parser import HTMLParser

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    'Accept-Language': 'es-ES,es;q=0.9',
}

ECARTELERA_URL = 'ecartelera.com/cines/497,0,1.html'

def get_html(url, retries=3):
    for i in range(retries):
        try:
            req = Request(url, headers=HEADERS)
            with urlopen(req, timeout=15) as r:
                return r.read().decode('utf-8', errors='replace')
        except Exception as e:
            if i == retries - 1:
                raise
            time.sleep(2)

# ── Parser eCartelera ──────────────────────────────────────────────────────────

class ECarteleraParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.movies = []
        self.seen = set()
        self._in_movie = False
        self._depth = 0
        self._movie_start_depth = 0
        self._buf = []
        self._current = None
        self._collecting_title = False
        self._title_href = None
        self._horarios = []
        self._poster = None
        self._stack = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self._stack.append(tag)

        href = attrs.get('href', '')
        src  = attrs.get('src', '')

        # Detectar enlace de película
        if tag == 'a' and href.startswith('/peliculas/'):
            titulo_candidato = True
            self._title_href = href
            self._collecting_title = True

        # Detectar enlace de horario
        if tag == 'a' and href.startswith('/cines/comprar/'):
            self._in_horario = True

        # Detectar póster
        if tag == 'img' and '/carteles/' in src:
            if self._current and not self._current.get('poster'):
                self._current['poster'] = src.replace('_mini.jpg', '_large.jpg')

    def handle_endtag(self, tag):
        if self._stack and self._stack[-1] == tag:
            self._stack.pop()
        if tag == 'a':
            self._collecting_title = False
            self._in_horario = False if hasattr(self, '_in_horario') else False

    def handle_data(self, data):
        d = data.strip()
        if not d:
            return
        if self._collecting_title and self._title_href:
            if d and d not in self.seen and len(d) > 1:
                self.seen.add(d)
                self._current = {
                    'titulo': d,
                    'peliculaPath': self._title_href,
                    'poster': None,
                    'rawText': '',
                }
                self.movies.append(self._current)
            self._collecting_title = False
            self._title_href = None
        if self._current:
            self._current['rawText'] = (self._current.get('rawText','') + ' ' + d).strip()
        if hasattr(self, '_in_horario') and self._in_horario:
            if re.match(r'^\d{1,2}:\d{2}$', d):
                if self._current:
                    self._current.setdefault('horarios', [])
                    if d not in self._current['horarios']:
                        self._current['horarios'].append(d)


def parse_ecartelera(html):
    movies = []
    seen = set()

    # 1. Separar bloques de películas admitiendo tanto rutas absolutas (https://...) como relativas
    parts = re.split(r'(?=<a[^>]+href="[^"]*/peliculas/)', html)

    for part in parts:
        # Extraer el enlace a la ficha de la película
        link_match = re.search(r'<a[^>]+href="([^"]*/peliculas/[^"]+)"', part, re.IGNORECASE)
        if not link_match:
            continue
        path = link_match.group(1)

        # 2. ¡Usamos tu descubrimiento! Extraemos el título y el cartel desde la etiqueta <img>
        img_match = re.search(r'<img[^>]+src="([^"]+/carteles/[^"]+_mini\.jpg)"[^>]*alt="([^"]+)"', part, re.IGNORECASE)
        
        titulo = ""
        poster = ""
        if img_match:
            poster = img_match.group(1).replace('_mini.jpg', '_large.jpg')
            titulo = img_match.group(2).strip() # Sacamos el título limpio del atributo "alt"
        else:
            # Respaldo por si alguna peli no tiene póster
            t_match = re.search(r'>\s*([^<]{2,80})\s*</a>', link_match.group(0))
            if t_match:
                titulo = re.sub(r'<[^>]+>', '', t_match.group(1)).strip()

        if not titulo or titulo in seen or len(titulo) < 2:
            continue
        seen.add(titulo)

        # 3. Extraer horarios de los botones de compra (también admitiendo rutas absolutas)
        horarios = list(dict.fromkeys(re.findall(r'<a[^>]+href="[^"]*/cines/comprar/[^"]*"[^>]*>\s*(\d{1,2}:\d{2})\s*</a>', part, re.IGNORECASE)))
        
        # Respaldo por si han quitado el enlace en los horarios y ahora son texto normal
        if not horarios:
            horarios = list(dict.fromkeys(re.findall(r'\b([0-2]?[0-9]:[0-5][0-9])\b', part)))

        # 4. Extraer el resto de información
        text = re.sub(r'<[^>]+>', ' ', part)
        text = re.sub(r'\s+', ' ', text)
        dm = re.search(r'Dir\.?\s*:?\s*([A-ZÁÉÍÓÚÜÑ][^\n<]{3,50})', text, re.IGNORECASE)
        director = dm.group(1).strip()[:60] if dm else 'Desconocido'

        gm = re.search(r'(\d+ min\.)?\s*(?:[A-ZÁÉÍÓÚÜ][a-záéíóúüñ]+(?: del [A-Za-z]+)?)\s+([\wáéíóúüñÁÉÍÓÚÜÑ \/+]{3,25}?)(?:\s+Dir|\s*$)', text, re.MULTILINE)
        genero = gm.group(2).strip() if gm else 'Sin clasificar'

        tags = []
        if re.search(r'\bVOSE\b', part, re.I): tags.append('VOSE')
        if '+18' in part: tags.append('+18')
        elif '+16' in part: tags.append('+16')
        elif '+12' in part: tags.append('+12')
        if not tags: tags.append('2D')

        nm = re.search(r'\b([6-9]\.[0-9])\b', text)
        nota_ec = float(nm.group(1)) if nm else 0

        movies.append({
            'titulo': titulo,
            'peliculaPath': path,
            'poster': poster,
            'director': director,
            'genero': genero,
            'tags': tags,
            'horarios': horarios if horarios else ['Consultar web'],
            'nota_ec': nota_ec,
        })

    return movies

# ── FilmAffinity ───────────────────────────────────────────────────────────────

def fetch_filmaffinity(titulo):
    try:
        url = f'https://www.filmaffinity.com/es/search.php?stext={quote(titulo)}&stype=tit'
        html = get_html(url)

        # Ver si hay redirección directa a la ficha
        film_url = None
        canon = re.search(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', html)
        if canon and re.search(r'film\d+\.html', canon.group(1)):
            film_url = canon.group(1)

        # Si hay lista, coger el primer resultado
        if not film_url:
            first = re.search(r'class="mc-title"[^>]*>.*?<a[^>]+href="(/film\d+\.html)"', html, re.DOTALL)
            if first:
                film_url = 'https://www.filmaffinity.com/es' + first.group(1)

        if not film_url:
            return None

        time.sleep(0.5)
        fhtml = get_html(film_url)

        # Rating
        rm = re.search(r'id="movie-rat-avg"[^>]*>\s*([\d,]+)', fhtml)
        rating = float(rm.group(1).replace(',', '.')) if rm else 0

        # Votos
        vm = re.search(r'id="movie-count-rat"[^>]*>\s*([\d.,]+)', fhtml)
        votos = vm.group(1) if vm else 'Sin datos'

        # Sinopsis
        sm = re.search(r'id="plot-txt-\d+"[^>]*>\s*(.*?)\s*</p>', fhtml, re.DOTALL)
        sinopsis = re.sub(r'\s+', ' ', sm.group(1)).strip()[:500] if sm else ''
        sinopsis = re.sub('<[^>]+>', '', sinopsis).strip()

        # Título original
        om = re.search(r'itemprop="alternativeHeadline"[^>]*>\s*([^<]+)', fhtml)
        original_title = om.group(1).strip() if om else ''

        return {'rating': rating, 'votos': votos, 'sinopsis': sinopsis,
                'url': film_url, 'originalTitle': original_title}
    except Exception as e:
        print(f'  FilmAffinity error para "{titulo}": {e}')
        return None


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print(f'Scraping eCartelera: {ECARTELERA_URL}')
    html = get_html(ECARTELERA_URL)

    movies = parse_ecartelera(html)
    print(f'Películas encontradas: {len(movies)}')

    result = []
    for i, m in enumerate(movies):
        print(f'[{i+1}/{len(movies)}] {m["titulo"]} — buscando en FilmAffinity…')
        fa = fetch_filmaffinity(m['titulo'])
        time.sleep(0.8)  # respetar rate limit

        if fa and fa['rating'] > 0:
            val = (f'Muy bien valorada: {fa["rating"]:.1f}/10.' if fa['rating'] >= 7.5 else
                   f'Buena acogida: {fa["rating"]:.1f}/10.' if fa['rating'] >= 6.0 else
                   f'Valoración discreta: {fa["rating"]:.1f}/10.')
        elif m['nota_ec']:
            val = f'Nota {m["nota_ec"]}/10 en eCartelera.'
        else:
            val = 'Sin valoración disponible aún.'

        result.append({
            'id': str(i + 1),
            'titulo': m['titulo'],
            'originalTitle': fa['originalTitle'] if fa else '',
            'director': m['director'],
            'genero': m['genero'],
            'tags': m['tags'],
            'horarios': m['horarios'],
            'poster': m['poster'],
            'filmaffinity': {
                'rating': fa['rating'] if fa else m['nota_ec'],
                'votos': fa['votos'] if fa else ('eCartelera' if m['nota_ec'] else 'Sin datos'),
                'sinopsis': fa['sinopsis'] if fa else '',
                'valoracionGeneral': val,
                'url': fa['url'] if fa else 'https://www.filmaffinity.com/es/',
            }
        })

    output = {
        'generado': datetime.now().isoformat(),
        'cine': 'Cines Broadway Valladolid',
        'fuente': 'eCartelera + FilmAffinity',
        'peliculas': result,
    }

    with open('cartelera.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f'cartelera.json generado con {len(result)} películas.')

if __name__ == '__main__':
    main()
