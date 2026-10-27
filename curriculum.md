## ROBOTICS FOUNDATIONS: SENSORS, ACTUATORS & CONTROLLERS

| 00  | Foundational Hardware & Architecture |
| :-- | :----------------------------------- |

### _Core Knowledge (The Facts)_

- A robot is an autonomous or semi-autonomous machine that integrates three essential subsystems: Sensing (Perception), Computation (Processing), and Actuation (Action).
- Everyday machines perform repetitive, pre-programmed sequences regardless of what happens around them (like a standard washing machine cycle), whereas robots perceive their environment through sensors and adjust their physical actions autonomously.
- **Sensing (Input):** Sensors gather physical information or measurements from the outside world (such as light, distance, sound, contact, rotation, or temperature) and convert them into electrical signals.
- **Computation (Processing):** The controller or microcontroller acts as the "brain," receiving signals from the sensors, running programmed logic, and deciding how the robot should respond.
- **Actuation (Output):** Actuators (such as DC motors, servo motors, linear actuators, or grippers) receive power and commands from the controller to create physical movement, force, or mechanical action.
- **Lab Bench & Hardware Diagnostics (Component Failure):**
    - Electronic components and sensors can be permanently damaged ("fried") if exposed to electrical conditions outside their datasheet ratings.
    - Common causes of burnt or damaged sensors include:
        - **Reverse Polarity:** Connecting power ($V_{CC}$) and ground ($GND$) wires backward.
        - **Over-Voltage:** Feeding higher voltage (such as $12\text{ V}$ battery power or $5\text{ V}$) into a sensor or pin rated only for $3.3\text{ V}$.
        - **Short Circuits:** Accidental contact between exposed wires, metal chassis parts, or solder bridges connecting power directly to ground.

### _Vocabulary & Definitions_

- **Actuator:** A component (such as a motor or servo) responsible for moving and controlling a mechanism or system.
- **Autonomous:** Capable of operating and making decisions independently based on sensor inputs without real-time human control.
- **Controller / Microcontroller:** The computing unit on a robot that processes sensor data and executes the user's program to control actuators.
- **Input:** Data or electrical signals received by the robot's controller from sensors or user controls.
- **Output:** Signals or physical actions produced by the robot's controller through motors, indicators, or actuators.
- **Polarity:** The directional flow of electrical connection (positive/power vs. negative/ground) required for electronic components to operate safely.
- **Sensor:** A device that detects and measures a physical property from the environment and converts it into a signal the controller can read.
- **Short Circuit:** An unintended low-resistance connection between two points in an electric circuit, often causing excessive current flow and component damage.

### _Common Misconceptions (Anticipated Errors)_

- **Misconception:** Any machine that moves by itself or uses remote control is a true robot.
    - **Reality:** True robotics involves the integration of sensing, computation, and physical actuation to perceive and respond to the environment.
- **Misconception:** Sensors make decisions for the robot.
    - **Reality:** Sensors only gather data (input); the controller processes that data using code to make decisions and command the actuators.
- **Misconception:** If a sensor stops working or gets hot, it is always a software bug.
    - **Reality:** Physical heat, burning smells, or dead sensors indicate hardware wiring issues such as reverse polarity, over-voltage, or a short circuit.

### _Socratic Progression (For Socratic Mode Only)_

- **Conceptual Mode (When learning by example / no physical hardware present):**
    - Step 1 (Observation): Compare a human walking through a dark room to a robot. What body parts do you use to notice obstacles, and what component gives a robot that same ability?
    - Step 2 (Analysis): Once a robot's sensors gather data about an obstacle, what has to happen to that information before the wheels can change direction?
    - Step 3 (Application): Looking at the three core parts—sensing, computation, and actuation—how do they work together in an autonomous robot vacuum compared to a basic washing machine?
- **Workbench & Notebook Mode (When logging hardware issues or "fried" parts):**
    - Step 1 (Observation): Before powering on the circuit when the component failed, how were the power ($V_{CC}$), ground ($GND$), and signal wires connected?
    - Step 2 (Analysis): Comparing the voltage supplied by your battery or port to the sensor's rated voltage specification, could over-voltage, reverse polarity, or a stray short circuit have caused the failure?
    - Step 3 (Application): How will you document this failure in your engineering notebook, and what wiring check will you perform before connecting a replacement sensor?

