const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); // Path modülü burada gerekli olmayabilir, kaldırılabilir eğer sadece static dosya sunuyorsak.

// Express uygulamasını başlat
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware'ler
app.use(cors()); // CORS hatalarını önlemek için
app.use(bodyParser.json()); // JSON formatındaki istek gövdelerini işlemek için
app.use(express.static(__dirname)); // Statik dosyaları (HTML, CSS, JS) sunmak için

// MongoDB bağlantısı (MongoDB Atlas bağlantı dizenizi buraya veya MONGO_URI ortam değişkenine ekleyin)
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bekged"; // Yerel bağlantı veya ortam değişkeni

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true, // Yeni URL ayrıştırıcı kullan
    useUnifiedTopology: true, // Yeni tek tip topoloji motoru kullan
})
    .then(() => console.log("✅ MongoDB bağlantısı başarılı"))
    .catch(err => console.error("❌ MongoDB bağlantı hatası:", err));

// MongoDB Veri Modelleri
// Duyuru Şeması ve Modeli
const duyuruSchema = new mongoose.Schema({
    baslik: String,
    tarih: String,
    detay: String
});
const Duyuru = mongoose.model('Duyuru', duyuruSchema);

// Proje Şeması ve Modeli
const projeSchema = new mongoose.Schema({
    baslik: String,
    detay: String,
    tur: String,
    basvuruLink: String
});
const Proje = mongoose.model('Proje', projeSchema);

// Görsel Şeması ve Modeli
const gorselSchema = new mongoose.Schema({
    url: String,
    aciklama: String
});
const Gorsel = mongoose.model('Gorsel', gorselSchema);

// Ana Sayfa Şeması ve Modeli
const anaSayfaSchema = new mongoose.Schema({
    metin: String
});
const AnaSayfa = mongoose.model('AnaSayfa', anaSayfaSchema);

// Yardımcı fonksiyon: ID'nin geçerli bir MongoDB ObjectId olup olmadığını kontrol et
// Bu, silme isteklerinde yanlış formatta ID gönderilmesini engeller.
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// --- API Endpoints ---

// 📖 ANA SAYFA METNİNİ AL
app.get('/api/anasayfa', async (req, res) => {
    try {
        const anaSayfaMetni = await AnaSayfa.findOne({}); // Tek bir ana sayfa metni bekliyoruz
        res.json(anaSayfaMetni || { metin: "" }); // Eğer yoksa boş metin döndür
    } catch (err) {
        console.error("Ana sayfa metni alınamadı:", err);
        res.status(500).json({ error: "Ana sayfa metni alınırken bir hata oluştu." });
    }
});

// ✍️ ANA SAYFA METNİNİ GÜNCELLE
app.post('/api/anasayfa', async (req, res) => {
    try {
        const { metin } = req.body;
        if (typeof metin !== 'string') {
            return res.status(400).json({ error: "Geçersiz metin formatı. Metin bir string olmalıdır." });
        }

        let anaSayfa = await AnaSayfa.findOne({}); // Var olan ana sayfa metnini bul
        if (!anaSayfa) {
            anaSayfa = new AnaSayfa({ metin }); // Eğer yoksa yeni oluştur
        } else {
            anaSayfa.metin = metin; // Varsa güncelle
        }
        await anaSayfa.save(); // Kaydet
        res.status(200).json(anaSayfa); // Güncellenmiş metni döndür
    } catch (err) {
        console.error("Ana sayfa metni güncellenemedi:", err);
        res.status(500).json({ error: "Ana sayfa metni güncellenirken bir hata oluştu." });
    }
});

// 📣 DUYURULAR API'leri

// ➕ YENİ DUYURU EKLE
app.post('/api/duyurular', async (req, res) => {
    try {
        const { baslik, tarih, detay } = req.body;
        if (!baslik || !tarih || !detay) {
            return res.status(400).json({ error: "Başlık, tarih ve detay alanları boş bırakılamaz." });
        }
        const yeniDuyuru = new Duyuru({ baslik, tarih, detay });
        await yeniDuyuru.save();
        res.status(201).json(yeniDuyuru); // Oluşturulan duyuruyu geri döndür
    } catch (err) {
        console.error("Duyuru eklenemedi:", err);
        res.status(500).json({ error: "Duyuru eklenirken bir hata oluştu." });
    }
});

// 🚀 TÜM DUYURULARI AL
app.get('/api/duyurular', async (req, res) => {
    try {
        const duyurular = await Duyuru.find({}); // Tüm duyuruları bul
        res.json(duyurular);
    } catch (err) {
        console.error("Duyurular alınamadı:", err);
        res.status(500).json({ error: "Duyurular yüklenirken bir hata oluştu." });
    }
});

