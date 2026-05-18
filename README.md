# 🚀 FinTwin AI - Dijital Finansal İkiz ve Mentorluk Platformu

![FinTwin AI Banner](https://img.shields.io/badge/Yapay_Zeka-Google_Gemini_Flash-6366f1?style=for-the-badge&logo=google) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi) ![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react) ![Docker](https://img.shields.io/badge/DevOps-Docker_Compose-2496ED?style=for-the-badge&logo=docker)

**FinTwin AI**, kullanıcıların harcama ve gelir alışkanlıklarını analiz ederek onların **"Dijital Finansal İkizini" (Financial Twin)** oluşturan, harcama duygu durumunu saptayan ve yapay zeka destekli kişiselleştirilmiş finansal mentorluk sunan yeni nesil bir otonom finansal yönetim platformudur.

---

## 🎯 Projenin Amacı ve Vizyonu

Günümüz ekonomik koşullarında bireylerin finansal okuryazarlığını artırmak, bütçelerini doğru yönetmelerini sağlamak ve geleceğe yönelik sürdürülebilir birikim stratejileri oluşturmak hayati önem taşımaktadır. Ancak geleneksel bütçe takip uygulamaları sadece geçmiş verileri listelemekle yetinir.

**FinTwin AI**, standart gelir-gider tablolarının ötesine geçerek şu temel sorunları çözer:
- 💡 **Kişiselleştirilmiş Finansal Mentorluk Eksikliği:** Özel finansal danışmanlara erişimi olmayan bireyler için 7/24 hizmet veren yapay zeka destekli bir mentor sunar.
- 🔍 **Alışkanlık ve Duygu Durumu Analizi:** Harcamaların arkasındaki psikolojiyi ve eğilimleri saptayarak kullanıcıya özel "Finansal Persona" tanımlar (Örn: *Dengeli Yatırımcı*, *Dürtüsel Harcayıcı*).
- 🔮 **Gelecek Projeksiyonu:** Mevcut harcama hızı devam ederse 3 ay sonra bakiye ve borç durumunun ne olacağını önceden hesaplar ve uyarır.

---

## ⚙️ Projenin İşleyişi ve Temel Mimarisi

```
┌────────────────────────────────────────────────────────┐
│                    KULLANICI (USER)                    │
└───────────────────────────┬────────────────────────────┘
                            │ İşlem Ekleme & Simülasyon
┌───────────────────────────▼────────────────────────────┐
│                  FRONTEND (React + Vite)               │
│   (Glassmorphism UI, Recharts, Vektörel PDF Çıktısı)   │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JWT Auth)
┌───────────────────────────▼────────────────────────────┐
│                    BACKEND (FastAPI)                   │
│   (SQLModel, Otomatik Hesaplamalar, Güvenli Uç Noktalar)│
└───────────────────────────┬────────────────────────────┘
                            │ Veri Analizi İstemi (Prompt)
┌───────────────────────────▼────────────────────────────┐
│                  GOOGLE GEMINI AI (LLM)                │
│    (Persona, Duygu Durumu, İçgörü ve Aksiyon Planı)    │
└────────────────────────────────────────────────────────┘
```

1. **Güvenli Katılım (JWT Auth):** Kullanıcı, şifresi güvenli bir şekilde (Bcrypt) hash'lenerek sisteme kayıt olur ve JWT Access Token ile doğrulanan korumalı oturumuna giriş yapar.
2. **Veri Toplama:** Kullanıcı günlük gelir ve harcamalarını (Gıda, Yemek, Alışveriş, Abonelik, Konut vb.) sisteme işler.
3. **Akıllı Analiz ve Gemini LLM Entegrasyonu:** Kullanıcı "Analiz Et" butonuna bastığında, arka plandaki FastAPI servisi tüm harcama örüntülerini, net bakiyeyi ve kategori yoğunluklarını bir prompt haline getirip Google Gemini yapay zeka modeline iletir.
4. **Çıktı ve Strateji Üretimi:** Yapay zeka modeli kullanıcıya bir **Persona** (Örn: *Bilinçli Bütçe Yöneticisi*), bir **Duygu Durumu** (Örn: *Kontrollü & İyimser*), 0-100 arası bir **Risk Skoru**, **İçgörüler** ve nokta atışı bir **Aksiyon Planı** üretir.
5. **What-If Simülatörü:** Kullanıcı belirli bir kategoride (Örn: Yemek veya Alışveriş) %20 kesinti yaparsa aylık/3 aylık ne kadar tasarruf edeceğini ve risk skorunun ne kadar düşeceğini anında simüle eder.
6. **Kurumsal Vektörel PDF Raporlama:** Kullanıcı analiz sonuçlarını ve tüm tablolarını tek tıkla en yüksek kalitede, seçilebilir metin tabanlı ve tablolu profesyonel bir PDF raporu (`jsPDF` + `jspdf-autotable`) olarak indirir.

---

## 🌟 Öne Çıkan Özellikler

* 🧠 **Dijital İkiz ve Duygu Saptaması:** Sadece sayıları değil, kullanıcının o ayki harcama psikolojisini analiz eder.
* 📈 **What-If (Ne Olurdu?) Simülatörü:** Harcama alışkanlıklarındaki ufak değişikliklerin uzun vadeli birikime etkisini anlık olarak hesaplar.
* 📑 **%100 Vektörel PDF Rapor Çıktısı:** Ekran görüntüsü veya bulanık görseller yerine kurumsal standartlarda, yüksek kontrastlı ve dinamik tablolu finansal rapor üretir.
* 🎨 **Premium Açık Tema (Light Theme) UI:** Modern cam efekti (glassmorphism), yumuşak gölgeler ve Recharts grafikleri ile büyüleyici ve ferah bir kullanıcı deneyimi sunar.
* 🔒 **Hesap Yönetimi & Güvenlik:** Kullanıcı adı ve şifre değiştirme modülleri, token bazlı kesintisiz oturum yönetimi.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

| Katman | Teknolojiler | Açıklama |
| :--- | :--- | :--- |
| **Yapay Zeka** | `Google Generative AI SDK (Gemini Flash)` | LLM tabanlı persona, içgörü ve tavsiye motoru |
| **Backend** | `FastAPI`, `Python 3.11`, `SQLModel`, `Passlib`, `Jose (JWT)` | Yüksek performanslı asenkron REST API ve ORM katmanı |
| **Veritabanı** | `PostgreSQL 15` (Docker) / `SQLite` (Lokal) | İlişkisel veritabanı altyapısı |
| **Frontend** | `React 19`, `Vite`, `Recharts`, `Lucide Icons`, `jsPDF`, `jspdf-autotable` | SPA arayüz, veri görselleştirme ve vektörel raporlama |
| **DevOps** | `Docker`, `Docker Compose`, `Nginx` | Multi-stage build ve ters vekil sunucu (Reverse Proxy) |

---

## 🚀 Kurulum ve Çalıştırma

### 🐳 Docker Compose ile Hızlı Kurulum (Tavsiye Edilen)

Proje tam donanımlı olarak Dockerize edilmiştir. Sisteminizde Docker ve Docker Compose yüklüyse tek komutla tüm ekosistemi (Veritabanı, Backend API ve Nginx Frontend) ayağa kaldırabilirsiniz:

```bash
docker compose up --build -d
```

- **Frontend Canlı Uygulama**: [http://localhost:3000](http://localhost:3000)
- **Backend API ve Swagger Dokümantasyonu**: [http://localhost:8000/docs](http://localhost:8000/docs)

Sistemi durdurmak için:
```bash
docker compose down
```

---

### 💻 Manuel Geliştirme Ortamı Kurulumu

#### 1. Backend Kurulumu
Python 3.9+ gereklidir.
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows için: venv\Scripts\activate
pip install -r requirements.txt
```
`.env` dosyasını oluşturun ve Gemini API anahtarınızı ekleyin:
```env
GEMINI_API_KEY=senin_api_anahtarin
SECRET_KEY=super_gizli_anahtar
```
Sunucuyu başlatın:
```bash
uvicorn main:app --reload
```

#### 2. Frontend Kurulumu
Node.js 18+ gereklidir.
```bash
cd frontend
npm install
npm run dev
```
Uygulama `http://localhost:5173` adresinde çalışacaktır.
