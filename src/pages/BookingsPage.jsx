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
import { getAssets, getBookings, saveBookings, pushNotification, logActivity } from '../utils/mockDb';
import { hasOverlap } from '../utils/hasOverlap';
import { ROLES } from '../utils/constants';

export const BookingsPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const userEmail = user?.email || 's.connor@assetflow.com';
  const isAdminOrHead = [ROLES.ADMIN, ROLES.DEPARTMENT_HEAD].includes(user?.role);

  // States
  const [resources, setResources] = useState([]);
  const [selectedResourceTag, setSelectedResourceTag] = useState('');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'my-bookings'

  // Booking Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState({ date: '', startTime: '09:00', endTime: '10:00', purpose: '' });
  const [bookErrors, setBookErrors] = useState({});

  // View Details Modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Dynamic Dates for Week: Sunday July 12, 2026 to Saturday July 18, 2026
  const weekDays = [
    { name: 'Sunday', label: 'Sun', date: '2026-07-12' },
    { name: 'Monday', label: 'Mon', date: '2026-07-13' },
    { name: 'Tuesday', label: 'Tue', date: '2026-07-14' },
    { name: 'Wednesday', label: 'Wed', date: '2026-07-15' },
    { name: 'Thursday', label: 'Thu', date: '2026-07-16' },
    { name: 'Friday', label: 'Fri', date: '2026-07-17' },
    { name: 'Saturday', label: 'Sat', date: '2026-07-18' },
  ];

  // Load resources (assets flagged as shared) and bookings
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const allAssets = getAssets();
      // Filter only assets that are marked shared/bookable
      const shared = allAssets.filter((a) => a.shared === true);
      setResources(shared);
      if (shared.length > 0) {
        setSelectedResourceTag(shared[0].tag);
      }
      setBookings(getBookings());
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const selectedResource = resources.find((r) => r.tag === selectedResourceTag);

  // Helper to compute visual status dynamically based on current time
  const getBookingStatus = (booking) => {
    if (booking.status === 'Cancelled') return 'Cancelled';

    const todayStr = '2026-07-12'; // Simulated constant current date matching hackathon specs
    const currentTimeStr = '09:30'; // Simulated constant current time

    if (booking.date < todayStr) return 'Completed';
    if (booking.date > todayStr) return 'Upcoming';

    // Same date, evaluate hours
    if (currentTimeStr > booking.endTime) return 'Completed';
    if (currentTimeStr >= booking.startTime && currentTimeStr <= booking.endTime) return 'Ongoing';
    return 'Upcoming';
  };

  // ----------------------------------------------------
  // SUBMITS: BOOK RESOURCE
  // ----------------------------------------------------
  const handleOpenBookModal = (dateStr = '2026-07-12') => {
    setBookForm({
      date: dateStr,
      startTime: '09:00',
      endTime: '10:00',
      purpose: '',
    });
    setBookErrors({});
    setIsBookModalOpen(true);
  };

  const handleBookSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!bookForm.date) errors.date = 'Date is required';
    if (!bookForm.startTime) errors.startTime = 'Start time is required';
    if (!bookForm.endTime) errors.endTime = 'End time is required';
    if (!bookForm.purpose.trim()) errors.purpose = 'Purpose is required';

    if (bookForm.startTime >= bookForm.endTime) {
      errors.endTime = 'End time must be after start time';
    }

    // Overlap checks
    const activeBookingsForResource = bookings.filter(
      (b) => b.assetTag === selectedResourceTag && b.date === bookForm.date && b.status !== 'Cancelled'
    );

    const overlapCheck = hasOverlap(
      { startTime: bookForm.startTime, endTime: bookForm.endTime },
      activeBookingsForResource
    );

    if (overlapCheck) {
      errors.startTime = 'This overlaps with an existing booking slot on this date';
    }

    if (Object.keys(errors).length > 0) {
      setBookErrors(errors);
      return;
    }

    // TEMP: replace with real API call once backend is ready
    const newBooking = {
      id: String(Date.now()),
      assetTag: selectedResourceTag,
      user: user?.name || 'Sarah Connor',
      email: userEmail,
      date: bookForm.date,
      startTime: bookForm.startTime,
      endTime: bookForm.endTime,
      status: 'Upcoming',
      purpose: bookForm.purpose,
    };

    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    saveBookings(updatedBookings);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Booking confirmed for ${selectedResourceTag} at ${bookForm.startTime} - ${bookForm.endTime}.`, 'Booking Confirmed');
    logActivity(user?.name || 'Sarah Connor', 'Book Resource', selectedResourceTag);

    setIsBookModalOpen(false);
    showToast('success', `Slot booked successfully at ${bookForm.startTime} - ${bookForm.endTime}.`);
  };

  // ----------------------------------------------------
  // ACTIONS: CANCEL / RESCHEDULE
  // ----------------------------------------------------
  const handleOpenDetails = (booking) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const handleCancelBooking = (booking) => {
    // Permission check: only owner, Admin, or Dept Head
    const isOwner = booking.email === userEmail;
    if (!isOwner && !isAdminOrHead) {
      showToast('error', 'Only the booking creator or department managers can cancel slots.');
      return;
    }

    // TEMP: replace with real API call once backend is ready
    const updated = bookings.map((b) =>
      b.id === booking.id ? { ...b, status: 'Cancelled' } : b
    );
    setBookings(updated);
    saveBookings(updated);

    // PUSH NOTIFICATION & LOG
    pushNotification(`Booking cancelled for ${booking.assetTag} at ${booking.startTime} - ${booking.endTime}.`, 'Booking Cancelled');
    logActivity(user?.name || 'Sarah Connor', 'Cancel Booking', booking.assetTag);

    setIsDetailsOpen(false);
    showToast('warning', 'Booking cancelled.');
  };

  // Filter bookings for selected resource
  const resourceBookings = bookings.filter((b) => b.assetTag === selectedResourceTag);

  // Filter bookings for current logged in user
  const myBookings = bookings.filter((b) => b.email === userEmail);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 md:text-3xl">Shared Resource Calendar</h1>
          <p className="text-sm text-secondary-500 mt-1">Book conference rooms, department vehicles, and AV gear time slots.</p>
        </div>
        
        {/* Toggle between views */}
        <div className="flex bg-white border border-secondary-200 p-0.5 rounded-lg shadow-sm">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-premium ${viewMode === 'calendar' ? 'bg-secondary-100 text-secondary-800' : 'text-secondary-400 hover:text-secondary-600'}`}
          >
            Resource Scheduler
          </button>
          <button
            onClick={() => setViewMode('my-bookings')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-premium ${viewMode === 'my-bookings' ? 'bg-secondary-100 text-secondary-800' : 'text-secondary-400 hover:text-secondary-600'}`}
          >
            My Bookings ({myBookings.length})
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SCHEDULER VIEW */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Sidebar Resource Selector */}
          <Card className="col-span-1 border border-secondary-200 p-4 bg-white shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">Select Bookable Resource</h3>
            
            <div className="flex flex-col gap-2">
              {resources.length === 0 ? (
                <div className="text-center py-6 text-xs text-secondary-400 italic">
                  No bookable resources found. Register assets with the 'Shared Resource' switch.
                </div>
              ) : (
                resources.map((res) => (
                  <button
                    key={res.tag}
                    onClick={() => setSelectedResourceTag(res.tag)}
                    className={`w-full text-left p-3 rounded-lg border transition-premium text-sm flex flex-col gap-1 ${
                      selectedResourceTag === res.tag 
                        ? 'border-primary-500 bg-primary-50/10 shadow-sm' 
                        : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50/50'
                    }`}
                  >
                    <span className="font-semibold text-secondary-800 line-clamp-1">{res.name}</span>
                    <div className="flex justify-between items-center text-[10px] text-secondary-400 w-full mt-1">
                      <span className="font-mono">{res.tag}</span>
                      <span>{res.location}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Week Calendar Grid */}
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-4">
            {selectedResource ? (
              <>
                {/* Details header */}
                <div className="bg-white border border-secondary-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-secondary-800 text-sm">{selectedResource.name}</h3>
                    <p className="text-xs text-secondary-400 mt-0.5">Location: {selectedResource.location} | Serial: {selectedResource.serialNumber}</p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => handleOpenBookModal()}>
                    + Book Time Slot
                  </Button>
                </div>

                {/* Week Calendar Layout (Desktop) */}
                <div className="hidden md:grid grid-cols-7 gap-3 bg-white border border-secondary-200 rounded-xl p-4 shadow-sm min-h-[50vh] items-stretch">
                  {weekDays.map((day) => {
                    const dayBookings = resourceBookings.filter((b) => b.date === day.date);
                    
                    return (
                      <div key={day.date} className="flex flex-col border-r border-secondary-100 last:border-r-0 pr-1">
                        {/* Day Title */}
                        <div className="text-center pb-3 border-b border-secondary-100">
                          <span className="text-xs font-semibold text-secondary-400 block uppercase tracking-wide">{day.label}</span>
                          <span className={`text-base font-bold font-mono mt-0.5 block h-7 w-7 mx-auto rounded-full flex items-center justify-center ${
                            day.date === '2026-07-12' ? 'bg-primary-600 text-white shadow-sm font-bold' : 'text-secondary-800'
                          }`}>
                            {day.date.split('-')[2]}
                          </span>
                        </div>

                        {/* Slots */}
                        <div className="flex-1 flex flex-col gap-2.5 pt-3 overflow-y-auto max-h-[450px]">
                          {dayBookings.length === 0 ? (
                            <button
                              onClick={() => handleOpenBookModal(day.date)}
                              className="w-full py-4 rounded-lg border border-dashed border-secondary-200 text-[10px] text-secondary-400 hover:border-secondary-300 hover:bg-secondary-50 transition-premium font-semibold flex items-center justify-center"
                            >
                              + Free
                            </button>
                          ) : (
                            dayBookings.map((b) => {
                              const status = getBookingStatus(b);
                              let cardClass = 'bg-primary-50 border-primary-100 text-primary-750'; // Upcoming
                              
                              if (status === 'Ongoing') cardClass = 'bg-success-50 border-success-100 text-success-750 animate-pulse';
                              if (status === 'Completed') cardClass = 'bg-secondary-50 border-secondary-200 text-secondary-450';
                              if (status === 'Cancelled') cardClass = 'bg-danger-50/10 border-danger-100/50 text-danger-400/80 line-through';

                              return (
                                <div
                                  key={b.id}
                                  onClick={() => handleOpenDetails(b)}
                                  className={`p-2 rounded-lg border text-left cursor-pointer transition-premium text-xs ${cardClass}`}
                                >
                                  <span className="font-bold block tracking-tight font-mono">{b.startTime} - {b.endTime}</span>
                                  <span className="font-semibold block truncate mt-0.5">{b.purpose}</span>
                                  <span className="text-[10px] opacity-75 truncate block mt-0.5">{b.user}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Agenda List View */}
                <div className="block md:hidden space-y-4">
                  <h4 className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">Weekly Agenda List</h4>
                  
                  {weekDays.map((day) => {
                    const dayBookings = resourceBookings.filter((b) => b.date === day.date);
                    return (
                      <div key={day.date} className="bg-white border border-secondary-200 rounded-xl p-3.5 shadow-sm">
                        <div className="flex items-center justify-between border-b border-secondary-100 pb-2 mb-2">
                          <span className="text-xs font-bold text-secondary-800">{day.name}, {day.date}</span>
                          {day.date === '2026-07-12' && <Badge variant="primary">Today</Badge>}
                        </div>

                        <div className="flex flex-col gap-2">
                          {dayBookings.length === 0 ? (
                            <button
                              onClick={() => handleOpenBookModal(day.date)}
                              className="text-left py-2 px-3 bg-secondary-50 hover:bg-secondary-100 text-secondary-400 rounded-lg text-xs transition-premium font-medium"
                            >
                              + No bookings. Click to book a slot.
                            </button>
                          ) : (
                            dayBookings.map((b) => {
                              const status = getBookingStatus(b);
                              return (
                                <div
                                  key={b.id}
                                  onClick={() => handleOpenDetails(b)}
                                  className="flex items-center justify-between p-2.5 rounded-lg border border-secondary-100 hover:bg-secondary-50 transition-premium cursor-pointer text-xs"
                                >
                                  <div>
                                    <span className="font-mono font-bold text-secondary-800">{b.startTime} - {b.endTime}</span>
                                    <p className="font-semibold text-secondary-700 mt-0.5">{b.purpose}</p>
                                    <p className="text-[10px] text-secondary-400 mt-0.5">By {b.user}</p>
                                  </div>
                                  <Badge variant={status === 'Ongoing' ? 'success' : status === 'Cancelled' ? 'danger' : 'secondary'}>
                                    {status}
                                  </Badge>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </>
            ) : (
              <div className="text-center py-20 bg-white border border-secondary-200 rounded-xl shadow-sm">
                Choose a bookable resource asset to load the week scheduler.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MY BOOKINGS VIEW */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'my-bookings' && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-secondary-200">
            <h2 className="text-base font-bold text-secondary-900 font-semibold">My Active Bookings</h2>
          </div>

          <Table
            keyField="id"
            emptyMessage="You have not booked any shared resource slots yet."
            columns={[
              { key: 'date', header: 'Date', render: (row) => <span className="font-mono font-semibold text-secondary-800">{row.date}</span> },
              { key: 'time', header: 'Timeline Slot', render: (row) => <span className="font-mono font-semibold">{row.startTime} - {row.endTime}</span> },
              { key: 'assetTag', header: 'Resource Tag', render: (row) => <span className="font-mono font-semibold text-secondary-800">{row.assetTag}</span> },
              { key: 'purpose', header: 'Purpose of Booking' },
              {
                key: 'status',
                header: 'Status',
                render: (row) => {
                  const status = getBookingStatus(row);
                  let badgeVar = 'secondary';
                  if (status === 'Upcoming') badgeVar = 'primary';
                  else if (status === 'Ongoing') badgeVar = 'success';
                  else if (status === 'Cancelled') badgeVar = 'danger';
                  return <Badge variant={badgeVar}>{status}</Badge>;
                },
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => {
                  const status = getBookingStatus(row);
                  if (status === 'Cancelled' || status === 'Completed') return null;
                  return (
                    <Button variant="ghost" size="sm" className="text-danger-600 font-semibold" onClick={() => handleCancelBooking(row)}>
                      Cancel Booking
                    </Button>
                  );
                },
              },
            ]}
            data={myBookings}
          />
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODALS */}
      {/* ---------------------------------------------------- */}

      {/* Book time slot Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title={`Book Resource slot: ${selectedResource?.name}`}
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBookSubmit}>
              Reserve Slot
            </Button>
          </div>
        }
      >
        <form onSubmit={handleBookSubmit} className="flex flex-col gap-4">
          <Input
            label="Booking Calendar Date"
            name="date"
            type="date"
            required
            value={bookForm.date}
            onChange={(e) => setBookForm((prev) => ({ ...prev, date: e.target.value }))}
            error={bookErrors.date}
            touched={!!bookErrors.date}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              name="startTime"
              type="time"
              required
              value={bookForm.startTime}
              onChange={(e) => setBookForm((prev) => ({ ...prev, startTime: e.target.value }))}
              error={bookErrors.startTime}
              touched={!!bookErrors.startTime}
            />
            <Input
              label="End Time"
              name="endTime"
              type="time"
              required
              value={bookForm.endTime}
              onChange={(e) => setBookForm((prev) => ({ ...prev, endTime: e.target.value }))}
              error={bookErrors.endTime}
              touched={!!bookErrors.endTime}
            />
          </div>

          <Textarea
            label="Purpose / Notes of Reservation"
            name="purpose"
            required
            placeholder="e.g. Finance team sync review session..."
            value={bookForm.purpose}
            onChange={(e) => setBookForm((prev) => ({ ...prev, purpose: e.target.value }))}
            error={bookErrors.purpose}
            touched={!!bookErrors.purpose}
          />
        </form>
      </Modal>

      {/* Booking Details / Cancellation Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Resource Booking Details"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedBooking && !['Cancelled', 'Completed'].includes(getBookingStatus(selectedBooking)) && (
              <Button variant="danger" onClick={() => handleCancelBooking(selectedBooking)}>
                Cancel Booking
              </Button>
            )}
          </div>
        }
      >
        {selectedBooking && (
          <div className="space-y-4 text-sm text-secondary-650">
            <div className="bg-secondary-50 border border-secondary-200 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide block">Resource Tag</span>
                <span className="font-mono font-bold text-secondary-800">{selectedBooking.assetTag}</span>
              </div>
              <Badge variant={getBookingStatus(selectedBooking) === 'Ongoing' ? 'success' : 'secondary'}>
                {getBookingStatus(selectedBooking)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-semibold text-secondary-400 uppercase">Reserved Date</span>
                <p className="font-semibold text-secondary-800 mt-0.5 font-mono">{selectedBooking.date}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-secondary-400 uppercase">Reserved Timeline</span>
                <p className="font-semibold text-secondary-800 mt-0.5 font-mono">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-secondary-400 uppercase">Reserved By</span>
                <p className="font-semibold text-secondary-800 mt-0.5">{selectedBooking.user}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-secondary-400 uppercase">Contact Email</span>
                <p className="font-semibold text-secondary-800 mt-0.5 font-mono">{selectedBooking.email}</p>
              </div>
            </div>

            <div className="border-t border-secondary-100 pt-3.5 mt-2">
              <span className="text-[10px] font-semibold text-secondary-400 uppercase">Purpose of Booking</span>
              <p className="text-secondary-800 font-medium mt-1 leading-relaxed">{selectedBooking.purpose}</p>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default BookingsPage;
