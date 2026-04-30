import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Shield } from "lucide-react";

export default function KVKKPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="max-w-4xl mx-auto pt-32 px-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Kişisel Verilerin Korunması ve İşlenmesi Politikası
            </h1>
            <p className="text-foreground/50 font-medium italic">KVKK Madde 10 Kapsamında Bilgilendirme</p>
          </div>
        </div>

        <GlassCard className="p-10 border-foreground/5 shadow-sm space-y-10 leading-relaxed">

          {/* ── 1. Veri Sorumlusu ───────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-primary pl-4">
              1. Veri Sorumlusunun Kimliği
            </h2>
            <p className="text-foreground/70">
              İşbu Kişisel Verilerin Korunması ve İşlenmesi Politikası (&ldquo;Politika&rdquo;),{" "}
              <strong className="text-foreground">Greenleaf Family Global Türkiye</strong> tarafından
              işletilen <strong className="text-foreground">Greenleaf Akademi</strong> dijital eğitim platformu
              &mdash; <span className="italic">greenleafakademi.com</span> &mdash; kullanıcılarına yönelik
              olarak hazırlanmıştır.
            </p>
            <p className="text-foreground/70">
              6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) kapsamında{" "}
              <strong className="text-foreground">veri sorumlusu</strong> sıfatını taşıyan Greenleaf Family
              Global Türkiye; kişisel verilerinizin gizliliğine ve güvenliğine azami önem göstermektedir.
            </p>
            <div className="bg-surface rounded-2xl p-5 text-sm text-foreground/70 space-y-1">
              <p><strong className="text-foreground">Platform Adı:</strong> Greenleaf Akademi</p>
              <p><strong className="text-foreground">Web Adresi:</strong> https://greenleafakademi.com</p>
              <p>
                <strong className="text-foreground">KVKK Başvuru İletişimi:</strong>{" "}
                <a href="mailto:kvkk@greenleafakademi.com" className="text-primary underline hover:opacity-80">
                  kvkk@greenleafakademi.com
                </a>
              </p>
            </div>
          </section>

          {/* ── 2. Kapsam ───────────────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-primary pl-4">
              2. Politikanın Kapsamı ve Amacı
            </h2>
            <p className="text-foreground/70">
              Bu Politika; Greenleaf Akademi platformunu ziyaret eden, platforma kayıt yaptıran veya herhangi bir
              özelliğini kullanan tüm gerçek kişilerin kişisel verilerinin hangi amaçlarla, hangi hukuki
              dayanaklar çerçevesinde ve ne süreyle işlendiğini şeffaf biçimde açıklamaktadır.
            </p>
            <p className="text-foreground/70">
              Platform hizmetleri; kısa videolar (Shorts), uzun biçimli masterclass içerikleri, etkinlik takvimi,
              ilerleme takibi ve sertifika süreçlerini kapsamakta; gelecekte ek özelliklerle genişleyebilmektedir.
            </p>
          </section>

          {/* ── 3. İşlenen Veri Kategorileri ────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-primary pl-4">
              3. İşlenen Kişisel Veri Kategorileri
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-surface text-foreground/60 text-xs uppercase tracking-wider">
                    <th className="text-left p-3 rounded-tl-xl font-black">Veri Kategorisi</th>
                    <th className="text-left p-3 font-black">Veri Türleri</th>
                    <th className="text-left p-3 rounded-tr-xl font-black">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground/70">
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Kimlik</td>
                    <td className="p-3">Ad-soyad, kullanıcı adı</td>
                    <td className="p-3">Kayıt ve kimlik doğrulama</td>
                  </tr>
                  <tr className="bg-surface/50">
                    <td className="p-3 font-semibold text-foreground">İletişim</td>
                    <td className="p-3">E-posta adresi, cep telefonu numarası</td>
                    <td className="p-3">Bildirimler, OTP doğrulama, e-posta gönderimi</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Eğitim & İlerleme</td>
                    <td className="p-3">İzlenen içerikler, tamamlama oranları, kazanılan puanlar, rütbe</td>
                    <td className="p-3">İlerleme takibi, sertifika ve gamification</td>
                  </tr>
                  <tr className="bg-surface/50">
                    <td className="p-3 font-semibold text-foreground">Görsel</td>
                    <td className="p-3">Profil fotoğrafı</td>
                    <td className="p-3">Kullanıcı tarafından isteğe bağlı yüklenir</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Etkinlik RSVP</td>
                    <td className="p-3">E-posta, ad-soyad (isteğe bağlı)</td>
                    <td className="p-3">Takvim daveti ve etkinlik katılım talebi</td>
                  </tr>
                  <tr className="bg-surface/50">
                    <td className="p-3 font-semibold text-foreground">Cihaz & Oturum</td>
                    <td className="p-3">Cihaz parmak izi, IP adresi, oturum bilgileri, tarayıcı bilgisi</td>
                    <td className="p-3">Güvenlik, çok cihaz yönetimi, yetkisiz erişim tespiti</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Hukuki & Onay</td>
                    <td className="p-3">KVKK/Aydınlatma metni onay tarihi ve IP adresi</td>
                    <td className="p-3">Hukuki yükümlülük ve uyumluluk kaydı</td>
                  </tr>
                  <tr className="bg-surface/50">
                    <td className="p-3 font-semibold text-foreground">Dış Doğrulama</td>
                    <td className="p-3">Greenleaf Global kullanıcı adı (karma / hash olarak saklanır)</td>
                    <td className="p-3">Üyelik hak sahipliğinin doğrulanması</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 4. Amaçlar ve Hukuki Dayanaklar ────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-primary pl-4">
              4. Kişisel Verilerin İşlenme Amaçları ve Hukuki Dayanakları
            </h2>
            <div className="space-y-3 text-foreground/70">
              <div className="bg-surface/50 rounded-xl p-4">
                <p className="font-black text-foreground mb-1">Üyelik ve Kimlik Doğrulama</p>
                <p className="text-sm">
                  Platforma kayıt, hesap oluşturma, giriş işlemleri ve Greenleaf Global üyelik hak
                  sahipliğinin doğrulanması. Hukuki Dayanak:{" "}
                  <strong>KVKK m.5/2-c</strong> (sözleşmenin kurulması ve ifası).
                </p>
              </div>
              <div className="bg-surface/50 rounded-xl p-4">
                <p className="font-black text-foreground mb-1">Eğitim Hizmetlerinin Sunulması</p>
                <p className="text-sm">
                  İçeriklere erişim, video oynatma, ilerleme takibi, puan/rütbe hesaplama ve
                  sertifika süreçlerinin yürütülmesi. Hukuki Dayanak:{" "}
                  <strong>KVKK m.5/2-c</strong> (sözleşmenin ifası).
                </p>
              </div>
              <div className="bg-surface/50 rounded-xl p-4">
                <p className="font-black text-foreground mb-1">İletişim ve Bildirimler</p>
                <p className="text-sm">
                  OTP doğrulama kodları, etkinlik davetiye e-postaları (.ics), şifre sıfırlama,
                  hesap güvenliği bildirimleri. Hukuki Dayanak:{" "}
                  <strong>KVKK m.5/2-c</strong> (sözleşmenin ifası) ve{" "}
                  <strong>m.5/2-f</strong> (meşru menfaat).
                </p>
              </div>
              <div className="bg-surface/50 rounded-xl p-4">
                <p className="font-black text-foreground mb-1">Güvenlik ve Dolandırıcılık Önleme</p>
                <p className="text-sm">
                  IP adresi ve cihaz bilgilerinin oturum güvenliği amacıyla işlenmesi, yetkisiz
                  erişim girişimlerinin tespiti. Hukuki Dayanak:{" "}
                  <strong>KVKK m.5/2-f</strong> (meşru menfaat) ve{" "}
                  <strong>m.5/2-ç</strong> (hukuki yükümlülük).
                </p>
              </div>
              <div className="bg-surface/50 rounded-xl p-4">
                <p className="font-black text-foreground mb-1">Hukuki Uyumluluk</p>
                <p className="text-sm">
                  KVKK ve ilgili mevzuat kapsamında onay kayıtlarının tutulması, yetkili kurum
                  ve kuruluşlara bilgi verilmesi. Hukuki Dayanak:{" "}
                  <strong>KVKK m.5/2-ç</strong> (hukuki yükümlülük).
                </p>
              </div>
              <div className="bg-surface/50 rounded-xl p-4">
                <p className="font-black text-foreground mb-1">Platform Geliştirme ve Analitik</p>
                <p className="text-sm">
                  Anonim/toplulaştırılmış istatistikler aracılığıyla platform performansının ve
                  içerik kalitesinin iyileştirilmesi. Kişisel veri bu amaçla anonimleştirilerek
                  kullanılmaktadır. Hukuki Dayanak:{" "}
                  <strong>KVKK m.5/2-f</strong> (meşru menfaat).
                </p>
              </div>
            </div>
          </section>

          {/* ── 5. Veri Aktarımı ─────────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-primary pl-4">
              5. Kişisel Verilerin Aktarıldığı Taraflar
            </h2>
            <p className="text-foreground/70">
              Kişisel verileriniz yalnızca aşağıda belirtilen taraflarla ve aktarım gerekçesi dahilinde
              paylaşılmaktadır. Üçüncü taraflarla ticari amaçlı satış, kiralama veya paylaşım yapılmamaktadır.
            </p>
            <div className="space-y-3 text-foreground/70 text-sm">
              <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-xl">
                <span className="text-primary font-black mt-0.5 shrink-0">▸</span>
                <div>
                  <strong className="text-foreground">Greenleaf Family Global (Yurt İçi)</strong>
                  <p className="mt-0.5">Üyelik hak sahipliğinin doğrulanması amacıyla karma hâldeki kullanıcı adı bilgisi. KVKK m.8 kapsamında yurt içi aktarım.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-xl">
                <span className="text-primary font-black mt-0.5 shrink-0">▸</span>
                <div>
                  <strong className="text-foreground">Google LLC – Gmail API</strong>
                  <p className="mt-0.5">Transaksiyonel e-posta gönderimi (OTP, davetiye, bildirim). Google, AB Standart Sözleşme Maddeleri (SCCs) çerçevesinde veri işlemektedir.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-xl">
                <span className="text-primary font-black mt-0.5 shrink-0">▸</span>
                <div>
                  <strong className="text-foreground">Render, Inc. (ABD) – Barındırma Altyapısı</strong>
                  <p className="mt-0.5">Uygulama ve veritabanı barındırma (Backend, PostgreSQL, Redis). KVKK m.9 kapsamında yeterli koruma sağladığı taahhüt edilen ülkeye aktarım / SCCs geçerlidir.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-xl">
                <span className="text-primary font-black mt-0.5 shrink-0">▸</span>
                <div>
                  <strong className="text-foreground">Cloudflare, Inc. (ABD) – DNS ve CDN</strong>
                  <p className="mt-0.5">Alan adı çözümleme, DDoS koruması ve web güvenliği. Yalnızca ağ trafiği meta verisi işlenir; içerik şifreli iletilir.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-xl">
                <span className="text-primary font-black mt-0.5 shrink-0">▸</span>
                <div>
                  <strong className="text-foreground">Yetkili Kamu Kurumları</strong>
                  <p className="mt-0.5">Yasal zorunluluk hâlinde mahkemeler, savcılıklar ve diğer yetkili idari otoritelerle paylaşım yapılabilir (KVKK m.5/2-ç).</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── 6. Yurt Dışı Aktarım ─────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-primary pl-4">
              6. Kişisel Verilerin Yurt Dışına Aktarımı
            </h2>
            <p className="text-foreground/70">
              Platform altyapısı Render, Inc. ve Cloudflare, Inc. bünyesindeki sunucularda barındırılmaktadır.
              Bu hizmet sağlayıcılar Amerika Birleşik Devletleri merkezli olup KVKK&apos;nın 9. maddesi
              kapsamında:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/70 text-sm">
              <li>AB Komisyonu tarafından onaylı Standart Sözleşme Maddeleri (SCCs) mekanizması,</li>
              <li>Hizmet sağlayıcının bağlayıcı kurumsal kural taahhütleri</li>
            </ul>
            <p className="text-foreground/70">
              çerçevesinde kişisel veriler yurt dışına aktarılmaktadır. Kişisel veri aktarımı sırasında
              TLS şifrelemesi kullanılmakta; veriler bölünmüş veya anonimleştirilmiş biçimde
              mümkün olan en dar kapsamda iletilmektedir.
            </p>
          </section>

          {/* ── 7. Saklama Süreleri ──────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-primary pl-4">
              7. Kişisel Verilerin Saklama Süreleri
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-surface text-foreground/60 text-xs uppercase tracking-wider">
                    <th className="text-left p-3 rounded-tl-xl font-black">Veri Kategorisi</th>
                    <th className="text-left p-3 rounded-tr-xl font-black">Saklama Süresi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground/70">
                  <tr>
                    <td className="p-3">Hesap ve kimlik verileri</td>
                    <td className="p-3">Hesap aktif olduğu süre + hesap silme/kapatma tarihinden itibaren <strong>2 yıl</strong></td>
                  </tr>
                  <tr className="bg-surface/50">
                    <td className="p-3">Eğitim & ilerleme verileri</td>
                    <td className="p-3">Hesap aktif olduğu süre; hesap silinince en geç <strong>30 gün</strong> içinde</td>
                  </tr>
                  <tr>
                    <td className="p-3">Etkinlik RSVP verileri</td>
                    <td className="p-3">Etkinlik tarihinden itibaren <strong>6 ay</strong>; talep hâlinde daha erken</td>
                  </tr>
                  <tr className="bg-surface/50">
                    <td className="p-3">Oturum ve cihaz verileri</td>
                    <td className="p-3">Oturum sonlanmasından itibaren <strong>90 gün</strong> (güvenlik logları)</td>
                  </tr>
                  <tr>
                    <td className="p-3">OTP ve geçici veriler</td>
                    <td className="p-3">Kullanım veya süre dolumu ile birlikte anında; en fazla <strong>10 dakika</strong></td>
                  </tr>
                  <tr className="bg-surface/50">
                    <td className="p-3">Hukuki uyumluluk kayıtları (onay, IP)</td>
                    <td className="p-3">KVKK uyarınca <strong>3 yıl</strong></td>
                  </tr>
                  <tr>
                    <td className="p-3">Profil fotoğrafı</td>
                    <td className="p-3">Hesap aktif olduğu süre; hesap silindiğinde</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-foreground/70 text-sm">
              Saklama süreleri dolduğunda veriler otomatik sistemler veya periyodik temizlik süreçleri
              aracılığıyla geri dönüşü olmayan biçimde silinmekte veya anonimleştirilmektedir.
            </p>
          </section>

          {/* ── 8. Veri Güvenliği ────────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-primary pl-4">
              8. Veri Güvenliği Tedbirleri
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/70 text-sm">
              <li><strong className="text-foreground">Şifreleme:</strong> Tüm iletişim TLS 1.2+ ile şifreli olarak sağlanmaktadır. Şifreler bcrypt algoritmasıyla hashlenerek saklanmakta; asla düz metin (plaintext) tutulmamaktadır.</li>
              <li><strong className="text-foreground">Erişim Kontrolü:</strong> Kişisel verilere yalnızca yetkili personel erişebilmektedir. Rol tabanlı erişim modeli (RBAC) uygulanmaktadır.</li>
              <li><strong className="text-foreground">Oturum Yönetimi:</strong> JWT tabanlı oturum sistemi kullanılmakta; oturum jetonları kısa ömürlüdür ve her giriş için yeniden oluşturulmaktadır.</li>
              <li><strong className="text-foreground">İki Adımlı Doğrulama:</strong> Hassas işlemler (şifre değişikliği, e-posta değişikliği, hesap silme) e-posta üzerinden tek kullanımlık kod (OTP) ile doğrulanmaktadır.</li>
              <li><strong className="text-foreground">Rate Limiting:</strong> Brute-force ve DoS saldırılarına karşı istek sınırlama uygulanmaktadır.</li>
              <li><strong className="text-foreground">Veri Minimizasyonu:</strong> Yalnızca hizmetin gerektirdiği asgari veri toplanmaktadır.</li>
            </ul>
          </section>

          {/* ── 9. İlgili Kişi Hakları ───────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-primary pl-4">
              9. İlgili Kişi Hakları
            </h2>
            <p className="text-foreground/70">
              KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground/70">
              {[
                ["Bilgi edinme", "Kişisel verilerinizin işlenip işlenmediğini öğrenme"],
                ["Bilgi talep etme", "İşlendiği hâllerde buna ilişkin bilgi talep etme"],
                ["İşleme amacını öğrenme", "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme"],
                ["Yurt içi/dışı aktarımı öğrenme", "Verilerin aktarıldığı üçüncü kişileri öğrenme"],
                ["Düzeltme talep etme", "Eksik veya yanlış işlenen verilerin düzeltilmesini isteme"],
                ["Silme / yok etme", "Koşulların oluşması hâlinde verilerinizin silinmesini veya yok edilmesini isteme"],
                ["İtiraz", "Otomatik sistemlerle aleyhinize çıkan sonuçlara itiraz etme"],
                ["Zarar giderimi", "Kanuna aykırı işleme nedeniyle uğradığınız zararın giderilmesini talep etme"],
              ].map(([başlık, açıklama]) => (
                <div key={başlık} className="bg-surface/50 rounded-xl p-4">
                  <p className="font-black text-foreground text-[13px]">{başlık}</p>
                  <p className="mt-0.5 text-[12px]">{açıklama}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 10. Başvuru Yöntemi ──────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-primary pl-4">
              10. Başvuru Yöntemi ve İletişim
            </h2>
            <p className="text-foreground/70">
              Yukarıda sayılan haklarınıza ilişkin taleplerinizi aşağıdaki kanallar aracılığıyla iletebilirsiniz.
              Başvurunuz en geç{" "}<strong className="text-foreground">30 gün</strong>{" "}içinde yanıtlanacaktır.
            </p>
            <div className="bg-surface/50 rounded-2xl p-5 text-sm text-foreground/70 space-y-2">
              <p>
                <strong className="text-foreground">📧 E-Posta (tercih edilen):</strong>{" "}
                <a href="mailto:kvkk@greenleafakademi.com" className="text-primary underline hover:opacity-80">
                  kvkk@greenleafakademi.com
                </a>
              </p>
              <p>
                <strong className="text-foreground">🖥 Platform İçi:</strong>{" "}
                Giriş yaparak{" "}
                <span className="italic">Ayarlar &gt; Kişisel Bilgiler</span>{" "}
                bölümünden talep formunu doldurabilirsiniz.
              </p>
              <p className="text-foreground/50 text-xs mt-3">
                Başvurularınızda ad-soyad, e-posta, talep konusu ve açıklamanızın bulunması işlem sürecini hızlandırır.
                Kimlik teyidi amacıyla ek bilgi talep edilebilir.
              </p>
            </div>
          </section>

          {/* ── 11. Politika Değişiklikleri ──────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-primary pl-4">
              11. Politika Değişiklikleri
            </h2>
            <p className="text-foreground/70">
              Bu Politika, yürürlükteki mevzuata uyum, platform özelliklerindeki değişiklikler veya
              idari kararlar doğrultusunda güncellenebilir. Önemli değişiklikler platform üzerinden ve/veya
              e-posta yoluyla bildirilecektir. Güncel politikaya her zaman bu sayfadan ulaşabilirsiniz.
            </p>
          </section>

          {/* ── Footer ───────────────────────────────────────────────────────── */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-foreground/40 font-bold uppercase tracking-widest">
              Son Güncelleme: 30 Nisan 2026
            </p>
            <p className="text-xs text-foreground/40">
              Greenleaf Akademi · greenleafakademi.com
            </p>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
