# İş Stratejisi ve Mantığı (1_business.md)

## 1. Yönetici Özeti
Greenleaf Türkiye sadece bir web sitesi değil; parçalanmış bir network marketing operasyonunu merkezi, veri odaklı ve yüksek düzeyde ölçeklenebilir bir "Dijital Kale"ye dönüştürmek için tasarlanmış bir **Dijital Ekosistem**'dir. Birincil amaç, milyar dolarlık bir yapıya profesyonel bir yüz kazandırarak "Güven Boşluğu"nu köprülemektir.

## 2. Pazar Konumlandırma ve Problem Tanımı
- **Parçalanmış Dev**: Şu anda Greenleaf, dağınık WhatsApp/Telegram grupları ve amatör bloglar üzerinden faaliyet göstermektedir. Bu durum "İletişim Kakofonisi" yaratarak üst düzey profesyoneller nezdinde güveni zedelemektedir.
- **Çözüm**: Eğitim, etkinlikler ve kurumsal kimlik için tek bir doğruluk kaynağı görevi gören birleşik bir "Global Hub".

## 3. Kullanıcı Kademeleri ve Erişim Modeli
- **Misafir (Guest)**: "Merak Boşluğu" pazarlamasına odaklanan, POC tarzı etkileşimli landing sayfaları. Sadece teaser (YouTube embed) videolarına erişim sağlar.
- **Partner (Akademi)**: Sistemin asıl "ürünü". Eğitimler, stratejik belgeler ve takvim etkinliklerine tam erişim sağlar. Kendi adaylarının ilerlemesini takip edebilir.
- **Admin**: Kendi tenant'ına (bölgesel ekip) ait içerikleri, partnerleri ve etkinlikleri yönetir. Partnerleri aktif/pasif yapabilir.
- **Süper Admin**: Yeni tenant'lar oluşturur ve sistem genelini yönetir.

*Not: "Müşteri" rolü tamamen kaldırılmıştır, odak noktası Partner eğitimidir.*

## 4. Büyüme Döngüleri ve Satış Psikolojisi
- **Mikro-Öğrenme (Reels Formatı)**: 2-3 dakikalık dikey videolarla hızlı ve etkili öğrenme. Videolar varsayılan olarak sessiz ve otomatik başlar.
- **FOMO (Kaybetme Korkusu)**: Ana sayfada en üstte, marka kimliğine uygun büyük geri sayım sayaçları ve etkinlik bilgileri.
- **Aday Takibi**: Partnerler, davet ettikleri adayların akademi içerisindeki ilerlemelerini (yüzde kaçta, hangi videoda olduklarını) görebilirler.

## 5. Küresel Ölçeklendirme ve SaaS Vizyonu
- **Multi-tenant Yapı**: Sistem, farklı ülkelerdeki (TR, DE, FR vb.) liderlerin kendi alt merkezlerini (tenant) yönetebileceği şekilde tasarlanmıştır. Her tenant kendi veritabanı izolasyonuna ve içerik yönetimine sahiptir.
- **Tenant Yönetimi**: Süper admin yeni tenant'lar tanımlar, adminler ise bu tenant'ları yönetir. Domain yapısı `tenant.greenleafakademi.com` şeklinde ayrıştırılır.
- **Yerelleştirme**: 7 dil desteği (TR, EN, RU, CN, FR, ES, DE) altyapısı hazırdır. İçerikler adminler tarafından manuel olarak eklenir.
