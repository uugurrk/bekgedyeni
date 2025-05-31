const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'veri.json');

// Middleware'ler
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Veri dosyasını oku veya boş bir başlangıç verisi oluştur
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsedData = JSON.parse(data);

        // galeri'nin doğru formatta olduğundan emin olun
        if (!parsedData.galeri || !Array.isArray(parsedData.galeri)) {
            parsedData.galeri = [];
        }

        // Eğer eski formatta URL dizisi ise veya aciklama alanı eksikse, yeni formata dönüştür
        parsedData.galeri = parsedData.galeri.map(item => {
            if (typeof item === 'string') {
                // Eski string URL formatı
                return { id: Date.now().toString() + Math.random().toString(36).substring(2, 9), url: item, aciklama: "" };
            } else if (item && typeof item.url === 'string') {
                // Nesne formatı, aciklama var mı kontrol et, yoksa ekle
                return {
                    id: item.id || Date.now().toString() + Math.random().toString(36).substring(2, 9), // ID yoksa oluştur
                    url: item.url,
                    aciklama: item.aciklama || ""
                };
            }
            return item; // Zaten doğru formatta veya geçersiz bir öğe
        }).filter(item => item && typeof item.url === 'string' && typeof item.id === 'string'); // Sadece geçerli nesneleri tut

        return parsedData;
    } catch (error) {
        console.error('Veri dosyası okunamadı veya boş. Başlangıç verisi oluşturuluyor.', error);
        return {
            duyurular: [],
            projeler: [],
            galeri: [], // Galeri artık {id, url, aciklama} nesne dizisi olacak
            anasayfa: "BEKGED, Avrupa'nın dört bir yanındaki gençlik projelerine katkı sağlayan bir sivil toplum kuruluşudur..."
        };
    }
};

// Veri dosyasını yaz
const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// API Endpoint'leri

// Tüm verileri al
app.get('/api/data', (req, res) => {
    const data = readData();
    res.json(data);
});

// Ana sayfa metnini güncelle
app.post('/api/anasayfa', (req, res) => {
    const {
        metin
    } = req.body;
    if (typeof metin === 'undefined') {
        return res.status(400).send('Metin alanı boş bırakılamaz.');
    }
    const data = readData();
    data.anasayfa = metin;
    writeData(data);
    res.status(200).json({
        message: 'Ana sayfa metni başarıyla güncellendi.',
        anasayfa: metin
    });
});


// Yeni proje ekle
app.post('/api/projeler', (req, res) => {
    const newProje = req.body;
    if (!newProje.baslik || !newProje.detay || !newProje.tur) {
        return res.status(400).send('Proje başlığı, detayı ve türü boş bırakılamaz.');
    }
    const data = readData();
    newProje.id = Date.now().toString(); // Benzersiz ID
    data.projeler.push(newProje);
    writeData(data);
    res.status(201).json(newProje);
});

// Yeni duyuru ekle
app.post('/api/duyurular', (req, res) => {
    const newDuyuru = req.body;
    if (!newDuyuru.baslik || !newDuyuru.tarih || !newDuyuru.detay) {
        return res.status(400).send('Duyuru başlığı, tarihi ve detayları boş bırakılamaz.');
    }
    const data = readData();
    // Benzersiz ID atamasını burada yapın, client tarafından gelen ID'ye güvenmeyin
    newDuyuru.id = Date.now().toString();
    data.duyurular.push(newDuyuru);
    writeData(data);
    res.status(201).json(newDuyuru);
});

// Proje sil
app.delete('/api/projeler/:id', (req, res) => {
    const {
        id
    } = req.params;
    let data = readData();
    const initialLength = data.projeler.length;
    data.projeler = data.projeler.filter(p => p.id !== id);
    if (data.projeler.length === initialLength) {
        return res.status(404).send('Proje bulunamadı.');
    }
    writeData(data);
    res.status(200).send('Proje başarıyla silindi.');
});

// Duyuru sil
app.delete('/api/duyurular/:id', (req, res) => {
    const {
        id
    } = req.params;
    let data = readData();
    const initialLength = data.duyurular.length;
    data.duyurular = data.duyurular.filter(d => d.id !== id);
    if (data.duyurular.length === initialLength) {
        return res.status(404).send('Duyuru bulunamadı.');
    }
    writeData(data);
    res.status(200).send('Duyuru başarıyla silindi.');
});

// Yeni görsel ekle
app.post('/api/galeri', (req, res) => {
    const { url, aciklama } = req.body; // aciklama eklendi
    if (!url) {
        return res.status(400).send('Görsel URL\'si boş bırakılamaz.');
    }
    const data = readData();
    const newGorsel = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Benzersiz ID
        url,
        aciklama: aciklama || "" // Açıklama yoksa boş string
    };
    data.galeri.push(newGorsel);
    writeData(data);
    res.status(201).json(newGorsel);
});

// Görsel sil
app.delete('/api/galeri/:id', (req, res) => {
    const {
        id
    } = req.params;
    let data = readData();
    const initialLength = data.galeri.length;
    data.galeri = data.galeri.filter(g => g.id !== id);
    if (data.galeri.length === initialLength) {
        return res.status(404).send('Görsel bulunamadı.');
    }
    writeData(data);
    res.status(200).send('Görsel başarıyla silindi.');
});


// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});