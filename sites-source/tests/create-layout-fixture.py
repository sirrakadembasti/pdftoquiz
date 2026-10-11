"""Original small fixture for text structure and option boundaries."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
root=Path(__file__).resolve().parent
for name,font in [('Regular','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+font))
c=canvas.Canvas(str(root/'fixtures/layout-quality.pdf'),pagesize=(560,780))
def text(x,y,value,bold=False):
    c.setFont('Bold' if bold else 'Regular',11);c.drawString(x,y,value)
text(40,720,'1. • Birinci açıklama satırı')
text(60,704,'aynı maddeye devam eder.')
text(60,682,'• İkinci açıklama')
text(60,650,'Aşağıdaki anlamlardan hangisi kulla-',True)
text(60,634,'nılmamıştır?',True)
c.setLineWidth(.7);c.line(60,632,140,632)
text(60,580,'A) Birinci uzun cevap')
text(80,564,'ikinci satırı da içerir.')
text(300,580,'B) Sağdaki cevap')
text(320,564,'sağdaki devam satırı.')
text(60,540,'C) Üçüncü seçenek')
text(300,540,'D) Dördüncü seçenek')
c.showPage()
text(40,720,'2. Şekillerden uygun olanı seçiniz.')
for letter,x,y in [('A',60,640),('B',300,640),('C',60,440),('D',300,440)]:
    text(x,y,letter+')'+(' Şekil' if letter=='A' else ''))
    c.setStrokeColorRGB(.1,.3,.6);c.setFillColorRGB(.6,.8,.9)
    c.rect(x+20,y-100,100,80,stroke=1,fill=1)
    c.setFillColorRGB(0,0,0);c.setStrokeColorRGB(0,0,0)
c.save()
