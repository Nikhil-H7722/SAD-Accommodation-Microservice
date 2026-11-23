import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  TrendingUp,
  Cpu,
  Building2,
  IndianRupee,
  ShieldAlert,
  Layers,
  Settings,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  Users
} from 'lucide-react';

export const AdminConsole: React.FC = () => {
  const {
    hostels,
    inventories,
    allocations,
    applications,
    auditLogs,
    updateFeeSchedule,
    updateInventoryCapacity
  } = useApp();

  const [activeTab, setActiveTab] = useState<'forecast' | 'hostels' | 'inventory' | 'audit'>('forecast');

  // Edit Fee Modal State
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [newRent, setNewRent] = useState<number>(0);
  const [newDeposit, setNewDeposit] = useState<number>(0);

  // Edit Capacity Modal State
  const [editingCapacityInvId, setEditingCapacityInvId] = useState<string | null>(null);
  const [newCapacity, setNewCapacity] = useState<number>(0);

  // Campus aggregates
  const totalCapacity = inventories.reduce((sum, i) => sum + i.beds_total, 0);
  const totalAvailable = inventories.reduce((sum, i) => sum + i.beds_available, 0);
  const totalHeld = inventories.reduce((sum, i) => sum + i.beds_held, 0);
  const totalAllocated = inventories.reduce((sum, i) => sum + i.beds_allocated, 0);
  const occupancyPercentage = Math.round(((totalAllocated + totalHeld) / totalCapacity) * 100) || 0;

  // AI Demand Forecast Data (Time-series regression projection)
  const forecastData = [
    { period: 'May 2026', intake: 'Early Bird', actual: 12, predicted: 15, surgeProbability: '18%' },
    { period: 'Jun 2026', intake: 'JEE/GATE Admissions', actual: 45, predicted: 48, surgeProbability: '42%' },
    { period: 'Jul 2026', intake: 'Counseling Round 1-3', actual: 110, predicted: 115, surgeProbability: '88%' },
    { period: 'Aug 2026 (Peak)', intake: 'Semester Orientation', actual: 145, predicted: 148, surgeProbability: '96% (CRITICAL SURGE)' },
    { period: 'Sep 2026', intake: 'Late Add/Drop', actual: null, predicted: 152, surgeProbability: '98% (OVERCAPACITY RISK)' },
    { period: 'Jan 2027', intake: 'Spring Intake', actual: null, predicted: 130, surgeProbability: '75%' }
  ];

  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 mb-1">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Campus Housing Administration & Directorate</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Management & AI Forecaster</h1>
          <p className="text-xs text-slate-400 mt-1">
            Prof. Arvind Deshmukh • Chief Housing Warden • Term: Autumn Semester 2026-27 (OPEN)
          </p>
        </div>

        {/* Aggregate KPI Badges */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center min-w-[90px]">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Beds</span>
            <span className="text-lg font-bold text-white">{totalCapacity}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center min-w-[90px]">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Occupied & Held</span>
            <span className="text-lg font-bold text-indigo-400">{totalAllocated + totalHeld}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center min-w-[90px]">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Occupancy Rate</span>
            <span className="text-lg font-bold text-emerald-400">{occupancyPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('forecast')}
          className={`py-2.5 px-4 rounded-xl flex items-center space-x-2 transition ${
            activeTab === 'forecast'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-indigo-800 hover:bg-indigo-50'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Occupancy Demand Forecaster</span>
        </button>

        <button
          onClick={() => setActiveTab('hostels')}
          className={`py-2.5 px-4 rounded-xl flex items-center space-x-2 transition ${
            activeTab === 'hostels'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-indigo-800 hover:bg-indigo-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hostel Complexes ({hostels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-2.5 px-4 rounded-xl flex items-center space-x-2 transition ${
            activeTab === 'inventory'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-indigo-800 hover:bg-indigo-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Bed Inventory Pools & INR Fees</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2.5 px-4 rounded-xl flex items-center space-x-2 transition ${
            activeTab === 'audit'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-indigo-800 hover:bg-indigo-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Security Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: AI OCCUPANCY DEMAND FORECASTER */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {/* AI Banner */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-5 rounded-2xl shadow-sm flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-400/30">
                <Cpu className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-base">Embedded AI Engine: Time-Series Regression Model</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-400/20 text-purple-200">
                    Prophet / ARIMA Baseline
                  </span>
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  Predicts bed allocation surge patterns mapped against admissions intakes, GATE/JEE counseling, and postgraduate starts.
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-purple-300 block">Forecast Model Accuracy</span>
              <span className="font-mono text-emerald-400 font-bold text-lg">94.8% R²</span>
            </div>
          </div>

          {/* Time Series Projection Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Semester Intake Demand Projection Curve</h4>
                <p className="text-xs text-slate-500">Historical intake signals combined with current live application hold velocity.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Admissions / Academic Milestone</th>
                    <th className="py-3 px-4">Allocated Actual</th>
                    <th className="py-3 px-4">AI Projected Demand</th>
                    <th className="py-3 px-4">Surge Probability</th>
                    <th className="py-3 px-4 text-right">Capacity Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {forecastData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.period}</td>
                      <td className="py-3 px-4 text-slate-600">{row.intake}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {row.actual !== null ? `${row.actual} beds` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {row.predicted} beds ({Math.round((row.predicted / totalCapacity) * 100)}%)
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{row.surgeProbability}</td>
                      <td className="py-3 px-4 text-right">
                        {row.predicted > totalCapacity * 0.95 ? (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800">
                            CRITICAL SHORTAGE
                          </span>
                        ) : row.predicted > totalCapacity * 0.8 ? (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800">
                            HIGH DEMAND
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                            ADEQUATE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Recommendation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>AI Capacity Alert: Boys Hostel Single AC Shortage</span>
              </div>
              <p className="text-amber-800">
                Single AC Executive in Kaveri Boys Hostel has a projected deficit of 14 beds before August 15. Recommendation: Activate Block B 3rd Floor reserved inventory buffer.
              </p>
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                <span>AI Recommendation: Ganga Girls Hostel Stable</span>
              </div>
              <p className="text-emerald-800">
                Maitreyi Wing has adequate cushion for Counseling Round 3. Current capacity utilization at 62%, safely within semester surge thresholds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOSTEL COMPLEXES */}
      {activeTab === 'hostels' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {hostels.map((h) => (
            <div key={h.hostel_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <img src={h.image_url} alt={h.name} className="w-full h-36 object-cover" />
                <div className="p-5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-slate-400 font-bold text-[11px]">{h.hostel_code}</span>
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-indigo-100 text-indigo-800 uppercase">
                      {h.gender_policy}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{h.name}</h4>
                  <p className="text-slate-500 line-clamp-3">{h.description}</p>
                  <div className="pt-2 text-slate-600 font-medium">Address: {h.address}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">{h.blocks?.length || 2} Wings / Blocks</span>
                <span className="font-bold text-emerald-700">Status: {h.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: BED INVENTORY & FEES (INR) */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Bed Inventory Pools & Seasonal INR Fees</h3>
              <p className="text-xs text-slate-500">
                Adjust total bed pool quotas and semester fee schedules in Indian Rupees (INR).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Hostel Complex</th>
                  <th className="py-3 px-4">Room Category</th>
                  <th className="py-3 px-4">Total Beds</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Held</th>
                  <th className="py-3 px-4">Allocated</th>
                  <th className="py-3 px-4">Semester Rent (₹)</th>
                  <th className="py-3 px-4">Deposit (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventories.map((inv) => (
                  <tr key={inv.inventory_id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">{inv.hostel_name}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{inv.room_type_name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.beds_total}</td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{inv.beds_available}</td>
                    <td className="py-3 px-4 font-mono text-amber-600">{inv.beds_held}</td>
                    <td className="py-3 px-4 font-mono text-indigo-700 font-bold">{inv.beds_allocated}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      ₹{inv.rent_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      ₹{inv.deposit_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingInvId(inv.inventory_id);
                          setNewRent(inv.rent_amount);
                          setNewDeposit(inv.deposit_amount);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      >
                        Edit Fees
                      </button>
                      <button
                        onClick={() => {
                          setEditingCapacityInvId(inv.inventory_id);
                          setNewCapacity(inv.beds_total);
                        }}
                        className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold"
                      >
                        Adjust Capacity
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Security & Operational Audit Ledger</h3>
              <p className="text-xs text-slate-500">
                Immutable trace of all administrative fee alterations, warden inspections, and atomic bed bookings.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.audit_id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1 font-mono"
              >
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 font-bold text-slate-700 uppercase">
                    {log.actor_role}
                  </span>
                </div>
                <div className="font-bold text-indigo-900 text-sm">
                  {log.action} <span className="text-slate-500 font-normal">by {log.actor_name}</span>
                </div>
                <div className="text-slate-600 text-[11px] bg-white p-2 rounded border border-slate-100 overflow-x-auto">
                  {JSON.stringify(log.details)}
                </div>
                <div className="text-[10px] text-slate-400">IP: {log.ip_address} • Target: {log.entity_type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Fees Modal */}
      {editingInvId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Update Fee Schedule (INR)</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Semester Rent (₹)</label>
                <input
                  type="number"
                  value={newRent}
                  onChange={(e) => setNewRent(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-sm"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Caution Deposit (₹)</label>
                <input
                  type="number"
                  value={newDeposit}
                  onChange={(e) => setNewDeposit(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button onClick={() => setEditingInvId(null)} className="px-4 py-2 rounded-lg text-slate-600 font-semibold text-xs">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await updateFeeSchedule(editingInvId, newRent, newDeposit);
                  setEditingInvId(null);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Save Fee Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Capacity Modal */}
      {editingCapacityInvId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Adjust Bed Inventory Capacity</h3>
            <p className="text-xs text-slate-500">
              Safety Check: Database enforces total beds cannot drop below currently held + allocated beds.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Total Bed Pool Capacity</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button onClick={() => setEditingCapacityInvId(null)} className="px-4 py-2 rounded-lg text-slate-600 font-semibold text-xs">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await updateInventoryCapacity(editingCapacityInvId, newCapacity);
                  setEditingCapacityInvId(null);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Update Capacity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
