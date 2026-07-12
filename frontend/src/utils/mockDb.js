// Sourced from localStorage or default values
const STORAGE_KEYS = {
  DEPARTMENTS: 'assetflow_departments',
  CATEGORIES: 'assetflow_categories',
  EMPLOYEES: 'assetflow_employees',
  ASSETS: 'assetflow_assets',
  BOOKINGS: 'assetflow_bookings',
  TRANSFERS: 'assetflow_transfers',
  MAINTENANCE: 'assetflow_maintenance',
  AUDITS: 'assetflow_audits',
  NOTIFICATIONS: 'assetflow_notifications',
  ACTIVITY_LOGS: 'assetflow_activity_logs',
};

const defaultDepartments = [
  { id: '1', name: 'Engineering', head: 'Sarah Connor', parentId: '', parentName: '', status: 'Active' },
  { id: '2', name: 'Backend Development', head: 'Kyle Reese', parentId: '1', parentName: 'Engineering', status: 'Active' },
  { id: '3', name: 'Sales & Marketing', head: 'John Connor', parentId: '', parentName: '', status: 'Active' },
  { id: '4', name: 'Finance & Operations', head: 'John Doe', parentId: '', parentName: '', status: 'Active' },
];

const defaultCategories = [
  { id: '1', name: 'Laptops', description: 'Enterprise developer and management workstations', customFields: [{ name: 'Processor', type: 'Text' }, { name: 'RAM (GB)', type: 'Number' }, { name: 'Storage (GB)', type: 'Number' }] },
  { id: '2', name: 'Vehicles', description: 'Shared fleet cars, delivery vans, and shuttle vehicles', customFields: [{ name: 'License Plate', type: 'Text' }, { name: 'Fuel Type', type: 'Text' }] },
  { id: '3', name: 'AV Equipment', description: 'Meeting room video bars, microphones, cameras, and TV panels', customFields: [{ name: 'Resolution', type: 'Text' }, { name: 'Interface', type: 'Text' }] },
  { id: '4', name: 'Office Furniture', description: 'Ergonomic chairs, sit-stand desks, and conference tables', customFields: [] },
  { id: '5', name: 'Mobile Devices', description: 'Enterprise smartphones and tablet devices', customFields: [{ name: 'OS', type: 'Text' }, { name: 'Model Year', type: 'Number' }] },
  { id: '6', name: 'Network Hardware', description: 'Routers, switches, load balancers, and access points', customFields: [{ name: 'IP Address', type: 'Text' }, { name: 'Port Count', type: 'Number' }] }
];

