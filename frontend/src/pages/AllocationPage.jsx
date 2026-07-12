import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import Tabs from '../components/common/Tabs';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import { useNotification } from '../context/NotificationContext';
import {
  getAssets,
  saveAssets,
  getEmployees,
  getDepartments,
  getTransfers,
  saveTransfers,
  pushNotification,
  logActivity,
} from '../utils/mockDb';
import { ROLES } from '../utils/constants';

export const AllocationPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const userRole = user?.role || 'Employee';
  const isAdminOrManager = [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(userRole);

  const [activeTab, setActiveTab] = useState('allocate');
  const [isLoading, setIsLoading] = useState(false);

  // Database states
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [transfers, setTransfers] = useState([]);

  // Form states
  const [selectedAssetTag, setSelectedAssetTag] = useState('');
  const [allocationMode, setAllocationMode] = useState('employee'); // 'employee' or 'department'
  const [targetName, setTargetName] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // Return asset drawer controls
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnAsset, setReturnAsset] = useState(null);

  // Load Database
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setAssets(getAssets());
      setEmployees(getEmployees());
      setDepartments(getDepartments());
      setTransfers(getTransfers());
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Sync select asset default value on load
  useEffect(() => {
    if (assets.length > 0 && !selectedAssetTag) {
      setSelectedAssetTag(assets[0].tag);
    }
  }, [assets, selectedAssetTag]);

  const selectedAsset = assets.find((a) => a.tag === selectedAssetTag);

  // ----------------------------------------------------
  // HANDLERS: ALLOCATIONS
  // ----------------------------------------------------
  const handleAllocateSubmit = (e) => {
    e.preventDefault();
    if (!selectedAsset) return;

    if (selectedAsset.status === 'Allocated') {
      showToast('error', 'Cannot double-allocate this asset in the UI.');
      return;
    }

    const errors = {};
    if (!targetName) errors.targetName = 'Recipient target is required';

    const todayStr = new Date().toISOString().split('T')[0];
    if (expectedReturnDate && expectedReturnDate < todayStr) {
      errors.expectedReturnDate = 'Expected return date cannot be in the past';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // TEMP: replace with real API call once backend is ready
    const isDept = allocationMode === 'department';
    const logText = isDept 
      ? `Allocated to Department: ${targetName}` 
      : `Allocated to Employee: ${targetName}`;

    const newHistory = {
      id: String(Date.now()),
      type: 'Allocation',
      detail: `${logText} (Notes: ${notes || 'none'})`,
      date: todayStr,
    };

    const updatedAsset = {
      ...selectedAsset,
      status: 'Allocated',
      allocatedTo: isDept ? undefined : targetName,
      department: isDept ? targetName : undefined,
      expectedReturnDate: expectedReturnDate || undefined,
      history: [newHistory, ...(selectedAsset.history || [])],
    };

    setAssets(updatedAssets);
    saveAssets(updatedAssets);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Asset ${selectedAsset.tag} allocated to ${targetName}.`, 'Asset Assigned');
    logActivity(user?.name || 'Sarah Connor', 'Allocate Asset', `${selectedAsset.tag} -> ${targetName}`);

    // Reset Form
    setTargetName('');
    setExpectedReturnDate('');
    setNotes('');
    setFormErrors({});
    showToast('success', `Asset ${selectedAsset.tag} allocated successfully.`);
  };

  // Open Transfer Modal
  const handleOpenTransferRequest = () => {
    setTransferReason('');
    setIsTransferModalOpen(true);
  };

  const handleTransferRequestSubmit = (e) => {
    e.preventDefault();
    if (!transferReason.trim()) {
      showToast('warning', 'Please explain the reason for the transfer.');
      return;
    }

    // TEMP: replace with real API call once backend is ready
    const currentHolder = selectedAsset.allocatedTo || selectedAsset.department || 'Unknown';
    const newRequest = {
      id: String(Date.now()),
      assetTag: selectedAsset.tag,
      assetName: selectedAsset.name,
      requester: user?.name || 'Sarah Connor',
      department: user?.department || 'Engineering',
      currentHolder,
      status: 'Pending',
      reason: transferReason,
      date: new Date().toISOString().split('T')[0],
    };

    const updatedTransfers = [newRequest, ...transfers];
    setTransfers(updatedTransfers);
    saveTransfers(updatedTransfers);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Transfer request submitted for ${selectedAsset.tag} by ${user?.name || 'Sarah Connor'} (Current: ${currentHolder}).`, 'Transfer Requested');
    logActivity(user?.name || 'Sarah Connor', 'Request Transfer', selectedAsset.tag);

    setIsTransferModalOpen(false);
    showToast('success', `Transfer request submitted for ${selectedAsset.tag}.`);
  };

  // ----------------------------------------------------
  // HANDLERS: TRANSFER STEPS (APPROVE / REJECT)
  // ----------------------------------------------------
  const handleApproveTransfer = (request) => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Find the target asset
    const assetToTransfer = assets.find((a) => a.tag === request.assetTag);
    if (!assetToTransfer) {
      showToast('error', 'Asset not found in database.');
      return;
    }

    // TEMP: replace with real API call once backend is ready (atomically update asset & request)
    const newHistory = {
      id: String(Date.now()),
      type: 'Transfer',
      detail: `Transfer Approved: Transferred from ${request.currentHolder} to ${request.requester} (${request.department})`,
      date: todayStr,
    };

    const updatedAsset = {
      ...assetToTransfer,
      status: 'Allocated',
      allocatedTo: request.requester,
      department: request.department,
      expectedReturnDate: undefined, // Reset return date
      history: [newHistory, ...(assetToTransfer.history || [])],
    };

    const updatedAssets = assets.map((a) => (a.tag === assetToTransfer.tag ? updatedAsset : a));
    setAssets(updatedAssets);
    saveAssets(updatedAssets);

    const updatedRequests = transfers.map((t) =>
      t.id === request.id ? { ...t, status: 'Approved' } : t
    );
    setTransfers(updatedRequests);
    saveTransfers(updatedRequests);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Transfer approved for ${request.assetTag}. Transferred from ${request.currentHolder} to ${request.requester}.`, 'Transfer Approved');
    logActivity(user?.name || 'Sarah Connor', 'Approve Transfer', request.assetTag);

    showToast('success', `Transfer request approved. Asset ${request.assetTag} reassigned.`);
  };

  const handleOpenReject = (request) => {
    setSelectedTransfer(request);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      showToast('warning', 'Please write a reason for rejection.');
      return;
    }

    // TEMP: replace with real API call once backend is ready
    const updatedRequests = transfers.map((t) =>
      t.id === selectedTransfer.id
        ? { ...t, status: 'Rejected', rejectReason: rejectReason }
        : t
    );
    setTransfers(updatedRequests);
    saveTransfers(updatedRequests);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Transfer request for ${selectedTransfer.assetTag} was rejected.`, 'Transfer Rejected');
    logActivity(user?.name || 'Sarah Connor', 'Reject Transfer', selectedTransfer.assetTag);

    setIsRejectModalOpen(false);
    showToast('warning', `Transfer request for ${selectedTransfer.assetTag} rejected.`);
  };

  // ----------------------------------------------------
  // HANDLERS: RETURN LOGS
  // ----------------------------------------------------
  const handleOpenReturnDrawer = (asset) => {
    setReturnAsset(asset);
    setReturnNotes('');
    setReturnCondition(asset.condition || 'Good');
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];

    // TEMP: replace with real API call once backend is ready
    const newHistory = {
      id: String(Date.now()),
      type: 'Return',
      detail: `Returned to inventory stock. Check-in Condition: ${returnCondition}. Notes: ${returnNotes || 'none'}`,
      date: todayStr,
    };

    const updatedAsset = {
      ...returnAsset,
      status: 'Available',
      allocatedTo: undefined,
      department: undefined,
      expectedReturnDate: undefined,
      condition: returnCondition,
      history: [newHistory, ...(returnAsset.history || [])],
    };

    const updatedAssets = assets.map((a) => (a.tag === returnAsset.tag ? updatedAsset : a));
    setAssets(updatedAssets);
    saveAssets(updatedAssets);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Asset ${returnAsset.tag} checked in and returned to stock location.`, 'Asset Returned');
    logActivity(user?.name || 'Sarah Connor', 'Return Asset', returnAsset.tag);

    setIsReturnModalOpen(false);
    showToast('success', `Asset ${returnAsset.tag} checked in successfully.`);
  };

  // ----------------------------------------------------
  // DERIVED DATA: OVERDUE ALLOCATIONS
  // ----------------------------------------------------
  const today = new Date().toISOString().split('T')[0];
  const overdueAllocations = assets.filter(
    (a) => a.status === 'Allocated' && a.expectedReturnDate && a.expectedReturnDate < today
  );

  const handleSendReminder = (asset) => {
    const holder = asset.allocatedTo || asset.department || 'Recipient';
    
    // PUSH NOTIFICATION & LOG
    pushNotification(`Overdue return alert notification sent to ${holder} regarding asset ${asset.tag}.`, 'Overdue Return Alert');
    logActivity(user?.name || 'Sarah Connor', 'Send Overdue Reminder', asset.tag);

    showToast('success', `Reminder alert sent to ${holder} regarding overdue asset ${asset.tag}.`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 md:text-3xl">Asset Allocations & Handovers</h1>
        <p className="text-sm text-secondary-500 mt-1">
          Allocate physical inventory to employees/departments, approve transfer requests, and monitor overdue returns.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'allocate', label: 'Allocation Manager' },
          { id: 'transfers', label: 'Transfer Requests Pipeline' },
          { id: 'overdue', label: 'Overdue Returns' },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id)}
      />

      {/* ---------------------------------------------------- */}
      {/* TAB A: ALLOCATION MANAGER */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'allocate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Allocation Selector and Form */}
          <Card className="col-span-1 lg:col-span-2 border border-secondary-200 p-6 bg-white shadow-sm">
            <h2 className="text-base font-bold text-secondary-900 mb-5">Create Allocation Handover</h2>

            <form onSubmit={handleAllocateSubmit} className="flex flex-col gap-5">
              
              {/* Asset Selector */}
              <Select
                label="Select Inventory Asset"
                name="assetTag"
                required
                value={selectedAssetTag}
                onChange={(e) => {
                  setSelectedAssetTag(e.target.value);
                  setFormErrors({});
                }}
                options={assets.map((a) => ({
                  value: a.tag,
                  label: `[${a.tag}] ${a.name} (${a.status})`,
                }))}
              />

              {/* CONFLICT DETECTED: Asset is already Allocated */}
              {selectedAsset && selectedAsset.status === 'Allocated' ? (
                <div className="bg-warning-50 border border-warning-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
                  <div className="flex gap-2 text-xs text-warning-800 leading-normal">
                    <svg className="h-5 w-5 text-warning-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-bold">Conflict: Asset Already Allocated</p>
                      <p className="mt-0.5">
                        This item is currently held by <span className="font-bold">{selectedAsset.allocatedTo || selectedAsset.department}</span> since{' '}
                        {selectedAsset.history?.find((h) => h.type === 'Allocation')?.date || 'acquisition'}.
                      </p>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" type="button" onClick={handleOpenTransferRequest}>
                    Request Transfer
                  </Button>
                </div>
              ) : selectedAsset && selectedAsset.status === 'Under Maintenance' ? (
                <div className="bg-danger-50 border border-danger-100 p-4 rounded-xl flex gap-2.5 text-xs text-danger-700 leading-normal animate-fade-in-up">
                  <svg className="h-5 w-5 text-danger-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <div>
                    <p className="font-bold">Asset Locked: Under Maintenance</p>
                    <p className="mt-0.5">
                      This item is locked in repair and cannot be allocated. Go to the maintenance dashboard to mark it returned to service.
                    </p>
                  </div>
                </div>
              ) : (
                /* FREE TO ALLOCATE */
                <div className="flex flex-col gap-4 animate-fade-in-up">
                  {/* Allocation Mode Radio Toggles */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-secondary-700 uppercase">Allocation Target Type</label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-2 text-sm text-secondary-700 cursor-pointer">
                        <input
                          type="radio"
                          name="allocationMode"
                          checked={allocationMode === 'employee'}
                          onChange={() => { setAllocationMode('employee'); setTargetName(''); }}
                          className="h-4.5 w-4.5 border-secondary-300 text-primary-600 focus:ring-primary-500"
                        />
                        Allocate to Individual Employee
                      </label>
                      <label className="flex items-center gap-2 text-sm text-secondary-700 cursor-pointer">
                        <input
                          type="radio"
                          name="allocationMode"
                          checked={allocationMode === 'department'}
                          onChange={() => { setAllocationMode('department'); setTargetName(''); }}
                          className="h-4.5 w-4.5 border-secondary-300 text-primary-600 focus:ring-primary-500"
                        />
                        Allocate to Department Room
                      </label>
                    </div>
                  </div>

                  {/* Recipient Target Dropdowns */}
                  {allocationMode === 'employee' ? (
                    <Select
                      label="Select Target Employee"
                      name="targetName"
                      required
                      placeholder="Choose recipient employee..."
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      error={formErrors.targetName}
                      touched={!!formErrors.targetName}
                      options={employees.map((e) => ({ value: e.name, label: e.name }))}
                    />
                  ) : (
                    <Select
                      label="Select Target Department"
                      name="targetName"
                      required
                      placeholder="Choose recipient department..."
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      error={formErrors.targetName}
                      touched={!!formErrors.targetName}
                      options={departments.map((d) => ({ value: d.name, label: d.name }))}
                    />
                  )}

                  {/* Date Picker */}
                  <Input
                    label="Expected Return Date (Optional)"
                    name="expectedReturnDate"
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    error={formErrors.expectedReturnDate}
                    touched={!!formErrors.expectedReturnDate}
                  />

                  {/* Handover notes */}
                  <Textarea
                    label="Handover Notes"
                    name="notes"
                    placeholder="Enter details of handoff..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <Button type="submit" variant="primary" className="w-full mt-2">
                    Allocate Asset
                  </Button>
                </div>
              )}
            </form>
          </Card>

          {/* Sidebar quick actions info */}
          <div className="flex flex-col gap-6">
            <Card className="border border-secondary-200 p-5 bg-white shadow-sm text-sm">
              <h3 className="font-bold text-secondary-900 mb-2">Check In Returned Assets</h3>
              <p className="text-xs text-secondary-500 leading-normal mb-4">
                If an employee is returning an allocated laptop or equipment, click 'Return to Stock' to mark it Available again.
              </p>
              
              <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto">
                {assets.filter((a) => a.status === 'Allocated').length === 0 ? (
                  <span className="text-xs text-secondary-400 italic text-center py-4">No allocated assets.</span>
                ) : (
                  assets
                    .filter((a) => a.status === 'Allocated')
                    .map((asset) => (
                      <div key={asset.tag} className="flex items-center justify-between p-2 rounded-lg bg-secondary-50 border border-secondary-200 text-xs">
                        <div>
                          <span className="font-semibold text-secondary-800 block">{asset.name}</span>
                          <span className="font-mono text-secondary-400 text-[10px]">{asset.tag}</span>
                        </div>
                        <Button size="sm" variant="ghost" className="text-primary-600 font-semibold" onClick={() => handleOpenReturnDrawer(asset)}>
                          Return
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB B: TRANSFER REQUESTS PIPELINE */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'transfers' && (
        <div className="flex flex-col gap-6">
          {/* Stepper overview */}
          <div className="bg-white border border-secondary-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-medium text-secondary-500">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold">1</span>
              <span>Requested</span>
            </div>
            <div className="hidden md:block h-0.5 bg-secondary-200 flex-1 mx-2" />
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold">2</span>
              <span>Approved by Manager</span>
            </div>
            <div className="hidden md:block h-0.5 bg-secondary-200 flex-1 mx-2" />
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold">3</span>
              <span>Re-allocated (System updates history logs)</span>
            </div>
          </div>

          {/* Transfers Table (Desktop) */}
          <div className="hidden md:block bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-200">
              <h2 className="text-base font-bold text-secondary-900">Active Handover Requests</h2>
            </div>
            <Table
              keyField="id"
              emptyMessage="No pending asset transfer requests."
              columns={[
                { key: 'assetTag', header: 'Asset Tag', render: (row) => <span className="font-mono font-semibold text-secondary-800">{row.assetTag}</span> },
                { key: 'assetName', header: 'Asset Name', render: (row) => <span className="font-semibold text-secondary-900">{row.assetName}</span> },
                { key: 'currentHolder', header: 'Current Owner' },
                { key: 'requester', header: 'Target Recipient', render: (row) => `${row.requester} (${row.department})` },
                {
                  key: 'status',
                  header: 'Request Status',
                  render: (row) => {
                    let v = 'warning';
                    if (row.status === 'Approved') v = 'success';
                    if (row.status === 'Rejected') v = 'danger';
                    return <Badge variant={v}>{row.status}</Badge>;
                  },
                },
                {
                  key: 'actions',
                  header: 'Operations',
                  render: (row) => {
                    if (row.status !== 'Pending') {
                      return <span className="text-xs text-secondary-400 font-medium">Processed</span>;
                    }
                    return (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-success-600 hover:bg-success-50 font-semibold"
                          disabled={!isAdminOrManager}
                          onClick={() => handleApproveTransfer(row)}
                          title={!isAdminOrManager ? 'Admin or Asset Manager permissions required' : undefined}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger-600 hover:bg-danger-50 font-semibold"
                          disabled={!isAdminOrManager}
                          onClick={() => handleOpenReject(row)}
                          title={!isAdminOrManager ? 'Admin or Asset Manager permissions required' : undefined}
                        >
                          Reject
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
              data={transfers}
            />
          </div>

          {/* Transfers Table (Mobile Card Fallback) */}
          <div className="block md:hidden space-y-3">
            {transfers.length === 0 ? (
              <div className="text-center py-8 text-secondary-400 bg-white rounded-xl border border-secondary-200 shadow-sm">No transfer requests.</div>
            ) : (
              transfers.map((req) => (
                <div key={req.id} className="bg-white border border-secondary-200 p-4 rounded-xl shadow-sm flex flex-col gap-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-secondary-900">{req.assetName}</h3>
                      <p className="text-[10px] text-secondary-400 font-mono mt-0.5">{req.assetTag}</p>
                    </div>
                    <Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'danger' : 'warning'}>
                      {req.status}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-secondary-650 space-y-1 bg-secondary-50 p-2.5 rounded-lg">
                    <div><span className="text-secondary-400 font-medium">From:</span> {req.currentHolder}</div>
                    <div><span className="text-secondary-400 font-medium">To Target:</span> {req.requester} ({req.department})</div>
                    <div><span className="text-secondary-400 font-medium">Reason:</span> {req.reason}</div>
                  </div>

                  {req.status === 'Pending' && (
                    <div className="border-t border-secondary-100 pt-2.5 mt-1 flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!isAdminOrManager}
                        onClick={() => handleOpenReject(req)}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!isAdminOrManager}
                        onClick={() => handleApproveTransfer(req)}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB C: OVERDUE RETURNS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'overdue' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-200 flex justify-between items-center">
              <h2 className="text-base font-bold text-secondary-900">Overdue Handover Records</h2>
              <Badge variant="danger">{overdueAllocations.length} items</Badge>
            </div>

            <Table
              keyField="tag"
              emptyMessage="Excellent! No allocated assets are currently overdue."
              columns={[
                { key: 'tag', header: 'Tag', render: (row) => <span className="font-mono font-semibold text-secondary-800">{row.tag}</span> },
                { key: 'name', header: 'Asset Name', render: (row) => <span className="font-semibold text-secondary-900">{row.name}</span> },
                { key: 'allocatedTo', header: 'Holder', render: (row) => row.allocatedTo || row.department },
                { key: 'expectedReturnDate', header: 'Expected Return', render: (row) => <span className="text-danger-600 font-semibold font-mono">{row.expectedReturnDate}</span> },
                {
                  key: 'actions',
                  header: 'Operations',
                  render: (row) => (
                    <Button variant="ghost" size="sm" className="text-primary-600 hover:bg-primary-50 font-semibold" onClick={() => handleSendReminder(row)}>
                      Send Reminder Alert
                    </Button>
                  ),
                },
              ]}
              data={overdueAllocations.sort((a, b) => (a.expectedReturnDate > b.expectedReturnDate ? 1 : -1))}
            />
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODALS */}
      {/* ---------------------------------------------------- */}

      {/* Request Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Submit Transfer Allocation Request"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleTransferRequestSubmit}>
              Submit Request
            </Button>
          </div>
        }
      >
        {selectedAsset && (
          <form onSubmit={handleTransferRequestSubmit} className="flex flex-col gap-4">
            <div className="bg-secondary-50 border border-secondary-200 p-3 rounded-lg text-xs leading-normal">
              <span className="font-bold text-secondary-500 uppercase block tracking-wide text-[9px] mb-0.5">Selected Asset</span>
              <p className="font-bold text-secondary-800">{selectedAsset.name} ({selectedAsset.tag})</p>
              <p className="mt-1 text-secondary-500">Currently held by: {selectedAsset.allocatedTo || selectedAsset.department}</p>
            </div>

            <Textarea
              label="Reason for Requesting Transfer"
              name="transferReason"
              required
              placeholder="Provide context explaining why this asset must be reallocated..."
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
            />
          </form>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Transfer Request"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRejectSubmit}>
              Reject Request
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4">
          <Textarea
            label="Provide Reason for Rejection"
            name="rejectReason"
            required
            placeholder="Write a clear explanation for the requester..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </form>
      </Modal>

      {/* Check-in Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Check In Asset Return"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsReturnModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReturnSubmit}>
              Complete Return
            </Button>
          </div>
        }
      >
        {returnAsset && (
          <form onSubmit={handleReturnSubmit} className="flex flex-col gap-4">
            <div className="text-xs bg-secondary-50 p-3 rounded-lg border border-secondary-200">
              <span className="font-bold text-secondary-500 uppercase tracking-wide block text-[9px] mb-0.5">Asset Tag</span>
              <p className="font-bold text-secondary-800">{returnAsset.name} ({returnAsset.tag})</p>
            </div>

            <Select
              label="Return Condition Rating"
              name="returnCondition"
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value)}
              options={[
                { value: 'New', label: 'New (Excellent condition)' },
                { value: 'Good', label: 'Good (Standard check-in)' },
                { value: 'Fair', label: 'Fair (Minor wear)' },
                { value: 'Poor', label: 'Poor (Repair required)' },
                { value: 'Damaged', label: 'Damaged (Decommission)' },
              ]}
            />

            <Textarea
              label="Return Audit Notes"
              name="returnNotes"
              placeholder="e.g. check-in screen inspected, no scuffs, keys cleaned..."
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
            />
          </form>
        )}
      </Modal>

    </div>
  );
};

export default AllocationPage;
