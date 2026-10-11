from reportlab.pdfgen import canvas
from reportlab.lib.colors import red,black
c=canvas.Canvas('tests/fixtures/answer-colors.pdf',pagesize=(600,800))
c.setFont('Helvetica',12);c.drawString(45,720,'1. Which choice is marked?')
c.setFillColor(red);c.circle(200,680,15,fill=1,stroke=0)
c.setFillColor(black);c.drawString(55,630,'A) First');c.drawString(55,590,'B) Second')
c.setFillColor(red);c.drawString(55,550,'C) Colored choice');c.drawString(70,533,'continued colored text')
c.setFillColor(black);c.drawString(55,490,'D) Fourth with red diagram')
c.setFillColor(red);c.rect(70,420,30,30,fill=1,stroke=0)
c.showPage();c.save()
