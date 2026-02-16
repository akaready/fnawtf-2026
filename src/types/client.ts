/**
 * Client types for portfolio and proposals
 */

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  logo_url?: string;
  notes?: string;
  created_at: string;
}

export interface ClientLogo {
  id: string;
  name: string;
  logo_url: string;
}
