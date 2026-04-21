# Task 2: Authentication & Gerçek Rol Yönetimi (RBAC)

Bu görev, sistemdeki mock rol mantığını kaldırıp, backend ile entegre gerçek bir kimlik doğrulama ve yetkilendirme akışı kurmayı hedefler.

## 🎯 Hedefler

- [ ] **Mock Verilerin Temizlenmesi:**
    - Navbar üzerindeki "Guest/Partner/Admin" dropdown seçicisinin tamamen kaldırılması.
- [ ] **Giriş / Kayıt Entegrasyonu:**
    - Login ve Register sayfalarının backend API'sine bağlanması.
    - JWT token'larının (access & refresh) cookie/secure storage üzerinde yönetilmesi.
- [ ] **Dinamik Auth State:**
    - Giriş yapılmamışsa Navbar'da "Giriş Yap" ve "Hemen Katıl" butonlarının gösterilmesi.
    - Giriş yapılmışsa (Admin, Partner vb.) kullanıcının gerçek rolüne göre "Profil" veya "Yönetim Paneli" linklerinin gelmesi.
- [ ] **Route Protection:**
    - `/admin` ve `/dashboard` dizinleri için middleware bazlı veya HOC (Higher Order Component) bazlı rol kontrolü.

## 🛠️ Teknik Detaylar

- `src/context/UserRoleContext.tsx` içindeki `setRole` (manual mock) fonksiyonu kaldırılacak.
- `src/store/auth.store.ts` içindeki `user.role` alanı yetki kaynağı olarak kullanılacak.
- Navbar bileşeni `useAuthStore`'daki `isAuthenticated` durumuna göre iki farklı görünüm sunacak.

## ✅ Doğrulama

- Giriş yapmadan `/admin` sayfasına erişilmeye çalışıldığında ana sayfaya veya login'e yönlendirme yapıldığının kontrolü.
- Başarılı login sonrası Navbar'da kullanıcının adının veya profil ikonunun belirdiğinin teyidi.

## Implementasyon Summary
- Modern ve fonksiyonel LoginForm bileşeni oluşturuldu (Captcha & 2FA desteği).
- AuthStore, cookie senkronizasyonu ile middleware erişimine uygun hale getirildi.
- Middleware tabanlı RBAC (Role Based Access Control) koruması aktif edildi.
- Navbar üzerinden Logout ve Auth-state tabanlı dinamik buton yönetimi sağlandı.
