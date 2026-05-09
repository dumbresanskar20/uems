require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const newPassword = 'Admin@1234';
  const hash = await bcrypt.hash(newPassword, 12);
  
  const result = await mongoose.connection.db.collection('organizations').updateOne(
    { _id: new mongoose.Types.ObjectId('69fdfa076631ec09bcdc51f5') },
    { $set: { password: hash } }
  );
  
  if (result.modifiedCount === 1) {
    console.log('✅ Password reset successfully!');
    console.log('📧 Username: sd@uems.co');
    console.log('📧 Email:    dumbresanskar16@gmail.com');
    console.log('🔑 Password: Admin@1234');
  } else {
    console.log('❌ No document updated. Check the org ID.');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('DB Error:', err.message);
  process.exit(1);
});
