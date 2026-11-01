import {
  Complaint,
  ComplaintComment,
  StatusHistory,
  Notification,
  Feedback,
  Department,
  ComplaintCategory,
  Asset,
  MaintenanceTask,
  AuditLog,
  CampusBuilding,
  SystemSettings,
  UserProfile,
  ComplaintStatus,
  Priority,
  KnowledgeBaseArticle,
} from '../types';
import {
  INITIAL_PROFILES,
  INITIAL_COMPLAINTS,
  INITIAL_COMMENTS,
  INITIAL_STATUS_HISTORY,
  INITIAL_NOTIFICATIONS,
  INITIAL_FEEDBACK,
  INITIAL_DEPARTMENTS,
  INITIAL_CATEGORIES,
  INITIAL_ASSETS,
  INITIAL_MAINTENANCE_TASKS,
  INITIAL_BUILDINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS,
  INITIAL_KB_ARTICLES,
} from '../data/seedData';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const STORAGE_KEYS = {
  COMPLAINTS: 'sc360_complaints',
  COMMENTS: 'sc360_comments',
  HISTORY: 'sc360_history',
  NOTIFICATIONS: 'sc360_notifications',
  FEEDBACK: 'sc360_feedback',
  DEPARTMENTS: 'sc360_departments',
  CATEGORIES: 'sc360_categories',
  ASSETS: 'sc360_assets',
  TASKS: 'sc360_tasks',
  BUILDINGS: 'sc360_buildings',
  AUDIT: 'sc360_audit_logs',
  SETTINGS: 'sc360_settings',
  KB: 'sc360_kb_articles',
  USERS: 'sc360_users',
};

// Safe JSON parser with fallback
function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading stored key ${key}:`, err);
    return fallback;
  }
}

function saveStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving stored key ${key}:`, err);
  }
}

