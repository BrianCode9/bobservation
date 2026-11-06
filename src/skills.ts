// skills.ts — skill dictionary, question bank, and matching helpers

export const SKILL_DICT: string[] = [
  // Languages
  'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'C', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'R', 'MATLAB', 'Scala',
  // Web
  'React', 'Angular', 'Vue', 'Node.js', 'HTML', 'CSS', 'REST', 'GraphQL', 'Next.js',
  // Data / ML
  'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'machine learning', 'deep learning', 'TensorFlow', 'PyTorch', 'data analysis', 'pandas', 'NumPy', 'Jupyter',
  // Cloud / DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Linux', 'Git', 'CI/CD', 'Terraform', 'Bash',
  // Tools
  'Excel', 'Tableau', 'Power BI', 'Figma', 'Jira', 'Agile', 'Scrum',
  // Soft skills
  'communication', 'teamwork', 'leadership', 'problem solving', 'time management', 'collaboration',
  // CS fundamentals (new from bank)
  'data structures', 'algorithms', 'object-oriented programming', 'operating systems', 'networking',
  'databases', 'system design', 'distributed systems', 'security', 'cybersecurity', 'web development',
  // EE / Hardware fundamentals
  'circuit analysis', 'electrical engineering', 'circuits', "Ohm's law", 'KCL', 'KVL', 'RLC', 'filters', 'op-amp', 'opamp', 'analog', 'mixed-signal',
  // Passive components
  'resistors', 'capacitors', 'inductors', 'parasitics', 'decoupling',
  // Semiconductor devices
  'diodes', 'BJT', 'MOSFET', 'CMOS', 'semiconductor', 'semiconductors', 'transistors', 'device physics', 'doping',
  // Digital logic / VLSI
  'digital logic', 'digital design', 'boolean algebra', 'computer engineering',
  'VLSI', 'ASIC', 'chip design', 'static timing analysis', 'physical design',
  // HDL
  'Verilog', 'SystemVerilog', 'VHDL', 'RTL', 'FPGA', 'hdl',
  // Computer architecture
  'computer architecture', 'RISC-V', 'CPU', 'ARM', 'assembly',
  // Analog / mixed-signal
  'amplifiers', 'PLL', 'ADC', 'DAC', 'signal integrity', 'power integrity',
  // Power electronics
  'buck converter', 'boost converter', 'LDO', 'charge pump', 'PWM', 'power supply',
  'switching regulator', 'power architecture', 'power sequencing', 'multiphase',
  'power electronics', 'power systems', 'power', 'motors',
  // Batteries / energy storage
  'LiPo', 'battery management', 'BMS', 'state of charge',
  // Inductive loads / motors
  'motor', 'solenoid', 'H-bridge', 'half-bridge', 'ESC', 'stepper motor', 'servo',
  'brushless motor', 'BLDC', 'brushed motor',
  // PCB design
  'PCB', 'PCB layout', 'PCB design', 'hardware', 'oscilloscope', 'testing',
  'routing', 'stackup', 'grounding', 'via',
  'EMI', 'transmission line', 'impedance matching',
  'differential pair', 'DRC', 'Altium', 'KiCad', 'Eagle', 'Cadence',
  // Embedded systems
  'embedded', 'microcontroller', 'RTOS', 'bare-metal', 'firmware',
  'I2C', 'SPI', 'UART', 'GPIO', 'interrupts', 'arduino', 'stm32',
  // Signals & systems / DSP
  'signal processing', 'dsp', 'signals and systems',
  // RF / electromagnetics / controls
  'electromagnetics', 'rf', 'controls', 'control systems',
  'GPU', 'SoC', 'memory', 'pipelining', 'cache', 'ISA',
  // Measurement
  'DMM', 'VNA', 'current sensing', 'sense resistor',
];

// ── Topic metadata ─────────────────────────────────────────────────────────────
// Used by the Questions view for filtering and labels.

export interface TopicMeta {
  id: string;
  label: string;
  type: 'behavioral' | 'technical';
  field: 'general' | 'cs' | 'ee';
  skills: string[];
}

