import { performance } from 'perf_hooks';

// Mock data generator
const generateContacts = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i.toString(),
    name: `Contact Name ${i}`,
    email: `contact${i}@example.org`,
    organization: `Organization ${i % 10}`,
    role: `Role ${i % 5}`
  }));
};

const contacts = generateContacts(10000);
const searchTerm = "act 50"; // Should match "Contact 50", "contact50@...", "Contact 500..."

// 1. Naive Implementation (as described in task)
const benchNaive = () => {
  const start = performance.now();
  const res = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const end = performance.now();
  return end - start;
};

// 2. Hoisted Search Term (Optimization Step 1)
const benchHoisted = () => {
  const start = performance.now();
  const lowerSearchTerm = searchTerm.toLowerCase();
  const res = contacts.filter(c =>
    c.name.toLowerCase().includes(lowerSearchTerm) ||
    c.email.toLowerCase().includes(lowerSearchTerm) ||
    c.organization.toLowerCase().includes(lowerSearchTerm)
  );
  const end = performance.now();
  return end - start;
};

// 3. Pre-calculated (Current Implementation in file)
// Note: We include the pre-calc cost in the "First Run" but not in subsequent runs
const benchPreCalc = () => {
  // Pre-calculation phase (simulating useMemo dependency change)
  const startTotal = performance.now();

  const searchableContacts = contacts.map(c => ({
    original: c,
    lowerName: c.name.toLowerCase(),
    lowerEmail: c.email.toLowerCase(),
    lowerOrg: c.organization.toLowerCase()
  }));

  const mid = performance.now();

  // Filter phase
  const lowerSearchTerm = searchTerm.toLowerCase();
  const res = searchableContacts
    .filter(item =>
      item.lowerName.includes(lowerSearchTerm) ||
      item.lowerEmail.includes(lowerSearchTerm) ||
      item.lowerOrg.includes(lowerSearchTerm)
    )
    .map(item => item.original);

  const end = performance.now();

  return {
    total: end - startTotal,
    filterOnly: end - mid,
    prep: mid - startTotal
  };
};

console.log("Running Benchmarks with 10,000 contacts...");

let naiveSum = 0;
for(let i=0; i<100; i++) naiveSum += benchNaive();
console.log(`Naive Average: ${(naiveSum/100).toFixed(3)} ms`);

let hoistedSum = 0;
for(let i=0; i<100; i++) hoistedSum += benchHoisted();
console.log(`Hoisted Average: ${(hoistedSum/100).toFixed(3)} ms`);

// For Pre-Calc, we assume the list is stable and we search multiple times
// So we pay prep cost once, and filter cost multiple times.
const preCalcRes = benchPreCalc();
console.log(`Pre-Calc One-time Prep: ${preCalcRes.prep.toFixed(3)} ms`);

let preCalcFilterSum = 0;
// Prepare once
const searchableContacts = contacts.map(c => ({
    original: c,
    lowerName: c.name.toLowerCase(),
    lowerEmail: c.email.toLowerCase(),
    lowerOrg: c.organization.toLowerCase()
}));
const lowerSearchTerm = searchTerm.toLowerCase();

for(let i=0; i<100; i++) {
  const start = performance.now();
  searchableContacts
    .filter(item =>
      item.lowerName.includes(lowerSearchTerm) ||
      item.lowerEmail.includes(lowerSearchTerm) ||
      item.lowerOrg.includes(lowerSearchTerm)
    );
  preCalcFilterSum += (performance.now() - start);
}
console.log(`Pre-Calc Filter Only Average: ${(preCalcFilterSum/100).toFixed(3)} ms`);
