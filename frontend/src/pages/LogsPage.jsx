import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import Tabs from '../components/common/Tabs';
import Spinner from '../components/common/Spinner';
import { getNotifications, saveNotifications, getActivityLogs } from '../utils/mockDb';

export const LogsPage = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [isLoading, setIsLoading] = useState(false);

  // Database lists
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Filters: Notifications
  const [notifTypeFilter, setNotifTypeFilter] = useState('All');
  const [notifSearch, setNotifSearch] = useState('');

  // Filters: Activity Logs
  const [logActionFilter, setLogActionFilter] = useState('All');
  const [logActorSearch, setLogActorSearch] = useState('');

  // Pagination: Activity Logs
  const [currentPage, setCurrentPage] = useState(1);
  const LOGS_PER_PAGE = 8;

  // Load Data
  const loadData = () => {
    setNotifications(getNotifications());
    setActivityLogs(getActivityLogs());
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      loadData();
      setIsLoading(false);
    }, 450);

    // Listen to custom updates dispatched across the app
    window.addEventListener('assetflow-notifications-updated', loadData);
    window.addEventListener('assetflow-activity-logs-updated', loadData);

    return () => {
      window.removeEventListener('assetflow-notifications-updated', loadData);
      window.removeEventListener('assetflow-activity-logs-updated', loadData);
    };
  }, []);

  // ----------------------------------------------------
  // ACTION: NOTIFICATIONS READ TRANSITIONS
  // ----------------------------------------------------
  const handleMarkAsRead = (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  // Safe Date Formatting
  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return `${d.toISOString().split('T')[0]} ${d.toTimeString().split(' ')[0].slice(0, 5)}`;
    } catch {
      return isoString;
    }
  };

  // ----------------------------------------------------
  // FILTERING LOGIC: NOTIFICATIONS
  // ----------------------------------------------------
  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch = n.message.toLowerCase().includes(notifSearch.toLowerCase()) ||
                          n.type.toLowerCase().includes(notifSearch.toLowerCase());
    const matchesType = notifTypeFilter === 'All' || n.type === notifTypeFilter;
    return matchesSearch && matchesType;
  });

  // ----------------------------------------------------
  // FILTERING LOGIC: ACTIVITY LOGS
  // ----------------------------------------------------
  const filteredLogs = activityLogs.filter((l) => {
    const matchesActor = l.actor.toLowerCase().includes(logActorSearch.toLowerCase()) ||
                         l.entity.toLowerCase().includes(logActorSearch.toLowerCase());
    const matchesAction = logActionFilter === 'All' || l.action === logActionFilter;
    return matchesActor && matchesAction;
  });

  // Pagination for logs
  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 md:text-3xl">Activity Logs & Alerts</h1>
          <p className="text-sm text-secondary-500 mt-1">Review the historical system audit trail, event alerts, and operational tracking records.</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'notifications', label: `Event Alerts (${notifications.filter((n) => !n.read).length} Unread)` },
          { id: 'activity-logs', label: `System Audit Logs (${activityLogs.length})` },
        ]}
        activeTab={activeTab}
        onChange={(id) => {
          setActiveTab(id);
          setCurrentPage(1);
        }}
      />

      {isLoading ? (
        <div className="py-20 text-center">
          <Spinner size="lg" />
          <p className="text-sm text-secondary-400 mt-2">Loading system log indexes...</p>
        </div>
      ) : activeTab === 'notifications' ? (
        /* ---------------------------------------------------- */
        /* NOTIFICATIONS HUB TAB */
        /* ---------------------------------------------------- */
        <div className="flex flex-col gap-5">
          
          {/* Notifications Filter bar */}
          <Card className="p-4 border border-secondary-200 bg-white shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search alert messages..."
                  value={notifSearch}
                  onChange={(e) => setNotifSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 w-full bg-secondary-50 border border-secondary-200 rounded-lg text-sm text-secondary-750 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <Select
                name="notifType"
                value={notifTypeFilter}
                onChange={(e) => setNotifTypeFilter(e.target.value)}
                options={[
                  { value: 'All', label: 'All Event Categories' },
                  { value: 'Asset Assigned', label: 'Asset Assigned' },
                  { value: 'Asset Returned', label: 'Asset Returned' },
                  { value: 'Maintenance Requested', label: 'Maintenance Requested' },
                  { value: 'Maintenance Approved', label: 'Maintenance Approved' },
                  { value: 'Maintenance Resolved', label: 'Maintenance Resolved' },
                  { value: 'Maintenance Rejected', label: 'Maintenance Rejected' },
                  { value: 'Booking Confirmed', label: 'Booking Confirmed' },
                  { value: 'Booking Cancelled', label: 'Booking Cancelled' },
                  { value: 'Transfer Requested', label: 'Transfer Requested' },
                  { value: 'Transfer Approved', label: 'Transfer Approved' },
                  { value: 'Transfer Rejected', label: 'Transfer Rejected' },
                  { value: 'Overdue Return Alert', label: 'Overdue Return Alert' },
                  { value: 'Audit Cycle Created', label: 'Audit Cycle Created' },
                  { value: 'Audit Cycle Closed', label: 'Audit Cycle Closed' },
                  { value: 'System Update', label: 'System Update' },
                ]}
              />
            </div>

            {notifications.some((n) => !n.read) && (
              <Button size="sm" variant="secondary" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </Card>

          {/* Alerts Stack */}
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 border border-secondary-200 text-center bg-white shadow-sm">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-secondary-100 text-secondary-400 flex items-center justify-center mb-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-secondary-900 mb-0.5">No matching alerts</h3>
                <p className="text-[11px] text-secondary-500">There are no system notifications matching your filter settings.</p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all duration-200 flex justify-between items-start gap-4 ${
                    notif.read
                      ? 'bg-white border-secondary-200 text-secondary-600'
                      : 'bg-primary-50/15 border-primary-200 text-secondary-850 font-medium shadow-sm ring-1 ring-primary-500/5'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Visual Badge Indicator */}
                    <span className={`h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0 ${notif.read ? 'bg-secondary-200' : 'bg-primary-500 animate-pulse'}`} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-secondary-800 uppercase tracking-wide">{notif.type}</span>
                        <span className="text-[10px] text-secondary-400 font-mono font-semibold">{formatDateTime(notif.date)}</span>
                      </div>
                      <p className="text-xs leading-normal mt-1">{notif.message}</p>
                    </div>
                  </div>

                  {!notif.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-primary-600 font-semibold text-[11px] py-1 px-2 border border-secondary-200 hover:bg-secondary-50"
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      ) : (
        /* ---------------------------------------------------- */
        /* AUDIT TRAIL TABLE TAB */
        /* ---------------------------------------------------- */
        <div className="flex flex-col gap-5">
          
          {/* Logs Filter bar */}
          <Card className="p-4 border border-secondary-200 bg-white shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search actor or target..."
                value={logActorSearch}
                onChange={(e) => { setLogActorSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-4 py-1.5 w-full bg-secondary-50 border border-secondary-200 rounded-lg text-sm text-secondary-750 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            <Select
              name="logAction"
              value={logActionFilter}
              onChange={(e) => { setLogActionFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { value: 'All', label: 'All Action Operations' },
                { value: 'Register Asset', label: 'Register Asset' },
                { value: 'Allocate Asset', label: 'Allocate Asset' },
                { value: 'Request Transfer', label: 'Request Transfer' },
                { value: 'Approve Transfer', label: 'Approve Transfer' },
                { value: 'Reject Transfer', label: 'Reject Transfer' },
                { value: 'Return Asset', label: 'Return Asset' },
                { value: 'Book Resource', label: 'Book Resource' },
                { value: 'Cancel Booking', label: 'Cancel Booking' },
                { value: 'Raise Maintenance Request', label: 'Raise Maintenance Request' },
                { value: 'Approve Maintenance', label: 'Approve Maintenance' },
                { value: 'Reject Maintenance', label: 'Reject Maintenance' },
                { value: 'Start Repair', label: 'Start Repair' },
                { value: 'Resolve Maintenance', label: 'Resolve Maintenance' },
                { value: 'Create Audit Cycle', label: 'Create Audit Cycle' },
                { value: 'Close Audit Cycle', label: 'Close Audit Cycle' },
                { value: 'Promote Employee', label: 'Promote Employee' },
                { value: 'Modify Department', label: 'Modify Department' },
                { value: 'Modify Asset Category', label: 'Modify Asset Category' },
              ]}
            />
          </Card>

          {/* Audit trail table */}
          <div className="bg-white border border-secondary-200 rounded-xl overflow-hidden shadow-sm">
            <Table
              keyField="id"
              emptyMessage="No system audit logs found matching your filters."
              columns={[
                { key: 'date', header: 'Timestamp', render: (row) => <span className="font-mono font-semibold text-secondary-500">{formatDateTime(row.date)}</span> },
                { key: 'actor', header: 'Operator Account', render: (row) => <span className="font-bold text-secondary-800">{row.actor}</span> },
                { key: 'action', header: 'Operation', render: (row) => <Badge variant="secondary">{row.action}</Badge> },
                { key: 'entity', header: 'Entity Target Reference', render: (row) => <span className="font-mono font-medium text-secondary-750">{row.entity}</span> },
              ]}
              data={paginatedLogs}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-secondary-50/20 border-t border-secondary-200 flex justify-between items-center text-xs">
                <span className="text-secondary-400 font-medium">Page {currentPage} of {totalPages}</span>
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

        </div>
      )}

    </div>
  );
};

export default LogsPage;
