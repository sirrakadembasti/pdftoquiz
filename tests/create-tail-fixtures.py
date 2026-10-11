from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pathlib import Path
import fitz
root=Path('tests/fixtures');root.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('TailFont','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
def write(c,x,y,s,size=12):
 c.setFont('TailFont',size);c.drawString(x,800-y,s)
# A multi-line genuine answer followed immediately by footer and unrelated text.
c=canvas.Canvas(str(root/'tail-single.pdf'),pagesize=(600,800))
write(c,30,500,'1. Hangisi çok satırlı bir açıklamadır?')
for y,s in [(550,'A) Birinci'),(580,'B) İkinci'),(610,'C) Üçüncü'),(650,'D) Gerçek şık metni'),(665,'ikinci satırda devam eder.'),(680,'Sayfa 7'),(695,'KONTROL KODU: ZX-41'),(710,'Talimat: Sonraki bölüme geçiniz.')]:write(c,30,y,s)
c.showPage();write(c,30,75,'SONRAKİ SAYFANIN BAŞLIĞI');write(c,30,120,'2. Yeni sayfadaki soru?');write(c,30,160,'A) Evet');write(c,30,190,'B) Hayır');c.save()
# A narrow gutter where text pieces on either side share a baseline.
c=canvas.Canvas(str(root/'tail-columns.pdf'),pagesize=(600,800))
write(c,30,85,'1. Soldaki soru?');write(c,320,85,'2. Sağdaki soru?')
write(c,30,130,'A) Sol A');write(c,320,130,'A) Sağ A')
write(c,30,160,'B) Sol B');write(c,320,160,'B) Sağ B')
write(c,230,190,'C) Sol C');write(c,320,190,'C) Sağ C')
write(c,230,220,'D) Sol D');write(c,320,220,'D) Sağ D')
write(c,30,250,'TALİMAT: Cevapları kontrol edin.')
write(c,320,250,'FEN BİLİMLERİ TESTİ')
write(c,320,280,'3. Sonraki soru?');write(c,320,320,'A) 10');write(c,320,350,'B) 20');write(c,30,770,'— 8 —');c.save()
# Repeated custom marginal text and a watermark, then raster-only variant.
c=canvas.Canvas(str(root/'tail-repeated.pdf'),pagesize=(600,800))
for n in range(1,3):
 write(c,30,35,'ÖZEL DENEME • KİTAPÇIK '+str(n),10)
 write(c,30,510,f'{n}. Deneme sorusu?');write(c,30,550,'A) 1');write(c,30,585,'B) 2');write(c,30,620,'C) 3');write(c,30,650,'D) 4')
 write(c,30,675,'KURUM İÇİ KOPYA • '+str(n),10)
 write(c,30,700,'ÖRNEKTİR',10)
 write(c,30,730,'DİKKAT: Kitapçığı teslim ediniz.',10)
 write(c,30,770,str(n),10)
 c.showPage()
c.save()
doc=fitz.open(root/'tail-repeated.pdf');sc=canvas.Canvas(str(root/'tail-scanned.pdf'),pagesize=(600,800))
from reportlab.lib.utils import ImageReader
import io
for page in doc:
 pix=page.get_pixmap(matrix=fitz.Matrix(2,2));sc.drawImage(ImageReader(io.BytesIO(pix.tobytes('png'))),0,0,width=600,height=800);sc.showPage()
sc.save()
print('4 PDF üretildi: çok satırlı şık/sayfa geçişi, dar iki sütun, tekrar eden marj metni, taranmış tekrarlar.')
