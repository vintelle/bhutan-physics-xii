"""Build the Class XII Physics curriculum dataset from the two source documents.

Sources (only these two are used):
  SCF  = Science Curriculum Framework PP-XII (DSE/MoESD, 2nd ed. 2025; 1st ed. 2022),
         Section D Physics, 12.2 Key Stage 5, Class XII competencies + Tables 16-20 (pp. 255-265)
  IG   = Instructional Guide for Physics Classes XI & XII (DCPD/MoE, 1st ed. 2022),
         Class XII section pp. 78-157 and Annexure 2 (p. 159)
"""
import json, sys
from pathlib import Path

OUT = Path(sys.argv[1])

BLOOM = ["Remembering", "Understanding", "Applying", "Analysing", "Evaluating", "Creating"]

SEP = {  # Scientific Methods and Engineering Practices (SCF 15.3.2)
    "AQ": "Asking Questions and Defining Problems",
    "DM": "Developing and Using Models",
    "PI": "Planning and Carrying out Investigations",
    "AD": "Analysing and Interpreting Data",
    "MC": "Using Mathematics and Computational Thinking",
    "CE": "Constructing Explanations and Designing Solutions",
    "AE": "Engaging in Argument from Evidence",
    "OC": "Obtaining, Evaluating and Communicating Information",
}
SOCIETY_TECH = ["Exploring Digital Resources", "Using Physical Tools",
                "Carrying out STEM Activities",
                "Promoting Socio-cultural, Economic, Environment and Human Values"]
DOMAINS = {"SK": "Scientific Knowledge", "WS": "Working Scientifically",
           "SV": "Scientific Values and Attitudes"}

# ---------------------------------------------------------------- themes (Units)
themes = [
 dict(code="NM", order=1, name="Newtonian Mechanics", ig_pages="79-86", scf_table=16,
  competencies=[
   "Conduct an experiment to interpret the concept of simple harmonic motion graphically using interactive simulation and study its application in amusement parks, open space gyms, earthquake seismometers etc.",
   "Explain the concept of resonance through an experiment to create awareness about the effect of seismic waves on infrastructures and design a conceptual model of earthquake resistant infrastructures."]),
 dict(code="FMT", order=2, name="Fluid Mechanics and Thermal Physics", ig_pages="87-93", scf_table=17,
  competencies=[
   "Conduct an experiment on surface tension to comprehend the movement of liquids in capillary tubes and flow of liquids through porous surfaces and apply the concept to clean water.",
   "Design an experiment to measure the viscosity of the fluids to comprehend behaviour of flow of fluid.",
   "Validate Bernoulli's equation using interactive simulations or models to explore the various applications in sizing the pipe, flow sensors, ejectors, pitot tube, etc.",
   "Interpret gas expansion in terms of molecular motion that results in gas pressure due to molecular bombardment to understand the behaviour of gases."],
  notes="The 4th competency (kinetic theory) appears in the IG only; the SCF Class XII competency list stops at Bernoulli."),
 dict(code="EM", order=3, name="Electricity and Magnetism", ig_pages="94-119", scf_table=18,
  competencies=[
   "Examine force of attraction and repulsion between charges using any interactive simulations or apps to explain Coulomb's law.",
   "Interpret electric field, its strength and express electric flux for uniform and non-uniform electric field using simulations or apps to relate its applications in our life.",
   "Construct a model of capacitor to explain its function as energy storage used in electronic devices.",
   "Design an experiment to verify Faraday's laws of electromagnetic induction and apply the concept to design a working or conceptual model of a generator.",
   "Explain the concept of self and mutual inductance and design a model (conceptual or working) to comprehend the working mechanism of a transformer.",
   "Investigate the temperature dependence of resistivity of conductors, semiconductors, thermistors, and superconductors to identify appropriate materials for various applications.",
   "Explain the distribution of voltage and current within the circuit and solve circuit network problems using the concept of Kirchhoff's law.",
   "Explain a.c. circuit using interactive simulation or apps to describe the occurrence of electrical resonance."]),
 dict(code="WO", order=4, name="Waves and Optics", ig_pages="120-138", scf_table=19,
  competencies=[
   "Conduct an experiment to study the behaviour of light when it strikes on different optical media and use the concept to design optical instruments.",
   "Investigate and sketch image formation for different optical media using interactive simulation to comprehend the significance of optical media in optical instruments.",
   "Verify Huygens' principle using appropriate light sources to explain the wave nature of light.",
   "Illustrate interference and diffraction graphically and use the concept to study the stellar spectra and relate the concept in the field of optical communication.",
   "Explain the particle nature of light and the photoelectric effect (Einstein's photoelectric equation) using interactive simulations/multimedia to relate its working in solar panel."]),
 dict(code="ANSP", order=5, name="Atomic, Nuclear and Space Physics", ig_pages="139-157", scf_table=20,
  competencies=[
   "Examine the interior components of atoms and explain the behaviour and properties of each component to explain the standard model.",
   "Study the concept of nanotechnology and recognise its significance and influence in our society.",
   "Study nuclear energy as an alternative source of energy in future to assess the pros and cons of nuclear energy.",
   "Identify the rocket parameters using interactive simulation to comprehend the process of rocket launch and satellite deployment.",
   "Examine the methods of satellite disposal and suggest ways to minimize the accumulation of defunct satellites in space."]),
]

