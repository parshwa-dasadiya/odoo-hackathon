import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import {
  getAssets,
  saveAssets,
  getEmployees,
  getDepartments,
  getAudits,
  saveAudits,
  pushNotification,
  logActivity,
} from '../utils/mockDb';
import { ROLES } from '../utils/constants';

export const AuditsPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const userRole = user?.role || 'Employee';
  const isAdminOrManager = [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(userRole);

  // States
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Selection
  const [activeCycleId, setActiveCycleId] = useState(null);

  // Create Cycle Modal Form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    scopeDept: 'All',
    scopeLoc: 'All',
    selectedAuditors: [],
  });
  const [createErrors, setCreateErrors] = useState({});

  // Close Cycle Modal Confirmation
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

  // Auditor Notes in checklist
  const [checklistNotes, setChecklistNotes] = useState({});

  // Load Data
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setAssets(getAssets());
      setEmployees(getEmployees());
      setDepartments(getDepartments());
      setCycles(getAudits());
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const activeCycle = cycles.find((c) => c.id === activeCycleId);

  // Unique list of locations from assets
  const locations = Array.from(new Set(assets.map((a) => a.location))).filter(Boolean);

  // Filter employees with the 'Auditor' role (or fallback to include John Doe)
  const availableAuditors = employees.filter(
    (emp) => emp.role === ROLES.AUDITOR || emp.name === 'John Doe'
  );

  // ----------------------------------------------------
  // CYCLE IN-SCOPE ASSETS CALCULATION
  // ----------------------------------------------------
  const getInScopeAssets = (scopeDept, scopeLoc) => {
    return assets.filter((asset) => {
      const matchDept = scopeDept === 'All' || asset.department === scopeDept || (asset.allocatedTo && assets.some(a => a.allocatedTo === asset.allocatedTo && a.department === scopeDept));
      // Simplified: if scopeDept is Engineering, matches if asset.department is Engineering
      const actualDept = asset.department || '';
      const matchD = scopeDept === 'All' || actualDept.toLowerCase() === scopeDept.toLowerCase();

      const actualLoc = asset.location || '';
      const matchL = scopeLoc === 'All' || actualLoc.toLowerCase() === scopeLoc.toLowerCase();

      return matchD && matchL;
    });
  };

  // ----------------------------------------------------
  // HANDLERS: CREATE CYCLE
  // ----------------------------------------------------
  const handleOpenCreate = () => {
    setCycleForm({
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      scopeDept: 'All',
      scopeLoc: 'All',
      selectedAuditors: availableAuditors.length > 0 ? [availableAuditors[0].name] : [],
    });
    setCreateErrors({});
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!cycleForm.name.trim()) errors.name = 'Audit cycle name is required';
    if (!cycleForm.startDate) errors.startDate = 'Start date is required';
    if (!cycleForm.endDate) errors.endDate = 'End date is required';
    if (cycleForm.selectedAuditors.length === 0) {
      errors.selectedAuditors = 'Please assign at least one Auditor';
    }

    if (cycleForm.startDate && cycleForm.endDate && cycleForm.startDate > cycleForm.endDate) {
      errors.endDate = 'End date must be after start date';
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    // TEMP: replace with real API call
    const newCycle = {
      id: String(Date.now()),
      name: cycleForm.name,
      startDate: cycleForm.startDate,
      endDate: cycleForm.endDate,
      scopeDept: cycleForm.scopeDept,
      scopeLoc: cycleForm.scopeLoc,
      status: 'In Progress',
      auditors: cycleForm.selectedAuditors,
      results: {},
    };

    const updated = [...cycles, newCycle];
    setCycles(updated);
    saveAudits(updated);

    // PUSH NOTIFICATION & LOG
    pushNotification(`New inventory audit cycle initiated: "${cycleForm.name}"`, 'Audit Cycle Created');
    logActivity(user?.name || 'Sarah Connor', 'Create Audit Cycle', cycleForm.name);

    setIsCreateOpen(false);
    showToast('success', `Audit Cycle "${cycleForm.name}" created successfully.`);
  };

  // ----------------------------------------------------
  // HANDLERS: CHECKLIST ACTIONS (VERIFIED / MISSING / DAMAGED)
  // ----------------------------------------------------
  const handleMarkAsset = (assetTag, status) => {
    if (!activeCycle || activeCycle.status === 'Closed') return;

    const note = checklistNotes[assetTag] || '';
    const updatedResults = {
      ...(activeCycle.results || {}),
      [assetTag]: { status, note, date: new Date().toISOString().split('T')[0] },
    };

    const updatedCycle = {
      ...activeCycle,
      results: updatedResults,
    };

    const updatedCycles = cycles.map((c) => (c.id === activeCycle.id ? updatedCycle : c));
    setCycles(updatedCycles);
    saveAudits(updatedCycles);
    showToast('info', `Marked ${assetTag} as ${status}.`);
  };

  const handleNoteChange = (assetTag, val) => {
    setChecklistNotes((prev) => ({ ...prev, [assetTag]: val }));
  };

  const handleSaveNoteInput = (assetTag) => {
    if (!activeCycle || activeCycle.status === 'Closed') return;
    
    // Save note to active result if it exists
    const currentResult = activeCycle.results?.[assetTag];
    if (!currentResult) {
      showToast('warning', 'Please select a status (Verified/Missing/Damaged) before adding notes.');
      return;
    }

    const updatedResults = {
      ...activeCycle.results,
      [assetTag]: { ...currentResult, note: checklistNotes[assetTag] || '' },
    };

    const updatedCycle = {
      ...activeCycle,
      results: updatedResults,
    };

    const updatedCycles = cycles.map((c) => (c.id === activeCycle.id ? updatedCycle : c));
    setCycles(updatedCycles);
    saveAudits(updatedCycles);
    showToast('success', 'Note saved successfully.');
  };

  // ----------------------------------------------------
  // HANDLERS: CLOSE AUDIT CYCLE
  // ----------------------------------------------------
  const handleCloseCycleConfirm = () => {
    if (!activeCycle || activeCycle.status === 'Closed') return;

    // Apply Side Effects: lock cycle and update assets in temp storage
    const inScopeAssets = getInScopeAssets(activeCycle.scopeDept, activeCycle.scopeLoc);
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedAssets = assets.map((asset) => {
      // Check if asset was in scope
      const inScope = inScopeAssets.some((isa) => isa.tag === asset.tag);
      if (!inScope) return asset;

      const result = activeCycle.results?.[asset.tag];
      if (!result) return asset;

      // If marked Missing -> Status = Lost
      if (result.status === 'Missing') {
        return {
          ...asset,
          status: 'Lost',
          history: [
            { id: String(Date.now()), type: 'System', detail: `Marked LOST during audit cycle "${activeCycle.name}" (Note: ${result.note || 'none'})`, date: todayStr },
            ...(asset.history || []),
          ],
        };
      }

      // If marked Damaged -> Status = Under Maintenance
      if (result.status === 'Damaged') {
        const newMaint = {
          id: String(Date.now()),
          type: 'Repair',
          detail: `Audit Failure: Marked Damaged during cycle "${activeCycle.name}". Notes: ${result.note}`,
          date: todayStr,
          status: 'In Progress',
        };

        return {
          ...asset,
          status: 'Under Maintenance',
          maintenance: [newMaint, ...(asset.maintenance || [])],
          history: [
            { id: String(Date.now()), type: 'Maintenance', detail: `Flagged damaged in audit. Repair ticket raised.`, date: todayStr },
            ...(asset.history || []),
          ],
        };
      }

      return asset;
    });

    setAssets(updatedAssets);
    saveAssets(updatedAssets);

    // Update cycle status to Closed
    const updatedCycle = {
      ...activeCycle,
      status: 'Closed',
      closedDate: todayStr,
    };

    const updatedCycles = cycles.map((c) => (c.id === activeCycle.id ? updatedCycle : c));
    setCycles(updatedCycles);
    saveAudits(updatedCycles);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Audit cycle "${activeCycle.name}" closed. Assets statuses reconciled and locked.`, 'Audit Cycle Closed');
    logActivity(user?.name || 'Sarah Connor', 'Close Audit Cycle', activeCycle.name);

    setIsCloseConfirmOpen(false);
    showToast('success', `Audit Cycle "${activeCycle.name}" closed. Assets statuses updated.`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 md:text-3xl">Compliance Audits</h1>
          <p className="text-sm text-secondary-500 mt-1">
            Conduct inventory reviews, reconcile missing/damaged items, and view discrepancy reports.
          </p>
        </div>

        {isAdminOrManager && (
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            icon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Create Audit Cycle
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <Spinner size="lg" />
          <p className="text-sm text-secondary-400 mt-2">Loading inventory audit records...</p>
        </div>
      ) : activeCycleId ? (
        /* ---------------------------------------------------- */
        /* AUDITOR CHECKLIST WORKSPACE VIEW */
        /* ---------------------------------------------------- */
        (() => {
          const inScope = getInScopeAssets(activeCycle.scopeDept, activeCycle.scopeLoc);
          const checkedCount = Object.keys(activeCycle.results || {}).length;
          const totalCount = inScope.length;
          const percent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

          // Discrepancy report lists (Missing or Damaged)
          const discrepancyItems = inScope.filter((a) => {
            const res = activeCycle.results?.[a.tag];
            return res && ['Missing', 'Damaged'].includes(res.status);
          });

          return (
            <div className="flex flex-col gap-6 animate-fade-in-up">
              {/* Back button */}
              <div>
                <button
                  onClick={() => setActiveCycleId(null)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-secondary-400 hover:text-secondary-750 transition-premium"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Cycles List
                </button>
              </div>

              {/* Cycle Meta Header */}
              <Card className="border border-secondary-200 p-5 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-secondary-900">{activeCycle.name}</h2>
                    <Badge variant={activeCycle.status === 'Closed' ? 'secondary' : 'primary'}>
                      {activeCycle.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-secondary-400">
                    Scope: Dept <span className="font-semibold">{activeCycle.scopeDept}</span> · Loc{' '}
                    <span className="font-semibold">{activeCycle.scopeLoc}</span> | Auditors: {activeCycle.auditors.join(', ')}
                  </p>
                </div>

                {/* Progress bar info */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex flex-col items-end min-w-[120px]">
                    <span className="text-xs font-bold text-secondary-700">{checkedCount} / {totalCount} items verified</span>
                    <span className="text-[10px] text-secondary-400 font-semibold mt-0.5">{percent}% Complete</span>
                  </div>
                  <div className="h-2 w-32 bg-secondary-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-primary-600 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
                  </div>

                  {activeCycle.status !== 'Closed' && isAdminOrManager && (
                    <Button variant="danger" size="sm" onClick={() => setIsCloseConfirmOpen(true)}>
                      Close Cycle
                    </Button>
                  )}
                </div>
              </Card>

              {/* Workspace Split Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                
                {/* 1. Checklist (Checklist Table) */}
                <Card className="xl:col-span-2 border border-secondary-200 p-5 bg-white shadow-sm">
                  <h3 className="text-sm font-bold text-secondary-900 mb-4">Inventory Verification List</h3>
                  
                  {inScope.length === 0 ? (
                    <div className="text-center py-12 italic text-xs text-secondary-400">No assets match the scope filters.</div>
                  ) : (
                    <>
                      {/* Checklist Table (Desktop) */}
                      <div className="hidden lg:block">
                        <table className="w-full text-left border-collapse text-xs text-secondary-700">
                          <thead>
                            <tr className="border-b border-secondary-200 font-semibold text-secondary-400 uppercase tracking-wider">
                              <th className="pb-3">Asset Info</th>
                              <th className="pb-3">Storage Loc</th>
                              <th className="pb-3">Holder</th>
                              <th className="pb-3 w-44">Verification Status</th>
                              <th className="pb-3">Auditor Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-secondary-100">
                            {inScope.map((asset) => {
                              const result = activeCycle.results?.[asset.tag];
                              const inputNote = checklistNotes[asset.tag] ?? result?.note ?? '';
                              const isClosed = activeCycle.status === 'Closed';

                              return (
                                <tr key={asset.tag} className="hover:bg-secondary-50/30">
                                  <td className="py-3.5 pr-2">
                                    <span className="font-mono font-bold text-secondary-400 block">{asset.tag}</span>
                                    <span className="font-semibold text-secondary-800 block mt-0.5">{asset.name}</span>
                                  </td>
                                  <td className="py-3.5 pr-2">{asset.location}</td>
                                  <td className="py-3.5 pr-2 text-secondary-500 font-medium">
                                    {asset.allocatedTo ? asset.allocatedTo : <span className="italic text-secondary-400">Stock</span>}
                                  </td>
                                  <td className="py-3.5 pr-2">
                                    <div className="flex gap-1">
                                      <button
                                        disabled={isClosed}
                                        onClick={() => handleMarkAsset(asset.tag, 'Verified')}
                                        className={`px-2 py-1 rounded font-bold text-[10px] uppercase transition-premium ${
                                          result?.status === 'Verified'
                                            ? 'bg-success-100 text-success-800'
                                            : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                                        }`}
                                      >
                                        ✓ Ver
                                      </button>
                                      <button
                                        disabled={isClosed}
                                        onClick={() => handleMarkAsset(asset.tag, 'Missing')}
                                        className={`px-2 py-1 rounded font-bold text-[10px] uppercase transition-premium ${
                                          result?.status === 'Missing'
                                            ? 'bg-danger-100 text-danger-800'
                                            : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                                        }`}
                                      >
                                        ✗ Mis
                                      </button>
                                      <button
                                        disabled={isClosed}
                                        onClick={() => handleMarkAsset(asset.tag, 'Damaged')}
                                        className={`px-2 py-1 rounded font-bold text-[10px] uppercase transition-premium ${
                                          result?.status === 'Damaged'
                                            ? 'bg-warning-100 text-warning-800'
                                            : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                                        }`}
                                      >
                                        ! Dmg
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-3.5">
                                    <div className="flex gap-1 items-center">
                                      <input
                                        type="text"
                                        disabled={isClosed}
                                        placeholder="Add note..."
                                        value={inputNote}
                                        onChange={(e) => handleNoteChange(asset.tag, e.target.value)}
                                        className="px-2 py-1 bg-secondary-50 border border-secondary-200 rounded text-xs text-secondary-750 focus:outline-none focus:ring-1 focus:ring-primary-500/20 max-w-[120px]"
                                      />
                                      {!isClosed && (
                                        <button
                                          onClick={() => handleSaveNoteInput(asset.tag)}
                                          className="text-primary-600 hover:text-primary-850 font-bold p-1"
                                          title="Save note"
                                        >
                                          💾
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Checklist fallback layout */}
                      <div className="block lg:hidden space-y-4">
                        {inScope.map((asset) => {
                          const result = activeCycle.results?.[asset.tag];
                          const inputNote = checklistNotes[asset.tag] ?? result?.note ?? '';
                          const isClosed = activeCycle.status === 'Closed';

                          return (
                            <div key={asset.tag} className="border border-secondary-200 p-4 rounded-xl bg-white shadow-sm space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-secondary-900">{asset.name}</h4>
                                  <span className="font-mono text-[10px] text-secondary-400 mt-0.5 block">{asset.tag}</span>
                                </div>
                                {result && (
                                  <Badge variant={result.status === 'Verified' ? 'success' : result.status === 'Missing' ? 'danger' : 'warning'}>
                                    {result.status}
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs text-secondary-500 bg-secondary-50 p-2.5 rounded-lg">
                                <div>Loc: <span className="font-semibold text-secondary-800">{asset.location}</span></div>
                                <div>Holder: <span className="font-semibold text-secondary-800">{asset.allocatedTo || 'Stock'}</span></div>
                              </div>

                              <div className="flex flex-col gap-2 pt-2 border-t border-secondary-100">
                                <label className="text-[10px] font-bold text-secondary-400 uppercase tracking-wide">Verification</label>
                                <div className="flex gap-2">
                                  <button
                                    disabled={isClosed}
                                    onClick={() => handleMarkAsset(asset.tag, 'Verified')}
                                    className={`flex-1 py-1.5 rounded font-bold text-xs uppercase ${result?.status === 'Verified' ? 'bg-success-100 text-success-800' : 'bg-secondary-100 text-secondary-650'}`}
                                  >
                                    Verified
                                  </button>
                                  <button
                                    disabled={isClosed}
                                    onClick={() => handleMarkAsset(asset.tag, 'Missing')}
                                    className={`flex-1 py-1.5 rounded font-bold text-xs uppercase ${result?.status === 'Missing' ? 'bg-danger-100 text-danger-800' : 'bg-secondary-100 text-secondary-650'}`}
                                  >
                                    Missing
                                  </button>
                                  <button
                                    disabled={isClosed}
                                    onClick={() => handleMarkAsset(asset.tag, 'Damaged')}
                                    className={`flex-1 py-1.5 rounded font-bold text-xs uppercase ${result?.status === 'Damaged' ? 'bg-warning-100 text-warning-800' : 'bg-secondary-100 text-secondary-650'}`}
                                  >
                                    Damaged
                                  </button>
                                </div>

                                <div className="flex gap-2.5 mt-1 items-center">
                                  <input
                                    type="text"
                                    disabled={isClosed}
                                    placeholder="Checklist note details..."
                                    value={inputNote}
                                    onChange={(e) => handleNoteChange(asset.tag, e.target.value)}
                                    className="flex-1 px-3 py-1.5 border border-secondary-200 rounded-lg text-xs"
                                  />
                                  {!isClosed && (
                                    <Button size="sm" variant="secondary" onClick={() => handleSaveNoteInput(asset.tag)}>
                                      Save Note
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </Card>

                {/* 2. Discrepancy report summary list */}
                <Card className="border border-secondary-200 p-5 bg-white shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-secondary-900">Discrepancy Log</h3>
                    <Button size="sm" variant="ghost" className="text-primary-600 font-semibold" onClick={() => showToast('info', 'Discrepancy CSV Export triggered (visual placeholder).')}>
                      Export
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {discrepancyItems.length === 0 ? (
                      <span className="text-xs text-secondary-400 italic block py-4 text-center">Reconciliation clean. No Missing or Damaged reports filed.</span>
                    ) : (
                      discrepancyItems.map((item) => {
                        const result = activeCycle.results[item.tag];
                        return (
                          <div key={item.tag} className="p-3 rounded-lg border border-secondary-200 flex flex-col gap-1.5 text-xs bg-secondary-50/20">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-secondary-800">{item.tag}</span>
                              <Badge variant={result.status === 'Missing' ? 'danger' : 'warning'}>
                                {result.status}
                              </Badge>
                            </div>
                            <span className="font-bold text-secondary-750">{item.name}</span>
                            <div className="text-[10px] text-secondary-400 font-medium">Scope Dept: {item.department}</div>
                            {result.note && (
                              <p className="mt-1 text-danger-700 italic border-l-2 border-danger-200 pl-2 bg-danger-50/30 p-1.5 rounded">
                                " {result.note} "
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

              </div>
            </div>
          );
        })()
      ) : (
        /* ---------------------------------------------------- */
        /* STANDARD AUDIT CYCLE LIST VIEW */
        /* ---------------------------------------------------- */
        <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-secondary-200">
            <h2 className="text-base font-bold text-secondary-900 font-semibold">Active & Historic Audit Cycles</h2>
          </div>

          <Table
            keyField="id"
            emptyMessage="No Audit Cycles configured. Click 'Create Audit Cycle' to start."
            columns={[
              { key: 'name', header: 'Cycle Name', render: (row) => <span className="font-semibold text-secondary-800 hover:text-primary-600 cursor-pointer" onClick={() => setActiveCycleId(row.id)}>{row.name}</span> },
              { key: 'dates', header: 'Duration Period', render: (row) => <span className="font-mono">{row.startDate} ~ {row.endDate}</span> },
              { key: 'scopeDept', header: 'Scope Dept / Loc', render: (row) => `${row.scopeDept} / ${row.scopeLoc}` },
              { key: 'auditors', header: 'Auditors Assigned', render: (row) => row.auditors.join(', ') },
              {
                key: 'progress',
                header: 'Progress Verified',
                render: (row) => {
                  const inScope = getInScopeAssets(row.scopeDept, row.scopeLoc);
                  const checked = Object.keys(row.results || {}).length;
                  const total = inScope.length;
                  const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
                  
                  return (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="h-1.5 w-16 bg-secondary-100 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="font-semibold text-secondary-600">{percent}%</span>
                    </div>
                  );
                },
              },
              {
                key: 'status',
                header: 'Status Badge',
                render: (row) => (
                  <Badge variant={row.status === 'Closed' ? 'secondary' : 'primary'}>{row.status}</Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Workspace link',
                render: (row) => (
                  <Button variant="ghost" size="sm" className="text-primary-600 font-semibold hover:bg-primary-50" onClick={() => setActiveCycleId(row.id)}>
                    {row.status === 'Closed' ? 'View Replay' : 'Perform Audit'}
                  </Button>
                ),
              },
            ]}
            data={cycles}
          />
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL CONFIGURATIONS */}
      {/* ---------------------------------------------------- */}

      {/* Create Cycle Modal Form */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Initiate New Audit Cycle"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSubmit}>
              Create Schema
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <Input
            label="Audit Cycle Name"
            name="name"
            placeholder="e.g. Q3 2026 Asset Inventory Check"
            required
            value={cycleForm.name}
            onChange={(e) => setCycleForm((prev) => ({ ...prev, name: e.target.value }))}
            error={createErrors.name}
            touched={!!createErrors.name}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              required
              value={cycleForm.startDate}
              onChange={(e) => setCycleForm((prev) => ({ ...prev, startDate: e.target.value }))}
              error={createErrors.startDate}
              touched={!!createErrors.startDate}
            />
            <Input
              label="End Date"
              name="endDate"
              type="date"
              required
              value={cycleForm.endDate}
              onChange={(e) => setCycleForm((prev) => ({ ...prev, endDate: e.target.value }))}
              error={createErrors.endDate}
              touched={!!createErrors.endDate}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department Scope"
              name="scopeDept"
              value={cycleForm.scopeDept}
              onChange={(e) => setCycleForm((prev) => ({ ...prev, scopeDept: e.target.value }))}
              options={[{ value: 'All', label: 'All Departments' }, ...departments.map((d) => ({ value: d.name, label: d.name }))]}
            />
            <Select
              label="Location Scope"
              name="scopeLoc"
              value={cycleForm.scopeLoc}
              onChange={(e) => setCycleForm((prev) => ({ ...prev, scopeLoc: e.target.value }))}
              options={[{ value: 'All', label: 'All Locations' }, ...locations.map((loc) => ({ value: loc, label: loc }))]}
            />
          </div>

          {/* Assigned Auditors (Note: Changes only made to Auditors in OrgSetup Employee Directory) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-secondary-750 uppercase">Assign Auditors</label>
            <div className="border border-secondary-200 rounded-lg p-3 max-h-[120px] overflow-y-auto space-y-1.5 bg-secondary-50/20">
              {availableAuditors.length === 0 ? (
                <span className="text-xs text-secondary-400 italic">
                  No Employees configured with the Auditor role. Promote users to Auditor first inside Org Setup.
                </span>
              ) : (
                availableAuditors.map((auditor) => (
                  <label key={auditor.id} className="flex items-center gap-2 text-xs text-secondary-750 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cycleForm.selectedAuditors.includes(auditor.name)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCycleForm((prev) => ({
                          ...prev,
                          selectedAuditors: checked
                            ? [...prev.selectedAuditors, auditor.name]
                            : prev.selectedAuditors.filter((name) => name !== auditor.name),
                        }));
                      }}
                      className="h-4 w-4 border-secondary-300 text-primary-600 focus:ring-primary-500 rounded"
                    />
                    {auditor.name} ({auditor.department})
                  </label>
                ))
              )}
            </div>
            {createErrors.selectedAuditors && (
              <span className="text-[10px] text-danger-600 font-semibold">{createErrors.selectedAuditors}</span>
            )}
          </div>
        </form>
      </Modal>

      {/* Close Cycle Confirmation Dialog */}
      <Modal
        isOpen={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        title="Lock Audit Cycle & Reconcile Statuses?"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsCloseConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleCloseCycleConfirm}>
              Lock Cycle
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-danger-50 border border-danger-100 p-4 rounded-xl flex gap-2.5 text-xs text-danger-700 leading-relaxed">
            <svg className="h-5 w-5 text-danger-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px]">Consequence Warning</p>
              <p className="mt-1 font-medium">
                Closing and locking this cycle is permanent and cannot be undone. All checking forms will be disabled.
              </p>
              <p className="mt-1 font-semibold">
                Missing assets will be marked 'Lost' in inventory. Damaged assets will be marked 'Under Maintenance' and repair requests raised.
              </p>
            </div>
          </div>
          <p className="text-xs text-secondary-500 leading-normal">
            Please make sure that all department verifications have been recorded before locking the cycle.
          </p>
        </div>
      </Modal>

    </div>
  );
};

export default AuditsPage;
