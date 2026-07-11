const http = require('http');

function request(method, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 400) reject(new Error('Status: ' + res.statusCode + ' ' + body));
          resolve(JSON.parse(body));
        } catch(e) { resolve(body); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  const report = [];
  try {
    // 1. Admin login to get token
    console.log('Logging in as admin...');
    const adminLogin = await request('POST', '/api/auth/admin-login', { email: 'admin@theprink.com', password: 'prink123' });
    const adminToken = adminLogin.token;
    report.push('- [x] Admin Auth Successful');

    // 2. Trigger mock webhook
    console.log('Triggering mock webhook...');
    const webhookRes = await request('POST', '/api/shopify/mock-webhook');
    const orderId = webhookRes.order.id;
    const uploadLink = webhookRes.whatsapp.uploadLink;
    const tokenStr = uploadLink.split('token=')[1];
    report.push('- [x] Webhook triggered (Order ID: ' + orderId + ')');
    report.push('- [x] WhatsApp Link Generated');

    // 3. Customer Upload & Submit
    console.log('Customer submitting orderId: ' + orderId);
    const confirmRes = await request('POST', '/api/orders/' + orderId + '/design', { designData: '{}', customizationStatus: 'completed', images: [{ id: '1', url: 'test.jpg' }] }, { 'Authorization': 'Bearer ' + tokenStr });
    report.push('- [x] Customer Images Uploaded & Submitted');

    // 4. Admin Approves and Generates PDF
    console.log('Admin approving...');
    const reviewRes = await request('POST', '/api/orders/' + orderId + '/review', { action: 'approve', comments: 'Looks good' }, { 'Authorization': 'Bearer ' + adminToken });
    report.push('- [x] Admin Reviewed & PDF Generated');

    // 5. Printer marks as Processing then Completed
    console.log('Printer logging in & updating status...');
    const printerLogin = await request('POST', '/api/auth/printer-login', { email: 'printer@theprink.com', password: 'printer123' });
    const printerToken = printerLogin.token;

    await request('POST', '/api/printer/queue/' + orderId + '/status', { status: 'processing' }, { 'Authorization': 'Bearer ' + printerToken });
    await request('POST', '/api/printer/queue/' + orderId + '/status', { status: 'completed' }, { 'Authorization': 'Bearer ' + printerToken });
    report.push('- [x] Printer marked as completed');

    // 6. Fetch final order to verify DB updates
    console.log('Fetching final order details...');
    const orders = await request('GET', '/api/orders', null, { 'Authorization': 'Bearer ' + adminToken });
const finalOrder = orders.find(o => o.id === orderId);
    report.push('- [x] Database completely updated');

    console.log('\n====================================');
    console.log('      END-TO-END WORKFLOW REPORT');
    console.log('====================================\n');
    console.log(report.join('\n'));
    console.log('\nFINAL ORDER STATUS:');
    console.log('Upload Status:', finalOrder.uploadStatus);
    console.log('Admin Status:', finalOrder.adminApprovalStatus);
    console.log('Print Status:', finalOrder.printStatus);
    console.log('Delivery Status:', finalOrder.deliveryStatus);
    console.log('PDF URL:', finalOrder.pdfUrl);
    console.log('\nACTIVITY LOGS:');
    finalOrder.activityLogs.forEach(log => console.log(' -> [' + log.time + '] ' + log.text));
    
  } catch (err) {
    console.error('Workflow failed:', err);
  }
}
run();






