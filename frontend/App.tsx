import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Lead, LeadStatus, PitchModalData } from './types';
import { INITIAL_LEADS } from './constants';
import { generateAgenticLeads } from './services/geminiService';
import LeadCard from './components/LeadCard';
import PitchModal from './components/PitchModal';
import AIFinder from './components/AIFinder';
import { LightningIcon, HomeIcon, SearchIcon, BookIcon } from './components/Icons';

// Inner component to use router hooks
const AppContent: React.FC = () => {
  const location = useLocation();
  
  // Robust lazy initialization to prevent race conditions with localStorage
  // This ensures leads are loaded synchronously on mount and never overwritten by a delayed effect.
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const savedLeads = localStorage.getItem('eridulabs_leads');
      if (savedLeads) {
        const parsed = JSON.parse(savedLeads);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse leads from local storage", e);
    }
    return INITIAL_LEADS;
  });

  const [modalData, setModalData] = useState<PitchModalData>({ isOpen: false, title: '', text: '' });
  const [filter, setFilter] = useState<LeadStatus | 'All'>('All');

  // Reset filter on route change
  useEffect(() => {
    setFilter('All');
  }, [location.pathname]);

  // Save to localStorage whenever leads change
  useEffect(() => {
    localStorage.setItem('eridulabs_leads', JSON.stringify(leads));
  }, [leads]);

  // Sync across multiple tabs if the user has the app open in several windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'eridulabs_leads' && e.newValue) {
        try {
          setLeads(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse leads from storage sync");
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handlers
  const handleStatusChange = useCallback((id: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, status: newStatus } : lead
    ));
  }, []);

  const handleDeleteLead = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      setLeads(prev => prev.filter(lead => lead.id !== id));
    }
  }, []);

  const handleViewPitch = useCallback((lead: Lead) => {
    setModalData({
      isOpen: true,
      title: lead.pitchTitle,
      text: lead.pitchText,
      leadId: lead.id
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalData(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleMarkContacted = useCallback((leadId: string) => {
    handleStatusChange(leadId, 'Contacted');
  }, [handleStatusChange]);

  const handleFindNewLeads = async (area: string, industry: string) => {
    const newLeads = await generateAgenticLeads(area, industry);
    // Append new leads to the existing list
    setLeads(prev => [...newLeads, ...prev]);
  };

  const handleImportLeads = (importedLeads: Lead[]) => {
    // Append imported leads to the existing list
    setLeads(prev => [...importedLeads, ...prev]);
  };

  // Derived state
  const activeLeads = leads.filter(l => l.status !== 'Closed Won' && l.status !== 'Closed Lost');
  const catalogLeads = leads.filter(l => l.status === 'Closed Won' || l.status === 'Closed Lost');

  const filteredActiveLeads = filter === 'All' ? activeLeads : activeLeads.filter(l => l.status === filter);
  const filteredCatalogLeads = filter === 'All' ? catalogLeads : catalogLeads.filter(l => l.status === filter);

  const renderLeadGrid = (leadsToRender: Lead[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
      {leadsToRender.map(lead => (
        <LeadCard 
          key={lead.id} 
          lead={lead} 
          onViewPitch={handleViewPitch}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteLead}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation */}
      <header className="bg-slate-950 border-b border-slate-800 p-4 shrink-0 z-20 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">EriduLabs <span className="text-brand-500">Lead Tracker</span></h1>
            <p className="text-xs text-slate-400 mt-1">Target Area: Harrisburg, Hershey, Hummelstown PA</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto min-w-0">
            {/* Navigation Tabs - Added no-scrollbar class to hide the scrollbar while allowing touch/trackpad scrolling */}
            <nav className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full no-scrollbar shrink-0">
              <NavLink 
                to="/" 
                className={({isActive}) => `flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <HomeIcon className="w-4 h-4" />
                Dashboard
              </NavLink>
              <NavLink 
                to="/catalog" 
                className={({isActive}) => `flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <BookIcon className="w-4 h-4" />
                Catalog
              </NavLink>
              <NavLink 
                to="/find" 
                className={({isActive}) => `flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <SearchIcon className="w-4 h-4" />
                Find Leads
              </NavLink>
            </nav>

            {/* Status Pill (Only show on dashboard) */}
            {location.pathname === '/' && (
              <div className="bg-slate-900 text-sm py-1.5 px-3 rounded-full border border-slate-800 flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-slate-300">{activeLeads.length} Leads Ready</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8 w-full relative bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={
              <>
                {/* Strategy Section */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 mb-8 shadow-sm">
                  <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <LightningIcon className="w-5 h-5 text-brand-400" />
                    Execution Strategy
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Do not pitch "AI" or "Software." Pitch <strong>Time</strong> and <strong>Operational Order</strong>. These businesses are bleeding hours to manual dispatching, overlapping routes, and messy spreadsheets. Walk in or call, ask for the owner/manager, and tell them you build custom automation tools to fix their exact bottleneck. Offer a free 5-minute mockup.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex justify-end mb-6">
                  <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="bg-slate-900 text-sm text-slate-300 py-2 px-4 rounded-lg border border-slate-800 outline-none focus:border-brand-500 appearance-none cursor-pointer shadow-sm"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    <option value="All">All Active Leads</option>
                    <option value="New Lead">New Leads</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Meeting Set">Meeting Set</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                  </select>
                </div>

                {/* Leads Grid */}
                {filteredActiveLeads.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="text-slate-400 mb-4">No active leads found for this filter.</p>
                    <NavLink to="/find" className="text-brand-400 hover:text-brand-300 font-medium">
                      Go find some leads &rarr;
                    </NavLink>
                  </div>
                ) : (
                  renderLeadGrid(filteredActiveLeads)
                )}
              </>
            } />
            
            <Route path="/catalog" element={
              <>
                {/* Catalog Header */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 mb-8 shadow-sm">
                  <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <BookIcon className="w-5 h-5 text-brand-400" />
                    Lead Catalog
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    This is your historical archive of completed deals. Review your Closed Won and Closed Lost leads here to analyze past performance and refine your future pitch strategies.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex justify-end mb-6">
                  <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="bg-slate-900 text-sm text-slate-300 py-2 px-4 rounded-lg border border-slate-800 outline-none focus:border-brand-500 appearance-none cursor-pointer shadow-sm"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    <option value="All">All Closed Leads</option>
                    <option value="Closed Won">Closed Won</option>
                    <option value="Closed Lost">Closed Lost</option>
                  </select>
                </div>

                {/* Leads Grid */}
                {filteredCatalogLeads.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="text-slate-400 mb-4">No closed leads found in the catalog.</p>
                  </div>
                ) : (
                  renderLeadGrid(filteredCatalogLeads)
                )}
              </>
            } />

            <Route path="/find" element={<AIFinder onFindLeads={handleFindNewLeads} onImportLeads={handleImportLeads} />} />
          </Routes>
        </div>
      </main>

      {/* Modals */}
      <PitchModal 
        data={modalData} 
        onClose={handleCloseModal} 
        onMarkContacted={handleMarkContacted}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
