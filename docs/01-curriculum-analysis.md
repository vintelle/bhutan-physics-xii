# Class XII Physics: Curriculum Analysis and Learning Outcome Extraction

Step 1 of the *Bhutan Grade XII Physics Quiz Platform* build. Everything below comes from only two documents:

- **SCF**: *National School Curriculum: Science Curriculum Framework, Classes PP-XII*. Centre for School Curriculum Development, DSE, MoESD, First Edition 2022; Second Edition 2025. Used: Physics Section D, 12.2 Key Stage 5 (pp. 244-245), Class XII competency (pp. 255-256), Tables 16-20 (pp. 257-265), Assessment 15.3.
- **IG**: *National School Curriculum: Instructional Guide for Physics, Classes XI & XII*. Department of Curriculum and Professional Development, MoE, First Edition 2022. Used: Class XII pp. 78-157; Annexure 2 p. 159.

The machine-readable version, used to seed the database, is [`curriculum/class-xii-physics.json`](../curriculum/class-xii-physics.json).

## 1. At a glance

| Item | Count |
|---|---|
| Themes (Units) | 5 |
| Topics (Chapters, IG Annexure 2) | 13 |
| Sub-topics (Concepts, each with an official *Scope*) | 48 |
| Learning Objectives (Learning Outcomes) | 47 |
| Theme competencies | 24 |
| Practical investigations named in IG | 14 |
| IG exemplar questions (topic-level) | 129 (+ about 40 revision questions) |
| Teaching time | 7200 minutes (120 hours) |

**Hierarchy used by the platform:** Theme (Unit) > Topic (Chapter) > Sub-topic (Concept, with Scope) > Learning Objective (Learning Outcome) > Assessment Items.

Learning-outcome codes take the form `XII.<THEME>.<nn>`, for example `XII.EM.07`. The source documents number objectives with Roman numerals that restart in each theme (`EM vii`). Each outcome keeps that original reference too.

## 2. Theme and topic weighting (IG Annexure 2)

This weighting drives the test blueprint: by default, a generated test spreads its marks in these proportions.

| Theme (Unit) | Topic (Chapter) | Minutes | Weighting % |
|---|---|---:|---:|
| Newtonian Mechanics | Oscillations | 864 | 12 |
| | **Newtonian Mechanics total** | **864** | **12** |
| Fluid Mechanics and Thermal Physics | Fluid Mechanics | 406 | 7 |
|  | Kinetic Theory of Gases | 266 | 3 |
| | **Fluid Mechanics and Thermal Physics total** | **672** | **10** |
| Electricity and Magnetism | Electricity | 306 | 4 |
|  | Capacitors | 306 | 4 |
|  | Electromagnetic Induction | 612 | 9 |
|  | Electric Circuit | 805 | 12 |
| | **Electricity and Magnetism total** | **2029** | **29** |
| Waves and Optics | Ray Optics | 649 | 10 |
|  | Wave Optics | 725 | 9 |
|  | Quantum Physics | 562 | 8 |
| | **Waves and Optics total** | **1936** | **27** |
| Atomic, Nuclear and Space Physics | Particle Physics | 522 | 7 |
|  | Nuclear Energy | 459 | 7 |
|  | Space Science and Technology: Satellite Development | 718 | 8 |
| | **Atomic, Nuclear and Space Physics total** | **1699** | **22** |
| | **Grand total** | **7200** | **100** |

## 3. Competencies by theme (IG Class XII, matching SCF Class-wise Competency)

### 1. Newtonian Mechanics  (IG pp. 79-86; SCF Table 16)

**Class XII competencies**

1. Conduct an experiment to interpret the concept of simple harmonic motion graphically using interactive simulation and study its application in amusement parks, open space gyms, earthquake seismometers etc.
2. Explain the concept of resonance through an experiment to create awareness about the effect of seismic waves on infrastructures and design a conceptual model of earthquake resistant infrastructures.

**Key Stage 5 competency-based standard(s) this theme feeds**

- Interpret oscillatory motion using graphs and equations to solve numerical problems of oscillatory motion.

### 2. Fluid Mechanics and Thermal Physics  (IG pp. 87-93; SCF Table 17)

**Class XII competencies**

1. Conduct an experiment on surface tension to comprehend the movement of liquids in capillary tubes and flow of liquids through porous surfaces and apply the concept to clean water.
2. Design an experiment to measure the viscosity of the fluids to comprehend behaviour of flow of fluid.
3. Validate Bernoulli's equation using interactive simulations or models to explore the various applications in sizing the pipe, flow sensors, ejectors, pitot tube, etc.
4. Interpret gas expansion in terms of molecular motion that results in gas pressure due to molecular bombardment to understand the behaviour of gases.

> Note: The 4th competency (kinetic theory) appears in the IG only; the SCF Class XII competency list stops at Bernoulli.

**Key Stage 5 competency-based standard(s) this theme feeds**

