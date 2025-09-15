# Form Scanner - Kullanım Kılavuzu

## İçindekiler
1. [Giriş](#giriş)
2. [Kurulum](#kurulum)
3. [Temel Kullanım](#temel-kullanım)
4. [Gelişmiş Özellikler](#gelişmiş-özellikler)
5. [Çıktı Formatları](#çıktı-formatları)
6. [Filtreleme ve Raporlama](#filtreleme-ve-raporlama)
7. [Sorun Giderme](#sorun-giderme)
8. [Örnekler](#örnekler)
9. [Performans İpuçları](#performans-ipuçları)

## Giriş

Form Scanner, web sitelerinde Google Forms, HubSpot Forms, Microsoft Forms ve diğer form türlerini tespit etmek için tasarlanmış güçlü bir CLI aracıdır. Ayrıca Cookie Consent Management Platform (CMP) detection özelliği ile çerez onay bannerlarını da tespit edebilir.

### Temel Özellikler
- ✅ Google Forms, HubSpot Forms, Microsoft Forms tespiti
- ✅ Cookie Consent Management Platform detection
- ✅ Statik ve dinamik tarama modları
- ✅ Yüksek performanslı eşzamanlı tarama
- ✅ Detaylı raporlama (CSV/JSON)
- ✅ Google Tag Manager (GTM) desteği

## Kurulum

### Gereksinimler
- Node.js >= 18
- npm

### Kurulum Adımları

```bash
# 1. Projeyi klonlayın veya indirin
cd /path/to/scanner-form

# 2. Bağımlılıkları yükleyin
npm install

# 3. (İsteğe bağlı) Playwright'i yükleyin (dinamik mod için)
npm install -D playwright
npx playwright install
```

### Yapılandırma
`form-detection-config.json` dosyası ile detection pattern'lerini özelleştirebilirsiniz.

## Temel Kullanım

### 1. URL Listesi Hazırlama
Her satırda bir URL olacak şekilde bir text dosyası oluşturun:

```txt
https://example.com/contact
https://example.com/feedback
https://forms.google.com/example
```

### 2. Temel Tarama
```bash
# Temel statik tarama
node scanner.mjs --input urls.txt

# Çıktı: results_2024-12-19T14-30-22.csv
#        results_2024-12-19T14-30-22.json
```

### 3. Özel Çıktı Dosyası
```bash
# Özel dosya adı
node scanner.mjs --input urls.txt --out my-results.csv

# Çıktı: my-results.csv
#        my-results.json
```

## Gelişmiş Özellikler

### Dinamik Tarama
JavaScript ile yüklenen formları tespit etmek için:

```bash
# Dinamik mod
node scanner.mjs --input urls.txt --dynamic

# Özel bekleme süresi
node scanner.mjs --input urls.txt --dynamic --wait 10000
```

### CMP Detection
Cookie consent platformlarını tespit etmek için:

```bash
# CMP detection
node scanner.mjs --input urls.txt --cmp

# Dinamik + CMP
node scanner.mjs --input urls.txt --dynamic --cmp
```

### Performans Ayarları
```bash
# Eşzamanlılık ayarı
node scanner.mjs --input urls.txt --concurrency 4

# Timeout ayarı
node scanner.mjs --input urls.txt --timeout 30000
```

## Çıktı Formatları

### CSV Formatı
```csv
url,method,status,is_google_form,is_hubspot_form,is_microsoft_form,detected_types,evidence,has_cmp,cmp_vendor,cmp_evidence,note
https://example.com,static,200,true,false,false,google,"Google Forms direct URL pattern",false,,,
https://site.com,dynamic,200,false,true,false,hubspot,"HubSpot forms script",true,Efilli,efilli,
```

### JSON Formatı
```json
[
  {
    "url": "https://example.com",
    "method": "static",
    "status": 200,
    "is_google_form": true,
    "is_hubspot_form": false,
    "is_microsoft_form": false,
    "detected_types": ["google"],
    "evidence": "Google Forms direct URL pattern",
    "has_cmp": false,
    "cmp_vendor": null,
    "cmp_evidence": null,
    "note": ""
  }
]
```

### Alan Açıklamaları

| Alan | Açıklama |
|------|----------|
| `url` | Taranan URL |
| `method` | Tarama yöntemi (static/dynamic) |
| `status` | HTTP durum kodu |
| `is_google_form` | Google Forms tespit edildi mi |
| `is_hubspot_form` | HubSpot Forms tespit edildi mi |
| `is_microsoft_form` | Microsoft Forms tespit edildi mi |
| `detected_types` | Tespit edilen form türleri listesi |
| `evidence` | Tespit kanıtı |
| `has_cmp` | CMP tespit edildi mi |
| `cmp_vendor` | CMP sağlayıcı adı |
| `cmp_evidence` | CMP tespit kanıtı |
| `note` | Ek notlar/hata mesajları |

## Filtreleme ve Raporlama

Tarama sonrası elde edilen sonuçları filtrelemek ve özel raporlar oluşturmak için `filter.mjs` script'ini kullanabilirsiniz.

### Temel Filtreleme

```bash
# Google formları filtrele
node filter.mjs --attr is_google_form --value true

# HubSpot formları filtrele
node filter.mjs --attr is_hubspot_form --value true

# Microsoft formları filtrele
node filter.mjs --attr is_microsoft_form --value true

# Başarılı istekleri listele
node filter.mjs --attr status --value 200
```

### Gelişmiş Filtreleme

#### Case-Insensitive Arama
```bash
# detected_types array'inde "hubspot" ara (büyük/küçük harf duyarsız)
node filter.mjs --attr detected_types --value hubspot --ci --contains
```

#### Contains (İçeren) Arama
```bash
# URL'de "example" kelimesi geçenleri bul
node filter.mjs --attr url --value example --contains --ci
```

#### Farklı Input/Output Dosyaları
```bash
# Farklı input dosyası kullan
node filter.mjs --input final-test.json --attr status --value 200 --out final-filtered.txt
```

### NPM Script Kullanımı
```bash
# Hazır script ile filtrele
npm run filter
```

### Desteklenen Attribute Türleri

| Tür | Örnekler | Kullanım |
|-----|----------|----------|
| **Boolean** | `is_google_form`, `is_hubspot_form`, `has_cmp` | `--value true/false` |
| **String** | `url`, `method`, `evidence`, `cmp_vendor` | `--value "aranan_deger"` |
| **Number** | `status` | `--value 200` |
| **Array** | `detected_types` | `--value hubspot --contains` |

### Rapor Formatı

Filter script'i aşağıdaki formatta metin raporu oluşturur:

```
FILTER REPORT
=============

Input file: results.json
Filter: is_google_form = true
Total results: 4664
Filtered results: 13

RESULTS:
--------
https://research.example.com/design-thinking-ai
https://research.example.com/carbon-negative-concrete
https://research.example.com/sustainable-3d-printing
https://www.example.com/training/courses/sec-101
...
```

**Not:** Rapor dosyası adı otomatik olarak timestamp ile oluşturulur (örn: `results_fine_tuned_2025-09-03T11-14-55.txt`)

### Özellikler

- ✅ **Otomatik tip dönüşümü**: String değerler otomatik olarak doğru tipe çevrilir
- ✅ **Dot notation desteği**: `foo.bar` şeklinde nested properties
- ✅ **Case-insensitive arama**: `--ci` bayrağı ile
- ✅ **Contains arama**: `--contains` bayrağı ile
- ✅ **Array desteği**: Array alanlarda includes mantığı
- ✅ **Hata toleransı**: JSON hatalarında anlamlı mesajlar

## Sorun Giderme

### Yaygın Sorunlar

#### 1. Playwright Hatası
```
Error: Executable doesn't exist at /path/to/chromium
```

**Çözüm:**
```bash
npx playwright install
```

#### 2. Config Dosyası Hatası
```
Error loading config file: ENOENT
```

**Çözüm:**
`form-detection-config.json` dosyasının mevcut olduğundan emin olun.

#### 3. Timeout Hatası
```
Navigation timeout exceeded
```

**Çözüm:**
```bash
node scanner.mjs --input urls.txt --timeout 30000
```

#### 4. Yüksek Bellek Kullanımı
Çok fazla URL tararken bellek sorunu yaşıyorsanız:

**Çözüm:**
```bash
node scanner.mjs --input urls.txt --concurrency 2
```

#### 5. Node.js Fetch Başarısızlığı
```
STATIC_FETCH_ERROR for https://example.com: fetch failed, trying curl fallback...
```

**Belirti:**
- Static modda "fetch failed" hatası
- HubSpot formları tespit edilemiyor
- Özellikle anti-bot koruması olan sitelerde (örn. `https://secure.example.com/`)

**Neden:**
- Node.js'in fetch API'si bazı web siteleri tarafından engelleniyor
- SSL sertifika zinciri sorunları
- Sistem seviyesinde network konfigürasyonu

**Çözüm:**
Scanner otomatik olarak curl fallback mekanizmasını kullanır:
- İlk olarak Node.js fetch dener
- Başarısız olursa sistem curl'una geçer
- Browser benzeri User-Agent kullanır

**Başarılı fallback örneği:**
```
STATIC_FETCH_ERROR for https://secure.example.com/: fetch failed, trying curl fallback...
CURL_FALLBACK_SUCCESS for https://secure.example.com/: 58200 bytes
[1/1] https://secure.example.com/ -> hubspot (static, 200)
```

**Gereksinimler:**
- Sistemde `curl` komutunun yüklü olması (Linux/macOS'ta varsayılan)
- Curl fallback otomatik olarak çalışır, manuel müdahale gerektirmez

### Log Analizi

Scanner'ın debug bilgilerini görmek için terminal çıktısını inceleyin:
- `CONFIG_LOADED`: Yapılandırma başarıyla yüklendi
- `DYNAMIC_MODE_START`: Dinamik mod başladı
- `CMP_FLAG_CHECK`: CMP kontrolü
- `✅ CMP detected`: CMP tespit edildi

## Örnekler

### 1. Temel Form Tarama
```bash
# Google Forms içeren siteleri tara
node scanner.mjs --input university-sites.txt

# Sonuç: Tüm Google Forms'lar tespit edilecektir
```

### 2. CMP Detection
```bash
# Efilli CMP kullanan Türk sitelerini tara
node scanner.mjs --input turkish-sites.txt --cmp

# Sonuç: Efilli CMP'ler tespit edilecektir
```

### 3. GTM ile Karmaşık Tarama
```bash
# GTM kullanan sitelerde dinamik form tespiti
node scanner.mjs --input modern-sites.txt --dynamic --cmp --wait 8000

# Sonuç: GTM üzerinden yüklenen formlar ve CMP'ler tespit edilecektir
```

### 4. Büyük Ölçekli Tarama
```bash
# 1000+ URL'yi yüksek performansla tara
node scanner.mjs --input large-list.txt --concurrency 16 --timeout 20000

# Sonuç: Paralel tarama ile hızlı sonuç
```

### 5. Özel Filtreleme
```bash
# Sadece Google formları olan sonuçları filtrele
node filter.mjs --attr is_google_form --value true --input results.json

# Başarılı istekleri listele
node filter.mjs --attr status --value 200

# URL'de "example" içeren siteleri bul
node filter.mjs --attr url --value example --contains --ci

# CMP tespit edilen siteleri listele
node filter.mjs --attr has_cmp --value true

# Farklı output dosyası kullan
node filter.mjs --attr is_hubspot_form --value true --out hubspot-report.txt
```

## Performans İpuçları

### Hız Optimizasyonları

1. **Eşzamanlılık Ayarı:**
   - Ağ hızınıza göre ayarlayın (4-16 arası)
   - Çok yüksek değerler rate limiting'e neden olabilir

2. **Timeout Ayarı:**
   - Yavaş siteler için 20000-30000ms kullanın
   - Hızlı taramalar için 10000ms yeterli

3. **Mod Seçimi:**
   - Sadece statik formlar için: `--dynamic` kullanmayın
   - CMP detection için: `--cmp` sadece gerektiğinde kullanın

### Bellek Yönetimi

1. **Büyük Dosyalar:**
   - 1000+ URL için parçalara bölün
   - Her parça için ayrı tarama çalıştırın

2. **Node.js Belleği:**
   ```bash
   # Yüksek bellek kullanımı için
   node --max-old-space-size=4096 scanner.mjs --input urls.txt
   ```

### Ağ Optimizasyonları

1. **Proxy Kullanımı:**
   - Rate limiting sorunları için proxy kullanın

2. **User Agent Rotasyonu:**
   - Bazı siteler botları engeller, farklı user agent'lar deneyin

3. **Fetch Fallback:**
   - Node.js fetch başarısız olursa otomatik olarak curl kullanılır
   - Bu sayede anti-bot korumalı siteler de taranabilir
   - Curl fallback sadece gerektiğinde çalışır, performans etkisi minimal

## Desteklenen Form Türleri

### Google Forms
- URL Pattern: `docs.google.com/forms/d/e/...`
- iframe Embed: `<iframe src="docs.google.com/forms/...">`
- Form Action: `<form action="docs.google.com/forms/...">`

### HubSpot Forms
- Script: `js.hsforms.net/forms/v2.js`
- Portal ID: `hbspt.forms.create()`
- API: `api.hsforms.com/submissions/...`

### Microsoft Forms
- Response Page: `forms.office.com/Pages/ResponsePage.aspx`
- Short URL: `forms.office.com/r/...`
- Office Fabric: `OfficeFabric`

## CMP Detection

### Desteklenen CMP'ler
- **Cookiebot**: cookiebot.com
- **OneTrust**: onetrust.com
- **Efilli**: efilli.com
- **Google Tag Manager**: GTM üzerinden yüklenen CMP'ler
- **Generic**: Standart çerez bannerları

### GTM Integration
Scanner GTM üzerinden yüklenen CMP'leri tespit edebilir:
1. GTM container ID tespiti (GTM-XXXXXX)
2. GTM initialization bekleme
3. GTM üzerinden yüklenen CMP script'lerinin tespiti

## Sonuç

Form Scanner, web form tespiti için güçlü ve esnek bir araçtır. Temel kullanımdan gelişmiş CMP detection'a kadar geniş bir kullanım yelpazesi sunar. Performans ihtiyaçlarınıza göre ayarlayabilir ve farklı senaryolara uyum sağlayabilirsiniz.

Daha fazla yardım için issue açabilir veya README.md dosyasını inceleyebilirsiniz.