export const TOPIC_META: TopicMeta[] = [
  { id: 'intro_motivation',        label: 'About you and motivation',          type: 'behavioral', field: 'general', skills: ['general'] },
  { id: 'teamwork',                label: 'Teamwork',                          type: 'behavioral', field: 'general', skills: ['teamwork', 'collaboration'] },
  { id: 'leadership',              label: 'Leadership and initiative',         type: 'behavioral', field: 'general', skills: ['leadership'] },
  { id: 'problem_solving',         label: 'Problem solving',                   type: 'behavioral', field: 'general', skills: ['problem solving', 'debugging', 'critical thinking'] },
  { id: 'failure_growth',          label: 'Failure and growth',                type: 'behavioral', field: 'general', skills: ['growth', 'adaptability'] },
  { id: 'time_management',         label: 'Time management and pressure',      type: 'behavioral', field: 'general', skills: ['time management', 'organization'] },
  { id: 'communication',           label: 'Communication',                     type: 'behavioral', field: 'general', skills: ['communication', 'presentation', 'writing'] },
  { id: 'projects',                label: 'Projects and experience',           type: 'behavioral', field: 'general', skills: ['projects', 'general'] },
  { id: 'ethics_ownership',        label: 'Ethics, ownership, and users',      type: 'behavioral', field: 'general', skills: ['ownership', 'safety', 'customer focus'] },
  { id: 'data_structures_algorithms', label: 'Data structures and algorithms', type: 'technical',  field: 'cs',      skills: ['data structures', 'algorithms', 'Java', 'Python', 'C++'] },
  { id: 'oop',                     label: 'Object-oriented programming',       type: 'technical',  field: 'cs',      skills: ['object-oriented programming', 'Java', 'C++', 'Python', 'C#'] },
  { id: 'operating_systems',       label: 'Operating systems',                 type: 'technical',  field: 'cs',      skills: ['operating systems', 'Linux', 'C', 'systems programming'] },
  { id: 'networking',              label: 'Networking',                        type: 'technical',  field: 'cs',      skills: ['networking', 'tcp/ip', 'http', 'web'] },
  { id: 'databases',               label: 'Databases',                         type: 'technical',  field: 'cs',      skills: ['SQL', 'databases', 'PostgreSQL', 'MySQL', 'MongoDB'] },
  { id: 'web_development',         label: 'Web development',                   type: 'technical',  field: 'cs',      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'HTML', 'CSS', 'web'] },
  { id: 'system_design',           label: 'System design basics',              type: 'technical',  field: 'cs',      skills: ['system design', 'distributed systems', 'cloud', 'AWS', 'backend'] },
  { id: 'programming_fundamentals',label: 'Programming fundamentals',         type: 'technical',  field: 'cs',      skills: ['programming', 'C', 'C++', 'Java', 'Python'] },
  { id: 'dev_practices',           label: 'Tools and engineering practices',   type: 'technical',  field: 'cs',      skills: ['Git', 'testing', 'Agile', 'CI/CD', 'Docker', 'Linux'] },
  { id: 'security',                label: 'Security',                          type: 'technical',  field: 'cs',      skills: ['security', 'cybersecurity'] },
  { id: 'machine_learning',        label: 'Machine learning and data',         type: 'technical',  field: 'cs',      skills: ['machine learning', 'data analysis', 'Python'] },
  { id: 'circuit_analysis',        label: 'Circuit analysis',                  type: 'technical',  field: 'ee',      skills: ['circuit analysis', 'circuits', 'electrical engineering'] },
  { id: 'analog_circuits',         label: 'Analog circuits and op-amps',       type: 'technical',  field: 'ee',      skills: ['analog', 'op-amp', 'filters', 'mixed-signal'] },
  { id: 'semiconductor_devices',   label: 'Semiconductor devices',             type: 'technical',  field: 'ee',      skills: ['semiconductors', 'transistors', 'MOSFET', 'BJT'] },
  { id: 'digital_logic',           label: 'Digital logic',                     type: 'technical',  field: 'ee',      skills: ['digital logic', 'digital design', 'boolean algebra'] },
  { id: 'timing_vlsi',             label: 'Timing, CMOS, and VLSI',            type: 'technical',  field: 'ee',      skills: ['VLSI', 'ASIC', 'CMOS', 'chip design', 'static timing analysis'] },
  { id: 'hdl_fpga',                label: 'HDL and FPGA',                      type: 'technical',  field: 'ee',      skills: ['VHDL', 'Verilog', 'SystemVerilog', 'FPGA', 'RTL'] },
  { id: 'computer_architecture',   label: 'Computer architecture',             type: 'technical',  field: 'ee',      skills: ['computer architecture', 'RISC-V', 'CPU', 'assembly', 'ARM'] },
  { id: 'embedded_systems',        label: 'Embedded systems and firmware',     type: 'technical',  field: 'ee',      skills: ['embedded', 'firmware', 'C', 'microcontroller', 'RTOS', 'arduino', 'stm32'] },
  { id: 'signals_systems',         label: 'Signals and systems',               type: 'technical',  field: 'ee',      skills: ['signal processing', 'dsp', 'signals and systems', 'MATLAB'] },
  { id: 'power',                   label: 'Power electronics and power systems',type: 'technical', field: 'ee',      skills: ['power electronics', 'power systems', 'power', 'motors'] },
  { id: 'pcb_lab',                 label: 'PCB design and lab skills',         type: 'technical',  field: 'ee',      skills: ['PCB', 'KiCad', 'Altium', 'hardware', 'testing', 'oscilloscope'] },
  { id: 'em_controls',             label: 'Electromagnetics, RF, and controls',type: 'technical',  field: 'ee',      skills: ['electromagnetics', 'rf', 'controls', 'control systems'] },
];

// ── Unified question bank ─────────────────────────────────────────────────────
// Key = topic id from TOPIC_META. Used by pickQuestions, Questions view,
// and the Setup screen question previews.

