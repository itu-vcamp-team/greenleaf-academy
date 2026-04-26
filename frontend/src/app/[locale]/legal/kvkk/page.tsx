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
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">KVKK Politikası</h1>
            <p className="text-gray-500 font-medium italic">Kişisel Verilerin Korunması ve İşlenmesi</p>
          </div>
        </div>

        <GlassCard className="p-10 border-foreground/5 shadow-sm space-y-8 text-gray-700 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 border-l-4 border-primary pl-4">1. Veri Sorumlusu</h2>
            <p>
              Greenleaf Akademi olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca,
              verilerinizin güvenliğini en üst seviyede tutuyoruz. Bu metin, platformumuzu kullanırken
              toplanan verilerinizin nasıl işlendiği ve korunduğu hakkında sizi bilgilendirmek amacıyla hazırlanmıştır.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 border-l-4 border-primary pl-4">2. Toplanan Veriler</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Kimlik Bilgileri (Ad, Soyad, Kullanıcı Adı)</li>
              <li>İletişim Bilgileri (E-posta adresi, Telefon numarası)</li>
              <li>Eğitim Verileri (İzlenen videolar, tamamlanan eğitimler, puanlar)</li>
              <li>Sistem Kayıtları (IP adresi, tarayıcı bilgileri, giriş zamanları)</li>
              <li>
                <strong>Etkinlik Takvim İstekleri:</strong> Bir etkinliği takviminize eklemek istediğinizde
                sağladığınız ad-soyad (isteğe bağlı) ve e-posta adresi. Bu veri etkinlik davetiyesi
                göndermek ve etkinlik ilgi analizleri yapmak amacıyla işlenmektedir.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 border-l-4 border-primary pl-4">3. İşleme Amaçları</h2>
            <p>
              Toplanan verileriniz; platform üyelik işlemlerinin tamamlanması, eğitim süreçlerinin takibi,
              size özel içeriklerin sunulması, etkinlik davetiyelerinin iletilmesi ve yasal yükümlülüklerin
              yerine getirilmesi amacıyla işlenmektedir.
            </p>
            <p>
              Etkinlik takvim daveti kapsamında sağlanan e-posta adresi; yalnızca talep edilen takvim
              davetiyesinin gönderilmesi ve ilgili etkinlik hakkında bilgilendirme amacıyla kullanılır.
              KVKK madde 5/f bendi uyarınca <em>meşru menfaat</em> hukuki sebebine dayanılmaktadır.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 border-l-4 border-primary pl-4">4. Veri Aktarımı</h2>
            <p>
              Kişisel verileriniz, yasal zorunluluklar haricinde asla üçüncü şahıslarla paylaşılmaz.
              Sadece Greenleaf Global ekosistemi içerisindeki doğrulama süreçleri için gerekli olan
              asgari veriler ilgili birimlerle paylaşılabilir. E-posta gönderimi için Resend Inc.
              altyapısı kullanılmakta olup bu aktarım KVKK&apos;nın 9. maddesi kapsamında gerekli
              güvencelerle gerçekleştirilmektedir.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 border-l-4 border-primary pl-4">5. Veri Saklama Süresi</h2>
            <p>
              Üyelik verileri hesap aktif olduğu süre boyunca saklanır. Etkinlik takvim isteklerine
              ilişkin e-posta ve isim bilgileri, ilgili etkinlik tarihinden itibaren <strong>6 ay</strong> sonra
              otomatik olarak sistemden kaldırılır veya talep üzerine daha erken silinir.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 border-l-4 border-primary pl-4">6. Haklarınız</h2>
            <p>
              KVKK&apos;nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse
              bilgi talep etme, düzeltilmesini veya silinmesini isteme haklarına sahipsiniz. Taleplerinizi
              profil ayarlarınız üzerinden veya{" "}
              <a href="mailto:noreply@greenleafakademi.com" className="text-primary underline hover:opacity-80">
                noreply@greenleafakademi.com
              </a>{" "}
              adresine e-posta göndererek iletebilirsiniz.
            </p>
          </section>

          <div className="pt-8 border-t border-gray-100 flex justify-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Son Güncelleme: 26 Nisan 2026
            </p>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
