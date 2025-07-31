const connectDB = require('../config/database');
const City = require('../models/City');
const fs = require('fs');
const path = require('path');

async function importCities() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('🗂️  Reading cities data from JSON...');
    const citiesPath = path.join(__dirname, '../data/cities_india.json');
    
    if (!fs.existsSync(citiesPath)) {
      console.error('❌ Cities JSON file not found at:', citiesPath);
      console.log('💡 Please run the extract script first to generate cities_india.json');
      process.exit(1);
    }
    
    const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
    console.log(`📊 Found ${cities.length} cities to import`);
    
    // Clear existing cities
    console.log('🗑️  Clearing existing cities...');
    await City.deleteMany({});
    
    // Import cities in batches for better performance
    const batchSize = 1000;
    let imported = 0;
    
    for (let i = 0; i < cities.length; i += batchSize) {
      const batch = cities.slice(i, i + batchSize);
      
      try {
        await City.insertMany(batch, { ordered: false });
        imported += batch.length;
        console.log(`✅ Imported ${imported}/${cities.length} cities...`);
      } catch (error) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`⚠️  Skipped duplicates in batch ${Math.floor(i/batchSize) + 1}`);
        } else {
          console.error('❌ Error importing batch:', error.message);
        }
      }
    }
    
    // Get final count
    const finalCount = await City.countDocuments();
    console.log(`\n🎉 Successfully imported ${finalCount} cities to MongoDB!`);
    
    // Show some sample data
    console.log('\n📍 Sample cities:');
    const samples = await City.find().sort({ population: -1 }).limit(5);
    samples.forEach(city => {
      console.log(`   ${city.name} (Pop: ${city.population?.toLocaleString() || 'N/A'}) - ${city.coordinates}`);
    });
    
    // Create indexes
    console.log('\n🔍 Creating database indexes...');
    await City.createIndexes();
    console.log('✅ Indexes created successfully');
    
    console.log('\n✨ Import completed! Your MongoDB is ready.');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run the import
importCities(); 