export const QUESTION_BANK: Record<string, string[]> = {
  // ── Behavioral ───────────────────────────────────────────────────────────────
  intro_motivation: [
    'Tell me about yourself.',
    'Walk me through your resume.',
    'Why do you want this internship?',
    'Why do you want to work at our company specifically?',
    'Why did you choose your major?',
    'What are your biggest strengths?',
    'What is a weakness you are actively working on?',
    'Where do you see yourself in five years?',
    'What do you know about our products or services?',
    'What kind of work environment helps you do your best work?',
    'What are you hoping to learn this summer?',
    'Tell me something about yourself that is not on your resume.',
    'What makes you a good fit for this role?',
    'How would your teammates describe you?',
    'What motivates you besides grades?',
    'What part of our mission resonates with you the most?',
    'Do you have any questions for us?',
  ],
  teamwork: [
    'Tell me about a time you worked on a team to reach a goal.',
    'Describe a time you disagreed with a teammate. How did you resolve it?',
    'Tell me about a time a teammate was not pulling their weight. What did you do?',
    'Describe a time you worked with someone whose style was very different from yours.',
    'Tell me about a time you helped a teammate who was struggling.',
    'Describe a group project that went poorly. What would you do differently?',
    'Tell me about a time you had to rely on others to finish your work.',
    'How do you handle a team decision you disagree with?',
  ],
  leadership: [
    'Tell me about a time you led a team.',
    'Describe a time you took initiative without being asked.',
    'Tell me about a time you had to motivate other people.',
    'Describe a time you had to delegate tasks. How did you decide who did what?',
    'Tell me about a time you struggled as a leader and how you handled it.',
    'Describe a time you mentored or taught someone.',
    'Tell me about a time you made an unpopular decision.',
    'Describe a time you started something new, like a club, event, or project.',
  ],
  problem_solving: [
    'Tell me about the hardest technical problem you have solved.',
    'Describe a bug that took a long time to find. How did you finally find it?',
    'Tell me about a time you had to solve a problem with incomplete information.',
    'Describe a time you found a creative solution to a problem.',
    'Tell me about a time you had to learn a new technology quickly.',
    'Describe a time you simplified a complicated process.',
    'Tell me about a time your first approach did not work. What did you do next?',
    'How do you approach a problem you have never seen before?',
  ],
  failure_growth: [
    'Tell me about a time you failed.',
    'Describe a mistake you made and how you fixed it.',
    'Tell me about feedback that was hard to hear. What did you do with it?',
    'Describe a time you missed a deadline.',
    'Tell me about a time you were wrong about something important.',
    'What is something you taught yourself recently?',
    'Describe a time you had to recover from a setback.',
  ],
  time_management: [
    'Tell me about a time you had to juggle several deadlines at once.',
    'How do you prioritize when everything feels urgent?',
    'Describe a time you worked under a lot of pressure.',
    'Tell me about a time you had to say no to something.',
    'How do you balance school, work, and activities?',
    'Describe a time you planned a large project from start to finish.',
  ],
  communication: [
    'Explain a technical concept you know well to someone with no technical background.',
    'Tell me about a time you had to present your work.',
    'Describe a time a misunderstanding caused a problem. How did you fix it?',
    'Tell me about a time you had to persuade someone to see your point of view.',
    'Describe a time you wrote documentation that other people relied on.',
    'How do you ask for help when you are stuck?',
  ],
  projects: [
    'Walk me through the project you are most proud of.',
    'What was the hardest part of that project?',
    'If you rebuilt that project today, what would you change?',
    'What tradeoffs did you make in your project\'s design?',
    'How did you test your project?',
    'What was your specific contribution to the team project?',
    'Tell me about a project that did not go as planned.',
    'Tell me about your past internship or work experience.',
  ],
  ethics_ownership: [
    'Tell me about a time you noticed something unsafe or wrong. What did you do?',
    'Describe a time you went above and beyond for a user or customer.',
    'Tell me about a time you had to balance quality against speed.',
    'What would you do if you found a serious bug right before a release?',
    'Describe a time you took ownership of a problem that was not yours.',
    'How do you think about safety in engineering work?',
  ],

  // ── CS Technical ─────────────────────────────────────────────────────────────
  data_structures_algorithms: [
    'What is the difference between an array and a linked list? When would you use each?',
    'How does a hash table work, and how are collisions handled?',
    'What is Big O notation, and why does it matter?',
    'Explain the difference between a stack and a queue, with a real use for each.',
    'What is a binary search tree, and what happens to its performance when it becomes unbalanced?',
    'How do self-balancing trees like AVL or red-black trees stay balanced?',
    'What is a heap, and what is it used for?',
    'Compare breadth-first search and depth-first search.',
    'How does Dijkstra\'s algorithm work, and when does it give wrong answers?',
    'Compare quicksort, mergesort, and heapsort.',
    'Why is quicksort often fast in practice even though its worst case is O(n²)?',
    'What is dynamic programming? Give an example problem.',
    'What is the difference between recursion and iteration? What causes a stack overflow?',
    'How does binary search work, and what is its time complexity?',
    'What is a trie, and when would you use one?',
    'What is the difference between a graph and a tree?',
    'What is amortized time complexity? Use a dynamic array as an example.',
    'How would you detect a cycle in a linked list?',
    'What is a greedy algorithm, and when does it give the wrong answer?',
    'When can hash map lookups degrade from constant time?',
    'What is topological sort, and where is it used?',
  ],
  oop: [
    'What are the four pillars of object-oriented programming?',
    'What is the difference between a class and an object?',
    'Explain inheritance versus composition. Which do you prefer and why?',
    'What is polymorphism? Give an example.',
    'What is the difference between an abstract class and an interface?',
    'What is method overloading versus method overriding?',
    'What is encapsulation, and why does it matter?',
    'What are the SOLID principles?',
    'What is a design pattern? Describe one you have used.',
    'Explain the singleton pattern and its drawbacks.',
    'What is dependency injection?',
  ],
  operating_systems: [
    'What is the difference between a process and a thread?',
    'What is a deadlock, and what four conditions cause it?',
    'How can deadlocks be prevented or avoided?',
    'What is a race condition, and how do you prevent one?',
    'What is the difference between a mutex and a semaphore?',
    'What is virtual memory, and why is it useful?',
    'What is paging, and what is a page fault?',
    'What happens during a context switch?',
    'Compare common CPU scheduling algorithms like round robin and shortest job first.',
    'What is the difference between user mode and kernel mode?',
    'What is a system call? Give an example.',
    'What is thrashing?',
    'What is the difference between the stack and the heap in memory?',
    'What happens when you run a program, from typing the command to execution?',
    'What is a cache, and why does locality matter?',
  ],
  networking: [
    'Explain the layers of the OSI model and where TCP/IP fits.',
    'What is the difference between TCP and UDP? When would you use each?',
    'What happens when you type a URL into a browser and press Enter?',
    'How does DNS work?',
    'What is the TCP three-way handshake?',
    'What is the difference between HTTP and HTTPS?',
    'How does TLS keep a connection secure?',
    'What is the difference between an IP address and a MAC address?',
    'What is a subnet mask?',
    'What is NAT, and why is it used?',
    'What is a REST API, and what do the common HTTP methods do?',
    'What is the difference between a router and a switch?',
    'What do common HTTP status codes like 200, 301, 404, and 500 mean?',
    'What is the difference between latency and bandwidth?',
    'What is a WebSocket, and when would you use one instead of plain HTTP?',
  ],
  databases: [
    'What is the difference between SQL and NoSQL databases?',
    'What does ACID stand for?',
    'What is database normalization, and why might you denormalize?',
    'What is an index, and what are its tradeoffs?',
    'Explain the different types of SQL joins.',
    'What is the difference between a primary key and a foreign key?',
    'What is a transaction?',
    'What is SQL injection, and how do you prevent it?',
    'What is the difference between DELETE, TRUNCATE, and DROP?',
    'How would you design a database schema for a simple library app?',
  ],
  web_development: [
    'What is the difference between the frontend and the backend?',
    'How does a browser render a web page?',
    'What is the DOM?',
    'What is the difference between let, const, and var in JavaScript?',
    'What is a closure in JavaScript?',
    'How does the JavaScript event loop work?',
    'What is a Promise, and how does async/await work?',
    'What is the difference between state and props in React?',
    'What is the virtual DOM?',
    'What is CORS, and why does it exist?',
    'What is the difference between cookies, localStorage, and sessionStorage?',
    'How would you make a slow web page faster?',
  ],
  system_design: [
    'How would you design a URL shortener?',
    'What is the difference between horizontal and vertical scaling?',
    'What is a load balancer?',
    'What is caching, and where would you add a cache in a web app?',
    'What is a CDN?',
    'What is a message queue, and why would you use one?',
    'What is the CAP theorem?',
    'What is the difference between a monolith and microservices?',
    'How would you design a rate limiter?',
    'How would you design a chat app?',
  ],
  programming_fundamentals: [
    'What is the difference between a compiled and an interpreted language?',
    'What is a pointer, and what is a null pointer?',
    'What is a memory leak, and how do you find one?',
    'What is the difference between pass by value and pass by reference?',
    'What is garbage collection?',
    'What is the difference between static and dynamic typing?',
    'What does the static keyword mean in C or C++?',
    'What is a segmentation fault?',
    'What is the difference between a shallow copy and a deep copy?',
    'What are generics or templates, and why are they useful?',
    'What is an exception, and when should you use one?',
    'What is the difference between stack and heap allocation in C++?',
    'What is a smart pointer in C++?',
  ],
  dev_practices: [
    'What is Git, and what is the difference between merge and rebase?',
    'How do you resolve a merge conflict?',
    'What is the difference between unit, integration, and end-to-end tests?',
    'What is test-driven development?',
    'What is continuous integration and continuous deployment?',
    'What is Docker, and why use containers?',
    'How would you debug a program that crashes only sometimes?',
    'What makes code readable and maintainable?',
    'What do you look for in a code review?',
    'What is Agile, and what happens in a sprint?',
    'What Linux commands do you use most often?',
  ],
  security: [
    'What is the difference between authentication and authorization?',
    'How should passwords be stored?',
    'What is the difference between symmetric and asymmetric encryption?',
    'What is hashing, and how is it different from encryption?',
    'What is cross-site scripting (XSS)?',
    'What is cross-site request forgery (CSRF)?',
    'What is the principle of least privilege?',
    'What is a buffer overflow?',
  ],
  machine_learning: [
    'What is the difference between supervised and unsupervised learning?',
    'What is overfitting, and how do you prevent it?',
    'Explain the bias-variance tradeoff.',
    'What is the difference between classification and regression?',
    'How does a neural network learn?',
    'What is gradient descent?',
    'What are precision and recall?',
    'Why do you split data into training, validation, and test sets?',
    'At a high level, how does a large language model work?',
  ],

  // ── EE Technical ─────────────────────────────────────────────────────────────
  circuit_analysis: [
    "State Ohm's law and Kirchhoff's voltage and current laws.",
    'How do you find the equivalent resistance of resistors in series and in parallel?',
    'What is a voltage divider, and what happens when you put a load on it?',
    'Explain Thevenin and Norton equivalent circuits.',
    'What is superposition, and when can you use it?',
    'What is the difference between AC and DC?',
    'What is impedance? How do resistors, capacitors, and inductors differ?',
    'How does a capacitor behave at DC and at very high frequency? What about an inductor?',
    'What is the time constant of an RC circuit?',
    'Describe the voltage across a capacitor as it charges through a resistor.',
    'What is resonance in an RLC circuit?',
    'What is the quality factor, or Q, of a circuit?',
    'What is the maximum power transfer theorem?',
    'What is RMS voltage, and why is it used?',
    'What is the difference between real, reactive, and apparent power?',
    'What is power factor, and why does it matter?',
    'How would you drive an LED from a 5 V supply, and how do you pick the resistor?',
    'What is phasor analysis?',
  ],
  analog_circuits: [
    'What are the ideal op-amp assumptions?',
    'Derive the gain of an inverting and a non-inverting amplifier.',
    'What is a voltage follower, and why would you use one?',
    'What is negative feedback, and why is it useful?',
    'What is gain-bandwidth product?',
    'What is slew rate?',
    'What is the difference between an op-amp and a comparator?',
    'What is hysteresis in a Schmitt trigger, and why use it?',
    'Design a simple active low-pass filter. What sets its cutoff frequency?',
    'What is the difference between low-pass, high-pass, band-pass, and notch filters?',
    'What is a Bode plot?',
    'What are gain margin and phase margin?',
    'What is common-mode rejection ratio (CMRR)?',
    'What is input offset voltage?',
    'What is the purpose of a decoupling capacitor?',
  ],
  semiconductor_devices: [
    'How does a PN junction diode work?',
    'What is a Zener diode used for?',
    'What are the regions of operation of a BJT?',
    'What are the regions of operation of a MOSFET?',
    'Compare a BJT and a MOSFET.',
    'How would you use a MOSFET as a switch to drive a motor or relay?',
    'Why do you need a flyback diode across a relay coil?',
    'What is the threshold voltage of a MOSFET?',
    'What is the difference between an NMOS and a PMOS transistor?',
    'How does a common-emitter amplifier work?',
    'What causes leakage current in a transistor?',
  ],
  digital_logic: [
    'What are the basic logic gates, and why are NAND and NOR called universal gates?',
    "What is De Morgan's theorem?",
    'How do you simplify a Boolean expression with a Karnaugh map?',
    'What is the difference between combinational and sequential logic?',
    'How does a multiplexer work? Can you build any logic function with one?',
    'What is the difference between a decoder and an encoder?',
    'How does a ripple-carry adder work, and why is it slow?',
    'What is a carry-lookahead adder?',
    "How are negative numbers represented in two's complement?",
    'What is overflow in binary addition, and how do you detect it?',
    'What is a glitch or hazard in combinational logic?',
    'What is the difference between a latch and a flip-flop?',
    'Compare SR, D, JK, and T flip-flops.',
    'What is a finite state machine?',
    'What is the difference between a Mealy machine and a Moore machine?',
    'Design a state machine that detects the sequence 101.',
    'How do you build a counter? What is a ring counter?',
    'What is a shift register used for?',
  ],
  timing_vlsi: [
    'What are setup time and hold time?',
    'What happens when setup or hold time is violated?',
    'How do you fix a setup violation? How do you fix a hold violation?',
    'Will slowing down the clock fix a hold violation? Why or why not?',
    'What is metastability, and how do you reduce the risk of it?',
    'Why use a two flip-flop synchronizer?',
    'What is clock domain crossing, and how do you safely pass multi-bit data between domains?',
    'What is an asynchronous FIFO, and why does it use Gray code pointers?',
    'What is clock skew? Can it ever help?',
    'What is the critical path?',
    'What is slack in static timing analysis?',
    'What is the difference between a false path and a multicycle path?',
    'Draw a CMOS inverter and explain how it works.',
    'Build a two-input NAND gate out of CMOS transistors.',
    'What are the sources of power dissipation in CMOS?',
    'How does dynamic power depend on voltage and frequency?',
    'What is clock gating?',
    'What is the difference between synchronous and asynchronous reset?',
    'What are the main steps of the ASIC design flow?',
    'What is design for testability, and what is a scan chain?',
    'What is the difference between an FPGA and an ASIC?',
    'What is a FinFET, and why did the industry move to it?',
    'What is the difference between SRAM and DRAM?',
  ],
  hdl_fpga: [
    'What is the difference between VHDL and Verilog?',
    'What is the difference between blocking and non-blocking assignments in Verilog?',
    'How can you accidentally infer a latch, and how do you avoid it?',
    'What is the difference between a signal and a variable in VHDL?',
    'What is synthesis, and what kind of code is not synthesizable?',
    'What is a testbench, and what makes a good one?',
    'What is inside an FPGA? Explain LUTs, flip-flops, and block RAM.',
    'Describe how an FPGA is configured and how it runs your design.',
    'How would you write a clock divider in HDL?',
    'How do you debounce a button on an FPGA?',
    'What is a sensitivity list?',
    'What is the difference between == and === in Verilog?',
    'How do you implement a finite state machine in HDL?',
    'What does a timing report tell you after place and route?',
  ],
  computer_architecture: [
    'What are the stages of a classic five-stage CPU pipeline?',
    'What are data, control, and structural hazards?',
    'How does forwarding reduce pipeline stalls?',
    'What is branch prediction, and why does it matter?',
    'What is the difference between RISC and CISC?',
    'How does a cache work? Explain hit, miss, and miss penalty.',
    'What is the difference between direct-mapped, set-associative, and fully associative caches?',
    'What is the memory hierarchy, and why does it exist?',
    'What is the difference between Harvard and von Neumann architecture?',
    'What is an instruction set architecture?',
    "What is the difference between a CPU's datapath and its control unit?",
    'What is endianness?',
    'What is the difference between a microprocessor and a microcontroller?',
    'How does a TLB speed up virtual memory?',
  ],
  embedded_systems: [
    'What does the volatile keyword do in C, and when do you need it?',
    'Can a variable be both const and volatile? Give an example.',
    'What is an interrupt, and what should an interrupt service routine avoid doing?',
    'Why should you not call printf inside an interrupt handler?',
    'How do you safely share data between an interrupt handler and the main loop?',
    'What is the difference between polling and interrupts?',
    'Compare UART, SPI, and I2C.',
    'What are pull-up resistors, and why does I2C need them?',
    'What is a watchdog timer?',
    'What is an RTOS, and when would you use one?',
    'What is priority inversion?',
    'How do you set, clear, toggle, and check a bit in C?',
    'What is a memory-mapped register?',
    'Why do embedded developers often avoid dynamic memory allocation?',
    'What is PWM, and how is it used?',
    'What does an ADC do, and what are resolution and sampling rate?',
    'How does a microcontroller boot and start running code from flash?',
    'How do you debug firmware when there is no console?',
  ],
  signals_systems: [
    'What is the Nyquist sampling theorem?',
    'What is aliasing, and how do you prevent it?',
    'What is the Fourier transform used for?',
    'What is the difference between the DFT and the FFT?',
    'What is convolution?',
    'What is a linear time-invariant system?',
    'What is the difference between FIR and IIR filters?',
    'What is the Laplace transform used for?',
    'What is the Z-transform?',
    'What is a transfer function, and what do its poles and zeros tell you?',
    'What makes a system stable?',
    'What is quantization noise?',
    'What is signal-to-noise ratio?',
  ],
  power: [
    'How does a buck converter work?',
    'How does a boost converter work?',
    'Compare a linear regulator and a switching regulator.',
    'What is dropout voltage in an LDO regulator?',
    'How does a transformer work?',
    'Why is electricity transmitted at high voltage?',
    'What is three-phase power, and why is it used?',
    'How does a full-wave bridge rectifier work?',
    "How does a battery's capacity rating relate to how long it lasts?",
    'What is the difference between a generator and a motor?',
    'How does a brushless DC motor work?',
    'What is ground, and what is a ground loop?',
  ],
  pcb_lab: [
    'Walk me through how you design a PCB, from schematic to fabrication.',
    'Where should decoupling capacitors go on a PCB, and why?',
    'What is a ground plane, and why use one?',
    'What is signal integrity?',
    'What is impedance matching, and why does it matter?',
    'What is crosstalk, and how do you reduce it?',
    'How would you debug a board that does not power on?',
    'How do you measure a signal with an oscilloscope, and what does triggering do?',
    'When would you use a multimeter versus an oscilloscope?',
    'What is EMI, and how do you reduce it?',
    'How do you choose a trace width for a given current?',
    'What are vias, and what are blind and buried vias?',
  ],
  em_controls: [
    "State Faraday's law of induction.",
    "What happens to a parallel-plate capacitor's capacitance if you double the plate spacing?",
    'What is a transmission line, and when do you need to treat a wire as one?',
    'What is a reflection coefficient?',
    'What is a PID controller, and what does each term do?',
    'What is the difference between open-loop and closed-loop control?',
    'What does a step response tell you about a system?',
    'What is an antenna, and what determines its size?',
  ],
};