# ---------------------------------------------------------------- topics (Chapters) - IG Annexure 2
topics = [
 # code, theme, name, minutes, weighting %
 ("NM.1",   "NM",  "Oscillations", 864, 12),
 ("FMT.1",  "FMT", "Fluid Mechanics", 406, 7),
 ("FMT.2",  "FMT", "Kinetic Theory of Gases", 266, 3),
 ("EM.1",   "EM",  "Electricity", 306, 4),
 ("EM.2",   "EM",  "Capacitors", 306, 4),
 ("EM.3",   "EM",  "Electromagnetic Induction", 612, 9),
 ("EM.4",   "EM",  "Electric Circuit", 805, 12),
 ("WO.1",   "WO",  "Ray Optics", 649, 10),
 ("WO.2",   "WO",  "Wave Optics", 725, 9),
 ("WO.3",   "WO",  "Quantum Physics", 562, 8),
 ("ANSP.1", "ANSP","Particle Physics", 522, 7),
 ("ANSP.2", "ANSP","Nuclear Energy", 459, 7),
 ("ANSP.3", "ANSP","Space Science and Technology: Satellite Development", 718, 8),
]

# ---------------------------------------------------------------- sub-topics (Concepts) - IG headings + scope
# number, topic, title, scope, IG pedagogy, IG exemplar question count, IG-only extra concepts
subtopics = [
 ("1.1.1","NM.1","Periodic and Oscillatory Motions","periodic and oscillatory motions, simple harmonic motion, time period and frequency of periodic motion and displacement of periodic motion and its calculation, relation between simple harmonic motion and uniform circular motion","Instructional practices with video + interactive simulation; learners share via CLT",0,[]),
 ("1.1.2","NM.1","Velocity and Acceleration in Simple Harmonic Motion","velocity and acceleration in simple harmonic motion","Instructional practices with interactive simulation (ophysics SHM)",5,[]),
 ("1.1.3","NM.1","Energy in Simple Harmonic Motion","energy in Simple Harmonic Motion (SHM), Hooke's law, slope and intercept from graph, least count of stopclock","CER model (Claim, Evidence, Reason); mass-spring system or simulation",3,[]),
 ("1.1.4","NM.1","System Executing Simple Harmonic Motion: Simple Pendulum","simple pendulum, acceleration due to gravity, time period, least count of vernier caliper and stopclock, conceptual relationship between effective length and time period, slope from graph","Structured inquiry (practical or online simulation)",3,[]),
 ("1.1.5","NM.1","Forced Oscillations and Resonance","free, forced oscillation and resonance, condition for resonance in forced oscillations, frequency of tuning fork, tension of wire, resonance, sonometer","Instructional practices; sonometer and tuning fork; design earthquake-resistant model",3,[]),
 ("2.1.1","FMT.1","Surface Tension","motion of bodies in a uniform gravitational field with fluid resistance, graphs and only final expressions, molecular theory for surface tension, applications of surface tension, cause and effect of surface tension in liquids, angle of contact, movement of liquids in capillary tubes using ideas of surface tension, travelling microscope, least count of travelling microscope, flow of liquids through porous media using capillary action","Instructional practices; capillary-rise practical; constructive debate",5,[]),
 ("2.1.2","FMT.1","Viscosity of Fluids","viscosity of fluids, streamline, laminar and turbulent flow, equation of continuity - principle of continuity in any steady state process, Bernoulli's principle and its application","Guided discovery learning; Bernoulli simulation (ophysics fl2)",5,["Reynolds number (appears in IG exemplar question only)"]),
 ("2.2.1","FMT.2","Kinetic Theory of Ideal Gas","real and ideal gas, postulates and consequences of the kinetic theory of gases, pressure of an ideal gas, kinetic interpretation of temperature and final expression of average, rms and most probable speed of gas molecule","Instructional practices; derive kinetic gas equation; numerical problems",4,["Maxwell's speed distribution curve (IG learning experience)"]),
 ("3.1.1","EM.1","Electric Charge","basic properties, Coulomb's law, forces due to multiple charges","Instructional practices; Coulomb's law simulation worksheet",3,[]),
 ("3.1.2","EM.1","Electric Field","electric field and electric field intensity, physical significance of electric field, electric field lines and their properties, similarities and differences between electric field and gravitational field, electric flux, electric field strength due to a point charge, electric field strength between two charged parallel plates, charged particle moving in a uniform electric field","Instructional practices; field-line and parallel-plate simulations",2,[]),
 ("3.2.1","EM.2","Capacitors and Capacitance","capacitors and capacitance, unit of capacitance, q = CV and effect of dielectric on capacitance, energy stored in capacitors (analytical and graphical), charging and discharging of capacitor (final expression and graphs)","Instructional practices; capacitor simulation; construct a simple capacitor model",4,[]),
 ("3.2.2","EM.2","Combination of Capacitors","series and parallel combinations of capacitors","PROE (Predict, Reason, Observe, Explain)",3,[]),
 ("3.3.1","EM.3","Magnetic Flux","terms and final expressions of: magnetic circuit, permeability, magnetic field strength, magneto-motive force, reluctance, permeance, and flux in magnetic circuit","Teacher introduction / relevant resources",0,[]),
 ("3.3.2","EM.3","Magnetic Moment of a Bar Magnet","magnetic moment, tangent law, deflection magnetometer - Tan A position","Practical: deflection magnetometer in Tan-A position",0,[]),
 ("3.3.3","EM.3","The Experiments of Faraday and Henry","experiments of Faraday and Henry, Faraday's laws of electromagnetic induction, Lenz's law, energy conservation, and a.c. generator","5E model (Engage, Explore, Explain, Elaborate, Evaluate)",5,[]),
 ("3.3.4","EM.3","Inductance","inductance, self induction and mutual induction, coefficient of self induction, coefficient of mutual induction, transformer","Order of activity; derivations; transformer simulation; transformation ratio numericals",4,[]),
 ("3.4.1","EM.4","Classification of Substances","classification of substances into conductors, insulators and semiconductors based on the energy bands, effect of temperature on the resistivity of conductors, semiconductors, thermistor and superconductors, potential applications of Room Temperature Superconductors (RTS)","Flipped classroom; quiz and discussion",5,["NTC and PTC thermistors (IG exemplar question)"]),
 ("3.4.2","EM.4","Semiconductors","types of semiconductor","5E model; intrinsic/extrinsic, n-type and p-type",4,["intrinsic and extrinsic semiconductors; n-type and p-type (IG learning experience)"]),
 ("3.4.3","EM.4","DC Circuits","d.c. circuits, Kirchhoff's laws, applications of potential divider in light sensor, temperature sensor, and audio volume controls","Activity-based learning; circuit construction kit simulation",4,[]),
 ("3.4.4","EM.4","Electromotive Force of a Dry Cell","electromotive force (emf) of a dry cell, null point, least count, resistance per unit length, slope from graph","Structured inquiry; potentiometer practical",3,[]),
 ("3.4.5","EM.4","Specific Resistance","principle of wheatstone bridge, specific resistance of resistor, least count","Order of activity; Wheatstone bridge practical",3,[]),
 ("3.4.6","EM.4","AC Circuits","a.c. circuit, root mean square (RMS) value of a.c., sinusoidal variation of voltage and current when ac voltage is applied to resistor, inductor and capacitor in an a.c. circuit (final expressions)","Flipped classroom with driving question on RMS",0,["resistance, reactance, impedance, phase angle (IG learning experience)"]),
 ("3.4.7","EM.4","AC Voltage Applied to a Series LCR Circuit","phasor diagram solution, analytical solution and resonance","Flipped classroom; resonance curve interpretation",5,[]),
 ("4.1.1","WO.1","Reflection of Light by Spherical Mirrors","reflection of light by spherical mirrors, cartesian sign convention, magnification, mirror equation (final expressions)","POE (Predict, Observe, Explain); virtual experiments",5,["aberrations of spherical mirrors (IG learning experience)"]),
 ("4.1.2","WO.1","Refraction through Spherical Surfaces","Cartesian sign convention, linear (transverse) magnification, refraction by lenses, converging and diverging lenses, derivation and application of lens equation (final expression), focal length of lens using u-v and displacement method (range and least count of optical bench, slope from graph), mathematical expression of magnification, power of a lens, focal length by combination of lenses","Guided inquiry; optical bench practicals",5,[]),
 ("4.1.3","WO.1","Refractive Index","law of refraction, real depth, apparent depth, traveling microscope, least count","Structured inquiry; travelling microscope practical",3,[]),
 ("4.2.1","WO.2","Wavefront and Huygens' Principle","wavefront, types of wavefronts and Huygens' principle","Instructional practices; Huygens simulation (printed as 4.1.1 in IG)",0,[]),
 ("4.2.2","WO.2","Refraction and Reflection of Plane Waves using Huygens' Principle","derivation","Simulation-based verification (printed as 4.1.2 in IG)",5,[]),
 ("4.2.3","WO.2","Superposition of Waves","superposition of waves, interference, coherence and incoherence, path difference and phase difference","POGIL (Process-Oriented Guided Inquiry Learning)",0,[]),
 ("4.2.4","WO.2","Interference and Young's Experiment","conditions for constructive and destructive interference, locating the fringes and intensity in double-slit interference","POGIL; Young's double-slit simulation; fringe-width numericals",4,["linear and angular positions of fringes, fringe width (IG learning experience)"]),
 ("4.2.5","WO.2","Diffraction","diffraction of light, diffraction by single slit: locating minima, use of diffraction in the spectral analysis of the light from the star","Order of activity; single-slit simulation; spectrograph research",4,["spectrograph components and working (IG learning experience)"]),
 ("4.3.1","WO.3","Particle Nature of Light: The Photon","energy of photon and unit conversion in eV, photon model of electromagnetic radiation","Instructional practices; videos; presentation",0,[]),
 ("4.3.2","WO.3","Electron Emission and Photoelectric Effect","electron emission, experimental study of photoelectric effect, significance of the terms work function, stopping potential and threshold frequency, wave theory of light","Instructional practices; photoelectric simulation",0,[]),
 ("4.3.3","WO.3","Einstein's Photoelectric Equation: Energy Quantum of Radiation","photoelectric equation, numerical problems, and conservation of energy","Photoelectric simulation; PowerPoint presentation",4,[]),
 ("4.3.4","WO.3","Wave Nature of Matter","de Broglie matter waves, mathematical expressions and numerical problems","EBA (Evidence Based Argumentation) debate: Is light a particle or a wave?",3,["Heisenberg's uncertainty principle, de Broglie wavelength of an electron, electron diffraction (IG learning experience)"]),
 ("5.1.1","ANSP.1","Standard Model","elementary particles and four fundamental forces","Collaborative group presentations",0,[]),
 ("5.1.2","ANSP.1","Particles and Antiparticles","particles and antiparticles, annihilation of particles","Collaborative group presentations",0,[]),
 ("5.1.3","ANSP.1","Classification of Particles","classification of particles, quarks and leptons, properties of quarks, conservation laws regulating particles, change of quarks during beta+ and beta- decay","Collaborative group presentations",5,["baryon number and strangeness (IG exemplar question)"]),
 ("5.1.4","ANSP.1","Nanotechnology","nanotechnology, applications and future implications","Scientific inquiry; animated/interactive presentation",5,["carbon nanotubes; advantages of nanomaterials over bulk materials (IG reflective questions)"]),
 ("5.2.1","ANSP.2","Nuclear Energy","nuclear energy, mass defect, binding energy, nuclear stability, thermal neutrons","5E model",3,[]),
 ("5.2.2","ANSP.2","Nuclear Fission: The Basic Process","nuclear fission, nuclear chain reaction-controlled and uncontrolled, nuclear fission reactor, peaceful and destructive applications of nuclear fission","Instructional practices; fission simulation; recommendation task",0,[]),
 ("5.2.3","ANSP.2","Nuclear Fusion: The Basic Process","nuclear fusion, thermonuclear fusion in the Sun and other stars - CNO cycle and P-P cycle, controlled thermonuclear fusion, advantages of nuclear fusion as a potential energy source over nuclear fission","DBGL (Digital Based Game Learning); constructive debate",2,[]),
 ("5.3.1","ANSP.3","Processes of Satellite Development","mission definition review, preliminary design review, critical design review, safety review","Scientific inquiry; design a satellite mission",0,[]),
 ("5.3.2","ANSP.3","Orbital Mechanics and Satellite Launch","Kepler's laws, rocket technology","Digital game based learning; rocket launch/docking simulators",3,["orbital speed and period of a satellite (IG exemplar question)"]),
 ("5.3.3","ANSP.3","Satellite Subsystems and Satellite Tracking or Operation","command and data-handling subsystem (CDHS), electrical power system (EPS), environmental control and life-support subsystem (ECLSS), onboard computer (OBC), structures and mechanics, satellite ground station, satellite tracking, satellite operation","Instructional practices; block diagrams; interactive presentation",2,[]),
 ("5.3.4","ANSP.3","The Space Environment","major hazards of the space environment, living and working in space","REI (Research, Evidence, Inference)",0,["hazards: gravity, atmosphere, radiation, vacuum, micrometeoroids and space junk, charged particles (IG learning experience)"]),
 ("5.3.5","ANSP.3","Satellite Disposal","end of life of a satellite, disposal, space debris management","REI (Research, Evidence, Inference)",2,[]),
 ("5.3.6","ANSP.3","Space Law and Regulations","international space treaties, registration convention, frequency regulations, international governing bodies such as International Telecommunications Union (ITU), United Nations Office for Outer Space Affairs (UNOOSA)","REI (Research, Evidence, Inference); group write-up",1,[]),
]

