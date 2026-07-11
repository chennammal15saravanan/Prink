const mongoose = require('mongoose');

const URI = process.env.MONGODB_URI || 'mongodb+srv://ramapriya793_db_user:RamapriyaRamapriya123@cluster0.ubze05l.mongodb.net/prinkdb?retryWrites=true&w=majority&appName=Cluster0';

async function seedPersonalization() {
  const conn = await mongoose.createConnection(URI).asPromise();
  console.log('Connected to MongoDB for Personalization seeding.');
  const db = conn.db;

  const orders = await db.collection('orders').find({}).toArray();

  if (orders.length === 0) {
    console.error('Orders missing. Run seedOrders first.');
    await conn.close();
    return;
  }

  const personalizations = [];

  for (const order of orders) {
    for (const item of order.lineItems) {
      // Determine logical statuses based on order fulfillment status
      let adminStatus = 'Pending Review';
      let customerApproval = 'Pending';
      let printerStatus = 'Pending';

      if (order.fulfillmentStatus === 'PRINTING' || order.fulfillmentStatus === 'PACKED' || order.fulfillmentStatus === 'SHIPPED' || order.fulfillmentStatus === 'DELIVERED') {
        adminStatus = 'Approved';
        customerApproval = 'Approved';
        printerStatus = 'Completed';
      } else if (order.fulfillmentStatus === 'READY_FOR_PRINT') {
        adminStatus = 'Approved';
        customerApproval = 'Approved';
        printerStatus = 'Pending';
      } else if (Math.random() > 0.5) {
        adminStatus = 'Reviewing';
        customerApproval = 'Awaiting Approval';
      }

      personalizations.push({
        _id: new mongoose.Types.ObjectId(),
        orderId: order._id,
        orderNumber: order.orderNumber,
        productId: item.productId,
        sku: item.sku,
        uploadedImages: item.uploadedImages,
        previewImage: item.previewImage,
        adminStatus,
        customerApproval,
        printerStatus,
        createdAt: new Date(order.orderDate.getTime() + 3600000) // +1 hour after order
      });
    }
  }

  const personalizationCollection = db.collection('personalization');
  await personalizationCollection.deleteMany({});
  await personalizationCollection.insertMany(personalizations);
  
  console.log(`Inserted ${personalizations.length} personalization records into 'personalization' collection.`);

  await conn.close();
  return personalizations;
}

if (require.main === module) {
  seedPersonalization().catch(console.error);
}

module.exports = seedPersonalization;