// ── Legacy flat lists (kept for backward compat with pickQuestions internals) ──
// All behavioral questions merged into one pool.
export const BEHAVIORAL_QUESTIONS: string[] = [
  ...QUESTION_BANK.intro_motivation,
  ...QUESTION_BANK.teamwork,
  ...QUESTION_BANK.leadership,
  ...QUESTION_BANK.problem_solving,
  ...QUESTION_BANK.failure_growth,
  ...QUESTION_BANK.time_management,
  ...QUESTION_BANK.communication,
  ...QUESTION_BANK.projects,
  ...QUESTION_BANK.ethics_ownership,
];

// ── Skill → topic mapping for question lookup ─────────────────────────────────
// Maps lowercase skill names to one or more topic ids. Used by pickQuestions
// to look up the right questions for a matched posting skill.
const SKILL_TO_TOPIC: Record<string, string[]> = {};
for (const meta of TOPIC_META) {
  for (const skill of meta.skills) {
    const key = skill.toLowerCase();
    if (!SKILL_TO_TOPIC[key]) SKILL_TO_TOPIC[key] = [];
    SKILL_TO_TOPIC[key].push(meta.id);
  }
}
// Additional skill aliases from the old SKILL_DICT that map to topics
const EXTRA_SKILL_ALIASES: Record<string, string> = {
  python: 'data_structures_algorithms', java: 'data_structures_algorithms',
  'c++': 'programming_fundamentals', c: 'embedded_systems',
  javascript: 'web_development', typescript: 'web_development',
  react: 'web_development', 'node.js': 'web_development', html: 'web_development', css: 'web_development',
  sql: 'databases', nosql: 'databases', mongodb: 'databases', postgresql: 'databases', mysql: 'databases',
  'machine learning': 'machine_learning', 'deep learning': 'machine_learning',
  tensorflow: 'machine_learning', pytorch: 'machine_learning', 'data analysis': 'machine_learning',
  aws: 'system_design', docker: 'dev_practices', kubernetes: 'dev_practices', 'ci/cd': 'dev_practices',
  linux: 'operating_systems', git: 'dev_practices', agile: 'dev_practices', scrum: 'dev_practices',
  'op-amp': 'analog_circuits', opamp: 'analog_circuits', filters: 'analog_circuits', amplifiers: 'analog_circuits',
  adc: 'analog_circuits', dac: 'analog_circuits', pll: 'analog_circuits',
  mosfet: 'semiconductor_devices', bjt: 'semiconductor_devices', cmos: 'timing_vlsi',
  vlsi: 'timing_vlsi', asic: 'timing_vlsi', rtl: 'hdl_fpga', verilog: 'hdl_fpga', vhdl: 'hdl_fpga',
  fpga: 'hdl_fpga', 'risc-v': 'computer_architecture', cpu: 'computer_architecture',
  embedded: 'embedded_systems', microcontroller: 'embedded_systems', firmware: 'embedded_systems',
  rtos: 'embedded_systems', i2c: 'embedded_systems', spi: 'embedded_systems', uart: 'embedded_systems',
  gpio: 'embedded_systems', interrupts: 'embedded_systems',
  'signal integrity': 'pcb_lab', emi: 'pcb_lab', pcb: 'pcb_lab', 'pcb layout': 'pcb_lab', 'pcb design': 'pcb_lab',
  'circuit analysis': 'circuit_analysis', 'power supply': 'power', 'buck converter': 'power',
  'boost converter': 'power', ldo: 'power', pwm: 'power',
  oscilloscope: 'pcb_lab', 'transmission line': 'em_controls', 'impedance matching': 'em_controls',
  'signal processing': 'signals_systems', dsp: 'signals_systems',
  communication: 'communication', teamwork: 'teamwork', leadership: 'leadership',
  'problem solving': 'problem_solving', 'time management': 'time_management', collaboration: 'teamwork',
};
for (const [skill, topic] of Object.entries(EXTRA_SKILL_ALIASES)) {
  if (!SKILL_TO_TOPIC[skill]) SKILL_TO_TOPIC[skill] = [topic];
  else if (!SKILL_TO_TOPIC[skill].includes(topic)) SKILL_TO_TOPIC[skill].push(topic);
}

