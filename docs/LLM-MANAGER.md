# LLM Manager (`/llm` paneli) — kurulum ve kullanım

## Ne işe yarar?

LLM Manager, yapay zekâ sağlayıcılarının (OpenAI, Gemini, Anthropic, DeepSeek, Groq, Ollama vb.) **model ve API anahtarı ayarlarını tek bir web panelinde** tutmanızı sağlayan ayrı bir pakettir (`@sirrakadembasti/llm-manager`, sizin GitHub paketiniz). Panelde bir "profil" oluşturursunuz: sağlayıcı + model + API anahtarı. Anahtarlar şifrelenip sunucudaki `data/` klasöründe saklanır, tarayıcıya geri gönderilmez. Aynı panelden profili test edebilir, sohbet edebilir ve etkin profili seçebilirsiniz.

## Uygulamada iki ayrı yapay zekâ yolu var

| | PDF kalite kontrolü (eski, çalışıyor) | LLM Manager (yeni) |
|---|---|---|
| Nerede | Sınav düzenleyicisindeki AI düğmeleri, `/api/ai` | `http://127.0.0.1:3000/llm` |
| API anahtarı nerede | Siz sekmede girersiniz, yalnız tarayıcı belleğinde durur | Panelde bir kez girilir, şifreli `data/` dosyasında saklanır |
| Uygulama kullanıyor mu? | Evet | **Henüz hayır.** Panel hazır ama düzenleyici bu profilleri kullanmıyor |

Yani şu an LLM Manager, uygulamanın AI özelliğini değiştirmez; yalnızca profil yönetim ve deneme paneli ekler. Uygulamanın kendi kodundan bu profille soru sormak için `llm.js` içindeki `askLLM(prompt)` vardır, ama `app/actions/llm.js` içindeki `ask` eylemi, öğretmen oturumuna bağlanana kadar bilerek hata verir.

## Nasıl çalışır?

```
Tarayıcı  →  /llm (panel)  →  /api/llm/... (rotalar)  →  llm-manager çekirdeği  →  OpenAI/Gemini/...
                                                              ↓
                                                  data/llm-profiles.json (şifreli)
                                                  data/llm-encryption.key
```

Projede sihirbazın eklediği dosyalar: `llm.js` (yönetici oluşturur ve `.env` okur), `app/llm/[[...slug]]/route.js` (panel sayfası), `app/api/llm/[...slug]/route.js` (API), `app/actions/llm.js` (kilitli sunucu eylemi), `.llm-manager.json` (yol ayarları). Panel ve API **temel (Basic) kimlik doğrulama** ister: tarayıcı kullanıcı adı ve parola penceresi açar.

## Çalıştırmak için yapılacaklar

1. **Paketi kurun.** Kod projede hazır, ama paket `node_modules` içinde olmalı. Ağ kısıtı olmayan bir makinede: `pnpm install --frozen-lockfile`. (Bu bilgisayardaki durum için [GELISTIRICI-REHBERI.md](GELISTIRICI-REHBERI.md), bölüm 6.) Paket yoksa `dev`/`build` şu hatayı verir: `Can't resolve '@sirrakadembasti/llm-manager/core'`.
2. **Parola tanımlayın.** Proje klasöründeki `.env` dosyasına şu iki satır gerekir (örnek: `.env.example`):

   ```
   LLM_ADMIN_USER=admin
   LLM_ADMIN_PASSWORD=<kendi güçlü parolanız>
   ```

   Parola olmazsa panel hiç açılmaz ve şu hatayı verir: `{"code":"AUTH_NOT_CONFIGURED","error":"Kimlik doğrulama yapılandırılmadı."}`. Bu hata paketin bozuk olduğunu değil, yalnızca parolanın tanımlanmadığını gösterir. **Bu projedeki `.env` dosyasına 16 Kasım 2026'da rastgele bir parola eklendi**; değerini görmek için `.env` dosyasını açın ve `LLM_ADMIN_PASSWORD` satırına bakın (isterseniz değiştirin).