- Investigate the properties and energy possessed by a fluid to comprehend the practical applications of fluid mechanics.

### 3. Electricity and Magnetism  (IG pp. 94-119; SCF Table 18)

**Class XII competencies**

1. Examine force of attraction and repulsion between charges using any interactive simulations or apps to explain Coulomb's law.
2. Interpret electric field, its strength and express electric flux for uniform and non-uniform electric field using simulations or apps to relate its applications in our life.
3. Construct a model of capacitor to explain its function as energy storage used in electronic devices.
4. Design an experiment to verify Faraday's laws of electromagnetic induction and apply the concept to design a working or conceptual model of a generator.
5. Explain the concept of self and mutual inductance and design a model (conceptual or working) to comprehend the working mechanism of a transformer.
6. Investigate the temperature dependence of resistivity of conductors, semiconductors, thermistors, and superconductors to identify appropriate materials for various applications.
7. Explain the distribution of voltage and current within the circuit and solve circuit network problems using the concept of Kirchhoff's law.
8. Explain a.c. circuit using interactive simulation or apps to describe the occurrence of electrical resonance.

**Key Stage 5 competency-based standard(s) this theme feeds**

- Experiment and describe the net effect of interaction of charges (Coulomb's Law) and net effect of voltage and current through complex circuits (Kirchhoff's law and principle of wheatstone bridge).
- Investigate Faraday's and Lenz's law to understand the induced e.m.f in simple generators, self and mutual inductance to describe the working of transformers.
- Compare the temperature dependence of resistivity of conductors, semiconductors, thermistors, and superconductors to apply the concept of conservation of energy in electrical devices.
- Study semiconductors to understand its application in sensors and thin film technology.
- Examine a.c circuit, explain sinusoidal variation of voltage and current, and solve numerical problems.
- Experiment and examine the behaviour of a capacitor during charging and discharging through a capacitor to determine the effective capacitance when capacitors are connected in series or parallel and apply the concept in electronics.

### 4. Waves and Optics  (IG pp. 120-138; SCF Table 19)

**Class XII competencies**

1. Conduct an experiment to study the behaviour of light when it strikes on different optical media and use the concept to design optical instruments.
2. Investigate and sketch image formation for different optical media using interactive simulation to comprehend the significance of optical media in optical instruments.
3. Verify Huygens' principle using appropriate light sources to explain the wave nature of light.
4. Illustrate interference and diffraction graphically and use the concept to study the stellar spectra and relate the concept in the field of optical communication.
5. Explain the particle nature of light and the photoelectric effect (Einstein's photoelectric equation) using interactive simulations/multimedia to relate its working in solar panel.

**Key Stage 5 competency-based standard(s) this theme feeds**

- Develop conceptual understanding of formation of images by different optical systems, total internal reflection and its application in medical technology, telecommunications and natural phenomena and verify these concepts through simulations or practical experiments.
- Describe the concept of interference and diffraction using Huygens' principle and superposition of waves to understand its applications in various fields.

### 5. Atomic, Nuclear and Space Physics  (IG pp. 139-157; SCF Table 20)

**Class XII competencies**

1. Examine the interior components of atoms and explain the behaviour and properties of each component to explain the standard model.
2. Study the concept of nanotechnology and recognise its significance and influence in our society.
3. Study nuclear energy as an alternative source of energy in future to assess the pros and cons of nuclear energy.
4. Identify the rocket parameters using interactive simulation to comprehend the process of rocket launch and satellite deployment.
5. Examine the methods of satellite disposal and suggest ways to minimize the accumulation of defunct satellites in space.

**Key Stage 5 competency-based standard(s) this theme feeds**

- Explore applications of atomic and nuclear phenomena such as nanotechnology, radiation therapy, diagnostic imaging and nuclear power (purpose).
- Explain the concept of photoelectric effect simulation to comprehend the particle nature of light and its application in the solar industry.
- Explain the principle of stationing/launching satellites and Kepler's laws of planetary motion to describe the motion of planets and satellites.
- Assess the emerging satellite technologies and rocketry to make best use of their applications in the area of remote sensing.
- Identify the rocket parameters using interactive simulation to deploy satellites for the particular purposes undergoing different stages of rocket launch.
- Suggest ways to remove satellite debris in the space to reduce hazards of the space environment inline with the GNH philosophy.

## 4. Full learning-outcome map

Bloom level is the *primary* cognitive demand of the objective's command verb (SCF 7.1 uses Bloom's taxonomy to write learning outcomes). The quiz engine still writes items at Remembering through Evaluating for every outcome; *Creating*-level outcomes are measured through teacher-assigned performance tasks. P = practical or investigation outcome; N = numerical problems are in scope.

### Newtonian Mechanics

#### Topic: Oscillations  (864 min · 12%)

