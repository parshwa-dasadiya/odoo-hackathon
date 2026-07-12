import React, { useState, useEffect } from 'react';
import Tabs from '../components/common/Tabs';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Badge from '../components/common/Badge';
import { useNotification } from '../context/NotificationContext';
import {
  getDepartments,
  saveDepartments,
  getCategories,
  saveCategories,
  getEmployees,
  saveEmployees,
  pushNotification,
  logActivity,
} from '../utils/mockDb';
import { ROLES } from '../utils/constants';

export const OrgSetupPage = () => {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('departments');
  const [isLoading, setIsLoading] = useState(false);

  // Database states
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Search & Filter states
  const [deptSearch, setDeptSearch] = useState('');
  const [deptFilterStatus, setDeptFilterStatus] = useState('All');
  const [catSearch, setCatSearch] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const [empFilterDept, setEmpFilterDept] = useState('All');
  const [empFilterRole, setEmpFilterRole] = useState('All');

  // Modal control states
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Edit target states
  const [editingDept, setEditingDept] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [targetEmployee, setTargetEmployee] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', head: '', parentId: '', status: 'Active' });
  const [deptErrors, setDeptErrors] = useState({});
  const [catForm, setCatForm] = useState({ name: '', description: '', customFields: [] });
  const [catErrors, setCatErrors] = useState({});
  const [roleForm, setRoleForm] = useState({ role: '', department: '' });
  const [roleErrors, setRoleErrors] = useState({});

  // Pagination states
  const [deptPage, setDeptPage] = useState(1);
  const [catPage, setCatPage] = useState(1);
  const [empPage, setEmpPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Load initial data
  useEffect(() => {
    setIsLoading(true);
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setDepartments(getDepartments());
      setCategories(getCategories());
      setEmployees(getEmployees());
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Helper: Get Breadcrumb path for Department
  const getDeptBreadcrumb = (dept, allDeps = departments) => {
    if (!dept.parentId) return dept.name;
    const parent = allDeps.find((d) => d.id === dept.parentId);
    if (!parent) return dept.name;
    return `${getDeptBreadcrumb(parent, allDeps)} > ${dept.name}`;
  };

  // ----------------------------------------------------
  // TAB A: DEPARTMENT MANAGEMENT SUBMITS
  // ----------------------------------------------------
  const handleOpenDeptModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({
        name: dept.name,
        head: dept.head,
        parentId: dept.parentId || '',
        status: dept.status,
      });
    } else {
      setEditingDept(null);
      setDeptForm({ name: '', head: '', parentId: '', status: 'Active' });
    }
    setDeptErrors({});
    setIsDeptModalOpen(true);
  };

  const handleDeptSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!deptForm.name.trim()) errors.name = 'Department Name is required';
    
    // Client-side duplicate check
    const isDuplicate = departments.some(
      (d) =>
        d.name.toLowerCase() === deptForm.name.trim().toLowerCase() &&
        (!editingDept || d.id !== editingDept.id)
    );
    if (isDuplicate) errors.name = 'A department with this name already exists';

    // Prevent circular descendant link (TODO: dynamic recursive descendant checks once nested depth > 2 is implemented)
    if (editingDept && deptForm.parentId === editingDept.id) {
      errors.parentId = 'A department cannot be its own parent';
    }

    if (Object.keys(errors).length > 0) {
      setDeptErrors(errors);
      return;
    }

    // TEMP: replace with real API call once backend is ready
    let updatedDeps;
    const parentDept = departments.find((d) => d.id === deptForm.parentId);
    const parentName = parentDept ? parentDept.name : '';

    if (editingDept) {
      updatedDeps = departments.map((d) =>
        d.id === editingDept.id
          ? { ...d, name: deptForm.name, head: deptForm.head, parentId: deptForm.parentId, parentName, status: deptForm.status }
          : d
      );
      showToast('success', `Department "${deptForm.name}" updated successfully.`);
    } else {
      const newDept = {
        id: String(Date.now()),
        name: deptForm.name,
        head: deptForm.head,
        parentId: deptForm.parentId,
        parentName,
        status: deptForm.status,
      };
      updatedDeps = [...departments, newDept];
      showToast('success', `Department "${deptForm.name}" registered successfully.`);
    }

    setDepartments(updatedDeps);
    saveDepartments(updatedDeps);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Department "${deptForm.name}" registered/modified. Head: ${deptForm.head || 'none'}.`, 'System Update');
    logActivity('Admin', 'Modify Department', deptForm.name);

    setIsDeptModalOpen(false);
  };

  const toggleDeptStatus = (dept) => {
    const updatedStatus = dept.status === 'Active' ? 'Inactive' : 'Active';
    // TEMP: replace with real API call once backend is ready
    const updatedDeps = departments.map((d) =>
      d.id === dept.id ? { ...d, status: updatedStatus } : d
    );
    setDepartments(updatedDeps);
    saveDepartments(updatedDeps);
    showToast('info', `Department "${dept.name}" status set to ${updatedStatus}.`);
  };

  // ----------------------------------------------------
  // TAB B: ASSET CATEGORY MANAGEMENT SUBMITS
  // ----------------------------------------------------
  const handleOpenCatModal = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({
        name: cat.name,
        description: cat.description,
        customFields: cat.customFields ? [...cat.customFields] : [],
      });
    } else {
      setEditingCat(null);
      setCatForm({ name: '', description: '', customFields: [] });
    }
    setCatErrors({});
    setIsCatModalOpen(true);
  };

  const handleAddField = () => {
    setCatForm((prev) => ({
      ...prev,
      customFields: [...prev.customFields, { name: '', type: 'Text' }],
    }));
  };

  const handleRemoveField = (idx) => {
    setCatForm((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== idx),
    }));
  };

  const handleFieldChange = (idx, field, val) => {
    const updatedFields = catForm.customFields.map((f, i) =>
      i === idx ? { ...f, [field]: val } : f
    );
    setCatForm((prev) => ({ ...prev, customFields: updatedFields }));
  };

  const handleCatSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!catForm.name.trim()) errors.name = 'Category Name is required';

    const isDuplicate = categories.some(
      (c) =>
        c.name.toLowerCase() === catForm.name.trim().toLowerCase() &&
        (!editingCat || c.id !== editingCat.id)
    );
    if (isDuplicate) errors.name = 'A category with this name already exists';

    // Verify field rows
    catForm.customFields.forEach((f, i) => {
      if (!f.name.trim()) {
        errors[`field_${i}`] = 'Field Name is required';
      }
    });

    if (Object.keys(errors).length > 0) {
      setCatErrors(errors);
      return;
    }

    // TEMP: replace with real API call once backend is ready
    let updatedCats;
    if (editingCat) {
      updatedCats = categories.map((c) =>
        c.id === editingCat.id
          ? { ...c, name: catForm.name, description: catForm.description, customFields: catForm.customFields }
          : c
      );
      showToast('success', `Category "${catForm.name}" updated.`);
    } else {
      const newCat = {
        id: String(Date.now()),
        name: catForm.name,
        description: catForm.description,
        customFields: catForm.customFields,
      };
      updatedCats = [...categories, newCat];
      showToast('success', `Category "${catForm.name}" created.`);
    }

    setCategories(updatedCats);
    saveCategories(updatedCats);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Asset Category "${catForm.name}" registered/modified in schemas.`, 'System Update');
    logActivity('Admin', 'Modify Asset Category', catForm.name);

    setIsCatModalOpen(false);
  };

  const handleDeleteCat = (cat) => {
    setConfirmAction({
      type: 'delete_cat',
      data: cat,
      message: `Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`,
    });
    setIsConfirmOpen(true);
  };

  // ----------------------------------------------------
  // TAB C: EMPLOYEE DIRECTORY SUBMITS
  // ----------------------------------------------------
  const handleOpenRoleModal = (emp) => {
    setTargetEmployee(emp);
    setRoleForm({
      role: emp.role || 'Employee',
      department: emp.department || '',
    });
    setRoleErrors({});
    setIsRoleModalOpen(true);
  };

  const handleRoleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!roleForm.role) errors.role = 'Role is required';
    if (!roleForm.department) errors.department = 'Department allocation is required';

    if (Object.keys(errors).length > 0) {
      setRoleErrors(errors);
      return;
    }

    // TEMP: replace with real API call once backend is ready
    const updatedEmps = employees.map((emp) =>
      emp.id === targetEmployee.id
        ? { ...emp, role: roleForm.role, department: roleForm.department }
        : emp
    );
    setEmployees(updatedEmps);
    saveEmployees(updatedEmps);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Employee ${targetEmployee.name} role changed to ${roleForm.role} in department ${roleForm.department}.`, 'System Update');
    logActivity('Admin', 'Promote Employee', `${targetEmployee.name} -> ${roleForm.role}`);

    setIsRoleModalOpen(false);
    showToast('success', `Updated ${targetEmployee.name} to ${roleForm.role} in ${roleForm.department}.`);
  };

  const handleToggleEmployeeStatus = (emp) => {
    const isActivating = emp.status !== 'Active';

    if (isActivating) {
      // Direct activate
      const updatedEmps = employees.map((e) =>
        e.id === emp.id ? { ...e, status: 'Active' } : e
      );
      setEmployees(updatedEmps);
      saveEmployees(updatedEmps);
      showToast('success', `Access restored for ${emp.name}.`);
    } else {
      // Warn first
      setConfirmAction({
        type: 'deactivate_emp',
        data: emp,
        message: `This will revoke login access for ${emp.name} immediately. Continue?`,
      });
      setIsConfirmOpen(true);
    }
  };

  // Central Confirm Action Handler
  const handleConfirmSubmit = () => {
    if (!confirmAction) return;

    // TEMP: replace with real API call once backend is ready
    if (confirmAction.type === 'delete_cat') {
      const updatedCats = categories.filter((c) => c.id !== confirmAction.data.id);
      setCategories(updatedCats);
      saveCategories(updatedCats);
      showToast('success', `Category "${confirmAction.data.name}" deleted.`);
    } else if (confirmAction.type === 'deactivate_emp') {
      const updatedEmps = employees.map((e) =>
        e.id === confirmAction.data.id ? { ...e, status: 'Inactive' } : e
      );
      setEmployees(updatedEmps);
      saveEmployees(updatedEmps);
      showToast('warning', `Revoked access for ${confirmAction.data.name}.`);
    }

    setIsConfirmOpen(false);
    setConfirmAction(null);
  };

  // Filter lists
  const filteredDepartments = departments.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(deptSearch.toLowerCase()) || 
                          d.head.toLowerCase().includes(deptSearch.toLowerCase());
    const matchesFilter = deptFilterStatus === 'All' || d.status === deptFilterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredCategories = categories.filter((c) => {
    return c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
           c.description.toLowerCase().includes(catSearch.toLowerCase());
  });

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
                          e.email.toLowerCase().includes(empSearch.toLowerCase());
    const matchesDept = empFilterDept === 'All' || e.department === empFilterDept;
    const matchesRole = empFilterRole === 'All' || e.role === empFilterRole;
    return matchesSearch && matchesDept && matchesRole;
  });

  // Pages calculations
  const totalDeptPages = Math.ceil(filteredDepartments.length / ITEMS_PER_PAGE) || 1;
  const paginatedDepts = filteredDepartments.slice((deptPage - 1) * ITEMS_PER_PAGE, deptPage * ITEMS_PER_PAGE);

  const totalCatPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE) || 1;
  const paginatedCats = filteredCategories.slice((catPage - 1) * ITEMS_PER_PAGE, catPage * ITEMS_PER_PAGE);

  const totalEmpPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE) || 1;
  const paginatedEmps = filteredEmployees.slice((empPage - 1) * ITEMS_PER_PAGE, empPage * ITEMS_PER_PAGE);

  // Tabs layout mappings
  const setupTabs = [
    { id: 'departments', label: 'Department Setup' },
    { id: 'categories', label: 'Asset Categories' },
    { id: 'employees', label: 'Employee Directory' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 md:text-3xl">Organization Setup</h1>
          <p className="text-sm text-secondary-500 mt-1">Configure your corporate workspace settings, custom assets schema, and RBAC directory.</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={setupTabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); }} />

      {/* ---------------------------------------------------- */}
      {/* TAB A: DEPARTMENT MANAGEMENT PANEL */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'departments' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-secondary-200 p-4 rounded-xl shadow-sm">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={deptSearch}
                  onChange={(e) => { setDeptSearch(e.target.value); setDeptPage(1); }}
                  className="pl-9 pr-4 py-1.5 w-full bg-secondary-50 border border-secondary-200 rounded-lg text-sm text-secondary-750 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <Select
                name="deptStatusFilter"
                value={deptFilterStatus}
                onChange={(e) => { setDeptFilterStatus(e.target.value); setDeptPage(1); }}
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Active', label: 'Active Only' },
                  { value: 'Inactive', label: 'Inactive Only' },
                ]}
                className="max-w-[150px]"
              />
            </div>
            <Button
              variant="primary"
              onClick={() => handleOpenDeptModal()}
              className="w-full sm:w-auto"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Department
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table
              loading={isLoading}
              emptyMessage="No departments matching this filter setup yet."
              columns={[
                { key: 'name', header: 'Name', render: (row) => <span className="font-semibold text-secondary-800">{row.name}</span> },
                { key: 'parent', header: 'Hierarchy Tree', render: (row) => <span className="text-xs font-mono text-secondary-550">{getDeptBreadcrumb(row)}</span> },
                { key: 'head', header: 'Department Head', render: (row) => row.head || <span className="text-xs text-secondary-400 italic">None assigned</span> },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <Badge variant={row.status === 'Active' ? 'success' : 'secondary'}>{row.status}</Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDeptModal(row)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={row.status === 'Active' ? 'text-warning-600 hover:bg-warning-50' : 'text-success-600 hover:bg-success-50'}
                        onClick={() => toggleDeptStatus(row)}
                      >
                        {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={paginatedDepts}
            />
          </div>

          {/* Mobile Stacked Card View */}
          <div className="block md:hidden space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-secondary-400">Loading departments...</div>
            ) : paginatedDepts.length === 0 ? (
              <div className="text-center py-8 text-secondary-400">No departments found.</div>
            ) : (
              paginatedDepts.map((row) => (
                <div key={row.id} className="bg-white border border-secondary-200 p-4 rounded-xl shadow-sm flex flex-col gap-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-secondary-900">{row.name}</h3>
                      <p className="text-[11px] text-secondary-400 mt-0.5">{getDeptBreadcrumb(row)}</p>
                    </div>
                    <Badge variant={row.status === 'Active' ? 'success' : 'secondary'}>{row.status}</Badge>
                  </div>
                  <div className="text-xs text-secondary-650">
                    <span className="font-semibold text-secondary-500 uppercase tracking-wider text-[10px] block mb-0.5">Manager</span>
                    {row.head || 'None assigned'}
                  </div>
                  <div className="border-t border-secondary-100 pt-2.5 mt-1 flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenDeptModal(row)}>
                      Edit
                    </Button>
                    <Button
                      variant={row.status === 'Active' ? 'ghost' : 'primary'}
                      size="sm"
                      className={row.status === 'Active' ? 'text-warning-600' : ''}
                      onClick={() => toggleDeptStatus(row)}
                    >
                      {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalDeptPages > 1 && (
            <div className="flex justify-between items-center p-4 bg-white border border-secondary-200 rounded-xl shadow-sm text-xs">
              <span className="text-secondary-500">Page {deptPage} of {totalDeptPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={deptPage === 1} onClick={() => setDeptPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="secondary" disabled={deptPage === totalDeptPages} onClick={() => setDeptPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB B: ASSET CATEGORY MANAGEMENT PANEL */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'categories' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-secondary-200 p-4 rounded-xl shadow-sm">
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search categories..."
                value={catSearch}
                onChange={(e) => { setCatSearch(e.target.value); setCatPage(1); }}
                className="pl-9 pr-4 py-1.5 w-full bg-secondary-50 border border-secondary-200 rounded-lg text-sm text-secondary-755 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <Button
              variant="primary"
              onClick={() => handleOpenCatModal()}
              className="w-full sm:w-auto"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Category
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table
              loading={isLoading}
              emptyMessage="No custom asset categories declared yet."
              columns={[
                { key: 'name', header: 'Category Name', render: (row) => <span className="font-semibold text-secondary-800">{row.name}</span> },
                { key: 'description', header: 'Description', render: (row) => <span className="text-secondary-500 line-clamp-1">{row.description || '—'}</span> },
                {
                  key: 'customFields',
                  header: 'Custom Fields Schema',
                  render: (row) => {
                    const count = row.customFields ? row.customFields.length : 0;
                    return count > 0 ? (
                      <span className="text-xs font-semibold bg-primary-50 border border-primary-100 text-primary-650 px-2 py-0.5 rounded-full">
                        {count} custom fields defined
                      </span>
                    ) : (
                      <span className="text-xs text-secondary-400 italic">No custom fields</span>
                    );
                  },
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenCatModal(row)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-danger-600 hover:bg-danger-50" onClick={() => handleDeleteCat(row)}>
                        Delete
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={paginatedCats}
            />
          </div>

          {/* Mobile Stacked Card View */}
          <div className="block md:hidden space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-secondary-400">Loading categories...</div>
            ) : paginatedCats.length === 0 ? (
              <div className="text-center py-8 text-secondary-400">No categories found.</div>
            ) : (
              paginatedCats.map((row) => (
                <div key={row.id} className="bg-white border border-secondary-200 p-4 rounded-xl shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-secondary-900">{row.name}</h3>
                    <Badge variant="accent">{(row.customFields || []).length} Fields</Badge>
                  </div>
                  <p className="text-xs text-secondary-500 mt-0.5">{row.description || 'No description provided'}</p>
                  <div className="border-t border-secondary-100 pt-2.5 mt-2 flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenCatModal(row)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-danger-600" onClick={() => handleDeleteCat(row)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalCatPages > 1 && (
            <div className="flex justify-between items-center p-4 bg-white border border-secondary-200 rounded-xl shadow-sm text-xs">
              <span className="text-secondary-500">Page {catPage} of {totalCatPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={catPage === 1} onClick={() => setCatPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="secondary" disabled={catPage === totalCatPages} onClick={() => setCatPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB C: EMPLOYEE DIRECTORY PANEL */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'employees' && (
        <div className="flex flex-col gap-4">
          {/* Filters card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-secondary-200 p-4 rounded-xl shadow-sm">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name/email..."
                value={empSearch}
                onChange={(e) => { setEmpSearch(e.target.value); setEmpPage(1); }}
                className="pl-9 pr-4 py-1.5 w-full bg-secondary-50 border border-secondary-200 rounded-lg text-sm text-secondary-750 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            
            <Select
              name="empDeptFilter"
              value={empFilterDept}
              onChange={(e) => { setEmpFilterDept(e.target.value); setEmpPage(1); }}
              options={[
                { value: 'All', label: 'All Departments' },
                ...departments.map((d) => ({ value: d.name, label: d.name })),
              ]}
            />
            
            <Select
              name="empRoleFilter"
              value={empFilterRole}
              onChange={(e) => { setEmpFilterRole(e.target.value); setEmpPage(1); }}
              options={[
                { value: 'All', label: 'All Roles' },
                { value: ROLES.ADMIN, label: ROLES.ADMIN },
                { value: ROLES.ASSET_MANAGER, label: ROLES.ASSET_MANAGER },
                { value: ROLES.DEPARTMENT_HEAD, label: ROLES.DEPARTMENT_HEAD },
                { value: ROLES.EMPLOYEE, label: ROLES.EMPLOYEE },
                { value: ROLES.AUDITOR, label: ROLES.AUDITOR },
              ]}
            />
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table
              loading={isLoading}
              emptyMessage="No employees matching this criteria set."
              columns={[
                { key: 'name', header: 'Name', render: (row) => <span className="font-semibold text-secondary-800">{row.name}</span> },
                { key: 'email', header: 'Email Address', render: (row) => <span className="text-secondary-500 text-xs font-mono">{row.email}</span> },
                { key: 'department', header: 'Department', render: (row) => row.department || <span className="text-secondary-400 italic">Unassigned</span> },
                {
                  key: 'role',
                  header: 'System Role',
                  render: (row) => {
                    let roleVariant = 'secondary';
                    if (row.role === ROLES.ADMIN) roleVariant = 'primary';
                    else if (row.role === ROLES.ASSET_MANAGER) roleVariant = 'accent';
                    else if (row.role === ROLES.DEPARTMENT_HEAD) roleVariant = 'warning';
                    else if (row.role === ROLES.AUDITOR) roleVariant = 'success';
                    return <Badge variant={roleVariant}>{row.role}</Badge>;
                  },
                },
                {
                  key: 'status',
                  header: 'Account Status',
                  render: (row) => (
                    <Badge variant={row.status === 'Active' ? 'success' : 'danger'}>{row.status}</Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenRoleModal(row)}>
                        Promote / Change Role
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={row.status === 'Active' ? 'text-danger-600 hover:bg-danger-50' : 'text-success-600 hover:bg-success-50'}
                        onClick={() => handleToggleEmployeeStatus(row)}
                      >
                        {row.status === 'Active' ? 'Deactivate' : 'Restore'}
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={paginatedEmps}
            />
          </div>

          {/* Mobile Stacked Cards */}
          <div className="block md:hidden space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-secondary-400">Loading directory...</div>
            ) : paginatedEmps.length === 0 ? (
              <div className="text-center py-8 text-secondary-400">No employees found.</div>
            ) : (
              paginatedEmps.map((row) => (
                <div key={row.id} className="bg-white border border-secondary-200 p-4 rounded-xl shadow-sm flex flex-col gap-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-secondary-900">{row.name}</h3>
                      <p className="text-[11px] text-secondary-400 font-mono mt-0.5">{row.email}</p>
                    </div>
                    <Badge variant={row.status === 'Active' ? 'success' : 'danger'}>{row.status}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-secondary-100 mt-1">
                    <div>
                      <span className="font-semibold text-secondary-500 uppercase tracking-wider text-[9px] block mb-0.5">Department</span>
                      {row.department || 'Unassigned'}
                    </div>
                    <div>
                      <span className="font-semibold text-secondary-500 uppercase tracking-wider text-[9px] block mb-0.5">System Role</span>
                      <span className="font-medium text-secondary-800">{row.role}</span>
                    </div>
                  </div>

                  <div className="border-t border-secondary-100 pt-2.5 mt-1.5 flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenRoleModal(row)}>
                      Promote
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={row.status === 'Active' ? 'text-danger-600' : 'text-success-600'}
                      onClick={() => handleToggleEmployeeStatus(row)}
                    >
                      {row.status === 'Active' ? 'Deactivate' : 'Restore'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalEmpPages > 1 && (
            <div className="flex justify-between items-center p-4 bg-white border border-secondary-200 rounded-xl shadow-sm text-xs">
              <span className="text-secondary-500">Page {empPage} of {totalEmpPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={empPage === 1} onClick={() => setEmpPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="secondary" disabled={empPage === totalEmpPages} onClick={() => setEmpPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL WINDOWS */}
      {/* ---------------------------------------------------- */}

      {/* Add/Edit Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title={editingDept ? 'Edit Department Details' : 'Add New Department'}
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDeptSubmit}>
              {editingDept ? 'Save Changes' : 'Register Department'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleDeptSubmit} className="flex flex-col gap-4">
          <Input
            label="Department Name"
            name="name"
            placeholder="e.g. Finance & Billing"
            required
            value={deptForm.name}
            onChange={(e) => setDeptForm((prev) => ({ ...prev, name: e.target.value }))}
            error={deptErrors.name}
            touched={!!deptErrors.name}
          />

          <Select
            label="Parent Department (Optional)"
            name="parentId"
            placeholder="No parent (Top-level)"
            value={deptForm.parentId}
            onChange={(e) => setDeptForm((prev) => ({ ...prev, parentId: e.target.value }))}
            error={deptErrors.parentId}
            touched={!!deptErrors.parentId}
            options={departments
              .filter((d) => !editingDept || d.id !== editingDept.id) // Prevent loop back
              .map((d) => ({ value: d.id, label: d.name }))}
          />

          <Select
            label="Department Head Manager"
            name="head"
            placeholder="Choose employee manager..."
            value={deptForm.head}
            onChange={(e) => setDeptForm((prev) => ({ ...prev, head: e.target.value }))}
            options={employees.map((e) => ({ value: e.name, label: e.name }))}
          />

          <Select
            label="Operating Status"
            name="status"
            value={deptForm.status}
            onChange={(e) => setDeptForm((prev) => ({ ...prev, status: e.target.value }))}
            options={[
              { value: 'Active', label: 'Active (Permits asset handovers)' },
              { value: 'Inactive', label: 'Inactive (Locks routing checks)' },
            ]}
          />
        </form>
      </Modal>

      {/* Add/Edit Asset Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCat ? 'Modify Category Settings' : 'Create Custom Asset Category'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsCatModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCatSubmit}>
              {editingCat ? 'Save Structure' : 'Create Schema'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCatSubmit} className="flex flex-col gap-4">
          <Input
            label="Category Title"
            name="name"
            placeholder="e.g. Tablets"
            required
            value={catForm.name}
            onChange={(e) => setCatForm((prev) => ({ ...prev, name: e.target.value }))}
            error={catErrors.name}
            touched={!!catErrors.name}
          />

          <Textarea
            label="Functional Description"
            name="description"
            placeholder="Define what assets belong to this schema group..."
            value={catForm.description}
            onChange={(e) => setCatForm((prev) => ({ ...prev, description: e.target.value }))}
          />

          <div className="border-t border-secondary-100 pt-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-secondary-700 uppercase tracking-wide">
                Custom Specification Fields (Repeatable Rows)
              </span>
              <Button size="sm" variant="secondary" onClick={handleAddField}>
                + Add Field Schema
              </Button>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[30vh] overflow-y-auto pr-1">
              {catForm.customFields.length === 0 ? (
                <div className="text-center py-4 bg-secondary-50 border border-dashed border-secondary-200 rounded-lg text-xs text-secondary-400 italic">
                  No specs defined yet. Assets created under this category will use default info.
                </div>
              ) : (
                catForm.customFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-secondary-50 border border-secondary-200 p-2.5 rounded-lg text-sm relative">
                    <Input
                      name={`fieldname_${idx}`}
                      placeholder="e.g. Serial Model"
                      value={field.name}
                      onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                      className="flex-1"
                      error={catErrors[`field_${idx}`]}
                      touched={!!catErrors[`field_${idx}`]}
                    />
                    <Select
                      name={`fieldtype_${idx}`}
                      value={field.type}
                      onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                      options={[
                        { value: 'Text', label: 'Plain Text' },
                        { value: 'Number', label: 'Numeric Int' },
                        { value: 'Date', label: 'Calendar Date' },
                      ]}
                      className="max-w-[130px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveField(idx)}
                      className="text-danger-500 hover:text-danger-700 p-1.5 rounded-lg hover:bg-danger-50 transition-premium"
                      aria-label="Remove spec field row"
                    >
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Promotion / Change Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Promote User & Upgrade Role Permissions"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRoleSubmit}>
              Apply Role Changes
            </Button>
          </div>
        }
      >
        {targetEmployee && (
          <form onSubmit={handleRoleSubmit} className="flex flex-col gap-4">
            
            {/* Warning Note */}
            <div className="bg-warning-50 border border-warning-100 p-3 rounded-lg flex items-start gap-2.5 text-xs text-warning-800">
              <svg className="h-4.5 w-4.5 text-warning-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Security Warning</p>
                <p className="mt-0.5 leading-relaxed">
                  Role changes here take effect immediately and affect what this user can access across the AssetFlow application shell routes.
                </p>
              </div>
            </div>

            <div className="text-sm border border-secondary-200 p-3 rounded-lg bg-secondary-50">
              <span className="font-semibold text-secondary-500 uppercase tracking-wider text-[10px] block mb-0.5">Target Employee</span>
              <p className="font-bold text-secondary-900">{targetEmployee.name}</p>
              <p className="text-xs text-secondary-500 font-mono mt-0.5">{targetEmployee.email}</p>
            </div>

            <Select
              label="Select System Permission Role"
              name="role"
              required
              value={roleForm.role}
              onChange={(e) => setRoleForm((prev) => ({ ...prev, role: e.target.value }))}
              error={roleErrors.role}
              touched={!!roleErrors.role}
              options={[
                { value: ROLES.ADMIN, label: `${ROLES.ADMIN} (Universal setup override)` },
                { value: ROLES.ASSET_MANAGER, label: `${ROLES.ASSET_MANAGER} (Manage inventory directories)` },
                { value: ROLES.DEPARTMENT_HEAD, label: `${ROLES.DEPARTMENT_HEAD} (Approve department logs)` },
                { value: ROLES.EMPLOYEE, label: `${ROLES.EMPLOYEE} (Book resources & view allocations)` },
                { value: ROLES.AUDITOR, label: `${ROLES.AUDITOR} (View historical trail & check logs)` },
              ]}
            />

            <Select
              label="Assign Primary Department"
              name="department"
              required
              value={roleForm.department}
              onChange={(e) => setRoleForm((prev) => ({ ...prev, department: e.target.value }))}
              error={roleErrors.department}
              touched={!!roleErrors.department}
              placeholder="Choose target department..."
              options={departments.map((d) => ({ value: d.name, label: d.name }))}
            />
          </form>
        )}
      </Modal>

      {/* Central Confirm dialog */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirm Destructive Action"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmSubmit}>
              Yes, Continue
            </Button>
          </div>
        }
      >
        <p className="text-sm text-secondary-650 leading-relaxed">
          {confirmAction?.message}
        </p>
      </Modal>

    </div>
  );
};

export default OrgSetupPage;