3. **Sunucuyu yeniden başlatın.** `.env` değişiklikleri çalışan sunucuya yansımaz. `dev` sunucusunu durdurup `pnpm dev` ile yeniden başlatın.
4. **Panele girin.** `http://127.0.0.1:3000/llm` adresini açın. Tarayıcı kullanıcı adı ve parola sorar: kullanıcı `admin`, parola `.env` içindeki `LLM_ADMIN_PASSWORD`.
5. **Profil ekleyin.** Paneldeki **LLM Yönetimi** sekmesinde **Yeni profil** ile profil adı, sağlayıcı, model ve API anahtarını girin → **Profili kaydet** → profil kartından bağlantı testi → **Etkinleştir**. **Modelleri getir (canlı)** düğmesi hesabınızın erişebildiği modelleri listeler. Aynı anda tek profil etkindir.
6. **Deneyin.** **Proje Asistanı** sekmesindeki **Model denemesi** türüyle bir mesaj gönderip yanıt alın.

## Ayarlar ve bilinmesi gerekenler

- **Kurulum sihirbazı:** Bu projede sihirbaz zaten çalıştırılmış ve dosyalar üretilmiştir (`.llm-manager.json` içinde listelenir). Yeniden çalıştırmak gerekirse `pnpm llm init` (paketin `llm-manager` komutu). `next.config.ts` paketi `serverExternalPackages` ile derleme dışında tutar.
- **Veri klasörü:** Profiller, şifreli API anahtarları ve sohbet geçmişi `LLM_DATA_DIR` klasörüne yazılır (varsayılan proje kökündeki `data/`). `data/`, `.env*` ve `*.key` git dışıdır.
- **Kullanım sayacı:** Panelin aylık kullanım özeti varsayılan olarak kapalıdır ve 0 gösterir. `.env` içine `LLM_USAGE_LOG=true` yazıp sunucuyu yeniden başlatınca istekler `data/usage-YYYY-MM.jsonl` dosyasına yazılır. Özetteki toplam token yalnızca girdi + çıktıdır; Gemini gibi modellerin gizli "düşünme" tokenları sayılmaz, bu yüzden sağlayıcının faturasındaki toplam daha yüksek çıkabilir (denemede istek başına yaklaşık 100–300 token fark).
- **Proje Asistanı:** Panelin ikinci sekmesi, `LLM_PROJECT_ROOT` ile gösterilen klasörü tarayıp kaynaklı sohbet sunar. Üretim (standalone) sunucusu çalışma dizinini değiştirdiği için bu değer **mutlak yol** olmalıdır.
- **Üretimde:** İnternete açarken paneli yalnızca HTTPS arkasında kullanın (temel kimlik doğrulama parolayı her istekte gönderir).
- **Uygulama içinden kullanım:** `app/actions/llm.js` içindeki Server Action, uygulamanın öğretmen yetkilendirmesi bağlanana kadar bilerek kapalıdır.

## Yedekleme

`data/llm-profiles.json` ve `data/llm-encryption.key` dosyalarını **birlikte** saklayın. Anahtar dosyası kaybolursa kayıtlı profiller çözülemez. Varsa `data/llm-profiles.json.assistant.enc` (sohbet geçmişi) de aynı çiftle birlikte yedeklenmelidir. `data/` zaten git dışıdır.

## Sorun giderme

| Belirti | Neden | Çözüm |
|---|---|---|
| `Can't resolve '@sirrakadembasti/llm-manager/core'` | Paket `node_modules` içinde yok | 1. adım |
| `AUTH_NOT_CONFIGURED` (500) | `.env` içinde `LLM_ADMIN_PASSWORD` yok ya da sunucu yeniden başlatılmadı | 2. ve 3. adım |
| Tarayıcı parola sorup tekrar soruyor (401) | Kullanıcı adı veya parola yanlış | `.env` değerlerini kontrol edin |
| `Çok fazla hatalı giriş denemesi` (429) | Art arda yanlış parola | Bir süre bekleyin |

## Doğrulananlar ve doğrulanmayanlar

Doğrulandı (16 Kasım 2026, üretim derlemesi, geçici test portu ve geçici veri klasörüyle): `/llm` kimlik bilgisiz 401, `.env`'deki parolayla 200; `/api/llm/catalog` ve `/api/llm/profiles` 200. Doğrulanmadı: gerçek bir sağlayıcıyla profil testi ve sohbet (API anahtarı gerekir), uygulama içinden `ask` eylemi, üretim sunucusunda veri klasörünün yeri (güvenli olması için `LLM_DATA_DIR` değerine mutlak yol verin).

Paketin kendi kılavuzu: `D:\dnm\llm-manager-main\docs\KULLANICI_KILAVUZU.md` (yerel kopya) ya da paketin GitHub deposu.