### _Competition Pit Triage (For Competition Mode Only)_

- Immediately isolate power before swapping a damaged sensor.
- Verify continuity and check for $V_{CC}$-to-$GND$ shorts with a multimeter.
- Confirm logic voltage compatibility ($3.3\text{ V}$ vs $5\text{ V}$) and verify pin polarity against the component datasheet before re-powering.

---

## COMPETITIVE ROBOTICS GUIDE: PERSONALIZED STANDARDS

| 01  | Knowledge Content |
| :-- | :---------------- |

### _Core Knowledge (The Facts)_

- Competitive robotics can be approached through two sides: Technical and Creative.
- The Technical side focuses on the performance and engineering of robots in typical or traditional robot games.
- The Creative side focuses on innovation, research, and robotics projects that address problems or explore new possibilities.
- The Technical side follows five standards in sequence: Proportionality, Stability, Functionality, Precision & Accuracy, and Consistency.
- The Creative side follows five standards in sequence: Value, Feasibility, Credibility, Logic, and Consistency.
- The standards are sequential, meaning each standard builds upon the standards that come before it.
- A robot or project should be evaluated according to the appropriate standards for its type of work.
- The Technical and Creative standards provide a framework for evaluating the quality of robotics work.

### _Vocabulary & Definitions_

- **Accurate:** The ability to achieve the correct or intended result.
- **Creative:** The side of robotics focused on innovation, research, and developing solutions to problems or opportunities.
- **Credible:** Supported by trustworthy evidence, information, or results.
- **Consistent:** The ability to produce reliable results repeatedly.
- **Feasible:** Capable of being realistically developed or implemented within given constraints.
- **Functional:** The ability to perform its intended purpose.
- **Logical:** Based on sound reasoning and a coherent relationship between ideas, evidence, and conclusions.
- **Proportional:** The equal or appropriate distribution of materials throughout the robot according to its design requirements.
- **Precise:** The ability to achieve a specific intended result or position with minimal deviation.
- **Stable:** The equal or appropriate distribution of weight throughout the robot to maintain balance and prevent unwanted movement or tipping.
- **Standard:** A defined criterion used to evaluate the quality or performance of robotics work.
- **Technical:** The side of robotics focused on robot performance, engineering, and execution in typical robot games.
- **Valuable:** Providing meaningful benefit to its intended users or stakeholders.

### _Common Misconceptions (Anticipated Errors)_

- **Misconception:** Technical and Creative robotics are completely separate fields.
    - **Reality:** They are two sides of competitive robotics that can overlap and support each other.
- **Misconception:** The standards are independent criteria that can be evaluated in any order.
    - **Reality:** Each set of standards follows a defined sequence, with later standards building upon earlier ones.
- **Misconception:** A robot only needs to work to be considered successful.
    - **Reality:** Technical robotics evaluates performance through all five Technical standards.
- **Misconception:** A creative project is innovative simply because the idea is new.
    - **Reality:** Creative robotics evaluates whether an idea provides value and progresses through the Creative standards.
- **Misconception:** Proportionality and Stability & Balance mean the same thing.
    - **Reality:** Proportionality concerns the distribution of materials, while Stability & Balance concerns the distribution of weight.
- **Misconception:** Precision and accuracy are the same.
    - **Reality:** Precision concerns how closely repeated results are grouped or controlled, while accuracy concerns how close the result is to the intended or correct result.
- **Misconception:** Consistency has the same role on both sides.
    - **Reality:** Consistency is the final standard in both frameworks, representing the ability to repeatedly deliver a reliable result after satisfying the preceding standards.

### _Socratic Progression (For Socratic Mode Only)_

- Step 1: Observation: Is your current robotics goal focused on engineering a robot to compete in a game with set rules, or researching and inventing a solution to a real-world problem?
- Step 2: Analysis: Why do you think the five standards must be followed in strict sequence rather than skipping straight to the final standard, Consistency?
- Step 3: Application: Based on where you are in your project right now, which specific standard in the sequence should we evaluate first?

### _Competition Pit Triage (For Competition Mode Only)_

- Diagnose failures from the bottom of the hierarchy up: never debug software **Consistency** or **Precision** until mechanical **Proportionality**, **Stability & Balance**, and **Functionality** are verified solid.