/** Get all questions for a skill name (checks topic mapping). */
export function getQuestionsForSkill(skill: string): string[] | undefined {
  const topicIds = SKILL_TO_TOPIC[skill.toLowerCase()];
  if (!topicIds) return undefined;
  const all: string[] = [];
  for (const id of topicIds) {
    const qs = QUESTION_BANK[id];
    if (qs) all.push(...qs);
  }
  return all.length > 0 ? all : undefined;
}

/** Extract skills from text (case-insensitive match against SKILL_DICT) */
export function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  return SKILL_DICT.filter(skill => lower.includes(skill.toLowerCase()));
}

/** Calculate fit score: skills in both / skills in posting */
export function fitScore(postingSkills: string[], resumeSkills: string[]): number {
  if (postingSkills.length === 0) return 0;
  const resumeSet = new Set(resumeSkills.map(s => s.toLowerCase()));
  const matched = postingSkills.filter(s => resumeSet.has(s.toLowerCase()));
  return Math.round((matched.length / postingSkills.length) * 100);
}

// Role → priority skill categories. Skills in this list are sorted to the
// front of the pool so questions are role-relevant even when a posting has
// many generic skills (Git, communication, etc.).
const ROLE_PRIORITY_SKILLS: Record<string, string[]> = {
  // Software
  'software engineer':  ['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'Go', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'REST', 'CI/CD'],
  'frontend':           ['JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'HTML', 'CSS', 'Next.js', 'GraphQL'],
  'backend':            ['Python', 'Java', 'Go', 'Node.js', 'SQL', 'PostgreSQL', 'MongoDB', 'REST', 'Docker', 'Kubernetes'],
  'full stack':         ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'REST', 'Docker', 'Git'],
  'data scientist':     ['Python', 'machine learning', 'deep learning', 'pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'SQL', 'Jupyter', 'data analysis'],
  'data analyst':       ['SQL', 'Python', 'data analysis', 'pandas', 'Tableau', 'Power BI', 'Excel'],
  'machine learning':   ['Python', 'machine learning', 'deep learning', 'TensorFlow', 'PyTorch', 'SQL', 'Docker', 'data analysis'],
  'devops':             ['Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'AWS', 'Linux', 'Bash', 'Git'],
  'cloud':              ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
  'mobile':             ['Swift', 'Kotlin', 'React', 'JavaScript', 'Git'],
  // Hardware / EE
  'power electronics':  ['buck converter', 'boost converter', 'LDO', 'PWM', 'MOSFET', 'power supply', 'switching regulator'],
  'analog':             ['op-amp', 'amplifiers', 'ADC', 'DAC', 'PLL', 'filters', 'signal integrity'],
  'embedded':           ['embedded', 'microcontroller', 'firmware', 'RTOS', 'I2C', 'SPI', 'UART', 'GPIO', 'interrupts', 'C++'],
  'firmware':           ['firmware', 'embedded', 'microcontroller', 'RTOS', 'C++', 'bare-metal', 'I2C', 'SPI', 'UART'],
  'pcb':                ['PCB', 'PCB layout', 'PCB design', 'Altium', 'KiCad', 'signal integrity', 'EMI', 'grounding', 'stackup'],
  'hardware engineer':  ['circuit analysis', 'PCB', 'MOSFET', 'BJT', 'oscilloscope', 'embedded', 'op-amp', 'power supply'],
  'vlsi':               ['VLSI', 'RTL', 'Verilog', 'VHDL', 'CMOS', 'ASIC', 'FPGA', 'SoC', 'memory'],
  'fpga':               ['FPGA', 'RTL', 'Verilog', 'VHDL', 'embedded', 'ASIC'],
  // General
  'product manager':    ['communication', 'leadership', 'Agile', 'Scrum', 'Jira', 'teamwork', 'problem solving'],
  'ux':                 ['Figma', 'communication', 'problem solving', 'teamwork'],
};

/** Given a role string, return the priority skill list for that role. */
function getRolePrioritySkills(role: string): string[] {
  const lowerRole = role.toLowerCase();
  for (const [key, skills] of Object.entries(ROLE_PRIORITY_SKILLS)) {
    if (lowerRole.includes(key)) return skills;
  }
  return [];
}

/** Pick n interview questions tailored to the role + posting skills. */
export function pickQuestions(postingSkills: string[], resumeSkills: string[], count = 4, role = ''): string[] {
  const shuffledBehavioral = [...BEHAVIORAL_QUESTIONS].sort(() => Math.random() - 0.5);
  const resumeSet = new Set(resumeSkills.map(s => s.toLowerCase()));
  const prioritySkills = getRolePrioritySkills(role);
  const prioritySet = new Set(prioritySkills.map(s => s.toLowerCase()));

  // Candidate skills: posting first, then role-priority skills as fallback
  const allTopicSkills = Object.keys(SKILL_TO_TOPIC);
  const candidateSkills = postingSkills.length > 0
    ? postingSkills
    : prioritySkills.length > 0 ? prioritySkills : allTopicSkills;

  // Only keep skills that have questions in the bank
  const withQuestions = candidateSkills.filter(s => !!getQuestionsForSkill(s));

  // Sort: role-priority skills that the candidate has → role-priority without resume match → rest
  const sorted = withQuestions.sort((a, b) => {
    const aInResume = resumeSet.has(a.toLowerCase());
    const bInResume = resumeSet.has(b.toLowerCase());
    const aInPriority = prioritySet.has(a.toLowerCase());
    const bInPriority = prioritySet.has(b.toLowerCase());

    if (aInPriority && aInResume && !(bInPriority && bInResume)) return -1;
    if (bInPriority && bInResume && !(aInPriority && aInResume)) return 1;
    if (aInPriority && !bInPriority) return -1;
    if (bInPriority && !aInPriority) return 1;
    if (aInResume && !bInResume) return -1;
    if (bInResume && !aInResume) return 1;
    return 0;
  });

  // Pick one question per skill (randomised within each skill's pool)
  const skillQuestions: string[] = [];
  for (const skill of sorted) {
    const qs = getQuestionsForSkill(skill);
    if (qs) {
      const q = qs[Math.floor(Math.random() * qs.length)];
      if (!skillQuestions.includes(q)) skillQuestions.push(q);
    }
    if (skillQuestions.length >= Math.max(1, count - 1)) break;
  }

  // Fill remaining slots with behavioral questions
  const result = [...skillQuestions];
  for (const q of shuffledBehavioral) {
    if (result.length >= count) break;
    if (!result.includes(q)) result.push(q);
  }

  return result.sort(() => Math.random() - 0.5).slice(0, count);
}
