# Quick Start Guide - Orkhon AR/VR Tours

## Одоо хийх зүйлс (Next Steps)

### 1. Firebase тохиргоо (5 минут)
```bash
# 1. Firebase console дээр шинэ project үүсгэ
https://console.firebase.google.com

# 2. Firestore Database идэвхжүүл
# 3. Firebase Storage идэвхжүүл
# 4. Service account key татаж ав
# 5. .env.local файл үүсгэ:
cp .env.local.example .env.local

# 6. Firebase credentials оруул
```

### 2. OpenAI API Key (2 минут)
```bash
# 1. OpenAI account үүсгэ
https://platform.openai.com

# 2. API key үүсгэ
# 3. .env.local файлд нэм
```

### 3. Өгөгдөл шилжүүлэх (1 минут)
```bash
# Эхлээд dry-run хий (шалгах)
node scripts/migrate-to-firebase.js --dry-run

# Өгөгдөл шилжүүл
node scripts/migrate-to-firebase.js

# Шалгах
node scripts/migrate-to-firebase.js --verify
```

### 4. Туршиж үзэх
```bash
npm run dev
# http://localhost:3000/tours руу ор
# "Энгийн аялал" товч дарж үз ✅
```

## Unity VR/AR хөгжүүлэлт (дараа нь)

### 5. Unity суулгах
- Unity Hub татаж ав: https://unity.com/download
- Unity 2022 LTS суулга
- UNITY_SETUP.md-г дагаж Unity project үүсгэ

### 6. Unity WebGL build хий
```bash
# Unity дээр:
# File > Build Settings > WebGL > Build
# Output: d:\orkhon-app\public\unity-build\

# Дараа нь:
npm run dev
# "VR/AR Аялал" товч дарж үз 🎮
```

## Бүх зүйл бэлэн! ✅

**Одоо байгаа:**
- ✅ Firebase backend бэлэн
- ✅ AI virtual guide бэлэн
- ✅ API endpoints бэлэн
- ✅ Unity WebGL integration бэлэн
- ✅ Dual-mode tours (Classic + VR/AR)
- ✅ Бүрэн documentation

**Дутуу зүйл:**
- ⏳ Firebase credentials (.env.local)
- ⏳ Unity project build
- ⏳ 360° зургууд

**Дэлгэрэнгүй:**
- README.md - Бүх project мэдээлэл
- UNITY_SETUP.md - Unity хөгжүүлэлтийн заавар
- walkthrough.md - Юу хийсэн тухай дэлгэрэнгүй

Амжилт! 🎉