---

## TECHNICAL STANDARD: PROPORTIONALITY

### _Core Knowledge (The Facts)_

- Proportionality refers to the equal or appropriate distribution of materials throughout a robot according to its design requirements.
- Materials should be distributed appropriately across the robot's structure and components.
- The distribution of materials affects the robot's overall design, structure, and performance.
- Proportionality does not mean that every component must have the same size, amount, or shape.
- The appropriate distribution of materials depends on the robot's purpose, design, and requirements.
- A robot should avoid unnecessary material that does not contribute to its intended function.

### _Application_

- Imagine drawing two perpendicular lines through the center of the robot's chassis, dividing the top view into four quadrants.
    - Identify the components placed in each quadrant.
    - For every component positioned on one side of an imaginary line, check whether the opposite side has a component or material distribution that maintains the intended proportionality.
    - If one quadrant contains a large component while its opposite quadrant is empty, review whether the material distribution is appropriate for the robot's design.
- Example: If a battery is placed in the front-left quadrant, consider how the materials and components are distributed in the front-right quadrant.

### _Vocabulary & Definition_

- **Design Requirement:** A condition that the robot's design must satisfy.
- **Distribution:** How materials or components are arranged throughout the robot.
- **Material:** A physical substance or component used to construct the robot.
- **Proportional:** The equal or appropriate distribution of materials throughout a robot according to its design requirements.

### _Common Misconceptions (Anticipated Error)_

- **Misconception:** Proportional means that every part of the robot must be the same size.
    - **Reality:** Proportionality means that materials are distributed appropriately according to the robot's requirements.
- **Misconception:** Proportionality and Stability & Balance are the same.
    - **Reality:** Proportionality concerns the distribution of materials, while Stability & Balance concerns the distribution of weight.
- **Misconception:** Components must be identical or symmetrically placed on opposite sides of the chassis to achieve proportionality.
    - **Reality:** Proportionality does not require identical components or symmetrical placement. The goal is to distribute materials appropriately according to the robot's design requirements. Quadrant distribution is a design guideline, not an absolute rule.

### _Socratic Progression (For Socratic Mode Only)_

- **Note for AI Coaching:** Do not assume the student has a physical robot in front of them unless stated. Frame questions using either their actual build OR an imagined 4-quadrant top-view example.
- Step 1: Observation: If you divide the top view of a robot's chassis into four quadrants using two imaginary perpendicular lines, how are the structural materials and components distributed across those four sections?
- Step 2: Analysis: Does one quadrant contain significantly more material or components than its opposite quadrant, and does that arrangement serve a specific design requirement?
- Step 3: Application: What excess material could be removed or what components could be repositioned to achieve a more appropriate distribution according to the design requirements?

### _Competition Pit Triage (For Competition Mode Only)_

- Map the top view into 4 quadrants (Front-Left, Front-Right, Rear-Left, Rear-Right).
- Strip dead-weight material that does not reinforce load-bearing mechanisms or fulfill a design requirement.
- Balance structural framing across opposing quadrants to prevent chassis twist under torque.

---

## TECHNICAL STANDARD: STABILITY & BALANCE

### _Core Knowledge (The Facts)_

- Stability & Balance refers to the equal distribution of weight throughout the robot.
- Weight distribution affects the robot's ability to remain stable during movement and operation.
- A robot should maintain balance while performing its intended functions.
- Uneven weight distribution can cause the robot to tilt, become unstable, or tip over.
- Component placement affects the robot's overall weight distribution.
- Counterweights are added to adjust the robot's weight distribution and improve its balance and stability.
- The height of the robot affects its stability and movement. A higher center of gravity can make the robot more prone to tipping or unwanted movement.
- A wider base of support generally provides greater stability.

### _Application_

- To estimate the Center of Gravity:
    - Identify heavy components. Locate the battery, motors, and other heavy parts.
    - Observe their placement. Check whether most of the robot's weight is concentrated on one side or near the top.
    - Estimate the COG. The COG will generally be closer to where more of the robot's mass is concentrated.
    - Adjust if necessary. Reposition heavy components lower and distribute weight appropriately to improve stability.
