"""Cross-platform paths and fonts for reproducible PDF test fixtures."""
from os import environ
from pathlib import Path
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FIXTURES = Path(__file__).resolve().parent / "fixtures"
FIXTURES.mkdir(parents=True, exist_ok=True)

def _font_candidates(bold: bool):
    configured = environ.get("PDFTOQUIZ_FIXTURE_FONT_BOLD" if bold else "PDFTOQUIZ_FIXTURE_FONT")
    names = ("DejaVuSans-Bold.ttf", "arialbd.ttf") if bold else ("DejaVuSans.ttf", "arial.ttf")
    roots = (
        Path("/usr/share/fonts/truetype/dejavu"),
        Path("C:/Windows/Fonts"),
        Path("/Library/Fonts"),
        Path.home() / "Library/Fonts",
    )
    if configured:
        yield Path(configured)
    for root in roots:
        for name in names:
            yield root / name

def register_fixture_font(name: str, bold: bool = False):
    font = next((path for path in _font_candidates(bold) if path.is_file()), None)
    if font is None:
        variable = "PDFTOQUIZ_FIXTURE_FONT_BOLD" if bold else "PDFTOQUIZ_FIXTURE_FONT"
        raise FileNotFoundError(f"Fixture yazı tipi bulunamadı; {variable} ile bir TTF yolu belirtin.")
    pdfmetrics.registerFont(TTFont(name, str(font)))
    return font