- **1.1.1 Periodic and Oscillatory Motions**  
  *Scope:* periodic and oscillatory motions, simple harmonic motion, time period and frequency of periodic motion and displacement of periodic motion and its calculation, relation between simple harmonic motion and uniform circular motion.  
  *IG approach:* Instructional practices with video + interactive simulation; learners share via CLT.
- **1.1.2 Velocity and Acceleration in Simple Harmonic Motion**  
  *Scope:* velocity and acceleration in simple harmonic motion.  
  *IG approach:* Instructional practices with interactive simulation (ophysics SHM).
- **1.1.3 Energy in Simple Harmonic Motion**  
  *Scope:* energy in Simple Harmonic Motion (SHM), Hooke's law, slope and intercept from graph, least count of stopclock.  
  *IG approach:* CER model (Claim, Evidence, Reason); mass-spring system or simulation.
- **1.1.4 System Executing Simple Harmonic Motion: Simple Pendulum**  
  *Scope:* simple pendulum, acceleration due to gravity, time period, least count of vernier caliper and stopclock, conceptual relationship between effective length and time period, slope from graph.  
  *IG approach:* Structured inquiry (practical or online simulation).
- **1.1.5 Forced Oscillations and Resonance**  
  *Scope:* free, forced oscillation and resonance, condition for resonance in forced oscillations, frequency of tuning fork, tension of wire, resonance, sonometer.  
  *IG approach:* Instructional practices; sonometer and tuning fork; design earthquake-resistant model.

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.NM.01` | i | Explain periodic motion and oscillatory motion and relate with Simple Harmonic Motion (SHM) graphically using interactive simulation. | 1.1.1, 1.1.2 | Understanding |  | ✓ |
| `XII.NM.02` | ii | Use algebraic or computational representations to claim that total energy in SHM is conserved. | 1.1.3 | Evaluating | ✓ | ✓ |
| `XII.NM.03` | iii | Determine the value of acceleration due to gravity of a place to provide scientific evidence that a simple pendulum executes SHM. | 1.1.4 | Applying | ✓ | ✓ |
| `XII.NM.04` | iv | Experimentally investigate the concept of resonance using a tuning fork. | 1.1.5 | Analysing | ✓ |  |

### Fluid Mechanics and Thermal Physics

#### Topic: Fluid Mechanics  (406 min · 7%)

- **2.1.1 Surface Tension**  
  *Scope:* motion of bodies in a uniform gravitational field with fluid resistance, graphs and only final expressions, molecular theory for surface tension, applications of surface tension, cause and effect of surface tension in liquids, angle of contact, movement of liquids in capillary tubes using ideas of surface tension, travelling microscope, least count of travelling microscope, flow of liquids through porous media using capillary action.  
  *IG approach:* Instructional practices; capillary-rise practical; constructive debate.
- **2.1.2 Viscosity of Fluids**  
  *Scope:* viscosity of fluids, streamline, laminar and turbulent flow, equation of continuity - principle of continuity in any steady state process, Bernoulli's principle and its application.  
  *IG approach:* Guided discovery learning; Bernoulli simulation (ophysics fl2).  
  *Also in IG learning experiences:* Reynolds number (appears in IG exemplar question only).

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.FMT.01` | i | Carry out an experiment on surface tension of liquid from capillary rise method to comprehend its importance in everyday phenomena. | 2.1.1 | Applying | ✓ | ✓ |
| `XII.FMT.02` | ii | Design an experiment to measure the viscosity of the fluids and explain its applications in our daily life. | 2.1.2 | Creating | ✓ | ✓ |
| `XII.FMT.03` | iii | Verify Bernoulli's equation using interactive simulations or models. | 2.1.2 | Applying |  | ✓ |

#### Topic: Kinetic Theory of Gases  (266 min · 3%)

- **2.2.1 Kinetic Theory of Ideal Gas**  
  *Scope:* real and ideal gas, postulates and consequences of the kinetic theory of gases, pressure of an ideal gas, kinetic interpretation of temperature and final expression of average, rms and most probable speed of gas molecule.  
  *IG approach:* Instructional practices; derive kinetic gas equation; numerical problems.  
  *Also in IG learning experiences:* Maxwell's speed distribution curve (IG learning experience).

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.FMT.04` | iv | Differentiate between real and ideal gases using multimedia. | 2.2.1 | Analysing |  |  |
| `XII.FMT.05` | v | Explain kinetic theory of an ideal gas and solve numerical problems. | 2.2.1 | Applying |  | ✓ |

### Electricity and Magnetism

#### Topic: Electricity  (306 min · 4%)

- **3.1.1 Electric Charge**  
  *Scope:* basic properties, Coulomb's law, forces due to multiple charges.  
  *IG approach:* Instructional practices; Coulomb's law simulation worksheet.
- **3.1.2 Electric Field**  
  *Scope:* electric field and electric field intensity, physical significance of electric field, electric field lines and their properties, similarities and differences between electric field and gravitational field, electric flux, electric field strength due to a point charge, electric field strength between two charged parallel plates, charged particle moving in a uniform electric field.  
  *IG approach:* Instructional practices; field-line and parallel-plate simulations.

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.EM.01` | i | Explain the basic properties of electric charge and verify Coulomb's law using interactive simulations. | 3.1.1 | Applying |  | ✓ |
| `XII.EM.02` | ii | Relate electric field and electric flux and determine the strength of the charge of an object using relevant mathematical expressions. | 3.1.2 | Applying |  | ✓ |

