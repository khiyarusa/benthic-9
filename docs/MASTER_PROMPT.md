# MASTER PROMPT — BENTHIC-9
## COMPLETE GAME DEVELOPMENT & ANDROID RELEASE DIRECTIVE

**Project:** BENTHIC-9  
**Subtitle:** ایستگاه اعماق | THE DEEP STATION  
**Genre:** Deep Simulation / Survival / Management / Exploration  
**Platform:** Android (Primary and Final Platform)  
**Initial Build Target:** Web Application  
**Game Orientation:** Landscape Only  
**Visual Style:** High-Detail Pixel Art  
**Primary Language:** Persian (فارسی، RTL واقعی)  
**Game Engine:** Phaser 4.2.1  
**Programming Language:** TypeScript  
**Build System:** Vite  
**UI Framework:** React + TypeScript  
**Android Bridge:** Capacitor 8.6.0  
**CI/CD:** GitHub Actions  
**Distribution:** GitHub Releases  
**Initial Game Mode:** Offline Single Player

---

# PART 0 — YOUR ROLE AND MISSION

You are not being asked to create a prototype, a mockup, a tutorial project, or a simple management game.

You are acting as an entire professional indie game development studio.

You must take responsibility for:

1. Game direction and design.
2. Game mechanics and simulation architecture.
3. Gameplay programming.
4. Graphics and pixel-art production.
5. User experience and interface design.
6. Persian localization and typography.
7. Audio and sound design.
8. Performance optimization.
9. Game testing and debugging.
10. Android packaging.
11. GitHub Actions automation.
12. GitHub Releases publication.

Your final responsibility is to deliver a genuinely playable, polished, complete Android game.

The game must be built as a fully working Web application first, and then packaged for Android through Capacitor and GitHub Actions.

You have GitHub access. Use it as the primary source-control, collaboration, build, and release infrastructure.

**Do not stop after creating a design document. Start implementing the actual game.**

You are authorized to make reasonable technical and creative decisions independently. Do not repeatedly ask the user to approve ordinary implementation decisions.

When a critical external permission, missing repository, or unavailable signing credential genuinely prevents an operation, document the exact blocker and continue all other possible work.

---

# PART 1 — NON-NEGOTIABLE PROJECT RULES

These requirements override convenience and shortcuts.

## 1.1 Android is the final target

- Android is the primary and final platform.
- Web is the development and initial testing environment.
- Desktop Windows applications are not part of this project.
- Do not create an Electron or Tauri desktop application.
- Do not build a native Android game from scratch.
- Use Phaser for the game and Capacitor for Android packaging.
- The Android application must function offline.
- Do not require a backend server, cloud account, or internet connection to play.

## 1.2 Landscape only

The entire game must be designed for horizontal phone usage.

This requirement applies to:

- Title screen.
- Main menu.
- Campaign selection.
- Main gameplay.
- Station management.
- Research screens.
- Staff management.
- Inventory.
- Settings.
- Maps.
- Dialogues.
- Pause screen.
- Save/load interfaces.

Configure native Android orientation to landscape.

The game must never display a portrait-oriented gameplay layout.

On a portrait-oriented browser viewport, display an elegant Persian orientation instruction asking the player to rotate the phone.

Do not simply stretch a landscape interface into a portrait screen.

## 1.3 No superficial systems

Every major subsystem must have actual functionality.

Forbidden shortcuts:

- Decorative dashboards with fake values.
- Buttons that do nothing.
- Fake resource calculations.
- Static maps pretending to be interactive.
- Research trees with meaningless unlock buttons.
- Crew members that have no independent behavior.
- Inventory screens without actual inventory logic.
- Fake incident reports.
- Non-functional settings.
- Placeholder screens presented as completed features.
- Fake save/load functionality.

Every displayed value must come from actual game state.

Every action must cause a real and consistent change in the game world.

If a feature is not implemented, do not pretend that it is.

## 1.4 Depth without unnecessary complexity

Build sophisticated systems, but expose them through carefully designed interfaces.

The player should be able to understand basic operations easily while still having access to advanced information, controls, graphs, and management tools.

Do not confuse depth with visual clutter.

---

# PART 2 — PROJECT IDENTITY

## 2.1 Official game name

BENTHIC-9

Persian display name:

«بنتیک-۹ | ایستگاه اعماق»

Subtitle:

«در اعماق، هیچ اشتباهی کوچک نیست.»

Use BENTHIC-9 as the main international brand.

The Persian interface must use natural Persian language.

## 2.2 Setting and premise

The year is 2089.

Humanity has established several permanent deep-ocean research facilities.

BENTHIC-9 is one of the most advanced research stations ever constructed.

It is located approximately 5,800 meters beneath the ocean surface, in an isolated region of the Pacific Ocean.

The station was designed to support scientific research, deep-sea exploration, geological analysis, and marine biological research.

A series of unexplained technical failures has recently affected the facility.

Communications have become unreliable.

Some external systems are damaged.

The crew must maintain the station, investigate the surrounding ocean, manage scarce resources, and uncover the truth behind a mysterious signal.

The player is the station commander.

The player is responsible for the station's survival and scientific operations.

## 2.3 Design philosophy

BENTHIC-9 is primarily a simulation game.

Its most important appeal must come from interconnected systems.

The player should experience situations where several independent systems interact and create unexpected consequences.

A small mistake must be capable of becoming a major crisis.

A good decision must be capable of preventing an entire chain of failures.

The experience should feel immersive, strategic, atmospheric, and intellectually engaging.

---

# PART 3 — TECHNOLOGY STACK

Use this architecture unless a verified compatibility issue makes a specific component impossible.

### Game engine
Phaser 4.2.1.

Use Phaser for:

- Game scenes.
- Camera.
- Sprite rendering.
- Animation.
- Lighting and visual effects where appropriate.
- Scene transitions.
- Game-world interaction.
- Touch and pointer input.

Do not put all business logic inside Phaser scenes.

### Application UI
React + TypeScript.

React is responsible for the advanced Persian management interfaces.

Phaser is responsible for the actual game-world rendering.

