# Task 4: Modül Bazlı Dinamik Veri (Feature Sync)

Academy, Takvim ve Dashboard modüllerinin backend verileriyle tam entegre edilmesi.

## 🎯 Hedefler

- [ ] **Academy Modülü Entegrasyonu:**
    - Masterclass videoları ve ders başlıklarının `academy` API'sinden çekilmesi.
    - Kaynak linklerin (PDF, dosya vb.) backend'den gelen verilere göre listelenmesi.
- [ ] **Takvim (Calendar) Entegrasyonu:**
    - Statik takvim verilerinin `events` API'si ile dinamik hale getirilmesi.
    - Etkinlik detaylarında "Katıl" butonu mantığının backend kontrolüne bağlanması.
- [ ] **Dashboard Sync:**
    - Kullanıcı ilerleme istatistiklerinin (`progress` API) görselleştirilmesi.
    - Güncel duyuruların (`announcements` API) ana ekranda sergilenmesi.

## 🛠️ Teknik Detaylar

- Her sayfa için `useRequest` (veya `SWR/React Query`) benzeri bir veri çekme yöntemi standardize edilecek.
- Veri yüklenirken (loading) ve hata durumunda (error) gösterilecek skeleton UI bileşenleri hazırlanacak.

## ✅ Doğrulama

- Backend'den eklenen bir dersin veya etkinliğin anında frontend tarafında (sayfa yenilendiğinde) göründüğünün teyidi.
- Gerçek progress verilerinin profil sayfasında doğru yansıdığının kontrolü.

## Implementasyon Summary
- Akademi, Takvim ve Dashboard modülleri gerçek backend API uçlarına bağlandı.
- Aday listesi, duyurular ve kaynaklar için dashboard senkronizasyonu yapıldı.
- Takvimdeki etkinlik oluşturma/silme yetkileri middleware korumasıyla eşleştirildi.
