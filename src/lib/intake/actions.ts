'use server';

import { createServiceClient } from '@/lib/supabase/service';

export interface IntakeFormData {
  // Contact
  name: string;
  email: string;
  title?: string;
  stakeholders?: string;

  // Project basics
  company_name?: string;
  project_name: string;
  phases?: string[];
  pitch: string;
  excitement?: string;
  key_feature?: string;
  vision?: string;
  avoid?: string;
  audience?: string;
  challenge?: string;
  competitors?: string;

  // Creative
  video_links?: string;

  // Deliverables
  deliverables: string[];
  deliverable_notes?: string;

  // Timeline
  timeline: string;
  timeline_date?: string;
  timeline_notes?: string;

  // Priorities
  priority_order: string[];

  // Experience
  experience: string;
  experience_notes?: string;

  // Partners
  partners: string[];
  partner_details?: string;

  // Crowdfunding
  public_goal?: string;
  internal_goal?: string;

  // Budget
  budget?: string;

  // Email list
  email_list_size?: string;

  // Files
  file_urls: string[];

  // Additional
  anything_else?: string;
  referral?: string;
}

export async function submitIntakeForm(data: IntakeFormData) {
  const supabase = createServiceClient();

  const { error } = await supabase.from('intake_submissions').insert({
    name: data.name,
    email: data.email,
    title: data.title || null,
    stakeholders: data.stakeholders || null,
    company_name: data.company_name || null,
    project_name: data.project_name,
    phases: data.phases || [],
    pitch: data.pitch,
    excitement: data.excitement || null,
    key_feature: data.key_feature || null,
    vision: data.vision || null,
    avoid: data.avoid || null,
    audience: data.audience || null,
    challenge: data.challenge || null,
    competitors: data.competitors || null,
    video_links: data.video_links || null,
    deliverables: data.deliverables,
    deliverable_notes: data.deliverable_notes || null,
    timeline: data.timeline,
    timeline_date: data.timeline_date || null,
    timeline_notes: data.timeline_notes || null,
    priority_order: data.priority_order,
    experience: data.experience,
    experience_notes: data.experience_notes || null,
    partners: data.partners,
    partner_details: data.partner_details || null,
    public_goal: data.public_goal || null,
    internal_goal: data.internal_goal || null,
    budget: data.budget || null,
    email_list_size: data.email_list_size || null,
    file_urls: data.file_urls,
    anything_else: data.anything_else || null,
    referral: data.referral || null,
  });

  if (error) throw new Error(error.message);
}

export async function uploadIntakeFile(formData: FormData): Promise<string> {
  const supabase = createServiceClient();
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const ext = file.name.split('.').pop() || 'bin';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('intake-files')
    .upload(path, file, { upsert: false });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from('intake-files')
    .getPublicUrl(path);

  return urlData.publicUrl;
}
