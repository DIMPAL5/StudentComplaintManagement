-- ==============================================================================
-- SMART CAMPUS 360 – POSTGRESQL DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Mirrors Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'staff', 'department_head', 'admin')),
    department_id UUID,
    phone TEXT,
    roll_or_emp_id TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    head_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key back to profiles for department_id
ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS fk_profiles_department,
    ADD CONSTRAINT fk_profiles_department FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

-- 3. COMPLAINT CATEGORIES
CREATE TABLE IF NOT EXISTS public.complaint_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    default_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    default_priority TEXT NOT NULL DEFAULT 'medium' CHECK (default_priority IN ('low', 'medium', 'high', 'critical')),
    sla_hours INTEGER NOT NULL DEFAULT 24,
    allow_anonymous BOOLEAN DEFAULT FALSE,
    icon TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CAMPUS ASSETS
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    building TEXT NOT NULL,
    room TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    installation_date DATE,
    condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'maintenance_required')),
    next_maintenance_date DATE,
    last_serviced_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.complaint_categories(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'acknowledged', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed', 'reopened')),
    
    -- Reporter Info
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporter_name TEXT NOT NULL,
    reporter_email TEXT NOT NULL,
    reporter_role TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    -- Location
    campus_building TEXT NOT NULL,
    block TEXT,
    floor TEXT,
    room_number TEXT NOT NULL,
    asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    
    -- Attachments & Resolutions
    image_url TEXT,
    resolution_proof_url TEXT,
    resolution_notes TEXT,
    
    -- Assignments
    assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Timestamps & SLA
    deadline TIMESTAMPTZ NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    is_safety_hazard BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMPLAINT ASSIGNMENTS (History of all delegations)
CREATE TABLE IF NOT EXISTS public.complaint_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    assigned_to_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notes TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COMPLAINT COMMENTS & INTERNAL NOTES
CREATE TABLE IF NOT EXISTS public.complaint_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Staff/Admin only notes
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. COMPLAINT STATUS HISTORY (Audit Trail)
CREATE TABLE IF NOT EXISTS public.complaint_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    changed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_by_name TEXT NOT NULL,
    reason_or_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'assignment', 'status_change', 'sla_warning', 'resolution', 'feedback_request', 'emergency')),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FEEDBACK & RATINGS
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL UNIQUE REFERENCES public.complaints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    aspects JSONB, -- { speed: 5, quality: 4, communication: 5 }
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. KNOWLEDGE BASE ARTICLES
CREATE TABLE IF NOT EXISTS public.knowledge_base_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category_id UUID REFERENCES public.complaint_categories(id) ON DELETE SET NULL,
    summary TEXT,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    views_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PREVENTIVE MAINTENANCE TASKS
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ NOT NULL,
    recurrence TEXT NOT NULL DEFAULT 'monthly' CHECK (recurrence IN ('one_time', 'weekly', 'monthly', 'quarterly')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'overdue')),
    notes TEXT,
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT NOT NULL,
    before_state TEXT,
    after_state TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-THROUGHPUT SEARCH & FILTERING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_code ON public.complaints(complaint_code);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_reporter ON public.complaints(reporter_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned ON public.complaints(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_complaints_building ON public.complaints(campus_building);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_comments_complaint ON public.complaint_comments(complaint_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles RLS
CREATE POLICY "Public profiles are readable by authenticated users" 
    ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Complaints RLS
CREATE POLICY "Students and faculty can view own complaints" 
    ON public.complaints FOR SELECT TO authenticated 
    USING (
        reporter_id = auth.uid() 
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'department_head', 'admin')
    );

CREATE POLICY "Students and faculty can insert complaints" 
    ON public.complaints FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Staff and admin can update complaint status and assignments" 
    ON public.complaints FOR UPDATE TO authenticated 
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'department_head', 'admin')
        OR (reporter_id = auth.uid() AND status = 'submitted')
    );

-- 3. Comments RLS
CREATE POLICY "Participants can view public comments; staff/admin can view internal notes" 
    ON public.complaint_comments FOR SELECT TO authenticated 
    USING (
        NOT is_internal 
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'department_head', 'admin')
    );

CREATE POLICY "Authorized users can insert comments" 
    ON public.complaint_comments FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- 4. Notifications RLS
CREATE POLICY "Users can view only their own notifications" 
    ON public.notifications FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notification read status" 
    ON public.notifications FOR UPDATE TO authenticated 
    USING (user_id = auth.uid());

-- 5. Audit Logs RLS
CREATE POLICY "Only admins can view audit logs" 
    ON public.audit_logs FOR SELECT TO authenticated 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
