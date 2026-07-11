require('../utils/dns-fix');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not defined');
  process.exit(1);
}

const OrderSchema = new mongoose.Schema({
  id: String,
  uploadStatus: String,
  customizationStatus: String,
  images: Array,
  activityLogs: Array
}, { strict: false });

const Order = mongoose.model('Order', OrderSchema);

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB.');
    
    // Clean up ORD1001 orders
    const result = await Order.updateMany(
      { id: { $regex: '^ORD1001' } },
      { 
        $set: { 
          images: [], 
          uploadStatus: 'pending', 
          customizationStatus: 'pending',
          activityLogs: [] 
        } 
      }
    );
    console.log(`Reset ${result.modifiedCount} orders (cleared images and set status to pending).`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting or resetting:', err);
    process.exit(1);
  });
