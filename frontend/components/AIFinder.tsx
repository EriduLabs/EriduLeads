import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon, UploadIcon, DocumentIcon } from './Icons';
import { Lead } from '../types';

interface AIFinderProps {
  onFindLeads: (area: string, industry: string) => Promise<void>;
  onImportLeads: (leads: Lead[]) => void;
}

// Simple CSV parser
const parseCSV = (str: string) => {
  const result = [];
  let row: string[] = [];
  let inQuotes = false;
  let val = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(val);
      val = '';
    } else if (char === '\n' && !inQuotes) {
      row.push(val);
      result.push(row);
      row = [];
      val = '';
    } else {
      val += char;
    }
  }
  row.push(val);
  result.push(row);
  
  const headers = result[0].map(h => h.trim().replace(/^"|"$/g, ''));
  return result.slice(1).filter(r => r.join('').trim() !== '').map(row => {
    const obj: any = {};
    headers.forEach((h, i) => {
        obj[h] = row[i] ? row[i].trim().replace(/^"|"$/g, '') : '';
    });
    return obj;
  });
};

const AIFinder: React.FC<AIFinderProps> = ({ onFindLeads, onImportLeads }) => {
  const navigate = useNavigate();
  const [area, setArea] = useState('Harrisburg, PA');
  const [industry, setIndustry] = useState('Local (Small/Medium Businesses)');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const industries = [
    "Local (Small/Medium Businesses)",
    "Construction / Trades",
    "HVAC / Plumbing",
    "Logistics / Transportation",
    "Property Management",
    "Healthcare / Clinics",
    "Professional Services",
    "Landscaping / Outdoor",
    "Manufacturing"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !industry) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await onFindLeads(area, industry);
      navigate('/'); // Redirect to dashboard on success
    } catch (err: any) {
      setError(err.message || 'Failed to generate leads. Check API key or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      try {
        let parsedData: any[] = [];
        if (file.name.endsWith('.json')) {
          parsedData = JSON.parse(text);
          if (!Array.isArray(parsedData)) {
            parsedData = [parsedData];
          }
        } else if (file.name.endsWith('.csv')) {
          parsedData = parseCSV(text);
        } else {
          throw new Error("Unsupported file format. Please upload .csv or .json");
        }

        const importedLeads: Lead[] = parsedData.map(data => ({
          id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          companyName: data.companyName || data.Company || data.company || 'Unknown Company',
          category: data.category || data.Industry || data.industry || 'Imported Lead',
          location: data.location || data.Location || data.city || 'Unknown Location',
          description: data.description || data.Description || 'Imported from spreadsheet.',
          phone: data.phone || data.Phone || '',
          email: data.email || data.Email || '',
          painPoint: data.painPoint || data['Pain Point'] || data.pain_point || 'Needs analysis to determine operational bottlenecks.',
          pitchTitle: data.pitchTitle || data['Pitch Title'] || 'Custom Automation Solution',
          pitchText: data.pitchText || data['Pitch Text'] || 'I noticed your business and believe we can streamline your operations. Let\'s connect.',
          status: 'New Lead',
          colorHint: ['blue', 'green', 'purple', 'orange', 'yellow'][Math.floor(Math.random() * 5)],
          yearsOperational: data.yearsOperational || data['Years Operational'] || '',
          currentStandings: data.currentStandings || data['Current Standings'] || '',
          businessReview: data.businessReview || data['Business Review'] || ''
        }));

        onImportLeads(importedLeads);
        navigate('/');
      } catch (err: any) {
        setError("Failed to parse file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto mt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Lead Generation & Import</h1>
        <p className="text-slate-400">Deploy AI to scout your target area, or upload your own spreadsheets to populate your pipeline.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* AI Scout Card */}
        <div className="bg-slate-900 rounded-xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <SparklesIcon className="w-6 h-6 text-brand-400" />
            <h2 className="text-2xl font-bold text-white">Agentic Scout</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Target Area</label>
              <input 
                type="text" 
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g., Austin, TX or 17036"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors"
                required
              />
              <p className="text-xs text-slate-500 mt-2">Enter a city, state, or zip code.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Industry / Niche</label>
              <select 
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-brand-500 transition-colors"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                required
              >
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">Select "Local" for a general sweep of small/medium businesses.</p>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 disabled:border text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-brand-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scouting Area...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Find Leads
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bulk Import Card */}
        <div className="bg-slate-900 rounded-xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <UploadIcon className="w-6 h-6 text-brand-400" />
            <h2 className="text-2xl font-bold text-white">Bulk Import</h2>
          </div>
          <p className="text-slate-400 mb-8">Upload your own spreadsheets (CSV) or JSON data to populate your lead pipeline instantly.</p>
          
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-brand-500 transition-colors bg-slate-950/50 flex-1 flex flex-col items-center justify-center">
            <DocumentIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-sm text-slate-300 mb-6">Drag and drop your file here, or click to browse.</p>
            <input 
              type="file" 
              accept=".csv,.json" 
              onChange={handleFileUpload} 
              className="hidden" 
              id="file-upload"
            />
            <label 
              htmlFor="file-upload" 
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-2.5 px-8 rounded-lg cursor-pointer transition-colors inline-block"
            >
              Browse Files
            </label>
          </div>
          
          <div className="mt-6 text-xs text-slate-500 bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
            <p className="font-semibold text-slate-400 mb-1">Supported formats: .csv, .json</p>
            <p>Recommended CSV headers: <span className="text-slate-400">companyName, category, location, phone, email, painPoint</span></p>
          </div>
        </div>

      </div>

      {error && (
        <div className="mt-6 text-sm text-red-400 bg-red-400/10 p-4 rounded-lg border border-red-400/20">
          {error}
        </div>
      )}
    </div>
  );
};

export default AIFinder;
