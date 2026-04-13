// doctors.js  –  run once with:  node doctors.js
// Writes pre-registered doctor accounts into data/doctors.json
const fs   = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const doctors = [
  {
    id:         'doc-001',
    role:       'doctor',
    name:       'Dr. Anika Sharma',
    specialty:  'Cardiology',
    email:      'anika.sharma@mediconnect.in',
    password:   'Doc@Anika#2024',
    hospital:   'Apollo Hospital',
    avatar:     'AS'
  },
  {
    id:         'doc-002',
    role:       'doctor',
    name:       'Dr. Rohan Mehta',
    specialty:  'Neurology',
    email:      'rohan.mehta@mediconnect.in',
    password:   'Doc@Rohan#2024',
    hospital:   'Fortis Hospital',
    avatar:     'RM'
  },
  {
    id:         'doc-003',
    role:       'doctor',
    name:       'Dr. Priya Nair',
    specialty:  'Pediatrics',
    email:      'priya.nair@mediconnect.in',
    password:   'Doc@Priya#2024',
    hospital:   'AIIMS',
    avatar:     'PN'
  },
  {
    id:         'doc-004',
    role:       'doctor',
    name:       'Dr. Suresh Patel',
    specialty:  'Orthopedics',
    email:      'suresh.patel@mediconnect.in',
    password:   'Doc@Suresh#2024',
    hospital:   'Medanta',
    avatar:     'SP'
  },
  {
    id:         'doc-005',
    role:       'doctor',
    name:       'Dr. Kavitha Rao',
    specialty:  'Dermatology',
    email:      'kavitha.rao@mediconnect.in',
    password:   'Doc@Kavitha#2024',
    hospital:   'Manipal Hospital',
    avatar:     'KR'
  }
];

fs.writeFileSync(
  path.join(dataDir, 'doctors.json'),
  JSON.stringify(doctors, null, 2)
);

console.log('✅  doctors.json created with', doctors.length, 'doctor accounts.');
console.log('\n📋  Doctor Login Credentials:\n');
doctors.forEach(d => {
  console.log(`  ${d.name} (${d.specialty})`);
  console.log(`    Email   : ${d.email}`);
  console.log(`    Password: ${d.password}\n`);
});