# ---------------------------------------------------------------- learning objectives (Learning Outcomes)
# roman, theme, statement, subtopics, bloom, practical, numerical, SEPs (from SCF Process/Essential Skills column)
los = [
 ("i","NM","Explain periodic motion and oscillatory motion and relate with Simple Harmonic Motion (SHM) graphically using interactive simulation.",["1.1.1","1.1.2"],"Understanding",False,True,["AQ","AD","DM"]),
 ("ii","NM","Use algebraic or computational representations to claim that total energy in SHM is conserved.",["1.1.3"],"Evaluating",True,True,["MC","AE","DM"]),
 ("iii","NM","Determine the value of acceleration due to gravity of a place to provide scientific evidence that a simple pendulum executes SHM.",["1.1.4"],"Applying",True,True,["PI","AD","AE"]),
 ("iv","NM","Experimentally investigate the concept of resonance using a tuning fork.",["1.1.5"],"Analysing",True,False,["PI","CE","OC","DM"]),
 ("i","FMT","Carry out an experiment on surface tension of liquid from capillary rise method to comprehend its importance in everyday phenomena.",["2.1.1"],"Applying",True,True,["AQ","PI","DM","MC","AE"]),
 ("ii","FMT","Design an experiment to measure the viscosity of the fluids and explain its applications in our daily life.",["2.1.2"],"Creating",True,True,["AQ","AD","CE"]),
 ("iii","FMT","Verify Bernoulli's equation using interactive simulations or models.",["2.1.2"],"Applying",False,True,["AQ","MC"]),
 ("iv","FMT","Differentiate between real and ideal gases using multimedia.",["2.2.1"],"Analysing",False,False,["OC"]),
 ("v","FMT","Explain kinetic theory of an ideal gas and solve numerical problems.",["2.2.1"],"Applying",False,True,["MC","OC"]),
 ("i","EM","Explain the basic properties of electric charge and verify Coulomb's law using interactive simulations.",["3.1.1"],"Applying",False,True,["AQ","MC"]),
 ("ii","EM","Relate electric field and electric flux and determine the strength of the charge of an object using relevant mathematical expressions.",["3.1.2"],"Applying",False,True,["PI","MC"]),
 ("iii","EM","Construct a simple model of a capacitor to explain the working and its applications in electronic devices.",["3.2.1"],"Creating",False,True,["CE","DM"]),
 ("iv","EM","Explain the concept of combination of capacitors in series and parallel.",["3.2.2"],"Understanding",False,True,["MC"]),
 ("v","EM","Explain magnetic flux and terms related to it and solve numerical problems.",["3.3.1"],"Applying",False,True,["MC"]),
 ("vi","EM","Define magnetic moment and compare the magnetic moment of two bar magnets to comprehend the magnetic field strength.",["3.3.2"],"Analysing",True,True,["PI","AD"]),
 ("vii","EM","Design an experiment to verify Faraday's laws and relate Lenz's law to explain the working of a.c. generator.",["3.3.3"],"Creating",True,False,["PI","DM","AE"]),
 ("viii","EM","Comprehend self and mutual induction to explain the concept of a transformer using simulations/multimedia.",["3.3.4"],"Understanding",False,True,["MC","CE"]),
 ("ix","EM","Classify substances into conductors, insulators and semiconductors and evaluate their dependence on temperature.",["3.4.1"],"Evaluating",False,False,["AD","OC"]),
 ("x","EM","Explain semiconductors and its importance in designing electronic devices.",["3.4.2"],"Understanding",False,False,["CE","AE"]),
 ("xi","EM","Conduct an experiment to verify Kirchhoff's laws.",["3.4.3"],"Applying",True,True,["PI","MC"]),
 ("xii","EM","Design a model based on the application of potential dividers using interactive simulations.",["3.4.3"],"Creating",False,True,["DM","AD"]),
 ("xiii","EM","Determine emf of a dry cell by changing the resistance.",["3.4.4"],"Applying",True,True,["PI","AD","MC"]),
 ("xiv","EM","Determine specific resistance of the given wire by changing the resistance of the resistance box.",["3.4.5"],"Applying",True,True,["PI","MC"]),
 ("xv","EM","Explain the sinusoidal variation of voltage and current in an a.c. circuit using interactive simulation/multimedia.",["3.4.6"],"Understanding",False,True,["DM","MC"]),
 ("xvi","EM","Apply graphical and mathematical methods to analyse the maximum current in the LCR circuit.",["3.4.7"],"Analysing",False,True,["MC","AE"]),
 ("i","WO","Conduct an experiment to comprehend the behaviour of light when it strikes on spherical mirrors using interactive simulation and sketch ray diagrams.",["4.1.1"],"Applying",True,True,["AQ","PI","DM","AD"]),
 ("ii","WO","Verify the focal length of a given convex lens by u-v and displacement method.",["4.1.2"],"Applying",True,True,["PI","DM","AD","MC"]),
 ("iii","WO","Determine the focal length of concave and convex lenses based on the concept of combination of lenses.",["4.1.2"],"Applying",True,True,["AQ","DM","MC"]),
 ("iv","WO","Perform an experiment to compare the refractive index of two liquids and verify the law of refraction.",["4.1.3"],"Analysing",True,True,["AQ","PI","AD"]),
 ("v","WO","Verify Huygens' principle to comprehend refraction and reflection of plane waves using interactive simulations.",["4.2.1","4.2.2"],"Understanding",False,False,["DM","MC"]),
 ("vi","WO","Investigate Young's experiment to understand superposition and interference of light waves using interactive simulation.",["4.2.3","4.2.4"],"Analysing",False,True,["DM","MC"]),
 ("vii","WO","Explain the phenomena of diffraction of light and compare its intensity to that of interference.",["4.2.5"],"Analysing",False,True,["AQ","MC"]),
 ("viii","WO","Discuss the photon model of electromagnetic radiation and calculate energy of photon in eV.",["4.3.1","4.3.2"],"Applying",False,True,["MC","CE","AE"]),
 ("ix","WO","Verify Einstein's photoelectric effect to comprehend the particle nature of light using multimedia/simulation.",["4.3.2","4.3.3"],"Applying",False,True,["PI","DM","MC"]),
 ("x","WO","Explain the wave nature of light through the de Broglie wave equation using multimedia.",["4.3.4"],"Understanding",False,True,["MC","CE","AE"]),
 ("i","ANSP","Explain the interior components of atoms, its behaviour and properties using interactive simulation or video.",["5.1.1","5.1.3"],"Understanding",False,False,["OC"]),
 ("ii","ANSP","Describe particles and antiparticles to comprehend the concept of annihilation.",["5.1.2"],"Understanding",False,False,["OC"]),
 ("iii","ANSP","Explain the concept of nanotechnology and its real-world applications.",["5.1.4"],"Understanding",False,False,["AQ","PI"]),
 ("iv","ANSP","Explain mass defect and binding energy per nucleon and solve numerical problems.",["5.2.1"],"Applying",False,True,["MC"]),
 ("v","ANSP","Interpret the curve of average binding energy per nucleon against nucleon number.",["5.2.1"],"Analysing",False,False,["AD"]),
 ("vi","ANSP","Evaluate the useful and destructive applications of nuclear fission.",["5.2.2"],"Evaluating",False,False,["AD","CE","AE"]),
 ("vii","ANSP","Compare and contrast nuclear fission and nuclear fusion.",["5.2.3"],"Analysing",False,False,["AE"]),
 ("viii","ANSP","Explain satellite development processes to develop a model of an artificial satellite.",["5.3.1"],"Creating",False,False,["AQ","DM"]),
 ("ix","ANSP","Explain the concept of rocket launch technology.",["5.3.2"],"Understanding",False,True,["DM"]),
 ("x","ANSP","Explain earth segment subsystems to investigate transmission and reception of signals from satellites and describe space segment subsystems to comprehend how satellites are stationed in a particular orbit.",["5.3.3"],"Understanding",False,False,["AQ","PI"]),
 ("xi","ANSP","Identify the elements of the space environment to minimize space hazards.",["5.3.4","5.3.5"],"Remembering",False,False,["PI"]),
 ("xii","ANSP","Study the space laws and regulations to create awareness that all nations have equal opportunity and accountability to explore space.",["5.3.6"],"Understanding",False,False,["AD"]),
]

