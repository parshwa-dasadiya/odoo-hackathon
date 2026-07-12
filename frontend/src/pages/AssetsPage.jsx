import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import Tabs from '../components/common/Tabs';
import Spinner from '../components/common/Spinner';
import { useNotification } from '../context/NotificationContext';
import { getAssets, saveAssets, getCategories, getDepartments, pushNotification, logActivity } from '../utils/mockDb';

export const AssetsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  // Component States
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [qrScanInput, setQrScanInput] = useState(''); // Text-simulated QR lookup

  // Slide-over Drawers state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [detailTab, setDetailTab] = useState('info');

  // Form states for Asset Registration
  const [registerStep, setRegisterStep] = useState(1);
  const [assetForm, setAssetForm] = useState({
    name: '',
    category: '',
    serialNumber: '',
    acquisitionDate: '',
    acquisitionCost: '',
    condition: 'New',
    location: '',
    shared: false,
    customFieldsData: {},
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Load Data
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setAssets(getAssets());
      const cats = getCategories();
      setCategories(cats);
      setDepartments(getDepartments());
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Compute auto-generated asset tag preview
  const getNextTag = () => {
    if (assets.length === 0) return 'AF-0001';
    const numbers = assets.map((a) => {
      const parts = a.tag.split('-');
      return parts.length > 1 ? parseInt(parts[1], 10) : 0;
    });
    const max = Math.max(...numbers, 0);
    return `AF-${String(max + 1).padStart(4, '0')}`;
  };

  // ----------------------------------------------------
  // ASSET REGISTRATION OPERATIONS
  // ----------------------------------------------------
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!assetForm.name.trim()) errors.name = 'Asset Name is required';
      if (!assetForm.category) errors.category = 'Category selection is required';
      if (!assetForm.serialNumber.trim()) errors.serialNumber = 'Serial Number is required';

      const isDupSerial = assets.some(
        (a) => a.serialNumber.toLowerCase() === assetForm.serialNumber.trim().toLowerCase()
      );
      if (isDupSerial) errors.serialNumber = 'An asset with this Serial Number is already registered';
    } else if (step === 2) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (assetForm.acquisitionDate && assetForm.acquisitionDate > todayStr) {
        errors.acquisitionDate = 'Acquisition date cannot be in the future';
      }
      if (assetForm.acquisitionCost && parseFloat(assetForm.acquisitionCost) < 0) {
        errors.acquisitionCost = 'Cost must be a positive number';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenRegister = () => {
    const defaultCat = categories[0]?.name || '';
    setAssetForm({
      name: '',
      category: defaultCat,
      serialNumber: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      acquisitionCost: '',
      condition: 'New',
      location: 'San Francisco HQ',
      shared: false,
      customFieldsData: {},
    });
    setRegisterStep(1);
    setUploadedFiles([]);
    setFormErrors({});
    setIsRegisterOpen(true);
  };

  // Drag and drop attachment helper
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesList = Array.from(e.dataTransfer.files);
      setUploadedFiles((prev) => [...prev, ...filesList]);
      showToast('info', `Added file: ${filesList[0].name}`);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const filesList = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...filesList]);
      showToast('info', `Added file: ${filesList[0].name}`);
    }
  };

  const handleRemoveFile = (idx) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!assetForm.name.trim()) errors.name = 'Asset Name is required';
    if (!assetForm.category) errors.category = 'Category selection is required';
    if (!assetForm.serialNumber.trim()) errors.serialNumber = 'Serial Number is required';

    // Unique Serial Check
    const isDupSerial = assets.some(
      (a) => a.serialNumber.toLowerCase() === assetForm.serialNumber.trim().toLowerCase()
    );
    if (isDupSerial) errors.serialNumber = 'An asset with this Serial Number is already registered';

    // Date can't be in the future
    const todayStr = new Date().toISOString().split('T')[0];
    if (assetForm.acquisitionDate && assetForm.acquisitionDate > todayStr) {
      errors.acquisitionDate = 'Acquisition date cannot be in the future';
    }

    // Cost must be positive
    if (assetForm.acquisitionCost && parseFloat(assetForm.acquisitionCost) < 0) {
      errors.acquisitionCost = 'Cost must be a positive number';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // TEMP: replace with real API call once backend is ready
    const newTag = getNextTag();
    const newAsset = {
      tag: newTag,
      name: assetForm.name,
      category: assetForm.category,
      serialNumber: assetForm.serialNumber,
      acquisitionDate: assetForm.acquisitionDate,
      acquisitionCost: parseFloat(assetForm.acquisitionCost) || 0,
      condition: assetForm.condition,
      location: assetForm.location,
      shared: assetForm.shared,
      status: 'Available',
      customFieldsData: assetForm.customFieldsData || {},
      history: [
        { id: String(Date.now()), type: 'System', detail: `Registered in inventory by Sarah Connor (Admin)`, date: todayStr }
      ],
      maintenance: []
    };

    const updated = [newAsset, ...assets];
    setAssets(updated);
    saveAssets(updated);
    
    // PUSH NOTIFICATION & LOG
    pushNotification(`New asset ${newTag} ("${assetForm.name}") registered in inventory.`, 'Asset Assigned');
    logActivity(user?.name || 'Sarah Connor', 'Register Asset', `${newTag} - ${assetForm.name}`);

    setIsRegisterOpen(false);
    showToast('success', `Asset ${newTag} ("${assetForm.name}") registered successfully.`);
  };

  // ----------------------------------------------------
  // ASSET DETAILS & LIFECYCLE TRANSITIONS
  // ----------------------------------------------------
  const handleOpenDetails = (asset) => {
    setSelectedAsset(asset);
    setDetailTab('info');
    setIsDetailOpen(true);
  };

  const handleAllocateShortcut = (asset) => {
    // Navigate to allocations and pre-fill route query
    showToast('info', `Deep-linking to Allocation workflows for ${asset.tag}...`);
    // Simulated allocate redirect
    handleOpenDetails(asset);
    setDetailTab('allocation');
  };

  // Lifecycle updates (Allocate, Return, Repair)
  const triggerLifecycleAction = (action) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let updatedStatus = selectedAsset.status;
    let detailMsg = '';
    let logType = 'System';

    if (action === 'allocate') {
      updatedStatus = 'Allocated';
      detailMsg = 'Allocated to John Connor (Sales & Marketing)';
      logType = 'Allocation';
    } else if (action === 'maintenance') {
      updatedStatus = 'Under Maintenance';
      detailMsg = 'Sent to Maintenance: visual check required';
      logType = 'Maintenance';
    } else if (action === 'return') {
      updatedStatus = 'Available';
      detailMsg = 'Returned to inventory stock location';
      logType = 'Return';
    } else if (action === 'resolve') {
      updatedStatus = 'Available';
      detailMsg = 'Returned to service from maintenance';
      logType = 'Return';
    }

    // TEMP: replace with real API call once backend is ready
    const newLog = {
      id: String(Date.now()),
      type: logType,
      detail: detailMsg,
      date: todayStr
    };

    const updatedAsset = {
      ...selectedAsset,
      status: updatedStatus,
      allocatedTo: action === 'allocate' ? 'John Connor' : undefined,
      department: action === 'allocate' ? 'Sales & Marketing' : undefined,
      history: [newLog, ...(selectedAsset.history || [])],
      maintenance: action === 'maintenance' 
        ? [{ id: String(Date.now()), type: 'Checkup', detail: 'General maintenance logs', date: todayStr, status: 'In Progress' }, ...(selectedAsset.maintenance || [])]
        : selectedAsset.maintenance
    };

    const updatedList = assets.map((a) => (a.tag === selectedAsset.tag ? updatedAsset : a));
    setAssets(updatedList);
    saveAssets(updatedList);
    setSelectedAsset(updatedAsset);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Asset ${selectedAsset.tag} status updated to ${updatedStatus} (${detailMsg}).`, action === 'allocate' ? 'Asset Assigned' : action === 'maintenance' ? 'Maintenance Approved' : 'Asset Returned');
    logActivity(user?.name || 'Sarah Connor', `${action.charAt(0).toUpperCase() + action.slice(1)} Asset`, selectedAsset.tag);

    showToast('success', `Asset status updated to ${updatedStatus}.`);
  };

  // Status color codes helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Allocated': return 'primary';
      case 'Reserved': return 'accent';
      case 'Under Maintenance': return 'warning';
      case 'Lost': return 'danger';
      default: return 'secondary';
    }
  };

  // ----------------------------------------------------
  // SEARCH / QR CODES & FILTER APPLICATIONS
  // ----------------------------------------------------
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterCategory('All');
    setFilterStatus('All');
    setFilterLocation('All');
    setFilterDept('All');
    setQrScanInput('');
  };

  const filteredAssets = assets.filter((a) => {
    // Real-time search string
    const matchText = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    // QR Code Simulator (Priority check: if exact tag is entered, filter exclusively to it)
    const matchQR = !qrScanInput.trim() || a.tag.toLowerCase() === qrScanInput.trim().toLowerCase();

    const matchCat = filterCategory === 'All' || a.category === filterCategory;
    const matchStatus = filterStatus === 'All' || a.status === filterStatus;
    const matchLocation = filterLocation === 'All' || a.location === filterLocation;
    const matchDept = filterDept === 'All' || a.department === filterDept;

    return matchText && matchQR && matchCat && matchStatus && matchLocation && matchDept;
  });

  // Unique locations from state
  const locations = Array.from(new Set(assets.map((a) => a.location))).filter(Boolean);

  // Pagination parameters
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE) || 1;
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up relative">
      
      {/* 1. Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 md:text-3xl">Asset Directory</h1>
          <p className="text-sm text-secondary-500 mt-1">Register, track, allocate, and review physical inventory assets.</p>
        </div>
        
        {/* Actions & Layout Toggles */}
        <div className="flex items-center gap-3">
          {/* Layout switches */}
          <div className="bg-white border border-secondary-200 p-0.5 rounded-lg flex shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-premium ${viewMode === 'table' ? 'bg-secondary-100 text-secondary-800' : 'text-secondary-400 hover:text-secondary-600'}`}
              title="Table View"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-premium ${viewMode === 'grid' ? 'bg-secondary-100 text-secondary-800' : 'text-secondary-400 hover:text-secondary-600'}`}
              title="Grid Cards View"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>

          <Button
            variant="primary"
            onClick={handleOpenRegister}
            icon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Register Asset
          </Button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <Card className="p-4 border border-secondary-200 bg-white shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Query search */}
          <div className="relative col-span-1 sm:col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search Tag, Serial, or Name..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-1.5 w-full bg-secondary-50 border border-secondary-200 rounded-lg text-sm text-secondary-750 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* QR Scan simulator */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-accent-500" title="Type to simulate a barcode/QR scan">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M4 8h16M4 16h16" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Scan QR Tag..."
              value={qrScanInput}
              onChange={(e) => { setQrScanInput(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-1.5 w-full bg-accent-50/20 border border-accent-200/50 rounded-lg text-sm text-accent-700 placeholder-accent-400/80 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
            />
          </div>

          <Select
            name="category"
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            options={[{ value: 'All', label: 'All Categories' }, ...categories.map((c) => ({ value: c.name, label: c.name }))]}
          />

          <Select
            name="status"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Available', label: 'Available' },
              { value: 'Allocated', label: 'Allocated' },
              { value: 'Under Maintenance', label: 'Under Maintenance' },
              { value: 'Reserved', label: 'Reserved' },
              { value: 'Lost', label: 'Lost' },
            ]}
          />

          <Select
            name="location"
            value={filterLocation}
            onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }}
            options={[{ value: 'All', label: 'All Locations' }, ...locations.map((loc) => ({ value: loc, label: loc }))]}
          />
        </div>

        {/* Clear filter shortcut */}
        {(searchQuery || filterCategory !== 'All' || filterStatus !== 'All' || filterLocation !== 'All' || qrScanInput) && (
          <div className="flex justify-end">
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-primary-600 hover:text-primary-750 transition-premium"
            >
              Clear Active Filters
            </button>
          </div>
        )}
      </Card>

      {/* 3. Directory Content Table / Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Spinner size="lg" />
          <p className="text-sm text-secondary-400 mt-2">Loading asset directory records...</p>
        </div>
      ) : paginatedAssets.length === 0 ? (
        <Card className="border border-secondary-200 p-12 text-center bg-white shadow-sm">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-secondary-100 text-secondary-400 flex items-center justify-center mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-secondary-900 mb-0.5">No Assets Found</h3>
            <p className="text-sm text-secondary-500 max-w-sm mb-4">No registered assets matched your active query filters.</p>
            <Button variant="secondary" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Table Mode */}
          {viewMode === 'table' && (
            <div className="hidden md:block">
              <Table
                keyField="tag"
                columns={[
                  { key: 'tag', header: 'Asset Tag', render: (row) => <span className="font-mono font-semibold text-secondary-800 cursor-pointer hover:text-primary-600" onClick={() => handleOpenDetails(row)}>{row.tag}</span> },
                  { key: 'name', header: 'Asset Name', render: (row) => <span className="font-semibold text-secondary-900 cursor-pointer hover:text-primary-600" onClick={() => handleOpenDetails(row)}>{row.name}</span> },
                  { key: 'category', header: 'Category' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row) => <Badge variant={getStatusColor(row.status)}>{row.status}</Badge>,
                  },
                  { key: 'location', header: 'Location' },
                  { key: 'department', header: 'Allocation Holder', render: (row) => row.allocatedTo ? `${row.allocatedTo} (${row.department})` : <span className="text-secondary-400 italic">In Stock</span> },
                  { key: 'condition', header: 'Condition' },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (row) => (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDetails(row)}>
                          Details
                        </Button>
                        {row.status === 'Available' && (
                          <Button variant="secondary" size="sm" onClick={() => handleAllocateShortcut(row)}>
                            Allocate
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ]}
                data={paginatedAssets}
              />
            </div>
          )}

          {/* Grid Mode & Mobile cards fallback */}
          <div className={`${viewMode === 'grid' ? 'grid' : 'hidden md:hidden'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`}>
            {paginatedAssets.map((asset) => (
              <div
                key={asset.tag}
                className="bg-white border border-secondary-200 rounded-xl p-5 hover:shadow-premium hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                onClick={() => handleOpenDetails(asset)}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono font-bold text-secondary-400 bg-secondary-50 border border-secondary-200 px-2 py-0.5 rounded-md">
                      {asset.tag}
                    </span>
                    <Badge variant={getStatusColor(asset.status)}>{asset.status}</Badge>
                  </div>

                  <h3 className="font-semibold text-secondary-900 hover:text-primary-600 transition-premium line-clamp-1 mb-1">
                    {asset.name}
                  </h3>
                  <p className="text-xs text-secondary-400 font-medium mb-4">{asset.category}</p>

                  <div className="space-y-1.5 text-xs text-secondary-600">
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Location:</span>
                      <span className="font-medium text-secondary-800">{asset.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Condition:</span>
                      <span className="font-medium text-secondary-800">{asset.condition}</span>
                    </div>
                    {asset.allocatedTo && (
                      <div className="flex justify-between">
                        <span className="text-secondary-400">Holder:</span>
                        <span className="font-medium text-secondary-800 line-clamp-1">{asset.allocatedTo}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-secondary-100 pt-3.5 mt-4 flex justify-between items-center">
                  <span className="text-xs text-secondary-450 font-medium">Cost: ${asset.acquisitionCost}</span>
                  <div className="flex gap-2">
                    {asset.status === 'Available' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAllocateShortcut(asset); }}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-750 px-2 py-1 rounded hover:bg-primary-50 transition-premium"
                      >
                        Allocate
                      </button>
                    )}
                    <span className="text-xs font-semibold text-secondary-500 hover:text-secondary-700">View</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 bg-white border border-secondary-200 rounded-xl shadow-sm text-xs">
              <span className="text-secondary-500">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SLIDE-OVER DRAWERS & OVERLAYS */}
      {/* ---------------------------------------------------- */}

      {/* Backdrop overlay for slide drawers */}
      {(isRegisterOpen || isDetailOpen) && (
        <div
          className="fixed inset-0 z-30 bg-secondary-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => { setIsRegisterOpen(false); setIsDetailOpen(false); }}
        />
      )}

      {/* Slide-over 1: Register Asset Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white shadow-popover flex flex-col transform transition-transform duration-300 ease-in-out border-l border-secondary-200 ${
          isRegisterOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-secondary-50">
          <div>
            <h2 className="text-base font-bold text-secondary-900">Register New Asset</h2>
            <p className="text-xs text-secondary-400 mt-0.5">Automated Tag: <span className="font-mono font-bold text-secondary-800">{getNextTag()}</span></p>
          </div>
          <button
            onClick={() => setIsRegisterOpen(false)}
            className="p-1 rounded-lg hover:bg-secondary-100 text-secondary-400 hover:text-secondary-600 transition-premium focus:outline-none"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-xs font-semibold text-secondary-500">
            <span className={`transition-all ${registerStep >= 1 ? 'text-primary-600 font-bold' : ''}`}>1. General Info</span>
            <span className={`transition-all ${registerStep >= 2 ? 'text-primary-600 font-bold' : ''}`}>2. Specs & Logistics</span>
            <span className={`transition-all ${registerStep >= 3 ? 'text-primary-600 font-bold' : ''}`}>3. Media & Policy</span>
          </div>
          <div className="w-full bg-secondary-100 h-1.5 rounded-full mt-2 relative overflow-hidden">
            <div 
              className="bg-primary-600 h-full rounded-full transition-all duration-300 ease-out" 
              style={{ width: registerStep === 1 ? '33%' : registerStep === 2 ? '66%' : '100%' }}
            />
          </div>
        </div>

        {/* Dynamic Live Preview Card */}
        <div className="mx-6 mt-4 p-4 bg-gradient-to-br from-secondary-900 to-secondary-850 rounded-xl text-white shadow-md relative overflow-hidden flex flex-col justify-between h-32 border border-secondary-800 animate-fade-in-up">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl"></div>
          <div className="absolute left-1/3 bottom-0 w-32 h-16 bg-accent-500/10 rounded-full blur-xl"></div>
          
          <div className="flex justify-between items-start z-10">
            <div>
              <span className="text-[9px] font-bold text-primary-400 uppercase tracking-widest block">Live Preview Card</span>
              <h4 className="font-bold text-base leading-tight mt-1 truncate max-w-[280px]">
                {assetForm.name || 'Untitled Asset'}
              </h4>
              <span className="text-[10px] font-medium text-secondary-400 block mt-0.5">
                {assetForm.category || 'Select Category'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-secondary-300 bg-white/5 px-2 py-0.5 border border-white/10 rounded-md">
              {getNextTag()}
            </span>
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-2 z-10">
            <div className="text-[10px] text-secondary-400">
              Condition: <span className="font-semibold text-white">{assetForm.condition}</span>
            </div>
            <div className="text-[10px] text-secondary-400 font-mono">
              S/N: <span className="font-semibold text-white">{assetForm.serialNumber || '—'}</span>
            </div>
          </div>
        </div>

        {/* Drawer Body */}
        <form onSubmit={handleRegisterSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Step 1: Basic Info */}
          {registerStep === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <h3 className="text-xs font-semibold text-secondary-400 uppercase tracking-wider border-b border-secondary-100 pb-2">
                Basic Information
              </h3>
              
              <Input
                label="Asset Name / Description"
                name="name"
                placeholder="e.g. Dell XPS Workstation"
                required
                value={assetForm.name}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, name: e.target.value }))}
                error={formErrors.name}
                touched={!!formErrors.name}
              />

              <Select
                label="Asset Category"
                name="category"
                required
                value={assetForm.category}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, category: e.target.value, customFieldsData: {} }))}
                error={formErrors.category}
                touched={!!formErrors.category}
                options={categories.map((c) => ({ value: c.name, label: c.name }))}
              />

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-secondary-700 tracking-wide uppercase select-none">
                    Serial Number <span className="text-danger-500">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const randomSerial = `SN-${(assetForm.category || 'AST').toUpperCase().slice(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`;
                      setAssetForm(prev => ({ ...prev, serialNumber: randomSerial }));
                      showToast('info', 'Auto-generated serial number.');
                    }}
                    className="text-[10px] font-semibold text-primary-600 hover:text-primary-750 transition-premium"
                  >
                    Auto-Generate
                  </button>
                </div>
                <Input
                  name="serialNumber"
                  placeholder="e.g. SN-DELL-8902B"
                  required
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm((prev) => ({ ...prev, serialNumber: e.target.value }))}
                  error={formErrors.serialNumber}
                  touched={!!formErrors.serialNumber}
                />
              </div>

              <Select
                label="Asset Condition Status"
                name="condition"
                value={assetForm.condition}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, condition: e.target.value }))}
                options={[
                  { value: 'New', label: 'New (Unopened/Unused)' },
                  { value: 'Good', label: 'Good (Working order)' },
                  { value: 'Fair', label: 'Fair (Minor wear)' },
                  { value: 'Poor', label: 'Poor (Degraded speed)' },
                  { value: 'Damaged', label: 'Damaged (Repair required)' },
                ]}
              />
            </div>
          )}

          {/* Step 2: Specs & Logistics */}
          {registerStep === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Dynamic Technical Specifications */}
              {(() => {
                const activeCategoryObj = categories.find((c) => c.name === assetForm.category);
                if (!activeCategoryObj || !activeCategoryObj.customFields || activeCategoryObj.customFields.length === 0) return null;
                return (
                  <div className="space-y-4 bg-secondary-50/50 border border-secondary-200/60 p-4 rounded-xl">
                    <h3 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider border-b border-secondary-200/50 pb-2">
                      Technical Specifications ({activeCategoryObj.name})
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {activeCategoryObj.customFields.map((field) => (
                        <Input
                          key={field.name}
                          label={field.name}
                          type={field.type === 'Number' ? 'number' : 'text'}
                          placeholder={`Enter ${field.name.toLowerCase()}...`}
                          value={assetForm.customFieldsData[field.name] || ''}
                          onChange={(e) => setAssetForm(prev => ({
                            ...prev,
                            customFieldsData: {
                              ...prev.customFieldsData,
                              [field.name]: e.target.value
                            }
                          }))}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-secondary-400 uppercase tracking-wider border-b border-secondary-100 pb-2">
                  Acquisition & Location
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Acquisition Date"
                    name="acquisitionDate"
                    type="date"
                    required
                    value={assetForm.acquisitionDate}
                    onChange={(e) => setAssetForm((prev) => ({ ...prev, acquisitionDate: e.target.value }))}
                    error={formErrors.acquisitionDate}
                    touched={!!formErrors.acquisitionDate}
                  />
                  <Input
                    label="Acquisition Cost ($)"
                    name="acquisitionCost"
                    type="number"
                    placeholder="3499"
                    value={assetForm.acquisitionCost}
                    onChange={(e) => setAssetForm((prev) => ({ ...prev, acquisitionCost: e.target.value }))}
                    error={formErrors.acquisitionCost}
                    touched={!!formErrors.acquisitionCost}
                  />
                </div>

                <Input
                  label="Default Storage Location"
                  name="location"
                  placeholder="e.g. SF HQ - Floor 3 Locker"
                  value={assetForm.location}
                  onChange={(e) => setAssetForm((prev) => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Step 3: Media & Policy */}
          {registerStep === 3 && (
            <div className="space-y-4 animate-fade-in-up">
              <h3 className="text-xs font-semibold text-secondary-400 uppercase tracking-wider border-b border-secondary-100 pb-2">
                Media & Handover Rules
              </h3>

              {/* Drag & Drop Area */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-secondary-750 uppercase">Photos & Documentation</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-premium cursor-pointer ${
                    dragActive 
                      ? 'border-primary-500 bg-primary-50/10' 
                      : 'border-secondary-200 hover:border-secondary-300 bg-secondary-50/20'
                  }`}
                >
                  <input
                    type="file"
                    id="asset-file-upload"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,application/pdf"
                  />
                  <label htmlFor="asset-file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                    <svg className="h-8 w-8 text-secondary-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs font-semibold text-primary-600 hover:text-primary-750">Upload a file</span>
                    <span className="text-[11px] text-secondary-400 mt-0.5">Drag and drop PDFs or Images here</span>
                  </label>
                </div>

                {/* Uploaded chips list */}
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary-100 border border-secondary-200 rounded-lg text-xs text-secondary-700">
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-secondary-400 hover:text-danger-600 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bookable resource toggle */}
              <div className="flex items-start justify-between p-3 rounded-lg border border-secondary-200 bg-secondary-50/20 mt-4">
                <div className="flex-1 mr-4">
                  <label htmlFor="shared-toggle" className="text-xs font-semibold text-secondary-800 block">
                    Shared / Bookable Resource
                  </label>
                  <span className="text-[11px] text-secondary-400 leading-normal block mt-0.5">
                    Check this switch to make the asset available in the Resource Booking module calendar.
                  </span>
                </div>
                <input
                  id="shared-toggle"
                  type="checkbox"
                  checked={assetForm.shared}
                  onChange={(e) => setAssetForm((prev) => ({ ...prev, shared: e.target.checked }))}
                  className="h-4.5 w-4.5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 cursor-pointer mt-1"
                />
              </div>
            </div>
          )}

        </form>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-secondary-200 bg-secondary-50 flex justify-between items-center gap-3">
          <Button variant="secondary" onClick={() => setIsRegisterOpen(false)}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {registerStep > 1 && (
              <Button variant="secondary" onClick={() => setRegisterStep(prev => prev - 1)}>
                Back
              </Button>
            )}
            
            {registerStep < 3 ? (
              <Button 
                variant="primary" 
                onClick={(e) => {
                  e.preventDefault();
                  if (validateStep(registerStep)) {
                    setRegisterStep(prev => prev + 1);
                  }
                }}
              >
                Next
              </Button>
            ) : (
              <Button variant="primary" onClick={handleRegisterSubmit}>
                Register Asset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over 2: Asset Details Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white shadow-popover flex flex-col transform transition-transform duration-300 ease-in-out border-l border-secondary-200 ${
          isDetailOpen && selectedAsset ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedAsset && (
          <>
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-secondary-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-secondary-400 bg-secondary-100 px-2 py-0.5 border border-secondary-200 rounded-md">
                    {selectedAsset.tag}
                  </span>
                  <Badge variant={getStatusColor(selectedAsset.status)}>{selectedAsset.status}</Badge>
                </div>
                <h2 className="text-base font-bold text-secondary-900 mt-1">{selectedAsset.name}</h2>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary-100 text-secondary-400 hover:text-secondary-600 transition-premium focus:outline-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Dynamic Contextual Action Buttons */}
            <div className="bg-white px-6 py-3.5 border-b border-secondary-100 flex gap-2.5">
              {selectedAsset.status === 'Available' && (
                <>
                  <Button variant="primary" size="sm" onClick={() => triggerLifecycleAction('allocate')}>
                    Allocate Asset
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => triggerLifecycleAction('maintenance')}>
                    Mark for Maintenance
                  </Button>
                </>
              )}

              {selectedAsset.status === 'Allocated' && (
                <>
                  <Button variant="primary" size="sm" onClick={() => showToast('info', 'Allocation Transfer requested.')}>
                    Request Transfer
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => triggerLifecycleAction('return')}>
                    Check In / Return
                  </Button>
                </>
              )}

              {selectedAsset.status === 'Under Maintenance' && (
                <Button variant="success" size="sm" onClick={() => triggerLifecycleAction('resolve')}>
                  Return to Service
                </Button>
              )}

              {['Lost', 'Retired', 'Disposed'].includes(selectedAsset.status) && (
                <div className="text-xs text-secondary-500 font-medium italic py-1 flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  This asset is set to {selectedAsset.status} and cannot receive handovers.
                </div>
              )}
            </div>

            {/* Sub-tabs selection */}
            <div className="px-6 border-b border-secondary-100">
              <nav className="-mb-px flex space-x-6">
                <button
                  onClick={() => setDetailTab('info')}
                  className={`py-3.5 border-b-2 font-medium text-xs uppercase tracking-wider transition-premium ${
                    detailTab === 'info' ? 'border-primary-600 text-primary-600 font-semibold' : 'border-transparent text-secondary-400 hover:text-secondary-750'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setDetailTab('allocation')}
                  className={`py-3.5 border-b-2 font-medium text-xs uppercase tracking-wider transition-premium ${
                    detailTab === 'allocation' ? 'border-primary-600 text-primary-600 font-semibold' : 'border-transparent text-secondary-400 hover:text-secondary-750'
                  }`}
                >
                  Allocation History
                </button>
                <button
                  onClick={() => setDetailTab('maintenance')}
                  className={`py-3.5 border-b-2 font-medium text-xs uppercase tracking-wider transition-premium ${
                    detailTab === 'maintenance' ? 'border-primary-600 text-primary-600 font-semibold' : 'border-transparent text-secondary-400 hover:text-secondary-750'
                  }`}
                >
                  Maintenance logs
                </button>
              </nav>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Tab 1: Info */}
              {detailTab === 'info' && (
                <div className="space-y-6 text-sm text-secondary-650">
                  
                  {/* Sourced fields list */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-secondary-200 bg-secondary-50/20">
                    <div>
                      <span className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide">Category</span>
                      <p className="font-semibold text-secondary-800 mt-0.5">{selectedAsset.category}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide">Serial Number</span>
                      <p className="font-mono font-semibold text-secondary-800 mt-0.5">{selectedAsset.serialNumber}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide">Location</span>
                      <p className="font-semibold text-secondary-800 mt-0.5">{selectedAsset.location || 'SF Warehouse'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide">Condition</span>
                      <p className="font-semibold text-secondary-800 mt-0.5">{selectedAsset.condition}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide">Acquisition Date</span>
                      <p className="font-semibold text-secondary-800 mt-0.5">{selectedAsset.acquisitionDate || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide">Acquisition Cost</span>
                      <p className="font-semibold text-secondary-800 mt-0.5">${selectedAsset.acquisitionCost || '0'}</p>
                    </div>
                  </div>

                  {/* Custom Specifications Display */}
                  {selectedAsset.customFieldsData && Object.keys(selectedAsset.customFieldsData).length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide block">Technical Specifications</span>
                      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-secondary-200 bg-secondary-50/20">
                        {Object.entries(selectedAsset.customFieldsData).map(([key, val]) => (
                          <div key={key}>
                            <span className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide">{key}</span>
                            <p className="font-semibold text-secondary-800 mt-0.5">{val || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photo attachments placeholder gallery */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide block">Media Galleries</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="aspect-square border border-secondary-200 rounded-lg bg-secondary-50/30 flex items-center justify-center text-center text-xs text-secondary-400 p-2 cursor-pointer hover:border-secondary-300 transition-premium">
                        <div>
                          <svg className="h-6 w-6 mx-auto text-secondary-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Primary Image
                        </div>
                      </div>
                      <div className="aspect-square border border-secondary-200 rounded-lg bg-secondary-50/30 flex items-center justify-center text-center text-xs text-secondary-400 p-2 cursor-pointer hover:border-secondary-300 transition-premium">
                        <div>
                          <svg className="h-6 w-6 mx-auto text-secondary-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Invoice.pdf
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Allocation History */}
              {detailTab === 'allocation' && (
                <div className="space-y-4">
                  {/* Render Allocation Timeline */}
                  {(!selectedAsset.history || selectedAsset.history.length === 0) ? (
                    <div className="text-center py-8 text-secondary-450 italic text-xs">No allocations recorded yet.</div>
                  ) : (
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {selectedAsset.history.map((log, idx) => (
                          <li key={log.id || idx}>
                            <div className="relative pb-8">
                              {idx !== selectedAsset.history.length - 1 && (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-secondary-200" aria-hidden="true" />
                              )}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                    log.type === 'Allocation' ? 'bg-primary-50 text-primary-600' : 'bg-secondary-100 text-secondary-650'
                                  }`}>
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <p className="text-xs text-secondary-650 font-medium">{log.detail}</p>
                                  </div>
                                  <div className="text-right text-[10px] whitespace-nowrap text-secondary-400 font-semibold font-mono">
                                    {log.date}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Maintenance History */}
              {detailTab === 'maintenance' && (
                <div className="space-y-4">
                  {(!selectedAsset.maintenance || selectedAsset.maintenance.length === 0) ? (
                    <div className="text-center py-8 text-secondary-450 italic text-xs">No maintenance reports recorded.</div>
                  ) : (
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {selectedAsset.maintenance.map((maint, idx) => (
                          <li key={maint.id || idx}>
                            <div className="relative pb-8">
                              {idx !== selectedAsset.maintenance.length - 1 && (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-secondary-200" aria-hidden="true" />
                              )}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-warning-50 text-warning-600 flex items-center justify-center ring-8 ring-white">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    </svg>
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <p className="text-xs text-secondary-650 font-medium">{maint.detail}</p>
                                    <div className="mt-1 flex items-center gap-1.5">
                                      <span className="text-[10px] text-secondary-400">Status:</span>
                                      <span className="text-[10px] text-warning-700 font-semibold">{maint.status}</span>
                                    </div>
                                  </div>
                                  <div className="text-right text-[10px] whitespace-nowrap text-secondary-400 font-semibold font-mono">
                                    {maint.date}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default AssetsPage;