The two must share a well-defined application state and event interface.

Avoid duplicated state.

### Build tooling
Vite.

Use a production-ready Vite configuration.

### Core simulation
A custom TypeScript engine named:

`BenthicSimulationCore`

It must remain independent of React and Phaser.

The simulation must be deterministic wherever possible and testable without rendering the game.

### Android packaging
Capacitor 8.6.0.

Use compatible versions of:

- @capacitor/core
- @capacitor/cli
- @capacitor/android

Keep all Capacitor packages on the same major and compatible release line.

### Testing
Use:

- Vitest for simulation and domain logic.
- Playwright for important real UI workflows.
- TypeScript strict mode for static checking.

Do not waste development resources writing excessive low-value tests.

Prioritize tests for important gameplay rules, data integrity, simulation interactions, and build reliability.

### Dependencies

Use currently compatible stable package versions.

Pin installed dependencies using the lockfile.

Do not use nightly, experimental, or beta dependencies unless absolutely required and clearly justified.

Do not introduce unnecessary dependencies.

---

# PART 4 — GAMEPLAY OVERVIEW

The player must have two main ways of interacting with the station.

### A. Strategic management

The player can:

- Inspect the entire station.
- Monitor all critical systems.
- Assign jobs.
- Manage workers.
- Prioritize electricity consumption.
- Control equipment.
- Handle emergencies.
- Conduct scientific research.
- Manage resources.
- Plan expeditions.
- Review operational statistics.

### B. Direct interaction

The player can interact with the actual world.

Examples:

- Select rooms.
- Inspect equipment.
- Open and close doors.
- Activate pumps.
- Repair damaged equipment.
- Assign a worker to a specific object.
- Operate the ROV.
- Inspect external objects.
- Examine damage.
- Perform emergency actions.

The two interaction styles must work together.

An action taken in a management menu must affect the world.

An event in the physical station must update the corresponding management interface.

---

# PART 5 — STATION DESIGN

## 5.1 Initial station structure

The first playable station must contain approximately ten fully implemented rooms.

Required rooms:

1. مرکز فرماندهی
2. راهروی مرکزی
3. نیروگاه
4. مرکز پشتیبانی حیات
5. آزمایشگاه زیستی
6. آزمایشگاه زمین‌شناسی
7. درمانگاه
8. اقامتگاه کارکنان
9. انبار مرکزی
10. محفظه خروج و کنترل ROV

Additional rooms may be unlocked through expansion and research.

Each room must have:

- Unique visual appearance.
- Unique equipment.
- Structural integrity.
- Internal pressure.
- Temperature.
- Water level.
- Oxygen concentration.
- Carbon dioxide concentration.
- Electrical connections.
- Lighting status.
- Ventilation status.
- Available floor space.
- Access connections.
- Equipment condition.
- Relevant operational information.

A room must not simply be a colored rectangle with a label.

The room must visually contain equipment, structures, consoles, pipes, furniture, lights, and other appropriate objects.

## 5.2 Station layout

Build an attractive horizontal side-view cutaway of the underwater station.

Use multiple connected sections and decks.

The layout should make the station feel like an actual enclosed industrial research facility.

Implement:

- Doors and bulkheads.
- Walkable corridors.
- Vertical access connections.
- Pipes.
- Electrical conduits.
- Ventilation ducts.
- Machinery.
- Control consoles.
- Lighting.
- Structural walls.
- Damaged walls.
- Water-filled rooms.

Room expansion must have a clear logical structure.

New rooms must physically connect to existing station infrastructure.

## 5.3 Room interaction

When the player selects a room, display a comprehensive Persian information panel.

It must include:

- Room name.
- Room category.
- Operational condition.
- Structural health.
- External pressure exposure.
- Internal pressure.
- Flooding level.
- Temperature.
- Oxygen.
- CO2.
- Current power.
- Assigned staff.
- Current tasks.
- Active equipment.
- Damaged equipment.
- Repair requirements.
- Historical incidents.

Provide tabs such as:

- نمای کلی
- تجهیزات
- شرایط محیطی
- کارکنان
- تعمیرات
- تاریخچه

Every tab must display relevant real data.

---

# PART 6 — THE SIMULATION ENGINE

This is the most important technical component of the game.

Build the simulation as independent, interconnected systems.

## 6.1 Simulation clock

Create a simulation clock that is independent of rendering speed.

Use fixed simulation steps.

Initial target:

- One simulation tick per real second at normal speed.
- One game minute per simulation tick at 1x.
- Time controls: توقف، ۱x، ۲x، ۴x.

The simulation must continue consistently regardless of rendering frame rate.

Implement proper pause/resume behavior.

When the application moves to the background, pause safely by default.

Do not produce enormous uncontrolled offline progression when the app resumes.

All major events and system updates must use the simulation clock.

## 6.2 Structural integrity and external pressure

Implement a real gameplay model of deep-ocean pressure.

External pressure should increase with depth.

Use:

`P = rho * g * h`

Use appropriate seawater density and gravitational acceleration.

At approximately 5,800 meters, external pressure should be around 58 MPa gauge pressure.

Use consistent internal units.

Show player-friendly values in Persian.

The hull system must account for:

- Structural integrity.
- Maximum rated pressure.
- Material type.
- Fatigue.
- Existing damage.
- Repair quality.
- Breach size.
- External pressure.
- Pressure differential.

Damage must influence the probability of failure.

A damaged structure must not behave identically to a healthy one.

## 6.3 Flooding system

Implement a room-based flooding simulation.

A leak must have:

- Location.
- Size.
- Flow rate.
- Damage source.
- Severity.
- Repair condition.
- Associated room.

Water can enter through breaches.

Water can spread through connected open doors and damaged bulkheads.

Pumps must remove water according to their real capacity and condition.

Doors and bulkheads must influence flooding propagation.

The simulation must account for:

- Water volume.
- Room volume.
- Water level.
- Pump capacity.
- Pump power.
- Door state.
- Leak size.
- Pressure differential.

Use a simplified but coherent fluid model.

It must be physically plausible enough to create meaningful decisions without attempting an unnecessarily expensive full computational-fluid-dynamics simulation.

