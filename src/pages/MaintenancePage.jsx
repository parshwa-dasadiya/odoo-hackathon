import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Modal from '../components/common/Modal';
import { getAssets, saveAssets, getMaintenance, saveMaintenance, pushNotification, logActivity } from '../utils/mockDb';
import { ROLES } from '../utils/constants';

export const MaintenancePage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const userEmail = user?.email || 's.connor@assetflow.com';
  const isManagerOrAdmin = [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(user?.role);

  // States
  const [assets, setAssets] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'list' for mobile
  const [personalFilter, setPersonalFilter] = useState(!isManagerOrAdmin); // True if Employee

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Selected Target state
  const [activeRequest, setActiveRequest] = useState(null);

  // Form states
  const [requestForm, setRequestForm] = useState({ assetTag: '', description: '', priority: 'Medium' });
  const [requestErrors, setRequestErrors] = useState({});
  const [approveForm, setApproveForm] = useState({ technician: '', techContact: '' });
  const [approveErrors, setApproveErrors] = useState({});
  const [rejectForm, setRejectForm] = useState({ reason: '' });
  const [resolveForm, setResolveForm] = useState({ notes: '' });

  // Load Data
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setAssets(getAssets());
      setMaintenance(getMaintenance());
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Filter bookable assets based on role
  // Employees can only request maintenance for assets they currently hold.
  const permittedAssets = assets.filter((a) => {
    if (isManagerOrAdmin) return true;
    return a.allocatedTo === user?.name;
  });

  // ----------------------------------------------------
  // HANDLERS: RAISE REQUEST
  // ----------------------------------------------------
  const handleOpenRequest = () => {
    if (permittedAssets.length === 0) {
      showToast('warning', 'You do not have any physical assets allocated to raise requests for.');
      return;
    }
    setRequestForm({
      assetTag: permittedAssets[0].tag,
      description: '',
      priority: 'Medium',
    });
    setRequestErrors({});
    setIsRequestOpen(true);
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!requestForm.description.trim()) {
      errors.description = 'Issue description is required';
    } else if (requestForm.description.trim().length < 15) {
      errors.description = 'Description must be at least 15 characters to explain the issue properly';
    }

    if (Object.keys(errors).length > 0) {
      setRequestErrors(errors);
      return;
    }

    const targetAsset = assets.find((a) => a.tag === requestForm.assetTag);
    if (!targetAsset) return;

    // TEMP: replace with real API call once backend is ready
    const newRequest = {
      id: String(Date.now()),
      assetTag: requestForm.assetTag,
      assetName: targetAsset.name,
      requester: user?.name || 'Sarah Connor',
      email: userEmail,
      priority: requestForm.priority,
      status: 'Pending',
      description: requestForm.description,
      technician: '',
      techContact: '',
      date: new Date().toISOString().split('T')[0],
      resolutionNotes: '',
    };

    const updated = [newRequest, ...maintenance];
    setMaintenance(updated);
    saveMaintenance(updated);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Maintenance requested for ${requestForm.assetTag}: ${requestForm.description.slice(0, 30)}...`, 'Maintenance Requested');
    logActivity(user?.name || 'Sarah Connor', 'Raise Maintenance Request', requestForm.assetTag);

    setIsRequestOpen(false);
    showToast('success', 'Maintenance request raised successfully.');
  };

  // ----------------------------------------------------
  // PIPELINE STATE CHANGES
  // ----------------------------------------------------
  const handleOpenApprove = (req) => {
    setActiveRequest(req);
    setApproveForm({ technician: '', techContact: '' });
    setApproveErrors({});
    setIsApproveOpen(true);
  };

  const handleApproveSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!approveForm.technician.trim()) errors.technician = 'Technician name is required';

    if (Object.keys(errors).length > 0) {
      setApproveErrors(errors);
      return;
    }

    // TEMP: replace with real API call (approving moves request to 'Approved' & linked asset to 'Under Maintenance')
    const todayStr = new Date().toISOString().split('T')[0];
    const targetAsset = assets.find((a) => a.tag === activeRequest.assetTag);
    
    if (targetAsset) {
      const newMaintLog = {
        id: String(Date.now()),
        type: 'Repair',
        detail: `Maintenance Approved: Assigned to ${approveForm.technician}. Issue: ${activeRequest.description}`,
        date: todayStr,
        status: 'In Progress'
      };

      const updatedAsset = {
        ...targetAsset,
        status: 'Under Maintenance',
        maintenance: [newMaintLog, ...(targetAsset.maintenance || [])],
        history: [{ id: String(Date.now()), type: 'Maintenance', detail: `Sent to maintenance: ${activeRequest.description}`, date: todayStr }, ...(targetAsset.history || [])]
      };

      const updatedAssets = assets.map((a) => (a.tag === targetAsset.tag ? updatedAsset : a));
      setAssets(updatedAssets);
      saveAssets(updatedAssets);
    }

    const updatedRequests = maintenance.map((r) =>
      r.id === activeRequest.id
        ? { ...r, status: 'Approved', technician: approveForm.technician, techContact: approveForm.techContact }
        : r
    );
    setMaintenance(updatedRequests);
    saveMaintenance(updatedRequests);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Maintenance approved for ${activeRequest.assetTag}. Assigned to: ${approveForm.technician}.`, 'Maintenance Approved');
    logActivity(user?.name || 'Sarah Connor', 'Approve Maintenance', activeRequest.assetTag);

    setIsApproveOpen(false);
    showToast('success', 'Request approved. Asset marked under maintenance.');
  };

  const handleOpenReject = (req) => {
    setActiveRequest(req);
    setRejectForm({ reason: '' });
    setIsRejectOpen(true);
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectForm.reason.trim()) {
      showToast('warning', 'Please enter a rejection reason.');
      return;
    }

    // TEMP: replace with real API call
    const updatedRequests = maintenance.map((r) =>
      r.id === activeRequest.id
        ? { ...r, status: 'Rejected', resolutionNotes: `Rejected: ${rejectForm.reason}` }
        : r
    );
    setMaintenance(updatedRequests);
    saveMaintenance(updatedRequests);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Maintenance request rejected for ${activeRequest.assetTag}. Reason: ${rejectForm.reason}`, 'Maintenance Rejected');
    logActivity(user?.name || 'Sarah Connor', 'Reject Maintenance', activeRequest.assetTag);

    setIsRejectOpen(false);
    showToast('warning', 'Request rejected.');
  };

  const handleStartProgress = (req) => {
    // TEMP: replace with real API call
    const updatedRequests = maintenance.map((r) =>
      r.id === req.id ? { ...r, status: 'In Progress' } : r
    );
    setMaintenance(updatedRequests);
    saveMaintenance(updatedRequests);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Repair started for ${req.assetTag} by technician.`, 'Maintenance In Progress');
    logActivity(user?.name || 'Sarah Connor', 'Start Repair', req.assetTag);

    showToast('info', 'Work started. Status set to In Progress.');
  };

  const handleOpenResolve = (req) => {
    setActiveRequest(req);
    setResolveForm({ notes: '' });
    setIsResolveOpen(true);
  };

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    if (!resolveForm.notes.trim()) {
      showToast('warning', 'Please enter resolution summary.');
      return;
    }

    // TEMP: replace with real API call (resolving flips request to 'Resolved' & asset back to 'Available')
    const todayStr = new Date().toISOString().split('T')[0];
    const targetAsset = assets.find((a) => a.tag === activeRequest.assetTag);

    if (targetAsset) {
      // Find the active repair log and close it out
      const updatedMaint = (targetAsset.maintenance || []).map((m) =>
        m.status === 'In Progress' ? { ...m, status: 'Completed', resolution: resolveForm.notes } : m
      );

      const updatedAsset = {
        ...targetAsset,
        status: 'Available',
        allocatedTo: undefined,
        department: undefined,
        maintenance: updatedMaint,
        history: [{ id: String(Date.now()), type: 'Return', detail: `Returned from maintenance: ${resolveForm.notes}`, date: todayStr }, ...(targetAsset.history || [])]
      };

      const updatedAssets = assets.map((a) => (a.tag === targetAsset.tag ? updatedAsset : a));
      setAssets(updatedAssets);
      saveAssets(updatedAssets);
    }

    const updatedRequests = maintenance.map((r) =>
      r.id === activeRequest.id
        ? { ...r, status: 'Resolved', resolutionNotes: resolveForm.notes }
        : r
    );
    setMaintenance(updatedRequests);
    saveMaintenance(updatedRequests);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Maintenance resolved for ${activeRequest.assetTag}. Resolution: ${resolveForm.notes.slice(0, 30)}...`, 'Maintenance Resolved');
    logActivity(user?.name || 'Sarah Connor', 'Resolve Maintenance', activeRequest.assetTag);

    setIsResolveOpen(false);
    showToast('success', 'Request resolved. Asset returned to Available.');
  };

  // Color mappings
  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'Critical': return 'danger';
      case 'High': return 'warning';
      case 'Medium': return 'primary';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  };

  // Filtering
  const filteredRequests = maintenance.filter((r) => {
    const matchesSearch = r.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = filterPriority === 'All' || r.priority === filterPriority;
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchesUser = !personalFilter || r.email === userEmail;

    return matchesSearch && matchesPriority && matchesStatus && matchesUser;
  });

  const kanbanColumns = ['Pending', 'Approved', 'In Progress', 'Resolved'];

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 md:text-3xl">Maintenance Center</h1>
          <p className="text-sm text-secondary-500 mt-1">Submit, monitor, and approve diagnostic repairs for company resources.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* My requests filter toggle */}
          {isManagerOrAdmin && (
            <div className="flex border border-secondary-200 p-0.5 rounded-lg bg-white shadow-sm mr-2 text-xs">
              <button
                onClick={() => setPersonalFilter(false)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-premium ${!personalFilter ? 'bg-secondary-100 text-secondary-800' : 'text-secondary-400 hover:text-secondary-600'}`}
              >
                All Requests Queue
              </button>
              <button
                onClick={() => setPersonalFilter(true)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-premium ${personalFilter ? 'bg-secondary-100 text-secondary-800' : 'text-secondary-400 hover:text-secondary-600'}`}
              >
                My Requests
              </button>
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleOpenRequest}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            File Request
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border border-secondary-200 bg-white shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search request tag or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 w-full bg-secondary-50 border border-secondary-200 rounded-lg text-sm text-secondary-750 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>

        <Select
          name="filterPriority"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          options={[
            { value: 'All', label: 'All Priorities' },
            { value: 'Critical', label: 'Critical Only' },
            { value: 'High', label: 'High Only' },
            { value: 'Medium', label: 'Medium Only' },
            { value: 'Low', label: 'Low Only' },
          ]}
        />

        <Select
          name="filterStatus"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: 'All', label: 'All Pipeline Statuses' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Approved', label: 'Approved' },
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Resolved', label: 'Resolved' },
          ]}
        />
      </Card>

      {/* Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch min-h-[60vh]">
        {kanbanColumns.map((colName) => {
          const colRequests = filteredRequests.filter((r) => r.status === colName);
          
          return (
            <div key={colName} className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 flex flex-col gap-4">
              {/* Column Header */}
              <div className="flex justify-between items-center pb-2 border-b border-secondary-200">
                <h3 className="font-bold text-secondary-900 text-sm">{colName}</h3>
                <Badge variant={colName === 'Pending' ? 'warning' : colName === 'Resolved' ? 'success' : 'primary'}>
                  {colRequests.length}
                </Badge>
              </div>

              {/* Cards wrapper */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[500px]">
                {colRequests.length === 0 ? (
                  <span className="text-[11px] text-secondary-400 italic text-center py-6">No requests in this stage.</span>
                ) : (
                  colRequests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => { setActiveRequest(req); setIsDetailsOpen(true); }}
                      className="bg-white border border-secondary-200 rounded-lg p-3.5 hover:shadow-premium hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-200 flex flex-col gap-2 relative"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-mono font-bold text-secondary-400 text-[10px] bg-secondary-50 border border-secondary-200 px-1.5 py-0.5 rounded">
                          {req.assetTag}
                        </span>
                        <Badge variant={getPriorityColor(req.priority)}>{req.priority}</Badge>
                      </div>

                      <h4 className="font-bold text-secondary-800 text-xs line-clamp-1 leading-tight">{req.assetName}</h4>
                      <p className="text-secondary-550 text-xs line-clamp-2 leading-relaxed">{req.description}</p>
                      
                      <div className="flex justify-between items-center text-[10px] text-secondary-400 pt-2 border-t border-secondary-100 mt-1">
                        <span>Requested: {req.date}</span>
                        <span className="font-semibold text-secondary-600 truncate max-w-[80px]">By {req.requester}</span>
                      </div>

                      {/* Managers state pipeline transition shortcuts */}
                      {isManagerOrAdmin && (
                        <div className="flex justify-end gap-1.5 pt-2 border-t border-secondary-100 mt-1" onClick={(e) => e.stopPropagation()}>
                          {req.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleOpenReject(req)}
                                className="text-[10px] font-bold text-danger-600 hover:bg-danger-50 px-2 py-1 rounded"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleOpenApprove(req)}
                                className="text-[10px] font-bold text-primary-600 hover:bg-primary-50 px-2 py-1 rounded"
                              >
                                Approve
                              </button>
                            </>
                          )}

                          {req.status === 'Approved' && (
                            <button
                              onClick={() => handleStartProgress(req)}
                              className="text-[10px] font-bold text-primary-600 hover:bg-primary-50 px-2 py-1 rounded w-full text-center"
                            >
                              Start Repair
                            </button>
                          )}

                          {req.status === 'In Progress' && (
                            <button
                              onClick={() => handleOpenResolve(req)}
                              className="text-[10px] font-bold text-success-600 hover:bg-success-50 px-2 py-1 rounded w-full text-center"
                            >
                              Resolve Issue
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL WINDOWS */}
      {/* ---------------------------------------------------- */}

      {/* Raise Request form modal */}
      <Modal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        title="Raise Maintenance Request Ticket"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsRequestOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRequestSubmit}>
              Submit Ticket
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRequestSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Allocated Asset"
            name="assetTag"
            required
            value={requestForm.assetTag}
            onChange={(e) => setRequestForm((prev) => ({ ...prev, assetTag: e.target.value }))}
            options={permittedAssets.map((a) => ({ value: a.tag, label: `[${a.tag}] ${a.name}` }))}
          />

          <Select
            label="Urgency Priority"
            name="priority"
            value={requestForm.priority}
            onChange={(e) => setRequestForm((prev) => ({ ...prev, priority: e.target.value }))}
            options={[
              { value: 'Critical', label: 'Critical (Locks hardware immediately)' },
              { value: 'High', label: 'High (Degraded function)' },
              { value: 'Medium', label: 'Medium (Standard request)' },
              { value: 'Low', label: 'Low (Scheduled audit task)' },
            ]}
          />

          <Textarea
            label="Describe the issue in detail"
            name="description"
            required
            placeholder="Please write at least 15 characters explaining what needs repair..."
            value={requestForm.description}
            onChange={(e) => setRequestForm((prev) => ({ ...prev, description: e.target.value }))}
            error={requestErrors.description}
            touched={!!requestErrors.description}
          />
        </form>
      </Modal>

      {/* Approve request modal (Technician info) */}
      <Modal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Assign Repair Technician"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsApproveOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApproveSubmit}>
              Approve & Assign
            </Button>
          </div>
        }
      >
        <form onSubmit={handleApproveSubmit} className="flex flex-col gap-4">
          <Input
            label="Technician Name"
            name="technician"
            placeholder="e.g. David Support Specialist"
            required
            value={approveForm.technician}
            onChange={(e) => setApproveForm((prev) => ({ ...prev, technician: e.target.value }))}
            error={approveErrors.technician}
            touched={!!approveErrors.technician}
          />

          <Input
            label="Technician Contact / Email"
            name="techContact"
            placeholder="d.miller@company.com"
            value={approveForm.techContact}
            onChange={(e) => setApproveForm((prev) => ({ ...prev, techContact: e.target.value }))}
          />
        </form>
      </Modal>

      {/* Reject Request Modal */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Reject Maintenance Ticket"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRejectSubmit}>
              Reject Ticket
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4">
          <Textarea
            label="Provide rejection reason"
            name="reason"
            required
            placeholder="Write a clear explanation why this ticket is rejected..."
            value={rejectForm.reason}
            onChange={(e) => setRejectForm((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </form>
      </Modal>

      {/* Resolve Issue Modal */}
      <Modal
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        title="Complete Maintenance Resolution"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsResolveOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleResolveSubmit}>
              Mark Resolved
            </Button>
          </div>
        }
      >
        <form onSubmit={handleResolveSubmit} className="flex flex-col gap-4">
          <Textarea
            label="Resolution summary details"
            name="notes"
            required
            placeholder="e.g. Cleared thermal paste, replaced SSD, successfully boot..."
            value={resolveForm.notes}
            onChange={(e) => setResolveForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </form>
      </Modal>

      {/* Request Details View Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Maintenance Request Ticket Details"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {activeRequest && (
          <div className="space-y-4 text-sm text-secondary-650">
            <div className="flex justify-between items-center bg-secondary-50 p-3 rounded-lg border border-secondary-200">
              <div>
                <span className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide block">Asset Reference</span>
                <span className="font-bold text-secondary-800">{activeRequest.assetName} ({activeRequest.assetTag})</span>
              </div>
              <Badge variant={getPriorityColor(activeRequest.priority)}>{activeRequest.priority}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <span className="font-semibold text-secondary-400 uppercase tracking-wider block mb-0.5">Status</span>
                <span className="font-bold text-secondary-800">{activeRequest.status}</span>
              </div>
              <div>
                <span className="font-semibold text-secondary-400 uppercase tracking-wider block mb-0.5">Date Requested</span>
                <span className="font-bold text-secondary-800">{activeRequest.date}</span>
              </div>
              <div>
                <span className="font-semibold text-secondary-400 uppercase tracking-wider block mb-0.5">Requester</span>
                <span className="font-bold text-secondary-800">{activeRequest.requester}</span>
              </div>
              {activeRequest.technician && (
                <div>
                  <span className="font-semibold text-secondary-400 uppercase tracking-wider block mb-0.5">Technician</span>
                  <span className="font-bold text-secondary-800">{activeRequest.technician}</span>
                </div>
              )}
            </div>

            <div className="border-t border-secondary-100 pt-3">
              <span className="font-semibold text-secondary-400 uppercase tracking-wider text-[10px] block mb-1">Issue Description</span>
              <p className="text-secondary-800 leading-relaxed font-medium">{activeRequest.description}</p>
            </div>

            {activeRequest.resolutionNotes && (
              <div className="border-t border-secondary-100 pt-3">
                <span className="font-semibold text-secondary-400 uppercase tracking-wider text-[10px] block mb-1">Resolution Summary</span>
                <p className="text-success-800 leading-relaxed font-semibold">{activeRequest.resolutionNotes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default MaintenancePage;
