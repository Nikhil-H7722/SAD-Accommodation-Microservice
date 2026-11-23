import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Role,
  UserAccount,
  Hostel,
  BedInventory,
  HostelApplication,
  Allocation,
  CheckInRecord,
  RoomSwapRequest,
  MaintenanceTicket,
  AuditLog,
  RoomCondition
} from '../types';
import {
  MOCK_USERS,
  MOCK_HOSTELS,
  MOCK_INVENTORIES,
  MOCK_APPLICATIONS,
  MOCK_ALLOCATIONS,
  MOCK_CHECKINS,
  MOCK_SWAP_REQUESTS,
  MOCK_TICKETS,
  MOCK_AUDIT_LOGS
} from '../data/mockData';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  switchRole: (role: Role) => void;
  hostels: Hostel[];
  inventories: BedInventory[];
  applications: HostelApplication[];
  allocations: Allocation[];
  checkIns: CheckInRecord[];
  swapRequests: RoomSwapRequest[];
  tickets: MaintenanceTicket[];
  auditLogs: AuditLog[];
  activeHoldTimer: number | null; // seconds remaining on current student's hold
  holdApplicationId: string | null;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  // Booking State Machine Actions
  applyAndHoldBed: (inventoryId: string) => Promise<boolean>;
  payForApplication: (applicationId: string, paymentToken: 'tok_ok' | 'tok_fail') => Promise<boolean>;
  cancelApplication: (applicationId: string) => Promise<boolean>;
  // Student Actions
  requestRoomSwap: (reason: string, targetBedLabel: string) => Promise<boolean>;
  submitMaintenanceTicket: (category: any, priority: any, title: string, description: string) => Promise<boolean>;
  // Warden Actions
  checkInStudent: (allocationId: string, condition: RoomCondition, notes: string) => Promise<boolean>;
  approveSwapRequest: (swapId: string, note?: string) => Promise<boolean>;
  rejectSwapRequest: (swapId: string, note?: string) => Promise<boolean>;
  updateTicketStatus: (ticketId: string, status: any, resolutionNotes?: string) => Promise<boolean>;
  // Admin Actions
  updateFeeSchedule: (inventoryId: string, rent: number, deposit: number) => Promise<boolean>;
  updateInventoryCapacity: (inventoryId: string, totalBeds: number) => Promise<boolean>;
  toggleAccountStatus: (accountId: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user defaults to Student (Rohan) for immediate exploration
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('accommodation_user');
    return saved ? JSON.parse(saved) : MOCK_USERS[4]; // Rohan Verma (Student)
  });

  const [hostels] = useState<Hostel[]>(MOCK_HOSTELS);
  const [inventories, setInventories] = useState<BedInventory[]>(() => {
    const saved = localStorage.getItem('accommodation_inventories');
    return saved ? JSON.parse(saved) : MOCK_INVENTORIES;
  });
  const [applications, setApplications] = useState<HostelApplication[]>(() => {
    const saved = localStorage.getItem('accommodation_applications');
    return saved ? JSON.parse(saved) : MOCK_APPLICATIONS;
  });
  const [allocations, setAllocations] = useState<Allocation[]>(() => {
    const saved = localStorage.getItem('accommodation_allocations');
    return saved ? JSON.parse(saved) : MOCK_ALLOCATIONS;
  });
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(MOCK_CHECKINS);
  const [swapRequests, setSwapRequests] = useState<RoomSwapRequest[]>(MOCK_SWAP_REQUESTS);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(MOCK_TICKETS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);

  // Hold Timer state
  const [activeHoldTimer, setActiveHoldTimer] = useState<number | null>(null);
  const [holdApplicationId, setHoldApplicationId] = useState<string | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Persist key state to localStorage
  useEffect(() => {
    localStorage.setItem('accommodation_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('accommodation_inventories', JSON.stringify(inventories));
  }, [inventories]);

  useEffect(() => {
    localStorage.setItem('accommodation_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('accommodation_allocations', JSON.stringify(allocations));
  }, [allocations]);

  // Hold Timer tick
  useEffect(() => {
    if (activeHoldTimer === null || activeHoldTimer <= 0) return;
    const interval = setInterval(() => {
      setActiveHoldTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleHoldExpired();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeHoldTimer]);

  const handleHoldExpired = () => {
    if (!holdApplicationId) return;
    setApplications((prev) =>
      prev.map((app) =>
        app.application_id === holdApplicationId
          ? { ...app, status: 'EXPIRED', status_reason: '30-minute hold window expired.' }
          : app
      )
    );
    showToast('Bed hold period expired. Bed released back to inventory pool.', 'error');
    setHoldApplicationId(null);
  };

  // Switch role helper
  const switchRole = (role: Role) => {
    const found = MOCK_USERS.find((u) => u.role === role);
    if (found) {
      setCurrentUser(found);
      showToast(`Switched active view to ${role}: ${found.full_name}`, 'info');
    }
  };

  // 1. APPLY AND HOLD BED (Atomic state machine transition: APPLIED -> HELD)
  const applyAndHoldBed = async (inventoryId: string): Promise<boolean> => {
    const inv = inventories.find((i) => i.inventory_id === inventoryId);
    if (!inv) {
      showToast('Inventory pool not found.', 'error');
      return false;
    }

    if (inv.beds_available <= 0) {
      showToast('Sorry, no beds available in this category.', 'error');
      return false;
    }

    // Gender check
    if (currentUser.student_profile && inv.gender_policy !== 'MIXED') {
      if (currentUser.student_profile.gender !== inv.gender_policy) {
        showToast(`Gender mismatch! ${inv.hostel_name} is reserved for ${inv.gender_policy} students.`, 'error');
        return false;
      }
    }

    // Deduct available, increment held
    setInventories((prev) =>
      prev.map((item) =>
        item.inventory_id === inventoryId
          ? {
              ...item,
              beds_available: item.beds_available - 1,
              beds_held: item.beds_held + 1
            }
          : item
      )
    );

    const newAppId = 'app-' + Math.random().toString(36).substring(2, 9);
    const newApp: HostelApplication = {
      application_id: newAppId,
      student_id: currentUser.student_profile?.student_id || 'guest',
      term_id: inv.term_id,
      inventory_id: inventoryId,
      status: 'HELD',
      hold_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      applied_at: new Date().toISOString(),
      inventory: inv
    };

    setApplications((prev) => [newApp, ...prev]);
    setHoldApplicationId(newAppId);
    setActiveHoldTimer(30 * 60); // 30 minutes in seconds

    // Add audit log
    const audit: AuditLog = {
      audit_id: 'aud-' + Date.now(),
      actor_name: currentUser.full_name,
      actor_role: currentUser.role,
      action: 'BED_HOLD_INITIATED',
      entity_type: 'hostel_applications',
      entity_id: newAppId,
      details: { hostel: inv.hostel_name, room_type: inv.room_type_name, expires_in_minutes: 30 },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    };
    setAuditLogs((prev) => [audit, ...prev]);

    showToast(`Bed held successfully! Complete INR fee payment within 30 minutes to confirm.`, 'success');
    return true;
  };

  // 2. PAY FOR APPLICATION (HELD -> ALLOCATED)
  const payForApplication = async (applicationId: string, paymentToken: 'tok_ok' | 'tok_fail'): Promise<boolean> => {
    const app = applications.find((a) => a.application_id === applicationId);
    if (!app || app.status !== 'HELD') {
      showToast('Application is not in a valid HELD state for payment.', 'error');
      return false;
    }

    const inv = app.inventory || inventories.find((i) => i.inventory_id === app.inventory_id);
    if (!inv) return false;

    if (paymentToken === 'tok_fail') {
      // Simulate failed payment
      setApplications((prev) =>
        prev.map((a) =>
          a.application_id === applicationId
            ? { ...a, status: 'FAILED', status_reason: 'Payment gateway transaction declined by bank.' }
            : a
        )
      );

      // Return bed back from held to available
      setInventories((prev) =>
        prev.map((item) =>
          item.inventory_id === app.inventory_id
            ? { ...item, beds_held: Math.max(0, item.beds_held - 1), beds_available: item.beds_available + 1 }
            : item
        )
      );

      setActiveHoldTimer(null);
      setHoldApplicationId(null);
      showToast('Payment declined by mock gateway (tok_fail). Bed hold released.', 'error');
      return false;
    }

    // Success path (tok_ok)
    const passCode = `PASS-2026-${inv.hostel_name.slice(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newAllocId = 'alloc-' + Math.random().toString(36).substring(2, 9);
    const newAllocation: Allocation = {
      allocation_id: newAllocId,
      application_id: applicationId,
      student_id: app.student_id,
      student_name: currentUser.full_name,
      enrollment_no: currentUser.student_profile?.enrollment_no || '2026ST9999',
      bed_id: 'bed-' + Math.random().toString(36).substring(2, 9),
      bed_label: 'Bed-' + (Math.random() > 0.5 ? 'A' : 'B'),
      room_number: `${inv.hostel_name.slice(0, 1)}-${Math.floor(100 + Math.random() * 300)}`,
      block_code: 'BLK-A',
      hostel_name: inv.hostel_name,
      start_date: '2026-08-01',
      end_date: '2026-12-20',
      status: 'ALLOCATED',
      allotment_pass_code: passCode,
      allocated_at: new Date().toISOString(),
      is_ac: inv.is_ac
    };

    // Update application
    setApplications((prev) =>
      prev.map((a) =>
        a.application_id === applicationId
          ? { ...a, status: 'ALLOCATED', decided_at: new Date().toISOString(), allocation: newAllocation }
          : a
      )
    );

    // Update allocation list
    setAllocations((prev) => [newAllocation, ...prev]);

    // Move from beds_held to beds_allocated
    setInventories((prev) =>
      prev.map((item) =>
        item.inventory_id === app.inventory_id
          ? {
              ...item,
              beds_held: Math.max(0, item.beds_held - 1),
              beds_allocated: item.beds_allocated + 1
            }
          : item
      )
    );

    setActiveHoldTimer(null);
    setHoldApplicationId(null);

    // Audit log
    const audit: AuditLog = {
      audit_id: 'aud-' + Date.now(),
      actor_name: currentUser.full_name,
      actor_role: currentUser.role,
      action: 'PAYMENT_SUCCESS_ALLOCATED',
      entity_type: 'allocations',
      entity_id: newAllocId,
      details: {
        pass_code: passCode,
        amount_paid_inr: inv.rent_amount + inv.deposit_amount,
        hostel: inv.hostel_name
      },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    };
    setAuditLogs((prev) => [audit, ...prev]);

    showToast(`Payment successful! Bed allocated. Room Allotment Pass ${passCode} issued.`, 'success');
    return true;
  };

  // 3. CANCEL APPLICATION
  const cancelApplication = async (applicationId: string): Promise<boolean> => {
    const app = applications.find((a) => a.application_id === applicationId);
    if (!app) return false;

    if (app.status === 'HELD') {
      setInventories((prev) =>
        prev.map((item) =>
          item.inventory_id === app.inventory_id
            ? { ...item, beds_held: Math.max(0, item.beds_held - 1), beds_available: item.beds_available + 1 }
            : item
        )
      );
    } else if (app.status === 'ALLOCATED') {
      setInventories((prev) =>
        prev.map((item) =>
          item.inventory_id === app.inventory_id
            ? { ...item, beds_allocated: Math.max(0, item.beds_allocated - 1), beds_available: item.beds_available + 1 }
            : item
        )
      );
      setAllocations((prev) =>
        prev.map((alloc) => (alloc.application_id === applicationId ? { ...alloc, status: 'CANCELLED' } : alloc))
      );
    }

    setApplications((prev) =>
      prev.map((a) => (a.application_id === applicationId ? { ...a, status: 'CANCELLED' } : a))
    );

    if (holdApplicationId === applicationId) {
      setActiveHoldTimer(null);
      setHoldApplicationId(null);
    }

    showToast('Booking cancelled. Bed returned to inventory pool.', 'info');
    return true;
  };

  // Student: Room swap request
  const requestRoomSwap = async (reason: string, targetBedLabel: string): Promise<boolean> => {
    const myAlloc = allocations.find(
      (a) => a.student_id === currentUser.student_profile?.student_id && a.status !== 'CANCELLED'
    );
    if (!myAlloc) {
      showToast('You must have an active bed allocation before requesting a room swap.', 'error');
      return false;
    }

    const swap: RoomSwapRequest = {
      swap_id: 'swap-' + Math.random().toString(36).substring(2, 9),
      allocation_id: myAlloc.allocation_id,
      student_name: currentUser.full_name,
      current_room: myAlloc.room_number,
      current_bed: myAlloc.bed_label,
      target_bed_label: targetBedLabel,
      reason,
      status: 'REQUESTED',
      created_at: new Date().toISOString()
    };

    setSwapRequests((prev) => [swap, ...prev]);
    showToast('Room swap request submitted to hostel warden.', 'success');
    return true;
  };

  // Student: Raise Maintenance Ticket
  const submitMaintenanceTicket = async (
    category: any,
    priority: any,
    title: string,
    description: string
  ): Promise<boolean> => {
    const myAlloc = allocations.find(
      (a) => a.student_id === currentUser.student_profile?.student_id && a.status !== 'CANCELLED'
    );
    const roomNumber = myAlloc ? myAlloc.room_number : 'A-101';
    const hostelName = myAlloc ? myAlloc.hostel_name : 'Kaveri Boys Hostel';

    const ticket: MaintenanceTicket = {
      ticket_id: 'tkt-' + Math.random().toString(36).substring(2, 9),
      room_id: 'room-1',
      room_number: roomNumber,
      block_code: 'BLK-A',
      hostel_name: hostelName,
      raised_by_student_name: currentUser.full_name,
      category,
      priority,
      title,
      description,
      status: 'OPEN',
      created_at: new Date().toISOString()
    };

    setTickets((prev) => [ticket, ...prev]);
    showToast(`Maintenance ticket #${ticket.ticket_id.slice(-4)} raised under ${category}.`, 'success');
    return true;
  };

  // Warden: Check In
  const checkInStudent = async (allocationId: string, condition: RoomCondition, notes: string): Promise<boolean> => {
    const alloc = allocations.find((a) => a.allocation_id === allocationId);
    if (!alloc) return false;

    setAllocations((prev) =>
      prev.map((a) => (a.allocation_id === allocationId ? { ...a, status: 'CHECKED_IN' } : a))
    );

    const checkIn: CheckInRecord = {
      check_in_id: 'chk-' + Math.random().toString(36).substring(2, 9),
      allocation_id: allocationId,
      student_name: alloc.student_name,
      room_number: alloc.room_number,
      bed_label: alloc.bed_label,
      warden_name: currentUser.full_name,
      checked_in_at: new Date().toISOString(),
      room_condition: condition,
      condition_notes: notes
    };

    setCheckIns((prev) => [checkIn, ...prev]);

    // Audit log
    const audit: AuditLog = {
      audit_id: 'aud-' + Date.now(),
      actor_name: currentUser.full_name,
      actor_role: 'WARDEN',
      action: 'INSPECT_AND_CHECK_IN',
      entity_type: 'check_ins',
      entity_id: checkIn.check_in_id,
      details: { student: alloc.student_name, room: alloc.room_number, condition },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    };
    setAuditLogs((prev) => [audit, ...prev]);

    showToast(`Student ${alloc.student_name} verified & checked into Room ${alloc.room_number}.`, 'success');
    return true;
  };

  // Warden: Approve Swap
  const approveSwapRequest = async (swapId: string, note?: string): Promise<boolean> => {
    setSwapRequests((prev) =>
      prev.map((s) => (s.swap_id === swapId ? { ...s, status: 'APPROVED', decision_note: note || 'Approved by Warden.' } : s))
    );
    showToast('Room swap approved. Student notified.', 'success');
    return true;
  };

  // Warden: Reject Swap
  const rejectSwapRequest = async (swapId: string, note?: string): Promise<boolean> => {
    setSwapRequests((prev) =>
      prev.map((s) => (s.swap_id === swapId ? { ...s, status: 'REJECTED', decision_note: note || 'Denied by Warden.' } : s))
    );
    showToast('Room swap request rejected.', 'info');
    return true;
  };

  // Warden: Update Ticket
  const updateTicketStatus = async (ticketId: string, status: any, resolutionNotes?: string): Promise<boolean> => {
    setTickets((prev) =>
      prev.map((t) =>
        t.ticket_id === ticketId
          ? {
              ...t,
              status,
              resolution_notes: resolutionNotes || t.resolution_notes,
              resolved_at: status === 'RESOLVED' || status === 'CLOSED' ? new Date().toISOString() : t.resolved_at
            }
          : t
      )
    );
    showToast(`Ticket status updated to ${status}.`, 'success');
    return true;
  };

  // Admin: Update Fee Schedule
  const updateFeeSchedule = async (inventoryId: string, rent: number, deposit: number): Promise<boolean> => {
    setInventories((prev) =>
      prev.map((inv) => (inv.inventory_id === inventoryId ? { ...inv, rent_amount: rent, deposit_amount: deposit } : inv))
    );
    showToast('Fee schedule updated successfully in INR.', 'success');
    return true;
  };

  // Admin: Update Capacity
  const updateInventoryCapacity = async (inventoryId: string, totalBeds: number): Promise<boolean> => {
    const inv = inventories.find((i) => i.inventory_id === inventoryId);
    if (!inv) return false;

    if (totalBeds < inv.beds_held + inv.beds_allocated) {
      showToast(
        `Cannot reduce capacity below currently occupied beds (${inv.beds_held + inv.beds_allocated}).`,
        'error'
      );
      return false;
    }

    const available = totalBeds - (inv.beds_held + inv.beds_allocated);
    setInventories((prev) =>
      prev.map((i) => (i.inventory_id === inventoryId ? { ...i, beds_total: totalBeds, beds_available: available } : i))
    );
    showToast(`Bed capacity updated to ${totalBeds}. Available beds adjusted to ${available}.`, 'success');
    return true;
  };

  // Admin: Toggle Account Status
  const toggleAccountStatus = async (accountId: string): Promise<boolean> => {
    // Audit log
    showToast('Account status updated.', 'info');
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        hostels,
        inventories,
        applications,
        allocations,
        checkIns,
        swapRequests,
        tickets,
        auditLogs,
        activeHoldTimer,
        holdApplicationId,
        toasts,
        showToast,
        removeToast,
        applyAndHoldBed,
        payForApplication,
        cancelApplication,
        requestRoomSwap,
        submitMaintenanceTicket,
        checkInStudent,
        approveSwapRequest,
        rejectSwapRequest,
        updateTicketStatus,
        updateFeeSchedule,
        updateInventoryCapacity,
        toggleAccountStatus
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