# KS5 competency-based standards (end of Key Stage 5) relevant to Class XII content (SCF 12.2)
ks5_standards = {
 "NM": ["Interpret oscillatory motion using graphs and equations to solve numerical problems of oscillatory motion."],
 "FMT": ["Investigate the properties and energy possessed by a fluid to comprehend the practical applications of fluid mechanics."],
 "EM": ["Experiment and describe the net effect of interaction of charges (Coulomb's Law) and net effect of voltage and current through complex circuits (Kirchhoff's law and principle of wheatstone bridge).",
        "Investigate Faraday's and Lenz's law to understand the induced e.m.f in simple generators, self and mutual inductance to describe the working of transformers.",
        "Compare the temperature dependence of resistivity of conductors, semiconductors, thermistors, and superconductors to apply the concept of conservation of energy in electrical devices.",
        "Study semiconductors to understand its application in sensors and thin film technology.",
        "Examine a.c circuit, explain sinusoidal variation of voltage and current, and solve numerical problems.",
        "Experiment and examine the behaviour of a capacitor during charging and discharging through a capacitor to determine the effective capacitance when capacitors are connected in series or parallel and apply the concept in electronics."],
 "WO": ["Develop conceptual understanding of formation of images by different optical systems, total internal reflection and its application in medical technology, telecommunications and natural phenomena and verify these concepts through simulations or practical experiments.",
        "Describe the concept of interference and diffraction using Huygens' principle and superposition of waves to understand its applications in various fields."],
 "ANSP": ["Explore applications of atomic and nuclear phenomena such as nanotechnology, radiation therapy, diagnostic imaging and nuclear power (purpose).",
          "Explain the concept of photoelectric effect simulation to comprehend the particle nature of light and its application in the solar industry.",
          "Explain the principle of stationing/launching satellites and Kepler's laws of planetary motion to describe the motion of planets and satellites.",
          "Assess the emerging satellite technologies and rocketry to make best use of their applications in the area of remote sensing.",
          "Identify the rocket parameters using interactive simulation to deploy satellites for the particular purposes undergoing different stages of rocket launch.",
          "Suggest ways to remove satellite debris in the space to reduce hazards of the space environment inline with the GNH philosophy."],
}