Water level must be visible in the actual game world.

Flooding must affect equipment and electricity.

## 6.4 Electrical system

Build an actual power distribution network.

Required components:

- Main power generator.
- Backup generator.
- Battery bank.
- Electrical distribution panels.
- Independent circuits.
- Power consumers.
- Emergency circuits.
- Circuit breakers.
- Damaged cables.
- Overloaded connections.

Track:

- Total generation.
- Total consumption.
- Available reserve.
- Battery charge.
- Current load.
- Maximum capacity.
- System efficiency.
- Individual device consumption.

The player must be able to:

- Turn devices on/off.
- Set power priorities.
- Inspect electrical circuits.
- Diagnose faults.
- Isolate damaged circuits.
- Repair cables.
- Manage emergency power.
- Control battery charging.

Power failure must affect actual equipment.

For example:

If a life-support unit loses electricity, its oxygen generation and filtration functions must change accordingly.

## 6.5 Life-support system

Implement individual systems for:

- Oxygen production.
- Oxygen distribution.
- Carbon dioxide removal.
- Ventilation.
- Air filtration.
- Water purification.
- Temperature control.

Track the atmospheric conditions of each room.

Do not use a single station-wide oxygen value as a substitute for room-level atmospheric simulation.

CO2 and oxygen conditions must influence worker health.

Equipment failures and power shortages must have consequences.

The player must be able to:

- Allocate resources.
- Inspect atmospheric conditions.
- Activate emergency reserves.
- Replace filters.
- Repair generators.
- Configure ventilation.
- Prioritize rooms.

## 6.6 Thermal management

Implement:

- Room temperatures.
- Cooling equipment.
- Heating equipment.
- Heat produced by electrical machinery.
- Thermal transfer between connected areas.
- Equipment temperature limits.
- Overheating damage.

Temperature must influence crew conditions and equipment performance.

## 6.7 Equipment damage

Every major device must have an actual state.

Use a consistent condition model.

Possible states:

- سالم
- فرسوده
- آسیب‌دیده
- خراب
- در حال تعمیر

Damage can result from:

- Water exposure.
- Electrical failure.
- Overheating.
- Pressure effects.
- Mechanical fatigue.
- Operational accidents.

Repairs must consume real time and resources.

The quality of repairs must depend on staff skills and available materials.

---

# PART 7 — CREW SIMULATION AND ARTIFICIAL INTELLIGENCE

The crew must be actual simulation entities.

They must not be static decorations.

## 7.1 Initial crew

Create four distinct starting characters.

Each must have:

- Full Persian profile.
- Unique background.
- Job specialization.
- Skills.
- Personality traits.
- Health status.
- Fatigue.
- Hunger.
- Hydration.
- Stress.
- Morale.
- Experience.
- Personal history.
- Current assignment.

Example initial crew:

1. مهندس آرمان کیانی — مهندسی برق و تعمیرات
2. دکتر نازنین راد — زیست‌شناسی و تحقیقات
3. سارا فرهمند — پزشکی و پشتیبانی
4. میلاد نوری — رباتیک، ROV و عملیات خارجی

Names and profiles may be expanded creatively, but every person must have meaningful differences.

## 7.2 Staff skills

Implement individual skill values.

Required skill categories:

- مهندسی
- برق
- مکانیک
- پزشکی
- زیست‌شناسی
- زمین‌شناسی
- رباتیک
- اکتشاف
- تشخیص خرابی

Skills must affect actual task performance.

A highly skilled engineer should perform relevant repairs more effectively than an unqualified worker.

## 7.3 Needs and psychological condition

Track:

- Energy.
- Sleep.
- Hunger.
- Hydration.
- Health.
- Stress.
- Morale.
- Workload.
- Social condition.
- Environmental exposure.

These conditions must affect performance and decision-making.

Workers should react to emergencies.

They should not behave as perfectly predictable machines.

## 7.4 Independent task system

Build a proper task scheduler.

Workers must select tasks based on:

- Assigned job.
- Skill.
- Priority.
- Distance.
- Current health.
- Fatigue.
- Available materials.
- Emergency level.
- Task dependencies.

Required task categories:

- Repair.
- Diagnosis.
- Medical treatment.
- Material transport.
- Research.
- Routine inspection.
- Equipment operation.
- Emergency response.
- ROV support.

The player must be able to create, assign, cancel, reprioritize, and inspect tasks.

## 7.5 Crew navigation

Workers must move physically through the station.

Implement navigation using a suitable pathfinding approach such as A*.

Rooms and corridors must have traversable connections.

Closed doors should block movement where appropriate.

If a route becomes flooded or inaccessible, the worker must respond accordingly.

Do not simply teleport workers between rooms.

---

# PART 8 — RESOURCE MANAGEMENT AND LOGISTICS

Build a complete resource economy.

Initial resource categories:

- قطعات مکانیکی
- قطعات الکترونیکی
- فلزات
- مواد عایق
- فیلتر هوا
- مواد تصفیه
- آب
- غذا
- سوخت پشتیبان
- باتری
- ابزار تعمیر
- تجهیزات پزشکی
- مواد آزمایشگاهی

Each resource must have:

- Quantity.
- Storage location.
- Capacity.
- Weight or volume.
- Consumption rate.
- Production rate.
- Reserved quantity.
- Availability.
- Critical reserve.

The inventory must be connected to real gameplay.

Repairs, production, and research must consume materials.

## 8.1 Warehouse interface

Build a detailed warehouse interface containing:

- Search.
- Category filters.
- Sorting.
- Resource details.
- Storage utilization.
- Consumption statistics.
- Production statistics.
- Minimum reserve settings.
- Critical shortage warnings.
- Material transfer.
- Crafting.

## 8.2 Production and crafting

Build a functional crafting system.

The player must be able to manufacture selected components using recipes and available equipment.

Recipes must have:

- Required materials.
- Required facility.
- Production duration.
- Required skill.
- Energy consumption.
- Output quantity.

No free unlimited crafting.

---

# PART 9 — RESEARCH AND TECHNOLOGY TREE

