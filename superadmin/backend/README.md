# Greenleaf Superadmin – Backend

Ayrı bir FastAPI servisi. Birden fazla Greenleaf Academy deployment'ını merkezi olarak yönetir.

## Mimari

- **Kendi veritabanı**: Deployment kayıtları, superadmin kullanıcılar
- **REST API entegrasyonu**: Her deployment'ın `/api` endpoint'lerine bağlanır
- **Yetenekler**: Deployment yönet, kullanıcı oluştur, istatistik görüntüle

## Klasör Yapısı

```
backend/
├── src/
│   ├── app.py              # FastAPI uygulaması
│   ├── config.py           # Ayarlar
│   ├── models/
│   │   ├── deployment.py   # Deployment kaydı (url, api_key, ülke)
│   │   └── superadmin.py   # Superadmin kullanıcılar
│   ├── routes/
│   │   ├── auth.py         # Superadmin login
│   │   ├── deployments.py  # Deployment CRUD
│   │   └── proxy.py        # Deployment API proxy
│   └── services/
│       └── deployment_service.py
├── alembic/                # Superadmin DB migrations
├── requirements.txt
└── Dockerfile
```

## Çalıştırma

```bash
uvicorn src.app:app --host 0.0.0.0 --port 9000 --reload
```
