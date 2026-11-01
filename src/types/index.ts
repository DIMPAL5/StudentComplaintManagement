export type UserRole = 'student' | 'professor' | 'staff' | 'hod' | 'admin' | 'faculty' | 'department_head';

export type AccountStatus = 'pending' | 'approved' | 'suspended';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  password?: string;
  departmentId?: string;
  departmentName?: string;
  phone?: string;
  rollOrEmpId?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  headId?: string;
  headName?: string;
  contactEmail: string;
  contactPhone: string;
  active: boolean;
  complaintCount?: number;
  resolvedCount?: number;
  createdAt: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintStatus =
  | 'submitted'
  | 'acknowledged'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'resolved'
  | 'closed'
  | 'reopened';

export interface ComplaintCategory {
  id: string;
  name: string;
  defaultDepartmentId: string;
  defaultPriority: Priority;
  slaHours: number;
  allowAnonymous: boolean;
  icon: string;
  description: string;
}

export interface Complaint {
  id: string;
  complaintCode: string; // e.g. CMP-2026-1001
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  departmentId: string;
  departmentName: string;
  priority: Priority;
  status: ComplaintStatus;
  
  // Reporter info
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reporterRole: UserRole;
  isAnonymous: boolean;
  
  // Location
  campusBuilding: string;
  block: string;
  floor: string;
  roomNumber: string;
  assetId?: string;
  assetName?: string;
  
  // Media & Resolution
  imageUrl?: string;
  resolutionProofUrl?: string;
  resolutionNotes?: string;
  
  // Assignment
  assignedToId?: string;
  assignedToName?: string;
  assignedById?: string;
  assignedByName?: string;
  
  // Timestamps & SLA
  deadline: string; // ISO string
  acknowledgedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  isSafetyHazard: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintComment {
  id: string;
  complaintId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  comment: string;
  isInternal: boolean; // Staff/Admin only notes
  attachmentUrl?: string;
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  complaintId: string;
  oldStatus: ComplaintStatus;
  newStatus: ComplaintStatus;
  changedById: string;
  changedByName: string;
  reasonOrNotes: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'assignment' | 'status_change' | 'sla_warning' | 'resolution' | 'feedback_request' | 'emergency';
  complaintId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Feedback {
  id: string;
  complaintId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  satisfactionAspects?: {
    speed: number;
    quality: number;
    communication: number;
  };
  comments: string;
  createdAt: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  summary: string;
  content: string;
  tags: string[];
  viewsCount: number;
  helpfulCount: number;
  isPublished: boolean;
  createdAt: string;
}

export interface Asset {
  id: string;
  assetCode: string; // AST-PRJ-004
  name: string;
  category: string;
  building: string;
  room: string;
  departmentId: string;
  departmentName: string;
  installationDate: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'maintenance_required';
  nextMaintenanceDate: string;
  lastServicedDate: string;
  complaintCount: number;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  assetId?: string;
  assetName?: string;
  departmentId: string;
  departmentName: string;
  assignedToId?: string;
  assignedToName?: string;
  dueDate: string;
  recurrence: 'one_time' | 'weekly' | 'monthly' | 'quarterly';
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  notes: string;
  completionNotes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: 'complaint' | 'user' | 'department' | 'asset' | 'maintenance' | 'settings' | 'auth';
  entityId: string;
  details: string;
  beforeState?: string;
  afterState?: string;
  timestamp: string;
}

export interface CampusBuilding {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floors: number;
  totalComplaints: number;
  activeComplaints: number;
  type: 'academic' | 'lab' | 'admin' | 'hostel' | 'amenity';
}

export interface SystemSettings {
  slaCriticalHours: number;
  slaHighHours: number;
  slaMediumHours: number;
  slaLowHours: number;
  allowPublicRegistration: boolean;
  requireResolutionProof: boolean;
  autoDepartmentAssignment: boolean;
  campusName: string;
  supportPhone: string;
  supportEmail: string;
}
