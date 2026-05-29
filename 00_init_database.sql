-- =====================================================
-- 1. EXPOSE THE SCHEMA TO THE API FIRST
-- =====================================================
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, storage, graphql_public, roof_top';
NOTIFY pgrst, 'reload config';

-- =====================================================
-- 2. CREATE SCHEMA AND GRANT ACCESS
-- =====================================================
CREATE SCHEMA IF NOT EXISTS roof_top;

GRANT USAGE ON SCHEMA roof_top TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON SCHEMA roof_top TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA roof_top GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA roof_top GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;


-- =====================================================
-- 3. CREATE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS roof_top.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    role_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS roof_top.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    module_name VARCHAR(255) NOT NULL,
    can_create BOOLEAN DEFAULT false,
    can_view BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS roof_top.states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    state_name VARCHAR(255) NOT NULL,
    state_code VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS roof_top.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    employee_name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    joining_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS roof_top.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    school_id VARCHAR(50) UNIQUE NOT NULL,
    district VARCHAR(150) NOT NULL,
    kgbv_name VARCHAR(255) NOT NULL,
    address TEXT,
    pin_code VARCHAR(10),
    principal_name VARCHAR(150),
    contact_number TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS roof_top.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    school_code UUID REFERENCES roof_top.schools(id) ON DELETE CASCADE,
    tank DOUBLE PRECISION DEFAULT 0,
    mms DOUBLE PRECISION DEFAULT 0,
    collectors DOUBLE PRECISION DEFAULT 0,
    plumbing DOUBLE PRECISION DEFAULT 0
);

CREATE TABLE IF NOT EXISTS roof_top.material_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    school_code UUID,
    material_code UUID REFERENCES roof_top.materials(id) ON DELETE CASCADE,
    material_images JSONB DEFAULT '[]'::jsonb
);


