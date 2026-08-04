const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const BT = require('./server/models/ButterflyTemplate');
  const templates = await BT.find({});
  console.log('Templates:', templates);
  const Order = require('./server/models/Order');
  const butterflyOrders = await Order.find({ butterflyTemplateId: { $ne: null } });
  console.log('Orders with templates:', butterflyOrders.map(o => o.id));
  process.exit(0);
}).catch(console.error);
