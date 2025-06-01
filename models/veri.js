const mongoose = require('mongoose');

const DuyuruSchema = new mongoose.Schema({
    baslik: String,
    tarih: String,
    detay: String
});

const ProjeSchema = new mongoose.Schema({
    baslik: String,
    detay: String,
    tur: String,
    basvuruLink: String
});

const GorselSchema = new mongoose.Schema({
    url: String,
    aciklama: String
});

const AnaSayfaSchema = new mongoose.Schema({
    metin: String
});

module.exports = {
    Duyuru: mongoose.model('Duyuru', DuyuruSchema),
    Proje: mongoose.model('Proje', ProjeSchema),
    Gorsel: mongoose.model('Gorsel', GorselSchema),
    AnaSayfa: mongoose.model('AnaSayfa', AnaSayfaSchema)
};
