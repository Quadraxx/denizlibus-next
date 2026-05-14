# 🚌 Denizli Akıllı Ulaşım A.Ş. — Smart City Transit System

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)
![Leaflet](https://img.shields.io/badge/Map-LeafletJS-orange.svg?style=for-the-badge)
![UI](https://img.shields.io/badge/UI-Premium_Dark-black.svg?style=for-the-badge)

**Denizli Akıllı Ulaşım**, Denizli şehri için geliştirilmiş, kurumsal düzeyde bir gerçek zamanlı otobüs takip ve simülasyon sistemidir. Modern "Glassmorphism" tasarımı ve OSRM tabanlı gerçek yol rotalarıyla birleşen bu uygulama, kullanıcılara Apple Maps kalitesinde bir deneyim sunar.

---

## 🌟 Öne Çıkan Özellikler

- **🛣️ Gerçek Yol Geometrisi:** Otobüsler kuş uçuşu değil, OSRM (Open Source Routing Machine) verileriyle gerçek sokaklar üzerinden gider.
- **🕒 Canlı Saat Senkronizasyonu:** Tüm otobüsler gerçek saate göre hareket eder. Sayfayı açtığınızda her araç o anki konumundan başlar.
- **🚌 Devasa Şehir Ağı:** 80'den fazla aktif hat ve harita üzerinde aynı anda hareket eden 160+ canlı otobüs.
- **📍 Hassas Durak Verileri:** Denizli'nin 38 kritik noktası (Otogar, PAÜ, Pamukkale, Karahayıt vb.) gerçek GPS koordinatlarıyla sisteme işlenmiştir.
- **💎 Premium Dark UI:** Apple tarzı ikonlar, şeffaf paneller (Glassmorphism) ve pürüzsüz animasyonlar.
- **🌓 Yükleme Ekranı (Splash):** Kurumsal logolu, animasyonlu ve yeşil temalı özel açılış ekranı.

---

## 📸 Ekran Görüntüleri

| Açılış Ekranı | Ana Harita | Hat Detayı |
| :---: | :---: | :---: |
| ![Splash](https://via.placeholder.com/300x200?text=Premium+Splash+Screen) | ![Map](https://via.placeholder.com/300x200?text=Real-time+Bus+Traffic) | ![Detail](https://via.placeholder.com/300x200?text=Live+ETA+Timeline) |

---

## 🛠️ Teknoloji Yığını

- **Frontend:** HTML5, CSS3 (Vanilla CSS), JavaScript (ES6+)
- **Harita Motoru:** [Leaflet.js](https://leafletjs.com/)
- **Yönlendirme:** Leaflet Routing Machine & OSRM API
- **Tasarım:** Glassmorphism, CSS Grid/Flexbox, Keyframe Animations
- **Veri Yapısı:** JSON tabanlı dinamik `stops.js` ve `routes.js` mimarisi

---

## 🚀 Kurulum

Projeyi yerel makinenizde çalıştırmak için herhangi bir kurulum gerektirmez. Dosyaları indirin ve `index.html` dosyasını tarayıcınızda açın.

```bash
# Depoyu klonlayın
git clone https://github.com/kullaniciadi/denizli-otobus-takip.git

# Proje dizinine gidin
cd denizli-otobus-takip

# index.html'i açın
open index.html
```

---

## 📁 Dosya Yapısı

- `index.html`: Uygulamanın ana iskeleti ve splash screen.
- `style.css`: Tüm premium karanlık tema ve animasyon stilleri.
- `app.js`: Simülasyon motoru, saat senkronizasyonu ve harita mantığı.
- `stops.js`: Denizli'deki tüm durakların GPS veritabanı.
- `routes.js`: 80+ hattın durak dizilimleri ve renk tanımları.
- `logo.png`: Kurumsal logo görseli.

---

## 🤝 Katkıda Bulunma

1. Bu depoyu çatallayın (Fork).
2. Yeni bir özellik dalı (Feature Branch) oluşturun: `git checkout -b ozellik/yeniOzellik`
3. Değişikliklerinizi kaydedin: `git commit -m 'Yeni özellik eklendi'`
4. Dalınıza gönderin: `git push origin ozellik/yeniOzellik`
5. Bir Çekme İsteği (Pull Request) oluşturun.

---

## 📜 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakabilirsiniz.

---

### 👨‍💻 Geliştirici
**Denizli Akıllı Şehir Ekibi** tarafından geliştirilmiştir. ✨

*"Şehrin ulaşımı artık parmaklarınızın ucunda."*
