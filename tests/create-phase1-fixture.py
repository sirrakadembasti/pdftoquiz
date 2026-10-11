"""Small, original fixture. No MEB source content or pages are copied."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont('Fixture','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
root=Path(__file__).resolve().parent
c=canvas.Canvas(str(root/'fixtures/phase1-sections.pdf'),pagesize=(560,780))
def text(x,y,t,size=11):
 c.setFont('Fixture',size);c.drawString(x,y,t)
def page():c.showPage()
text(35,735,'ÖZGÜN SENTETİK SINAV',16);text(450,710,'A');text(420,690,'KİTAPÇIK TÜRÜ',9)
text(70,650,'DERS ADI');text(240,650,'SORU SAYISI');text(350,650,'TOPLAM SORU');text(465,650,'SINAV SÜRESİ',8);text(465,635,'(DAKİKA)',8)
lessons=['TÜRKÇE','MATEMATİK','FEN BİLİMLERİ','SOSYAL BİLGİLER']
for i,l in enumerate(lessons):text(70,605-i*22,l,9);text(255,605-i*22,'2')
text(385,570,'8');text(480,570,'20');text(65,450,'ADAYLARIN DİKKATİNE')
for i in range(1,4):text(65,410-i*25,f'{i}. Başlamadan önce açıklamaları okuyunuz.')
page()
for i,l in enumerate(lessons):
 text(40,750,'5. SINIF');text(170,750,l+' TESTİ');text(500,750,'A')
 for j,x in enumerate([45,295]):
  text(x,710,f'{j+1}. Örnek soru metni?')
  text(x+30,660,'1. İç bilgi; ayrı soru değildir.',8)
  c.rect(x+30,550,130,80)
  text(x+35,585,'Özgün şekil',9)
  for k,v in enumerate(['Bir','İki','Üç','Dört']):text(x+20,500-k*24,f'{chr(65+k)}) {v}')
 text(350,110,l+' TESTİ BİTTİ.',8);text(265,25,str(i+2));page()
text(40,750,'5. SINIF');text(170,750,'SOSYAL BİLGİLER TESTİ')
text(45,710,'DİN KÜLTÜRÜ VE AHLAK BİLGİSİ DERSİNİ',9);text(45,685,'OKUMAYANLAR AŞAĞIDAKİ SORULARI',9)
text(45,640,'2. Alternatif özgün soru?')
for k,v in enumerate(['Bir','İki','Üç','Dört']):text(65,580-k*24,f'{chr(65+k)}) {v}')
page();page()
text(60,700,'SINAV SÜRESİNCE UYULACAK KURALLAR')
text(60,630,'1. Kaynak üzerinde not alabilirsiniz.')
c.save()