const defaultEmployees = [
  { id: '1', name: 'Sarah Connor', email: 's.connor@assetflow.com', department: 'Engineering', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Kyle Reese', email: 'k.reese@assetflow.com', department: 'Backend Development', role: 'Asset Manager', status: 'Active' },
  { id: '3', name: 'John Connor', email: 'j.connor@assetflow.com', department: 'Sales & Marketing', role: 'Department Head', status: 'Active' },
  { id: '4', name: 'Alice Cooper', email: 'a.cooper@assetflow.com', department: 'Sales & Marketing', role: 'Employee', status: 'Active' },
  { id: '5', name: 'John Doe', email: 'j.doe@assetflow.com', department: 'Finance & Operations', role: 'Auditor', status: 'Active' },
  { id: '6', name: 'Marcus Wright', email: 'm.wright@assetflow.com', department: 'Engineering', role: 'Employee', status: 'Active' },
];

const defaultAssets = [
  { 
    tag: 'AF-0001', 
    name: 'MacBook Pro 16" M3 Max', 
    category: 'Laptops', 
    serialNumber: 'SN-MBP-9081', 
    acquisitionDate: '2026-01-10', 
    acquisitionCost: 3499, 
    condition: 'New', 
    location: 'San Francisco HQ', 
    shared: false, 
    status: 'Allocated', 
    allocatedTo: 'Sarah Connor', 
    department: 'Engineering', 
    expectedReturnDate: '2026-07-10', 
    customFieldsData: { 'Processor': 'Apple M3 Max', 'RAM (GB)': '64', 'Storage (GB)': '2048' },
    history: [
      { id: 'h1', type: 'Allocation', detail: 'Allocated to Sarah Connor (Engineering)', date: '2026-01-12' },
      { id: 'h2', type: 'System', detail: 'Asset record created in inventory database', date: '2026-01-10' }
    ], 
    maintenance: [] 
  },
  { 
    tag: 'AF-0002', 
    name: 'Tesla Model Y', 
    category: 'Vehicles', 
    serialNumber: 'SN-TSLA-0091', 
    acquisitionDate: '2025-06-15', 
    acquisitionCost: 45000, 
    condition: 'Good', 
    location: 'Oakland Fleet Depo', 
    shared: true, 
    status: 'Available', 
    customFieldsData: { 'License Plate': 'CA-9812A', 'Fuel Type': 'Electric' },
    history: [
      { id: 'h3', type: 'Return', detail: 'Returned to Oakland Fleet Depo by Kyle Reese', date: '2026-07-11' },
      { id: 'h4', type: 'Allocation', detail: 'Allocated to Kyle Reese (Backend Development)', date: '2026-07-01' }
    ], 
    maintenance: [] 
  },
  { 
    tag: 'AF-0003', 
    name: 'Nikon Z8 DSLR Camera', 
    category: 'AV Equipment', 
    serialNumber: 'SN-NKN-1082', 
    acquisitionDate: '2026-02-20', 
    acquisitionCost: 3999, 
    condition: 'Good', 
    location: 'San Francisco HQ', 
    shared: true, 
    status: 'Under Maintenance', 
    customFieldsData: { 'Resolution': '45.7 MP', 'Interface': 'USB-C / HDMI' },
    history: [
      { id: 'h5', type: 'Maintenance', detail: 'Sent to maintenance: sensor cleaning needed', date: '2026-07-08' }
    ], 
    maintenance: [
      { id: 'm1', type: 'Repair', detail: 'Sensor cleaning and lens alignment', date: '2026-07-08', status: 'In Progress' }
    ] 
  },
  { 
    tag: 'AF-0004', 
    name: 'Poly Studio Conference Bar', 
    category: 'AV Equipment', 
    serialNumber: 'SN-POLY-8219', 
    acquisitionDate: '2026-03-01', 
    acquisitionCost: 1299, 
    condition: 'New', 
    location: 'San Francisco HQ - Conf Room 3B', 
    shared: true, 
    status: 'Reserved', 
    customFieldsData: { 'Resolution': '4K UHD', 'Interface': 'USB / Bluetooth' },
    history: [
      { id: 'h6', type: 'System', detail: 'Registered in inventory by Jane Smith', date: '2026-03-01' }
    ], 
    maintenance: [] 
  },
  { 
    tag: 'AF-0005', 
    name: 'Herman Miller Aeron Chair', 
    category: 'Office Furniture', 
    serialNumber: 'SN-HMA-2981', 
    acquisitionDate: '2025-11-20', 
    acquisitionCost: 1450, 
    condition: 'Good', 
    location: 'SF Office - Floor 2', 
    shared: false, 
    status: 'Available', 
    customFieldsData: {},
    history: [
      { id: 'h7', type: 'System', detail: 'Registered in inventory by Jane Smith', date: '2025-11-20' }
    ], 
    maintenance: [] 
  },
  {
    tag: 'AF-0006',
    name: 'iPhone 15 Pro Max Testbed',
    category: 'Mobile Devices',
    serialNumber: 'SN-MBL-8801',
    acquisitionDate: '2026-01-20',
    acquisitionCost: 1199,
    condition: 'New',
    location: 'SF HQ - Mobile Testing Lab',
    shared: false,
    status: 'Allocated',
    customFieldsData: { 'OS': 'iOS 17', 'Model Year': 2024 },
    history: [
      { id: 'h8', type: 'System', detail: 'Registered in inventory by Jane Smith', date: '2026-01-20' }
    ],
    maintenance: []
  },
  {
    tag: 'AF-0007',
    name: 'ThinkPad P1 Gen 6 Workstation',
    category: 'Laptops',
    serialNumber: 'SN-DEV-7019',
    acquisitionDate: '2026-03-01',
    acquisitionCost: 2999,
    condition: 'New',
    location: 'Oakland HQ',
    shared: false,
    status: 'Allocated',
    customFieldsData: { 'Processor': 'Intel Core i9', 'RAM (GB)': 64, 'Storage (GB)': 1024 },
    history: [
      { id: 'h9', type: 'System', detail: 'Registered in inventory by Jane Smith', date: '2026-03-01' }
    ],
    maintenance: []
  },
  {
    tag: 'AF-0008',
    name: 'Cisco Catalyst Switch 24P',
    category: 'Network Hardware',
    serialNumber: 'SN-NET-4029',
    acquisitionDate: '2025-10-01',
    acquisitionCost: 2499,
    condition: 'Good',
    location: 'Server Room 1B',
    shared: false,
    status: 'Available',
    customFieldsData: { 'IP Address': '192.168.10.12', 'Port Count': 24 },
    history: [
      { id: 'h10', type: 'System', detail: 'Registered in inventory by Jane Smith', date: '2025-10-01' }
    ],
    maintenance: []
  },
  {
    tag: 'AF-0009',
    name: 'Ford Transit Delivery Van',
    category: 'Vehicles',
    serialNumber: 'SN-VAN-3091',
    acquisitionDate: '2024-05-18',
    acquisitionCost: 35000,
    condition: 'Fair',
    location: 'SF HQ - Loading Bay',
    shared: true,
    status: 'Available',
    customFieldsData: { 'License Plate': 'CA-4491X', 'Fuel Type': 'Diesel' },
    history: [
      { id: 'h11', type: 'System', detail: 'Registered in inventory by Jane Smith', date: '2024-05-18' }
    ],
    maintenance: []
  }
];

const defaultBookings = [
  {
    id: 'b1',
    assetTag: 'AF-0002',
    user: 'Kyle Reese',
    email: 'k.reese@assetflow.com',
    date: '2026-07-12',
    startTime: '08:00',
    endTime: '10:00',
    status: 'Completed',
    purpose: 'Site visit in Oakland'
  },
  {
    id: 'b2',
    assetTag: 'AF-0002',
    user: 'Sarah Connor',
    email: 's.connor@assetflow.com',
    date: '2026-07-12',
    startTime: '10:00',
    endTime: '13:00',
    status: 'Ongoing',
    purpose: 'Hardware shipping pickup'
  },
  {
    id: 'b3',
    assetTag: 'AF-0002',
    user: 'Alice Cooper',
    email: 'a.cooper@assetflow.com',
    date: '2026-07-13',
    startTime: '14:00',
    endTime: '17:00',
    status: 'Upcoming',
    purpose: 'Marketing field photo session'
  }
];

const defaultTransfers = [
  {
    id: 't1',
    assetTag: 'AF-0001',
    assetName: 'MacBook Pro 16" M3 Max',
    requester: 'John Connor',
    department: 'Sales & Marketing',
    currentHolder: 'Sarah Connor',
    status: 'Pending',
    reason: 'Compiling sales forecast models for Q3 presentation',
    date: '2026-07-12'
  }
];

const defaultMaintenance = [
  {
    id: 'm1',
    assetTag: 'AF-0001',
    assetName: 'MacBook Pro 16" M3 Max',
    requester: 'Sarah Connor',
    email: 's.connor@assetflow.com',
    priority: 'High',
    status: 'Pending',
    description: 'Screen flickering occasionally when running heavy GPU compile tasks.',
    technician: '',
    techContact: '',
    date: '2026-07-11',
    resolutionNotes: ''
  },
  {
    id: 'm2',
    assetTag: 'AF-0003',
    assetName: 'Nikon Z8 DSLR Camera',
    requester: 'Kyle Reese',
    email: 'k.reese@assetflow.com',
    priority: 'Critical',
    status: 'In Progress',
    description: 'Autofocus failure. Lens struggles to lock in low light scenarios.',
    technician: 'David Miller (Support)',
    techContact: 'd.miller@support.com',
    date: '2026-07-08',
    resolutionNotes: ''
  }
];

const defaultAudits = [
  {
    id: 'au1',
    name: 'Q3 SF Headquarters Inventory Check',
    startDate: '2026-07-12',
    endDate: '2026-07-18',
    scopeDept: 'All',
    scopeLoc: 'San Francisco HQ',
    status: 'In Progress',
    auditors: ['John Doe'],
    results: {
      'AF-0001': { status: 'Verified', note: 'Checked in Engineering bay, fully working.', date: '2026-07-12' }
    }
  }
];

const defaultNotifications = [
  {
    id: 'n1',
    type: 'Asset Assigned',
    message: 'MacBook Pro (AF-0001) has been allocated to Sarah Connor.',
    date: '2026-07-12T09:00:00.000Z',
    read: false,
  },
  {
    id: 'n2',
    type: 'Maintenance Approved',
    message: 'Maintenance request approved for Nikon Z8 DSLR Camera (AF-0003). Technician: David Miller.',
    date: '2026-07-11T14:30:00.000Z',
    read: true,
  },
  {
    id: 'n3',
    type: 'Booking Confirmed',
    message: 'Booking confirmed for Tesla Model Y (AF-0002) at 10:00 - 13:00.',
    date: '2026-07-12T08:00:00.000Z',
    read: true,
  }
];

const defaultActivityLogs = [
  {
    id: 'l1',
    actor: 'Sarah Connor',
    action: 'Allocate Asset',
    entity: 'MacBook Pro (AF-0001)',
    date: '2026-07-12T09:00:00.000Z',
  },
  {
    id: 'l2',
    actor: 'Kyle Reese',
    action: 'Approve Maintenance',
    entity: 'Nikon Z8 DSLR Camera (AF-0003)',
    date: '2026-07-11T14:30:00.000Z',
  },
  {
    id: 'l3',
    actor: 'Sarah Connor',
    action: 'Book Resource',
    entity: 'Tesla Model Y (AF-0002)',
    date: '2026-07-12T08:00:00.000Z',
  }
];

const initializeDb = () => {
  if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(defaultDepartments));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCategories));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(defaultEmployees));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ASSETS)) {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(defaultAssets));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(defaultBookings));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRANSFERS)) {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(defaultTransfers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MAINTENANCE)) {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(defaultMaintenance));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDITS)) {
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(defaultAudits));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(defaultNotifications));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(defaultActivityLogs));
  }
};

