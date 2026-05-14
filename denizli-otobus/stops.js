/**
 * stops.js — Denizli Ulaşım A.Ş.
 * Duraklar OSRM'nin yan yollara sapmaması için ana arterlerin tam üzerine taşındı.
 */

const STOPS = {
    otogar: { id: "otogar", name: "Şehirlerarası Otogar", coords: [37.7854, 29.0914], zone: "Merkez" },
    adliye: { id: "adliye", name: "Adliye", coords: [37.7786, 29.0341], zone: "Batı" },
    adliye2: { id: "adliye2", name: "Adliye (2. Durak)", coords: [37.7773, 29.0184], zone: "Batı" },
    bin200ev: { id: "bin200ev", name: "1200 Evler", coords: [37.7786, 29.0083], zone: "Batı" },
    teras: { id: "teras", name: "Teras Park AVM", coords: [37.7599, 29.0446], zone: "Güneybatı" },
    devlet_hastane: { id: "devlet_hastane", name: "Devlet Hastanesi", coords: [37.7829, 29.0787], zone: "Merkez" },
    tekden_hastane: { id: "tekden_hastane", name: "Tekden Hastanesi", coords: [37.7801, 29.0693], zone: "Merkez" },
    cinar: { id: "cinar", name: "Çınar Meydanı", coords: [37.7733, 29.0872], zone: "Merkez" },
    kutuphane: { id: "kutuphane", name: "Kütüphane", coords: [37.7723, 29.0897], zone: "Merkez" },
    emniyet: { id: "emniyet", name: "Emniyet Müdürlüğü", coords: [37.7773, 29.0985], zone: "Merkez" },
    pam_belediye: { id: "pam_belediye", name: "Pamukkale Belediyesi", coords: [37.7634, 29.1023], zone: "Doğu" },
    incilipinar: { id: "incilipinar", name: "İncilipınar Parkı", coords: [37.7613, 29.0943], zone: "Doğu" },
    forum: { id: "forum", name: "Forum Çamlık AVM", coords: [37.7542, 29.0899], zone: "Güney" },
    pau_hastane: { id: "pau_hastane", name: "PAÜ Hastanesi", coords: [37.7430, 29.1069], zone: "PAÜ" },
    pau_kampus: { id: "pau_kampus", name: "PAÜ Yerleşkesi", coords: [37.7438, 29.0982], zone: "PAÜ" },
    camlik_alt: { id: "camlik_alt", name: "Çamlık Parkı Alt Giriş", coords: [37.7398, 29.0928], zone: "PAÜ" },
    camlik_ust: { id: "camlik_ust", name: "Çamlık Parkı Üst Giriş", coords: [37.7427, 29.0889], zone: "PAÜ" },
    stadyum: { id: "stadyum", name: "Atatürk Stadyumu", coords: [37.7659, 29.0811], zone: "Merkez" },
    saltak1: { id: "saltak1", name: "Saltak Cd. 1. Durak", coords: [37.7779, 29.0821], zone: "Merkez" },
    horizon: { id: "horizon", name: "Horizon Garden AVM", coords: [37.7902, 29.0897], zone: "Kuzey" },
    sosyete_pazari: { id: "sosyete_pazari", name: "Sosyete Pazarı", coords: [37.7802, 29.0977], zone: "Doğu" },
    bitek: { id: "bitek", name: "Bitek Koleji / Dokuzkavaklar Hast.", coords: [37.7915, 29.1015], zone: "Kuzey" },
    sevindik: { id: "sevindik", name: "Sevindik Kavşağı", coords: [37.8006, 29.1057], zone: "Kuzey" },
    halley: { id: "halley", name: "Halley Kavşağı", coords: [37.7844, 29.0871], zone: "Merkez" },
    bayramyeri: { id: "bayramyeri", name: "Bayramyeri Meydanı", coords: [37.7841, 29.0839], zone: "Merkez" },
    denizli_lisesi: { id: "denizli_lisesi", name: "Denizli Lisesi", coords: [37.7681, 29.0843], zone: "Merkez" },
    orhan_abalioglu: { id: "orhan_abalioglu", name: "Orhan Abalıoğlu", coords: [37.8111, 29.1112], zone: "Kuzey" },
    oya_abalioglu: { id: "oya_abalioglu", name: "Oya Ender Abalıoğlu", coords: [37.8177, 29.1148], zone: "Kuzey" },
    leodikya: { id: "leodikya", name: "Leodikya Kavşağı", coords: [37.8223, 29.1179], zone: "Kuzey" },
    yenıkoy: { id: "yenıkoy", name: "Yeniköy Durağı", coords: [37.8945, 29.1284], zone: "Pamukkale Hattı" },
    pamukkale1: { id: "pamukkale1", name: "Pamukkale 1. Durak", coords: [37.9153, 29.1220], zone: "Pamukkale" },
    pamukkale2: { id: "pamukkale2", name: "Pamukkale 2. Durak", coords: [37.9194, 29.1198], zone: "Pamukkale" },
    pamukkale3: { id: "pamukkale3", name: "Pamukkale 3. Durak", coords: [37.9108, 29.1140], zone: "Pamukkale" },
    pamukkale4: { id: "pamukkale4", name: "Pamukkale 4. Durak", coords: [37.9192, 29.1089], zone: "Pamukkale" },
    akkoy: { id: "akkoy", name: "Akköy", coords: [37.9546, 29.0783], zone: "Karahayıt" },
    karahayit: { id: "karahayit", name: "Karahayıt", coords: [37.9629, 29.1048], zone: "Karahayıt" }
};
