// API Client for Accommodation Microservice
// Interacts with FastAPI backend (/api/v1/accommodation) and WebSocket (/ws/inventory)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/accommodation';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('accommodation_jwt_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('accommodation_jwt_token', token);
    } else {
      localStorage.removeItem('accommodation_jwt_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.error?.message) {
          errorMsg = errorData.error.message;
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // --- Health Check ---
  async checkHealth(): Promise<{ status: string }> {
    return this.request('/health');
  }

  // --- Auth Endpoints ---
  async login(email: string, password: string = 'Password123!'): Promise<{ challenge_id: string; message: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async verifyOtp(challenge_id: string, otp_code: string): Promise<{ access_token: string; role: string }> {
    const data = await this.request<{ access_token: string; role: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ challenge_id, otp_code }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe(): Promise<any> {
    return this.request('/auth/me');
  }

  // --- Catalogue & Availability ---
  async getHostels(gender?: string): Promise<any[]> {
    const query = gender ? `?gender=${encodeURIComponent(gender)}` : '';
    return this.request(`/hostels${query}`);
  }

  async getRoomTypes(): Promise<any[]> {
    return this.request('/room-types');
  }

  async getTerms(status?: string): Promise<any[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/terms${query}`);
  }

  async getAvailability(termId?: string, hostelId?: string, roomTypeId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (termId) params.append('term_id', termId);
    if (hostelId) params.append('hostel_id', hostelId);
    if (roomTypeId) params.append('room_type_id', roomTypeId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/availability${query}`);
  }

  // --- Bed Booking Engine (State Machine) ---
  async applyAndHoldBed(inventory_id: string): Promise<any> {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify({ inventory_id }),
    });
  }

  async payForApplication(applicationId: string, payment_token: 'tok_ok' | 'tok_fail' = 'tok_ok'): Promise<any> {
    return this.request(`/applications/${applicationId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ payment_token }),
    });
  }

  async cancelApplication(applicationId: string, reason?: string): Promise<any> {
    return this.request(`/applications/${applicationId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Cancelled by student.' }),
    });
  }

  // --- Student Operations ---
  async getMyAllocations(): Promise<any[]> {
    return this.request('/allocations/me');
  }

  async getRoomPass(allocationId: string): Promise<any> {
    return this.request(`/allocations/${allocationId}/pass`);
  }

  async submitSwapRequest(reason: string, target_bed_label?: string): Promise<any> {
    return this.request('/swap-requests', {
      method: 'POST',
      body: JSON.stringify({ reason, target_bed_label }),
    });
  }

  async getMySwapRequests(): Promise<any[]> {
    return this.request('/swap-requests/me');
  }

  async submitTicket(category: string, priority: string, title: string, description?: string): Promise<any> {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify({ category, priority, title, description }),
    });
  }

  async getMyTickets(): Promise<any[]> {
    return this.request('/tickets/me');
  }

  // --- Warden Operations ---
  async getWardenAllocations(): Promise<any[]> {
    return this.request('/warden/allocations');
  }

  async wardenCheckIn(allocation_id: string, room_condition: string, condition_notes?: string): Promise<any> {
    return this.request('/warden/check-ins', {
      method: 'POST',
      body: JSON.stringify({ allocation_id, room_condition, condition_notes }),
    });
  }

  async getWardenSwapRequests(): Promise<any[]> {
    return this.request('/warden/swap-requests');
  }

  async approveSwapRequest(swapId: string, note?: string): Promise<any> {
    return this.request(`/warden/swap-requests/${swapId}/approve?decision_note=${encodeURIComponent(note || 'Approved by Warden.')}`, {
      method: 'POST',
    });
  }

  async rejectSwapRequest(swapId: string, note?: string): Promise<any> {
    return this.request(`/warden/swap-requests/${swapId}/reject?decision_note=${encodeURIComponent(note || 'Denied by Warden.')}`, {
      method: 'POST',
    });
  }

  async getWardenTickets(): Promise<any[]> {
    return this.request('/warden/tickets');
  }

  async updateTicket(ticketId: string, status: string, assigned_to?: string, resolution_notes?: string): Promise<any> {
    return this.request(`/warden/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, assigned_to, resolution_notes }),
    });
  }

  // --- Admin Operations ---
  async getAdminOccupancy(): Promise<any[]> {
    return this.request('/admin/occupancy');
  }

  async getAdminForecast(): Promise<any[]> {
    return this.request('/admin/forecast');
  }
}

export const api = new ApiService();
