const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://ramapriya793_db_user:RamapriyaRamapriya123@cluster0.ubze05l.mongodb.net/prinkdb?retryWrites=true&w=majority&appName=Cluster0');
const SkuMappingSchema = new mongoose.Schema({}, { strict: false });
const SkuMapping = mongoose.model('SkuMapping', SkuMappingSchema);
SkuMapping.deleteMany({}).then(() => { console.log('cleared'); process.exit(0); });
