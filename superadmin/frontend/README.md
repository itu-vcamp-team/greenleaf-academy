# Greenleaf Superadmin – Frontend

Next.js tabanlı superadmin paneli. Birden fazla Greenleaf Academy deployment'ını yönetir.

## Özellikler

- Deployment listesi ve yönetimi
- Deployment başına kullanıcı yönetimi (oluştur, aktif/pasif yap)
- Deployment başına istatistikler (partner sayısı, içerik sayısı)
- Superadmin kimlik doğrulama (ana uygulamadan tamamen bağımsız)

## Kurulum

```bash
npm install
npm run dev   # Varsayılan port: 4000
```

## Bağlantı

Superadmin backend'e bağlanır: `http://localhost:9000` (lokal)

## Ortam Değişkenleri

```env
NEXT_PUBLIC_SUPERADMIN_API_URL=http://localhost:9000
```
