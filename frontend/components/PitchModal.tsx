import React, { useState, useEffect } from 'react';
import { PitchModalData } from '../types';
import { CopyIcon, CheckIcon } from './Icons';

interface PitchModalProps {
  data: PitchModalData;
  onClose: () => void;
  onMarkContacted: (leadId: string) => void;
}

const PitchModal: React.FC<PitchModalProps> = ({ data, onClose, onMarkContacted }) => {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (data.isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [data.isOpen]);

  if (!data.isOpen && !isVisible) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleReadyToCall = () => {
    if (data.leadId) {
      onMarkContacted(data.leadId);
    }
    onClose();
  };

  return (
    <div 
      className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${data.isOpen ? 'opacity-100' : 'opacity-0'}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full transform transition-transform duration-300 ${data.isOpen ? 'scale-100' : 'scale-95'}`}>
        <div className="flex justify-between items-center p-5 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white">{data.title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6">
          <div className="bg-slate-950/50 p-5 rounded-lg border border-slate-800 mb-6 relative">
            <p className="text-slate-300 text-lg leading-relaxed italic">"{data.text}"</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleCopy} 
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 text-sm"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4" />
                  Copy Script
                </>
              )}
            </button>
            <button 
              onClick={handleReadyToCall}
              className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              Mark as Contacted
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitchModal;