- Example: If the battery and motors are concentrated on the left side, the COG will likely be closer to that side. Repositioning these components can help improve balance.

### _Vocabulary & Definitions_

- **Balance:** The condition in which the robot's weight is appropriately distributed to prevent unwanted tilting or tipping.
- **Base of Support:** The area enclosed by the robot's points of contact with the ground.
- **Center of Gravity (CoG):** The point where the robot's total weight can be considered to act.
- **Stability:** The ability of the robot to remain in a controlled and stable state during operation.
- **Weight Distribution:** How the total weight of the robot is distributed across its structure and components.

### _Common Misconceptions (Anticipated Error)_

- **Misconception:** Stability is only important when the robot is stationary.
    - **Reality:** Weight distribution also affects stability while the robot is moving or performing tasks.
- **Misconception:** Putting all components in the middle of the robot will automatically make it balanced.
    - **Reality:** Balance depends on the overall distribution of weight, component placement, and the robot's center of gravity.
- **Misconception:** A robot with a heavy center is always stable.
    - **Reality:** Stability also depends on the relationship between the robot's center of gravity and its base of support.
- **Misconception:** The height of the robot does not affect its movement.
    - **Reality:** A taller robot can have a higher center of gravity, which can reduce stability and make it more prone to tipping or unwanted movement.
- **Misconception:** The geometric center of the chassis is always the robot's COG.
    - **Reality:** The COG depends on the mass and placement of all components, so it may not align with the chassis center.

### _Socratic Progression (For Socratic Mode Only)_

- **Note for AI Coaching:** If the student is learning conceptually without a physical build, use a concrete hypothetical scenario (e.g., a tall rover with a heavy battery mounted near the top) rather than asking about "your heavy components."
- Step 1: Observation: When a robot turns, accelerates, or stops suddenly, what happens to its physical posture—does it stay flat, or does it tilt, lift, or tip over?
- Step 2: Analysis: Looking at where the heaviest components (like batteries and motors) sit relative to the robot's height and its base of support (wheel footprint), why might that tilting happen?
- Step 3: Application: How could you reposition heavy components lower, add a counterweight, or widen the base of support to keep the Center of Gravity stable during movement?

### _Competition Pit Triage (For Competition Mode Only)_

- **Tipping Backward on Acceleration:** Remount battery and heavy motors lower and further forward; implement software acceleration ramping (slew rate).
- **Nose-Diving on Braking / Arm Extension:** Shift battery rearward as a counterweight; widen the wheelbase (Base of Support).
- **Lateral Roll on Turns:** Lower vertical CoG height; widen track width.

---

## TECHNICAL STANDARD: FUNCTIONALITY

### _Core Knowledge (The Facts)_

- Functionality refers to the robot's ability to perform its intended purpose and required tasks.
- Each component should serve a purpose that contributes to the robot's intended functions.
- Components must be compatible and properly integrated for the robot to function as intended.

### _Vocabulary & Definition_

- **Compatibility:** The ability of components or systems to work together correctly.
- **Functionality:** The ability of a robot or component to perform its intended purpose.
- **Integration:** The process of connecting mechanical, electrical, and software components so they work together.

### _Common Misconceptions (Anticipated Error)_

- **Misconception:** If a robot moves, it is functional.
    - **Reality:** Movement alone does not prove that the robot can perform its intended tasks.
- **Misconception:** A robot that works once is fully functional.
    - **Reality:** Its functions must be tested under the conditions in which it is expected to operate.

### _Socratic Progression (For Socratic Mode Only)_

- Step 1: Observation: Beyond simply driving or moving, what specific tasks or objectives must the robot accomplish to fulfill its intended purpose?
- Step 2: Analysis: Which mechanical, electrical, and software components must work together (integrate) to perform that task, and is any part failing to contribute?
- Step 3: Application: What could you modify, repair, or simplify so the components are fully compatible and perform the required task under real operating conditions?

### _Competition Pit Triage (For Competition Mode Only)_

- Test every mechanism under full match load, never just spinning in the air.
- Verify mechanical, electrical, and software integration one subsystem at a time (Drivetrain $\rightarrow$ Intake $\rightarrow$ Lift $\rightarrow$ Sensors).

---

## TECHNICAL STANDARD: PRECISION & ACCURACY

### _Core Knowledge (The Facts)_

