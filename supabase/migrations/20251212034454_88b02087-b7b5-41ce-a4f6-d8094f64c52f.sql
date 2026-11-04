-- Phase 1: Template Knowledge Core

-- Create quote_templates table for trade-specific job templates
CREATE TABLE public.quote_templates_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade VARCHAR NOT NULL,
  speciality VARCHAR,
  template_name VARCHAR NOT NULL,
  template_key VARCHAR NOT NULL UNIQUE,
  description TEXT,
  -- Core template data
  required_materials JSONB NOT NULL DEFAULT '[]',
  optional_materials JSONB DEFAULT '[]',
  labour_tasks JSONB NOT NULL DEFAULT '[]',
  safety_requirements JSONB DEFAULT '[]',
  hidden_tasks JSONB DEFAULT '[]',
  compliance_rules JSONB DEFAULT '{}',
  environmental_requirements JSONB DEFAULT '{}',
  -- Price validation ranges
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  labour_hours_min NUMERIC,
  labour_hours_max NUMERIC,
  -- Context
  appliance_type VARCHAR,
  fuel_type VARCHAR,
  setting VARCHAR DEFAULT 'commercial',
  keywords TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create compliance_rules table for regulatory requirements
CREATE TABLE public.compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade VARCHAR NOT NULL,
  rule_code VARCHAR NOT NULL UNIQUE,
  regulation VARCHAR NOT NULL,
  description TEXT,
  required_items JSONB DEFAULT '[]',
  validation_logic TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create supplier_configs table for advanced crawling
CREATE TABLE public.supplier_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name VARCHAR NOT NULL UNIQUE,
  base_url VARCHAR NOT NULL,
  category_paths JSONB DEFAULT '[]',
  pagination_pattern VARCHAR,
  max_pages INTEGER DEFAULT 5,
  applicable_trades TEXT[],
  priority INTEGER DEFAULT 50,
  is_enabled BOOLEAN DEFAULT true,
  last_crawl_at TIMESTAMPTZ,
  crawl_status VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quote_templates_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_configs ENABLE ROW LEVEL SECURITY;