CREATE TABLE IF NOT EXISTS roof_top.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    gstin VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS roof_top.districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    state_id UUID REFERENCES roof_top.states(id) ON DELETE CASCADE,
    district_name VARCHAR(255) NOT NULL,
    district_code VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS roof_top.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    alternate_phone VARCHAR(255),
    email VARCHAR(255),
    aadhaar_no VARCHAR(255),
    pan_no VARCHAR(255),
    address TEXT,
    district_id UUID REFERENCES roof_top.districts(id) ON DELETE CASCADE,
    pincode VARCHAR(255),
    customer_type VARCHAR(255),
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS roof_top.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    employee_id VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(255),
    password TEXT NOT NULL,
    role_id UUID REFERENCES roof_top.roles(id) ON DELETE CASCADE,
    district VARCHAR(255),
    designation VARCHAR(255),
    profile_photo TEXT,
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS roof_top.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    role_id UUID REFERENCES roof_top.roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES roof_top.permissions(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS roof_top.rooftop_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    customer_id UUID REFERENCES roof_top.customers(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    project_code VARCHAR(255),
    capacity_kw DOUBLE PRECISION NOT NULL,
    project_type VARCHAR(255),
    rooftop_type VARCHAR(255),
    structure_type VARCHAR(255),
    discom_name VARCHAR(255),
    consumer_no VARCHAR(255),
    sanctioned_load VARCHAR(255),
    net_meter_required BOOLEAN DEFAULT false,
    project_status VARCHAR(255),
    estimated_cost DOUBLE PRECISION,
    subsidy_amount DOUBLE PRECISION,
    final_cost DOUBLE PRECISION,
    survey_date TIMESTAMPTZ,
    installation_date TIMESTAMPTZ,
    commissioning_date TIMESTAMPTZ,
    assigned_engineer VARCHAR(255),
    sales_person VARCHAR(255),
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS roof_top.site_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    project_id UUID REFERENCES roof_top.rooftop_projects(id) ON DELETE CASCADE,
    photo_type VARCHAR(255),
    file_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    uploaded_by VARCHAR(255),
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS roof_top.project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    project_id UUID REFERENCES roof_top.rooftop_projects(id) ON DELETE CASCADE,
    document_type VARCHAR(255),
    file_name VARCHAR(255),
    file_url TEXT,
    uploaded_by VARCHAR(255),
    uploaded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS roof_top.project_installation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    project_id UUID REFERENCES roof_top.rooftop_projects(id) ON DELETE CASCADE,
    structure_completed BOOLEAN DEFAULT false,
    panel_installation BOOLEAN DEFAULT false,
    inverter_installation BOOLEAN DEFAULT false,
    wiring_completed BOOLEAN DEFAULT false,
    earthing_completed BOOLEAN DEFAULT false,
    testing_completed BOOLEAN DEFAULT false,
    net_meter_installed BOOLEAN DEFAULT false,
    work_start_date TIMESTAMPTZ,
    work_end_date TIMESTAMPTZ,
    installation_status VARCHAR(255),
    updated_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS roof_top.project_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    project_id UUID REFERENCES roof_top.rooftop_projects(id) ON DELETE CASCADE,
    payment_type VARCHAR(255),
    amount DOUBLE PRECISION NOT NULL,
    payment_mode VARCHAR(255),
    transaction_no VARCHAR(255),
    payment_date TIMESTAMPTZ,
    received_by VARCHAR(255),
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS roof_top.stock_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    material_id UUID,
    project_id UUID REFERENCES roof_top.rooftop_projects(id) ON DELETE CASCADE,
    transaction_type VARCHAR(255),
    quantity DOUBLE PRECISION,
    balance DOUBLE PRECISION,
    reference_no VARCHAR(255),
    narration TEXT,
    created_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS roof_top.project_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    project_id UUID REFERENCES roof_top.rooftop_projects(id) ON DELETE CASCADE,
    old_status VARCHAR(255),
    new_status VARCHAR(255),
    changed_by VARCHAR(255),
    note TEXT
);

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON roof_top.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON roof_top.users(email);
CREATE INDEX IF NOT EXISTS idx_schools_school_id ON roof_top.schools(school_id);
CREATE INDEX IF NOT EXISTS idx_schools_district ON roof_top.schools(district);
CREATE INDEX IF NOT EXISTS idx_schools_kgbv_name ON roof_top.schools(kgbv_name);
CREATE INDEX IF NOT EXISTS idx_schools_pin_code ON roof_top.schools(pin_code);
CREATE INDEX IF NOT EXISTS idx_districts_state ON roof_top.districts(state_id);
CREATE INDEX IF NOT EXISTS idx_customers_district ON roof_top.customers(district_id);
CREATE INDEX IF NOT EXISTS idx_rooftop_projects_customer ON roof_top.rooftop_projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON roof_top.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_project_installation_project ON roof_top.project_installation(project_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_project ON roof_top.project_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_project ON roof_top.project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_site_photos_project ON roof_top.site_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_project ON roof_top.stock_ledger(project_id);

-- =====================================================
-- 5. INSERT DEFAULT DATA
-- =====================================================
INSERT INTO roof_top.roles (role_name, description)
VALUES
('Super Admin', 'Full access to all modules'),
('Project Manager', 'Handles project coordination'),
('Warehouse Manager', 'Handles stock and dispatch'),
('Survey Engineer', 'Handles site surveys'),
('Installation Engineer', 'Handles installations'),
('Technician', 'Field installation work'),
('QC Engineer', 'Quality checking'),
('Accounts', 'Finance and billing'),
('Viewer', 'Read only access')
ON CONFLICT (role_name) DO NOTHING;

-- =====================================================
-- 6. DISABLE RLS SO THE API WORKS INSTANTLY
-- =====================================================
ALTER TABLE roof_top.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.states DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.material_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.districts DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.rooftop_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.site_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.project_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.project_installation DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.project_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.stock_ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.project_status_logs DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- SCHOOL INSTALLATION
-- =====================================================
CREATE TABLE IF NOT EXISTS roof_top.school_installation (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    school_id UUID NOT NULL REFERENCES roof_top.schools(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES roof_top.materials(id) ON DELETE CASCADE,
    installation_code VARCHAR(100) UNIQUE NOT NULL,
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    
    tank_status VARCHAR(50) DEFAULT 'Pending',
    tank_percentage INTEGER DEFAULT 0,
    tank_remarks TEXT,
    tank_images JSONB DEFAULT '[]'::jsonb,
    tank_updated_at TIMESTAMPTZ,
    
    mms_status VARCHAR(50) DEFAULT 'Pending',
    mms_percentage INTEGER DEFAULT 0,
    mms_remarks TEXT,
    mms_images JSONB DEFAULT '[]'::jsonb,
    mms_updated_at TIMESTAMPTZ,
    
    collectors_status VARCHAR(50) DEFAULT 'Pending',
    collectors_percentage INTEGER DEFAULT 0,
    collectors_remarks TEXT,
    collectors_images JSONB DEFAULT '[]'::jsonb,
    collectors_updated_at TIMESTAMPTZ,
    
    plumbing_status VARCHAR(50) DEFAULT 'Pending',
    plumbing_percentage INTEGER DEFAULT 0,
    plumbing_remarks TEXT,
    plumbing_images JSONB DEFAULT '[]'::jsonb,
    plumbing_updated_at TIMESTAMPTZ
);

ALTER TABLE roof_top.school_installation DISABLE ROW LEVEL SECURITY;

-- Grant permissions on all tables and sequences for the custom schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA roof_top TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA roof_top TO anon, authenticated, service_role;


-- =====================================================
-- WAREHOUSES & MATERIAL INWARD
-- =====================================================
create table if not exists roof_top.warehouses (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone default now(),
    warehouse_name varchar(255) not null,
    location text,
    phone_number varchar(20),
    is_active boolean default true,
    address text,
    contact_person varchar(255),
    constraint warehouses_pkey
    primary key (id)
);

create table if not exists roof_top.material_inward (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone default now(),
    warehouse_id uuid not null,
    invoice_id varchar(100) not null,
    vendor_name varchar(255),
    material_name varchar(255) not null,
    quantity integer not null,
    inward_date timestamp with time zone default now(),
    inward_images jsonb default '[]'::jsonb,
    remarks text,
    constraint material_inward_pkey
    primary key (id),
    constraint material_inward_warehouse_id_fkey
    foreign key (warehouse_id)
    references roof_top.warehouses(id)
    on delete cascade
);

ALTER TABLE roof_top.materials
ADD COLUMN IF NOT EXISTS warehouse_id uuid;
 
ALTER TABLE roof_top.materials
ADD COLUMN IF NOT EXISTS dc_number varchar(100);
 
ALTER TABLE roof_top.materials
ADD COLUMN IF NOT EXISTS driver_name varchar(150);
 
ALTER TABLE roof_top.materials
ADD COLUMN IF NOT EXISTS driver_phone varchar(20);
 
ALTER TABLE roof_top.materials
ADD COLUMN IF NOT EXISTS vehicle_number varchar(50);
 
ALTER TABLE roof_top.materials
ADD COLUMN IF NOT EXISTS outward_images jsonb DEFAULT '[]'::jsonb;
 
ALTER TABLE roof_top.materials
ADD COLUMN IF NOT EXISTS remarks text;
 
-- Add warehouse foreign key
ALTER TABLE roof_top.materials
DROP CONSTRAINT IF EXISTS materials_warehouse_id_fkey;

ALTER TABLE roof_top.materials
ADD CONSTRAINT materials_warehouse_id_fkey
FOREIGN KEY (warehouse_id)
REFERENCES roof_top.warehouses(id)
ON DELETE SET NULL;
 
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_materials_warehouse_id
ON roof_top.materials(warehouse_id);
 
CREATE INDEX IF NOT EXISTS idx_materials_dc_number
ON roof_top.materials(dc_number);

ALTER TABLE roof_top.warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE roof_top.material_inward DISABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA roof_top TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA roof_top TO anon, authenticated, service_role;
