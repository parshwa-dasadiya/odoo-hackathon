const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User.model');
const Department = require('../models/Department.model');
const AssetCategory = require('../models/AssetCategory.model');
const Asset = require('../models/Asset.model');
const Allocation = require('../models/Allocation.model');
const MaintenanceRequest = require('../models/MaintenanceRequest.model');
const Booking = require('../models/Booking.model');
const AuditCycle = require('../models/AuditCycle.model');
const AuditItem = require('../models/AuditItem.model');
const ActivityLog = require('../models/ActivityLog.model');
const Notification = require('../models/Notification.model');
const Counter = require('../models/Counter.model');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/assetflow';
    await mongoose.connect(mongoUri);
    console.log('🔌 Connected to MongoDB for comprehensive seeding...');

    // 1. Clear existing database collections
    console.log('🧹 Clearing existing collections...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await AssetCategory.deleteMany({});
    await Asset.deleteMany({});
    await Allocation.deleteMany({});
    await MaintenanceRequest.deleteMany({});
    await Booking.deleteMany({});
    await AuditCycle.deleteMany({});
    await AuditItem.deleteMany({});
    await ActivityLog.deleteMany({});
    await Notification.deleteMany({});
    await Counter.deleteMany({});
    console.log('✅ Collections cleared.');

    const defaultPassword = 'Password123';

    // 2. Seed Categories
    console.log('🌱 Seeding Asset Categories...');
    const laptopCat = await AssetCategory.create({
      name: 'Laptops',
      description: 'Enterprise developer and management workstations',
      customFields: [
        { fieldName: 'Processor', fieldType: 'Text' },
        { fieldName: 'RAM (GB)', fieldType: 'Number' },
        { fieldName: 'Storage (GB)', fieldType: 'Number' }
      ]
    });

    const vehicleCat = await AssetCategory.create({
      name: 'Vehicles',
      description: 'Shared fleet cars, delivery vans, and shuttle vehicles',
      customFields: [
        { fieldName: 'License Plate', fieldType: 'Text' },
        { fieldName: 'Fuel Type', fieldType: 'Text' }
      ]
    });

    const avCat = await AssetCategory.create({
      name: 'AV Equipment',
      description: 'Meeting room video bars, microphones, cameras, and TV panels',
      customFields: [
        { fieldName: 'Resolution', fieldType: 'Text' },
        { fieldName: 'Interface', fieldType: 'Text' }
      ]
    });

    const furnitureCat = await AssetCategory.create({
      name: 'Office Furniture',
      description: 'Ergonomic chairs, sit-stand desks, and conference tables',
      customFields: []
    });

    const mobileCat = await AssetCategory.create({
      name: 'Mobile Devices',
      description: 'Enterprise smartphones and tablet devices',
      customFields: [
        { fieldName: 'OS', fieldType: 'Text' },
        { fieldName: 'Model Year', fieldType: 'Number' }
      ]
    });

    const networkCat = await AssetCategory.create({
      name: 'Network Hardware',
      description: 'Routers, switches, load balancers, and access points',
      customFields: [
        { fieldName: 'IP Address', fieldType: 'Text' },
        { fieldName: 'Port Count', fieldType: 'Number' }
      ]
    });
    console.log('✅ Asset Categories seeded.');

    // 3. Seed Users (passwords will be hashed automatically by User schema pre-save hook)
    console.log('🌱 Seeding Users...');
    const adminUser = await User.create({
      name: 'Sarah Connor',
      email: 'admin@assetflow.com',
      password: defaultPassword,
      role: 'Admin',
      isEmailVerified: true
    });

    const managerUser = await User.create({
      name: 'Manager Bob',
      email: 'manager@assetflow.com',
      password: defaultPassword,
      role: 'Department Head',
      isEmailVerified: true
    });

    const assetManagerUser = await User.create({
      name: 'Jane Smith',
      email: 'manager.jane@assetflow.com',
      password: defaultPassword,
      role: 'Asset Manager',
      isEmailVerified: true
    });

    const employeeUser = await User.create({
      name: 'John Doe',
      email: 'john.doe@assetflow.com',
      password: defaultPassword,
      role: 'Employee',
      isEmailVerified: true
    });

    const auditorUser = await User.create({
      name: 'Auditor Alice',
      email: 'auditor@assetflow.com',
      password: defaultPassword,
      role: 'Auditor',
      isEmailVerified: true
    });

    const userDavid = await User.create({
      name: 'David Miller',
      email: 'david.miller@assetflow.com',
      password: defaultPassword,
      role: 'Employee',
      isEmailVerified: true
    });

    const userKyle = await User.create({
      name: 'Kyle Reese',
      email: 'kyle.reese@assetflow.com',
      password: defaultPassword,
      role: 'Employee',
      isEmailVerified: true
    });

    const userMarcus = await User.create({
      name: 'Marcus Wright',
      email: 'marcus.wright@assetflow.com',
      password: defaultPassword,
      role: 'Employee',
      isEmailVerified: true
    });

    const userGrace = await User.create({
      name: 'Grace Harper',
      email: 'grace.harper@assetflow.com',
      password: defaultPassword,
      role: 'Employee',
      isEmailVerified: true
    });
    console.log('✅ Users seeded.');

    // 4. Seed Departments
    console.log('🌱 Seeding Departments...');
    const engDept = await Department.create({
      name: 'Engineering',
      head: adminUser._id,
      status: 'Active'
    });

    const devDept = await Department.create({
      name: 'Backend Development',
      head: managerUser._id,
      parentDepartment: engDept._id,
      status: 'Active'
    });

    const salesDept = await Department.create({
      name: 'Sales & Marketing',
      head: managerUser._id,
      status: 'Active'
    });

    const opsDept = await Department.create({
      name: 'Finance & Operations',
      head: auditorUser._id,
      status: 'Active'
    });
    console.log('✅ Departments seeded.');

    // Update Users with department refs
    await User.findByIdAndUpdate(adminUser._id, { department: engDept._id });
    await User.findByIdAndUpdate(managerUser._id, { department: devDept._id });
    await User.findByIdAndUpdate(assetManagerUser._id, { department: engDept._id });
    await User.findByIdAndUpdate(employeeUser._id, { department: salesDept._id });
    await User.findByIdAndUpdate(auditorUser._id, { department: opsDept._id });
    await User.findByIdAndUpdate(userDavid._id, { department: engDept._id });
    await User.findByIdAndUpdate(userKyle._id, { department: salesDept._id });
    await User.findByIdAndUpdate(userMarcus._id, { department: devDept._id });
    await User.findByIdAndUpdate(userGrace._id, { department: opsDept._id });

    // Reset sequence counter to seed assets sequentially
    await Counter.create({ _id: 'assetTag', seq: 0 });

    // 5. Seed Assets
    console.log('🌱 Seeding Assets for all departments...');

    // --- Engineering Department ---
    const mbpEng = await Asset.create({
      name: 'Engineering Workstation Pro M3',
      category: laptopCat._id,
      serialNumber: 'SN-ENG-8912',
      acquisitionDate: new Date('2026-02-15'),
      acquisitionCost: 3899,
      condition: 'New',
      location: 'SF HQ - Engineering Lab',
      status: 'Allocated',
      currentHolder: {
        holderType: 'Employee',
        holderId: adminUser._id
      },
      department: engDept._id,
      customFieldsData: {
        'Processor': 'Apple M3 Max',
        'RAM (GB)': 96,
        'Storage (GB)': 2048
      }
    });

    const teslaAsset = await Asset.create({
      name: 'Tesla Model Y Fleet-1',
      category: vehicleCat._id,
      serialNumber: 'SN-TSLA-0091',
      acquisitionDate: new Date('2025-06-15'),
      acquisitionCost: 45000,
      condition: 'Good',
      location: 'Oakland Fleet Depo',
      isBookable: true,
      status: 'Available',
      department: engDept._id,
      customFieldsData: {
        'License Plate': 'CA-9812A',
        'Fuel Type': 'Electric'
      }
    });

    const iphoneEng = await Asset.create({
      name: 'iPhone 15 Pro Max Testbed',
      category: mobileCat._id,
      serialNumber: 'SN-MBL-8801',
      acquisitionDate: new Date('2026-01-20'),
      acquisitionCost: 1199,
      condition: 'New',
      location: 'SF HQ - Mobile Testing Lab',
      status: 'Allocated',
      currentHolder: {
        holderType: 'Employee',
        holderId: userDavid._id
      },
      department: engDept._id,
      customFieldsData: {
        'OS': 'iOS 17',
        'Model Year': 2024
      }
    });

    const switchEng = await Asset.create({
      name: 'Cisco Catalyst Switch 24P',
      category: networkCat._id,
      serialNumber: 'SN-NET-4029',
      acquisitionDate: new Date('2025-10-01'),
      acquisitionCost: 2499,
      condition: 'Good',
      location: 'Server Room 1B',
      status: 'Available',
      department: engDept._id,
      customFieldsData: {
        'IP Address': '192.168.10.12',
        'Port Count': 24
      }
    });

    // --- Backend Development Department ---
    const thinkpadDev = await Asset.create({
      name: 'ThinkPad P1 Gen 6 Workstation',
      category: laptopCat._id,
      serialNumber: 'SN-DEV-7019',
      acquisitionDate: new Date('2026-03-01'),
      acquisitionCost: 2999,
      condition: 'New',
      location: 'Oakland HQ',
      status: 'Allocated',
      currentHolder: {
        holderType: 'Employee',
        holderId: managerUser._id
      },
      department: devDept._id,
      customFieldsData: {
        'Processor': 'Intel Core i9',
        'RAM (GB)': 64,
        'Storage (GB)': 1024
      }
    });

    const serverDev = await Asset.create({
      name: 'Intel Xeon Development Server',
      category: laptopCat._id,
      serialNumber: 'SN-SRV-9902',
      acquisitionDate: new Date('2025-09-10'),
      acquisitionCost: 8999,
      condition: 'Good',
      location: 'HQ Server Room 2A',
      status: 'Available',
      department: devDept._id,
      customFieldsData: {
        'Processor': 'Intel Xeon Dual',
        'RAM (GB)': 256,
        'Storage (GB)': 8192
      }
    });

    const dellDev = await Asset.create({
      name: 'Dell Precision 5680 Developer Laptop',
      category: laptopCat._id,
      serialNumber: 'SN-DEV-2091',
      acquisitionDate: new Date('2026-02-10'),
      acquisitionCost: 2799,
      condition: 'New',
      location: 'Oakland HQ',
      status: 'Allocated',
      currentHolder: {
        holderType: 'Employee',
        holderId: userMarcus._id
      },
      department: devDept._id,
      customFieldsData: {
        'Processor': 'Intel Core i7',
        'RAM (GB)': 32,
        'Storage (GB)': 1024
      }
    });

    // --- Sales & Marketing Department ---
    const mbpAsset = await Asset.create({
      name: 'MacBook Pro 16" M3 Max',
      category: laptopCat._id,
      serialNumber: 'SN-MBP-9081',
      acquisitionDate: new Date('2026-01-10'),
      acquisitionCost: 3499,
      condition: 'New',
      location: 'San Francisco HQ',
      status: 'Allocated',
      currentHolder: {
        holderType: 'Employee',
        holderId: employeeUser._id
      },
      department: salesDept._id,
      customFieldsData: {
        'Processor': 'Apple M3 Max',
        'RAM (GB)': 64,
        'Storage (GB)': 2048
      }
    });

    const cameraAsset = await Asset.create({
      name: 'Nikon Z8 DSLR Pro Camera',
      category: avCat._id,
      serialNumber: 'SN-NKN-1082',
      acquisitionDate: new Date('2026-02-20'),
      acquisitionCost: 3999,
      condition: 'Good',
      location: 'San Francisco HQ',
      status: 'Under Maintenance',
      department: salesDept._id,
      customFieldsData: {
        'Resolution': '45.7 MP',
        'Interface': 'USB-C / HDMI'
      }
    });

    const carbonSales = await Asset.create({
      name: 'Lenovo ThinkPad X1 Carbon',
      category: laptopCat._id,
      serialNumber: 'SN-SLS-3012',
      acquisitionDate: new Date('2025-08-14'),
      acquisitionCost: 2099,
      condition: 'Fair',
      location: 'SF HQ - Sales Bay',
      status: 'Allocated',
      currentHolder: {
        holderType: 'Employee',
        holderId: userKyle._id
      },
      department: salesDept._id,
      customFieldsData: {
        'Processor': 'Intel Core i7',
        'RAM (GB)': 16,
        'Storage (GB)': 512
      }
    });

    const tvSales = await Asset.create({
      name: 'Sony Bravia 85" Smart TV',
      category: avCat._id,
      serialNumber: 'SN-AV-5591',
      acquisitionDate: new Date('2025-11-01'),
      acquisitionCost: 1999,
      condition: 'Good',
      location: 'Sales Presentation Room',
      status: 'Allocated',
      currentHolder: {
        holderType: 'Department',
        holderId: salesDept._id
      },
      department: salesDept._id,
      customFieldsData: {
        'Resolution': '4K UHD',
        'Interface': 'HDMI / Wi-Fi'
      }
    });

    // --- Finance & Operations Department ---
    const dellOps = await Asset.create({
      name: 'Dell Latitude Finance Laptop',
      category: laptopCat._id,
      serialNumber: 'SN-OPS-4412',
      acquisitionDate: new Date('2025-12-05'),
      acquisitionCost: 1899,
      condition: 'Good',
      location: 'SF Office - Finance Wing',
      status: 'Allocated',
      currentHolder: {
        holderType: 'Employee',
        holderId: auditorUser._id
      },
      department: opsDept._id,
      customFieldsData: {
        'Processor': 'Intel Core i7',
        'RAM (GB)': 32,
        'Storage (GB)': 512
      }
    });

    const chairAsset = await Asset.create({
      name: 'Herman Miller Aeron Chair',
      category: furnitureCat._id,
      serialNumber: 'SN-HMA-2981',
      acquisitionDate: new Date('2025-11-20'),
      acquisitionCost: 1450,
      condition: 'Good',
      location: 'SF Office - Floor 2',
      status: 'Available',
      department: opsDept._id,
      customFieldsData: {}
    });

    const polyAsset = await Asset.create({
      name: 'Poly Studio Meeting Room Video Bar',
      category: avCat._id,
      serialNumber: 'SN-POLY-8219',
      acquisitionDate: new Date('2026-03-01'),
      acquisitionCost: 1299,
      condition: 'New',
      location: 'San Francisco HQ - Conf Room 3B',
      isBookable: true,
      status: 'Reserved',
      department: opsDept._id,
      customFieldsData: {
        'Resolution': '4K UHD',
        'Interface': 'USB / Bluetooth'
      }
    });

    const vanOps = await Asset.create({
      name: 'Ford Transit Delivery Van',
      category: vehicleCat._id,
      serialNumber: 'SN-VAN-3091',
      acquisitionDate: new Date('2024-05-18'),
      acquisitionCost: 35000,
      condition: 'Fair',
      location: 'SF HQ - Loading Bay',
      isBookable: true,
      status: 'Available',
      department: opsDept._id,
      customFieldsData: {
        'License Plate': 'CA-4491X',
        'Fuel Type': 'Diesel'
      }
    });
    console.log('✅ Assets seeded.');

    // 6. Seed Allocations
    console.log('🌱 Seeding Allocations...');
    // Overdue Allocation
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 3); // Expected return date: 3 days ago

    await Allocation.create({
      asset: mbpAsset._id,
      holderType: 'Employee',
      holderId: employeeUser._id,
      allocatedBy: adminUser._id,
      allocatedDate: new Date('2026-01-12'),
      expectedReturnDate: overdueDate,
      status: 'Active'
    });

    // iPhone allocation
    await Allocation.create({
      asset: iphoneEng._id,
      holderType: 'Employee',
      holderId: userDavid._id,
      allocatedBy: adminUser._id,
      allocatedDate: new Date('2026-01-20'),
      status: 'Active'
    });

    // Dell Dev Laptop allocation
    await Allocation.create({
      asset: dellDev._id,
      holderType: 'Employee',
      holderId: userMarcus._id,
      allocatedBy: assetManagerUser._id,
      allocatedDate: new Date('2026-02-12'),
      status: 'Active'
    });

    // ThinkPad Sales Laptop allocation
    await Allocation.create({
      asset: carbonSales._id,
      holderType: 'Employee',
      holderId: userKyle._id,
      allocatedBy: assetManagerUser._id,
      allocatedDate: new Date('2025-08-15'),
      status: 'Active'
    });

    // Sony Smart TV allocation to department
    await Allocation.create({
      asset: tvSales._id,
      holderType: 'Department',
      holderId: salesDept._id,
      allocatedBy: adminUser._id,
      allocatedDate: new Date('2025-11-02'),
      status: 'Active'
    });
    console.log('✅ Allocations seeded.');

    // 7. Seed Maintenance Requests
    console.log('🌱 Seeding Maintenance Requests...');
    await MaintenanceRequest.create({
      asset: cameraAsset._id,
      raisedBy: employeeUser._id,
      issueDescription: 'Jammed optical lens ring and auto-focus failure during test shoots.',
      priority: 'High',
      status: 'In Progress',
      decisionBy: adminUser._id,
      decisionNotes: 'Approved for vendor calibration.',
      technicianName: 'Mike Miller Camera Repair',
      technicianContact: '555-091-2891'
    });

    await MaintenanceRequest.create({
      asset: carbonSales._id,
      raisedBy: userKyle._id,
      issueDescription: 'Battery life drains in under 45 minutes of standard browser usage. Needs replacement battery.',
      priority: 'Medium',
      status: 'Pending'
    });

    await MaintenanceRequest.create({
      asset: vanOps._id,
      raisedBy: userGrace._id,
      issueDescription: 'Brake pads squeaking heavily when stopping under payload.',
      priority: 'High',
      status: 'Resolved',
      decisionBy: adminUser._id,
      decisionNotes: 'Approved for direct pad swap.',
      technicianName: 'SF Fleet Auto Services',
      technicianContact: '555-901-2092',
      resolutionNotes: 'Brake pads replaced and brake fluid topped off.',
      resolvedAt: new Date()
    });
    console.log('🌱 Maintenance Requests seeded.');

    // 8. Seed Bookings
    console.log('🌱 Seeding Bookings...');
    const bookingStart = new Date();
    bookingStart.setDate(bookingStart.getDate() + 2); // Start: 2 days from now
    const bookingEnd = new Date();
    bookingEnd.setDate(bookingEnd.getDate() + 2);
    bookingEnd.setHours(bookingEnd.getHours() + 4); // End: +4 hours

    await Booking.create({
      resource: teslaAsset._id,
      bookedBy: managerUser._id,
      department: devDept._id,
      startTime: bookingStart,
      endTime: bookingEnd,
      purpose: 'Client pickup from Airport and transport to HQ.'
    });

    const vanStart = new Date();
    vanStart.setDate(vanStart.getDate() + 1);
    const vanEnd = new Date();
    vanEnd.setDate(vanEnd.getDate() + 1);
    vanEnd.setHours(vanEnd.getHours() + 6);

    await Booking.create({
      resource: vanOps._id,
      bookedBy: userGrace._id,
      department: opsDept._id,
      startTime: vanStart,
      endTime: vanEnd,
      purpose: 'Deliver newly purchased ergonomics desks to Oakland Office branch.'
    });
    console.log('✅ Bookings seeded.');

    // 9. Seed Audits
    console.log('🌱 Seeding Audits...');
    const auditCycle = await AuditCycle.create({
      name: 'Q3 2026 Annual Audit',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdBy: adminUser._id,
      assignedAuditors: [auditorUser._id],
      status: 'In Progress'
    });

    await AuditItem.create({
      auditCycle: auditCycle._id,
      asset: mbpAsset._id,
      assignedAuditor: auditorUser._id,
      status: 'Pending'
    });

    await AuditItem.create({
      auditCycle: auditCycle._id,
      asset: teslaAsset._id,
      assignedAuditor: auditorUser._id,
      status: 'Audited',
      verifiedCondition: 'Good',
      notes: 'Odometer and tires checked.'
    });
    console.log('✅ Audits seeded.');

    // 10. Seed Notifications
    console.log('🌱 Seeding Notifications...');
    await Notification.create({
      recipient: employeeUser._id,
      message: `Your MacBook Pro M3 Max (Tag: AF-0001) was expected back on ${overdueDate.toLocaleDateString()}. Please request a renewal or check-in.`,
      type: 'OverdueReturnAlert',
      relatedEntity: {
        entityType: 'Asset',
        entityId: mbpAsset._id
      },
      isRead: false
    });

    await Notification.create({
      recipient: adminUser._id,
      message: 'John Doe raised a High Priority maintenance request for Nikon Z8 DSLR Pro Camera.',
      type: 'MaintenanceApproved',
      relatedEntity: {
        entityType: 'Asset',
        entityId: cameraAsset._id
      },
      isRead: false
    });
    console.log('✅ Notifications seeded.');

    // 11. Seed Activity Logs
    console.log('🌱 Seeding Activity Logs...');
    await ActivityLog.create({
      actor: adminUser._id,
      action: 'Register Asset',
      entityType: 'Asset',
      entityId: mbpAsset._id,
      metadata: { details: 'Registered MacBook Pro 16" M3 Max (Tag: AF-0001) into stock.' }
    });

    await ActivityLog.create({
      actor: adminUser._id,
      action: 'Allocate Asset',
      entityType: 'Asset',
      entityId: mbpAsset._id,
      metadata: { details: 'Allocated MacBook Pro (AF-0001) to John Doe.' }
    });

    await ActivityLog.create({
      actor: employeeUser._id,
      action: 'Request Maintenance',
      entityType: 'Asset',
      entityId: cameraAsset._id,
      metadata: { details: 'Raised maintenance request for Nikon Z8 DSLR Pro Camera.' }
    });
    console.log('✅ Activity Logs seeded.');

    console.log('🏆 Database seeded successfully with premium test data!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seedDatabase();
