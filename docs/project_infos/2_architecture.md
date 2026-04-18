# Sistem Mimarisi ve Tasarımı (2_architecture.md)

## 1. Mimari Felsefe
Sistem, Faz 1'de **Modüler Monolit** yaklaşımını takip ederken veri tabanı ve yönlendirme katmanlarında **SaaS Multi-tenant** prensiplerine sıkı sıkıya bağlı kalır. Bu durum, tam kapsamlı bir mikroservis mimarisine veya küresel bir SaaS ürününe geçişin herhangi bir temel mantık yazımı gerektirmediğini garanti eder.

## 2. Multi-tenant Stratejisi
- **Mantıksal İzolasyon**: Her varlık (Kullanıcılar, Videolar, Etkinlikler) bir `tenant_id` (örneğin: `tr-01`, `de-02`) ile ilişkilendirilmiştir.
- **Dinamik Yönlendirme**: Ara katman (middleware) seviyesinde kiracı (tenant) bağlamını çözümleyen merkezi bir giriş denetleyicisi (ingress controller) kullanarak alt alan adı tabanlı yönlendirme (örneğin: `germany.greenleafglobalhub.com`) uygulaması.

## 3. Altyapı ve Dağıtım (Render.com)
- **Platform**: Uygulama ve veritabanı yönetimi için **Render.com** kullanılacaktır.
- **Veri Tabanı**: Render üzerinde barındırılan **PostgreSQL**. Günlük yedekleme ve PITR (Point-in-Time Recovery) desteği ile veri güvenliği sağlanır.
- **Önbellekleme**: Hız sınırlama (Rate Limiting) ve oturum yönetimi için Render Key Value (Redis uyumlu) servisi.
- **E-posta Servisi**: Tranzaksiyonel e-postalar (kayıt, şifre sıfırlama, takvim davetleri) için **Resend.com** kullanılacaktır.

## 4. İçerik ve Medya Yönetimi
- **Video Barındırma**: Videolar **YouTube** üzerinden "liste dışı" (unlisted) olarak barındırılır ve iframe embed ile sitemizde gösterilir.
- **Dosya Depolama**: PDF ve diğer dökümanlar **Google Drive** üzerinde tutulur, sistemde sadece erişim linkleri saklanır. Kimse dökümanları indirememeli, sadece görüntülenebilir olmalıdır.
- **Görsel Veriler**: Etkinlik görselleri ve profil fotoğrafları Render'ın disk alanı üzerinde saklanacaktır.

## 5. Güvenlik ve Süreklilik
- **Yedekleme**: Render.com üzerinden otomatik günlük yedekleme.
- **Siber Güvenlik**: Hatalı giriş denemeleri için Redis tabanlı Rate Limiting (5 hatalı denemede 15 dk blok).
- **Oturum Kontrolü**: Aynı anda tek bir şifre ile sadece bir cihazdan giriş yapılabilir (Eşzamanlı Oturum Kontrolü).
- **Olay Yolu (Event Bus)**: Yedekleme tetikleyicileri ve telemetri işleme gibi asenkron görevleri yönetmek için dahili bir olay yolu (örneğin: **Celery**, **ARQ** veya **FastAPI Background Tasks**) uygulaması.

