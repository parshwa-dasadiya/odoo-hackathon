const mongoose = require('mongoose');
const User = require('../models/User.model');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/assetflow');
    console.log('🔌 Connected to MongoDB for seeding...');

    const defaultPassword = 'Password123';

    const usersToSeed = [
      {
        name: 'System Admin',
        email: 'admin@assetflow.com',
        role: 'Admin',
        isEmailVerified: true
      },
      {
        name: 'John Doe',
        email: 'john.doe@assetflow.com',
        role: 'Employee',
        isEmailVerified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@assetflow.com',
        role: 'Asset Manager',
        isEmailVerified: true
      },
      {
        name: 'Manager Bob',
        email: 'manager@assetflow.com',
        role: 'Department Head',
        isEmailVerified: true
      },
      {
        name: 'Auditor Alice',
        email: 'auditor@assetflow.com',
        role: 'Auditor',
        isEmailVerified: true
      }
    ];

    for (const userData of usersToSeed) {
      let user = await User.findOne({ email: userData.email });
      if (user) {
        user.password = defaultPassword;
        user.role = userData.role;
        user.isEmailVerified = true;
        await user.save();
        console.log(`✨ Updated password/role for: ${userData.email}`);
      } else {
        await User.create({
          ...userData,
          password: defaultPassword
        });
        console.log(`✨ Created new user: ${userData.email}`);
      }
    }

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