- A robot can be precise without being accurate if it repeatedly produces the same result but consistently misses the target.
- A robot can be accurate on one attempt without being precise if its results vary across repeated attempts.
- Precision and accuracy can be affected by mechanical alignment, sensor readings, motor control, programming, and environmental conditions.
- Testing and calibration can help identify and reduce errors that affect precision and accuracy.
- Sensor readings and robot behavior may vary under different environmental conditions, so testing should account for the conditions in which the robot will operate.

### _Application_

- Precision and accuracy check:
    - Choose a target. Identify a specific position or result the robot must achieve, such as stopping at a marked line.
    - Run repeated trials.
    - Observe the results. Check whether the robot reaches the intended target and whether the results are close to one another.
    - Identify the issue:
        - If results are close to one another but consistently miss the target, the robot is precise but not accurate.
        - If results vary significantly between attempts, the robot lacks precision.
    - Adjust and retest. Investigate the programming, sensors, mechanical alignment, and environmental conditions that may affect performance.
- Example: A robot is programmed to stop at a line. If it stops $2\text{ cm}$ before the line in every trial, its results are consistent and precise, but not accurate. If it stops at different distances each time, its precision is poor.

### _Vocabulary & Definition_

- **Accuracy:** The degree to which a result is close to the intended or correct value.
- **Calibration:** Adjusting or verifying a device's measurements or output against a known reference.
- **Deviation:** The difference between an observed result and a reference or intended value.
- **Error:** The difference between a measured or actual result and the expected or intended result.
- **Precision:** The degree to which repeated results are close to one another.

### _Common Misconceptions (Anticipated Error)_

- **Misconception:** Precision and accuracy mean the same thing.
    - **Reality:** Precision concerns how closely repeated results agree with each other, while accuracy concerns how close results are to the intended value.
- **Misconception:** A robot that reaches the target once is both precise and accurate.
    - **Reality:** Repeated trials are needed to evaluate consistency of results and determine precision.
- **Misconception:** Programming alone determines precision and accuracy.
    - **Reality:** Mechanical construction, sensors, motors, calibration, and environmental conditions can also affect performance.
- **Misconception:** I only need to calibrate my robot once.
    - **Reality:** Calibration may need to be repeated when sensors, components, environmental conditions, or robot behavior change. Testing helps determine whether recalibration is necessary.

### _Socratic Progression (For Socratic Mode Only)_

- Step 1: Observation: When the robot attempts to hit a target (like stopping at a line $50\text{ cm}$ away) across multiple trials, do the stopping points cluster tightly together, or do they scatter?
- Step 2: Analysis: Based on those trials, is the robot missing the target by the exact same distance every time (precise but inaccurate), or stopping at random distances (imprecise)?
- Step 3: Application: Whether the error is a constant offset or random scatter, what specific factor—programming values, sensor calibration, or mechanical wheel alignment—should we adjust and retest first?

### _Competition Pit Triage (For Competition Mode Only)_

- **Precise but Inaccurate (Tight cluster, wrong spot):** Fix the constant offset in code (adjust target setpoint, encoder ticks, or sensor threshold).
- **Imprecise (Scattered results):** Fix mechanical slop first (tighten shaft collars, eliminate gear backlash, clean tires for traction, switch from `delay()` timing to encoder/PID control).

---

## TECHNICAL STANDARD: CONSISTENCY

### _Core Knowledge (The Fact)_

- Consistency refers to the robot's ability to produce reliable and repeatable results across multiple attempts.
- A consistent robot performs its intended tasks with minimal variation under similar conditions.
- Consistency can be improved by identifying the causes of variation and making appropriate adjustments to the robot's design, hardware, or code.

### _Application_

- Consistency checks:
    - Choose a task. Select a repeatable action, such as moving forward a set distance, turning, or picking up a game piece.
    - Repeat the task. Run the robot several times using the same program and setup.
    - Observe its behavior. Check whether the robot performs the same sequence of actions and produces similar results each time.
    - Identify variations. Look for differences in movement, timing, sensor responses, or mechanism operation.
    - Investigate and improve. Check for loose components, inconsistent connections, changing sensor readings, or programming issues.
    - Retest. Repeat the trials after making adjustments to determine whether performance has become more consistent.
