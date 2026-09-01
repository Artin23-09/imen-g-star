# ایمن جی استار - سایت حرفه‌ای

## ساختار پروژه

```
imen-g-star/
├── css/style.css
├── js/
│   ├── main.js
│   ├── site-loader.js   ← محتوا از API
│   └── admin.js         ← پنل ادمین با JWT
├── images/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── index.html
├── products.html
├── about.html
├── contact.html
├── admin.html
└── admin-dashboard.html
```

## اجرای محلی

### ۱. نصب وابستگی‌های بک‌اند
```bash
cd backend
pip install -r requirements.txt
```

### ۲. اجرای بک‌اند
```bash
python app.py
```
سایت روی آدرس زیر بالا می‌آید:
http://127.0.0.1:5000

### ۳. ورود ادمین
- آدرس: http://127.0.0.1:5000/admin.html
- نام کاربری: `admin`
- رمز عبور: `admin123`

## نکات مهم

- تمام اطلاعات در دیتابیس SQLite ذخیره می‌شود (`imen_g_star.db`)
- پنل ادمین با JWT محافظت شده
- برای دیپلوی روی Render یا Railway راهنمایی جداگانه داده می‌شود

## تغییر رمز ادمین
از داخل پنل ادمین → تنظیمات → تغییر رمز عبور
