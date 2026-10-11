from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pathlib import Path
root=Path('tests/fixtures');pdfmetrics.registerFont(TTFont('ParseFont','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
def text(c,y,s,x=30,size=12):c.setFont('ParseFont',size);c.drawString(x,800-y,s)
def footer(c):
 text(c,30,'MATEMATİK TESTİ',size=9)
 text(c,775,'SINAV KOPYASI',size=9)
def options(c,start,labels,contents=None):
 for i,label in enumerate(labels):text(c,start+i*30,label+' '+(contents[i] if contents else str(i+1)))
c=canvas.Canvas(str(root/'parse-formats.pdf'),pagesize=(600,800));text(c,55,'Bu sınav toplam 3 sorudan oluşmaktadır.');text(c,120,'Soru 1 Noktasız başlık?');options(c,170,['A.','B.','C.','D.']);text(c,380,'2- Parantezli şıklar?');options(c,430,['(A)','(B)','(C)','(D)','(E)']);footer(c);c.showPage();text(c,120,'3) Son soru?');options(c,170,['A)','B)','C)','D)']);footer(c);c.showPage();text(c,100,'CEVAP ANAHTARI');text(c,160,'1 D   2 (E)   3 B');c.save()
c=canvas.Canvas(str(root/'parse-split.pdf'),pagesize=(600,800));text(c,70,'Bu sınav toplam 3 sorudan oluşmaktadır.');text(c,650,'Soru 1 Sayfalar arasına bölünmüş');text(c,675,'soru metninin ilk parçası');footer(c);c.showPage();text(c,95,'ikinci sayfada tamamlanır.');options(c,150,['A)','B)','C)','D)']);text(c,560,'2. Son şıkkı sonraki sayfaya uzanan soru?');options(c,640,['A)','B)','C)','D)'],['Bir','İki','Üç','Dördüncü şıkkın ilk satırı']);footer(c);c.showPage();text(c,95,'ve ikinci satırı da burada devam eder.');text(c,410,'3- Beş şıklı normal soru?');options(c,470,['A)','B)','C)','D)','E)']);footer(c);c.showPage();text(c,100,'CEVAP ANAHTARI');text(c,160,'1 D  2 A  3 E');c.save()
c=canvas.Canvas(str(root/'parse-split-options.pdf'),pagesize=(600,800));text(c,70,'Bu test 2 soru');text(c,620,'1. Şıkları iki sayfaya ayrılan soru?');options(c,675,['A)','B)']);footer(c);c.showPage();options(c,110,['(C)','(D)','(E)'],['Üç','Dört','Beş']);text(c,340,'Soru 2 Yeni soru?');options(c,390,['A.','B.','C.','D.']);footer(c);c.showPage();text(c,100,'CEVAP ANAHTARI');text(c,160,'1 E 2 C');c.save()
c=canvas.Canvas(str(root/'parse-incomplete.pdf'),pagesize=(600,800));text(c,70,'Bu test 3 soru');text(c,120,'1. Eksik seçenekli soru?');options(c,170,['A)']);text(c,310,'2. C şıkkı eksik soru?');options(c,360,['A)','B)','D)']);text(c,550,'Soru 3');options(c,600,['A)','B)','C)','D)']);c.showPage();text(c,100,'CEVAP ANAHTARI');text(c,160,'1 A 1 B 2 E');c.save()
c=canvas.Canvas(str(root/'parse-empty.pdf'),pagesize=(600,800));text(c,100,'Bu belge yalnız açıklama içeriyor.');text(c,150,'Soru veya şık bulunmuyor.');c.save()
print('5 PDF: biçimler, bölünmüş gövde/D şıkkı, bölünmüş A-E şıkları, eksik/çelişkili kaynak ve sorusuz belge.')
import fitz,io
from reportlab.lib.utils import ImageReader
sc=canvas.Canvas(str(root/'parse-split-scanned.pdf'),pagesize=(600,800))
for page in fitz.open(root/'parse-split-options.pdf'):
 pix=page.get_pixmap(matrix=fitz.Matrix(2,2));sc.drawImage(ImageReader(io.BytesIO(pix.tobytes('png'))),0,0,width=600,height=800);sc.showPage()
sc.save()