- Example: A robot is programmed to drive forward and turn at a specific point. If it completes the sequence reliably in every trial, its performance is consistent. If it turns correctly in some trials but misses the turn in others, investigate the cause of the variation.

### _Vocabulary & Definitions_

- **Consistency:** The ability to produce similar results repeatedly under similar conditions.
- **Reliability:** The ability of a robot to perform its intended functions dependably over time.
- **Repeatability:** The ability to achieve similar results when the same procedure is performed multiple times under the same conditions.
- **Variation:** A difference in results across multiple attempts.
- **Troubleshooting:** The process of identifying and resolving the causes of problems in a system.

### _Common Misconceptions (Anticipated Error)_

- **Misconception:** Inconsistent performance is always caused by programming.
    - **Reality:** Mechanical, electrical, sensor-related, and environmental factors can also affect consistency.
- **Misconception:** Recalibrating the robot before every run is the only way to improve consistency.
    - **Reality:** Calibration may help, but the underlying cause of variation should be identified and addressed.
- **Misconception:** Consistency means the robot must always produce exactly identical results.
    - **Reality:** Small variations may occur; the goal is to keep performance sufficiently repeatable for the intended task.

### _Socratic Progression (For Socratic Mode Only)_

- Step 1: Observation: When you run the robot through the exact same sequence several times in a row, at what specific moment or action does its behavior start to vary?
- Step 2: Analysis: Could that variation between runs be coming from a mechanical issue (like loose fasteners or wheel slip), an electrical change (like dropping battery voltage), sensor drift, or code timing?
- Step 3: Application: What single variable can you secure, tighten, or modify right now to test if the performance becomes more repeatable across trials?

### _Competition Pit Triage (For Competition Mode Only)_

- **Run-to-Run Drift:** Replace time-based `delay()` movements with encoder/sensor feedback so battery voltage sag does not shorten travel distances.
- **Pre-Match Checklist:** Check fastener torque, set screws, wire strain relief, battery voltage state, and clean wheel treads before every match.

---

## CALIBRATION

### _Core Knowledge (The Facts)_

- Calibration is the process of adjusting or verifying a sensor or system against a known reference to improve the accuracy of its measurements or outputs.
- Different sensors and components may require different calibration procedures.
- Calibration requirements depend on the component, its specifications, and the conditions in which the robot operates.
- Calibration may need to be repeated when environmental conditions change, components are replaced, or performance deviates from expected results.

### _Vocabulary & Definition_

- **Calibration:** The process of adjusting or verifying a device against a known reference.
- **Environmental Conditions:** External factors, such as lighting, temperature, and surface properties, that may influence robot behavior.
- **Recalibration:** Repeating a calibration procedure when needed to maintain or restore expected performance.
- **Reference Value:** A known or accepted value used for comparison during calibration.
- **Sensor Offset:** A difference between a sensor's reading and the expected reading that can be corrected through an appropriate adjustment.

### _Common Misconception (Anticipated Error)_

- **Misconception:** I only need to calibrate once.
    - **Reality:** Calibration may need to be repeated when conditions change, components are replaced, or testing reveals deviations.
- **Misconception:** All sensors are calibrated the same way.
    - **Reality:** Calibration procedures depend on the sensor type, its specifications, and its intended use.
- **Misconception:** If a sensor returns a value, it is already calibrated.
    - **Reality:** A sensor can produce readings that differ from actual conditions or the expected reference.

### _Socratic Progression (For Socratic Mode Only)_

- Step 1: Observation: When you compare the raw reading from your sensor against a known physical measurement (a reference value), how much do the two numbers differ?
- Step 2: Analysis: Why might a sensor that worked yesterday give shifted readings today when moved to a new room or competition field with different lighting or surface conditions?
- Step 3: Application: How can you use a known reference value to calculate a sensor offset or recalibrate the device before running your program?

### _Competition Pit Triage (For Competition Mode Only)_

- Always recalibrate optical/IR/color sensors on the actual competition field under venue lighting.
- Compute midpoint thresholds dynamically (`threshold = (white_val + black_val) / 2`) with hysteresis bands to prevent false triggers.

---

## 3D Printing

### _Core Knowledge (The Facts)_

