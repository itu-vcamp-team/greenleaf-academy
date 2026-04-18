# Task 5: Final Test ve Onay (Human)

## 🎯 Hedef
Sistemin canlıya çıkmadan önce tüm kritik iş akışlarını gerçek cihazlarla test etmek, hataları raporlamak ve son onayı vermek.

## ⚠️ Bu Task Ne Zaman Yapılmalı?
Tüm Claude task'ları tamamlanıp sistem `tr.greenleafakademi.com` adresinde erişilebilir olduktan sonra.

---

## 🧪 Test Ortamı Hazırlığı

Test için ihtiyaç duyulacaklar:
- [ ] 1 adet **mobil telefon** (Android veya iPhone)
- [ ] 1 adet **masaüstü/laptop** (Chrome tarayıcı)
- [ ] 2 adet **test e-posta adresi** (gerçek, mail geldiğini görmek için)
- [ ] Greenleaf Global sisteminde aktif hesap bilgileri (Adım 2'deki doğrulama için)

---

## 📋 Test Senaryosu 1: Misafir (Guest) Deneyimi

**Hedef:** Kayıt olmayan biri sistemi görüyor mu?

- [ ] **1.1** Telefonda `https://tr.greenleafakademi.com` aç
  - ✅ Beklenen: Ana sayfa açılıyor, logo ve renkler doğru
  - ✅ Beklenen: Yaklaşan etkinlik varsa geri sayım banner'ı görünüyor
  - ✅ Beklenen: Duyurular görünüyor

- [ ] **1.2** Akademi sayfasına git (giriş yapmadan)
  - ✅ Beklenen: İçerikler listeleniyor ama video gösterilmiyor
  - ✅ Beklenen: "Kilitli" badge'i ve bulanık thumbnail görünüyor
  - ✅ Beklenen: "Giriş yapın" veya benzeri yönlendirme mevcut

- [ ] **1.3** Takvim sayfasını kontrol et
  - ✅ Beklenen: "ALL" görünürlüklü etkinlikler listeleniyor
  - ✅ Beklenden: Toplantı linki (meeting_link) gösterilmiyor

- [ ] **1.4** Referans kodu olmadan başvur (Waitlist)
  - Kayıt sayfasında "Partner ID'im yok" seçeneğini seç
  - İsim, e-posta, supervisor adı gir → Gönder
  - ✅ Beklenen: "Başvurunuz alındı" mesajı görünüyor
  - ✅ Beklenen: Admin e-posta adresine bildirim maili geliyor

---

## 📋 Test Senaryosu 2: Kayıt Akışı (3 Adım)

**Hedef:** Yeni partner kaydı eksiksiz çalışıyor mu?

**Ön hazırlık:** Test için partner referans kodu üret (admin panelinden veya geliştiriciden al)

- [ ] **2.1** Kayıt sayfasını aç → **Adım 1: Temel Bilgiler**
  - Ad soyad, kullanıcı adı, test e-posta, şifre gir
  - Şifresi zayıf bir şifre gir (örn: "1234") → ✅ Hata mesajı bekle
  - Geçerli bilgileri gir → "Devam" tıkla

- [ ] **2.2** **Adım 2: Greenleaf Global Doğrulama**
  - Yanlış GL Global bilgileri gir → ✅ "Doğrulanamadı" hatası bekle
  - Doğru GL Global kullanıcı adı ve şifresini gir → "Devam" tıkla

- [ ] **2.3** **Adım 3: Referans Kodu**
  - Geçersiz bir kod gir (örn: "ABCDEF") → ✅ Hata mesajı bekle
  - Gerçek tek kullanımlık kodu gir → "Hesap Oluştur" tıkla
  - ✅ Beklenen: "E-posta doğrulaması gerekiyor" mesajı

- [ ] **2.4** **E-posta Doğrulama**
  - Test e-posta kutusunu aç → Aktivasyon maili geliyor mu? ✅
  - 6 haneli kodu sisteme gir → ✅ "Doğrulandı, admin onayı bekleniyor" mesajı

- [ ] **2.5** **Admin Onayı**
  - Admin hesabıyla giriş yap → Admin panel → "Bekleyen Onaylar"
  - Test kullanıcısını listede gör ✅
  - "Onayla" butonuna bas
  - ✅ Beklenen: Test kullanıcısına hoşgeldin maili geliyor
  - Test e-posta kutusunu kontrol et

---

## 📋 Test Senaryosu 3: Giriş ve Oturum Yönetimi

- [ ] **3.1** Onaylanan test hesabıyla giriş dene
  - Yanlış şifre 6 kez gir → ✅ "Çok fazla deneme, bekleyin" hatası bekle
  - 15 dk sonra tekrar dene veya Redis cache'i temizle (geliştirici)

- [ ] **3.2** Başarılı giriş
  - CAPTCHA: Ekrandaki 4 sayının toplamını gir
  - Şifreyi doğru gir → ✅ Dashboard açılıyor

- [ ] **3.3** Aynı anda 2 cihazdan giriş (Kick-out testi)
  - Cihaz 1: Giriş yap (oturum açık)
  - Cihaz 2: Aynı hesapla giriş yap
  - ✅ Beklenen: Cihaz 1'deki oturum kapanıyor ("Başka bir cihazdan giriş yapıldı" mesajı)

- [ ] **3.4** Şifremi unuttum
  - Login → "Şifremi Unuttum" → E-posta gir
  - ✅ Beklenen: Sıfırlama maili geliyor
  - Mail içindeki kodla yeni şifre belirle → Giriş yap ✅

---

## 📋 Test Senaryosu 4: Akademi ve İçerik

- [ ] **4.1** Akademi sayfasını aç
  - ✅ Shorts ve Masterclass sekmeleri görünüyor
  - ✅ İlerleme istatistikleri (0%) görünüyor

- [ ] **4.2** Kilitli içerik testi
  - İlk içerik (kilitsiz) → Video oynatılıyor ✅
  - İkinci içerik (kilitli) → "Kilitli" overlay görünüyor, video yok ✅
  - İlk içerigi "Tamamlandı Olarak İşaretle" → ✅ Yeşil "Tamamlandı" görünüyor
  - Akademi listesine geri dön → 2. içeriğin kilidi açıldı mı? ✅

- [ ] **4.3** Video izleme sürekliliği (Kaldığın yerden devam)
  - Bir videoyu yarıda bırak → Sayfadan çık → Tekrar aç
  - ✅ Beklenen: Video kaldığın yerden devam ediyor

- [ ] **4.4** Kaynak linki (Google Drive) testi
  - Kaynak linki olan bir içeriği aç → Butona tıkla
  - ✅ Beklenen: Yeni sekmede Google Drive önizleme açılıyor
  - ✅ Beklenen: İndirme butonu GÖRÜNMEMELİ (Drive görüntüleyici ayarı)

- [ ] **4.5** Arama testi
  - Akademi sayfasında arama kutusuna gerçek bir içerik başlığı yaz
  - ✅ Beklenen: 400ms sonra arama sonuçları dropdown'da görünüyor

---

## 📋 Test Senaryosu 5: Takvim

- [ ] **5.1** Admin panelinden test etkinliği oluştur
  - Başlık, tarih (yarın), Zoom linki, konum, kapak görseli ekle
  - "Yayınla" → "Partnerlere Duyur" butonuna bas
  - ✅ Beklenen: Test e-posta adresine duyuru maili geliyor

- [ ] **5.2** Takvim görünümünü kontrol et
  - `/calendar` sayfasına git → Etkinliğin olduğu günde nokta var mı? ✅
  - O güne tıkla → Sağ tarafta etkinlik listesi görünüyor ✅
  - Partition linki misafire gizli mi? (Guest hesabıyla test et) ✅

- [ ] **5.3** "Takvime Ekle" testi
  - Partner hesabıyla etkinliğe tıkla → "Takvime Ekle" butonu
  - ✅ Beklenen: .ics dosyası indirildi VEYA mail geldi
  - Telefonda .ics dosyasını aç → Takvime ekleme ekranı çıkıyor mu? ✅

---

## 📋 Test Senaryosu 6: Mobil Uyumluluk

- [ ] **6.1** Telefondan tüm sayfaları ziyaret et (Chrome veya Safari)
  - ✅ Alt navigasyon barı (Home, Akademi, Takvim, Kaynaklar, Profil) görünüyor
  - ✅ Üstte navigasyon YOK (sadece mobilde alt nav)
  - ✅ İçerik okunabilir, butonlar tıklanabilir boyutta

- [ ] **6.2** Shorts player mobil testi
  - Dikey (9:16) video doğru oranda görünüyor mu? ✅
  - Tüm butonlar (Tamamlandı, Kaynak Linki) düzgün sıralı mı? ✅

---

## 📋 Test Senaryosu 7: Partner Dashboard

- [ ] **7.1** Referans kodu üret
  - Dashboard → "Yeni Kod Üret" → Kod görünüyor ✅
  - "Kopyala" düğmesi çalışıyor ✅
  - Bu kodu başka bir test hesabı için kullan (Senaryo 2'deki gibi)
  - Yeni kullanıcı onaylandıktan sonra "Adaylarım" listesinde görünüyor ✅

- [ ] **7.2** Aday ilerleme takibi
  - Aday (child) akademide ilerleme gösterdi
  - Dashboard'da aday listesinde % görünüyor ✅

---

## 📋 Hata Raporlama Formatı

Test sırasında bir sorunla karşılaşırsan şu formatta not al ve geliştiriciye ilet:

```
HATA:
  Sayfa/Ekran  : /academy/shorts/[id]
  Yapılan İşlem: Tamamlandı butonuna basıldı
  Beklenen     : Düğme yeşile döndü ve "Tamamlandı" yazısı çıktı
  Gerçekleşen  : Düğme beyaz kaldı, sayfa yenilendi
  Cihaz/Tarayıcı: iPhone 14 / Safari 17
  Ekran Görüntüsü: (varsa ekle)
```

---

## ✅ Final Onay Kontrol Listesi

Tüm senaryolar tamamlandıktan sonra:

- [ ] Kayıt akışı (3 adım) eksiksiz çalışıyor
- [ ] E-postalar spam'e düşmüyor
- [ ] Giriş ve kick-out mekanizması çalışıyor
- [ ] Akademi içerikleri doğru kilitlendi/kilidi açıldı
- [ ] Kaldığın yerden devam özelliği çalışıyor
- [ ] Takvim etkinliği oluşturma → duyuru → "Takvime Ekle" akışı çalışıyor
- [ ] Mobil görünüm düzgün (alt navigasyon + responsive)
- [ ] Misafir için meeting_link gizli
- [ ] Partner dashboard'u aday ilerleme yüzdelerini gösteriyor
- [ ] Sistem `https://tr.greenleafakademi.com` adresinde açılıyor (SSL aktif, kilitli ikon)

**Tüm bunlar tamamlandığında → 🚀 Sistem Canlıya Hazır!**

---

## ⚠️ Önemli Notlar

> **Test e-postaları için:** Gmail, Outlook veya geçici mail servisleri kullanabilirsin. Spam klasörünü de kontrol et.
>
> **"Kaldığın yerden devam" testi:** Video izleme progress'i her 15 saniyede bir backend'e kaydedilir. Test için en az 30 saniye izle, sayfayı kapat, tekrar aç.
>
> **Rate limit testi:** 6 yanlış giriş denemesinin bloke oluşturduğunu test et. Gerçek kullanıcıları test sırasında etkilememek için test hesabı kullan.
>
> **Hata bulunursa ne yapmalı?** Hata raporlama formatına göre not al ve geliştirici ile paylaş. Kritik hatalar (giriş yapılamıyor, mail gelmiyor) öncelikli düzeltilir.
