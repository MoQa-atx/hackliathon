# Frontend Ekibi İçin TODO Listesi (Hackathon)

Merhaba Frontend Ekibi! Vaktimiz az, bu yüzden hızlıca odaklanmamız gereken kritik bileşenler şunlar:

## 1. Backend İletişimi (API Entegrasyonu)
Backend ayağa kalktığında `http://localhost:8000/docs` adresinde Swagger UI (Otomatik API Dokümantasyonu) sizi karşılayacak. Bütün endpointleri ve örnek JSON'ları oradan görebilirsiniz.

- [ ] **Şikayet Gönderme (POST /api/complaints/):** 
  - Vatandaşın resim, konum (opsiyonel) ve açıklama girebileceği bir form ekranı yapın.
  - **ÖNEMLİ (Konum):** Tarayıcının `navigator.geolocation.getCurrentPosition` API'sini kullanarak kullanıcının konumuna izin isteyin. Eğer izin verirse `latitude` ve `longitude` değerlerini de forma ekleyin.
  - Form verisini (Multipart form data olarak `description`, `image`, `latitude`, `longitude`) backend'e gönderin.
  - **Önemli:** Eğer backend `400 Bad Request` veya hata dönerse (Spam filtresine takılırsa), kullanıcıya güzel bir pop-up ile "Girdiğiniz görsel anlaşılamadı, lütfen daha net bir fotoğraf çekin." hatası gösterin.

  - **Önemli (Takip Kodu):** Başarılı bir gönderim sonrası dönen JSON'da `tracking_code` (Örn: `BEYAZ-A7X9`) bulunacak. Bu kodu kullanıcıya ekranda büyük bir şekilde gösterin (Örn: "Şikayetiniz alınmıştır. Takip kodunuz: BEYAZ-A7X9").

- [ ] **Şikayet Sorgulama (GET /api/complaints/track/{tracking_code}):**
  - Vatandaşın anasayfada şikayet durumunu sorgulayabileceği bir arama kutusu tasarlayın. 
  - Vatandaş kodunu girdiğinde bu endpoint'e istek atıp güncel durumu (`status`) gösterin.

- [ ] **Dashboard / Beyaz Masa Ekranı (GET /api/complaints/):**
  - Belediye görevlisinin ekranını tasarlayın. (Modern, temiz, soluk beyaz tonları - kurumsal görünüm)
  - Backend'den gelen şikayetleri listele.
  - Listede **Risk Skoru** ve **Aciliyet Durumu** (Kırmızı Kod, Sarı Kod, Yeşil Kod) bazlı renkli etiketler (Badge) gösterin.
  
- [ ] **Dashboard - Durum Güncelleme (PATCH /api/complaints/{id}/status):**
  - Yetkililer şikayeti inceledikten sonra durumunu değiştirebilsin. Bunu listede bir **Dropdown** (Seçim Kutusu) ile yapın.
  - **DİKKAT:** API artık sadece şu 4 kelimeyi kabul eder (Başka kelime yollarsanız hata döner):
    1. `"Bekliyor"`
    2. `"İşleme Alındı"`
    3. `"Çözüldü"`
    4. `"Çözülemedi"`
## 2. Kullanıcı Deneyimi (UX) Katmanı (Vatandaş Ekranı)
- [ ] **Sadece Kameraya İzin Verme:** (Ekstra Puan Getirir) Eğer mobilden giriliyorsa veya PWA yapıyorsanız, galeriden dosya yüklemeyi zorlaştıran/engelleyen, doğrudan kamerayı açmaya yönlendiren bir buton yapın (Troll engelleme taktiği).
- [ ] **Oyunlaştırma (Opsiyonel / Fake):** Vatandaş şikayet gönderdiğinde "Güvenilirlik Puanınız Arttı!" şeklinde bir sahte bildirim gösterebilirsiniz (Jüriye anlatmak için).

## 3. Belediye Dashboard UI (Yönetici Ekranı)
- [ ] Şikayetlerin düştüğü ana ekran.
- [ ] **Harita Görünümü (ÇOK ÖNEMLİ):** Şikayet listesinin yanında bir `Google Maps` veya `Leaflet.js` haritası koyun. Backend'den gelen şikayetlerin `latitude` ve `longitude` verilerini kullanarak harita üzerine pin/marker yerleştirin! Jüri buna bayılacaktır.
- [ ] (Eğer vakit kalırsa) Çöpe atılan/Filtrelenen spam gönderilerin listelendiği ayrı bir sekme.
- [ ] Şikayetin detayına tıklandığında:
  - Yapay zekanın tespit ettiği nesne (Örn: Su Patlağı)
  - Yönlendirilen Departman (Örn: Fen İşleri)
  - Risk Skoru (Örn: %92)

**Bol şans! Backend'den herhangi bir endpoint isterseniz haber verin, 2 dakikada ekleriz.**