initializeDb();

export const getDepartments = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) || [];
export const saveDepartments = (deps) => localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(deps));

export const getCategories = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || [];
export const saveCategories = (cats) => localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));

export const getEmployees = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) || [];
export const saveEmployees = (emps) => localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(emps));

export const getAssets = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSETS)) || [];
export const saveAssets = (assets) => localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));

export const getBookings = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS)) || [];
export const saveBookings = (bks) => localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bks));

export const getTransfers = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSFERS)) || [];
export const saveTransfers = (trsf) => localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(trsf));

export const getMaintenance = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.MAINTENANCE)) || [];
export const saveMaintenance = (maint) => localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maint));

export const getAudits = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDITS)) || [];
export const saveAudits = (audits) => localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(audits));

export const getNotifications = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
export const saveNotifications = (notifs) => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  window.dispatchEvent(new Event('assetflow-notifications-updated'));
};

export const getActivityLogs = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) || [];
export const saveActivityLogs = (logs) => {
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
  window.dispatchEvent(new Event('assetflow-activity-logs-updated'));
};

// PUSH HELPERS FOR TRANSIT TRAILS
export const pushNotification = (message, type) => {
  const notifs = getNotifications();
  const newNotif = {
    id: String(Date.now() + Math.random()),
    type, // 'Asset Assigned', 'Maintenance Approved', 'Booking Confirmed', etc.
    message,
    date: new Date().toISOString(),
    read: false,
  };
  const updated = [newNotif, ...notifs];
  saveNotifications(updated);
  return newNotif;
};

export const logActivity = (actor, action, entity) => {
  const logs = getActivityLogs();
  const newLog = {
    id: String(Date.now() + Math.random()),
    actor,
    action, // 'Register Asset', 'Allocate', 'Approve Transfer', etc.
    entity,
    date: new Date().toISOString(),
  };
  const updated = [newLog, ...logs];
  saveActivityLogs(updated);
  return newLog;
};

export default {
  getDepartments,
  saveDepartments,
  getCategories,
  saveCategories,
  getEmployees,
  saveEmployees,
  getAssets,
  saveAssets,
  getBookings,
  saveBookings,
  getTransfers,
  saveTransfers,
  getMaintenance,
  saveMaintenance,
  getAudits,
  saveAudits,
  getNotifications,
  saveNotifications,
  getActivityLogs,
  saveActivityLogs,
  pushNotification,
  logActivity,
};