Research must be a complete progression system.

Create at least four research branches.

### 1. مهندسی سازه

- Improved hull materials.
- Reinforced bulkheads.
- Better pressure resistance.
- Advanced leak detection.
- Faster structural repairs.

### 2. انرژی و برق

- Improved generator efficiency.
- Better batteries.
- Advanced power distribution.
- Emergency power management.
- Improved electrical monitoring.

### 3. پشتیبانی حیات

- Improved oxygen production.
- Advanced carbon dioxide filters.
- Efficient water purification.
- Better temperature control.
- Emergency life-support systems.

### 4. رباتیک و علوم اعماق

- Better ROV batteries.
- Improved sonar.
- Advanced robotic arms.
- Better deep-sea cameras.
- Biological research.
- Geological analysis.

Each branch must contain multiple technologies.

Each research item requires:

- Prerequisites.
- Research points or resources.
- Research duration.
- Required staff skills.
- Actual gameplay effects.
- A clear unlock description.

A research unlock must modify actual game rules or available equipment.

Do not create a decorative technology tree.

---

# PART 10 — ROV AND DEEP-SEA EXPLORATION

This must be one of the game's most distinctive features.

The station must have a functional underwater remotely operated vehicle.

The player can launch the ROV from the station.

Create a dedicated horizontal exploration scene.

The ROV must have:

- Battery.
- Hull condition.
- Depth rating.
- Tether status.
- Camera.
- Sonar.
- Mechanical arm.
- Storage capacity.
- Movement speed.
- Light system.

The player must control it using mobile-friendly touch controls.

Include:

- Directional movement.
- Depth control.
- Camera/inspection.
- Sonar scan.
- Mechanical arm.
- Interaction.
- Return-to-station function.

Exploration areas must contain real objects and discoverable resources.

Examples:

- Geological formations.
- Unidentified organisms.
- Damaged equipment.
- Research samples.
- Abandoned structures.
- Wreckage.
- Unknown signal sources.

The ROV must consume energy.

Damage must matter.

Limited battery capacity must make expedition planning important.

Implement at least three meaningful initial expeditions.

Each expedition must provide actual rewards, risks, and consequences.

---

# PART 11 — RANDOM INCIDENTS AND EMERGENCIES

The game must include an event system.

Required initial incidents:

1. نشتی بدنه
2. اتصال کوتاه
3. خرابی ژنراتور
4. افزایش دمای تجهیزات
5. خرابی تصفیه هوا
6. نقص سیستم پمپ آب
7. حادثه پزشکی
8. اختلال ارتباطی
9. خرابی درب فشار
10. کشف سیگنال ناشناخته

Events must be generated through a coherent combination of:

- Random factors.
- Station condition.
- Equipment wear.
- Existing damage.
- Depth.
- Environmental conditions.
- Player decisions.

Avoid arbitrary events that have no logical cause.

Each incident must have:

- Severity.
- Location.
- Description.
- Detection method.
- Available response options.
- Associated tasks.
- Resource requirements.
- Time sensitivity.
- Possible consequences.

Provide a complete Persian incident-management interface.

---

# PART 12 — GAME MODES AND PROGRESSION

Implement three real game modes.

## 12.1 Campaign

The main narrative experience.

The player progressively expands the station, discovers new areas, researches technology, and investigates the unknown signal.

Build a structured campaign with several chapters and meaningful objectives.

Do not reduce the campaign to reading static text.

The story must interact with actual gameplay.

## 12.2 Endless Survival

An open-ended survival mode.

System wear, resource shortages, and environmental challenges create long-term difficulty.

The player determines how long the station survives.

Difficulty must be configurable.

## 12.3 Challenge Missions

Create dedicated scenarios with specific objectives.

Examples:

- کنترل نشتی بزرگ بدون خاموش شدن زندگی‌پشتیبان
- زنده ماندن در قطعی برق
- نجات کارکنان از یک بخش آسیب‌دیده
- اکتشاف با باتری محدود
- تعمیر یک بخش بحرانی قبل از وقوع فاجعه

Each challenge must have a clear win condition and evaluation.

---

# PART 13 — STORY AND ATMOSPHERE

The game should create a strong sense of mystery.

Use environmental storytelling.

The unknown signal should gradually become more important.

Create:

- Crew conversations.
- Research records.
- Archived messages.
- Sonar discoveries.
- Investigation notes.
- Strange external observations.
- Campaign discoveries.

Narrative must be delivered through carefully integrated Persian text and actual playable investigations.

Do not turn the game into a text-only visual novel.

Balance atmosphere and simulation.

The narrative should leave room for future content expansion.

---

# PART 14 — USER INTERFACE AND USER EXPERIENCE

The UI is a major product component.

It must feel like a polished professional science-fiction simulation game.

Do not produce simplistic mobile menus.

## 14.1 Main menu

Create a beautiful animated title screen.

Include:

- BENTHIC-9 logo.
- Animated underwater background.
- Atmospheric sound.
- Continue.
- New game.
- Campaign.
- Endless survival.
- Challenges.
- Load game.
- Settings.
- Credits.

The logo must be a genuine visual asset, not plain text typed into a button.

## 14.2 Gameplay HUD

Design a persistent landscape HUD.

It should include:

- Current station time.
- Current depth.
- Power condition.
- Oxygen condition.
- Structural condition.
- Crew status.
- Important active incidents.

The central region must be reserved for the actual station.

Provide a bottom navigation system for major management areas.

Avoid obstructing the station view.

## 14.3 Required navigation sections

Implement these full sections:

1. نمای کلی
2. نقشه ایستگاه
3. کارکنان
4. سامانه‌ها
5. تدارکات
6. پژوهش
7. اکتشاف
8. گزارش‌ها
9. تنظیمات

Each section must have actual data, real interaction, and its own detailed interface.

## 14.4 Detailed management screens

### Station overview

Include:

- Overall condition.
- Key resources.
- Active incidents.
- Recent events.
- Critical warnings.
- Production and consumption.
- Crew condition.
- Operational statistics.

### Power control

Include:

