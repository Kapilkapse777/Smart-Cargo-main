// Configuration for Cargo Exchange Platform
const config = {
  // Database Configuration (PostgreSQL)
  database: {
    // For local development
    local: {
      host: 'localhost',
      port: 5432,
      database: 'cargo_exchange',
      user: 'postgres',
      password: 'your_password'
    },
    
    // For hosting platforms (update with your hosting database URL)
    production: {
      // Railway.app example
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@hostname:5432/cargo_exchange',
      ssl: { rejectUnauthorized: false }
    }
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development'
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secure_jwt_secret_change_in_production',
    expiresIn: '7d'
  },

  // CORS Configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },

  // Hosting Platform Examples
  hosting: {
    railway: {
      // Free PostgreSQL + Node.js hosting
      database_url: "postgresql://postgres:password@containers-us-west-xx.railway.app:5432/railway",
      frontend_url: "https://your-app.up.railway.app"
    },
    
    render: {
      // Free tier available
      database_url: "postgresql://user:pass@hostname:5432/dbname",
      frontend_url: "https://your-app.onrender.com"
    },
    
    heroku: {
      // Paid service
      database_url: "postgres://user:pass@hostname:5432/dbname",
      frontend_url: "https://your-app.herokuapp.com"
    },
    
    vercel: {
      // Frontend hosting + Serverless functions
      database_url: "postgresql://user:pass@hostname:5432/dbname",
      frontend_url: "https://your-app.vercel.app"
    }
  }
};

module.exports = config; 