practicals = [
 ("Determine acceleration due to gravity using a simple pendulum", "1.1.4", "clamp stand, bob, vernier calliper, thread, ruler, stopclock"),
 ("Determine the force constant of a spring (mass-spring system)", "1.1.3", "spring, slotted weights, stopclock"),
 ("Investigate resonance using a sonometer and tuning fork", "1.1.5", "sonometer, tuning fork"),
 ("Determine surface tension of water by capillary rise", "2.1.1", "travelling microscope, capillary tube"),
 ("Design an experiment to measure viscosity of fluids", "2.1.2", "learner-designed"),
 ("Compare magnetic moments of two bar magnets (deflection magnetometer, Tan-A position)", "3.3.2", "deflection magnetometer, two bar magnets"),
 ("Verify Faraday's laws of electromagnetic induction and Lenz's law", "3.3.3", "learner-designed: coil, magnet, galvanometer"),
 ("Verify Kirchhoff's laws", "3.4.3", "circuit construction kit or instruments"),
 ("Determine emf of a dry cell by changing the resistance (potentiometer)", "3.4.4", "potentiometer, resistance box, ammeter, voltmeter, plug key, d.c. source, jockey, galvanometer, dry cell"),
 ("Determine specific resistance of a wire (Wheatstone bridge principle)", "3.4.5", "potentiometer, galvanometer, plug key, d.c. source, jockey, resistance box, screw gauge"),
 ("Determine focal length of a concave mirror (virtual experiment)", "4.1.1", "simulation"),
 ("Verify focal length of a convex lens by u-v and displacement method", "4.1.2", "optical bench, convex lens"),
 ("Determine focal length of a convex lens by combination; focal length of a concave lens", "4.1.2", "optical bench, lenses"),
 ("Compare refractive index of two liquids (real and apparent depth)", "4.1.3", "travelling microscope, water, oil, pin, saw dust/thermocol"),
]

