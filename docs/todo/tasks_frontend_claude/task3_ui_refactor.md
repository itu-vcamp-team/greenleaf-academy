# Task 3: Header, Tema & Global UI Refaktörü

Navbar (Header) bileşeninin temizlenmesi, dil desteğinin tam entegrasyonu ve tema motorunun (Dark/Light) stabil hale getirilmesi.

## 🎯 Hedefler

- [ ] **Navbar Modernizasyonu:**
    - Atıl dropdown'lardan arındırılmış, sade ve işlevsel bir Header tasarımı.
    - Menü elemanlarının (Akademi, Takvim vb.) ikon ve metinlerinin `next-intl` (`messages`) ile dile duyarlı hale getirilmesi.
- [ ] **Tema Motoru (Dark/Light) Düzeltme:**
    - `layout.tsx` üzerindeki hardcoded `dark` sınıfının kaldırılması.
    - Kullanıcının tercihine veya sistem ayarına göre otomatik tema seçimi (`Next-Themes` entegrasyonu önerilir).
- [ ] **Mobil Menü:**
    - Mobil görünümde menü elemanlarının şık bir Drawer/Overlay içinde gösterilmesi.

## 🛠️ Teknik Detaylar

- `src/components/ui/Navbar.tsx` dosyası baştan aşağı refaktör edilecek.
- Linklerde `locale` prefix'i eklemek için `Link` bileşeni sarmalanacak.
- CSS variables (`globals.css`) üzerinden tema renklerinin tam kontrolü sağlanacak.

## ✅ Doğrulama

- Light ve Dark mod arasında geçiş yapıldığında tüm sayfaların renk şemasının tutarlı kaldığının teyidi.
- Dil değiştirildiğinde Header linklerinin anında Türkçeden İngilizceye (veya tersi) döndüğünün kontrolü.

## Implementasyon Summary
- Navbar tasarımı mobil menü (drawer) desteğiyle responsive hale getirildi.
- Hardcoded dark-mode sınıfları kaldırılarak tema yönetimi TenantProvider üzerinden dinamikleştirildi.
- globals.css üzerindeki CSS değişkenleri tüm ana sayfalara (Home, Academy, Dashboard, Calendar) uygulandı.
- Tema geçişlerindeki tutarsızlıklar ve sert renkler CSS değişkenleri ile giderildi.