#### Topic: Capacitors  (306 min · 4%)

- **3.2.1 Capacitors and Capacitance**  
  *Scope:* capacitors and capacitance, unit of capacitance, q = CV and effect of dielectric on capacitance, energy stored in capacitors (analytical and graphical), charging and discharging of capacitor (final expression and graphs).  
  *IG approach:* Instructional practices; capacitor simulation; construct a simple capacitor model.
- **3.2.2 Combination of Capacitors**  
  *Scope:* series and parallel combinations of capacitors.  
  *IG approach:* PROE (Predict, Reason, Observe, Explain).

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.EM.03` | iii | Construct a simple model of a capacitor to explain the working and its applications in electronic devices. | 3.2.1 | Creating |  | ✓ |
| `XII.EM.04` | iv | Explain the concept of combination of capacitors in series and parallel. | 3.2.2 | Understanding |  | ✓ |

#### Topic: Electromagnetic Induction  (612 min · 9%)

- **3.3.1 Magnetic Flux**  
  *Scope:* terms and final expressions of: magnetic circuit, permeability, magnetic field strength, magneto-motive force, reluctance, permeance, and flux in magnetic circuit.  
  *IG approach:* Teacher introduction / relevant resources.
- **3.3.2 Magnetic Moment of a Bar Magnet**  
  *Scope:* magnetic moment, tangent law, deflection magnetometer - Tan A position.  
  *IG approach:* Practical: deflection magnetometer in Tan-A position.
- **3.3.3 The Experiments of Faraday and Henry**  
  *Scope:* experiments of Faraday and Henry, Faraday's laws of electromagnetic induction, Lenz's law, energy conservation, and a.c. generator.  
  *IG approach:* 5E model (Engage, Explore, Explain, Elaborate, Evaluate).
- **3.3.4 Inductance**  
  *Scope:* inductance, self induction and mutual induction, coefficient of self induction, coefficient of mutual induction, transformer.  
  *IG approach:* Order of activity; derivations; transformer simulation; transformation ratio numericals.

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.EM.05` | v | Explain magnetic flux and terms related to it and solve numerical problems. | 3.3.1 | Applying |  | ✓ |
| `XII.EM.06` | vi | Define magnetic moment and compare the magnetic moment of two bar magnets to comprehend the magnetic field strength. | 3.3.2 | Analysing | ✓ | ✓ |
| `XII.EM.07` | vii | Design an experiment to verify Faraday's laws and relate Lenz's law to explain the working of a.c. generator. | 3.3.3 | Creating | ✓ |  |
| `XII.EM.08` | viii | Comprehend self and mutual induction to explain the concept of a transformer using simulations/multimedia. | 3.3.4 | Understanding |  | ✓ |

#### Topic: Electric Circuit  (805 min · 12%)

- **3.4.1 Classification of Substances**  
  *Scope:* classification of substances into conductors, insulators and semiconductors based on the energy bands, effect of temperature on the resistivity of conductors, semiconductors, thermistor and superconductors, potential applications of Room Temperature Superconductors (RTS).  
  *IG approach:* Flipped classroom; quiz and discussion.  
  *Also in IG learning experiences:* NTC and PTC thermistors (IG exemplar question).
- **3.4.2 Semiconductors**  
  *Scope:* types of semiconductor.  
  *IG approach:* 5E model; intrinsic/extrinsic, n-type and p-type.  
  *Also in IG learning experiences:* intrinsic and extrinsic semiconductors; n-type and p-type (IG learning experience).
- **3.4.3 DC Circuits**  
  *Scope:* d.c. circuits, Kirchhoff's laws, applications of potential divider in light sensor, temperature sensor, and audio volume controls.  
  *IG approach:* Activity-based learning; circuit construction kit simulation.
- **3.4.4 Electromotive Force of a Dry Cell**  
  *Scope:* electromotive force (emf) of a dry cell, null point, least count, resistance per unit length, slope from graph.  
  *IG approach:* Structured inquiry; potentiometer practical.
- **3.4.5 Specific Resistance**  
  *Scope:* principle of wheatstone bridge, specific resistance of resistor, least count.  
  *IG approach:* Order of activity; Wheatstone bridge practical.
- **3.4.6 AC Circuits**  
  *Scope:* a.c. circuit, root mean square (RMS) value of a.c., sinusoidal variation of voltage and current when ac voltage is applied to resistor, inductor and capacitor in an a.c. circuit (final expressions).  
  *IG approach:* Flipped classroom with driving question on RMS.  
  *Also in IG learning experiences:* resistance, reactance, impedance, phase angle (IG learning experience).