-- Everyone can read templates and rules (they're system-wide)
CREATE POLICY "Anyone can view quote templates" ON public.quote_templates_library
FOR SELECT USING (true);

CREATE POLICY "Anyone can view compliance rules" ON public.compliance_rules
FOR SELECT USING (true);

CREATE POLICY "Anyone can view supplier configs" ON public.supplier_configs
FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_templates_trade ON public.quote_templates_library(trade);
CREATE INDEX idx_templates_speciality ON public.quote_templates_library(speciality);
CREATE INDEX idx_templates_keywords ON public.quote_templates_library USING GIN(keywords);
CREATE INDEX idx_compliance_trade ON public.compliance_rules(trade);
CREATE INDEX idx_supplier_trades ON public.supplier_configs USING GIN(applicable_trades);

-- Seed initial compliance rules
INSERT INTO public.compliance_rules (trade, rule_code, regulation, description, required_items, is_mandatory) VALUES
('gas-engineer', 'GAS_SAFE_001', 'Gas Safe Regulations', 'All gas work requires isolation valves and proper testing', '["isolation valve", "gas pressure test", "gas safety certificate"]', true),
('gas-engineer', 'GAS_SAFE_002', 'Gas Safe Regulations', 'Commercial gas requires interlock systems', '["gas interlock system", "emergency gas shut-off"]', true),
('electrician', 'IET_18TH_001', 'IET 18th Edition Wiring Regulations', 'All circuits require RCD/RCBO protection', '["RCD protection", "earth bonding", "circuit testing"]', true),
('electrician', 'IET_18TH_002', 'IET 18th Edition', 'Cable sizing must match load requirements', '["appropriate cable gauge", "circuit breaker sizing"]', true),
('plumber', 'WRAS_001', 'WRAS Water Regulations', 'All fittings must be WRAS approved', '["WRAS approved fittings", "isolation valve"]', true),
('commercial-catering-engineer', 'COMM_KITCHEN_001', 'Commercial Kitchen Standards', 'Gas equipment requires interlock and extraction', '["gas interlock system", "extraction canopy check", "fire suppression verification"]', true),
('commercial-catering-engineer', 'COMM_KITCHEN_002', 'Commercial Kitchen Drainage', 'Commercial dishwashers require proper drainage', '["drainage connection", "grease trap check"]', true),
('hvac-engineer', 'HVAC_001', 'F-Gas Regulations', 'Refrigerant handling must comply with F-Gas', '["F-Gas certification check", "refrigerant recovery"]', true);

-- Seed supplier configurations
INSERT INTO public.supplier_configs (supplier_name, base_url, category_paths, pagination_pattern, max_pages, applicable_trades, priority) VALUES
('Nisbets', 'https://www.nisbets.co.uk', '["commercial-ovens", "dishwashers", "refrigeration", "cooking-equipment"]', '?page=', 10, ARRAY['commercial-catering-engineer'], 100),
('CaterKwik', 'https://www.caterkwik.co.uk', '["catering-equipment", "commercial-ovens", "dishwashers"]', '?page=', 8, ARRAY['commercial-catering-engineer'], 95),
('Next Day Catering', 'https://www.nextdaycatering.co.uk', '["commercial-kitchen", "cooking", "refrigeration"]', '?page=', 6, ARRAY['commercial-catering-engineer'], 90),
('Lockhart Catering', 'https://www.lockhart.co.uk', '["commercial-catering", "kitchen-equipment"]', '?page=', 5, ARRAY['commercial-catering-engineer'], 85),
('Screwfix', 'https://www.screwfix.com', '["electrical", "plumbing", "heating", "building-materials"]', '?page=', 10, ARRAY['electrician', 'plumber', 'gas-engineer', 'general-builder'], 80),
('Toolstation', 'https://www.toolstation.com', '["electrical", "plumbing", "heating", "tools"]', '?page=', 10, ARRAY['electrician', 'plumber', 'gas-engineer', 'general-builder'], 75),
('City Plumbing', 'https://www.cityplumbing.co.uk', '["plumbing", "heating", "bathroom"]', '?page=', 8, ARRAY['plumber', 'gas-engineer', 'hvac-engineer'], 85),
('CEF Electrical', 'https://www.cef.co.uk', '["electrical", "lighting", "cables"]', '?page=', 8, ARRAY['electrician'], 90),
('Partstown UK', 'https://www.partstown.co.uk', '["catering-parts", "hvac-parts", "refrigeration-parts"]', '?page=', 6, ARRAY['hvac-engineer', 'refrigeration-engineer', 'commercial-catering-engineer'], 85),
('Alliance Online', 'https://www.allianceonline.co.uk', '["catering-equipment", "refrigeration"]', '?page=', 5, ARRAY['commercial-catering-engineer', 'refrigeration-engineer'], 80);

-- Seed initial quote templates (Commercial Catering)
INSERT INTO public.quote_templates_library (trade, speciality, template_name, template_key, description, required_materials, optional_materials, labour_tasks, safety_requirements, hidden_tasks, compliance_rules, environmental_requirements, price_range_min, price_range_max, labour_hours_min, labour_hours_max, appliance_type, fuel_type, setting, keywords) VALUES
(
  'commercial-catering-engineer',
  'combi-ovens',
  'Rational Combi Oven Installation',
  'rational-combi-install',
  'Full installation of Rational iCombi series combi oven including all connections and commissioning',
  '[{"name": "Rational iCombi Pro/Classic", "category": "appliance", "mandatory": true, "priceMin": 8000, "priceMax": 25000}, {"name": "Gas isolation valve 1 inch", "category": "safety", "mandatory": true, "priceMin": 25, "priceMax": 80}, {"name": "Gas flex connector", "category": "connection", "mandatory": true, "priceMin": 30, "priceMax": 60}, {"name": "Water filter system", "category": "accessory", "mandatory": true, "priceMin": 150, "priceMax": 400}, {"name": "Drainage kit with air gap", "category": "drainage", "mandatory": true, "priceMin": 80, "priceMax": 150}]',
  '[{"name": "Combi oven stand", "category": "accessory", "priceMin": 300, "priceMax": 800}, {"name": "DERA descaler system", "category": "maintenance", "priceMin": 200, "priceMax": 400}, {"name": "Stacking kit", "category": "accessory", "priceMin": 150, "priceMax": 300}]',
  '[{"name": "Site survey and assessment", "minHours": 1, "maxHours": 2}, {"name": "Equipment delivery and positioning", "minHours": 1, "maxHours": 3}, {"name": "Gas connection and testing", "minHours": 2, "maxHours": 4}, {"name": "Water and drainage connection", "minHours": 1, "maxHours": 2}, {"name": "Electrical connection", "minHours": 1, "maxHours": 2}, {"name": "Commissioning and testing", "minHours": 2, "maxHours": 4}, {"name": "Staff training", "minHours": 1, "maxHours": 2}]',
  '[{"item": "Gas isolation valve", "regulation": "Gas Safe", "mandatory": true}, {"item": "Gas pressure test", "regulation": "Gas Safe", "mandatory": true}, {"item": "Interlock system check", "regulation": "Commercial Kitchen", "mandatory": true}]',
  '[{"task": "Check extraction canopy airflow", "reason": "Combi ovens produce steam"}, {"task": "Verify electrical supply capacity", "reason": "High power draw"}, {"task": "Waste disposal of packaging", "reason": "Large packaging volume"}, {"task": "Access equipment if needed", "reason": "Heavy equipment positioning"}]',
  '{"gas_safe": true, "ventilation_required": true, "drainage_required": true}',
  '{"ventilation": "Extraction canopy required above unit", "drainage": "40mm minimum drain with air gap", "electrical": "32A supply for electric, 13A for controls on gas"}',
  8500, 35000, 8, 20,
  'combi-oven',
  'gas',
  'commercial',
  ARRAY['rational', 'combi', 'oven', 'icombi', 'commercial', 'kitchen', 'steam', 'convection']
),
(
  'commercial-catering-engineer',
  'dishwashers',
  'Commercial Pass-Through Dishwasher Installation',
  'pass-through-dishwasher-install',
  'Installation of commercial pass-through dishwasher with all services',
  '[{"name": "Pass-through dishwasher", "category": "appliance", "mandatory": true, "priceMin": 2500, "priceMax": 8000}, {"name": "Inlet solenoid valve", "category": "safety", "mandatory": true, "priceMin": 40, "priceMax": 100}, {"name": "Water softener", "category": "accessory", "mandatory": true, "priceMin": 300, "priceMax": 800}, {"name": "Drainage connection kit", "category": "drainage", "mandatory": true, "priceMin": 50, "priceMax": 120}]',
  '[{"name": "Rinse booster pump", "category": "accessory", "priceMin": 200, "priceMax": 400}, {"name": "Pre-rinse spray arm", "category": "accessory", "priceMin": 150, "priceMax": 300}]',
  '[{"name": "Site assessment", "minHours": 0.5, "maxHours": 1}, {"name": "Equipment positioning", "minHours": 1, "maxHours": 2}, {"name": "Water connection", "minHours": 1, "maxHours": 2}, {"name": "Drainage connection", "minHours": 1, "maxHours": 2}, {"name": "Electrical connection", "minHours": 0.5, "maxHours": 1}, {"name": "Commissioning and testing", "minHours": 1, "maxHours": 2}]',
  '[{"item": "Inlet solenoid valve", "regulation": "Water Regulations", "mandatory": true}, {"item": "Backflow prevention", "regulation": "WRAS", "mandatory": true}]',
  '[{"task": "Check water pressure", "reason": "Adequate pressure required"}, {"task": "Grease trap inspection", "reason": "Commercial drainage requirement"}, {"task": "Staff training on chemicals", "reason": "Health and safety"}]',
  '{"wras_compliant": true, "drainage_required": true}',
  '{"water_supply": "15mm minimum hot and cold", "drainage": "50mm waste with grease trap", "electrical": "13A-32A depending on model"}',
  3000, 12000, 4, 10,
  'dishwasher',
  'electric',
  'commercial',
  ARRAY['dishwasher', 'pass-through', 'commercial', 'hobart', 'winterhalter', 'meiko', 'glasswasher']
),
(
  'commercial-catering-engineer',
  'fryers',
  'Commercial Fryer Installation',
  'commercial-fryer-install',
  'Installation of commercial gas or electric fryer',
  '[{"name": "Commercial fryer", "category": "appliance", "mandatory": true, "priceMin": 800, "priceMax": 4000}, {"name": "Gas isolation valve", "category": "safety", "mandatory": true, "priceMin": 25, "priceMax": 60}, {"name": "Gas flex connector", "category": "connection", "mandatory": true, "priceMin": 25, "priceMax": 50}, {"name": "Filtration system", "category": "accessory", "mandatory": false, "priceMin": 150, "priceMax": 400}]',
  '[{"name": "Auto-lift baskets", "category": "accessory", "priceMin": 200, "priceMax": 500}, {"name": "Oil disposal system", "category": "maintenance", "priceMin": 100, "priceMax": 250}]',
  '[{"name": "Site assessment", "minHours": 0.5, "maxHours": 1}, {"name": "Equipment positioning", "minHours": 0.5, "maxHours": 1}, {"name": "Gas connection", "minHours": 1, "maxHours": 2}, {"name": "Testing and commissioning", "minHours": 1, "maxHours": 2}]',
  '[{"item": "Gas isolation valve", "regulation": "Gas Safe", "mandatory": true}, {"item": "Extraction check", "regulation": "Fire Safety", "mandatory": true}]',
  '[{"task": "Fire suppression system check", "reason": "Fryers are fire risk"}, {"task": "Extraction canopy verification", "reason": "Fumes and heat extraction"}]',
  '{"gas_safe": true, "fire_suppression_check": true}',
  '{"ventilation": "Must be under extraction canopy", "gas_supply": "15mm minimum for single fryer"}',
  1200, 6000, 3, 6,
  'fryer',
  'gas',
  'commercial',
  ARRAY['fryer', 'deep', 'fat', 'commercial', 'gas', 'electric', 'valentine', 'lincat']
),
(
  'electrician',
  'commercial',
  'Commercial Consumer Unit Installation',
  'commercial-cu-install',
  'Installation of 3-phase or single-phase commercial consumer unit',
  '[{"name": "Commercial consumer unit", "category": "electrical", "mandatory": true, "priceMin": 300, "priceMax": 1500}, {"name": "MCBs", "category": "protection", "mandatory": true, "priceMin": 10, "priceMax": 30}, {"name": "RCBOs", "category": "protection", "mandatory": true, "priceMin": 40, "priceMax": 80}, {"name": "Main switch", "category": "protection", "mandatory": true, "priceMin": 50, "priceMax": 150}, {"name": "Meter tails", "category": "cable", "mandatory": true, "priceMin": 30, "priceMax": 80}]',
  '[{"name": "Surge protection device", "category": "protection", "priceMin": 80, "priceMax": 200}, {"name": "Smart meter upgrade", "category": "metering", "priceMin": 0, "priceMax": 50}]',
  '[{"name": "Survey and design", "minHours": 1, "maxHours": 2}, {"name": "Isolation and safe working", "minHours": 0.5, "maxHours": 1}, {"name": "CU installation", "minHours": 3, "maxHours": 6}, {"name": "Circuit connections", "minHours": 2, "maxHours": 4}, {"name": "Testing and certification", "minHours": 2, "maxHours": 4}]',
  '[{"item": "RCD protection", "regulation": "IET 18th Edition", "mandatory": true}, {"item": "Earth bonding", "regulation": "IET 18th Edition", "mandatory": true}]',
  '[{"task": "DNO notification if required", "reason": "New installation notification"}, {"task": "Minor works certificate", "reason": "Documentation required"}]',
  '{"iet_18th": true, "part_p": true}',
  '{"supply": "Adequate incoming supply capacity required"}',
  800, 4000, 8, 18,
  'consumer-unit',
  'electric',
  'commercial',
  ARRAY['consumer', 'unit', 'fuse', 'board', 'distribution', 'mcb', 'rcbo', 'three', 'phase']
),
(
  'plumber',
  'commercial',
  'Commercial Boiler Installation',
  'commercial-boiler-install',
  'Installation of commercial gas boiler system',
  '[{"name": "Commercial gas boiler", "category": "appliance", "mandatory": true, "priceMin": 3000, "priceMax": 15000}, {"name": "Flue system", "category": "ventilation", "mandatory": true, "priceMin": 300, "priceMax": 1000}, {"name": "Expansion vessel", "category": "system", "mandatory": true, "priceMin": 80, "priceMax": 250}, {"name": "Circulation pump", "category": "system", "mandatory": true, "priceMin": 150, "priceMax": 400}, {"name": "Gas isolation valve", "category": "safety", "mandatory": true, "priceMin": 30, "priceMax": 80}]',
  '[{"name": "Smart controls", "category": "controls", "priceMin": 200, "priceMax": 600}, {"name": "Magnetic filter", "category": "maintenance", "priceMin": 80, "priceMax": 200}]',
  '[{"name": "Site survey", "minHours": 1, "maxHours": 2}, {"name": "Old boiler removal", "minHours": 2, "maxHours": 4}, {"name": "New boiler installation", "minHours": 4, "maxHours": 8}, {"name": "Gas connection", "minHours": 1, "maxHours": 2}, {"name": "Flue installation", "minHours": 1, "maxHours": 3}, {"name": "System flush and fill", "minHours": 2, "maxHours": 4}, {"name": "Commissioning", "minHours": 1, "maxHours": 2}]',
  '[{"item": "Gas Safe certificate", "regulation": "Gas Safe", "mandatory": true}, {"item": "Benchmark commissioning", "regulation": "Building Regulations", "mandatory": true}]',
  '[{"task": "System powerflush", "reason": "Clean system for new boiler"}, {"task": "Landlord certificate if rental", "reason": "Legal requirement"}]',
  '{"gas_safe": true, "building_regs": true}',
  '{"gas_supply": "22mm or 28mm depending on kW", "flue": "Correct flue type and termination"}',
  4000, 20000, 12, 24,
  'boiler',
  'gas',
  'commercial',
  ARRAY['boiler', 'commercial', 'gas', 'heating', 'worcester', 'vaillant', 'viessmann', 'potterton']
),
(
  'gas-engineer',
  'catering',
  'Gas Range Cooker Installation',
  'gas-range-install',
  'Commercial gas range cooker installation',
  '[{"name": "Commercial gas range", "category": "appliance", "mandatory": true, "priceMin": 1500, "priceMax": 8000}, {"name": "Gas isolation valve", "category": "safety", "mandatory": true, "priceMin": 30, "priceMax": 80}, {"name": "Stability chain/bracket", "category": "safety", "mandatory": true, "priceMin": 15, "priceMax": 40}, {"name": "Gas flex connector", "category": "connection", "mandatory": true, "priceMin": 25, "priceMax": 50}]',
  '[{"name": "Splashback", "category": "accessory", "priceMin": 100, "priceMax": 300}]',
  '[{"name": "Site assessment", "minHours": 0.5, "maxHours": 1}, {"name": "Equipment positioning", "minHours": 0.5, "maxHours": 1.5}, {"name": "Gas connection", "minHours": 1, "maxHours": 2}, {"name": "Testing and commissioning", "minHours": 1, "maxHours": 2}]',
  '[{"item": "Gas isolation valve", "regulation": "Gas Safe", "mandatory": true}, {"item": "Stability device", "regulation": "Gas Safe", "mandatory": true}]',
  '[{"task": "Extraction canopy check", "reason": "Must be under extraction"}]',
  '{"gas_safe": true}',
  '{"gas_supply": "15-22mm depending on burner count", "ventilation": "Must be under extraction"}',
  2000, 10000, 3, 6,
  'range-cooker',
  'gas',
  'commercial',
  ARRAY['range', 'cooker', 'gas', 'burner', 'oven', 'commercial', 'lincat', 'falcon', 'blue seal']
),
(
  'hvac-engineer',
  'air-conditioning',
  'Split System AC Installation',
  'split-ac-install',
  'Wall-mounted split system air conditioning installation',
  '[{"name": "Split AC indoor unit", "category": "appliance", "mandatory": true, "priceMin": 400, "priceMax": 1500}, {"name": "Split AC outdoor unit", "category": "appliance", "mandatory": true, "priceMin": 500, "priceMax": 2000}, {"name": "Refrigerant pipework", "category": "installation", "mandatory": true, "priceMin": 100, "priceMax": 300}, {"name": "Condensate drain", "category": "drainage", "mandatory": true, "priceMin": 30, "priceMax": 80}, {"name": "Electrical supply cable", "category": "electrical", "mandatory": true, "priceMin": 40, "priceMax": 100}]',
  '[{"name": "Pipe cover/trunking", "category": "aesthetic", "priceMin": 50, "priceMax": 150}, {"name": "Smart wifi controller", "category": "controls", "priceMin": 80, "priceMax": 200}]',
  '[{"name": "Site survey", "minHours": 0.5, "maxHours": 1}, {"name": "Indoor unit mounting", "minHours": 1, "maxHours": 2}, {"name": "Outdoor unit installation", "minHours": 1, "maxHours": 2}, {"name": "Pipework and connections", "minHours": 2, "maxHours": 4}, {"name": "Electrical connection", "minHours": 1, "maxHours": 2}, {"name": "Vacuum and charge", "minHours": 1, "maxHours": 2}, {"name": "Commissioning", "minHours": 0.5, "maxHours": 1}]',
  '[{"item": "F-Gas certification", "regulation": "F-Gas Regulations", "mandatory": true}]',
  '[{"task": "Core drilling for pipes", "reason": "Wall penetration required"}, {"task": "Bracket installation", "reason": "Outdoor unit support"}]',
  '{"f_gas": true}',
  '{"electrical": "Dedicated circuit required", "drainage": "Condensate must be properly routed"}',
  1500, 5000, 6, 12,
  'air-conditioning',
  'electric',
  'commercial',
  ARRAY['air', 'conditioning', 'ac', 'split', 'daikin', 'mitsubishi', 'fujitsu', 'lg', 'samsung']
),
(
  'refrigeration-engineer',
  'cold-rooms',
  'Cold Room Installation',
  'cold-room-install',
  'Walk-in cold room installation',
  '[{"name": "Cold room panels", "category": "structure", "mandatory": true, "priceMin": 2000, "priceMax": 8000}, {"name": "Condensing unit", "category": "appliance", "mandatory": true, "priceMin": 1500, "priceMax": 5000}, {"name": "Evaporator", "category": "appliance", "mandatory": true, "priceMin": 500, "priceMax": 1500}, {"name": "Door assembly", "category": "structure", "mandatory": true, "priceMin": 400, "priceMax": 1200}, {"name": "Refrigerant pipework", "category": "installation", "mandatory": true, "priceMin": 200, "priceMax": 500}]',
  '[{"name": "Strip curtain", "category": "accessory", "priceMin": 100, "priceMax": 300}, {"name": "Shelving system", "category": "storage", "priceMin": 300, "priceMax": 800}, {"name": "Temperature alarm", "category": "safety", "priceMin": 150, "priceMax": 400}]',
  '[{"name": "Site survey and design", "minHours": 2, "maxHours": 4}, {"name": "Panel assembly", "minHours": 4, "maxHours": 8}, {"name": "Door fitting", "minHours": 1, "maxHours": 2}, {"name": "Refrigeration installation", "minHours": 4, "maxHours": 8}, {"name": "Electrical connection", "minHours": 1, "maxHours": 2}, {"name": "Commissioning and testing", "minHours": 2, "maxHours": 4}]',
  '[{"item": "F-Gas compliance", "regulation": "F-Gas Regulations", "mandatory": true}, {"item": "Temperature logging", "regulation": "Food Safety", "mandatory": true}]',
  '[{"task": "Floor preparation", "reason": "Level base required"}, {"task": "Drainage for defrost", "reason": "Water management"}]',
  '{"f_gas": true, "food_safety": true}',
  '{"electrical": "Dedicated supply for condensing unit", "drainage": "Defrost drain required"}',
  5000, 20000, 14, 28,
  'cold-room',
  'electric',
  'commercial',
  ARRAY['cold', 'room', 'walk-in', 'freezer', 'chiller', 'refrigeration', 'foster', 'williams']
);