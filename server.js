const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Express app oluştur
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware'ler
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// MongoDB bağlantısı
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bekged";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅ MongoDB bağlantısı başarılı"))
    .catch(err => console.error("❌ MongoDB bağlantı hatası:", err));

// MongoDB veri modelleri
const Duyuru = mongoose.model('Duyuru', {
    baslik: String,
    tarih: String,
    detay: String
});

const Proje = mongoose.model('Proje', {
    baslik: String,
    detay: String,
    tur: String,
    basvuruLink: String
});

const Gorsel = mongoose.model('Gorsel', {
    url: String,
    aciklama: String
});

const AnaSayfa = mongoose.model('AnaSayfa', {
    metin: String
});

// 🔹 TÜM VERİLERİ AL
app.get('/api/data', async (req, res) => {
    try {
        const duyurular = await Duyuru.find();
        const projeler = await Proje.find();
        const galeri = await Gorsel.find();
        const ana = await AnaSayfa.findOne();
        res.json({
            duyurular,
            projeler,
            galeri,
            anasayfa: ana ? ana.metin : ""
        });
    } catch (err) {
        res.status(500).json({ error: "Veriler alınamadı" });
    }
});

// 🔹 ANA SAYFA METNİ GÜNCELLE
app.post('/api/anasayfa', async (req, res) => {
    try {
        const { metin } = req.body;
        if (!metin) return res.status(400).json({ error: "Metin boş olamaz" });

        let ana = await AnaSayfa.findOne();
        if (!ana) {
            ana = new AnaSayfa({ metin });
        } else {
            ana.metin = metin;
        }

        await ana.save();
        res.json({ message: "Ana sayfa metni güncellendi", anasayfa: metin });
    } catch (err) {
        res.status(500).json({ error: "Metin kaydedilemedi" });
    }
});

// 🔹 YENİ PROJE EKLE
app.post('/api/projeler', async (req, res) => {
    try {
        const { baslik, detay, tur, basvuruLink } = req.body;
        if (!baslik || !detay || !tur) {
            return res.status(400).json({ error: "Gerekli alanlar eksik" });
        }

        const proje = new Proje({ baslik, detay, tur, basvuruLink });
        await proje.save();
        res.status(201).json(proje);
    } catch (err) {
        res.status(500).json({ error: "Proje eklenemedi" });
    }
});

// 🔹 PROJE SİL
app.delete('/api/projeler/:id', async (req, res) => {
    try {
        const silinen = await Proje.findByIdAndDelete(req.params.id);
        if (!silinen) return res.status(404).json({ error: "Proje bulunamadı" });
        res.json({ message: "Proje silindi" });
    } catch (err) {
        res.status(500).json({ error: "Proje silinemedi" });
    }
});

app.post('/api/duyurular', async (req, res) => {
    try {
        const { baslik, detay, tarih } = req.body;
        console.log("Gelen veri:", req.body); // 🔍 GÖNDERİLEN VERİYİ KONTROL ET

        if (!baslik || !detay || !tarih) {
            return res.status(400).json({ error: "Gerekli alanlar eksik" });
        }

        const duyuru = new Duyuru({ baslik, detay, tarih });

        const kayit = await duyuru.save(); // 🔴 BURADA HATA VARSA LOG GÖRÜNÜR
        console.log("Duyuru kaydedildi:", kayit);

        res.status(201).json(kayit);
    } catch (err) {
        console.error("❌ Duyuru eklenemedi:", err); // 🔥 EN ÖNEMLİ SATIR
        res.status(500).json({ error: "Duyuru eklenemedi" });
    }
});


// 🔹 DUYURU SİL
app.delete('/api/duyurular/:id', async (req, res) => {
    try {
        const silinen = await Duyuru.findByIdAndDelete(req.params.id);
        if (!silinen) return res.status(404).json({ error: "Duyuru bulunamadı" });
        res.json({ message: "Duyuru silindi" });
    } catch (err) {
        res.status(500).json({ error: "Duyuru silinemedi" });
    }
});

// 🔹 GÖRSEL EKLE
app.post('/api/galeri', async (req, res) => {
    try {
        const { url, aciklama } = req.body;
        if (!url) return res.status(400).json({ error: "URL gerekli" });

        const gorsel = new Gorsel({ url, aciklama: aciklama || "" });
        await gorsel.save();
        res.status(201).json(gorsel);
    } catch (err) {
        res.status(500).json({ error: "Görsel eklenemedi" });
    }
});

// 🔹 GÖRSEL SİL
app.delete('/api/galeri/:id', async (req, res) => {
    try {
        const silinen = await Gorsel.findByIdAndDelete(req.params.id);
        if (!silinen) return res.status(404).json({ error: "Görsel bulunamadı" });
        res.json({ message: "Görsel silindi" });
    } catch (err) {
        res.status(500).json({ error: "Görsel silinemedi" });
    }
});

// SUNUCUYU BAŞLAT
app.listen(PORT, () => {
    console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});