- **3.4.7 AC Voltage Applied to a Series LCR Circuit**  
  *Scope:* phasor diagram solution, analytical solution and resonance.  
  *IG approach:* Flipped classroom; resonance curve interpretation.

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.EM.09` | ix | Classify substances into conductors, insulators and semiconductors and evaluate their dependence on temperature. | 3.4.1 | Evaluating |  |  |
| `XII.EM.10` | x | Explain semiconductors and its importance in designing electronic devices. | 3.4.2 | Understanding |  |  |
| `XII.EM.11` | xi | Conduct an experiment to verify Kirchhoff's laws. | 3.4.3 | Applying | ✓ | ✓ |
| `XII.EM.12` | xii | Design a model based on the application of potential dividers using interactive simulations. | 3.4.3 | Creating |  | ✓ |
| `XII.EM.13` | xiii | Determine emf of a dry cell by changing the resistance. | 3.4.4 | Applying | ✓ | ✓ |
| `XII.EM.14` | xiv | Determine specific resistance of the given wire by changing the resistance of the resistance box. | 3.4.5 | Applying | ✓ | ✓ |
| `XII.EM.15` | xv | Explain the sinusoidal variation of voltage and current in an a.c. circuit using interactive simulation/multimedia. | 3.4.6 | Understanding |  | ✓ |
| `XII.EM.16` | xvi | Apply graphical and mathematical methods to analyse the maximum current in the LCR circuit. | 3.4.7 | Analysing |  | ✓ |

### Waves and Optics

#### Topic: Ray Optics  (649 min · 10%)

- **4.1.1 Reflection of Light by Spherical Mirrors**  
  *Scope:* reflection of light by spherical mirrors, cartesian sign convention, magnification, mirror equation (final expressions).  
  *IG approach:* POE (Predict, Observe, Explain); virtual experiments.  
  *Also in IG learning experiences:* aberrations of spherical mirrors (IG learning experience).
- **4.1.2 Refraction through Spherical Surfaces**  
  *Scope:* Cartesian sign convention, linear (transverse) magnification, refraction by lenses, converging and diverging lenses, derivation and application of lens equation (final expression), focal length of lens using u-v and displacement method (range and least count of optical bench, slope from graph), mathematical expression of magnification, power of a lens, focal length by combination of lenses.  
  *IG approach:* Guided inquiry; optical bench practicals.
- **4.1.3 Refractive Index**  
  *Scope:* law of refraction, real depth, apparent depth, traveling microscope, least count.  
  *IG approach:* Structured inquiry; travelling microscope practical.

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.WO.01` | i | Conduct an experiment to comprehend the behaviour of light when it strikes on spherical mirrors using interactive simulation and sketch ray diagrams. | 4.1.1 | Applying | ✓ | ✓ |
| `XII.WO.02` | ii | Verify the focal length of a given convex lens by u-v and displacement method. | 4.1.2 | Applying | ✓ | ✓ |
| `XII.WO.03` | iii | Determine the focal length of concave and convex lenses based on the concept of combination of lenses. | 4.1.2 | Applying | ✓ | ✓ |
| `XII.WO.04` | iv | Perform an experiment to compare the refractive index of two liquids and verify the law of refraction. | 4.1.3 | Analysing | ✓ | ✓ |

#### Topic: Wave Optics  (725 min · 9%)

- **4.2.1 Wavefront and Huygens' Principle**  
  *Scope:* wavefront, types of wavefronts and Huygens' principle.  
  *IG approach:* Instructional practices; Huygens simulation (printed as 4.1.1 in IG).
- **4.2.2 Refraction and Reflection of Plane Waves using Huygens' Principle**  
  *Scope:* derivation.  
  *IG approach:* Simulation-based verification (printed as 4.1.2 in IG).
- **4.2.3 Superposition of Waves**  
  *Scope:* superposition of waves, interference, coherence and incoherence, path difference and phase difference.  
  *IG approach:* POGIL (Process-Oriented Guided Inquiry Learning).
- **4.2.4 Interference and Young's Experiment**  
  *Scope:* conditions for constructive and destructive interference, locating the fringes and intensity in double-slit interference.  
  *IG approach:* POGIL; Young's double-slit simulation; fringe-width numericals.  
  *Also in IG learning experiences:* linear and angular positions of fringes, fringe width (IG learning experience).
