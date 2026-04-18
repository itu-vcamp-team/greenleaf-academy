# Bilgi İhtiyacı v3 (info_needed_v3.md)

Bu döküman, `docs-raw` ve mevcut `docs` analiz edildikten sonra netleştirilmesi gereken veya çelişkili görünen noktaları içermektedir.

## 1. Kullanıcı Rolleri ve Kayıt Süreci
1. **Editor Rolü**: Toplantı notlarında "Admin, Editor, Partner ve Misafir" rollerinden bahsediliyor. Ancak diğer dökümanlarda "Editor" rolünün kapsamı net değil. Editor, Admin'in kısıtlı bir versiyonu mu olacak (sadece içerik yönetimi gibi)?
2. **Partner ID vs Referans Kodu**: 
   - Bir dökümanda "Referans Kodu kısmına Greenleaf Partner ID yazılır" deniyor.
   - Diğerinde "Adminler referans kodu üretir, bu kod tek seferliktir" deniyor.
   - **Soru**: Kayıt sırasında hangisi kullanılacak? Yoksa her ikisi de mi? (Örn: Partner ID ile eşleşme kontrolü + Admin'den alınan tek seferlik davetiye kodu).
3. **Gaffar Dulkadir Örneği**: Toplantı notunda "üst admin seçip, açıklamaya supervisor adını girip davetiye sisteme düşüyor" denmiş. Bu, referans kodu olmayanlar için bir "talep" mekanizması mı?

## 2. İçerik ve Video Güvenliği
4. **YouTube Embed Koruması**: YouTube "liste dışı" videoların linki bir şekilde sızarsa herkes izleyebilir. Bunu engellemek için daha sıkı bir koruma (Signed URL vb.) isteniyor mu, yoksa liste dışı olması yeterli mi?
5. **PDF İndirme**: Bir yerde "indirilebilir PDF'ler" denirken, başka bir yerde "kimse indirememeli, sadece görüntülenebilir" denmiş. Hangisi geçerli? (Belki bazıları indirilebilir, bazıları sadece görüntülenebilir?)

## 3. Teknik Detaylar
6. **Base64 Görsel Depolama**: Etkinlik ve profil fotoğraflarının Base64 olarak veritabanında tutulması, veritabanı boyutunu hızla büyütebilir. Bunun yerine Render'ın disk alanı veya basit bir S3 benzeri çözüm (Minio vb.) düşünülmeli mi?
Render ın disk alanını kullanalım o zaman.
7. **Çift Cihaz Engelleme**: "Aynı anda iki kişi tek şifreyle içeride olamayacak" kuralı kesin. Peki, kullanıcı bir cihazda oturumu kapatmadan diğerine geçerse, eski oturumun otomatik sonlandırılması (kick out) yeterli mi?
Yeterli.
## 4. Tenant ve Domain Yapısı
8. **Tenant Domainleri**: `tr.greenleafakademi.com` gibi alt domainler için SSL sertifikası yönetimi (Wildcard SSL) Render.com üzerinde nasıl konfigüre edilecek? (Bu teknik bir detay ama planlama için önemli).
bilmiyorum ama super admin manuel olarak "https://domains.squarespace.com/" üzerinden ekleyecek o zaman. Render.com un wildcard ssl desteği var mı ona bakmak lazım.

9. **Süper Admin Paneli**: Süper adminin tenant oluşturma arayüzü Faz 1 kapsamında mı, yoksa başlangıçta manuel (veritabanı üzerinden) mi yapılacak?
Faz 1 de manuel yapılacak. Render.com un domain yönetimi üzerinden ekleme yapılacak. Daha sonra süper admin paneli eklenebilir. ama yine de ui a ihtiyacı var super adminin. O kısım için manuel rehber ekleriz. 

## 5. Diğer
10. **Tasarruf Hesaplayıcı**: "Misafir ekranında çalışacak bir hesaplama aracı" Faz 1 için "belki on/off yaparız" denmiş. Bu özelliğin algoritması/formülü hazır mı?
Bunu kullanmayacağız kesinlikle rafa kalktı.
11. **Sertifika Sistemi**: "Sertifika ekle çıkart" denmiş. Sertifikalar dinamik olarak mı üretilecek (PDF generation), yoksa sadece bir görsel/badge mi olacak?
Bu yapı yok unut.