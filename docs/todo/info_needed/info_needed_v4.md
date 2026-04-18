# Teknik Belirsizlikler ve Yol Haritası (info_needed_v4.md)

Bu döküman, Faz 1 geliştirme sürecine başlamadan önce teknik olarak netleştirilmesi gereken uygulama detaylarını içerir.

## 1. Render.com ve Domain Yönetimi
1. **Wildcard SSL**: Render.com'un ücretsiz katmanında wildcard SSL desteği sınırlıdır. `*.greenleafakademi.com` yapısı için her yeni tenant eklendiğinde Render panelinden manuel domain eklemesi yapılması gerekecektir. Bu süreç Faz 1 için kabul edilebilir mi?
Uygundur.
2. **Domain Kaydı**: Squarespace üzerinden alınan domainlerin Render'a yönlendirilmesi için CNAME/A record yönetimi manuel rehberde detaylandırılacaktır.
Uygundur.
## 2. Veri Depolama ve Performans
3. **Render Disk**: Render'ın "Disk" servisi (Persistent Storage) sadece ücretli servislerde (Instance) mevcuttur. Ücretsiz veya başlangıç seviyesi servislerde disk alanı kalıcı değildir (restart sonrası silinir). Görsellerin kalıcılığı için Render'ın ücretli bir planı mı kullanılacak, yoksa başlangıç için veritabanında (optimize edilmiş WebP olarak) saklamaya devam mı edelim?
Ücretli plana geçeceğiz.
4. **YouTube API**: Videoların izlenme yüzdesini (örneğin %90 izlendi mi?) takip etmek için YouTube IFrame API kullanılacaktır. Ancak bu, kullanıcının videoyu ileri sarmasını engelleyemez (basit yöntemlerle). Bu durum akademi ilerleme mantığı için yeterli mi?

## 3. Kullanıcı Deneyimi (UX)
5. **Sessiz Otomatik Oynatma**: Tarayıcı politikaları gereği videoların otomatik başlaması için mutlaka sessiz (muted) olması gerekir. Kullanıcı etkileşime girmeden ses açılmasına tarayıcılar izin vermez. Bu durum "Reels" deneyimi için onaylandı mı?
6. **Kayıt Formu Detayı**: "Partner ID'im yok" diyen kullanıcılar için supervisor adı girilmesi zorunlu mu olacak? Bu bilgi admin onay panelinde nasıl bir öncelikle gösterilmeli?

## 4. Güvenlik
7. **Kick-out Mekanizması**: Yeni bir cihazdan giriş yapıldığında eski oturumun sonlandırılması için veritabanı tabanlı oturum yönetimi (Database Sessions) kullanılacaktır. Bu, her istekte veritabanı sorgusu demektir. Performans açısından Redis kullanımı (Render Key Value) bu noktada kritik önem taşıyacaktır.
