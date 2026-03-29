'use client';

import { useEffect, useState, useCallback } from 'react';
import { ClipboardList, Plus, X, Loader2, CheckCircle, Clock, AlertTriangle, CheckSquare, Square, User } from 'lucide-react';
import { housekeepingApi, roomsApi } from '@/lib/api';

interface TaskChecklistItem {
  id: string;
  item: string;
  done: boolean;
}

interface Task {
  id: string; roomNumber: string; roomId: string; taskType: string;
  status: string; priority: string; assignedTo?: string; notes?: string;
  checklist?: TaskChecklistItem[];
  createdAt: string;
  room?: { roomNumber: string; floor?: { name: string } };
}

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      
      const [tasksRes, staffRes] = await Promise.all([
        housekeepingApi.getTasks(params),
        housekeepingApi.getStaff()
      ]);
      
      if (tasksRes.success) setTasks(tasksRes.data || []);
      if (staffRes.success) setStaff(staffRes.data || []);
    } catch (err) { console.error('Housekeeping fetch failed:', err); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      await housekeepingApi.updateStatus(taskId, newStatus);
      fetchData();
    } catch (err: any) { alert(err.message); }
  }

  async function handleAssign(taskId: string, staffId: string) {
    try {
      await housekeepingApi.updateTask(taskId, { assignedTo: staffId || null });
      fetchData();
    } catch (err: any) { alert(err.message); }
  }

  async function handleToggleChecklist(task: Task, itemId: string) {
    if (!task.checklist) return;
    const updatedChecklist = task.checklist.map(i => 
      i.id === itemId ? { ...i, done: !i.done } : i
    );
    try {
      await housekeepingApi.updateTask(task.id, { checklist: updatedChecklist });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, checklist: updatedChecklist } : t));
    } catch (err: any) { alert(err.message); }
  }

  const statusStyles: Record<string, { bg: string; text: string; icon: any }> = {
    pending: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', icon: Clock },
    in_progress: { bg: 'bg-primary-500/10 border-primary-500/20', text: 'text-primary-400', icon: Loader2 },
    completed: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
  };

  const priorityColors: Record<string, string> = {
    urgent: 'text-red-400', high: 'text-orange-400', normal: 'text-surface-400', low: 'text-surface-500',
  };

  const grouped = {
    pending: tasks.filter((t) => t.status === 'pending'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    completed: tasks.filter((t) => t.status === 'completed'),
  };

  const getStaffName = (id?: string) => {
    if (!id) return 'Unassigned';
    return staff.find(s => s.id === id)?.fullName || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">Housekeeping</h1>
          <p className="text-surface-400">Room cleaning and maintenance tasks</p>
        </div>
        <button onClick={() => setShowAddTask(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2">
        {[
          { value: '', label: 'All', count: tasks.length },
          { value: 'pending', label: 'Pending', count: grouped.pending.length },
          { value: 'in_progress', label: 'In Progress', count: grouped.in_progress.length },
          { value: 'completed', label: 'Done', count: grouped.completed.length },
        ].map((f) => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              statusFilter === f.value ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20' : 'bg-white/[0.04] text-surface-400 border border-white/[0.06] hover:bg-white/[0.08]'
            }`}>
            {f.label} <span className="text-xs opacity-60">({f.count})</span>
          </button>
        ))}
      </div>

      {/* Task Board */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 glass-card animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ClipboardList className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tasks</h3>
          <p className="text-surface-400 mb-4">Tasks are created automatically on guest checkout, or add them manually.</p>
          <button onClick={() => setShowAddTask(true)} className="btn-primary">Add Task</button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {(['pending', 'in_progress', 'completed'] as const).map((status) => {
            const style = statusStyles[status];
            const items = statusFilter ? tasks.filter((t) => t.status === status) : grouped[status];
            if (statusFilter && statusFilter !== status) return null;
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <style.icon className={`w-4 h-4 ${style.text}`} />
                  <h3 className="text-sm font-medium text-surface-300 uppercase tracking-wider">
                    {status.replace(/_/g, ' ')} ({items.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {items.map((task) => (
                    <div key={task.id} className={`p-4 rounded-xl border ${style.bg} transition-all relative group`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold">Room {task.room?.roomNumber || task.roomNumber}</p>
                          <p className="text-xs text-surface-400 capitalize pt-0.5">{task.taskType?.replace(/_/g, ' ')}</p>
                        </div>
                        <span className={`text-xs font-medium capitalize ${priorityColors[task.priority] || 'text-surface-400'}`}>
                          {task.priority === 'urgent' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                          {task.priority}
                        </span>
                      </div>
                      
                      {/* Assignment Dropdown */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <User className="w-3.5 h-3.5 text-surface-500" />
                        <select 
                          value={task.assignedTo || ''}
                          onChange={(e) => handleAssign(task.id, e.target.value)}
                          disabled={status === 'completed'}
                          className="bg-transparent text-xs text-surface-300 font-medium focus:outline-none focus:ring-1 focus:ring-primary-500 rounded p-1 cursor-pointer w-full"
                        >
                          <option value="" className="bg-surface-800 text-surface-400">Unassigned</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.id} className="bg-surface-800">{s.fullName}</option>
                          ))}
                        </select>
                      </div>

                      {task.notes && (
                        <div className="bg-black/20 rounded-lg p-2 mb-3 border border-white/[0.04]">
                          <p className="text-xs text-surface-300 italic">"{task.notes}"</p>
                        </div>
                      )}

                      {/* Checklist */}
                      {task.checklist && task.checklist.length > 0 && (
                        <div className="mb-4 space-y-1.5 mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-surface-500">Checklist</span>
                            <span className="text-[10px] font-medium text-surface-400">{task.checklist.filter(i => i.done).length}/{task.checklist.length}</span>
                          </div>
                          {task.checklist.map(item => (
                            <button
                              key={item.id}
                              onClick={() => status !== 'completed' && handleToggleChecklist(task, item.id)}
                              disabled={status === 'completed'}
                              className={`flex items-start gap-2 text-left w-full hover:bg-white/[0.04] p-1.5 rounded transition-colors ${status === 'completed' ? 'opacity-70 cursor-default' : ''}`}
                            >
                              {item.done ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-surface-500 mt-0.5 shrink-0" />
                              )}
                              <span className={`text-xs ${item.done ? 'text-surface-500 line-through' : 'text-surface-300'}`}>
                                {item.item}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                        {status === 'pending' && (
                          <button onClick={() => handleStatusChange(task.id, 'in_progress')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors flex-1 font-medium">
                            Start Cleaning
                          </button>
                        )}
                        {status === 'in_progress' && (
                          <button onClick={() => handleStatusChange(task.id, 'completed')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex-1 font-medium">
                            Mark Done
                          </button>
                        )}
                        {status !== 'pending' && status !== 'completed' && (
                          <button onClick={() => handleStatusChange(task.id, 'pending')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.06] text-surface-400 hover:bg-white/[0.1] transition-colors font-medium">
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-sm text-surface-500 text-center py-4">No tasks</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddTask && <AddTaskModal onClose={() => setShowAddTask(false)} onCreated={() => { setShowAddTask(false); fetchData(); }} staff={staff} />}
    </div>
  );
}

function AddTaskModal({ onClose, onCreated, staff }: { onClose: () => void; onCreated: () => void; staff: StaffMember[] }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomId, setRoomId] = useState('');
  const [taskType, setTaskType] = useState('cleaning');
  const [priority, setPriority] = useState('normal');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    roomsApi.getRooms().then((res) => {
      if (res.success) { setRooms(res.data || []); if (res.data?.length) setRoomId(res.data[0].id); }
    }).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) return;
    setSaving(true);
    try {
      await housekeepingApi.createTask({ 
        roomId, 
        taskType, 
        priority, 
        assignedTo: assignedTo || undefined,
        notes: notes.trim() || undefined 
      });
      onCreated();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border border-white/[0.08] rounded-2xl w-full max-w-md p-6 mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold">Add Task</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Room</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="input-field">
              {rooms.map((r: any) => <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.floor?.name})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Task Type</label>
              <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className="input-field">
                <option value="cleaning">Cleaning</option>
                <option value="deep_cleaning">Deep Cleaning</option>
                <option value="maintenance">Maintenance</option>
                <option value="inspection">Inspection</option>
                <option value="laundry">Laundry</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Assign To (Optional)</label>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="input-field">
              <option value="">Unassigned</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName} ({s.role.replace(/_/g, ' ')})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={2} placeholder="Optional notes for staff..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