- **4.2.5 Diffraction**  
  *Scope:* diffraction of light, diffraction by single slit: locating minima, use of diffraction in the spectral analysis of the light from the star.  
  *IG approach:* Order of activity; single-slit simulation; spectrograph research.  
  *Also in IG learning experiences:* spectrograph components and working (IG learning experience).

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.WO.05` | v | Verify Huygens' principle to comprehend refraction and reflection of plane waves using interactive simulations. | 4.2.1, 4.2.2 | Understanding |  |  |
| `XII.WO.06` | vi | Investigate Young's experiment to understand superposition and interference of light waves using interactive simulation. | 4.2.3, 4.2.4 | Analysing |  | ✓ |
| `XII.WO.07` | vii | Explain the phenomena of diffraction of light and compare its intensity to that of interference. | 4.2.5 | Analysing |  | ✓ |

#### Topic: Quantum Physics  (562 min · 8%)

- **4.3.1 Particle Nature of Light: The Photon**  
  *Scope:* energy of photon and unit conversion in eV, photon model of electromagnetic radiation.  
  *IG approach:* Instructional practices; videos; presentation.
- **4.3.2 Electron Emission and Photoelectric Effect**  
  *Scope:* electron emission, experimental study of photoelectric effect, significance of the terms work function, stopping potential and threshold frequency, wave theory of light.  
  *IG approach:* Instructional practices; photoelectric simulation.
- **4.3.3 Einstein's Photoelectric Equation: Energy Quantum of Radiation**  
  *Scope:* photoelectric equation, numerical problems, and conservation of energy.  
  *IG approach:* Photoelectric simulation; PowerPoint presentation.
- **4.3.4 Wave Nature of Matter**  
  *Scope:* de Broglie matter waves, mathematical expressions and numerical problems.  
  *IG approach:* EBA (Evidence Based Argumentation) debate: Is light a particle or a wave?.  
  *Also in IG learning experiences:* Heisenberg's uncertainty principle, de Broglie wavelength of an electron, electron diffraction (IG learning experience).

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.WO.08` | viii | Discuss the photon model of electromagnetic radiation and calculate energy of photon in eV. | 4.3.1, 4.3.2 | Applying |  | ✓ |
| `XII.WO.09` | ix | Verify Einstein's photoelectric effect to comprehend the particle nature of light using multimedia/simulation. | 4.3.2, 4.3.3 | Applying |  | ✓ |
| `XII.WO.10` | x | Explain the wave nature of light through the de Broglie wave equation using multimedia. | 4.3.4 | Understanding |  | ✓ |

### Atomic, Nuclear and Space Physics

#### Topic: Particle Physics  (522 min · 7%)

- **5.1.1 Standard Model**  
  *Scope:* elementary particles and four fundamental forces.  
  *IG approach:* Collaborative group presentations.
- **5.1.2 Particles and Antiparticles**  
  *Scope:* particles and antiparticles, annihilation of particles.  
  *IG approach:* Collaborative group presentations.
- **5.1.3 Classification of Particles**  
  *Scope:* classification of particles, quarks and leptons, properties of quarks, conservation laws regulating particles, change of quarks during beta+ and beta- decay.  
  *IG approach:* Collaborative group presentations.  
  *Also in IG learning experiences:* baryon number and strangeness (IG exemplar question).
- **5.1.4 Nanotechnology**  
  *Scope:* nanotechnology, applications and future implications.  
  *IG approach:* Scientific inquiry; animated/interactive presentation.  
  *Also in IG learning experiences:* carbon nanotubes; advantages of nanomaterials over bulk materials (IG reflective questions).

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.ANSP.01` | i | Explain the interior components of atoms, its behaviour and properties using interactive simulation or video. | 5.1.1, 5.1.3 | Understanding |  |  |
| `XII.ANSP.02` | ii | Describe particles and antiparticles to comprehend the concept of annihilation. | 5.1.2 | Understanding |  |  |
| `XII.ANSP.03` | iii | Explain the concept of nanotechnology and its real-world applications. | 5.1.4 | Understanding |  |  |

#### Topic: Nuclear Energy  (459 min · 7%)

- **5.2.1 Nuclear Energy**  
  *Scope:* nuclear energy, mass defect, binding energy, nuclear stability, thermal neutrons.  
  *IG approach:* 5E model.
- **5.2.2 Nuclear Fission: The Basic Process**  
  *Scope:* nuclear fission, nuclear chain reaction-controlled and uncontrolled, nuclear fission reactor, peaceful and destructive applications of nuclear fission.  
  *IG approach:* Instructional practices; fission simulation; recommendation task.
- **5.2.3 Nuclear Fusion: The Basic Process**  
  *Scope:* nuclear fusion, thermonuclear fusion in the Sun and other stars - CNO cycle and P-P cycle, controlled thermonuclear fusion, advantages of nuclear fusion as a potential energy source over nuclear fission.  
  *IG approach:* DBGL (Digital Based Game Learning); constructive debate.

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.ANSP.04` | iv | Explain mass defect and binding energy per nucleon and solve numerical problems. | 5.2.1 | Applying |  | ✓ |
| `XII.ANSP.05` | v | Interpret the curve of average binding energy per nucleon against nucleon number. | 5.2.1 | Analysing |  |  |
| `XII.ANSP.06` | vi | Evaluate the useful and destructive applications of nuclear fission. | 5.2.2 | Evaluating |  |  |
| `XII.ANSP.07` | vii | Compare and contrast nuclear fission and nuclear fusion. | 5.2.3 | Analysing |  |  |

