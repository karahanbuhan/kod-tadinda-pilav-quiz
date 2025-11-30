# KOD TADINDA PİLAV: Quiz Uygulaması

**Yazılım, Yapay Zeka ve Yaratıcılık Kulübü (YYY)** olarak düzenlediğimiz "Kod Tadında Pilav" tanışma etkinliğinde katılımcıların ödül (tavuklu pilav) kazanmak için kullandığı yarışma/quiz sistemi.

Etkinlik detaylarına ve arşiv görüntülerine [buradan ulaşabilirsiniz](https://web.archive.org/web/20251130104928/https://www.esenyurt.edu.tr/haber/1560-kod-tadinda-pilav-kulupler-tanisma-etkinligiden-lezzetli-kareler).

## Ekran Görüntüleri
<img src="https://github.com/user-attachments/assets/ff664b89-6ebf-420a-bec6-fc11e18674f2" alt="Mobil Quiz Arayüzü" width="400" />
<img src="https://github.com/user-attachments/assets/4605d08c-b302-48f1-a5d1-2cc1df533de1" alt="Sonuç ve Admin Ekranı" width="800" />

## Özellikler
Bu proje, basit bir quiz uygulamasının ötesinde güvenli ve kesintisiz bir etkinlik deneyimi sunmak için geliştirilmiştir.

### Güvenlik ve Altyapı
- **Güvenli Oturum Yönetimi:** Admin girişlerinde cookie'ler, sunucu tarafında `crypto` kütüphanesi kullanılarak `HMAC SHA256` algoritması ile (Hex Digest) imzalanır.
- **Brute-Force Koruması:** Admin paneline yapılan hatalı giriş denemelerinde, saldırıları yavaşlatmak amacıyla sunucu tarafında zorunlu 5 saniyelik gecikme (cooldown) uygulanır.
- **State Persistence (Süreklilik):** Yarışmacıların ilerlemesi tarayıcı hafızasında tutulur. Sayfa yenilense veya tarayıcı kapansa bile kullanıcılar quiz'e kaldıkları sorudan ve aşamadan devam eder.

### Admin Paneli
- **Canlı Takip:** Kazanılan ödüllerin (Büyük/Küçük) ve teslim edilenlerin istatistikleri anlık olarak görüntülenir.
- **Son Kazananlar:** Sisteme düşen son 50 kazanan liste halinde sunulur.
- **Ödül Teslimatı:** Kazananın kodu girildiğinde veya listeden seçildiğinde ödül "Teslim Edildi" olarak işaretlenir ve mükerrer teslimat engellenir.

### Tasarım Kararları ve Notlar
- **IP Kısıtlaması:** Etkinlik okulun ortak Wi-Fi ağı üzerinden gerçekleştiği ve yüzlerce öğrenci aynı dış IP (NAT) üzerinden çıkış yaptığı için, erişim engeli yaşamamak adına IP tabanlı (IPv4) bir kısıtlama bilinçli olarak **uygulanmamıştır**. Bunun yerine tarayıcı bazlı kontroller tercih edilmiştir.

## Teknolojiler

- **Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Dil:** TypeScript
- **Stil:** TailwindCSS
- **Deployment:** Docker & Node.js

## Kurulum ve Çalıştırma (Local)

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/karahanbuhan/kod-tadinda-pilav-quiz.git
cd kod-tadinda-pilav-quiz
```

### 2. Kütüphaneleri Yükleyin
```bash
npm install
# veya
pnpm install
```

### 3. Çevresel Değişkenleri (.env) Ayarlayın
Projenin kök dizininde .env adında bir dosya oluşturun ve aşağıdaki değerleri girin.

*Not: ADMIN_SECRET cookie güvenliği için kullanılır, rastgele uzun bir string verebilirsiniz.*
```bash
# Admin paneli giriş şifresi
ADMIN_PASSWORD="super_gizli_sifre"

# Cookie imzalamak için gizli anahtar (Rastgele karmaşık bir değer girin)
ADMIN_SECRET="rastgele_uzun_ve_karmasik_bir_string_deger_giriniz_12345"
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda http://localhost:5173 adresine giderek uygulamayı görebilirsiniz.

## Docker ile Çalıştırma
Projeyi Docker konteyneri içerisinde production modunda çalıştırmak isterseniz:

### 1. Docker Image Oluşturun
```bash
docker build -t kod-tadinda-pilav-quiz .
```

### 2. Container'ı Başlatın
Environment değişkenlerini -e bayrağı ile verebilirsiniz:
```bash
docker run -d -p 3000:3000 \
  -e ADMIN_PASSWORD="super_gizli_sifre" \
  -e ADMIN_SECRET="rastgele_uzun_ve_karmasik_bir_string_deger_giriniz_12345" \
  --name yyy-quiz-app \
  kod-tadinda-pilav-quiz
```
Veya .env dosyasını doğrudan bağlayabilirsiniz:
```bash
docker run -d -p 3000:3000 --env-file .env --name yyy-quiz-app kod-tadinda-pilav-quiz
```
Uygulama http://localhost:3000 adresinde çalışacaktır.

## Build (Production)
Docker kullanmadan sunucuda çalıştırmak için build almanız gerekir:
```bash
npm run build
node build/index.js
# Adapter-node kullandığınız varsayılmıştır
```

## Lisans
Bu proje [MIT lisansı](https://github.com/karahanbuhan/kod-tadinda-pilav-quiz/blob/main/LICENSE) ile lisanslanmıştır. Dilediğiniz gibi kullanabilir, değiştirebilir ve geliştirebilirsiniz.

