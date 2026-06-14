# 🚀 RankBooster — JEE Test Series Platforms

## ⚡ Quick Start (Windows)

### Step 1 — Install Node.js (one-time only)
1. Go to **https://nodejs.org**
2. Download the **LTS** version (green button)
3. Run the installer — keep all defaults, click Next → Next → Install
4. Restart your PC after install

### Step 2 — Extract & Run
1. **Extract** this ZIP folder anywhere (e.g. `C:\rankbooster`)
2. **Double-click** `start.bat`
3. Wait for it to install (first time ~2 mins), then it shows:

```
  Open in browser on THIS computer:
  http://localhost:3000

  Open on your PHONE or another device:
  http://192.168.x.x:3000
```

4. Open the URL in your browser — done! ✅

---

## 📱 Access on Mobile

- Your phone must be on the **same WiFi** as your PC
- Use the `http://192.168.x.x:3000` URL shown in the terminal
- Works on Android & iPhone browsers

---

## 🔑 Login Credentials

| Role  | Email                      | Password   |
|-------|---------------------------|------------|
| Admin | admin@rankbooster.com      | Admin@123  |
| User  | arjun@gmail.com            | Test@123   |

---

## 🗂️ Features

### For Students
- **My Courses** — Enrolled test series with progress
- **Tests** — Folder-based test navigation (Full Tests / Part Tests / Chapter Tests)
- **Analysis** — Per-course performance charts & breakdowns
- **Error Log** — All wrong questions, filterable by type/course, with reattempt option
- **Notebook** — Custom notebooks to save important questions

### For Admin
- **Admin Panel** (only visible when logged in as admin)
  - Course management — Add, edit, delete courses with custom colors, pricing, banners
  - Test management — Add folders & tests per course
  - User management — View all registered students and enrollments

---

## 🛑 To Stop the Server
Press `Ctrl + C` in the terminal window.

---

## 📁 Project Structure
```
rankbooster/
├── start.bat          ← Double-click to run
├── package.json       ← App configuration
├── .env               ← Network settings (HOST=0.0.0.0)
├── public/
│   └── index.html
└── src/
    ├── index.js
    └── App.jsx        ← Main application (all code here)
```

---

## ❓ Troubleshooting

**"node is not recognized"**
→ Node.js not installed. Go to nodejs.org and install it.

**Port 3000 already in use**
→ Open `.env` and change `PORT=3000` to `PORT=3001`

**Phone can't connect**
→ Make sure phone and PC are on the same WiFi
→ Try turning off Windows Firewall temporarily

**npm install fails**
→ Right-click `start.bat` → Run as Administrator