#### Topic: Space Science and Technology: Satellite Development  (718 min · 8%)

- **5.3.1 Processes of Satellite Development**  
  *Scope:* mission definition review, preliminary design review, critical design review, safety review.  
  *IG approach:* Scientific inquiry; design a satellite mission.
- **5.3.2 Orbital Mechanics and Satellite Launch**  
  *Scope:* Kepler's laws, rocket technology.  
  *IG approach:* Digital game based learning; rocket launch/docking simulators.  
  *Also in IG learning experiences:* orbital speed and period of a satellite (IG exemplar question).
- **5.3.3 Satellite Subsystems and Satellite Tracking or Operation**  
  *Scope:* command and data-handling subsystem (CDHS), electrical power system (EPS), environmental control and life-support subsystem (ECLSS), onboard computer (OBC), structures and mechanics, satellite ground station, satellite tracking, satellite operation.  
  *IG approach:* Instructional practices; block diagrams; interactive presentation.
- **5.3.4 The Space Environment**  
  *Scope:* major hazards of the space environment, living and working in space.  
  *IG approach:* REI (Research, Evidence, Inference).  
  *Also in IG learning experiences:* hazards: gravity, atmosphere, radiation, vacuum, micrometeoroids and space junk, charged particles (IG learning experience).
- **5.3.5 Satellite Disposal**  
  *Scope:* end of life of a satellite, disposal, space debris management.  
  *IG approach:* REI (Research, Evidence, Inference).
- **5.3.6 Space Law and Regulations**  
  *Scope:* international space treaties, registration convention, frequency regulations, international governing bodies such as International Telecommunications Union (ITU), United Nations Office for Outer Space Affairs (UNOOSA).  
  *IG approach:* REI (Research, Evidence, Inference); group write-up.

| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |
|---|---|---|---|---|:-:|:-:|
| `XII.ANSP.08` | viii | Explain satellite development processes to develop a model of an artificial satellite. | 5.3.1 | Creating |  |  |
| `XII.ANSP.09` | ix | Explain the concept of rocket launch technology. | 5.3.2 | Understanding |  | ✓ |
| `XII.ANSP.10` | x | Explain earth segment subsystems to investigate transmission and reception of signals from satellites and describe space segment subsystems to comprehend how satellites are stationed in a particular orbit. | 5.3.3 | Understanding |  |  |
| `XII.ANSP.11` | xi | Identify the elements of the space environment to minimize space hazards. | 5.3.4, 5.3.5 | Remembering |  |  |
| `XII.ANSP.12` | xii | Study the space laws and regulations to create awareness that all nations have equal opportunity and accountability to explore space. | 5.3.6 | Understanding |  |  |

## 5. Skills and assessment framework the platform must use

**Assessment domains (SCF 15.3).** Every item and every mastery report is tagged to one of these:

- **SK: Scientific Knowledge**
- **WS: Working Scientifically**
- **SV: Scientific Values and Attitudes**

**Scientific Methods and Engineering Practices (SEPs).** Each learning outcome carries the SEPs listed against it in SCF Tables 16–20:

- Asking Questions and Defining Problems
- Developing and Using Models
- Planning and Carrying out Investigations
- Analysing and Interpreting Data
- Using Mathematics and Computational Thinking
- Constructing Explanations and Designing Solutions
- Engaging in Argument from Evidence
- Obtaining, Evaluating and Communicating Information

**Society and Technology strand:** Exploring Digital Resources; Using Physical Tools; Carrying out STEM Activities; Promoting Socio-cultural, Economic, Environment and Human Values.

**IG pedagogies the AI tutor will name and follow:** CER (Claim–Evidence–Reason), POE / PROE, 5E, POGIL, flipped classroom, structured and guided inquiry, guided discovery, EBA debate, REI (Research–Evidence–Inference), DBGL / digital game-based learning, collaborative learning, CLT (Collaborative Learning Technology) submissions, and CFA (Continuous Formative Assessment) with rubrics, checklists and observation forms.

## 6. Practical investigations (IG learning experiences)