- Material selection depends on the intended application, required strength, flexibility, heat resistance, and operating conditions.
- PLA is commonly used for prototypes and test parts because it is easy to print.
- PETG is an alternative for parts that require greater toughness and impact resistance, depending on the design and printing conditions.
- Printing settings, such as layer height, infill, wall thickness, and print orientation, affect the strength, dimensions, and quality of the printed part.
- Printing test blocks can help verify fit, clearance, and tolerances before printing the complete chassis or final component.
- Parts that connect or fit together should account for both tolerances and clearances to accommodate printing variations and ensure proper fit, movement, and assembly.

### _Vocabulary & Definition_

- **3D Model:** A digital representation of an object containing its geometry and dimensions.
- **3D Printing:** A manufacturing process that creates physical objects from digital models by depositing material layer by layer.
- **Clearance:** The space between parts designed to allow them to fit, move, or assemble as intended.
- **Filament:** A continuous strand of thermoplastic material used by many 3D printers.
- **Infill:** The internal structure printed inside a part to support its shape and influence its weight and strength.
- **Layer Height:** The thickness of each deposited layer in a printed object.
- **Print Orientation:** The position and direction in which a part is placed on the build plate during printing.
- **Prototype:** An early version of a component used to test its design and functionality.
- **Tolerance:** The acceptable range of variation in a dimension.
- **Wall Thickness:** The thickness of the outer walls of a printed part.

### _Common Misconceptions (Anticipated Error)_

- **Misconception:** Test prints waste time and material.
    - **Reality:** Small test prints can reveal design problems before a full component is printed, reducing rework and material waste.
- **Misconception:** PLA is always unsuitable for functional robot parts.
    - **Reality:** PLA can be suitable for many applications, depending on the loads, temperature, design, and operating conditions.

### _Socratic Progression (For Socratic Mode Only)_

- Step 1: Observation: When you inspect your 3D-printed part or test block, do the connecting shafts, screws, or mating parts fit and move smoothly, or are they too tight or brittle?
- Step 2: Analysis: If a part does not fit or cracks under load, how might clearance/tolerance settings in the model, filament choice (PLA vs. PETG), wall thickness, or print orientation on the build plate be causing the issue?
- Step 3: Application: Before printing the full final component, how can you use a small test block or adjust your print settings to validate the fit and strength?

### _Competition Pit Triage (For Competition Mode Only)_

- Use **PLA** for rapid prototypes and low-stress brackets; switch to **PETG** for high-impact bumpers, motor mounts, or high-temperature zones.
- Print small **test blocks** first to validate shaft/bearing clearances ($0.2\text{ mm}$ to $0.4\text{ mm}$ typical FDM clearance) before committing to full chassis prints.
- Orient parts on the build plate so primary load forces run parallel to layer lines, and increase wall thickness/perimeters for structural strength.

---

## 3D MODELING

### _Core Knowledge (The Fact)_

- 3D modeling is the process of creating a digital, three-dimensional representation of a physical object.
- Before modeling, gather the dimensions and specifications of the components that will be integrated into the robot.
- Sketches define two-dimensional profiles that can be used to create three-dimensional features.
- Sketch constraints and dimensions help control the geometry, size, and relationships between sketch entities.

### _Vocabulary & Definition_

- **Chamfer:** A beveled or angled edge created by removing material from the sharp corner between two surfaces.
- **Constraint:** A rule that controls the geometry or relationship between sketch entities.
- **Design Intent:** The set of relationships and rules that determine how a model should behave when dimensions or features change.
- **Dimension:** A numerical measurement that defines a geometric property, such as length, diameter, or angle.
- **Extrude:** A feature that extends a sketch profile in a specified direction to create or modify three-dimensional geometry.
- **Filet:** A rounded transition between two surfaces or edges, created by adding a radius to a sharp corner.
- **Sketch:** A two-dimensional profile or arrangement of geometric entities used to create or define model geometry.
- **Part Studio:** An Onshape workspace where parts are created and modified using sketches and features.

### _Common Misconceptions (Anticipated Error)_

- **Misconception:** Sketches only need to look approximately correct.
    - **Reality:** Appropriate dimensions and constraints help ensure the sketch meets the design requirements and behaves predictably when modified.

### _Socratic Progression (For Socratic Mode Only)_

