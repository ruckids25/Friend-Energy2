# OYOSHI Campaign — Setup Guide 🚀

คู่มือตั้งค่าระบบ Auto-Reply Bot บน Facebook Page สำหรับแคมเปญ "Tag Your Good Energy Friend"

---

## สารบัญ

1. [สร้าง Facebook App](#1-สร้าง-facebook-app)
2. [ตั้งค่า Permissions](#2-ตั้งค่า-permissions)
3. [สร้าง Page Access Token](#3-สร้าง-page-access-token)
4. [ทดสอบ Local (ngrok)](#4-ทดสอบ-local-ด้วย-ngrok)
5. [Deploy ขึ้น Render](#5-deploy-ขึ้น-render)
6. [ตั้งค่า Webhook](#6-ตั้งค่า-webhook-บน-facebook)
7. [Subscribe Page](#7-subscribe-page-to-webhook)
8. [ทดสอบระบบจริง](#8-ทดสอบระบบจริง)
9. [Go Live (App Review)](#9-go-live--app-review)

---

## 1. สร้าง Facebook App

1. ไปที่ **[developers.facebook.com](https://developers.facebook.com)**
2. คลิก **"My Apps"** → **"Create App"**
3. เลือก **"Other"** → **"Business"**
4. ตั้งชื่อ: `OYOSHI Good Energy Campaign`
5. เลือก Business Account (ถ้ามี) หรือสร้างใหม่
6. กด **Create App**

> 📝 จดไว้: **App ID** และ **App Secret** (Settings → Basic)

---

## 2. ตั้งค่า Permissions

ใน App Dashboard:

1. ไปที่ **App Settings → Advanced**
2. ตรวจสอบว่า **App Mode** เป็น **Development** (เริ่มต้น)
3. ไปที่ **Add Product** → เพิ่ม **Webhooks**
4. ไปที่ **Add Product** → เพิ่ม **Facebook Login for Business**

### Permissions ที่ต้องการ:

| Permission | ใช้ทำอะไร |
|-----------|----------|
| `pages_show_list` | ดูรายการ Pages ที่จัดการ |
| `pages_read_engagement` | อ่าน comments บน Posts |
| `pages_manage_metadata` | Subscribe webhooks ให้ Page |
| `pages_manage_engagement` | ตอบ comment กลับ |

---

## 3. สร้าง Page Access Token

### วิธีที่ 1: Graph API Explorer (เร็วที่สุด)

1. ไปที่ **[Graph API Explorer](https://developers.facebook.com/tools/explorer/)**
2. เลือก **App** ของคุณ (OYOSHI Good Energy Campaign)
3. คลิก **"Generate Access Token"**
4. เลือก Permissions:
   - ✅ `pages_show_list`
   - ✅ `pages_read_engagement`
   - ✅ `pages_manage_metadata`
   - ✅ `pages_manage_engagement`
5. กด **"Generate Access Token"** → Login → อนุญาต
6. จะได้ **User Access Token** — ยังไม่ใช่ Page Token!

### แปลงเป็น Page Access Token:

ใน Graph API Explorer พิมพ์:
```
GET /me/accounts
```

จะได้ผลลัพธ์:
```json
{
  "data": [
    {
      "access_token": "EAAxxxxxxxx...",   ← นี่คือ Page Access Token!
      "id": "123456789",                   ← นี่คือ Page ID
      "name": "OYOSHI Thailand"
    }
  ]
}
```

> 📝 Copy **`access_token`** และ **`id`** ไว้ใส่ใน `.env`

### แปลงเป็น Long-Lived Token (ไม่หมดอายุ):

ใน Graph API Explorer:
```
GET /oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={PAGE_ACCESS_TOKEN_ที่ได้จากขั้นตอนก่อน}
```

> 💡 Page Token ที่สร้างจาก Long-lived User Token จะ **ไม่มีวันหมดอายุ**

---

## 4. ทดสอบ Local ด้วย ngrok

### Install ngrok:
```bash
# macOS
brew install ngrok
```

### ตั้งค่า .env:
```bash
cd server
cp .env.example .env
```

แก้ไขไฟล์ `.env`:
```
FB_VERIFY_TOKEN=oyoshi_good_energy_2024
FB_PAGE_ACCESS_TOKEN=EAAxxxxxxxx...
FB_APP_SECRET=xxxxxxxxxx
FB_PAGE_ID=123456789
REPLY_DELAY_MS=3000
```

### รัน Server:
```bash
npm run dev
```

### เปิด ngrok tunnel (terminal อีกอัน):
```bash
ngrok http 3000
```

จะได้ URL เช่น:
```
https://abc123.ngrok-free.app
```

### ทดสอบ Health Check:
```bash
curl https://abc123.ngrok-free.app/health
```

---

## 5. Deploy ขึ้น Render

1. Push code ขึ้น **GitHub** (ถ้ายังไม่มี):
   ```bash
   cd "/Users/na/Downloads/Oyoshi Test_1"
   git init
   git add .
   git commit -m "OYOSHI Campaign — initial commit"
   # สร้าง repo บน GitHub แล้ว push
   git remote add origin https://github.com/YOUR_USER/oyoshi-campaign.git
   git push -u origin main
   ```

2. ไปที่ **[render.com](https://render.com)** → Sign up / Login

3. คลิก **"New +"** → **"Web Service"**

4. เชื่อมต่อ GitHub → เลือก Repository

5. ตั้งค่า:
   | Setting | Value |
   |---------|-------|
   | Name | `oyoshi-campaign` |
   | Root Directory | `server` |
   | Runtime | `Node` |
   | Build Command | `npm install` |
   | Start Command | `node index.js` |
   | Plan | Free |

6. เพิ่ม **Environment Variables**:
   | Key | Value |
   |-----|-------|
   | `FB_VERIFY_TOKEN` | `oyoshi_good_energy_2024` |
   | `FB_PAGE_ACCESS_TOKEN` | `EAAxxxxxxxx...` |
   | `FB_APP_SECRET` | `xxxxxxxxxx` |
   | `FB_PAGE_ID` | `123456789` |
   | `REPLY_DELAY_MS` | `3000` |

7. กด **"Create Web Service"** → รอ Deploy

> 📝 จดไว้: ได้ URL เช่น `https://oyoshi-campaign.onrender.com`

---

## 6. ตั้งค่า Webhook บน Facebook

1. ไปที่ **App Dashboard → Webhooks**
2. เลือก **"Page"** จาก dropdown
3. กด **"Subscribe to this topic"**
4. กรอก:
   | Field | Value |
   |-------|-------|
   | Callback URL | `https://oyoshi-campaign.onrender.com/webhook` |
   | Verify Token | `oyoshi_good_energy_2024` (ต้องตรงกับ .env) |
5. กด **"Verify and Save"**
6. ✅ ถ้า Verify ผ่าน จะเห็น "Active"

### Subscribe Fields:

หลัง Verify แล้ว ต้อง Subscribe field `feed`:
- ในหน้า Webhooks → Page → ติ๊กถูกที่ **"feed"**

---

## 7. Subscribe Page to Webhook

ต้องทำอีกขั้นหนึ่ง — บอก Facebook ว่า Page ไหนจะรับ webhook:

### วิธีที่ 1: ใช้ Endpoint ที่สร้างไว้
```bash
curl -X POST https://oyoshi-campaign.onrender.com/subscribe-page
```

### วิธีที่ 2: ใช้ Graph API Explorer
```
POST /{PAGE_ID}/subscribed_apps
  ?subscribed_fields=feed
  &access_token={PAGE_ACCESS_TOKEN}
```

> ✅ จะได้ response: `{ "success": true }`

---

## 8. ทดสอบระบบจริง

1. ไปที่ **Facebook Page** ของคุณ
2. สร้าง **Post** ใหม่ (หรือใช้ Post เดิม)
3. **Comment** บน Post ด้วย Account ที่เป็น Admin/Developer ของ App:
   ```
   @มิ้นท์ เพื่อนดีที่สุด!
   ```
4. รอ **3-5 วินาที** → Bot จะตอบกลับด้วยผลลัพธ์ Personality Type

### ตรวจสอบ Logs:

บน Render → เข้า Service → ดู **Logs** tab จะเห็น:
```
[Comment] 💬 New comment from Your Name (12345): "@มิ้นท์ เพื่อนดีที่สุด!"
[Comment] 🎯 Extracted friend name: "มิ้นท์"
[Comment] ✨ Result: THE HYPE FRIEND — 94%
[FB] ✅ Replied to comment 123_456 → new reply ID: 123_789
[Comment] ✅ Successfully replied! Reply ID: 123_789
```

---

## 9. Go Live — App Review

> ⚠️ ใน Development Mode จะใช้ได้เฉพาะ Admin/Developer/Tester ของ App  
> ถ้าต้องการให้ **ทุกคน** ที่ comment ได้รับ reply จะต้องผ่าน App Review

### ขั้นตอน:

1. ไปที่ **App Dashboard → App Review → Permissions and Features**
2. กด **"Request"** สำหรับ:
   - `pages_read_engagement`
   - `pages_read_user_content`
   - `pages_manage_engagement`
   - `pages_manage_metadata`
3. **เตรียมข้อมูล** ที่ Facebook ต้องการ:
   - วิดีโอสาธิตการใช้งาน (Screencast แสดงว่า Bot ทำอะไร)
   - อธิบาย Use Case
   - Privacy Policy URL
   - Terms of Service URL
4. **Submit** → รอ Review (ปกติ 1-5 วันทำการ)

### Tips สำหรับ App Review:
- ทำ Screencast ให้เห็น Flow ทั้งหมด: User comment → Bot reply
- อธิบายชัดเจนว่าเป็น Campaign เพื่อ engagement ไม่ใช่ spam
- มี Privacy Policy จริง (ใช้ generator ฟรีได้)

---

## Troubleshooting

| ปัญหา | วิธีแก้ |
|-------|--------|
| Webhook Verify ไม่ผ่าน | ตรวจ Verify Token ตรงกันไหม + URL ต้องเป็น HTTPS |
| Bot ไม่ตอบ | ดู Logs บน Render — ตรวจ Page Access Token ถูกต้องไหม |
| Bot ตอบซ้ำ | ตรวจว่า duplicate guard ทำงาน — ดู Logs |
| Error 190 (Token expired) | สร้าง Long-lived Token ใหม่ตามขั้นตอน 3 |
| Error 100 (Permissions) | ตรวจ Permissions ใน App Dashboard |
| Render sleep (ช้า 30s) | อัพเกรดเป็น Render Starter ($7/เดือน) |
