export type LeadStatus = 
  | 'New Lead' 
  | 'Contacted' 
  | 'Follow Up' 
  | 'Meeting Set' 
  | 'Proposal Sent' 
  | 'Closed Won' 
  | 'Closed Lost';

export interface Lead {
  id: string;
  companyName: string;
  category: string;
  location: string;
  description: string;
  phone: string;
  email: string;
  painPoint: string;
  pitchTitle: string;
  pitchText: string;
  status: LeadStatus;
  colorHint?: string; // e.g., 'orange', 'blue', 'purple' for UI styling
  
  // New fields
  yearsOperational?: string;
  currentStandings?: string;
  businessReview?: string;
  sourceUrls?: string[]; // URLs from Google Search grounding
}

export interface PitchModalData {
  isOpen: boolean;
  title: string;
  text: string;
  leadId?: string;
}
