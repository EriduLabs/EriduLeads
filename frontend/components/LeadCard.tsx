import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { PhoneIcon, MailIcon, GlobeIcon, EyeIcon, TrashIcon } from './Icons';

interface LeadCardProps {
  lead: Lead;
  onViewPitch: (lead: Lead) => void;
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
  onDelete: (id: string) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onViewPitch, onStatusChange, onDelete }) => {
  const [isPainPointExpanded, setIsPainPointExpanded] = useState(false);

  const getColorClasses = (hint?: string) => {
    switch (hint) {
      case 'orange': return 'text-orange-400 bg-orange-400/10';
      case 'blue': return 'text-blue-400 bg-blue-400/10';
      case 'purple': return 'text-purple-400 bg-purple-400/10';
      case 'green': return 'text-green-400 bg-green-400/10';
      case 'yellow': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const statuses: LeadStatus[] = [
    'New Lead', 'Contacted', 'Follow Up', 'Meeting Set', 'Proposal Sent', 'Closed Won', 'Closed Lost'
  ];

  // Helper to determine if email is an actual email or a website form
  const isEmail = lead.email.includes('@');
  const cleanPhone = lead.phone.replace(/[^0-9+]/g, '');

  const getHostname = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname.replace('www.', '');
    } catch (e) {
      return urlStr;
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col relative group shadow-sm hover:shadow-md transition-shadow">
      
      {/* Delete Button (shows on hover) */}
      <button 
        onClick={() => onDelete(lead.id)}
        className="absolute top-3 right-3 p-1.5 bg-red-500/10 text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 z-10"
        title="Delete Lead"
      >
        <TrashIcon className="w-4 h-4" />
      </button>

      <div className="p-5 flex-1 flex flex-col">
        
        {/* Header: Category & Location */}
        <div className="flex justify-between items-start mb-4 gap-3 pr-6">
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded break-words max-w-full ${getColorClasses(lead.colorHint)}`}>
              {lead.category}
            </span>
          </div>
          <span className="text-xs text-slate-400 shrink-0 mt-1">{lead.location}</span>
        </div>
        
        {/* Company Info */}
        <h3 className="text-xl font-bold text-white mb-2">{lead.companyName}</h3>
        <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">{lead.description}</p>
        
        {/* Contact Info */}
        <div className="space-y-2 text-sm mb-5">
          <div className="flex items-center gap-3">
            <PhoneIcon className="w-4 h-4 text-slate-500 shrink-0" />
            <a href={`tel:${cleanPhone}`} className="text-slate-300 hover:text-brand-400 transition-colors">
              {lead.phone}
            </a>
          </div>
          <div className="flex items-center gap-3">
            {isEmail ? <MailIcon className="w-4 h-4 text-slate-500 shrink-0" /> : <GlobeIcon className="w-4 h-4 text-slate-500 shrink-0" />}
            {isEmail ? (
              <a href={`mailto:${lead.email}`} className="text-slate-300 hover:text-brand-400 transition-colors truncate">
                {lead.email}
              </a>
            ) : (
              <a href={lead.email.startsWith('http') ? lead.email : `https://${lead.email}`} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-brand-400 transition-colors truncate">
                {lead.email}
              </a>
            )}
          </div>
        </div>

        {/* New Fields: Business Review & Stats */}
        <div className="mb-5">
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="bg-slate-800/40 p-2.5 rounded border border-slate-700/50">
              <span className="block text-slate-500 mb-1 uppercase tracking-wider text-[9px] font-bold">Operational</span>
              <span className="text-slate-300 font-medium">{lead.yearsOperational || 'N/A'}</span>
            </div>
            <div className="bg-slate-800/40 p-2.5 rounded border border-slate-700/50">
              <span className="block text-slate-500 mb-1 uppercase tracking-wider text-[9px] font-bold">Standing</span>
              <span className="text-slate-300 font-medium truncate block" title={lead.currentStandings}>{lead.currentStandings || 'N/A'}</span>
            </div>
          </div>
          {lead.businessReview && (
            <div className="border-l-2 border-brand-500/30 pl-3 py-1">
              <p className="text-xs text-slate-400 italic leading-relaxed">
                "{lead.businessReview}"
              </p>
            </div>
          )}
        </div>

        {/* Expandable Pain Point */}
        <div 
          className="bg-slate-950/50 rounded-lg p-4 border border-slate-800/50 mb-5 cursor-pointer hover:border-slate-700 transition-colors group/painpoint"
          onClick={() => setIsPainPointExpanded(!isPainPointExpanded)}
        >
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operational Pain Point</p>
            <span className="text-[10px] text-brand-400 opacity-0 group-hover/painpoint:opacity-100 transition-opacity">
              {isPainPointExpanded ? 'Show Less' : 'Read More'}
            </span>
          </div>
          <p className={`text-sm text-slate-300 leading-relaxed transition-all duration-300 ${isPainPointExpanded ? '' : 'line-clamp-3'}`}>
            {lead.painPoint}
          </p>
        </div>

        {/* Verified Sources (from Google Search Grounding) */}
        {lead.sourceUrls && lead.sourceUrls.length > 0 && (
          <div className="mb-5 mt-auto">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Verified Sources</p>
            <div className="flex flex-wrap gap-2">
              {lead.sourceUrls.slice(0, 3).map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-400 hover:text-brand-300 truncate max-w-[150px] block bg-brand-400/10 px-2 py-1 rounded border border-brand-400/20">
                  {getHostname(url)}
                </a>
              ))}
              {lead.sourceUrls.length > 3 && (
                <span className="text-[10px] text-slate-500 px-2 py-1">+{lead.sourceUrls.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {/* Status Selector */}
        <div className={!lead.sourceUrls || lead.sourceUrls.length === 0 ? "mt-auto" : ""}>
           <select 
              value={lead.status}
              onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
              className="w-full text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-200 p-2.5 appearance-none cursor-pointer outline-none focus:border-brand-500 transition-colors"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
           >
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
           </select>
        </div>
      </div>
      
      {/* Action Footer */}
      <div className="p-4 pt-0 shrink-0">
        <button 
          onClick={() => onViewPitch(lead)} 
          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 text-sm"
        >
          <EyeIcon className="w-4 h-4" />
          View Pitch Angle
        </button>
      </div>
    </div>
  );
};

export default LeadCard;
