# Veri Akışı ve Süreç Eşleme (3_data_flow.md)

## 1. Kullanıcı Katılımı ve Kayıt Akışı
1. **İlk Kanca**: Misafir `greenleafakademi.com` adresine gelir.
2. **Huni Girişi**: Kullanıcı kayıt formunu doldurur [Ad, Soyad, E-posta, Telefon, Referans Kodu].
3. **Partner ID Seçimi**: Kullanıcı "Partner ID'im var" veya "Yok" seçeneğini işaretler.
    - **Varsa**: Mevcut ID'sini girer.
    - **Yoksa**: Admin onayı ile yeni bir ID atanması için talep oluşturulur (Gaffar Dulkadir örneğindeki gibi supervisor bilgisi girilebilir).
4. **Backend Doğrulama Servisi**:
    - Admin tarafından oluşturulan tek seferlik **Referans Kodu** doğrulanır.
    - Admin, yeni partneri panelden onaylar, parent-child ilişkisini belirler ve aktif/pasif durumunu yönetir.
5. **E-posta Kuyruğu**: Kayıt verileri **Resend.com** üzerinden aktivasyon maili (giriş kodu) olarak gönderilir.
6. **Aktivasyon**: Kullanıcı maildeki kodla giriş yapar.

## 2. Akademi İlerleme Akışı
1. **Video Oynatma**: YouTube embed üzerinden izlenen videoların ilerlemesi (mümkünse API ile, değilse manuel status değişikliği ile) takip edilir.
2. **İlerleme Güncellemesi**: Backend `UserProgress` tablosunu günceller. "Kaldığın yerden devam et" özelliği için son izleme noktası kaydedilir.
3. **Kilit Açma Mantığı**: Bir videonun tamamlanması, bir sonraki `Reels` veya ilgili `Masterclass` içeriğinin kilidini açar.

## 3. Aday Yönetimi ve Referans Sistemi
1. **Referans Kodu Oluşturma**: Adminler, yeni partner adayları için tek seferlik kullanılabilir referans kodları oluşturur.
2. **Kayıt**: Aday bu kodu kullanarak kayıt olur.
3. **Aday Takibi**: Partnerler, kendi davet ettikleri adayların akademi içerisindeki ilerlemelerini (yüzde kaçta olduklarını) kendi panellerinden görebilirler.

## 4. Çok Dilli İçerik Dağıtımı
1. **İstek Başlıkları**: Ara katman (middleware) URL ön ekini veya tenant bağlamını (örneğin: `tr.greenleafakademi.com`) algılar.
2. **İçerik Çözümleyici**: Talep edilen dile ait içerikleri getirir.
3. **Dil Senkronizasyonu**: Türkçe içerik güncellendiğinde, diğer dillerdeki karşılıkları henüz çevrilmemişse bu içerikler "Güncel Değil" olarak işaretlenebilir.
4. **Geri Dönüş Mekanizması**: Talep edilen yerelleştirme bilgisi eksikse varsayılan olarak `TR` (Faz 1) diline döner.
