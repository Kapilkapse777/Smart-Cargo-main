const mongoose = require('mongoose');

// MongoDB Atlas connection string
const MONGODB_URI = "mongodb+srv://kapilkapsecogni:SLCUEWZF5utApJu4@cluster0.an9j7tk.mongodb.net/cargo_exchange?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB Atlas connection...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log('🗄️  Database: cargo_exchange');
    console.log('🌐 Cluster: cluster0.an9j7tk.mongodb.net');
    
    // Test database operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    // Test a simple query
    const stats = await mongoose.connection.db.stats();
    console.log('📊 Database stats:');
    console.log(`   - Collections: ${stats.collections}`);
    console.log(`   - Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n🎉 Database connection test SUCCESSFUL!');
    
  } catch (error) {
    console.error('❌ MongoDB connection FAILED:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Check your username and password in the connection string');
    }
    if (error.message.includes('network')) {
      console.log('💡 Check your internet connection and MongoDB Atlas network access');
    }
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testConnection(); 