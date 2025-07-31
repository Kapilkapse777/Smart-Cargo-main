const mongoose = require('mongoose');

// Your MongoDB Atlas connection string
const MONGODB_URI = "mongodb+srv://kapilkapsecogni:SLCUEWZF5utApJu4@cluster0.an9j7tk.mongodb.net/cargo_exchange?retryWrites=true&w=majority&appName=Cluster0";

async function checkDatabase() {
  console.log('🔍 MongoDB Atlas Connection Checker');
  console.log('=====================================');
  console.log('🌐 Cluster: cluster0.an9j7tk.mongodb.net');
  console.log('👤 Username: kapilkapsecogni');
  console.log('🗄️  Database: cargo_exchange');
  console.log('');

  try {
    console.log('🔄 Step 1: Attempting connection...');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });
    
    console.log('✅ Step 1: Connection SUCCESSFUL!');
    console.log('');
    
    console.log('🔄 Step 2: Testing database operations...');
    
    // Get database info
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    
    // Test database access
    const buildInfo = await adminDb.buildInfo();
    console.log('✅ Step 2: Database operations SUCCESSFUL!');
    console.log(`   📋 MongoDB Version: ${buildInfo.version}`);
    console.log('');
    
    console.log('🔄 Step 3: Checking collections...');
    const collections = await db.listCollections().toArray();
    console.log('✅ Step 3: Collections check SUCCESSFUL!');
    console.log(`   📁 Found ${collections.length} collections:`, collections.map(c => c.name));
    console.log('');
    
    console.log('🔄 Step 4: Testing data insertion...');
    // Test collection creation and insertion
    const testCollection = db.collection('connection_test');
    const testDoc = {
      message: 'Connection test successful',
      timestamp: new Date(),
      from: 'Cargo Exchange Platform'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ Step 4: Data insertion SUCCESSFUL!');
    console.log(`   🆔 Inserted document ID: ${insertResult.insertedId}`);
    console.log('');
    
    console.log('🎉 ALL TESTS PASSED! Your MongoDB Atlas database is fully connected and working!');
    console.log('');
    console.log('🚀 Ready to run your Cargo Exchange Platform!');
    
  } catch (error) {
    console.error('❌ CONNECTION FAILED!');
    console.error('');
    console.error('Error Details:', error.message);
    console.error('');
    
    if (error.message.includes('IP')) {
      console.log('🔧 SOLUTION: Add your IP to MongoDB Atlas whitelist');
      console.log('   1. Go to https://cloud.mongodb.com/');
      console.log('   2. Navigate to Security → Network Access');
      console.log('   3. Click "Add IP Address"');
      console.log('   4. Select "Add Current IP Address" or "Allow Access from Anywhere"');
      console.log('   5. Click "Confirm"');
    } else if (error.message.includes('authentication')) {
      console.log('🔧 SOLUTION: Check your username and password');
      console.log('   1. Verify username: kapilkapsecogni');
      console.log('   2. Verify password: SLCUEWZF5utApJu4');
      console.log('   3. Check if user has database access permissions');
    } else {
      console.log('🔧 SOLUTION: Check your internet connection and try again');
    }
  } finally {
    await mongoose.connection.close();
    console.log('');
    console.log('🔌 Connection closed.');
    process.exit(0);
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('📡 Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('📡 Mongoose disconnected');
});

// Run the check
checkDatabase(); 