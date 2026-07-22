// Mock data for endpoints not yet implemented on the backend (startups, investments, admin).
export const mockStartups = [
  { id: "s1", name: "Nimbus AI", sector: "AI / ML", stage: "Seed", target: 500000, raised: 312000, investors: 142, logo: "🧠" },
  { id: "s2", name: "GreenGrid", sector: "CleanTech", stage: "Series A", target: 2000000, raised: 1450000, investors: 318, logo: "🌱" },
  { id: "s3", name: "MediSync", sector: "HealthTech", stage: "Seed", target: 750000, raised: 240000, investors: 86, logo: "🩺" },
  { id: "s4", name: "FinPulse", sector: "FinTech", stage: "Pre-Seed", target: 300000, raised: 95000, investors: 41, logo: "💳" },
  { id: "s5", name: "RoboLogix", sector: "Robotics", stage: "Series A", target: 3500000, raised: 2890000, investors: 502, logo: "🤖" },
  { id: "s6", name: "EduSpark", sector: "EdTech", stage: "Seed", target: 600000, raised: 410000, investors: 173, logo: "📚" },
];

export const mockInvestments = [
  { id: "i1", startup: "Nimbus AI", amount: 5000, date: "2025-11-12", status: "Active", returns: 12.4 },
  { id: "i2", startup: "GreenGrid", amount: 8000, date: "2025-09-04", status: "Active", returns: 7.8 },
  { id: "i3", startup: "MediSync", amount: 2500, date: "2025-08-21", status: "Active", returns: -3.1 },
  { id: "i4", startup: "FinPulse", amount: 1500, date: "2025-07-02", status: "Closed", returns: 22.6 },
  { id: "i5", startup: "RoboLogix", amount: 10000, date: "2025-06-18", status: "Active", returns: 18.2 },
];

export const mockGrowth = [
  { m: "Jan", v: 8000 }, { m: "Feb", v: 12000 }, { m: "Mar", v: 14500 },
  { m: "Apr", v: 16200 }, { m: "May", v: 18900 }, { m: "Jun", v: 21000 },
  { m: "Jul", v: 22500 }, { m: "Aug", v: 25800 }, { m: "Sep", v: 27300 },
  { m: "Oct", v: 29100 }, { m: "Nov", v: 31200 }, { m: "Dec", v: 33800 },
];

export const mockAllocation = [
  { name: "FinTech", value: 28 },
  { name: "AI / ML", value: 22 },
  { name: "HealthTech", value: 18 },
  { name: "CleanTech", value: 16 },
  { name: "Other", value: 16 },
];

export const mockAdminUsers = [
  { id: "u1", name: "Ada Lovelace", email: "ada@fundnest.io", role: "investor", kyc: "Verified", joined: "2025-03-04" },
  { id: "u2", name: "Linus T.", email: "linus@fundnest.io", role: "founder", kyc: "Pending", joined: "2025-05-19" },
  { id: "u3", name: "Grace Hopper", email: "grace@fundnest.io", role: "investor", kyc: "Verified", joined: "2025-02-11" },
  { id: "u4", name: "Marie C.", email: "marie@fundnest.io", role: "founder", kyc: "Rejected", joined: "2025-06-22" },
];

export const mockPendingStartups = [
  { id: "p1", name: "QuantumLeap", founder: "Niels B.", date: "2025-12-01", status: "Pending" },
  { id: "p2", name: "AeroNova", founder: "Amelia E.", date: "2025-11-28", status: "Pending" },
];

export const mockKyc = [
  { id: "k1", user: "Linus T.", doc: "Passport", date: "2025-11-30", status: "Pending" },
  { id: "k2", user: "Marie C.", doc: "ID Card", date: "2025-11-27", status: "Pending" },
];