- Live generation.
- Consumption graph.
- Circuit status.
- Battery levels.
- Generator information.
- Power allocation.
- Priority settings.
- Historical statistics.
- Fault details.

### Life support

Include:

- Oxygen production.
- CO2 levels.
- Ventilation.
- Water purification.
- Filtration.
- Room-level environmental status.
- Equipment condition.
- Consumable reserves.

### Crew management

Include:

- Full profiles.
- Skills.
- Personal characteristics.
- Current condition.
- Schedule.
- Assignment.
- Task queue.
- Work history.
- Health.
- Relationships where applicable.
- Individual statistics.

### Logistics

Include:

- Inventory.
- Storage.
- Crafting.
- Production.
- Consumption.
- Transfers.
- Shortages.
- Item details.
- Resource forecasts.

### Research

Include:

- Interactive research tree.
- Branches.
- Prerequisites.
- Research progress.
- Available researchers.
- Research costs.
- Unlock descriptions.

### Exploration

Include:

- Sonar information.
- Expedition planning.
- ROV status.
- Expedition history.
- Discovered locations.
- Unidentified signals.
- Available objectives.

### Reports

Include:

- Historical events.
- Incident timeline.
- System failures.
- Repair history.
- Crew performance.
- Resource consumption.
- Research progress.
- Expedition results.

Charts and statistics must be generated from actual simulation history.

## 14.5 Interface behavior

Every interactive component must work.

Examples:

- Tabs must switch correctly.
- Filters must filter actual data.
- Search must return relevant items.
- Sorting must work.
- Charts must reflect current data.
- Sliders must change actual values.
- Switches must change actual equipment states.
- Buttons must trigger real commands.
- Dialogues must display relevant information.

Use clear confirmation dialogs for dangerous actions.

Use visual warnings for critical conditions.

Use tooltips and contextual help where appropriate.

---

# PART 15 — PERSIAN LOCALIZATION AND TYPOGRAPHY

This is an essential requirement.

**The primary game language must be Persian.**

Do not make English the default language.

## 15.1 Font

Use Vazirmatn as the primary Persian font.

Include the font files inside the project.

Use the required font license and attribution.

Include suitable local font weights:

- Regular 400
- Medium 500
- SemiBold 600
- Bold 700
- ExtraBold 800 where appropriate

Do not load the main font from an external web server.

All fonts must work offline.

## 15.2 RTL implementation

Implement proper right-to-left layout throughout the game.

Use appropriate RTL handling for:

- Menus.
- Dialogues.
- Forms.
- Tables.
- Charts.
- Navigation.
- Text alignment.
- Labels.
- Resource lists.
- Notifications.

Support mixed Persian and Latin text.

Use appropriate bidirectional isolation for technical values, units, and identifiers.

## 15.3 Number formatting

Use appropriate Persian number formatting in player-facing interfaces.

Use locale-aware formatting instead of randomly replacing digits.

Keep internal numerical storage independent of display formatting.

Avoid confusing Persian decimals, separators, units, and signs.

## 15.4 Persian writing quality

The Persian text must be:

- Natural.
- Fluent.
- Professional.
- Consistent.
- Technically accurate.
- Free of machine-translated wording.

Use a consistent terminology dictionary throughout the application.

Examples:

- Hull Integrity: سلامت بدنه
- Life Support: پشتیبانی حیات
- Power Distribution: توزیع برق
- Structural Damage: آسیب سازه‌ای
- Pressure Differential: اختلاف فشار
- Flooding: آب‌گرفتگی
- Research: پژوهش
- Expedition: مأموریت اکتشافی
- Crew: کارکنان

The exact wording may be refined, but terminology must remain consistent.

## 15.5 Language configuration

Persian must be selected by default.

An English localization may be included as an additional option if it can be implemented cleanly.

Never make English a requirement for operating the game.

---

# PART 16 — ART DIRECTION AND GRAPHICS

The visual identity must be distinctive.

## 16.1 Pixel art requirements

Use highly detailed pixel art.

Do not use primitive graphics.

Do not use a flat-color-only design.

Do not use generic geometric placeholders as final assets.

The graphics must have:

- Detailed industrial structures.
- Rich environmental details.
- Proper lighting.
- Atmospheric depth.
- Consistent perspective.
- Carefully designed sprite sheets.
- Multiple animation states.
- Detailed machinery.
- Appropriate material textures.

The overall look should resemble a premium indie pixel-art science-fiction simulation game.

## 16.2 Color identity

Use a controlled palette.

Primary colors:

- Dark ocean navy.
- Deep blue.
- Blue-green.
- Cyan.
- Metallic gray.
- Muted steel.
- Amber warning lights.
- Warm industrial lighting.

Avoid excessively colorful cartoon aesthetics.

## 16.3 Environment

Create visually rich environments.

Required visual elements:

- Interior walls.
- Mechanical equipment.
- Pipes.
- Cable systems.
- Consoles.
- Pressure doors.
- Windows.
- Exterior ocean.
- Underwater darkness.
- Particle effects.
- Water movement.
- Bubbles.
- Sonar effects.
- Warning lights.

## 16.4 Animation

Implement appropriate animations for:

- Crew movement.
- Crew working.
- Machinery.
- Rotating fans.
- Pumps.
- Electrical sparks.
- Water leakage.
- Flooding.
- Warning lights.
- Doors.
- ROV movement.
- Ocean particles.
- Ambient underwater effects.

Animation must communicate actual gameplay state.

A broken generator should visually look different from a functioning one.

A flooded room should visually reflect its actual water level.

## 16.5 Asset production

Create original game assets.

Use coherent sprite sheets and atlases.

Generate assets using available image-generation tools when possible.

Alternatively, create original pixel-art assets using suitable drawing and procedural asset tools.

Use web resources only when their licenses permit redistribution in the game.

Do not download random copyrighted images.

Maintain an asset license inventory.

Every important visual asset must belong to the same artistic direction.

## 16.6 Branding assets

Create:

- Main game logo.
- Android launcher icon.
- Adaptive icon.
- Splash screen.
- Main menu key art.
- GitHub social preview artwork.
- Store-ready promotional artwork where possible.