- Step 1: Observation: Have you measured and recorded the exact physical dimensions of your motors, battery, and sensors before drawing your 2D sketches in CAD?
- Step 2: Analysis: If you change one dimension in your sketch and the rest of the shape distorts unexpectedly, which geometric constraints or dimensions might be missing?
- Step 3: Application: When inspecting your 3D assembly in Onshape, what clearances or sketch features need to be adjusted so all components fit without overlapping before you export for 3D printing?

### _Competition Pit Triage (For Competition Mode Only)_

- Measure all components with calipers or datasheets (dimensions & weight) prior to sketching.
- Fully constrain 2D sketches in Onshape/Fusion360 to preserve design intent when iterating hole patterns or clearances.

---

## COMPETITIVE ROBOTICS PROCESS FLOW: TECHNICAL FLOW

| 02  | Competitive Robotics Process Flow |
| :-- | :-------------------------------- |

### _Sequential Engineering Workflow (TECHNICAL FLOW)_

1. Analyze the competition primer/brief
    1. Identify the game objectives
    2. Identify rules, limitations, and constraints
    3. Identify Robot Requirements:
        - Controller (open or specified)
            - If specified:
                - Use the controller required by the competition
                - Build the robot using the defined/required materials and components
                - Skip the controller selection/design process and proceed directly to assembly
        - Robot dimensions: Size and Weight
        - Limitations: Motors, Sensors, and other component restrictions
    4. Understand the scoring system
    5. Identify the tasks the robot must perform
2. Identify required materials & components
    1. List the required components and materials
    2. Review component datasheet specifications when available. If not, measure using appropriate tools
    3. Record:
        - Dimensions
        - Weight
3. Design the robot chassis
    1. Create an initial sketch with clear use of alphabet of lines
    2. Establish a Cartesian Plane using the top view to divide the workplane into 4 quadrants
    3. Represent components using quadrangles
    4. Position components according to their intended placement
    5. Label components and important dimensions
    6. Transfer the design to 3D modeling platforms like OnShape or Fusion360
4. Identify components or interfaces requiring physical validation
    1. 3D print test blocks or profiles requiring proper clearances and tolerances
    2. Modify the design based on test results
5. 3D Print the validated chassis and other required parts
    - Use PLA primarily for prototypes and testing
    - Use PETG or other stronger filaments for applications requiring printed parts to withstand extreme conditions
    - Verify dimensions and quality after fabrication
6. Assemble the chassis and mechanical components
    1. Verify proper alignment and movement
    2. Check clearances and interference
    3. Ensure fasteners and connectors are secure
7. Integrate electronic components
    1. Connect components one system at a time
    2. Use built-in test or diagnostic features when available
8. Wire accordingly
    - Keep wiring organized and secured
    - Verify polarity and connections before powering the system
9. Code using provided IDE
    1. Verify that the board driver is installed and can be detected by the device
    2. Check that all required drivers are installed
    3. Check that all required libraries are installed
    4. Confirm the correct board and port are selected in the IDE
    5. Implement required robot functions
    6. Test individual functions before combining into the complete program
10. Test and improve the code as necessary

### _Socratic Progression (For Socratic Mode Only)_

- Step 1: Observation: Looking at the 10-step Competitive Robotics Technical Flow, which stage has your team completed, and what is your immediate next deliverable?
- Step 2: Analysis: Have you verified all prerequisites for your current step (such as checking if the controller is specified in Step 1, recording component dimensions/weights in Step 2 before 3D modeling in Step 3, or checking wire polarity in Step 8 before powering on)?
- Step 3: Application: How can you test and validate this single step in isolation before moving forward to the next stage of the workflow?

### _Competition Pit Triage (For Competition Mode Only)_

- **Step 1 Shortcut:** If the competition specifies the controller and kit, skip custom controller selection and proceed straight to mechanical assembly and integration.
- **Step 3-5 Fabrication Gate:** Never print a full chassis (Step 5) without first mapping the 4-quadrant Cartesian sketch (Step 3) and validating fitment with 3D-printed test blocks (Step 4).
- **Step 7-9 Integration Gate:** Connect and test electronics one subsystem at a time, verify wire polarity before power-up, confirm IDE board/port/driver detection, and unit-test individual code functions before running full autonomous routines.