export class DataService {
  // Reset all local demonstration data
  public static resetDemoData(): void {
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(INITIAL_COMPLAINTS));
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(INITIAL_STATUS_HISTORY));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(INITIAL_FEEDBACK));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(INITIAL_ASSETS));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_MAINTENANCE_TASKS));
    localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(INITIAL_BUILDINGS));
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.KB, JSON.stringify(INITIAL_KB_ARTICLES));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_PROFILES));
  }

  // USER MANAGEMENT
  public static async getUsers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('profiles').select('*');
      if (data && data.length > 0) return data;
    }
    return loadStored<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_PROFILES);
  }

  public static async saveUser(user: UserProfile, actor?: UserProfile): Promise<UserProfile> {
    const users = await this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    saveStored(STORAGE_KEYS.USERS, users);

    if (actor) {
      await this.logAudit(actor, 'UPDATE_USER', 'user', user.id, `Saved user profile: ${user.fullName} (${user.email})`);
    }
    return user;
  }

  public static async deleteUser(userId: string, actor: UserProfile): Promise<boolean> {
    const users = await this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return false;

    const remaining = users.filter((u) => u.id !== userId);
    saveStored(STORAGE_KEYS.USERS, remaining);

    await this.logAudit(
      actor,
      'DELETE_ACCOUNT',
      'user',
      userId,
      `User account deleted: ${target.fullName} (${target.email})`
    );

    return true;
  }

  // AUDIT LOG
  public static async logAudit(
    actor: UserProfile,
    action: string,
    entityType: 'complaint' | 'user' | 'department' | 'asset' | 'maintenance' | 'settings' | 'auth',
    entityId: string,
    details: string,
    beforeState?: string,
    afterState?: string
  ): Promise<void> {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action,
      entityType,
      entityId,
      details,
      beforeState,
      afterState,
      timestamp: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('audit_logs').insert([log]);
    } else {
      const logs = loadStored<AuditLog[]>(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
      logs.unshift(log);
      saveStored(STORAGE_KEYS.AUDIT, logs.slice(0, 300));
    }
  }

  public static async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
      return data || [];
    }
    return loadStored<AuditLog[]>(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  }

  // SETTINGS & SLA
  public static async getSettings(): Promise<SystemSettings> {
    return loadStored<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  public static async updateSettings(settings: SystemSettings, actor: UserProfile): Promise<void> {
    saveStored(STORAGE_KEYS.SETTINGS, settings);
    await this.logAudit(actor, 'UPDATE_SETTINGS', 'settings', 'system_config', 'Updated SLA thresholds & global options');
  }

  // DEPARTMENTS
  public static async getDepartments(): Promise<Department[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('departments').select('*');
      return data || [];
    }
    return loadStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  }

  public static async saveDepartment(dept: Department, actor: UserProfile): Promise<Department> {
    const depts = await this.getDepartments();
    const existingIndex = depts.findIndex((d) => d.id === dept.id);
    if (existingIndex >= 0) {
      depts[existingIndex] = dept;
      await this.logAudit(actor, 'UPDATE_DEPARTMENT', 'department', dept.id, `Updated department: ${dept.name}`);
    } else {
      dept.id = `dept-${Date.now()}`;
      dept.createdAt = new Date().toISOString();
      depts.push(dept);
      await this.logAudit(actor, 'CREATE_DEPARTMENT', 'department', dept.id, `Created new department: ${dept.name}`);
    }
    saveStored(STORAGE_KEYS.DEPARTMENTS, depts);
    return dept;
  }

  // CATEGORIES
  public static async getCategories(): Promise<ComplaintCategory[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('complaint_categories').select('*');
      return data || [];
    }
    return loadStored<ComplaintCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  public static async saveCategory(cat: ComplaintCategory, actor: UserProfile): Promise<ComplaintCategory> {
    const categories = await this.getCategories();
    const idx = categories.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      categories[idx] = cat;
      await this.logAudit(actor, 'UPDATE_CATEGORY', 'settings', cat.id, `Updated category ${cat.name}`);
    } else {
      cat.id = `cat-${Date.now()}`;
      categories.push(cat);
      await this.logAudit(actor, 'CREATE_CATEGORY', 'settings', cat.id, `Created category ${cat.name}`);
    }
    saveStored(STORAGE_KEYS.CATEGORIES, categories);
    return cat;
  }

  // COMPLAINTS
  public static async getComplaints(): Promise<Complaint[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
      return data || [];
    }
    return loadStored<Complaint[]>(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
  }

  public static async getComplaintById(id: string): Promise<Complaint | undefined> {
    const complaints = await this.getComplaints();
    return complaints.find((c) => c.id === id || c.complaintCode === id);
  }

  // Duplicate detection algorithm
  public static async detectDuplicates(
    title: string,
    building: string,
    room: string,
    categoryId: string
  ): Promise<Complaint[]> {
    const activeComplaints = (await this.getComplaints()).filter(
      (c) => c.status !== 'closed' && c.status !== 'resolved'
    );
    const keywords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

    return activeComplaints.filter((c) => {
      const sameLocation =
        c.campusBuilding.toLowerCase() === building.toLowerCase() &&
        (room ? c.roomNumber.toLowerCase() === room.toLowerCase() : true);
      const sameCategory = c.categoryId === categoryId;
      const titleMatch = keywords.some((kw) => c.title.toLowerCase().includes(kw));

      return (sameLocation && sameCategory) || (sameLocation && titleMatch);
    });
  }

  // Smart Recommendation engine for Category, Department & Priority
  public static async recommendDepartmentAndPriority(
    categoryId: string,
    description: string,
    building: string
  ): Promise<{ departmentId: string; departmentName: string; priority: Priority; isSafetyHazard: boolean }> {
    const categories = await this.getCategories();
    const departments = await this.getDepartments();
    const selectedCat = categories.find((c) => c.id === categoryId);

    const desc = (description || '').toLowerCase();
    const safetyKeywords = ['spark', 'fire', 'shock', 'bare wire', 'flood', 'burst', 'collapse', 'danger', 'hazard', 'smoke', 'gas'];
    const urgentKeywords = ['server', 'blackout', 'exam', 'presentation', 'emergency', 'leakage', 'urgent'];

    const hasSafetyRisk = safetyKeywords.some((kw) => desc.includes(kw));
    const hasUrgency = urgentKeywords.some((kw) => desc.includes(kw));

    let priority: Priority = selectedCat ? selectedCat.defaultPriority : 'medium';
    if (hasSafetyRisk) {
      priority = 'critical';
    } else if (hasUrgency && priority !== 'critical') {
      priority = 'high';
    }

    const defaultDeptId = selectedCat?.defaultDepartmentId || departments[0]?.id;
    const defaultDept = departments.find((d) => d.id === defaultDeptId) || departments[0];

    return {
      departmentId: defaultDept.id,
      departmentName: defaultDept.name,
      priority,
      isSafetyHazard: hasSafetyRisk,
    };
  }

  // Create Complaint
  public static async createComplaint(
    data: {
      title: string;
      description: string;
      categoryId: string;
      campusBuilding: string;
      block: string;
      floor: string;
      roomNumber: string;
      assetId?: string;
      imageUrl?: string;
      isAnonymous?: boolean;
    },
    user: UserProfile
  ): Promise<Complaint> {
    const complaints = await this.getComplaints();
    const categories = await this.getCategories();
    const departments = await this.getDepartments();
    const assets = await this.getAssets();
    const settings = await this.getSettings();

    const cat = categories.find((c) => c.id === data.categoryId) || categories[0];
    const recommendation = await this.recommendDepartmentAndPriority(cat.id, data.description, data.campusBuilding);
    const dept = departments.find((d) => d.id === recommendation.departmentId) || departments[0];

    // SLA calculation based on priority
    let hours = settings.slaMediumHours;
    if (recommendation.priority === 'critical') hours = settings.slaCriticalHours;
    else if (recommendation.priority === 'high') hours = settings.slaHighHours;
    else if (recommendation.priority === 'low') hours = settings.slaLowHours;

    const deadline = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    const codeNum = 1000 + complaints.length + 1;
    const complaintCode = `CMP-2026-${codeNum}`;

    const linkedAsset = data.assetId ? assets.find((a) => a.id === data.assetId) : undefined;

    const newComplaint: Complaint = {
      id: `cmp-${Date.now()}`,
      complaintCode,
      title: data.title,
      description: data.description,
      categoryId: cat.id,
      categoryName: cat.name,
      departmentId: dept.id,
      departmentName: dept.name,
      priority: recommendation.priority,
      status: 'submitted',
      reporterId: user.id,
      reporterName: data.isAnonymous ? 'Anonymous Member' : user.fullName,
      reporterEmail: data.isAnonymous ? 'anonymous@campus.edu' : user.email,
      reporterRole: user.role,
      isAnonymous: Boolean(data.isAnonymous),
      campusBuilding: data.campusBuilding,
      block: data.block || 'Main Wing',
      floor: data.floor || 'Ground Floor',
      roomNumber: data.roomNumber,
      assetId: linkedAsset?.id,
      assetName: linkedAsset?.name,
      imageUrl: data.imageUrl,
      deadline,
      isSafetyHazard: recommendation.isSafetyHazard,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    complaints.unshift(newComplaint);
    saveStored(STORAGE_KEYS.COMPLAINTS, complaints);

    // Initial status history
    await this.addStatusHistory(newComplaint.id, 'submitted', 'submitted', user, 'Complaint submitted into system');

    // Notify Department / Admins
    await this.createNotification({
      userId: 'user-admin',
      title: `New Complaint: ${complaintCode}`,
      message: `${newComplaint.title} (${cat.name} in ${data.campusBuilding})`,
      type: recommendation.isSafetyHazard ? 'emergency' : 'info',
      complaintId: newComplaint.id,
    });

    // Notify student confirmation
    await this.createNotification({
      userId: user.id,
      title: `Complaint Logged: ${complaintCode}`,
      message: `Your issue has been recorded. Assigned to ${dept.name} with SLA deadline of ${hours} hours.`,
      type: 'info',
      complaintId: newComplaint.id,
    });

    // Audit log
    await this.logAudit(
      user,
      'CREATE_COMPLAINT',
      'complaint',
      newComplaint.id,
      `Submitted ${complaintCode}: ${newComplaint.title} [Priority: ${recommendation.priority}]`
    );

    return newComplaint;
  }

  // Update Status
  public static async updateComplaintStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    actor: UserProfile,
    notes?: string,
    resolutionProofUrl?: string
  ): Promise<Complaint> {
    const complaints = await this.getComplaints();
    const index = complaints.findIndex((c) => c.id === complaintId);
    if (index === -1) throw new Error('Complaint not found');

    const complaint = complaints[index];
    const oldStatus = complaint.status;

    // Validation: Require resolution notes and proof before marking resolved if configured
    if (newStatus === 'resolved' && !notes && !complaint.resolutionNotes) {
      throw new Error('Resolution notes explaining the repair are required before marking as Resolved.');
    }

    complaint.status = newStatus;
    complaint.updatedAt = new Date().toISOString();

    if (newStatus === 'acknowledged' && !complaint.acknowledgedAt) {
      complaint.acknowledgedAt = new Date().toISOString();
    }
    if (newStatus === 'resolved') {
      complaint.resolvedAt = new Date().toISOString();
      if (notes) complaint.resolutionNotes = notes;
      if (resolutionProofUrl) complaint.resolutionProofUrl = resolutionProofUrl;
    }
    if (newStatus === 'closed') {
      complaint.closedAt = new Date().toISOString();
    }

    complaints[index] = complaint;
    saveStored(STORAGE_KEYS.COMPLAINTS, complaints);

    // Record history
    await this.addStatusHistory(complaintId, oldStatus, newStatus, actor, notes || `Status changed to ${newStatus}`);

    // Notify reporter
    if (complaint.reporterId) {
      let title = `Complaint Status: ${complaint.complaintCode} is now ${newStatus.toUpperCase()}`;
      let message = notes || `Your complaint has been updated to ${newStatus}.`;
      let type: 'status_change' | 'resolution' = 'status_change';

      if (newStatus === 'resolved') {
        type = 'resolution';
        title = `Resolved: ${complaint.complaintCode}`;
        message = `Work is complete! Please inspect the repair and submit your satisfaction rating.`;
      }

      await this.createNotification({
        userId: complaint.reporterId,
        title,
        message,
        type,
        complaintId: complaint.id,
      });
    }

    // Audit log
    await this.logAudit(
      actor,
      'STATUS_UPDATE',
      'complaint',
      complaint.id,
      `Changed ${complaint.complaintCode} status from ${oldStatus} to ${newStatus}. Notes: ${notes || 'N/A'}`,
      oldStatus,
      newStatus
    );

    return complaint;
  }

  // Assign Complaint
  public static async assignComplaint(
    complaintId: string,
    staffId: string,
    actor: UserProfile,
    notes?: string
  ): Promise<Complaint> {
    const complaints = await this.getComplaints();
    const index = complaints.findIndex((c) => c.id === complaintId);
    if (index === -1) throw new Error('Complaint not found');

    const complaint = complaints[index];
    const oldStatus = complaint.status;

    // Find staff member
    const profiles: UserProfile[] = INITIAL_PROFILES;
    const staff = profiles.find((p) => p.id === staffId);
    if (!staff) throw new Error('Selected staff member not found');

    complaint.assignedToId = staff.id;
    complaint.assignedToName = staff.fullName;
    complaint.assignedById = actor.id;
    complaint.assignedByName = actor.fullName;
    if (complaint.status === 'submitted') {
      complaint.status = 'assigned';
    }
    complaint.updatedAt = new Date().toISOString();

    complaints[index] = complaint;
    saveStored(STORAGE_KEYS.COMPLAINTS, complaints);

    // Add status history
    await this.addStatusHistory(
      complaintId,
      oldStatus,
      complaint.status,
      actor,
      notes || `Assigned to technician ${staff.fullName}`
    );

    // Notify staff member
    await this.createNotification({
      userId: staff.id,
      title: `Task Assigned: ${complaint.complaintCode}`,
      message: `You were assigned ${complaint.title} in ${complaint.campusBuilding} ${complaint.roomNumber}.`,
      type: 'assignment',
      complaintId: complaint.id,
    });

    // Notify reporter
    if (complaint.reporterId) {
      await this.createNotification({
        userId: complaint.reporterId,
        title: `Technician Assigned: ${complaint.complaintCode}`,
        message: `${staff.fullName} from ${complaint.departmentName} has been assigned to handle your complaint.`,
        type: 'assignment',
        complaintId: complaint.id,
      });
    }

    // Audit log
    await this.logAudit(
      actor,
      'ASSIGN_STAFF',
      'complaint',
      complaint.id,
      `Assigned ${complaint.complaintCode} to ${staff.fullName}`
    );

    return complaint;
  }

  // Change Priority
  public static async updatePriority(
    complaintId: string,
    newPriority: Priority,
    actor: UserProfile,
    reason: string
  ): Promise<Complaint> {
    const complaints = await this.getComplaints();
    const idx = complaints.findIndex((c) => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');

    const complaint = complaints[idx];
    const oldPriority = complaint.priority;
    complaint.priority = newPriority;
    complaint.updatedAt = new Date().toISOString();

    complaints[idx] = complaint;
    saveStored(STORAGE_KEYS.COMPLAINTS, complaints);

    await this.logAudit(
      actor,
      'PRIORITY_CHANGE',
      'complaint',
      complaint.id,
      `Changed priority from ${oldPriority} to ${newPriority}. Reason: ${reason}`
    );

    return complaint;
  }

  // Status History
  private static async addStatusHistory(
    complaintId: string,
    oldStatus: ComplaintStatus,
    newStatus: ComplaintStatus,
    actor: UserProfile,
    reasonOrNotes: string
  ): Promise<void> {
    const history = loadStored<StatusHistory[]>(STORAGE_KEYS.HISTORY, INITIAL_STATUS_HISTORY);
    history.unshift({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      complaintId,
      oldStatus,
      newStatus,
      changedById: actor.id,
      changedByName: actor.fullName,
      reasonOrNotes,
      createdAt: new Date().toISOString(),
    });
    saveStored(STORAGE_KEYS.HISTORY, history);
  }

  public static async getStatusHistory(complaintId: string): Promise<StatusHistory[]> {
    const history = loadStored<StatusHistory[]>(STORAGE_KEYS.HISTORY, INITIAL_STATUS_HISTORY);
    return history.filter((h) => h.complaintId === complaintId);
  }

  // Comments & Notes
  public static async getComments(complaintId: string): Promise<ComplaintComment[]> {
    const comments = loadStored<ComplaintComment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    return comments.filter((c) => c.complaintId === complaintId);
  }

  public static async addComment(
    complaintId: string,
    actor: UserProfile,
    commentText: string,
    isInternal = false,
    attachmentUrl?: string
  ): Promise<ComplaintComment> {
    const comments = loadStored<ComplaintComment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    const newComment: ComplaintComment = {
      id: `comm-${Date.now()}`,
      complaintId,
      userId: actor.id,
      userName: actor.fullName,
      userRole: actor.role,
      comment: commentText,
      isInternal,
      attachmentUrl,
      createdAt: new Date().toISOString(),
    };

    comments.push(newComment);
    saveStored(STORAGE_KEYS.COMMENTS, comments);

    const complaint = await this.getComplaintById(complaintId);
    if (complaint && !isInternal && actor.id !== complaint.reporterId && complaint.reporterId) {
      await this.createNotification({
        userId: complaint.reporterId,
        title: `New Comment on ${complaint.complaintCode}`,
        message: `${actor.fullName}: ${commentText.slice(0, 80)}...`,
        type: 'info',
        complaintId,
      });
    }

    return newComment;
  }

  // Feedback & Ratings
  public static async submitFeedback(
    complaintId: string,
    actor: UserProfile,
    rating: number,
    comments: string,
    aspects?: { speed: number; quality: number; communication: number }
  ): Promise<Feedback> {
    const feedbackList = loadStored<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_FEEDBACK);
    const newFeedback: Feedback = {
      id: `fb-${Date.now()}`,
      complaintId,
      userId: actor.id,
      userName: actor.fullName,
      rating,
      satisfactionAspects: aspects,
      comments,
      createdAt: new Date().toISOString(),
    };

    feedbackList.unshift(newFeedback);
    saveStored(STORAGE_KEYS.FEEDBACK, feedbackList);

    await this.logAudit(
      actor,
      'SUBMIT_FEEDBACK',
      'complaint',
      complaintId,
      `Submitted ${rating}-star rating with feedback: "${comments}"`
    );

    return newFeedback;
  }

  public static async getFeedback(): Promise<Feedback[]> {
    return loadStored<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_FEEDBACK);
  }

  // Notifications
  public static async getNotifications(userId: string): Promise<Notification[]> {
    const list = loadStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    return list.filter((n) => n.userId === userId || n.userId === 'user-admin');
  }

  public static async createNotification(
    data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
  ): Promise<Notification> {
    const list = loadStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const notif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    list.unshift(notif);
    saveStored(STORAGE_KEYS.NOTIFICATIONS, list);
    return notif;
  }

  public static async markNotificationRead(id: string): Promise<void> {
    const list = loadStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const item = list.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      saveStored(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  public static async markAllNotificationsRead(userId: string): Promise<void> {
    const list = loadStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    list.forEach((n) => {
      if (n.userId === userId || n.userId === 'user-admin') {
        n.isRead = true;
      }
    });
    saveStored(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  // Assets
  public static async getAssets(): Promise<Asset[]> {
    return loadStored<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
  }

  public static async saveAsset(asset: Asset, actor: UserProfile): Promise<Asset> {
    const assets = await this.getAssets();
    const idx = assets.findIndex((a) => a.id === asset.id);
    if (idx >= 0) {
      assets[idx] = asset;
      await this.logAudit(actor, 'UPDATE_ASSET', 'asset', asset.id, `Updated asset: ${asset.name}`);
    } else {
      asset.id = `ast-${Date.now()}`;
      assets.push(asset);
      await this.logAudit(actor, 'CREATE_ASSET', 'asset', asset.id, `Created asset: ${asset.name}`);
    }
    saveStored(STORAGE_KEYS.ASSETS, assets);
    return asset;
  }

  // Maintenance Tasks
  public static async getMaintenanceTasks(): Promise<MaintenanceTask[]> {
    return loadStored<MaintenanceTask[]>(STORAGE_KEYS.TASKS, INITIAL_MAINTENANCE_TASKS);
  }

  public static async saveMaintenanceTask(task: MaintenanceTask, actor: UserProfile): Promise<MaintenanceTask> {
    const tasks = await this.getMaintenanceTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
      await this.logAudit(actor, 'UPDATE_MAINTENANCE_TASK', 'maintenance', task.id, `Updated task ${task.title}`);
    } else {
      task.id = `task-${Date.now()}`;
      task.createdAt = new Date().toISOString();
      tasks.push(task);
      await this.logAudit(actor, 'CREATE_MAINTENANCE_TASK', 'maintenance', task.id, `Created task ${task.title}`);
    }
    saveStored(STORAGE_KEYS.TASKS, tasks);
    return task;
  }

  // Knowledge Base
  public static async getKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
    return loadStored<KnowledgeBaseArticle[]>(STORAGE_KEYS.KB, INITIAL_KB_ARTICLES);
  }

  public static async saveKBArticle(
    article: KnowledgeBaseArticle,
    actor: UserProfile
  ): Promise<KnowledgeBaseArticle> {
    const articles = await this.getKnowledgeBaseArticles();
    const idx = articles.findIndex((a) => a.id === article.id);
    if (idx >= 0) {
      articles[idx] = article;
      await this.logAudit(actor, 'UPDATE_KB_ARTICLE', 'settings', article.id, `Updated article: ${article.title}`);
    } else {
      article.id = `kb-${Date.now()}`;
      article.createdAt = new Date().toISOString();
      articles.push(article);
      await this.logAudit(actor, 'CREATE_KB_ARTICLE', 'settings', article.id, `Created article: ${article.title}`);
    }
    saveStored(STORAGE_KEYS.KB, articles);
    return article;
  }

  // Campus Buildings
  public static async getBuildings(): Promise<CampusBuilding[]> {
    const buildings = loadStored<CampusBuilding[]>(STORAGE_KEYS.BUILDINGS, INITIAL_BUILDINGS);
    const complaints = await this.getComplaints();

    // Recalculate complaint numbers dynamically
    return buildings.map((b) => {
      const bComplaints = complaints.filter((c) => c.campusBuilding.toLowerCase().includes(b.name.toLowerCase()));
      const active = bComplaints.filter((c) => c.status !== 'closed' && c.status !== 'resolved');
      return {
        ...b,
        totalComplaints: bComplaints.length,
        activeComplaints: active.length,
      };
    });
  }

  // SLA Escalation Simulation check
  public static async checkOverdueComplaints(): Promise<{ overdueCount: number; escalatedCount: number }> {
    const complaints = await this.getComplaints();
    const now = new Date();
    let overdueCount = 0;
    let escalatedCount = 0;

    for (const c of complaints) {
      if (c.status !== 'closed' && c.status !== 'resolved') {
        const deadline = new Date(c.deadline);
        if (now > deadline) {
          overdueCount++;
          // Auto-escalate low/medium to high if overdue
          if (c.priority === 'low' || c.priority === 'medium') {
            c.priority = 'high';
            c.updatedAt = new Date().toISOString();
            escalatedCount++;
          }
        }
      }
    }

    if (escalatedCount > 0) {
      saveStored(STORAGE_KEYS.COMPLAINTS, complaints);
    }

    return { overdueCount, escalatedCount };
  }
}