// ❌ DUYURU SİL
app.delete('/api/duyurular/:id', async (req, res) => {
    const id = req.params.id; // URL'den ID'yi al

    if (!isValidObjectId(id)) { // ID'nin geçerli bir MongoDB ObjectId olup olmadığını kontrol et
        return res.status(400).json({ error: "Geçersiz duyuru ID'si formatı. Lütfen geçerli bir ID girin." });
    }

    try {
        const sonuc = await Duyuru.findByIdAndDelete(id); // ID'ye göre duyuruyu bul ve sil
        if (!sonuc) {
            return res.status(404).json({ error: "Silinecek duyuru bulunamadı." }); // Duyuru bulunamazsa 404 döndür
        }
        res.json({ message: "Duyuru başarıyla silindi!" }); // Başarılı silme mesajı
    } catch (err) {
        console.error("Duyuru silme hatası:", err);
        res.status(500).json({ error: "Sunucu hatası: Duyuru silinemedi." });
    }
});

// 📋 PROJELER API'leri

// ➕ YENİ PROJE EKLE
app.post('/api/projeler', async (req, res) => {
    try {
        const { baslik, detay, tur, basvuruLink } = req.body;
        if (!baslik || !detay || !tur) {
            return res.status(400).json({ error: "Başlık, detay ve tür alanları boş bırakılamaz." });
        }
        const yeniProje = new Proje({ baslik, detay, tur, basvuruLink: basvuruLink || "" }); // basvuruLink opsiyonel
        await yeniProje.save();
        res.status(201).json(yeniProje);
    } catch (err) {
        console.error("Proje eklenemedi:", err);
        res.status(500).json({ error: "Proje eklenirken bir hata oluştu." });
    }
});

// 🚀 TÜM PROJELERİ AL
app.get('/api/projeler', async (req, res) => {
    try {
        const projeler = await Proje.find({});
        res.json(projeler);
    } catch (err) {
        console.error("Projeler alınamadı:", err);
        res.status(500).json({ error: "Projeler yüklenirken bir hata oluştu." });
    }
});

// ❌ PROJE SİL
app.delete('/api/projeler/:id', async (req, res) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        return res.status(400).json({ error: "Geçersiz proje ID'si formatı. Lütfen geçerli bir ID girin." });
    }

    try {
        const sonuc = await Proje.findByIdAndDelete(id);
        if (!sonuc) {
            return res.status(404).json({ error: "Silinecek proje bulunamadı." });
        }
        res.json({ message: "Proje başarıyla silindi!" });
    } catch (err) {
        console.error("Proje silme hatası:", err);
        res.status(500).json({ error: "Sunucu hatası: Proje silinemedi." });
    }
});

// 🖼️ GÖRSELLER API'leri (Galeri)

// ➕ YENİ GÖRSEL EKLE
app.post('/api/galeri', async (req, res) => {
    try {
        const { url, aciklama } = req.body;
        if (!url) {
            return res.status(400).json({ error: "URL alanı boş bırakılamaz." });
        }
        const gorsel = new Gorsel({ url, aciklama: aciklama || "" }); // aciklama opsiyonel
        await gorsel.save();
        res.status(201).json(gorsel);
    } catch (err) {
        console.error("Görsel eklenemedi:", err);
        res.status(500).json({ error: "Görsel eklenirken bir hata oluştu." });
    }
});

// 🚀 TÜM GÖRSELLERİ AL
app.get('/api/galeri', async (req, res) => {
    try {
        const gorseller = await Gorsel.find({});
        res.json(gorseller);
    } catch (err) {
        console.error("Görseller alınamadı:", err);
        res.status(500).json({ error: "Görseller yüklenirken bir hata oluştu." });
    }
});

// ❌ GÖRSEL SİL
app.delete('/api/galeri/:id', async (req, res) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        return res.status(400).json({ error: "Geçersiz görsel ID'si formatı. Lütfen geçerli bir ID girin." });
    }

    try {
        const sonuc = await Gorsel.findByIdAndDelete(id);
        if (!sonuc) {
            return res.status(404).json({ error: "Silinecek görsel bulunamadı." });
        }
        res.json({ message: "Görsel başarıyla silindi!" });
    } catch (err) {
        console.error("Görsel silme hatası:", err);
        res.status(500).json({ error: "Sunucu hatası: Görsel silinemedi." });
    }
});

// Sunucuyu belirtilen portta dinle
app.listen(PORT, () => {
    console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});