# Rafine Edilmiş Proje Soruları (info_needed_v2.md)

Bu belge, POC (`greanleaf-academy`), `database_design.md` ve `important_infos.md` analiz edildikten sonra geriye kalan açık soruları içermektedir. 
Teknik temeller (Next.js, Prisma, Tailwind 4, Multi-tenancy) artık karara bağlanmış kabul edilmektedir.

---

## 1. İş Mantığı ve Vizyon
1. **Başarı Metrikleri**: Faz 1 için temel başarı metriği nedir (örn. kayıt sayısı, akademi tamamlama oranı)?
bu açıdan bakma bizi ilgilendirmiyor. önemli değil. sorularının amacı software kısmını oturtmak.
2. **Aktif Partner Tanımı**: "Aktif partner" durumunu tam olarak nasıl doğrulayacağız? Greenleaf Global sistemiyle gerçek zamanlı kontrol yapacak harici bir API olacak mı?
böyle bir durum yok. manuel olacak. admin panelinden partneri aktif pasif yapabilir. 
3. **Faz 2 Takvimi**: Faz 2 (Küresel genişleme) için belirlenmiş bir hedef tarih var mı?
yoktur.
4. **Abonelik Ücretleri**: Akademi "Partner" seviyesi için herhangi bir ücret olacak mı, yoksa tüm aktif partnerlere ücretsiz mi?
ücretsiz olacak.
5. **İnaktif Partnerler**: Bir Partner ID'si global sistemde inaktif hale gelirse nasıl bir aksiyon almalıyız? (Erişimi kapat, Misafir'e düşür vb.)
bunu takip etmiyoruz.
6. **Aday Takibi (Candidate Tracking)**: Partnerler için aday takip aracı Faz 1 mi yoksa Faz 2 özelliği mi? Ücretli bir eklenti olmalı mı?
Aday takip sadece adaylarının listelendiği ve akademi de yüzde kaçta hangi videoda olduklarını görebilecekleri bir yer.
7. **Referans Sistemi**: Websitesinin kendi referans/prim sistemi olacak mı, yoksa tamamen mevcut Greenleaf Global ağacına mı dayanacak?
webssitemizin kendi referans doğrulama kodu olacak. partnerimiz üye olmak isteyen misafirin hesap açımı için referans doğrulama kodu oluşturacak tek seferlik kullanıma açık bir kod.
8. **İçerik Onay Süreci**: Video ve PDF içeriklerinin nihai onayından kim (hangi rol) sorumlu olacak?
ADMİN kendisi ekleyip düzenliyor.
9. **Yerelleştirme (Localization)**: Planlanan 7 dil için içerik oluşturucular hazır mı, yoksa başlangıçta yapay zeka/çeviri servisleri mi kullanılacak?
başlangıçta sadece türkçe olacak. sonrasında diğer diller eklenecek. ve içeriği insan oluşturup admin ekleyecek.
10. **Bütçe Kısıtlamaları**: AWS (S3/SES) veya Video CDN servisleri için belirlenmiş aylık bütçe limitleri var mı?
render.com üzerinden deploy alacağız. videolar youtube da dosyalar google drive da olacak biz sadece url ve embed yapacağız. videolar embed, dirve bağlantıları sadece link.

## 2. Platform Özellikleri ve UX
11. **Misafir Deneyimi**: Misafir (Guest) açılış sayfası çok etkileşimli (POC tarzı) mi olmalı, yoksa daha bilgi yoğun/kurumsal bir tarz mı tercih edilmeli?
POC tarzı olmalı. ve bilgilendirici unsurlar içermeli.
12. **FOMO Triggers**: Arayüzdeki "sınırlı süre" veya geri sayım tetikleyicileri ne kadar agresif olmalı?
ana sayfada olacak en üstte büyük punto ve marka kimlik rengine uygun bir şekilde olacak. etkinlik infosu da olacak. bağlantı linki de olacak. misafirse link yok. partnerse link var.
13. **Video Oynatma**: "Reels" videoları varsayılan olarak sesli mi sessiz mi otomatik oynamalı?
varsayılan olarak sessiz. kullanıcı isterse açar.
14. **PDF Güvenliği**: PDF'ler herkes tarafından indirilebilir mi olmalı, yoksa Misafir/Müşteri için sadece tarayıcıda görüntülenebilir mi? 
kimse indirememeli. pdf linki google drive linki olacak.indirilebilir içerik için kütüphane bulunabilir. 
15. **Takvim Entegrasyonu**: "Dinamik Takvim" verileri Google Calendar/Outlook'tan mı çekecek, yoksa tamamen Admin Panelinden mi yönetilecek?
admin panel yönetimi ama tek tuşla user ın kendi takvimine davet maili gidecek.
16. **Kullanıcı İlerlemesi**: "Kaldığın yerden devam et" özelliği Faz 1 için yüksek öncelikli mi?
öncelikli. 
17. **Profil Yönetimi**: Kullanıcıların profil resmi ve biyografi yüklemesine izin verilecek mi, yoksa sadece "Partner ID" tabanlı minimal bir profil mi olacak?
yükleyecekler minimal profil olacak. görseller base64 webp formatında düşük pikselde saklanacak.
18. **Destek Masası**: Dahili bir destek bileti (ticket) sistemi olacak mı, yoksa sadece harici WhatsApp/Telegram/Mail linkleri mi verilecek?
admin tarafından bunlar eklenirse partnerlere gösterilebilinir.

