import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { FileText } from "lucide-react";

export default function AydinlatmaPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="max-w-4xl mx-auto pt-32 px-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
            <FileText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Müşteri Aydınlatma Metni
            </h1>
            <p className="text-foreground/50 font-medium italic">
              6698 Sayılı KVKK Madde 10 Uyarınca Hazırlanmıştır
            </p>
          </div>
        </div>

        <GlassCard className="p-10 border-foreground/5 shadow-sm space-y-10 leading-relaxed">

          {/* ── Giriş ───────────────────────────────────────────────────────── */}
          <section className="space-y-4">
            <div className="bg-blue-500/5 rounded-2xl p-5 flex items-start gap-4 border border-blue-100/50">
              <span className="text-blue-500 text-xl mt-0.5">ℹ️</span>
              <p className="text-sm text-foreground/70">
                Bu aydınlatma metni; <strong className="text-foreground">Greenleaf Akademi</strong> platformunu
                kullanan tüm gerçek kişilere, 6698 sayılı Kişisel Verilerin Korunması Kanunu&apos;nun (KVKK)
                10. maddesi kapsamında kişisel verilerinizin nasıl işlendiğini bildirmek amacıyla hazırlanmıştır.
              </p>
            </div>
          </section>

          {/* ── 1. Veri Sorumlusu ───────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-blue-500 pl-4">
              1. Veri Sorumlusunun Kimliği
            </h2>
            <p className="text-foreground/70">
              Kişisel verileriniz; <strong className="text-foreground">Greenleaf Family Global Türkiye</strong>{" "}
              tarafından işletilen <strong className="text-foreground">Greenleaf Akademi</strong>{" "}
              (<span className="italic">greenleafakademi.com</span>) platformu aracılığıyla işlenmektedir.
            </p>
            <div className="bg-surface rounded-2xl p-5 text-sm text-foreground/70 space-y-1">
              <p><strong className="text-foreground">Veri Sorumlusu:</strong> Greenleaf Family Global Türkiye</p>
              <p><strong className="text-foreground">Platform:</strong> Greenleaf Akademi — greenleafakademi.com</p>
              <p>
                <strong className="text-foreground">İletişim:</strong>{" "}
                <a href="mailto:help@greenleafakademi.com" className="text-blue-600 underline hover:opacity-80">
                  help@greenleafakademi.com
                </a>
              </p>
            </div>
          </section>

          {/* ── 2. Kişisel Verilerin Toplanma Yöntemi ──────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-blue-500 pl-4">
              2. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi
            </h2>
            <p className="text-foreground/70">
              Kişisel verileriniz aşağıdaki kanallar aracılığıyla toplanmaktadır:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/70 text-sm">
              <li>
                <strong className="text-foreground">Kayıt ve giriş formları:</strong>{" "}
                Ad-soyad, kullanıcı adı, e-posta, telefon, şifre bilgileri doğrudan kullanıcı tarafından sağlanır.
              </li>
              <li>
                <strong className="text-foreground">Platform kullanımı sırasında otomatik olarak:</strong>{" "}
                İzlenen içerikler, tamamlama oranları, puanlar, giriş zamanları, IP adresi ve cihaz bilgileri.
              </li>
              <li>
                <strong className="text-foreground">Etkinlik takvim talebi formu:</strong>{" "}
                E-posta adresi ve isteğe bağlı ad-soyad (hem üyeler hem misafirler için).
              </li>
              <li>
                <strong className="text-foreground">Dış doğrulama:</strong>{" "}
                Greenleaf Global üyelik hak sahipliğinin teyidi amacıyla kullanıcı kimlik bilgisi (karma/hash formunda).
              </li>
            </ul>
            <p className="text-foreground/70 text-sm">
              Bu veriler; <strong>sözleşmenin kurulması ve ifası (KVKK m.5/2-c)</strong>,{" "}
              <strong>hukuki yükümlülük (m.5/2-ç)</strong> ve{" "}
              <strong>meşru menfaat (m.5/2-f)</strong> hukuki sebeplerine dayanılarak işlenmektedir.
              Açık rıza gerektiren işlemler (profil fotoğrafı, isteğe bağlı veriler) için ayrıca{" "}
              <strong>KVKK m.5/1</strong> kapsamında onayınız alınmaktadır.
            </p>
          </section>

          {/* ── 3. İşlenen Veriler ve Amaçlar ──────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-blue-500 pl-4">
              3. İşlenen Kişisel Veriler ve İşleme Amaçları
            </h2>

            <div className="space-y-3 text-sm text-foreground/70">
              {/* Üyelik */}
              <div className="bg-surface/50 rounded-xl p-4">
                <p className="font-black text-foreground mb-2">A. Üyelik, Kimlik Doğrulama ve Hesap Yönetimi</p>
                <p className="mb-2">
                  <strong>İşlenen Veriler:</strong> Ad-soyad, kullanıcı adı, e-posta, telefon numarası, şifre
                  (şifreli/hashlenmiş), Greenleaf Global kullanıcı adı (karma), hesap aktiflik ve doğrulama durumu,
                  KVKK onay tarihi ve IP adresi.
                </p>
                <p>
                  <strong>Amaçlar:</strong> Platforma üyelik ve giriş işlemlerinin yürütülmesi, kimlik doğrulama,
                  Greenleaf Global üyelik hakkının teyidi, hesap güvenliğinin sağlanması, hukuki uyumluluk kayıtlarının tutulması.
                </p>
              </div>

              {/* Eğitim */}
              <div className="bg-surface/50 rounded-xl p-4">
                <p className="font-black text-foreground mb-2">B. Eğitim Hizmetleri ve İlerleme Takibi</p>
                <p className="mb-2">
                  <strong>İşlenen Veriler:</strong> İzlenen içerikler (Shorts, Masterclass), tamamlama yüzdeleri,
                  kazanılan puanlar, rütbe ve sertifika bilgileri, platformdaki etkileşimler.
                </p>
                <p>
                  <strong>Amaçlar:</strong> Kişiselleştirilmiş eğitim içeriklerinin sunulması, ilerleme takibi,
                  gamification (puan/rütbe) sisteminin işletilmesi, sertifika ve başarı belgeleri oluşturulması,
                  platform hizmetinin geliştirilmesi.
                </p>
              </div>

              {/* İletişim */}
              <div className="bg-surface/50 rounded-xl p-4">
                <p className="font-black text-foreground mb-2">C. İletişim ve Bildirimler</p>
                <p className="mb-2">
                  <strong>İşlenen Veriler:</strong> E-posta adresi, telefon numarası (SMS onayı için kullanılmaz;
                  yalnızca profilde saklanır).
                </p>
                <p>
                  <strong>Amaçlar:</strong> Tek kullanımlık doğrulama kodlarının (OTP) gönderilmesi, etkinlik
                  takvim davetiyelerinin iletilmesi (.ics formatı), şifre sıfırlama bildirimleri, hesap güvenliğine
                  ilişkin kritik bildirimler.
                </p>
              </div>

              {/* Etkinlik RSVP */}
              <div className="bg-surface/50 rounded-xl p-4">
                <p className="font-black text-foreground mb-2">D. Etkinlik Takvimine Ekleme (RSVP)</p>
                <p className="mb-2">
                  <strong>İşlenen Veriler:</strong> E-posta adresi (zorunlu), ad-soyad (isteğe bağlı).
                </p>
                <p>
                  <strong>Amaçlar:</strong> Takvim davetiyesinin (.ics dosyası) talep edilen e-posta adresine
                  gönderilmesi ve etkinlik katılım talebinin kaydedilmesi.
                </p>
                <p className="mt-2 text-foreground/50 text-xs">
                  Bu veriler, ilgili etkinlik tarihinden itibaren <strong>6 ay</strong> içinde otomatik olarak
                  silinmektedir. Üye olmayan (misafir) kullanıcıların takvim taleplerine yalnızca herkese
                  açık (PUBLIC) etkinlikler için izin verilmektedir.
                </p>
              </div>

              {/* Güvenlik */}
              <div className="bg-surface/50 rounded-xl p-4">
                <p className="font-black text-foreground mb-2">E. Güvenlik ve Teknik Kayıtlar</p>
                <p className="mb-2">
                  <strong>İşlenen Veriler:</strong> IP adresi, cihaz parmak izi, oturum jetonları (JWT),
                  giriş/çıkış zamanları, tarayıcı ve cihaz bilgisi.
                </p>
                <p>
                  <strong>Amaçlar:</strong> Yetkisiz erişimlerin tespiti ve önlenmesi, çoklu cihaz yönetimi,
                  güvenlik ihlali durumunda adli analiz.
                </p>
              </div>
            </div>
          </section>

          {/* ── 4. Kişisel Verilerin Aktarımı ───────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-blue-500 pl-4">
              4. Kişisel Verilerin Aktarıldığı Kişiler ve Kurumlar
            </h2>
            <p className="text-foreground/70 text-sm">
              Verileriniz yalnızca aşağıdaki hizmet sağlayıcılar ile ve yalnızca hizmetin ifası için
              zorunlu olan ölçüde paylaşılmaktadır. Verileriniz ticari amaçla üçüncü taraflara satılmaz veya
              kiralanmaz.
            </p>
            <div className="space-y-2 text-sm text-foreground/70">
              <div className="flex gap-3 p-3 bg-surface/50 rounded-xl">
                <span className="text-blue-500 font-black shrink-0">→</span>
                <div>
                  <strong className="text-foreground">Greenleaf Family Global:</strong> Üyelik hak sahipliği
                  doğrulaması için yalnızca karma (hash) kullanıcı adı; yurt içi aktarım.
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-surface/50 rounded-xl">
                <span className="text-blue-500 font-black shrink-0">→</span>
                <div>
                  <strong className="text-foreground">Google LLC (Gmail API):</strong> Transaksiyonel e-posta
                  gönderimi. AB Standart Sözleşme Maddeleri (SCCs) kapsamında yurt dışına aktarım.
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-surface/50 rounded-xl">
                <span className="text-blue-500 font-black shrink-0">→</span>
                <div>
                  <strong className="text-foreground">Render, Inc. (ABD) – Barındırma:</strong> Uygulama,
                  veritabanı ve dosya depolama altyapısı. KVKK m.9 kapsamında SCCs ile aktarım.
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-surface/50 rounded-xl">
                <span className="text-blue-500 font-black shrink-0">→</span>
                <div>
                  <strong className="text-foreground">Cloudflare, Inc. (ABD) – CDN/DNS:</strong> Web trafiğinin
                  güvenli iletimi; yalnızca ağ meta verisi işlenir.
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-surface/50 rounded-xl">
                <span className="text-blue-500 font-black shrink-0">→</span>
                <div>
                  <strong className="text-foreground">Yetkili Kamu Kurumları:</strong> Yasal zorunluluk hâlinde
                  ilgili makamlarla paylaşım yapılabilir.
                </div>
              </div>
            </div>
          </section>

          {/* ── 5. Saklama Süreleri ──────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-blue-500 pl-4">
              5. Kişisel Verilerin Saklanma Süreleri
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/70 text-sm">
              <li>
                <strong className="text-foreground">Hesap ve profil verileri:</strong>{" "}
                Hesabınız aktif olduğu sürece saklanır. Hesabın silinmesi veya kapatılmasından itibaren
                en geç <strong>30 gün</strong> içinde, hukuki kayıtlar ise <strong>2 yıl</strong> sonra silinir.
              </li>
              <li>
                <strong className="text-foreground">Etkinlik RSVP verileri:</strong>{" "}
                Etkinlik tarihinden itibaren <strong>6 ay</strong> sonra otomatik olarak silinir;
                talep hâlinde daha erken silinebilir.
              </li>
              <li>
                <strong className="text-foreground">Güvenlik ve oturum kayıtları:</strong>{" "}
                Oturum kapatılmasından itibaren <strong>90 gün</strong> içinde silinir.
              </li>
              <li>
                <strong className="text-foreground">OTP / geçici veriler:</strong>{" "}
                Kullanılır ya da kullanılmaz; en fazla <strong>10 dakika</strong> içinde otomatik silinir.
              </li>
              <li>
                <strong className="text-foreground">KVKK onay kayıtları:</strong>{" "}
                Hukuki yükümlülük gereğince <strong>3 yıl</strong> boyunca saklanır.
              </li>
            </ul>
          </section>

          {/* ── 6. İlgili Kişi Hakları ───────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-blue-500 pl-4">
              6. İlgili Kişi Olarak Haklarınız
            </h2>
            <p className="text-foreground/70 text-sm">
              KVKK&apos;nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground/70">
              {[
                ["Bilgi edinme hakkı", "Kişisel verilerinizin işlenip işlenmediğini öğrenebilirsiniz."],
                ["Erişim hakkı", "İşlenen verilerinize ve nasıl kullanıldığına dair bilgi alabilirsiniz."],
                ["Düzeltme hakkı", "Hatalı veya eksik verilerinizin düzeltilmesini talep edebilirsiniz."],
                ["Silme / Yok etme hakkı", "Koşulların oluşması hâlinde verilerinizin silinmesini isteyebilirsiniz."],
                ["İtiraz hakkı", "Otomatik kararlar veya meşru menfaate dayalı işlemlere itiraz edebilirsiniz."],
                ["Aktarım bilgisi hakkı", "Verilerinizin hangi üçüncü taraflara aktarıldığını öğrenebilirsiniz."],
                ["Hesap silme", "Ayarlar sayfasındaki &ldquo;Hesabımı Kalıcı Olarak Kapat&rdquo; seçeneğiyle tüm verilerinizi silebilirsiniz."],
                ["Zarar giderimi", "Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde tazminat talep edebilirsiniz."],
              ].map(([başlık, açıklama]) => (
                <div key={başlık} className="bg-surface/50 rounded-xl p-4">
                  <p className="font-black text-foreground text-[13px]">{başlık}</p>
                  <p className="mt-0.5 text-[12px]">{açıklama}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 7. Başvuru Yöntemi ───────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-blue-500 pl-4">
              7. Başvuru Yöntemi
            </h2>
            <p className="text-foreground/70 text-sm">
              Haklarınıza ilişkin başvurularınızı aşağıdaki yollarla iletebilirsiniz.
              Başvurular en geç <strong className="text-foreground">30 (otuz) gün</strong> içinde yanıtlanacaktır.
            </p>
            <div className="bg-blue-500/5 rounded-2xl p-5 border border-blue-100/50 text-sm text-foreground/70 space-y-3">
              <div>
                <p className="font-black text-foreground">📧 E-Posta ile Başvuru (Önerilen)</p>
                <p className="mt-1">
                  Konu: <em>&ldquo;KVKK Hakkı Kullanım Talebi&rdquo;</em> başlığıyla{" "}
                  <a href="mailto:help@greenleafakademi.com" className="text-blue-600 underline hover:opacity-80 font-semibold">
                    help@greenleafakademi.com
                  </a>{" "}
                  adresine e-posta gönderebilirsiniz. Başvuruda ad-soyadınız, kayıtlı e-posta adresiniz
                  ve talebinizin açıklamasının bulunması süreci hızlandıracaktır.
                </p>
              </div>
              <div>
                <p className="font-black text-foreground">🖥 Platform Üzerinden</p>
                <p className="mt-1">
                  Hesabınıza giriş yaparak <em>Ayarlar</em> sayfasından profil bilgilerinizi güncelleyebilir
                  veya hesabınızı kalıcı olarak silebilirsiniz.
                </p>
              </div>
              <p className="text-foreground/40 text-xs border-t border-border pt-3">
                Başvurunuzda kimliğinizin doğrulanması amacıyla ek bilgi talep edilebilir.
                Gerçeğe aykırı başvurular nedeniyle doğabilecek hukuki sorumluluk başvuru sahibine aittir.
              </p>
            </div>
          </section>

          {/* ── 8. Çerezler ─────────────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-foreground border-l-4 border-blue-500 pl-4">
              8. Çerezler (Cookies)
            </h2>
            <p className="text-foreground/70 text-sm">
              Platform; oturumun sürdürülmesi (zorunlu çerezler), tema tercihinizin hatırlanması ve
              kimlik doğrulama amacıyla tarayıcı çerezleri kullanmaktadır. Çerezler üçüncü taraf
              reklam veya izleme amacıyla kullanılmamaktadır. Tarayıcı ayarlarınızdan çerezleri
              devre dışı bırakabilirsiniz; ancak bu durumda giriş yapma ve oturum sürdürme
              özellikleri çalışmayabilir.
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