# ------------------------------------------------------------------ assemble
theme_name = {t["code"]: t["name"] for t in themes}
sub_by_num = {s[0]: s for s in subtopics}
counter = {}
lo_out = []
for roman, th, stmt, subs, bloom, prac, num, seps in los:
    counter[th] = counter.get(th, 0) + 1
    assert bloom in BLOOM and all(s in sub_by_num for s in subs)
    lo_out.append(dict(
        code=f"XII.{th}.{counter[th]:02d}", source_ref=f"SCF Table {next(t['scf_table'] for t in themes if t['code']==th)} / IG obj. {roman}",
        roman=roman, theme=th, topic=sub_by_num[subs[0]][1], subtopics=subs, statement=stmt,
        bloom_primary=bloom, practical=prac, numerical=num,
        sep=[SEP[s] for s in seps]))

data = dict(
  meta=dict(class_level="XII", subject="Physics",
    sources=[dict(id="SCF", title="National School Curriculum: Science Curriculum Framework, Classes PP-XII", publisher="Centre for School Curriculum Development, DSE, MoESD", edition="First Edition 2022; Second Edition 2025", pages="Physics Section D, 12.2 Key Stage 5 (pp. 244-245), Class XII competency (pp. 255-256), Tables 16-20 (pp. 257-265), Assessment 15.3"),
             dict(id="IG", title="National School Curriculum: Instructional Guide for Physics, Classes XI & XII", publisher="Department of Curriculum and Professional Development, MoE", edition="First Edition 2022", pages="Class XII pp. 78-157; Annexure 2 p. 159")],
    hierarchy="Theme (Unit) > Topic (Chapter) > Sub-topic (Concept, with Scope) > Learning Objective (Learning Outcome) > Assessment Items",
    total_minutes=7200, bloom_levels=BLOOM, assessment_domains=DOMAINS,
    scientific_methods_engineering_practices=list(SEP.values()), society_and_technology=SOCIETY_TECH),
  themes=[dict(**t, ks5_standards=ks5_standards[t["code"]],
               weighting=sum(w for c,th,n,m,w in topics if th==t["code"]),
               minutes=sum(m for c,th,n,m,w in topics if th==t["code"])) for t in themes],
  topics=[dict(code=c, theme=th, name=n, minutes=m, weighting=w) for c,th,n,m,w in topics],
  subtopics=[dict(number=n, topic=tp, title=ti, scope=sc, ig_pedagogy=pe, ig_exemplar_questions=q, ig_extra_concepts=ex) for n,tp,ti,sc,pe,q,ex in subtopics],
  learning_objectives=lo_out,
  practicals=[dict(title=a, subtopic=b, apparatus=c) for a,b,c in practicals],
)
assert sum(t["weighting"] for t in data["themes"]) == 100
assert sum(t["minutes"] for t in data["themes"]) == 7200
OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False))
print("themes", len(themes), "topics", len(topics), "subtopics", len(subtopics), "LOs", len(lo_out),
      "competencies", sum(len(t["competencies"]) for t in themes), "practicals", len(practicals))
from collections import Counter
print(Counter(l["bloom_primary"] for l in lo_out))
print("numerical", sum(l["numerical"] for l in lo_out), "practical", sum(l["practical"] for l in lo_out))
