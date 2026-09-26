'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [loading, setLoading] = useState(false);

  // Sign In Form States
  const [facilityNode, setFacilityNode] = useState('Austin Central Hub (WH-01)');
  const [identifier, setIdentifier] = useState('supervisor@stocksense.io');
  const [pin, setPin] = useState('StockSense2026!');
  const [showPin, setShowPin] = useState(false);
  const [rememberShift, setRememberShift] = useState(true);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regBadge, setRegBadge] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSupervisor, setRegSupervisor] = useState('Shift Lead Priya Sharma (WH-01)');
  const [regRole, setRegRole] = useState<'Supervisor' | 'Operator' | 'Auditor'>('Operator');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Live UTC Clock
  const [utcTime, setUtcTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0') + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 500);
    return () => clearInterval(interval);
  }, []);

  // Quick Demo Account Auto-Fill
  const handleSelectDemoUser = (role: 'Supervisor' | 'Operator' | 'Auditor') => {
    setActiveTab('signin');
    if (role === 'Supervisor') {
      setIdentifier('supervisor@stocksense.io');
      setPin('StockSense2026!');
      toast.info('Filled credentials for Lead Supervisor Priya Sharma');
    } else if (role === 'Operator') {
      setIdentifier('operator@stocksense.io');
      setPin('StockSense2026!');
      toast.info('Filled credentials for Senior Operator Marcus Vance');
    } else if (role === 'Auditor') {
      setIdentifier('auditor@stocksense.io');
      setPin('StockSense2026!');
      toast.info('Filled credentials for Inventory Auditor Elena Rostova');
    }
  };

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim() || !pin) {
      toast.error('Operator Identity (Email/Badge) and Security PIN are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: pin,
          facilityNode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      login({ user: data.user, token: data.token });
      toast.success(data.message || `Ingress granted: Welcome ${data.user.name}`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regBadge.trim() || !regEmail.trim() || !regPassword) {
      toast.error('All required registration fields must be completed');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error('Security passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          badgeId: regBadge.trim().toUpperCase(),
          email: regEmail.trim(),
          supervisor: regSupervisor,
          role: regRole,
          password: regPassword,
          facilityNode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      login({ user: data.user, token: data.token });
      toast.success(data.message || 'Operator clearance granted');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const triggerBarcodeScan = () => {
    setIdentifier('OP-88219');
    setPin('StockSense2026!');
    toast.success('Barcode Badge Scanned: OP-88219 (Marcus Vance)');
  };

  const triggerNfcTap = () => {
    setIdentifier('supervisor@stocksense.io');
    setPin('StockSense2026!');
    toast.success('YubiKey NFC Key Tap Detected: Authenticated as Priya Sharma');
    setTimeout(() => handleSignIn(), 500);
  };

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-[#e5e2e3] font-sans antialiased flex flex-col justify-between selection:bg-[#22d3ee] selection:text-[#00363e]">
      {/* Top Application Bar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#131314]/90 backdrop-blur-xl border-b border-[#3c494c]/20">
        <div className="h-16 w-full px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#22d3ee]/10 border border-[#22d3ee]/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#22d3ee] text-[20px]">
                  inventory_2
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white tracking-tight leading-none">
                  StockSense
                </span>
                <span className="font-mono text-[10px] text-[#859397] uppercase tracking-wider mt-0.5">
                  Core Engine v2.4
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-[#3c494c]/30">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1c1b1c] text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4] animate-pulse"></span>
                <span className="text-[#45dfa4]">NODE-WH-01: ONLINE</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1c1b1c] text-xs font-mono">
                <span className="text-[#859397]">LATENCY</span>
                <span className="text-[#22d3ee]">14ms</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1c1b1c] text-xs font-mono">
                <span className="text-[#859397]">HUB</span>
                <span className="text-[#bbc9cd]">Austin, TX</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1c1b1c] border border-[#3c494c]/20 text-xs font-mono">
              <span className="material-symbols-outlined text-[14px] text-[#45dfa4]">
                verified_user
              </span>
              <span className="text-[#bbc9cd]">SOC2 / ISO-27001</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1c1b1c] border border-[#3c494c]/20 text-xs font-mono">
              <span className="material-symbols-outlined text-[14px] text-[#859397]">
                lan
              </span>
              <span className="text-[#e5e2e3]">WH-01 [AUSTIN]</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dual-Column Authentication Matrix */}
      <main className="w-full pt-20 pb-8 flex-1 flex flex-col justify-center">
        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-8 py-6">
          {/* Top System Telemetry Bar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-6 px-1 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#45dfa4] animate-pulse"></span>
              <span className="text-[#45dfa4] font-medium tracking-wide">
                GATEWAY SECURITY LEVEL 4: ENFORCED
              </span>
              <span className="text-[#3c494c]">/</span>
              <span className="text-[#859397] hidden sm:inline">
                INGRESS TERMINAL: TERM-WH01-ING-09
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#859397]">TIME SYNCHRONIZED</span>
              <span className="text-[#22d3ee] bg-[#2a2a2b] px-2 py-0.5 rounded">
                {utcTime || '14:28:09.102 UTC'}
              </span>
              <span className="text-[#45dfa4] bg-[#1c1b1c] px-2 py-0.5 rounded hidden md:inline">
                JWT / ED25519 VERIFIED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Brand Showcase & Telemetry Matrix (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#1c1b1c] border border-[#3c494c]/30 rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#22d3ee]/10 blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col gap-6">
                {/* Hub Architecture Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#201f20] border border-[#3c494c]/30">
                      <span className="material-symbols-outlined text-[14px] text-[#22d3ee]">dns</span>
                      <span className="font-mono text-xs text-[#22d3ee] uppercase">Core Engine v2.4</span>
                    </div>
                    <span className="font-mono text-xs text-[#45dfa4] flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#45dfa4]"></span> 99.998% UPTIME
                    </span>
                  </div>

                  <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight pt-1">
                    Industrial Asset Ingress Portal
                  </h1>
                  <p className="text-xs lg:text-sm text-[#859397] leading-relaxed">
                    Centralized cryptographic access point for inventory nodes, automated retrieval cranes, and floor verification terminals.
                  </p>
                </div>

                {/* Node Status Card */}
                <div className="bg-[#131314] rounded-xl p-4 border border-[#3c494c]/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#3c494c]/20">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#22d3ee]">hub</span>
                      <span className="font-medium text-sm text-[#e5e2e3]">Austin Central Hub (WH-01)</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#45dfa4] bg-[#45dfa4]/10 border border-[#45dfa4]/20 px-2 py-0.5 rounded">
                      ONLINE
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="bg-[#1c1b1c] p-2 rounded-lg border border-[#3c494c]/20">
                      <span className="text-[10px] text-[#859397] uppercase">Cluster Sync</span>
                      <div className="text-xs font-semibold text-[#22d3ee] mt-0.5">12ms</div>
                    </div>
                    <div className="bg-[#1c1b1c] p-2 rounded-lg border border-[#3c494c]/20">
                      <span className="text-[10px] text-[#859397] uppercase">Recon Discrep</span>
                      <div className="text-xs font-semibold text-[#45dfa4] mt-0.5">0 UNITS</div>
                    </div>
                    <div className="bg-[#1c1b1c] p-2 rounded-lg border border-[#3c494c]/20">
                      <span className="text-[10px] text-[#859397] uppercase">Ingress Node</span>
                      <div className="text-xs font-semibold text-white mt-0.5">GATE-09</div>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs font-mono text-[#859397]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-[#22d3ee]">account_tree</span>
                      <span>Merkle Root:</span>
                      <span className="text-[#bbc9cd]">0x89f2...4c21</span>
                    </div>
                    <span className="text-[#45dfa4] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span> Validated
                    </span>
                  </div>
                </div>

                {/* Security Highlights */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#201f20] border border-[#3c494c]/30 flex items-center justify-center shrink-0 text-[#22d3ee]">
                      <span className="material-symbols-outlined text-[18px]">badge</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">Zero-Trust Role-Based Access (RBAC)</div>
                      <p className="text-[11px] text-[#859397]">
                        Real-time zone assignment for Floor Operators, Shift Supervisors, and Inventory Auditors.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#201f20] border border-[#3c494c]/30 flex items-center justify-center shrink-0 text-[#22d3ee]">
                      <span className="material-symbols-outlined text-[18px]">nfc</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">Hardware Key & Scanner Badge Enforced</div>
                      <p className="text-[11px] text-[#859397]">
                        FIDO2 / WebAuthn, YubiKey Series 5, and Zebra scanner barcode badge support.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#201f20] border border-[#3c494c]/30 flex items-center justify-center shrink-0 text-[#22d3ee]">
                      <span className="material-symbols-outlined text-[18px]">history_edu</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">Cryptographic Session Ledger</div>
                      <p className="text-[11px] text-[#859397]">
                        All operations, physical counts, and ledger writes are verified with SHA-256 signatures.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Zone Telemetry Strip */}
              <div className="relative z-10 mt-6 pt-4 bg-[#131314] rounded-xl p-3.5 border border-[#3c494c]/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-white">
                    <span className="material-symbols-outlined text-[16px] text-[#45dfa4]">sensors</span>
                    <span className="uppercase font-medium">Active Zone Telemetry</span>
                  </div>
                  <span className="text-[#22d3ee]">14 Operators Synced</span>
                </div>

                <div className="flex items-center gap-1.5 h-6">
                  <div className="flex-1 h-full bg-[#45dfa4]/20 hover:bg-[#45dfa4]/40 rounded flex items-center justify-center font-mono text-[9px] text-[#45dfa4] font-bold">
                    A1
                  </div>
                  <div className="flex-1 h-full bg-[#45dfa4]/20 hover:bg-[#45dfa4]/40 rounded flex items-center justify-center font-mono text-[9px] text-[#45dfa4] font-bold">
                    A2
                  </div>
                  <div className="flex-1 h-full bg-[#22d3ee]/20 hover:bg-[#22d3ee]/40 rounded flex items-center justify-center font-mono text-[9px] text-[#22d3ee] font-bold">
                    B1
                  </div>
                  <div className="flex-1 h-full bg-[#45dfa4]/20 hover:bg-[#45dfa4]/40 rounded flex items-center justify-center font-mono text-[9px] text-[#45dfa4] font-bold">
                    B2
                  </div>
                  <div className="flex-1 h-full bg-[#3c494c]/30 rounded flex items-center justify-center font-mono text-[9px] text-[#859397]">
                    C1
                  </div>
                  <div className="flex-1 h-full bg-[#45dfa4]/20 hover:bg-[#45dfa4]/40 rounded flex items-center justify-center font-mono text-[9px] text-[#45dfa4] font-bold">
                    D-IN
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#859397]">
                  <span>Sub-GHz Real-Time Mesh</span>
                  <span className="text-[#45dfa4]">High-Throughput Zone A/B</span>
                </div>
              </div>
            </div>

            {/* Right Column: Authentication Card & Registration System (7 cols) */}
            <div className="lg:col-span-7 bg-[#1c1b1c] border border-[#3c494c]/30 rounded-2xl p-6 lg:p-8 flex flex-col justify-between shadow-2xl relative">
              <div className="space-y-6">
                {/* Tab Switcher */}
                <div className="w-full flex items-center bg-[#131314] p-1 rounded-xl border border-[#3c494c]/30">
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'signin'
                        ? 'bg-[#201f20] text-[#22d3ee] shadow-sm'
                        : 'text-[#859397] hover:text-[#e5e2e3]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">login</span>
                    <span>Operator Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'register'
                        ? 'bg-[#201f20] text-[#22d3ee] shadow-sm'
                        : 'text-[#859397] hover:text-[#e5e2e3]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">how_to_reg</span>
                    <span>Request Terminal Access</span>
                  </button>
                </div>

                {/* Quick 1-Click Demo Accounts Strip */}
                <div className="p-3 bg-[#131314] rounded-xl border border-[#3c494c]/20 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#859397]">
                    <span className="flex items-center gap-1 text-[#22d3ee]">
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      Quick Demo Operator Login:
                    </span>
                    <span>Click to auto-fill credentials</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectDemoUser('Supervisor')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#201f20] hover:bg-[#2a2a2b] border border-[#3c494c]/30 text-left transition-colors"
                    >
                      <div className="text-[11px] font-semibold text-white">Priya Sharma</div>
                      <div className="text-[10px] font-mono text-[#45dfa4]">Lead Supervisor</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDemoUser('Operator')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#201f20] hover:bg-[#2a2a2b] border border-[#3c494c]/30 text-left transition-colors"
                    >
                      <div className="text-[11px] font-semibold text-white">Marcus Vance</div>
                      <div className="text-[10px] font-mono text-[#22d3ee]">Floor Operator</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDemoUser('Auditor')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#201f20] hover:bg-[#2a2a2b] border border-[#3c494c]/30 text-left transition-colors"
                    >
                      <div className="text-[11px] font-semibold text-white">Elena Rostova</div>
                      <div className="text-[10px] font-mono text-[#ffd2d0]">Stock Auditor</div>
                    </button>
                  </div>
                </div>

                {/* VIEW 1: OPERATOR SIGN IN */}
                {activeTab === 'signin' && (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    {/* Facility Node Selector */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[11px] font-mono uppercase text-[#859397]">
                          Target Facility Node & Partition
                        </label>
                        <span className="font-mono text-[11px] text-[#45dfa4] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4]"></span>
                          4ms Low Latency
                        </span>
                      </div>
                      <select
                        value={facilityNode}
                        onChange={(e) => setFacilityNode(e.target.value)}
                        className="w-full bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 p-2.5 focus:border-[#22d3ee] focus:outline-none"
                      >
                        <option value="Austin Central Hub (WH-01)">
                          Austin Central Hub (WH-01) — Partition A-West (Primary Active)
                        </option>
                        <option value="East Logistics Hub (WH-02)">
                          East Logistics Hub (WH-02) — Bulk Overflow Facility
                        </option>
                      </select>
                    </div>

                    {/* Operator Identity / Email */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[11px] font-mono uppercase text-[#e5e2e3]">
                          Operator Identity / Email <span className="text-[#22d3ee]">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={triggerBarcodeScan}
                          className="flex items-center gap-1 font-mono text-[11px] text-[#22d3ee] hover:underline"
                        >
                          <span className="material-symbols-outlined text-[14px]">barcode_scanner</span>
                          <span>Scan Badge (⌘B)</span>
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#859397]">
                          <span className="material-symbols-outlined text-[18px]">badge</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="e.g. supervisor@stocksense.io or OP-88219"
                          className="w-full pl-10 pr-24 py-2.5 bg-[#131314] text-xs font-mono text-[#e5e2e3] placeholder:text-[#859397] rounded-lg border border-[#3c494c]/40 focus:border-[#22d3ee] focus:outline-none"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-mono text-[#859397]">
                          Badge / SSO
                        </div>
                      </div>
                    </div>

                    {/* Security PIN / Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[11px] font-mono uppercase text-[#e5e2e3]">
                          Security PIN / Master Password <span className="text-[#22d3ee]">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => toast.info('Default password for demo accounts is: StockSense2026!')}
                          className="text-[11px] font-mono text-[#859397] hover:text-[#22d3ee]"
                        >
                          Forgot PIN?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#859397]">
                          <span className="material-symbols-outlined text-[18px]">password</span>
                        </div>
                        <input
                          type={showPin ? 'text' : 'password'}
                          required
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-10 py-2.5 bg-[#131314] text-xs font-mono text-[#e5e2e3] placeholder:text-[#859397] rounded-lg border border-[#3c494c]/40 focus:border-[#22d3ee] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#859397] hover:text-white"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showPin ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Session Persistence */}
                    <div className="flex items-start justify-between bg-[#131314] p-3 rounded-lg border border-[#3c494c]/20 text-xs">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="remember-shift"
                          checked={rememberShift}
                          onChange={(e) => setRememberShift(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded bg-[#1c1b1c] accent-[#22d3ee] cursor-pointer"
                        />
                        <div>
                          <label htmlFor="remember-shift" className="font-medium text-[#e5e2e3] cursor-pointer">
                            Retain terminal session for 12-hour operational shift
                          </label>
                          <p className="text-[10px] font-mono text-[#859397]">
                            Cryptographic JWT signed with 43,200s validity window.
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-[#859397]">timer</span>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-[#22d3ee] hover:bg-[#8aebff] text-[#00363e] font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99] disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {loading ? 'sync' : 'encrypted'}
                      </span>
                      <span>
                        {loading ? 'Validating Token & Ingressing...' : 'Authenticate & Ingress Terminal →'}
                      </span>
                    </button>

                    {/* Hardware Bypass Options */}
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-[#3c494c]/30"></div>
                        <span className="text-[10px] font-mono uppercase text-[#859397]">
                          Fast Hardware Bypass
                        </span>
                        <div className="flex-1 h-px bg-[#3c494c]/30"></div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={triggerNfcTap}
                          className="flex items-center justify-between p-2.5 bg-[#131314] hover:bg-[#201f20] border border-[#3c494c]/30 rounded-lg transition-colors group text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-[#22d3ee]">
                              contactless
                            </span>
                            <div>
                              <div className="text-xs font-medium text-white">Tap NFC / FIDO2</div>
                              <div className="text-[10px] font-mono text-[#859397]">YubiKey • Badge</div>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-[16px] text-[#859397] group-hover:text-[#22d3ee]">
                            navigate_next
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            toast.success('Enterprise SSO SAML handshake simulated.');
                            handleSelectDemoUser('Supervisor');
                          }}
                          className="flex items-center justify-between p-2.5 bg-[#131314] hover:bg-[#201f20] border border-[#3c494c]/30 rounded-lg transition-colors group text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-[#45dfa4]">
                              corporate_fare
                            </span>
                            <div>
                              <div className="text-xs font-medium text-white">Enterprise SSO</div>
                              <div className="text-[10px] font-mono text-[#859397]">Okta • Azure AD</div>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-[16px] text-[#859397] group-hover:text-[#45dfa4]">
                            navigate_next
                          </span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* VIEW 2: REQUEST ACCESS / REGISTRATION */}
                {activeTab === 'register' && (
                  <form onSubmit={handleRegister} className="space-y-3.5">
                    <div className="p-3 bg-[#131314] rounded-lg border border-[#3c494c]/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-[#45dfa4]">
                          verified
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-white">
                            Operator Clearance Registration
                          </div>
                          <div className="text-[10px] text-[#859397]">
                            Requires dual-signoff by Shift Lead and Facility Safety Officer.
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-[#22d3ee] bg-[#22d3ee]/10 px-2 py-0.5 rounded border border-[#22d3ee]/20">
                        WH-01 GATE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-[#e5e2e3]">
                          Full Name <span className="text-[#22d3ee]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. David Miller"
                          className="w-full p-2 bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 focus:border-[#22d3ee] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-[#e5e2e3]">
                          Badge ID / Pin <span className="text-[#22d3ee]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regBadge}
                          onChange={(e) => setRegBadge(e.target.value)}
                          placeholder="e.g. OP-99104"
                          className="w-full p-2 bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 focus:border-[#22d3ee] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-[#e5e2e3]">
                          Enterprise Email <span className="text-[#22d3ee]">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="d.miller@stocksense.io"
                          className="w-full p-2 bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 focus:border-[#22d3ee] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-[#e5e2e3]">
                          Clearance Role <span className="text-[#22d3ee]">*</span>
                        </label>
                        <select
                          value={regRole}
                          onChange={(e) => setRegRole(e.target.value as any)}
                          className="w-full p-2 bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 focus:border-[#22d3ee] focus:outline-none"
                        >
                          <option value="Operator">Floor Operator (Receipts & Dispatches)</option>
                          <option value="Supervisor">Shift Supervisor (Full Operations & Override)</option>
                          <option value="Auditor">Inventory Auditor (Cycle Counts & Reconcile)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-[#e5e2e3]">
                          Password PIN <span className="text-[#22d3ee]">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full p-2 bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 focus:border-[#22d3ee] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-[#e5e2e3]">
                          Confirm Password <span className="text-[#22d3ee]">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full p-2 bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 focus:border-[#22d3ee] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono uppercase text-[#859397]">
                        Shift Supervisor Approver
                      </label>
                      <input
                        type="text"
                        value={regSupervisor}
                        onChange={(e) => setRegSupervisor(e.target.value)}
                        className="w-full p-2 bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 focus:border-[#22d3ee] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-[#45dfa4] hover:bg-[#68fcbf] text-[#003825] font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99] disabled:opacity-50 mt-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {loading ? 'sync' : 'badge'}
                      </span>
                      <span>
                        {loading ? 'Registering Operator...' : 'Submit Clearance & Register →'}
                      </span>
                    </button>
                  </form>
                )}
              </div>

              {/* Bottom Security Note */}
              <div className="pt-6 border-t border-[#3c494c]/20 flex items-center justify-between text-[11px] font-mono text-[#859397]">
                <span>StockSense TLS 1.3 Strict Ingress</span>
                <span className="text-[#22d3ee]">Supabase JWT Protected</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
