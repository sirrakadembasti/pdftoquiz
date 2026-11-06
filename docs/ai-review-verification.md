# AI inceleme açıklamaları — doğrulama özeti

Tarih: 16 Ekim 2026 (Europe/Istanbul)

Bu belge tarihli doğrulama kaydıdır. Güncel toplu test sonuçları için [TEST-REPORT.md](TEST-REPORT.md) belgesine bakın.

## Tamamlanan değişiklikler

- AI kalite hedeflerinde ham teknik kodlar yerine Türkçe nedenler gösteriliyor.
- Blok hedeflerinde soru numarası, sayfa ve varsa bölüm adı gösteriliyor.
- Eksik şıklar A–E harfleriyle belirtiliyor.
- AI sonucu; uygulandı, onay bekliyor, yerel sonuç korundu, kullanıcı işlemi gerekiyor, atlandı veya teknik olarak tamamlanamadı biçiminde açıklanıyor.
- Geçersiz AI yanıtı ve sağlayıcı hataları, yerel içeriğin değiştirilmediğini açıkça belirtiyor.
- Kırmızı piksel temizleme bildirimi yalnız AI sağlayıcısına gönderilen geçici kopyanın değiştiğini; yerel taslak ve öğretmen kaynağının korunmuş olduğunu açıklıyor.
- AI önerisi uygulandığında kalite planı, Çözümleme özeti ve Şüpheli sorular listesi aynı React sınav durumundan anında yeniden hesaplanıyor.
- AI gönderim onayı ve kaynak rozetleri de teknik kod yerine Türkçe gerekçe gösteriyor.

## Tarihli doğrulama sonucu

- Hedefli hibrit + FAZ 3I testleri: 25 geçti, 1 koşullu referans testi atlandı, 0 başarısız.
- Tam test paketi: çıkış kodu 0. Paket kapsamı 216 test kaydı; 207 geçti, bulunmayan harici referans dosyalarına bağlı 9 test atlandı.
- Next.js 16.4.0 üretim derlemesi: başarılı.
- TypeScript kontrolü: başarılı.
- Uygulama içi gerçek tarayıcı: ham kod görünürlüğü `false`; Türkçe neden ve “Yerel sonuç korundu” durumu doğrulandı.
- Öneri uygulama regresyonu: `Kontrol gereken` ve şüpheli soru sayısı 1’den 0’a indi.
- Ana kaynaklar ile `sites-source` aynalarının SHA-256 değerleri eşit.

Terminal Chromium başlatıcısı işletim sistemi katmanında 180 saniye zaman aşımına uğradı. Aynı görünür arayüz kontrolü Codex uygulama içi tarayıcısında başarıyla tamamlandı. Doğrulama sırasında üretilen ekran görüntüsü ve tarayıcı denetim JSON’u geçici `output/` alanında tutulmuş, daha sonraki yerel çıktı temizliğinde kaldırılmıştır.