The icon should be recognizable at small sizes.

Use the octagonal underwater station hatch, cyan light, and amber warning light as the primary visual motif.

---

# PART 17 — AUDIO DESIGN

Build an atmospheric sound system.

Required audio categories:

- Deep underwater ambience.
- Station machinery.
- Electrical hum.
- Pumps.
- Ventilation.
- Warning alarms.
- Water leakage.
- Doors.
- ROV propulsion.
- Sonar.
- UI interactions.
- Emergency alerts.
- Music.

Implement independent audio controls.

Settings must include:

- Master volume.
- Music volume.
- Sound effects volume.
- Ambient volume.
- Mute.
- Audio behavior when app is paused.

Audio must be optional and must never be required to understand critical warnings.

Use original audio or properly licensed assets.

---

# PART 18 — SAVE SYSTEM AND OFFLINE DATA

The game must work without internet.

Implement a robust local save system.

Use IndexedDB for structured game data.

Do not rely on temporary in-memory data.

Required features:

- Automatic saving.
- Manual saving.
- Three or more save slots.
- Save-slot metadata.
- Save timestamps.
- Campaign progress.
- Current simulation state.
- Crew state.
- Resource state.
- Research progress.
- Station configuration.
- Event history.
- Settings.

Implement:

- Save format versioning.
- Schema migration.
- Corruption detection.
- Safe loading.
- Backup export.
- Backup import.

The player must not lose their campaign because of an application restart.

Do not silently overwrite another save slot.

Use transaction-safe storage operations.

---

# PART 19 — MOBILE EXPERIENCE AND ANDROID CONFIGURATION

## 19.1 Landscape

Lock the Android activity to landscape.

Use native Android orientation configuration.

Handle safe areas and display cutouts.

Do not allow interface elements to overlap system navigation areas.

## 19.2 Touch interaction

All interfaces must be designed for touch.

Use appropriate touch target sizes.

Provide:

- Tap.
- Long press where useful.
- Drag.
- Pinch zoom where appropriate.
- Scroll.
- Swipe only when discoverable and not conflicting with important interactions.

Do not depend on mouse hover.

No gameplay-critical action should require a keyboard.

## 19.3 Performance

Target:

- 60 FPS where possible.
- Stable 30 FPS minimum under reasonable load on target hardware.

Use:

- Asset atlases.
- Texture reuse.
- Efficient scene rendering.
- Object pooling.
- Simulation throttling.
- Efficient React updates.
- Lazy loading where appropriate.
- Memory-conscious asset management.

Avoid unnecessary rendering of inactive interfaces.

## 19.4 Real-device testing

The application must be tested on a real Android device where possible.

Primary target for the user:

Samsung Galaxy A23.

At minimum, validate:

- Installation.
- Landscape orientation.
- Startup.
- Main menu.
- New game.
- Station rendering.
- Touch controls.
- Management screens.
- Save/load.
- Pause/resume.
- Application restart.
- Performance.
- Audio.
- No critical crashes.

A successful browser test does not prove that the APK works correctly.

---

# PART 20 — SOFTWARE ARCHITECTURE

Build clean and maintainable source code.

Suggested project structure:

```text
benthic-9/
├── public/
│   ├── assets/
│   │   ├── sprites/
│   │   ├── tiles/
│   │   ├── backgrounds/
│   │   ├── icons/
│   │   ├── audio/
│   │   └── fonts/
│   ├── favicon/
│   └── manifest.webmanifest
│
├── src/
│   ├── app/
│   ├── game/
│   │   ├── scenes/
│   │   ├── entities/
│   │   ├── rendering/
│   │   ├── cameras/
│   │   └── input/
│   │
│   ├── simulation/
│   │   ├── core/
│   │   ├── clock/
│   │   ├── station/
│   │   ├── rooms/
│   │   ├── hull/
│   │   ├── flooding/
│   │   ├── electricity/
│   │   ├── life-support/
│   │   ├── thermal/
│   │   ├── crew/
│   │   ├── navigation/
│   │   ├── tasks/
│   │   ├── resources/
│   │   ├── crafting/
│   │   ├── research/
│   │   ├── rov/
│   │   ├── incidents/
│   │   └── progression/
│   │
│   ├── ui/
│   │   ├── shell/
│   │   ├── navigation/
│   │   ├── dashboard/
│   │   ├── station/
│   │   ├── crew/
│   │   ├── systems/
│   │   ├── logistics/
│   │   ├── research/
│   │   ├── exploration/
│   │   ├── reports/
│   │   ├── dialogs/
│   │   └── settings/
│   │
│   ├── data/
│   │   ├── definitions/
│   │   ├── recipes/
│   │   ├── events/
│   │   ├── research/
│   │   ├── missions/
│   │   └── localization/
│   │
│   ├── persistence/
│   ├── audio/
│   ├── services/
│   ├── styles/
│   └── main.tsx
│
├── android/
├── tests/
├── docs/
├── .github/
│   └── workflows/
├── capacitor.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

You may adjust this structure if there is a clear technical reason.

Do not place the entire application inside a handful of giant files.

Separate:

- Domain models.
- Simulation rules.
- UI.
- Rendering.
- Persistence.
- Audio.
- Localization.
- Input.
- Content definitions.

Use strong TypeScript types.

Avoid `any` wherever possible.

Do not create circular dependencies.

Avoid unnecessary global state.

Create a clear command/event interface between the UI and simulation.

The rendering layer must never become the authoritative source of gameplay state.

---

# PART 21 — GAME QUALITY AND TESTING

Testing must focus on real correctness.

## 21.1 Simulation tests

Test important cases:

- Pressure calculation.
- Hull damage.
- Water ingress.
- Flood propagation.
- Pump operation.
- Electrical overload.
- Power loss.
- Battery depletion.
- Oxygen production.
- CO2 accumulation.
- Ventilation failure.
- Thermal degradation.
- Equipment damage.
- Task assignment.
- Worker pathfinding.
- Crew health changes.
- Resource consumption.
- Crafting.
- Research prerequisites.
- ROV energy consumption.
- Save/load round trip.

## 21.2 Gameplay integration scenarios

Test complete scenarios.

Example:

A leak occurs in the generator room.

The room floods.

Electrical equipment becomes damaged.

The generator fails.

Backup power activates.

Life-support priority is preserved.

A crew member receives a repair task.

The player assigns a skilled engineer.

Required materials are consumed.

The repair completes.

The systems return to normal.

All steps must actually work through the complete application.

## 21.3 UI tests

Test:

- Main menu.
- New game.
- Main navigation.
- Room selection.
- Room details.
- Staff assignment.
- Power control.
- Inventory.
- Research.
- ROV.
- Save/load.
- Settings.
- RTL layout.

## 21.4 Code quality

Required:

- Successful production build.
- Successful type checking.
- Important tests passing.
- No critical console errors.
- No unhandled promise rejections.
- No broken navigation.
- No fake buttons.
- No critical placeholder screens.

Do not report tests as passed unless they were actually executed.

---

# PART 22 — GAME DEVELOPMENT SKILLS

Before implementing gameplay, inspect:

https://github.com/gamedev-skills/awesome-gamedev-agent-skills

This is a mandatory resource.

Do not simply read the repository description.

Actually inspect its available skills.

Use its Router and the most relevant skills for this project.

Prioritize skills related to:

- Game architecture.
- Phaser.
- 2D game development.
- Pixel-art production.
- Game UI.
- Simulation systems.
- Mobile development.
- Performance optimization.
- Audio.
- Testing.

Follow the Router's recommendations to select relevant skills.

Install or make the selected skill instructions available to the working agent according to the repository's actual installation instructions.

Read the relevant SKILL.md files.

Apply their guidance during implementation.

Do not install every available skill without evaluation.

Do not execute untrusted repository scripts blindly.

Also read the official Phaser 4.2.1 documentation and relevant API examples.

Use the correct Phaser 4 APIs.

Do not mix obsolete Phaser 3 APIs with Phaser 4 code.

If there is uncertainty around a method or class, verify it against the actual versioned API and examples before implementing it.

---

# PART 23 — GITHUB AND CI/CD

GitHub is the required infrastructure for source code and Android releases.

## 23.1 Repository handling

Inspect the connected GitHub account and available repositories.

Identify the repository already designated for this project.

If the project repository does not exist, use the name:

`benthic-9`

Prefer a private repository initially unless an existing project configuration specifies otherwise.

Do not overwrite unrelated repositories.

Do not destroy existing branches or history.

Use meaningful commits.

Push completed and verified work regularly.

## 23.2 Required GitHub Actions workflows

Create automated workflows for:

### CI workflow

Trigger on:

- Push.
- Pull request.
- Manual execution where useful.

Tasks:

1. Checkout source.
2. Set up a compatible Node environment.
3. Install dependencies using the lockfile.
4. Run type checking.
5. Run linting.
6. Run selected simulation tests.
7. Run important UI tests.
8. Build the production web app.
9. Prepare the Android project.

### Android build workflow

Trigger on:

- Manual workflow dispatch.
- Version tags matching `v*`.

Tasks:

1. Checkout source.
2. Set up compatible Node.
3. Set up a Java version compatible with the generated Gradle wrapper.
4. Install dependencies.
5. Build the web app.
6. Run Capacitor sync.
7. Build an installable Android APK.
8. Build a signed release APK and AAB when signing credentials are configured.
9. Verify generated artifacts.
10. Upload artifacts.
11. Publish the GitHub Release when the required checks pass.

Do not fabricate a successful artifact link.

Only report files that really exist and were successfully produced.

## 23.3 Release signing

Never commit:

- Keystore files.
- Signing passwords.
- Private keys.
- Personal access tokens.
- GitHub secrets.

Use GitHub Actions Secrets for persistent production signing.

Recommended secret names:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

If these secrets already exist, use them safely.

If they do not exist:

- Always produce a usable debug APK for internal testing.
- Do not falsely claim a production-signed release.
- Do not create an ephemeral production signing key that would make future updates incompatible.
- Clearly document the exact secrets required for a persistent signed release.
- Continue the remaining workflow.

Never print sensitive secret contents in logs.

## 23.4 Initial release

The initial release target is:

`v0.1.0-alpha.1`

Use a pre-release designation.

Upload:

- Installable APK.
- Relevant build information.
- Version information.
- Release notes.
- Web build artifact where useful.

If persistent signing is configured, also upload:

- Signed release APK.
- Signed Android App Bundle (AAB).

The GitHub Release must be created automatically by the configured workflow after successful completion.

Do not create a release containing broken or missing files.

---

# PART 24 — DEVELOPMENT PHASES

Work in the following sequence.

These are implementation phases, not reasons to stop and ask the user for approval.

## PHASE 0 — DISCOVERY AND ARCHITECTURE

- Inspect repository.
- Inspect existing files.
- Read relevant game development skills.
- Read Phaser documentation.
- Verify dependency compatibility.
- Design the technical architecture.
- Establish project structure.
- Create an implementation roadmap.

Save the architectural decisions in:

`docs/ARCHITECTURE.md`

Save the simulation model in:

`docs/SIMULATION_MODEL.md`

Save the implementation roadmap in:

`docs/ROADMAP.md`

Then immediately proceed.

Do not stop after writing documentation.

## PHASE 1 — PLAYABLE FOUNDATION

Build:

- Vite application.
- Phaser rendering environment.
- React interface shell.
- Persian RTL foundation.
- Vazirmatn font integration.
- Landscape behavior.
- Main menu.
- Save system foundation.
- Initial station layout.
- Initial crew.
- Core simulation clock.

The first milestone must already be launchable and interactive.

## PHASE 2 — CORE SIMULATION

Implement:

- Rooms.
- Hull integrity.
- Pressure.
- Flooding.
- Pumps.
- Power network.
- Life support.
- Thermal systems.
- Equipment health.

The systems must actually interact.

## PHASE 3 — CREW AND MANAGEMENT

Implement:

- Crew profiles.
- Worker needs.
- Task management.
- Navigation.
- Staff scheduling.
- Repair actions.
- Full room interfaces.
- Power management interface.
- Life-support interface.

## PHASE 4 — LOGISTICS AND PROGRESSION

Implement:

- Inventory.
- Production.
- Crafting.
- Research.
- Technology unlocks.
- Resource planning.
- Incident management.
- Historical reports.

## PHASE 5 — EXPLORATION AND CONTENT

Implement:

- ROV system.
- Exploration scene.
- Sonar.
- Expeditions.
- Discoveries.
- Campaign.
- Endless survival.
- Challenge missions.
- Narrative content.
- Random event logic.

## PHASE 6 — POLISH

Complete:

- Pixel-art production.
- Character animations.
- Lighting.
- Visual effects.
- Sound.
- UI animations.
- Loading screens.
- Tutorials.
- Settings.
- Accessibility.
- Performance optimization.

## PHASE 7 — VERIFICATION AND RELEASE

- Run tests.
- Fix bugs.
- Build production web.
- Package Android.
- Verify APK installation package.
- Run Android build in GitHub Actions.
- Create release.
- Upload artifacts.
- Verify the GitHub Release page.

Do not claim completion merely because the build command exited successfully.

---

# PART 25 — INITIAL PLAYER EXPERIENCE

The first session must be carefully designed.

When launching the application for the first time:

1. Show the animated BENTHIC-9 title screen.
2. Offer a new campaign.
3. Show a short, atmospheric Persian introduction.
4. Introduce the four crew members.
5. Show the current station condition.
6. Explain the most important resources.
7. Introduce station navigation.
8. Give the player an initial task.
9. Teach inspection and task assignment.
10. Introduce the first manageable technical problem.
11. Allow the player to resolve it.
12. Gradually unlock more advanced management tools.

Tutorials must be integrated into gameplay.

Do not overwhelm the player with every advanced system at once.

Advanced information must remain accessible through detailed menus.

---

# PART 26 — FINAL ACCEPTANCE CRITERIA

The project is not complete until the following conditions are satisfied.

## Product

- The game launches successfully.
- The first campaign is playable.
- The initial station is fully implemented.
- The major systems interact correctly.
- Crew behavior is functional.
- Resources have real consequences.
- Repairs work.
- Research works.
- ROV expeditions work.
- Incidents have real consequences.
- Save/load works.
- All important UI sections work.

## Visual quality

- Original game branding.
- Detailed pixel-art environments.
- Functional animation.
- Consistent lighting.
- Complete iconography.
- No unfinished placeholder art in critical areas.

## Persian UX

- Persian default language.
- Proper RTL.
- Vazirmatn font bundled locally.
- Natural Persian terminology.
- Readable typography.
- Correct mixed-text handling.
- No broken or reversed labels.

## Android

- Landscape orientation locked.
- Installable APK exists.
- Capacitor integration works.
- Touch controls work.
- No critical startup failure.
- Local data persists.
- App can restart without losing the campaign.

## GitHub

- Source code pushed.
- CI workflow operational.
- Android build workflow operational.
- Build logs available.
- GitHub Release created.
- APK uploaded and verified.
- AAB uploaded if signed release configuration is available.
- README and release documentation completed.

---

# PART 27 — DEVELOPMENT PRIORITIES

When resources or time are constrained, use this priority order:

1. Complete, working gameplay.
2. Correct interconnected simulation systems.
3. Deep and functional management interfaces.
4. Excellent Persian localization and RTL.
5. High-quality pixel-art visuals.
6. Performance.
7. Content expansion.
8. Additional secondary features.

Never sacrifice core functionality to create the appearance of a larger game.

Do not write excessive tests for unimportant details while major gameplay systems remain unfinished.

Do not spend all your development effort on the main menu.

Do not create numerous decorative screens before the actual simulation works.

The game must be fun to interact with, not merely visually impressive.

---

# PART 28 — CONTINUOUS EXECUTION POLICY

This project requires implementation, not repeated planning.

After completing each phase:

1. Verify the work.
2. Fix important issues.
3. Commit meaningful changes.
4. Push to GitHub.
5. Update project documentation.
6. Continue to the next phase.

Maintain a persistent task checklist in:

`docs/PROGRESS.md`

Record:

- Completed features.
- Remaining work.
- Known bugs.
- Build status.
- Important technical decisions.
- Next implementation tasks.

If context or execution limits interrupt development, save sufficient project state so work can continue without redesigning the project.

Do not repeatedly rebuild the same features.

Do not abandon working components unnecessarily.

Do not replace substantial implemented systems with simplified mockups.

When something is difficult, solve the underlying technical problem rather than quietly removing the feature.

If a specific feature genuinely must be postponed, document it honestly and continue the rest of the project.

---

# PART 29 — FINAL DELIVERY REPORT

After completing the implementation and release, provide a concise but complete report containing:

1. Project repository URL.
2. Main branch and latest commit.
3. Implemented features.
4. Simulation systems completed.
5. Persian UX status.
6. Test results.
7. Web build status.
8. Android build status.
9. APK download URL.
10. AAB download URL if available.
11. GitHub Release URL.
12. Real-device testing status.
13. Known limitations.
14. Required next steps, if any.

Clearly distinguish:

- Implemented and verified.
- Implemented but not tested on a physical device.
- Not yet implemented.
- Blocked by missing external credentials or permissions.

Never fabricate test results, release links, successful installations, or completed features.

---

# FINAL COMMAND — START BUILDING

Begin immediately.

Inspect the available repository and your GitHub access.

Inspect and use the required game-development skills.

Verify the actual toolchain versions.

Create the architecture.

Start implementing the game.

Build a functioning playable foundation first.

Then complete the interconnected simulation systems, advanced Persian interfaces, visual assets, gameplay modes, and Android pipeline.

Keep the source code in GitHub.

Build the web version first.

Package Android through Capacitor and GitHub Actions.

Publish the actual installable APK through GitHub Releases.

**Do not respond with another proposal, conceptual design, or list of things you intend to do. Execute the project.**

**The deliverable is a finished, polished, genuinely playable Android game named BENTHIC-9.**