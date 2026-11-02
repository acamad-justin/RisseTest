-- ============================================================================
-- RISSE AI PHASE 2 — MILESTONE 2A MIGRATION: REVISED IMPLEMENTATION
-- CURRICULUM ONTOLOGY, SCOPED CONVERSATIONS & FOUNDATIONAL MEMORY EVIDENCE
-- Migration: 20261102000004_milestone2a_curriculum_memory_schema.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Curriculum Modules (Production 101–106; Strictly omits fixture 999)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_modules (
    id VARCHAR(32) PRIMARY KEY,
    title TEXT NOT NULL,
    level TEXT NOT NULL,
    level_color TEXT NOT NULL,
    total_steps INT NOT NULL,
    skills_acquired TEXT[] NOT NULL DEFAULT '{}',
    badge_name TEXT NOT NULL,
    description TEXT NOT NULL,
    display_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.curriculum_modules ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.curriculum_modules TO authenticated, anon;

DROP POLICY IF EXISTS "curriculum_modules_public_read" ON public.curriculum_modules;
CREATE POLICY "curriculum_modules_public_read"
    ON public.curriculum_modules FOR SELECT
    USING (true);

-- Seed Verified Production Modules
INSERT INTO public.curriculum_modules 
    (id, title, level, level_color, total_steps, skills_acquired, badge_name, description, display_order)
VALUES
    ('101', 'Sensors & Perception', 'Beginner', 'yellow', 3, 
     ARRAY['Component Identification', 'Circuit Assembly', 'Electrical Signals'], 
     'Sensor Scout', 'Fundamental sensing technologies, analog/digital inputs, and noise filtration.', 1),
    ('102', 'Programming Robot Behavior', 'Intermediate', 'pink', 5, 
     ARRAY['Programming Logic', 'Conditional Behavior', 'Sensor-Driven Motion'], 
     'Behavior Programmer', 'Core robotics control loops, reactive behaviors, and interrupt execution.', 2),
    ('103', 'Robotics Fundamentals', 'Beginner', 'yellow', 4, 
     ARRAY['Circuit Fundamentals', 'Motor Control', 'Power Management'], 
     'Motion Builder', 'Actuation physics, motor drivers, PWM, and electrical isolation.', 3),
    ('104', 'Sumobot Design & Competition', 'Advanced', 'purple', 6, 
     ARRAY['Mechanical Design', 'Strategic Programming', 'Performance Tuning'], 
     'Sumo Champion', 'Competitive sumobot engineering: chassis dynamics, traction, and pit debugging.', 4),
    ('105', 'Embedded Microcontroller Architecture', 'Intermediate', 'pink', 4, 
     ARRAY['Hardware Registers', 'SPI/I2C Communication', 'Clock Timers'], 
     'System Architect', 'Direct register manipulation, hardware communication buses, and timers.', 5),
    ('106', 'Closed-Loop Control & Motion', 'Advanced', 'purple', 5, 
     ARRAY['Quadrature Encoders', 'PID Control', 'Motion Profiling'], 
     'Feedback Master', 'Closed-loop feedback loops, encoder odometry, and precision PID tuning.', 6)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    level = EXCLUDED.level,
    level_color = EXCLUDED.level_color,
    total_steps = EXCLUDED.total_steps,
    skills_acquired = EXCLUDED.skills_acquired,
    badge_name = EXCLUDED.badge_name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- ----------------------------------------------------------------------------
-- 2. Curriculum Checkpoints (27 Verified Checkpoints Across Modules 101–106)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_checkpoints (
    id VARCHAR(64) NOT NULL,
    module_id VARCHAR(32) NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    skills_acquired TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT uq_checkpoints_module_id UNIQUE (module_id, id)
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_module_step 
    ON public.curriculum_checkpoints(module_id, step_number);

ALTER TABLE public.curriculum_checkpoints ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.curriculum_checkpoints TO authenticated, anon;

DROP POLICY IF EXISTS "curriculum_checkpoints_public_read" ON public.curriculum_checkpoints;
CREATE POLICY "curriculum_checkpoints_public_read"
    ON public.curriculum_checkpoints FOR SELECT
    USING (true);

-- Seed the 27 Verified Checkpoints
INSERT INTO public.curriculum_checkpoints 
    (id, module_id, step_number, title, description, skills_acquired)
VALUES
    -- Module 101 (3 steps)
    ('cp_101_1', '101', 1, 'Circuit Assembly & Passive Components', 'Wiring breadboards, reading resistor color codes, and building voltage divider circuits.', ARRAY['Breadboard Prototyping', 'Passive Components', 'Voltage Dividers']),
    ('cp_101_2', '101', 2, 'Time-of-Flight Ranging & Thresholds', 'Interfacing ultrasonic and infrared proximity sensors to read distance metrics.', ARRAY['Time-of-Flight Sensing', 'Distance Calibration', 'Signal Conditioning']),
    ('cp_101_3', '101', 3, 'Contact Sensing & Digital Debounce', 'Integrating mechanical limit switches with RC debounce and software debounce logic.', ARRAY['Contact Sensing', 'Switch Debounce', 'Digital Inputs']),

    -- Module 102 (5 steps)
    ('cp_102_1', '102', 1, 'Logic Architecture & Execution Loop', 'Structuring state-machine loops and deterministic execution scheduling.', ARRAY['State Machines', 'Execution Scheduling', 'Microcontroller Loop']),
    ('cp_102_2', '102', 2, 'Timed Actuation & Open-Loop Motion', 'Calibrating fixed-interval motor pulses and understanding open-loop drift.', ARRAY['Timed Actuation', 'Open-Loop Dynamics', 'Motor Timing']),
    ('cp_102_3', '102', 3, 'Sensor-Driven Reactive Behavior Loops', 'Developing obstacle avoidance and cliff detection reactive state machines.', ARRAY['Reactive Control', 'Sensor Integration', 'Obstacle Avoidance']),
    ('cp_102_4', '102', 4, 'Hardware Interrupts for Emergency Halts', 'Attaching external edge-triggered interrupt lines for fail-safe safety cutoffs.', ARRAY['Hardware Interrupts', 'ISR Handlers', 'Emergency Halts']),
    ('cp_102_5', '102', 5, 'Telemetry Logging & Serial Baud Tuning', 'Transmitting runtime sensor packet streams over serial UART without blocking loops.', ARRAY['Serial Communication', 'Telemetry Logging', 'Baud Tuning']),

    -- Module 103 (4 steps)
    ('cp_103_1', '103', 1, 'Rotational Force & Stall Characteristics', 'Calculating mechanical torque curves, gear reduction leverage, and motor stall limits.', ARRAY['Torque Analysis', 'Gear Ratio Calculation', 'Stall Current Estimation']),
    ('cp_103_2', '103', 2, 'Duty Cycle & Voltage Modulation', 'Generating PWM signals to modulate effective DC motor drive voltage.', ARRAY['PWM Control', 'Duty Cycle Tuning', 'Voltage Modulation']),
    ('cp_103_3', '103', 3, 'Current Gate Amplification & Heat Sinks', 'Selecting and wiring H-Bridge MOSFET driver stages for bi-directional rotation.', ARRAY['H-Bridge Wiring', 'Thermal Dissipation', 'Gate Drive Circuitry']),
    ('cp_103_4', '103', 4, 'Shared Ground & Inductive Isolation', 'Isolating logic MCU rails from inductive high-current motor surges with common grounds.', ARRAY['Ground Loops', 'Inductive Isolation', 'Power Decoupling']),

    -- Module 104 (6 steps)
    ('cp_104_1', '104', 1, 'Low Center of Mass & Incline Stability', 'Distributing heavy ballast and battery weight low to counter overturning moments.', ARRAY['Center of Gravity', 'Ballast Distribution', 'Incline Dynamics']),
    ('cp_104_2', '104', 2, 'Torsional Stiffening & Proportionality', 'Reinforcing chassis structural rigidity to eliminate diagonal frame flex.', ARRAY['Chassis Rigidity', 'Structural Bracing', 'Torsional Stiffness']),
    ('cp_104_3', '104', 3, 'Normal Force, Silicone Tires & Grip', 'Maximizing wheel friction coefficient with soft silicone compounds on dohyo surfaces.', ARRAY['Traction Optimization', 'Normal Force Modeling', 'Friction Coefficients']),
    ('cp_104_4', '104', 4, 'Gear Lash Minimization in High-Torque Pits', 'Aligning spur pinion meshes to prevent backlash shock during explosive starts.', ARRAY['Backlash Elimination', 'Gear Mesh Tuning', 'Drivetrain Shock Resistance']),
    ('cp_104_5', '104', 5, 'Transient Voltage Dips under Motor Stall', 'Mitigating brownout resets with reservoir capacitors during sudden heavy pushing contests.', ARRAY['Brownout Protection', 'Transient Current Handling', 'Power Filtering']),
    ('cp_104_6', '104', 6, 'Keyed Power Connectors & Diode Protection', 'Protecting competitive electronics with XT30 connectors, polarity protection, and LiPo cutoffs.', ARRAY['Reverse Polarity Protection', 'Battery Safety Standards', 'Keyed Wiring']),

    -- Module 105 (4 steps)
    ('cp_105_1', '105', 1, 'Open-Drain Lines & Floating Input Avoidance', 'Configuring pull-up resistors on high-impedance inputs to maintain clear logic levels.', ARRAY['Pull-Up Resistors', 'Floating Line Elimination', 'Digital Input Physics']),
    ('cp_105_2', '105', 2, 'Two-Wire Bus SDA/SCL Arbitration', 'Communicating with multiple sensor nodes using I2C addressing and ACK/NACK signaling.', ARRAY['I2C Protocol', 'Bus Arbitration', 'Peripheral Addressing']),
    ('cp_105_3', '105', 3, 'High-Frequency MOSI/MISO/SCK Transfers', 'Streaming high-speed data packets across synchronized 4-wire SPI buses.', ARRAY['SPI Bus', 'Synchronous Clocking', 'High-Rate Communication']),
    ('cp_105_4', '105', 4, 'Inductive Flyback Clamping & Snubbers', 'Dissipating counter-EMF spikes from inductive motor coils with flyback diodes.', ARRAY['Flyback Diodes', 'Back-EMF Clamping', 'Inductive Transient Snubbing']),

    -- Module 106 (5 steps)
    ('cp_106_1', '106', 1, 'Quadrature Pulse Counting & Velocity', 'Decoding 2-channel quadrature phase signals to measure real-time wheel velocity.', ARRAY['Quadrature Encoders', 'Phase Decoding', 'Velocity Calculation']),
    ('cp_106_2', '106', 2, 'Closed-Loop Error Calculation & Correction', 'Constructing closed-loop feedback systems using instantaneous error signals.', ARRAY['Closed-Loop Control', 'Error Calculation', 'Proportional Feedback']),
    ('cp_106_3', '106', 3, 'Accumulating Error & Steady-State Nulling', 'Integrating historical error to eliminate steady-state load offsets.', ARRAY['Integral Control', 'Steady-State Error', 'Anti-Windup Logic']),
    ('cp_106_4', '106', 4, 'Ziegler-Nichols Heuristics & Oscillation', 'Empirical tuning of proportional, integral, and derivative gains via step response.', ARRAY['PID Tuning', 'Gain Margin Tuning', 'Ziegler-Nichols Heuristics']),
    ('cp_106_5', '106', 5, 'Dynamic Trajectory & Battery Cutoff', 'Executing smooth velocity setpoint profiles with real-time feedback tracking.', ARRAY['Setpoint Tracking', 'Trajectory Profiling', 'Closed-Loop Navigation'])
ON CONFLICT (id) DO UPDATE SET
    module_id = EXCLUDED.module_id,
    step_number = EXCLUDED.step_number,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    skills_acquired = EXCLUDED.skills_acquired;

-- ----------------------------------------------------------------------------
-- 3. Curriculum Concepts (36 Verified Concepts Across 6 Disciplines)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_concepts (
    id VARCHAR(64) PRIMARY KEY,
    name TEXT NOT NULL,
    domain VARCHAR(32) NOT NULL CHECK (domain IN ('mechanical', 'electronics', 'sensing', 'control', 'programming', 'safety')),
    difficulty_tier VARCHAR(16) NOT NULL DEFAULT 'foundational' CHECK (difficulty_tier IN ('foundational', 'intermediate', 'advanced')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_concepts_domain 
    ON public.curriculum_concepts(domain);

ALTER TABLE public.curriculum_concepts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.curriculum_concepts TO authenticated, anon;

DROP POLICY IF EXISTS "curriculum_concepts_public_read" ON public.curriculum_concepts;
CREATE POLICY "curriculum_concepts_public_read"
    ON public.curriculum_concepts FOR SELECT
    USING (true);

-- Seed Verified 36 Concepts
INSERT INTO public.curriculum_concepts 
    (id, name, domain, difficulty_tier, description)
VALUES
    -- Mechanical (6)
    ('torque', 'Torque & Rotational Force', 'mechanical', 'foundational', 'Rotational force delivered by an actuator to overcome static and dynamic mechanical resistance.'),
    ('gear_ratio', 'Gear Ratios & Mechanical Advantage', 'mechanical', 'foundational', 'Trade-off between speed and rotational torque determined by interlocking gear pitch and teeth ratios.'),
    ('center_of_gravity', 'Center of Gravity & Equilibrium', 'mechanical', 'intermediate', 'Mass centroid location affecting vehicle tipping thresholds, climbing stability, and handling.'),
    ('traction', 'Traction & Surface Friction', 'mechanical', 'intermediate', 'Frictional force generated at tire contact patches to translate motor torque into chassis thrust.'),
    ('chassis_rigidity', 'Chassis Rigidity & Structural Bracing', 'mechanical', 'advanced', 'Frame resistance to diagonal flex and torsional deformation under sudden competitive impacts.'),
    ('backlash', 'Gear Lash & Drivetrain Play', 'mechanical', 'advanced', 'Clearance between mating gear teeth causing rotational lag and shock loads during reversals.'),

    -- Electronics (8)
    ('pwm', 'Pulse Width Modulation (PWM)', 'electronics', 'foundational', 'Varying signal duty cycles at fixed frequency to simulate variable analog voltage delivery.'),
    ('h_bridge', 'H-Bridge Switching Circuits', 'electronics', 'intermediate', 'Solid-state transistor arrangement allowing reversible DC polarity and motor direction reversal.'),
    ('motor_driver', 'Motor Driver Interfaces', 'electronics', 'intermediate', 'Gate driver circuits buffering low-power MCU logic from high-current actuator draw.'),
    ('voltage_divider', 'Voltage Dividers', 'electronics', 'foundational', 'Passive resistor pair scaling high voltage signals into MCU-safe input ranges.'),
    ('pull_up_resistor', 'Pull-Up and Pull-Down Resistors', 'electronics', 'foundational', 'Biasing high-impedance inputs to prevent undefined floating logic levels.'),
    ('brownout', 'Brownout Conditions & Transients', 'electronics', 'intermediate', 'MCU voltage collapse below operating margins caused by surge currents during motor stall.'),
    ('reverse_polarity', 'Reverse Polarity Hazards & Protection', 'electronics', 'foundational', 'Circuit destruction prevention using diodes and keyed connectors against inverted battery leads.'),
    ('back_emf', 'Back Electromotive Force & Inductive Flyback', 'electronics', 'advanced', 'Voltage spike induced by collapsing magnetic fields when motor coils are suddenly switched off.'),

    -- Sensing (6)
    ('ultrasonic_sensor', 'Ultrasonic Ranging', 'sensing', 'foundational', 'Measuring distance by timing acoustic pulses from transmitter to target echo reflection.'),
    ('encoder', 'Quadrature Encoders', 'sensing', 'advanced', 'Optical or magnetic 2-channel phase sensors tracking shaft angular position and rotational rate.'),
    ('infrared_sensor', 'Infrared Reflectance & Proximity', 'sensing', 'foundational', 'Detecting line edges and obstacle proximity by measuring reflected infrared light intensity.'),
    ('imu', 'Inertial Measurement Units (IMU)', 'sensing', 'advanced', 'Combining gyroscopes and accelerometers to estimate orientation, tilt, and acceleration vectors.'),
    ('limit_switch', 'Mechanical Limit Switches', 'sensing', 'foundational', 'Physical contact switches delivering instant digital state transitions upon robot collision.'),
    ('analog_to_digital', 'Analog-to-Digital Conversion (ADC)', 'sensing', 'foundational', 'Quantizing continuous environmental voltage levels into discrete digital processor integers.'),

    -- Control (8)
    ('open_loop', 'Open-Loop Control', 'control', 'foundational', 'Issuing actuation commands without feedback or verification of actual real-world robot motion.'),
    ('closed_loop', 'Closed-Loop Feedback Control', 'control', 'intermediate', 'Continuously measuring output error and executing corrective commands to reach target state.'),
    ('pid_controller', 'PID Controllers', 'control', 'advanced', 'Combined proportional, integral, and derivative mathematical control loop for setpoint nulling.'),
    ('proportional_control', 'Proportional Feedback Control', 'control', 'intermediate', 'Corrective action scaled directly proportional to the magnitude of instantaneous error.'),
    ('integral_control', 'Integral Error Accumulation', 'control', 'advanced', 'Summing persistent steady-state offset error over time to force complete convergence to setpoint.'),
    ('derivative_control', 'Derivative Rate-of-Change Control', 'control', 'advanced', 'Dampening system overshoot by resisting rapid changes in error over time.'),
    ('tuning_gain', 'PID Gain Parameter Tuning', 'control', 'advanced', 'Heuristic and manual calibration of loop parameters (Kp, Ki, Kd) for stable convergence.'),
    ('setpoint_tracking', 'Setpoint Tracking & Trajectory', 'control', 'advanced', 'Guiding an actuator to dynamic position and velocity targets along smooth motion curves.'),

    -- Programming (6)
    ('microcontroller', 'Microcontroller Architecture & Execution', 'programming', 'foundational', 'Single-chip processor coordinating peripheral sensors, timers, interrupts, and logic loops.'),
    ('gpio_registers', 'GPIO Registers & Port Manipulation', 'programming', 'intermediate', 'Configuring MCU pins and reading raw binary states via low-level hardware memory registers.'),
    ('interrupt_service_routine', 'Interrupt Service Routines (ISR)', 'programming', 'advanced', 'Hardware-triggered subroutines halting main loop execution for immediate emergency response.'),
    ('serial_communication', 'UART Serial Communication', 'programming', 'foundational', 'Asynchronous byte streaming between robot microcontroller and debug workstations.'),
    ('i2c_protocol', 'I2C Two-Wire Bus Protocol', 'programming', 'intermediate', 'Synchronous address-based serial bus enabling communication with multiple sensor nodes.'),
    ('spi_protocol', 'SPI Serial Peripheral Interface', 'programming', 'advanced', 'High-speed synchronous 4-wire bus for rapid sensor, display, and memory transfers.'),

    -- Safety (2)
    ('battery_safety', 'Lithium Polymer Battery Safety', 'safety', 'foundational', 'Managing high-discharge chemistry hazards, low-voltage thresholds, swelling, and fire risk.'),
    ('power_isolation', 'Power Isolation & Common Grounding', 'safety', 'foundational', 'Safely tying logic and power ground planes while maintaining electrical noise separation.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    domain = EXCLUDED.domain,
    difficulty_tier = EXCLUDED.difficulty_tier,
    description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 4. Concept Prerequisites (Strict DAG Relationships)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.concept_prerequisites (
    concept_id VARCHAR(64) NOT NULL REFERENCES public.curriculum_concepts(id) ON DELETE CASCADE,
    prerequisite_concept_id VARCHAR(64) NOT NULL REFERENCES public.curriculum_concepts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (concept_id, prerequisite_concept_id),
    CONSTRAINT chk_no_self_prereq CHECK (concept_id <> prerequisite_concept_id)
);

ALTER TABLE public.concept_prerequisites ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.concept_prerequisites TO authenticated, anon;

DROP POLICY IF EXISTS "concept_prerequisites_public_read" ON public.concept_prerequisites;
CREATE POLICY "concept_prerequisites_public_read"
    ON public.concept_prerequisites FOR SELECT
    USING (true);

-- Seed Concept Prerequisites DAG
INSERT INTO public.concept_prerequisites 
    (concept_id, prerequisite_concept_id)
VALUES
    ('gear_ratio', 'torque'),
    ('motor_driver', 'h_bridge'),
    ('h_bridge', 'pwm'),
    ('back_emf', 'motor_driver'),
    ('brownout', 'power_isolation'),
    ('reverse_polarity', 'power_isolation'),
    ('closed_loop', 'open_loop'),
    ('pid_controller', 'closed_loop'),
    ('proportional_control', 'closed_loop'),
    ('integral_control', 'proportional_control'),
    ('derivative_control', 'proportional_control'),
    ('tuning_gain', 'pid_controller'),
    ('setpoint_tracking', 'pid_controller'),
    ('interrupt_service_routine', 'microcontroller'),
    ('gpio_registers', 'microcontroller'),
    ('serial_communication', 'microcontroller'),
    ('i2c_protocol', 'pull_up_resistor'),
    ('spi_protocol', 'gpio_registers'),
    ('encoder', 'gpio_registers')
ON CONFLICT (concept_id, prerequisite_concept_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Concept to Module Mappings (36 Canonical Mappings with Composite Foreign Key)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.concept_module_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id VARCHAR(64) NOT NULL REFERENCES public.curriculum_concepts(id) ON DELETE CASCADE,
    module_id VARCHAR(32) NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
    checkpoint_id VARCHAR(64) DEFAULT NULL,
    is_primary_target BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_mapping_checkpoint_composite 
        FOREIGN KEY (module_id, checkpoint_id) 
        REFERENCES public.curriculum_checkpoints(module_id, id) ON DELETE SET NULL (checkpoint_id)
);

CREATE INDEX IF NOT EXISTS idx_concept_module_lookup 
    ON public.concept_module_mappings(concept_id, module_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_concept_primary_module 
    ON public.concept_module_mappings(concept_id, module_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_concept_module_checkpoint_not_null 
    ON public.concept_module_mappings(concept_id, module_id, checkpoint_id) 
    WHERE checkpoint_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_concept_module_checkpoint_null 
    ON public.concept_module_mappings(concept_id, module_id) 
    WHERE checkpoint_id IS NULL;

ALTER TABLE public.concept_module_mappings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.concept_module_mappings TO authenticated, anon;

DROP POLICY IF EXISTS "concept_module_mappings_public_read" ON public.concept_module_mappings;
CREATE POLICY "concept_module_mappings_public_read"
    ON public.concept_module_mappings FOR SELECT
    USING (true);

-- Seed Verified 36 Canonical Mappings (Deterministic Upsert)
INSERT INTO public.concept_module_mappings 
    (concept_id, module_id, checkpoint_id, is_primary_target)
VALUES
    -- Module 101 Mappings
    ('voltage_divider', '101', 'cp_101_1', true),
    ('ultrasonic_sensor', '101', 'cp_101_2', true),
    ('infrared_sensor', '101', 'cp_101_2', true),
    ('analog_to_digital', '101', 'cp_101_2', true),
    ('limit_switch', '101', 'cp_101_3', true),

    -- Module 102 Mappings
    ('microcontroller', '102', 'cp_102_1', true),
    ('open_loop', '102', 'cp_102_2', true),
    ('interrupt_service_routine', '102', 'cp_102_4', true),
    ('serial_communication', '102', 'cp_102_5', true),

    -- Module 103 Mappings
    ('torque', '103', 'cp_103_1', true),
    ('gear_ratio', '103', 'cp_103_1', true),
    ('pwm', '103', 'cp_103_2', true),
    ('motor_driver', '103', 'cp_103_3', true),
    ('h_bridge', '103', 'cp_103_3', true),
    ('power_isolation', '103', 'cp_103_4', true),

    -- Module 104 Mappings
    ('center_of_gravity', '104', 'cp_104_1', true),
    ('chassis_rigidity', '104', 'cp_104_2', true),
    ('traction', '104', 'cp_104_3', true),
    ('backlash', '104', 'cp_104_4', true),
    ('brownout', '104', 'cp_104_5', true),
    ('reverse_polarity', '104', 'cp_104_6', true),
    ('battery_safety', '104', 'cp_104_6', true),

    -- Module 105 Mappings
    ('pull_up_resistor', '105', 'cp_105_1', true),
    ('i2c_protocol', '105', 'cp_105_2', true),
    ('gpio_registers', '105', 'cp_105_2', true),
    ('spi_protocol', '105', 'cp_105_3', true),
    ('back_emf', '105', 'cp_105_4', true),

    -- Module 106 Mappings
    ('encoder', '106', 'cp_106_1', true),
    ('imu', '106', 'cp_106_1', true),
    ('closed_loop', '106', 'cp_106_2', true),
    ('proportional_control', '106', 'cp_106_2', true),
    ('integral_control', '106', 'cp_106_3', true),
    ('derivative_control', '106', 'cp_106_3', true),
    ('pid_controller', '106', 'cp_106_4', true),
    ('tuning_gain', '106', 'cp_106_4', true),
    ('setpoint_tracking', '106', 'cp_106_5', true)
ON CONFLICT (concept_id, module_id) DO UPDATE SET
    checkpoint_id = EXCLUDED.checkpoint_id,
    is_primary_target = EXCLUDED.is_primary_target;

-- ----------------------------------------------------------------------------
-- 6. Checkpoint Deletion Scoping Trigger (Preserve module_id on Checkpoint Deletion)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_checkpoint_deletion_scoping()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    -- Clear checkpoint_id while preserving module_id
    UPDATE public.concept_module_mappings
    SET checkpoint_id = NULL
    WHERE checkpoint_id = OLD.id AND module_id = OLD.module_id;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_checkpoint_deletion ON public.curriculum_checkpoints;
CREATE TRIGGER trg_handle_checkpoint_deletion
    BEFORE DELETE ON public.curriculum_checkpoints
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_checkpoint_deletion_scoping();

-- ----------------------------------------------------------------------------
-- 7. Conversations Schema (Layer 2 Foundation with Strict Scoping & Isolation)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id VARCHAR(32) REFERENCES public.curriculum_modules(id) ON DELETE SET NULL,
    checkpoint_id VARCHAR(64) DEFAULT NULL,
    context_type VARCHAR(32) NOT NULL DEFAULT 'checkpoint' 
        CHECK (context_type IN ('checkpoint', 'notebook', 'competition', 'general')),
    title TEXT NOT NULL DEFAULT 'Robotics Coaching Session',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_conversations_checkpoint_composite 
        FOREIGN KEY (module_id, checkpoint_id) 
        REFERENCES public.curriculum_checkpoints(module_id, id) ON DELETE SET NULL (checkpoint_id),
    CONSTRAINT chk_notebook_scoping 
        CHECK ((context_type = 'notebook' AND module_id IS NULL AND checkpoint_id IS NULL) OR (context_type <> 'notebook'))
);

CREATE INDEX IF NOT EXISTS idx_conversations_student 
    ON public.conversations(student_id);

CREATE INDEX IF NOT EXISTS idx_conversations_scope 
    ON public.conversations(student_id, module_id, checkpoint_id);

CREATE INDEX IF NOT EXISTS idx_conversations_context 
    ON public.conversations(student_id, context_type);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.conversations FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.conversations FROM authenticated;
GRANT SELECT, INSERT, UPDATE (title, updated_at) ON public.conversations TO authenticated;

DROP POLICY IF EXISTS "conversations_student_select" ON public.conversations;
CREATE POLICY "conversations_student_select"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS "conversations_student_insert" ON public.conversations;
CREATE POLICY "conversations_student_insert"
    ON public.conversations FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "conversations_student_update" ON public.conversations;
CREATE POLICY "conversations_student_update"
    ON public.conversations FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 8. Conversation Messages Schema (Strict Protection Against Forgery)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_role VARCHAR(16) NOT NULL CHECK (sender_role IN ('student', 'assistant', 'system')),
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation 
    ON public.conversation_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_created 
    ON public.conversation_messages(conversation_id, created_at);

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.conversation_messages FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.conversation_messages FROM authenticated;
GRANT SELECT, INSERT ON public.conversation_messages TO authenticated;

-- Students can read messages from their own conversations
DROP POLICY IF EXISTS "messages_student_select" ON public.conversation_messages;
CREATE POLICY "messages_student_select"
    ON public.conversation_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = conversation_messages.conversation_id AND c.student_id = auth.uid()
        )
    );

-- Students can ONLY insert their own student messages (blocks assistant/system forgery)
DROP POLICY IF EXISTS "messages_student_insert" ON public.conversation_messages;
CREATE POLICY "messages_student_insert"
    ON public.conversation_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_role = 'student'
        AND EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = conversation_messages.conversation_id AND c.student_id = auth.uid()
        )
    );

-- Note: No UPDATE or DELETE policy granted to authenticated users.
-- Conversation history is append-only for students.

-- ----------------------------------------------------------------------------
-- 9. Mastery Assessment Events (Append-Only Event Store for Demonstrations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mastery_assessment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    concept_id VARCHAR(64) NOT NULL REFERENCES public.curriculum_concepts(id) ON DELETE RESTRICT,
    module_id VARCHAR(32) NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE RESTRICT,
    checkpoint_id VARCHAR(64) DEFAULT NULL,
    previous_state VARCHAR(32) DEFAULT NULL,
    new_state VARCHAR(32) NOT NULL,
    trigger_reason TEXT NOT NULL,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_assessment_checkpoint_composite 
        FOREIGN KEY (module_id, checkpoint_id) 
        REFERENCES public.curriculum_checkpoints(module_id, id) ON DELETE SET NULL (checkpoint_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_events_student_concept 
    ON public.mastery_assessment_events(student_id, concept_id, assessed_at);

ALTER TABLE public.mastery_assessment_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.mastery_assessment_events TO authenticated;

DROP POLICY IF EXISTS "assessment_events_student_select" ON public.mastery_assessment_events;
CREATE POLICY "assessment_events_student_select"
    ON public.mastery_assessment_events FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 10. Memory Evidence Schema (Layer 5 Evidence Baseline & Preservation)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memory_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id VARCHAR(32) NOT NULL REFERENCES public.curriculum_modules(id),
    concept_id VARCHAR(64) NOT NULL REFERENCES public.curriculum_concepts(id),
    checkpoint_id VARCHAR(64) DEFAULT NULL,
    provenance VARCHAR(32) NOT NULL 
        CHECK (provenance IN ('demonstrated', 'inferred', 'student_reported', 'teacher_assessed', 'directly_observed')),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified' 
        CHECK (verification_status IN ('verified', 'unverified', 'disputed')),
    lifecycle_status VARCHAR(32) NOT NULL DEFAULT 'active' 
        CHECK (lifecycle_status IN ('active', 'superseded', 'retracted', 'disputed')),
    confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.70 
        CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
    evidence_text TEXT NOT NULL 
        CHECK (length(trim(evidence_text)) >= 5 AND length(evidence_text) <= 4000),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    message_ids UUID[] DEFAULT '{}',
    assessment_event_id UUID REFERENCES public.mastery_assessment_events(id) ON DELETE RESTRICT,
    dispute_reason TEXT DEFAULT NULL,
    disputed_at TIMESTAMPTZ DEFAULT NULL,
    superseded_by UUID REFERENCES public.memory_evidence(id) DEFAULT NULL,
    superseded_at TIMESTAMPTZ DEFAULT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_no_self_supersession 
        CHECK (superseded_by IS NULL OR superseded_by <> id),
    CONSTRAINT fk_evidence_checkpoint_composite 
        FOREIGN KEY (module_id, checkpoint_id) 
        REFERENCES public.curriculum_checkpoints(module_id, id) ON DELETE SET NULL (checkpoint_id),
    CONSTRAINT chk_evidence_verification 
        CHECK (
            (provenance IN ('inferred', 'student_reported') AND verification_status <> 'verified') 
            OR (provenance NOT IN ('inferred', 'student_reported'))
        ),
    CONSTRAINT chk_demonstrated_has_event 
        CHECK (
            (provenance = 'demonstrated' AND assessment_event_id IS NOT NULL) 
            OR (provenance <> 'demonstrated')
        ),
    CONSTRAINT chk_evidence_dispute 
        CHECK (
            (verification_status = 'disputed' AND dispute_reason IS NOT NULL 
             AND length(trim(dispute_reason)) >= 5 AND length(dispute_reason) <= 1000 
             AND disputed_at IS NOT NULL) 
            OR (verification_status <> 'disputed')
        )
);

CREATE INDEX IF NOT EXISTS idx_memory_evidence_student 
    ON public.memory_evidence(student_id);

CREATE INDEX IF NOT EXISTS idx_memory_evidence_concept 
    ON public.memory_evidence(student_id, concept_id);

CREATE INDEX IF NOT EXISTS idx_memory_evidence_scope 
    ON public.memory_evidence(student_id, module_id, checkpoint_id);

CREATE INDEX IF NOT EXISTS idx_memory_evidence_active 
    ON public.memory_evidence(student_id, concept_id, lifecycle_status, verification_status);

ALTER TABLE public.memory_evidence ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.memory_evidence TO authenticated;

DROP POLICY IF EXISTS "memory_evidence_student_select" ON public.memory_evidence;
CREATE POLICY "memory_evidence_student_select"
    ON public.memory_evidence FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 11. Immutability & Supersession Enforcement Trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_memory_evidence_immutability()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_target_student UUID;
    v_target_module VARCHAR(32);
    v_target_concept VARCHAR(64);
    v_target_superseded_by UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'CRITICAL: memory_evidence rows are permanent audit records and cannot be deleted.';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Prevent alteration of core historical claim attributes
        IF OLD.student_id <> NEW.student_id 
           OR OLD.module_id <> NEW.module_id 
           OR OLD.concept_id <> NEW.concept_id 
           OR OLD.checkpoint_id IS DISTINCT FROM NEW.checkpoint_id 
           OR OLD.provenance <> NEW.provenance 
           OR OLD.evidence_text <> NEW.evidence_text 
           OR OLD.recorded_at <> NEW.recorded_at 
           OR OLD.assessment_event_id IS DISTINCT FROM NEW.assessment_event_id THEN
            RAISE EXCEPTION 'CRITICAL: Core evidence attributes are immutable once recorded.';
        END IF;

        -- Prevent arbitrary reverts from terminal lifecycle states
        IF OLD.lifecycle_status IN ('superseded', 'retracted') AND NEW.lifecycle_status = 'active' THEN
            RAISE EXCEPTION 'CRITICAL: Cannot revert a % evidence record to active.', OLD.lifecycle_status;
        END IF;

        -- Validate verification status transitions
        IF NEW.verification_status = 'verified' AND NEW.provenance IN ('inferred', 'student_reported') THEN
            RAISE EXCEPTION 'CRITICAL: Inferred or student-reported evidence cannot transition to verified.';
        END IF;

        -- Validate superseding evidence link
        IF NEW.superseded_by IS NOT NULL THEN
            IF NEW.superseded_by = NEW.id THEN
                RAISE EXCEPTION 'CRITICAL: Evidence record cannot supersede itself.';
            END IF;

            SELECT student_id, module_id, concept_id, superseded_by 
            INTO v_target_student, v_target_module, v_target_concept, v_target_superseded_by
            FROM public.memory_evidence WHERE id = NEW.superseded_by;
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'CRITICAL: Superseding evidence ID % does not exist.', NEW.superseded_by;
            END IF;

            IF v_target_student <> NEW.student_id 
               OR v_target_module <> NEW.module_id 
               OR v_target_concept <> NEW.concept_id THEN
                RAISE EXCEPTION 'CRITICAL: Superseding evidence must belong to the same student, module, and concept.';
            END IF;

            IF v_target_superseded_by = OLD.id THEN
                RAISE EXCEPTION 'CRITICAL: Mutual supersession cycle detected between % and %.', OLD.id, NEW.superseded_by;
            END IF;

            NEW.lifecycle_status := 'superseded';
            NEW.superseded_at := pg_catalog.now();
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_memory_evidence_immutability ON public.memory_evidence;
CREATE TRIGGER trg_memory_evidence_immutability
    BEFORE UPDATE OR DELETE ON public.memory_evidence
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_memory_evidence_immutability();

-- ----------------------------------------------------------------------------
-- 12. Student Evidence Dispute RPC (Safe SECURITY DEFINER with Exact Grants)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dispute_memory_evidence(
    p_evidence_id UUID,
    p_reason TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_clean_reason TEXT;
    v_row RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not authenticated.';
    END IF;

    IF p_evidence_id IS NULL THEN
        RAISE EXCEPTION 'Invalid input: Evidence ID cannot be null.';
    END IF;

    IF p_reason IS NULL THEN
        RAISE EXCEPTION 'Invalid input: Dispute reason cannot be null.';
    END IF;

    v_clean_reason := pg_catalog.trim(p_reason);
    IF length(v_clean_reason) < 5 OR length(v_clean_reason) > 1000 THEN
        RAISE EXCEPTION 'Dispute reason must be between 5 and 1000 characters.';
    END IF;

    SELECT id, student_id, verification_status, lifecycle_status 
    INTO v_row
    FROM public.memory_evidence 
    WHERE id = p_evidence_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evidence record not found.';
    END IF;

    IF v_row.student_id <> auth.uid() THEN
        RAISE EXCEPTION 'Forbidden: You do not own this evidence record.';
    END IF;

    IF v_row.verification_status = 'disputed' THEN
        RAISE EXCEPTION 'Evidence record is already disputed.';
    END IF;

    IF v_row.lifecycle_status IN ('retracted', 'superseded') THEN
        RAISE EXCEPTION 'Cannot dispute a % evidence record.', v_row.lifecycle_status;
    END IF;

    UPDATE public.memory_evidence
    SET verification_status = 'disputed',
        lifecycle_status = 'disputed',
        dispute_reason = v_clean_reason,
        disputed_at = pg_catalog.now()
    WHERE id = p_evidence_id;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'evidence_id', p_evidence_id,
        'status', 'disputed'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.dispute_memory_evidence(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispute_memory_evidence(UUID, TEXT) TO authenticated;
