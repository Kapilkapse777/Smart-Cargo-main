# 🚀 Hosting Guide for Cargo Exchange Platform

Your project is now **production-ready** with PostgreSQL (no Mongoose) and can be hosted on multiple platforms!

## 🎯 **What's Ready for Hosting:**

✅ **Backend**: Node.js + Express + PostgreSQL  
✅ **Frontend**: React (can be hosted separately)  
✅ **Database**: PostgreSQL (hosting-friendly)  
✅ **Configuration**: Environment-based config  
✅ **Security**: JWT, CORS, SQL injection protection  

---

## 🏆 **Recommended Hosting Platforms**

### **1. Railway.app (EASIEST) ⭐**
- **Free tier**: 500 hours/month
- **PostgreSQL included**: Free database
- **One-click deploy**: GitHub integration

#### Deploy Steps:
1. Go to [Railway.app](https://railway.app/)
2. Connect your GitHub repository
3. Deploy backend + database automatically
4. Get your live URL!

#### Configuration:
```bash
# Railway automatically sets these:
DATABASE_URL=postgresql://...  # Auto-generated
PORT=3000                      # Auto-generated
NODE_ENV=production           # Auto-set
```

---

### **2. Render.com (FREE) ⭐**
- **Free tier**: Always free
- **PostgreSQL included**: Free database
- **Easy deploy**: GitHub integration

#### Deploy Steps:
1. Go to [Render.com](https://render.com/)
2. Create new "Web Service" from GitHub
3. Create new "PostgreSQL" database
4. Connect them using environment variables

#### Configuration:
Use the provided `render.yaml` file for automatic setup.

---

### **3. Heroku (CLASSIC)**
- **Free tier**: Removed (now paid)
- **PostgreSQL addon**: Heroku Postgres
- **Dyno deploy**: Git-based

#### Deploy Steps:
```bash
# Install Heroku CLI
heroku create your-cargo-exchange-app
heroku addons:create heroku-postgresql:mini
git push heroku main
```

---

## 📋 **Local Development Setup**

### **1. Install Dependencies**
```bash
cd backend
npm install
```

### **2. Setup Local PostgreSQL**
```bash
# Install PostgreSQL locally
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt install postgresql

# Create database
createdb cargo_exchange
```

### **3. Configure Database**
Update `backend/config.js`:
```javascript
local: {
  host: 'localhost',
  port: 5432,
  database: 'cargo_exchange',
  user: 'postgres',
  password: 'your_password'  // Your PostgreSQL password
}
```

### **4. Create Tables**
```bash
npm run setup-db
```

### **5. Start Development Server**
```bash
npm run dev
```

---

## 🌐 **Production Deployment**

### **Option A: Deploy Backend + Frontend Separately**

#### Backend (API):
- Deploy to: Railway/Render/Heroku
- Database: PostgreSQL (included)
- URL: `https://your-api.railway.app`

#### Frontend (React):
- Deploy to: Vercel/Netlify
- Build command: `npm run build`
- URL: `https://your-app.vercel.app`

### **Option B: Deploy Everything Together**
- Platform: Railway (supports monorepo)
- Backend: `/backend` folder
- Frontend: `/frontend` folder
- Database: PostgreSQL service

---

## 🔧 **Environment Variables**

### **Required for Production:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your_super_secure_secret_key
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### **Platform-Specific:**
- **Railway**: Auto-generated `DATABASE_URL`
- **Render**: Set via dashboard
- **Heroku**: Set via CLI: `heroku config:set KEY=VALUE`

---

## 📊 **Database Management**

### **Import Indian Cities Data**
```bash
# After hosting setup, import cities:
node setup/import_cities.js
```

### **Database Migrations**
```bash
# Create new tables:
npm run setup-db

# Check database status:
node -e "require('./database').query('SELECT COUNT(*) FROM users').then(r => console.log('Users:', r.rows[0].count))"
```

---

## 🚀 **Quick Deploy Commands**

### **Railway.app (Recommended)**
```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for hosting"
git push origin main

# 2. Go to Railway.app
# 3. Connect GitHub repo
# 4. Deploy automatically!
```

### **Render.com**
```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy to Render"
git push origin main

# 2. Create Web Service on Render
# 3. Connect GitHub repo
# 4. Use render.yaml for auto-config
```

---

## 🔍 **Testing Your Hosted App**

### **API Health Check**
```bash
curl https://your-api-url.com/health
```

### **Test Registration**
```bash
curl -X POST https://your-api-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### **Test Database**
```bash
curl https://your-api-url.com/api/cities/major
```

---

## 🎉 **Success Checklist**

✅ Backend deployed and accessible  
✅ Database connected and tables created  
✅ Frontend can connect to API  
✅ User registration/login works  
✅ Cargo listings can be created  
✅ Indian cities data imported  
✅ CORS configured for frontend domain  

---

## 💡 **Pro Tips**

1. **Database Backups**: Enable automatic backups on your hosting platform
2. **SSL**: Ensure HTTPS is enabled (usually automatic)
3. **Domain**: Connect custom domain for professional look
4. **Monitoring**: Set up uptime monitoring
5. **Scaling**: Monitor usage and upgrade plans as needed

---

## 🆘 **Troubleshooting**

### **Common Issues:**
1. **Database Connection**: Check `DATABASE_URL` format
2. **CORS Errors**: Update `FRONTEND_URL` in config
3. **Build Failures**: Check Node.js version compatibility
4. **Authentication Issues**: Verify `JWT_SECRET` is set

### **Debug Commands:**
```bash
# Check database connection
node -e "require('./database').connectDB()"

# Test API endpoints
curl https://your-api-url.com/

# Check environment variables
node -e "console.log(process.env.DATABASE_URL ? 'DB Connected' : 'DB Missing')"
```

---

## 🎊 **Your App is Ready!**

**Frontend**: `https://your-frontend.vercel.app`  
**Backend API**: `https://your-api.railway.app`  
**Database**: PostgreSQL (hosted)  

**Features Available:**
- 👥 User Registration & Login
- 📦 Cargo Listings
- 🤝 AI-Powered Matching (A→C, C→A)
- 🗺️ Route Optimization
- 🏙️ 548K+ Indian Cities Database
- 💰 Cost Savings Calculator

**Ready for production use!** 🚀 