| Practical | Sub-topic | Apparatus |
|---|---|---|
| Determine acceleration due to gravity using a simple pendulum | 1.1.4 System Executing Simple Harmonic Motion: Simple Pendulum | clamp stand, bob, vernier calliper, thread, ruler, stopclock |
| Determine the force constant of a spring (mass-spring system) | 1.1.3 Energy in Simple Harmonic Motion | spring, slotted weights, stopclock |
| Investigate resonance using a sonometer and tuning fork | 1.1.5 Forced Oscillations and Resonance | sonometer, tuning fork |
| Determine surface tension of water by capillary rise | 2.1.1 Surface Tension | travelling microscope, capillary tube |
| Design an experiment to measure viscosity of fluids | 2.1.2 Viscosity of Fluids | learner-designed |
| Compare magnetic moments of two bar magnets (deflection magnetometer, Tan-A position) | 3.3.2 Magnetic Moment of a Bar Magnet | deflection magnetometer, two bar magnets |
| Verify Faraday's laws of electromagnetic induction and Lenz's law | 3.3.3 The Experiments of Faraday and Henry | learner-designed: coil, magnet, galvanometer |
| Verify Kirchhoff's laws | 3.4.3 DC Circuits | circuit construction kit or instruments |
| Determine emf of a dry cell by changing the resistance (potentiometer) | 3.4.4 Electromotive Force of a Dry Cell | potentiometer, resistance box, ammeter, voltmeter, plug key, d.c. source, jockey, galvanometer, dry cell |
| Determine specific resistance of a wire (Wheatstone bridge principle) | 3.4.5 Specific Resistance | potentiometer, galvanometer, plug key, d.c. source, jockey, resistance box, screw gauge |
| Determine focal length of a concave mirror (virtual experiment) | 4.1.1 Reflection of Light by Spherical Mirrors | simulation |
| Verify focal length of a convex lens by u-v and displacement method | 4.1.2 Refraction through Spherical Surfaces | optical bench, convex lens |
| Determine focal length of a convex lens by combination; focal length of a concave lens | 4.1.2 Refraction through Spherical Surfaces | optical bench, lenses |
| Compare refractive index of two liquids (real and apparent depth) | 4.1.3 Refractive Index | travelling microscope, water, oil, pin, saw dust/thermocol |

## 7. Bloom profile of the 47 outcomes

| Bloom level | Outcomes |
|---|---:|
| Remembering | 1 |
| Understanding | 13 |
| Applying | 16 |
| Analysing | 9 |
| Evaluating | 3 |
| Creating | 5 |

Of the 47 outcomes, 31 include numerical problems and 14 are practical or investigation outcomes.

## 8. Scope guard-rails for question generation

To meet the strict alignment requirement, the generator and the AI tutor will **refuse or redirect** requests on these areas. They are Physics topics, but not Class XII topics in these two documents:

- **Class XI content** (IG Annexure 1 topics): Motion in a Straight Line, Motion in a Plane, Laws of Motion, Mechanical Properties of Solids, Work and Energy, Thermal Physics, Magnetic Fields, Class XI Electric Circuit, Class XI Ray Optics, Waves, Electromagnetic Waves, Atoms, Radioactive Decay, Space Applications. Class XII items may *use* these as prior knowledge, but must not *assess* them.
- **Not in either document's Class XII content:** stationary waves, gravitational field and potential, Wien's and Stefan–Boltzmann laws, standard candles, Hubble's law and the Big Bang, p-n junction diodes and transistors. Some of these appear in the newer KS5 2026–2030 drafts, which are deliberately excluded.
- Concepts that appear **only** in IG learning experiences or exemplar questions (listed per sub-topic above) are allowed, but get a `scope_note` and are capped at Understanding level. Examples: Reynolds number, Maxwell speed distribution, Heisenberg's uncertainty principle, NTC and PTC thermistors.

## 9. Source discrepancies found, and how they are resolved

| # | Issue | Resolution |
|---|---|---|
| 1 | IG numbers the Wave Optics sub-topics 4.1.1 and 4.1.2 under heading 4.2 (a duplicate of the Ray Optics numbering). | Renumbered 4.2.1 and 4.2.2, following the SCF Table 19 order. |
| 2 | SCF Class XII FMT competencies list 3 items; IG lists 4 (adds kinetic theory). SCF Table 17 still has kinetic-theory objectives iv and v. | Used IG's 4 competencies. |
| 3 | Sub-topic 2.1.1 scope includes *motion of bodies in a uniform gravitational field with fluid resistance*, which sits oddly under Surface Tension. | Kept as written (IG has a learning experience for it); items are tagged to 2.1.1. |
| 4 | WO objective viii (photon energy in eV) and ix (Einstein equation) share one IG lesson block (4.3.1–4.3.3). | Mapped viii to 4.3.1–4.3.2 and ix to 4.3.2–4.3.3. |
| 5 | Objective x (WO) says *wave nature of **light** through the de Broglie wave equation*; the de Broglie relation is the wave nature of **matter** (the sub-topic title). | Statement kept verbatim; items assess *wave nature of matter*, and the explanation notes the wording. |
| 6 | Some IG lessons have no exemplar questions (5.2.2 Nuclear Fission, 5.3.1 Satellite Development), or none that address part of their scope (3.3.1 magnetic-circuit terms). | AI-generated items fill these, marked `source = generated`, and teachers review them before students see them. |
| 7 | SCF lists *Society and Technology* activities (for example *design a model to trap light energy*) that IG does not develop. | Treated as performance-task prompts only, not quiz content. |
