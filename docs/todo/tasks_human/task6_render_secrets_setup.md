# Task 6: Render.com Kaynak Oluşturma ve GitHub Secrets (Human)

## 🎯 Hedef
Backend ve Frontend servislerinin canlıya (production) çıkabilmesi için Render.com üzerinde gerekli altyapıyı (PostgreSQL, Redis, Web Services) Blueprint ile oluşturmak ve GitHub Actions CI/CD akışını tetikleyecek "Deploy Hook" anahtarlarını GitHub Secrets'a eklemek.

## ⚠️ Ön Koşullar
- Render.com Professional plan aktif olmalı (Persistent Disk için zorunlu).
- GitHub reposu (`greenleaf-website`) hazır ve güncel olmalı.
- `render.yaml` dosyası reponun kök dizininde bulunmalı.

---

## 📋 1. Render Blueprint ile Kaynakların Oluşturulması

Render, projedeki `render.yaml` dosyasını okuyarak tüm servisleri (Postgres, Redis, API, Frontend) tek seferde otomatik olarak oluşturabilir.

- [ ] Render Dashboard'a git → **"New +"** butonuna tıkla → **"Blueprint"** seçeneğini seç.
- [ ] GitHub reposunu (`greenleaf-website`) bağla.
- [ ] Blueprint ismini gir (örn: `greenleaf-academy-system`).
- [ ] Render, `.yaml` dosyasını analiz edecek ve oluşturulacak servisleri listeleyecektir.
- [ ] **"Apply"** butonuna bas ve kurulumun tamamlanmasını bekle.

> [!IMPORTANT]
> Kurulum sırasında `APP_SECRET_KEY` ve `RESEND_API_KEY` gibi "sync: false" işaretlenmiş değişkenleri Render panelinden manuel olarak girmeniz gerekecektir.

---

## 📋 2. Deploy Hook URL'lerinin Alınması

Her servisin GitHub Actions tarafından tetiklenebilmesi için kendine has bir Deploy Hook URL'si vardır.

- [ ] Render Dashboard → **greenleaf-backend** servisine tıkla.
- [ ] Sol menüden **"Settings"** sekmesine git.
- [ ] Aşağı kaydırarak **"Deploy Hook"** bölümünü bul ve oradaki URL'yi kopyala.
- [ ] Aynı işlemi **greenleaf-frontend** servisi için de yap ve o URL'yi de not et.

---

## 📋 3. GitHub Secrets Yapılandırması

Kopyaladığınız bu gizli URL'leri GitHub'a ekleyerek CI/CD akışını yetkilendirin.

- [ ] GitHub reposuna git → **Settings** → **Secrets and variables** → **Actions**.
- [ ] **"New repository secret"** butonuna tıkla ve şu kayıtları ekle:

| Secret Adı | Değer |
|------------|-------|
| `RENDER_BACKEND_DEPLOY_HOOK` | Backend servisinden kopyaladığınız URL |
| `RENDER_FRONTEND_DEPLOY_HOOK` | Frontend servisinden kopyaladığınız URL |
| `BACKEND_URL` | `https://greenleaf-backend.onrender.com` (veya kendi custom domain'iniz) |
| `TEST_DATABASE_URL` | GitHub Actions testleri için kullanılan geçici bir DB URL (veya Render Postgres iç URL'si) |

---

## ✅ Kontrol Listesi

- [ ] Render üzerinde 4 adet servis (Postgres, Redis, Backend, Frontend) "Live" durumunda.
- [ ] Environment Variable'lar (APP_SECRET_KEY vb.) Render panelinden girildi.
- [ ] GitHub Secrets tarafında 2 adet Deploy Hook URL'si tanımlandı.
- [ ] GitHub Actions (Actions sekmesi) üzerinden ilk başarılı deploy gerçekleşti.

---

## 📝 Teknik Notlar

> **Neden Deploy Hook?** Render normalde repoya her push yapıldığında otomatik deploy yapabilir. Ancak biz GitHub Actions kullanarak önce testleri (pytest, lint) koşturuyoruz. Testler geçerse GitHub Actions bu "hook" URL'lerine istek atarak Render'ı tetikliyor. Bu sayede hatalı kodun canlıya çıkmasını engelliyoruz.
