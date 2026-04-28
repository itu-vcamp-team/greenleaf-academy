"""
Gmail OAuth2 Refresh Token Alma Script'i
=========================================
Bu script yalnızca bir kez çalıştırılır:
GMAIL_REFRESH_TOKEN değerini almanı sağlar.

KULLANIM:
  1. pip install google-auth-oauthlib
  2. .env veya ortam değişkeni olarak ayarla:
       GMAIL_CLIENT_ID=...
       GMAIL_CLIENT_SECRET=...
  3. python get_gmail_refresh_token.py
  4. Açılan URL'yi tarayıcında ziyaret et, noreply@ hesabıyla giriş yap.
  5. Terminale dönen "Refresh Token" değerini .env'e kopyala.
"""

import os
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

client_id = os.environ.get("GMAIL_CLIENT_ID") or input("GMAIL_CLIENT_ID: ").strip()
client_secret = os.environ.get("GMAIL_CLIENT_SECRET") or input("GMAIL_CLIENT_SECRET: ").strip()

client_config = {
    "installed": {
        "client_id": client_id,
        "client_secret": client_secret,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"],
    }
}

flow = InstalledAppFlow.from_client_config(client_config, scopes=SCOPES)

# access_type=offline → Refresh token üretir
# prompt=consent     → Her seferinde refresh token döndürür (yeniden onay)
creds = flow.run_local_server(
    port=0,
    access_type="offline",
    prompt="consent",
)

print("\n" + "=" * 60)
print("✅  Başarılı! Aşağıdaki değerleri .env dosyana kopyala:")
print("=" * 60)
print(f"GMAIL_CLIENT_ID={client_id}")
print(f"GMAIL_CLIENT_SECRET={client_secret}")
print(f"GMAIL_REFRESH_TOKEN={creds.refresh_token}")
print("=" * 60 + "\n")
