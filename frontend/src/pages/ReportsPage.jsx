import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { getAssets, getBookings, getMaintenance } from '../utils/mockDb';

export const ReportsPage = () => {
  // States
  const [assets, setAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');
  const [sortField, setSortField] = useState('daysRemaining');

  // Load Data
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setAssets(getAssets());
      setBookings(getBookings());
      setMaintenance(getMaintenance());
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // ----------------------------------------------------
  // DATA TRANSFORMATION: ASSET UTILIZATION
  // ----------------------------------------------------
  const getUtilizationData = () => {
    // Sourced by tracking booking frequency and allocation logs count
    return assets.map((asset) => {
      const bCount = bookings.filter((b) => b.assetTag === asset.tag && b.status !== 'Cancelled').length;
      const hCount = (asset.history || []).filter((h) => h.type === 'Allocation' || h.type === 'Transfer').length;
      return {
        tag: asset.tag,
        name: asset.name,
        count: bCount + hCount,
      };
    }).sort((a, b) => b.count - a.count);
  };

  // ----------------------------------------------------
  // DATA TRANSFORMATION: MAINTENANCE BY CATEGORY
  // ----------------------------------------------------
  const getMaintenanceFreqData = () => {
    const counts = {};
    maintenance.forEach((m) => {
      const asset = assets.find((a) => a.tag === m.assetTag);
      const cat = asset ? asset.category : 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([category, count]) => ({ category, count }));
  };

  // ----------------------------------------------------
  // DATA TRANSFORMATION: RETIREMENT LIST
  // ----------------------------------------------------
  const getRetirementData = () => {
    // Computes days remaining for service or retirement
    return assets.map((asset) => {
      let days = 365;
      if (asset.condition === 'New') days = 730;
      else if (asset.condition === 'Good') days = 480;
      else if (asset.condition === 'Fair') days = 180;
      else if (asset.condition === 'Poor') days = 45;
      else if (asset.condition === 'Damaged') days = 5;

      return {
        tag: asset.tag,
        name: asset.name,
        condition: asset.condition,
        daysRemaining: days,
      };
    }).sort((a, b) => {
      if (sortField === 'daysRemaining') return a.daysRemaining - b.daysRemaining;
      return a.name.localeCompare(b.name);
    });
  };

  // ----------------------------------------------------
  // DATA TRANSFORMATION: DEPARTMENT-WISE ALLOCATION
  // ----------------------------------------------------
  const getDeptAllocationData = () => {
    const counts = {
      'Engineering': 0,
      'Backend Development': 0,
      'Sales & Marketing': 0,
      'Finance & Operations': 0,
      'Unallocated (In Stock)': 0,
    };

    assets.forEach((asset) => {
      if (asset.status === 'Available' || asset.status === 'Under Maintenance') {
        counts['Unallocated (In Stock)'] += 1;
      } else {
        const dept = asset.department || 'Engineering'; // Fallback mapping
        counts[dept] = (counts[dept] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([dept, count]) => ({ dept, count }));
  };

  // ----------------------------------------------------
  // DATA TRANSFORMATION: RESOURCE BOOKING HEATMAP
  // ----------------------------------------------------
  const getHeatmapData = () => {
    // Days index 0-6 (Sun-Sat), Hours index 8-18 (8am to 6pm)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
    
    // Initialize empty grid matrix
    const matrix = {};
    days.forEach((d) => {
      matrix[d] = {};
      hours.forEach((h) => {
        matrix[d][h] = 0;
      });
    });

    // Populate matrix counts based on booking data
    bookings.forEach((b) => {
      if (b.status === 'Cancelled') return;
      
      const bDate = new Date(b.date);
      const dayName = days[bDate.getDay()];
      
      const startHour = parseInt(b.startTime.split(':')[0], 10);
      const endHour = parseInt(b.endTime.split(':')[0], 10);
      
      for (let h = startHour; h < endHour; h++) {
        if (matrix[dayName] && matrix[dayName][h] !== undefined) {
          matrix[dayName][h] += 1;
        }
      }
    });

    return { days, hours, matrix };
  };

  const utilizationData = getUtilizationData();
  const maintFreqData = getMaintenanceFreqData();
  const retirementData = getRetirementData();
  const deptData = getDeptAllocationData();
  const heatmap = getHeatmapData();

  const maxUtilVal = Math.max(...utilizationData.map((d) => d.count), 1);
  const maxMaintVal = Math.max(...maintFreqData.map((d) => d.count), 1);
  const maxDeptVal = Math.max(...deptData.map((d) => d.count), 1);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 md:text-3xl">Reports & Analytics</h1>
          <p className="text-sm text-secondary-500 mt-1">Review operational utilization metrics, maintenance forecasts, and booking heatmaps.</p>
        </div>

        <Button
          variant="secondary"
          onClick={() => alert('Operational Report Exported (visual stub)')}
          icon={
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          Export Report
        </Button>
      </div>

      {/* Date Filter Bar */}
      <Card className="p-4 border border-secondary-200 bg-white shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-secondary-500 uppercase tracking-wide">
          Filter Period:
        </div>
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <Input
            name="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            name="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </Card>

      {isLoading ? (
        /* Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 bg-white border border-secondary-200">
            <SkeletonLoader rows={4} />
          </Card>
          <Card className="p-5 bg-white border border-secondary-200">
            <SkeletonLoader rows={4} />
          </Card>
        </div>
      ) : (
        /* Charts Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Utilization */}
          <Card className="border border-secondary-200 p-5 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-secondary-800 text-sm mb-1">Asset Utilization</h3>
              <p className="text-[11px] text-secondary-400 mb-5">Handovers and calendar slot booking frequencies combined.</p>
            </div>
            
            <div className="space-y-3.5">
              {utilizationData.map((d) => (
                <div key={d.tag} className="flex items-center gap-3">
                  <div className="w-24 text-left">
                    <span className="font-mono font-bold text-xs text-secondary-800 block truncate">{d.tag}</span>
                    <span className="text-[10px] text-secondary-400 block truncate">{d.name}</span>
                  </div>
                  <div className="flex-1 bg-secondary-50 h-5.5 rounded-lg overflow-hidden relative border border-secondary-100 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 rounded-lg transition-all duration-700"
                      style={{ width: `${(d.count / maxUtilVal) * 100}%` }}
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-secondary-700">
                      {d.count} activities
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Chart 2: Maintenance Frequency */}
          <Card className="border border-secondary-200 p-5 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-secondary-800 text-sm mb-1">Maintenance Incident Frequency</h3>
              <p className="text-[11px] text-secondary-400 mb-5">Audit failures and breakdown tickets filed by asset category.</p>
            </div>

            {maintFreqData.length === 0 ? (
              <div className="text-center py-12 text-xs italic text-secondary-400">No maintenance records logged.</div>
            ) : (
              <div className="space-y-4">
                {maintFreqData.map((d) => (
                  <div key={d.category} className="flex items-center gap-3">
                    <span className="w-24 text-xs font-semibold text-secondary-650 truncate">{d.category}</span>
                    <div className="flex-1 bg-secondary-50 h-5.5 rounded-lg overflow-hidden relative border border-secondary-100 shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-warning-500 to-amber-400 rounded-lg transition-all duration-700"
                        style={{ width: `${(d.count / maxMaintVal) * 100}%` }}
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-secondary-700">
                        {d.count} tickets
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Chart 3: Department wise Allocations */}
          <Card className="border border-secondary-200 p-5 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-secondary-800 text-sm mb-1">Department Handovers Breakdown</h3>
              <p className="text-[11px] text-secondary-400 mb-5">Distribution share of allocated inventory assets across departments.</p>
            </div>

            <div className="space-y-4">
              {deptData.map((d) => (
                <div key={d.dept} className="flex items-center gap-3">
                  <span className="w-36 text-xs font-semibold text-secondary-650 truncate">{d.dept}</span>
                  <div className="flex-1 bg-secondary-50 h-5.5 rounded-lg overflow-hidden relative border border-secondary-100 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-accent-500 to-sky-400 rounded-lg transition-all duration-700"
                      style={{ width: `${(d.count / maxDeptVal) * 100}%` }}
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-secondary-700">
                      {d.count} items
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* List 4: Retirement Due List */}
          <Card className="border border-secondary-200 p-5 bg-white shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-secondary-800 text-sm mb-1">Retirement & Service Projections</h3>
                <p className="text-[11px] text-secondary-400">Inventory assets sorting by closest service check or retirement.</p>
              </div>
              <Select
                name="sortField"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                options={[
                  { value: 'daysRemaining', label: 'Days Remaining' },
                  { value: 'name', label: 'Asset Name' },
                ]}
              />
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {retirementData.map((asset) => (
                <div key={asset.tag} className="flex justify-between items-center p-2 rounded-lg bg-secondary-50 border border-secondary-100 text-xs">
                  <div>
                    <span className="font-semibold text-secondary-800 block">{asset.name}</span>
                    <span className="font-mono text-secondary-400 text-[10px] block">{asset.tag} · {asset.condition} condition</span>
                  </div>
                  <Badge variant={asset.daysRemaining < 30 ? 'danger' : asset.daysRemaining < 200 ? 'warning' : 'success'}>
                    {asset.daysRemaining} days left
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Heatmap 5: Booking Heatmap (Full width card) */}
          <Card className="lg:col-span-2 border border-secondary-200 p-5 bg-white shadow-sm">
            <div>
              <h3 className="font-bold text-secondary-800 text-sm mb-1">Shared Resource Booking Heatmap</h3>
              <p className="text-[11px] text-secondary-400 mb-5">Timeline reservation load frequency mapped by day of week and hour of day.</p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[600px] flex flex-col gap-1 text-[11px]">
                
                {/* Hours Header Row */}
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-12" /> {/* Empty corner block */}
                  {heatmap.hours.map((hour) => (
                    <div key={hour} className="flex-1 text-center font-semibold text-secondary-400">
                      {hour}:00
                    </div>
                  ))}
                </div>

                {/* Days Rows */}
                {heatmap.days.map((day) => (
                  <div key={day} className="flex items-center gap-1">
                    <div className="w-12 font-bold text-secondary-650 text-right pr-2">
                      {day}
                    </div>
                    {heatmap.hours.map((hour) => {
                      const count = heatmap.matrix[day][hour] || 0;
                      let bgClass = 'bg-secondary-50 hover:bg-secondary-100 border-secondary-200/40 text-secondary-300';
                      
                      if (count > 0 && count < 2) bgClass = 'bg-primary-500/10 border-primary-500/20 text-primary-600 font-semibold';
                      else if (count >= 2 && count < 3) bgClass = 'bg-primary-500/40 border-primary-500/30 text-white font-semibold';
                      else if (count >= 3) bgClass = 'bg-primary-600 border-primary-700 text-white font-bold animate-pulse-subtle';

                      return (
                        <div
                          key={hour}
                          title={`${count} booking(s) on ${day} at ${hour}:00`}
                          className={`flex-1 aspect-[2/1] rounded border text-[10px] flex items-center justify-center transition-all duration-200 cursor-help ${bgClass}`}
                        >
                          {count > 0 && count}
                        </div>
                      );
                    })}
                  </div>
                ))}

              </div>
            </div>

            <div className="flex justify-end gap-4 mt-4 text-[10px] text-secondary-400 font-semibold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-secondary-50 border border-secondary-200" />
                <span>0 Bookings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-primary-500/15 border border-primary-500/25" />
                <span>1 Booking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-primary-500/45 border border-primary-500/50" />
                <span>2 Bookings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-primary-600 border border-primary-700" />
                <span>3+ Peak Load</span>
              </div>
            </div>
          </Card>

        </div>
      )}

    </div>
  );
};

export default ReportsPage;