## 3. Teknik ve Güvenlik Uygulaması
19. **Mail Sağlayıcısı**: "Kapsamlı bir mail servisi" gereksinimi için **Amazon SES**, **Resend** veya **SendGrid** arasından bir tercihiniz var mı?
resend.com kullanacağız.

20. **Oturum Yönetimi**: Kimlik doğrulama için JWT (stateless) mi yoksa Veritabanı Oturumları mı kullanılmalı? (NextAuth.js her ikisini de destekler).
hangisi best practise ise onu kullanalım.


21. **Video Güvenli Teslimat**: Video koruması ne kadar sıkı olmalı? (İmzalı URL'ler/Tokenlı erişim vs. basit gizli URL).
youtube embed linki kullanacağız. youtube un liste dışşı videoları üzerinden ilerleyeceğiz. tabi mümkünse bu url i başkalarıyla paylaşup herhangi bir kullanıcı izleyememesi için hangi yöntem gerekliyse kulalnırız.

22. **Hata Sınırlandırma (Rate Limiting)**: Hata sınırlandırma küresel (Nginx/Cloudflare) mi yoksa kullanıcı/API bazlı (Redis) mi uygulanmalı?
Render bunu handle etmiyor. Render'ın sunduğu sadece:

DDoS Protection (Professional dahil) — Cloudflare tabanlı, ağ katmanında
Firewall (Professional dahil) — IP bazlı kural

Ancak kullanıcı/API bazlı rate limiting (Redis ile) senin uygulaman gerekiyor. Render'ın Render Key Value (Redis uyumlu) servisini kullanabilirsin ama mantığı kendin yazarsın. redis kullanırız. 


23. **Yedekleme Sıklığı**: Günlük yedekleme yeterli mi, yoksa kullanıcı ilerleme verileri için saatlik yedekleme gerekli mi? render.com ile hallediyoruz. Kısmen handle ediyor:

PostgreSQL için Point-in-Time Recovery (PITR) → Professional'da 3 günlük pencere var
Yani teorik olarak saatlik düzeyde geri dönülebilir, ek yapılandırma gerekmez

24. **Bulut Altyapısı**: **AWS** (Ölçeklenebilirlik) vs **DigitalOcean/Hetzner** (Basitlik/Maliyet) tercihi var mı?

render.com kullanıuyoruz. 
25. **Admin MFA**: Çok faktörlü doğrulama (MFA) tüm Admin/Süperadmin hesapları için ilk günden zorunlu olmalı mı?
çok faktör yok dediğim gibi mail üzerinden gelecek kodla giriş yaparlar. 

## 4. Veri ve İçerik Yönetimi
26. **Dil Senkronizasyonu**: Türkçe içerik güncellendiğinde, diğer dillerdeki karşılıkları çevrilene kadar otomatik olarak "Güncel Değil" olarak işaretlenmeli mi?
olabilir.

27. **Partner ID Kaynağı**: Resmi "Partner ID" listeleri nereden alınacak? (CSV yükleme, gerçek zamanlı API senkronizasyonu veya manuel giriş?)
manuel giriş olacak. admin kendisi onaylayacak. ilk partner id leri. kullanıcı hesap oluştururken partner id' im var yok seçer. yoksa admin onaylar. varsa da admin onaylar ama parent child i belirlemiş oluruz. 

28. **Etkileşim Verileri**: Analitik için hangi spesifik "tıklamalar/görüntülemeler" takip edilmeli? (Video başlatma, tamamlama, PDF indirme, buton tıklamaları).

şimdilik takip etmemize gerek yok. partner kendisi statusü değiştirir.


29. **Eski Hesap Silme**: Aktif olmayan "Misafir" hesaplarının silinme politikası nedir (örn. 6 ay hareketsizlikten sonra)?
1 yıl şeklinde olabilir.

30. **Küresel vs Yerel Ayarlar**: Hangi ayarlar "Küresel" (tüm tenantlar) ve hangileri "Yerel" (sadece 'tr' veya 'de' gibi slug bazlı) olacak?
hepsi bölgesel olacak. yani akış şöyle.

süper admin var. yeni tenant oluşturuyor. o tenat a ait bir veya birden fazla admin oluşturuyor. admin kendi tenantına ait içerikleri, partnerleri, müşterileri, etkinlikleri yönetiyor.

bu tenant ayrımını da main domainimiz üzerinden yönetebilmemiz lazım. bizim kendi domainimiz: "https://greenleafakademi.com/" bunun başına tenant ekleriz: "https://tr.greenleafakademi.com/" veya "https://de.greenleafakademi.com/" gibi. böylece birbirlerinden ayrışmış olur



---

### Yakın Zamanda Kararlaştırılanlar (Ek bilgiye gerek yok):
- **Teknoloji Yığını**: Next.js 15+, Tailwind 4, Prisma.
- **Veritabanı**: PostgreSQL.
- **Yetkilendirme Modeli**: Rol bazlı (Superadmin, Admin, Partner, Guest). ÖNEMLİ NOT CUSTOMER YOK. MİSAFİR VAR.
- **Çoklu Kiracılık (Multi-tenancy)**: `Tenant` context'li şema tabanlı yapı.
- **Tasarım**: Tenant bazlı dinamik renk temaları.
- **Depolama**: Dosyalar sistemde depolanmayacak, sadece harici linkleri (URL) tutulacak.
