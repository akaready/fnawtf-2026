'use server';

import { createContractTemplate } from './actions';

/**
 * Seed the 4 standard contract templates into the database.
 * Idempotent — checks for existing templates by name before inserting.
 */
export async function seedContractTemplates(): Promise<{ created: string[]; skipped: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const template of getTemplates()) {
    try {
      const id = await createContractTemplate({
        name: template.name,
        contract_type: template.contract_type,
        description: template.description,
        body: template.body,
        merge_fields: template.merge_fields,
      });
      created.push(`${template.name} (${id})`);
    } catch {
      skipped.push(template.name);
    }
  }

  return { created, skipped };
}

/* ── Template Definitions ─────────────────────────────────────────────── */

function getTemplates() { return [
  // ── 1. MSA ──────────────────────────────────────────────────────────
  {
    name: 'Master Services Agreement',
    contract_type: 'msa' as const,
    description: 'Standard MSA covering all FNA engagements. Governs IP, liability, confidentiality, and payment terms.',
    merge_fields: [
      { key: 'client_name', label: 'Client Company Name', source: 'client' as const, db_path: 'name' },
      { key: 'client_address', label: 'Client Address', source: 'client' as const, db_path: 'location' },
      { key: 'client_email', label: 'Client Email', source: 'client' as const, db_path: 'email' },
      { key: 'contact_first_name', label: 'Contact First Name', source: 'contact' as const, db_path: 'first_name' },
      { key: 'contact_last_name', label: 'Contact Last Name', source: 'contact' as const, db_path: 'last_name' },
      { key: 'contact_email', label: 'Contact Email', source: 'contact' as const, db_path: 'email' },
      { key: 'contact_title', label: 'Contact Title', source: 'contact' as const, db_path: 'role' },
      { key: 'fna_entity_name', label: 'FNA Legal Entity', source: 'company' as const, db_path: 'entity_name' },
      { key: 'fna_address', label: 'FNA Address', source: 'company' as const, db_path: 'address' },
      { key: 'fna_contact_name', label: 'FNA Contact Name', source: 'company' as const, db_path: 'contact_name' },
      { key: 'fna_contact_email', label: 'FNA Contact Email', source: 'company' as const, db_path: 'contact_email' },
      { key: 'fna_contact_phone', label: 'FNA Contact Phone', source: 'company' as const, db_path: 'contact_phone' },
      { key: 'effective_date', label: 'Effective Date', source: 'manual' as const, db_path: null },
      { key: 'project_name', label: 'Project Name', source: 'manual' as const, db_path: null },
      { key: 'payment_terms_days', label: 'Payment Terms (Days)', source: 'manual' as const, db_path: null, default_value: '15' },
      { key: 'late_payment_rate', label: 'Late Payment Rate', source: 'manual' as const, db_path: null, default_value: '18% APR' },
      { key: 'cure_period_days', label: 'Cure Period (Days)', source: 'manual' as const, db_path: null, default_value: '30' },
      { key: 'deposit_percent', label: 'Deposit Percentage', source: 'manual' as const, db_path: null, default_value: '40' },
      { key: 'approval_days', label: 'Approval Period (Days)', source: 'manual' as const, db_path: null, default_value: '5' },
      { key: 'retention_days', label: 'File Retention (Days)', source: 'manual' as const, db_path: null, default_value: '365' },
      { key: 'portfolio_embargo_days', label: 'Portfolio Embargo (Days)', source: 'manual' as const, db_path: null, default_value: '0' },
    ],
    body: MSA_BODY,
  },

  // ── 2. SOW ──────────────────────────────────────────────────────────
  {
    name: 'Statement of Work',
    contract_type: 'sow' as const,
    description: 'Standard SOW attached to MSA. Covers deliverables, schedule, fees, and revision terms.',
    merge_fields: [
      { key: 'client_name', label: 'Client Company Name', source: 'client' as const, db_path: 'name' },
      { key: 'contact_first_name', label: 'Contact First Name', source: 'contact' as const, db_path: 'first_name' },
      { key: 'contact_last_name', label: 'Contact Last Name', source: 'contact' as const, db_path: 'last_name' },
      { key: 'contact_email', label: 'Contact Email', source: 'contact' as const, db_path: 'email' },
      { key: 'fna_entity_name', label: 'FNA Legal Entity', source: 'company' as const, db_path: 'entity_name' },
      { key: 'fna_contact_name', label: 'FNA Contact Name', source: 'company' as const, db_path: 'contact_name' },
      { key: 'fna_contact_email', label: 'FNA Contact Email', source: 'company' as const, db_path: 'contact_email' },
      { key: 'effective_date', label: 'Effective Date', source: 'manual' as const, db_path: null },
      { key: 'project_name', label: 'Project Name', source: 'manual' as const, db_path: null },
      { key: 'project_code', label: 'Project Code', source: 'manual' as const, db_path: null },
      { key: 'quote_total', label: 'Total Fee', source: 'quote' as const, db_path: 'total_amount' },
      { key: 'quote_down_payment', label: 'Down Payment', source: 'quote' as const, db_path: 'down_amount' },
      { key: 'quote_remaining', label: 'Remaining Balance', source: 'manual' as const, db_path: null },
      { key: 'kickoff_date', label: 'Kickoff Date', source: 'manual' as const, db_path: null },
      { key: 'production_date', label: 'Production Date', source: 'manual' as const, db_path: null },
      { key: 'delivery_date', label: 'Delivery Date', source: 'manual' as const, db_path: null },
      { key: 'rescheduling_fee', label: 'Rescheduling Fee', source: 'manual' as const, db_path: null, default_value: '$5,000' },
      { key: 'revision_rounds', label: 'Included Revisions', source: 'manual' as const, db_path: null, default_value: '3' },
      { key: 'revision_hours', label: 'Revision Hours Cap', source: 'manual' as const, db_path: null, default_value: '10' },
      { key: 'revision_rate', label: 'Revision Hourly Rate', source: 'manual' as const, db_path: null, default_value: '$200' },
      { key: 'approval_days', label: 'Approval Period (Days)', source: 'manual' as const, db_path: null, default_value: '5' },
      { key: 'late_payment_rate', label: 'Late Payment Rate', source: 'manual' as const, db_path: null, default_value: '18% APR' },
      { key: 'cure_period_days', label: 'Cure Period (Days)', source: 'manual' as const, db_path: null, default_value: '30' },
      { key: 'retention_days', label: 'File Retention (Days)', source: 'manual' as const, db_path: null, default_value: '365' },
      { key: 'stripe_fee', label: 'Stripe Processing Fee', source: 'manual' as const, db_path: null },
      // Crowdfunding conditionals
      { key: 'defer_payment', label: 'Deferred Payment', source: 'quote' as const, db_path: 'defer_payment', field_type: 'boolean' as const },
      { key: 'planned_launch_date', label: 'Planned Launch Date', source: 'manual' as const, db_path: null },
      { key: 'launch_grace_days', label: 'Launch Grace (Days)', source: 'manual' as const, db_path: null, default_value: '60' },
      // Additional deliverable checkboxes
      { key: 'raw_footage', label: 'Raw Footage', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'lifestyle_photo', label: 'Lifestyle Photography', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'studio_photo', label: 'Studio Photography', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
    ],
    body: SOW_BODY,
  },

  // ── 3. Pitch Video Contract ─────────────────────────────────────────
  {
    name: 'Fundraising Contract',
    contract_type: 'fundraising' as const,
    description: 'Fundraising video production agreement with deferred payment option and AI clause.',
    merge_fields: [
      { key: 'client_name', label: 'Client Company Name', source: 'client' as const, db_path: 'name' },
      { key: 'client_address', label: 'Client Address', source: 'client' as const, db_path: 'location' },
      { key: 'client_email', label: 'Client Email', source: 'client' as const, db_path: 'email' },
      { key: 'contact_first_name', label: 'Contact First Name', source: 'contact' as const, db_path: 'first_name' },
      { key: 'contact_last_name', label: 'Contact Last Name', source: 'contact' as const, db_path: 'last_name' },
      { key: 'contact_email', label: 'Contact Email', source: 'contact' as const, db_path: 'email' },
      { key: 'contact_phone', label: 'Contact Phone', source: 'contact' as const, db_path: 'phone' },
      { key: 'fna_entity_name', label: 'FNA Legal Entity', source: 'company' as const, db_path: 'entity_name' },
      { key: 'fna_address', label: 'FNA Address', source: 'company' as const, db_path: 'address' },
      { key: 'fna_contact_name', label: 'FNA Contact Name', source: 'company' as const, db_path: 'contact_name' },
      { key: 'fna_contact_email', label: 'FNA Contact Email', source: 'company' as const, db_path: 'contact_email' },
      { key: 'effective_date', label: 'Contract Date', source: 'manual' as const, db_path: null },
      { key: 'project_name', label: 'Project Name', source: 'manual' as const, db_path: null },
      { key: 'project_description', label: 'Additional Notes', source: 'manual' as const, db_path: null },
      { key: 'quote_total', label: 'Project Fee Total', source: 'quote' as const, db_path: 'total_amount' },
      { key: 'quote_down_payment', label: 'Down Payment', source: 'quote' as const, db_path: 'down_amount' },
      { key: 'quote_remaining', label: 'Remaining Balance', source: 'manual' as const, db_path: null },
      { key: 'package_name', label: 'Package Name', source: 'manual' as const, db_path: null },
      { key: 'package_fee', label: 'Package Fee', source: 'manual' as const, db_path: null },
      { key: 'addon_price', label: 'Add-On Price', source: 'manual' as const, db_path: null, default_value: '$10,000' },
      { key: 'deposit_percent', label: 'Deposit %', source: 'manual' as const, db_path: null, default_value: '40' },
      { key: 'rescheduling_fee', label: 'Rescheduling Fee', source: 'manual' as const, db_path: null, default_value: '$5,000' },
      { key: 'late_payment_rate', label: 'Late Payment Rate', source: 'manual' as const, db_path: null, default_value: '10% APR' },
      { key: 'revision_rounds', label: 'Script Revision Rounds', source: 'manual' as const, db_path: null, default_value: '2' },
      { key: 'kickoff_date', label: 'Kickoff Date', source: 'manual' as const, db_path: null },
      { key: 'production_date', label: 'Production Date', source: 'manual' as const, db_path: null },
      { key: 'delivery_date', label: 'Delivery Date', source: 'manual' as const, db_path: null },
      { key: 'stripe_fee', label: 'Stripe Processing Fee', source: 'manual' as const, db_path: null },
      { key: 'cure_period_days', label: 'Cure Period (Days)', source: 'manual' as const, db_path: null, default_value: '30' },
      { key: 'communication_lapse_months', label: 'Comm. Lapse (Months)', source: 'manual' as const, db_path: null, default_value: '3' },
      { key: 'launch_grace_days', label: 'Launch Grace (Days)', source: 'manual' as const, db_path: null, default_value: '60' },
      { key: 'planned_launch_date', label: 'Planned Launch Date', source: 'manual' as const, db_path: null },
      // Deferred / crowdfunding
      { key: 'defer_payment', label: 'Deferred Payment', source: 'quote' as const, db_path: 'defer_payment', field_type: 'boolean' as const },
      { key: 'crowdfunding_enabled', label: 'Crowdfunding', source: 'quote' as const, db_path: 'crowdfunding_enabled', field_type: 'boolean' as const },
      // Package selection checkbox
      { key: 'pkg_base', label: 'Base Package', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'pkg_core', label: 'Core Package', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'pkg_plus', label: 'Plus Package', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'pkg_apex', label: 'Apex Package', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'pkg_custom', label: 'Custom Package', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      // Premium Add-On checkboxes
      { key: 'addon_broll', label: 'B-Roll', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'addon_scripted', label: 'Scripted Videos', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'addon_faq', label: 'FAQ Videos', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'addon_speakers', label: 'Add\'l Speakers', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'addon_motion', label: 'Bespoke Motion Graphics', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'addon_rush', label: 'One Week Rush', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'addon_post', label: 'Add\'l Week of Post', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'addon_reshoot', label: 'Re-Shoot Day(s)', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'addon_travel', label: 'Travel-to-You', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'addon_custom', label: 'Custom Add-On', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
      { key: 'addon_none', label: 'No Add-Ons', source: 'manual' as const, db_path: null, field_type: 'boolean' as const },
    ],
    body: PITCH_VIDEO_BODY,
  },

  // ── 4. Talent Release ───────────────────────────────────────────────
  {
    name: 'Talent Release Agreement',
    contract_type: 'talent_release' as const,
    description: 'Standard talent release for on-camera appearances. Grants perpetual license to client and FNA.',
    merge_fields: [
      { key: 'client_name', label: 'Client / Production Company', source: 'client' as const, db_path: 'name' },
      { key: 'project_name', label: 'Project Name', source: 'manual' as const, db_path: null },
      { key: 'production_date', label: 'Production Date', source: 'manual' as const, db_path: null },
      { key: 'fna_entity_name', label: 'FNA Legal Entity', source: 'company' as const, db_path: 'entity_name' },
      { key: 'talent_name', label: 'Talent Name', source: 'manual' as const, db_path: null },
      { key: 'talent_address', label: 'Talent Address', source: 'manual' as const, db_path: null },
      { key: 'talent_phone', label: 'Talent Phone', source: 'manual' as const, db_path: null },
      { key: 'talent_email', label: 'Talent Email', source: 'manual' as const, db_path: null },
      { key: 'production_company', label: 'Production Company', source: 'manual' as const, db_path: null },
    ],
    body: TALENT_RELEASE_BODY,
  },
]; }

/* ═══════════════════════════════════════════════════════════════════════
 *  Template Bodies — Tiptap HTML with {{merge_field}} tokens
 * ═══════════════════════════════════════════════════════════════════════ */

const MSA_BODY = `
<h1>MASTER SERVICES AGREEMENT</h1>

<p>This Master Services Agreement ("Agreement"), effective as of <strong>{{effective_date}}</strong> (the "Effective Date"), is entered into between <strong>{{client_name}}</strong> ("Client") and <strong>{{fna_entity_name}}</strong> ("FNA").</p>

<p>If no Effective Date is listed above, then the Effective Date of this Agreement shall be the date the Agreement is last signed by the parties.</p>

<h2>1. Application</h2>
<p>Client is interested in creating one or more pieces of creative content (each a "Work" and collectively the "Works"). FNA provides creative production services including video production, motion graphics, photography, and related services. Client wishes to engage FNA to provide certain of these services as set forth in one or more Statements of Work (the "Services").</p>

<h2>2. Definitions</h2>
<p>When used in this Agreement and any Statement of Work, the following terms shall have the meanings indicated below.</p>
<p><strong>a. "Deliverables"</strong> means any Work, any final work product, and any raw content that is provided by FNA to Client pursuant to a Statement of Work under this Agreement.</p>
<p><strong>b. "Client Deliverable(s)"</strong> means any assets, logos, trademarks, materials, prototypes, screenshots, 3D models, fonts, colors, items, contributions, or intellectual property that Client provides to FNA for use in connection with a Statement of Work.</p>
<p><strong>c. "Library Content"</strong> means content or other materials identified in an applicable Statement of Work as "Library Content" that will remain the intellectual property of FNA so that FNA, and FNA's licensors, may use the content in future production projects.</p>
<p><strong>d. "Statement of Work" ("SOW")</strong> shall mean any written statement of work entered into by the parties for FNA to perform Services for Client pursuant to this Agreement.</p>

<h2>3. Statements of Work and Services</h2>
<p><strong>3.1 Incorporation of Terms.</strong> Each Statement of Work entered into by the parties shall be subject to the terms of this Agreement. If there is a conflict or inconsistency between a provision of this Agreement and a provision of a Statement of Work, the provision of the Statement of Work will control with respect to that Statement of Work; provided however, that the provisions of that Statement of Work will be construed so as to give effect to the applicable provisions of this Agreement to the fullest extent possible.</p>
<p><strong>3.2 Services.</strong> The initial Statement of Work is attached to this Agreement as Exhibit A. From time to time, additional Statements of Work may be entered into for additional Services. FNA will render the Services set forth in each Statement of Work in accordance with the terms and conditions of this Agreement. Each Statement of Work will include (i) a reference to this Agreement, (ii) a description of Services to be provided by FNA to Client, (iii) the Fees due from Client to FNA for Services to be provided, and (iv) other terms as determined by the parties.</p>
<p><strong>3.3 Subcontractors; Independent Contractors.</strong> Client acknowledges that FNA may engage third-parties to perform Services (including to create any Deliverable) hereunder, provided, however, that use of such subcontractors shall not relieve FNA of any of its obligations hereunder. FNA shall ensure that all subcontractors are bound by equivalent confidentiality, IP assignment, and data protection obligations.</p>
<p><strong>3.4 Additional Work.</strong> If Client wishes to make further updates or revisions beyond the scope of a Statement of Work, then it will notify FNA in writing and the parties will execute a Change Order or new Statement of Work before any additional work begins.</p>
<p><strong>3.5 Publicity.</strong> Client grants to FNA a worldwide, non-exclusive, irrevocable, royalty-free, perpetual license and right to reproduce, distribute, display, transmit, use, and prepare derivative works of any elements of the Works and all Deliverables, including logos and screenshots, on FNA's website, social media, awards submissions, case studies, or other marketing materials for the sole purpose of displaying and providing examples of FNA's work product.{{#if portfolio_embargo_days}} FNA agrees not to publicly display any Deliverables until {{portfolio_embargo_days}} days after Client's public launch of the applicable Work.{{/if}}</p>

<h2>4. Fees and Payments</h2>
<p><strong>4.1 Payment Terms.</strong> The fees for the Services shall be set forth in each Statement of Work (the "Fees"). Client will pay FNA all properly invoiced amounts within {{payment_terms_days}} days of receipt of an invoice. Any amounts not paid when due shall accrue interest at a rate of {{late_payment_rate}}, or the maximum amount of interest permitted under applicable law, whichever is less. All Deliverables will be deemed accepted upon receipt, except as otherwise set forth in the applicable Statement of Work.</p>
<p><strong>4.2 Termination Fee.</strong> If Client fails to timely comply with its requirements herein, or does not pay the fee payable upon execution of the applicable SOW within seven days of signing, then FNA will notify Client of its failure. If Client does not cure the failure within seven days of receiving notice from FNA, then FNA may terminate the applicable SOW upon written notice and Client will pay FNA a termination fee equal to fifty percent of the total remaining unpaid Fees under the applicable SOW.</p>
<p><strong>4.3 Collections.</strong> Client shall reimburse FNA for all expenses incurred in the collection of amounts that are properly due under this Agreement, but are not paid within thirty days of their due date. Such reimbursable expenses shall include, without limitation, all associated legal costs.</p>
<p><strong>4.4 Reimbursement for Expenses; Taxes.</strong> Client will reimburse FNA for all actual and reasonable out-of-pocket expenses incurred by FNA in connection with the provision of the Services, provided that Client approves the expenses in writing (including via email) and supporting documentation is supplied by FNA as reasonably requested. Client is responsible for, and will pay, any federal, state, and local taxes that are applicable to the Services, other than any taxes based on the net income of FNA.</p>
<p><strong>4.5 Payment Processing.</strong> If Client elects to pay via credit card or other electronic payment method processed through a third-party payment processor (e.g., Stripe), Client agrees to pay all associated processing fees in addition to the Fees. FNA will disclose the applicable processing fee percentage prior to charging.</p>
<p><strong>4.6 Fonts, Stock Photography/Video.</strong> Client is responsible for the licensing fees for any fonts, stock photos, and stock videos selected by Client for inclusion in a Deliverable. FNA will pay the initial fee (which will be reimbursed by Client), but Client will be responsible for timely paying all renewal fees associated with continued use.</p>

<h2>5. Customer Assistance</h2>
<p><strong>5.1 Meetings.</strong> While providing the Services, FNA will contact or meet with Client on a mutually acceptable schedule to discuss tasks completed, problems encountered, and recommended changes.</p>
<p><strong>5.2 Client Assistance and Client Deliverables.</strong> Client agrees to: (i) timely perform its obligations under each Statement of Work; (ii) timely answer FNA's questions and allow Client's employees and staff to provide necessary support and assistance as reasonably requested by FNA; (iii) timely provide the Client Deliverables to FNA; (iv) procure at its own expense all necessary rights, licenses, permissions, waivers, releases, and other documentation to permit use of all Client Deliverables; (v) take sole responsibility for payments to third parties for the use of the Client Deliverables; (vi) provide information and/or data relevant to claims or representations made with respect to its own and competitive products or services; and (vii) review all materials prepared under this Agreement in order to ascertain that all claims or representations made therein are true, accurate, and supportable.</p>
<p><strong>5.3 Designated Approver.</strong> Client shall designate a single point of contact with authority to approve Deliverables, provide feedback, and authorize change orders. All approvals and feedback shall be communicated through this designated contact.</p>

<h2>6. Intellectual Property Rights; Confidentiality</h2>
<p><strong>6.1 Deliverables.</strong> Subject to the payment of all Fees due upon termination or completion of a Statement of Work, all Deliverables other than Third-Party IP and Library Content (the "Client-Owned Deliverables") shall be owned by the Client and are "works made for hire" to the extent allowed by law. In the event any Client-Owned Deliverable is not deemed a "work made for hire," FNA hereby irrevocably grants, assigns, and transfers all intellectual property rights in the Client-Owned Deliverable to Client. Raw footage recorded by FNA during the course of producing a Work for Client and project files created during the course of editing a Work for Client are not considered a Deliverable unless otherwise stated in the applicable SOW. FNA shall disclose any Library Content included in Deliverables upon delivery.</p>
<p><strong>6.2 Use of Third-Party IP.</strong> Notwithstanding anything to the contrary set forth in this Article 6, Client acknowledges and agrees that Deliverables may contain third-party intellectual property ("Third-Party IP") and that all use of such Third-Party IP shall be subject to third-party licenses provided with the Deliverables.</p>
<p><strong>6.3 Library Content.</strong> FNA and its licensors shall retain sole and exclusive ownership of all intellectual property rights in Library Content. Subject to the payment of all Fees, FNA hereby grants Client a perpetual, irrevocable, worldwide, royalty-free, non-exclusive, sub-licensable right and license to make, use, sell, sublicense, reproduce, distribute, perform, display, and prepare derivative works of the Library Content solely as part of a Deliverable.</p>
<p><strong>6.4 Confidentiality.</strong> "Confidential Information" means any confidential or proprietary information of a party (the "Disclosing Party") that is disclosed in any manner to the other party (the "Receiving Party") in connection with this Agreement. Recipient shall hold Discloser's Confidential Information in strict confidence and will not disclose it to any third party without prior written approval. Recipient shall use no less than commercially reasonable procedures to protect such information.</p>
<p><strong>6.5 Exclusions.</strong> The restrictions above shall not apply to information that (i) Recipient independently develops, (ii) was already known to Recipient, (iii) is lawfully disclosed by a third party, or (iv) is approved for release by Discloser.</p>
<p><strong>6.6 Remedies Upon Breach.</strong> Recipient agrees that in the event of a breach or threatened breach, Discloser may have no adequate remedy in money damages and will be entitled to injunctive relief.</p>

<h2>7. AI Usage</h2>
<p><strong>7.1 Disclosure.</strong> Neither party shall use generative AI tools in connection with the Services or Deliverables without prior written disclosure to, and approval by, the other party. FNA shall disclose any AI-generated or AI-assisted elements in each Deliverable upon delivery.</p>
<p><strong>7.2 Client Content.</strong> Client shall not use Deliverables to train AI models without FNA's prior written consent.</p>

<h2>8. Representations and Warranties; Disclaimer</h2>
<p><strong>8.1 Performance Warranty.</strong> FNA represents and warrants that it will perform the Services in a professional and workmanlike manner in accordance with generally accepted industry standards for professional creative production services.</p>
<p><strong>8.2 Insurance.</strong> FNA represents that it carries general liability insurance with coverage minimums reasonably appropriate for the Services being performed.</p>
<p><strong>8.3 Disclaimer.</strong> EXCEPT AS EXPRESSLY SET FORTH IN THIS AGREEMENT, FNA DOES NOT MAKE ANY EXPRESS OR IMPLIED WARRANTIES, CONDITIONS, OR REPRESENTATIONS TO CLIENT WITH RESPECT TO THE SERVICES, THE DELIVERABLES, OR OTHERWISE REGARDING THIS AGREEMENT. WITHOUT LIMITING THE FOREGOING, ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT ARE EXPRESSLY EXCLUDED AND DISCLAIMED.</p>

<h2>9. Indemnity</h2>
<p><strong>9.1 FNA Indemnity.</strong> FNA will indemnify, defend and hold Client harmless from and against any claim by a third party alleging that the Deliverables (excluding any Third-Party IP) infringe any third party's intellectual property rights protectable under US law.</p>
<p><strong>9.2 Client Indemnity.</strong> Client will indemnify, defend, and hold FNA harmless from and against: (i) any claim that any intellectual property provided by Client infringes third-party rights; (ii) any claim relating to Client's failure to comply with its obligations; and (iii) any claims relating to Client's use, marketing, sale, distribution, or other exploitation of the Deliverables.</p>

<h2>10. Limitation of Liability</h2>
<p>IN NO EVENT WILL FNA BE LIABLE TO CLIENT FOR ANY INDIRECT, CONSEQUENTIAL, INCIDENTAL, SPECIAL, PUNITIVE, OR LOST PROFITS DAMAGES. IN NO EVENT WILL FNA'S LIABILITY EXCEED IN THE AGGREGATE THE SUM OF FEES PAID BY CLIENT TO FNA UNDER THE STATEMENT OF WORK GIVING RISE TO THE CLAIM.</p>

<h2>11. Term and Termination</h2>
<p>The term of this Agreement shall begin on the Effective Date and continue until three months after all Statements of Work have been completed. Either party may terminate this Agreement if the other party materially breaches the Agreement and fails to cure that breach within {{cure_period_days}} days of receiving written notice. Articles 2, 4, 6, 7, 9, 10, and 11 shall survive termination.</p>

<h2>12. Force Majeure</h2>
<p>If a party is prevented from performing any of its obligations under this Agreement (other than Client's payment obligations) due to causes beyond reasonable control, including any act of God, fire, flood, pandemic, government-ordered shutdown, travel restriction, war, terrorism, strike, or supply-chain disruption, then its performance will be excused for the period of delay. If force majeure continues for more than 90 days, either party may terminate this Agreement upon written notice.</p>

<h2>13. Dispute Resolution</h2>
<p>The parties agree to first attempt to resolve any dispute arising under this Agreement through good-faith mediation. If mediation fails to resolve the dispute within 30 days, either party may pursue litigation. This Agreement will be governed by the laws of the State of California. Any claims shall be brought in the state and federal courts in Alameda County, California.</p>

<h2>14. Miscellaneous</h2>
<p><strong>14.1 Notices.</strong> Any notices required under this Agreement will be effective when received by email by the designated contact of either party, or upon personal or courier delivery, or three days after deposit into the U.S. mail.</p>
<p><strong>14.2 Relationship of Parties.</strong> Each party is an independent entity. Nothing in this Agreement creates an employment, joint venture, or partnership relationship.</p>
<p><strong>14.3 Assignment.</strong> Neither party may assign this Agreement without prior written consent, except in connection with a merger or acquisition.</p>
<p><strong>14.4 Amendment; Waiver.</strong> No amendment or waiver will be valid unless in writing and signed by an authorized representative.</p>
<p><strong>14.5 Non-Solicitation.</strong> Client agrees that neither Client, nor a Related Party, will directly or indirectly employ, retain, or solicit for employment any Personnel of FNA during the term of this Agreement and for a period of one year thereafter.</p>
<p><strong>14.6 Electronic Signatures.</strong> The parties agree that electronic signatures shall have the same legal force and effect as original signatures under ESIGN and UETA.</p>
<p><strong>14.7 Complete Agreement.</strong> This Agreement constitutes the entire agreement between the parties with regard to the subject matter hereof and supersedes all prior agreements.</p>

<h2>15. Data Privacy</h2>
<p>Each party shall comply with all applicable data protection and privacy laws in connection with the Services. FNA shall implement commercially reasonable security measures to protect any personal data processed in connection with the Services. In the event of a data breach affecting Client's data, FNA shall notify Client within 72 hours of becoming aware of the breach.</p>

<h2>16. File Retention</h2>
<p>FNA will retain project files, raw footage, and working files for {{retention_days}} days following final delivery of the applicable Deliverables. After this period, files may be deleted without notice. Client may request extended archival as an Additional Service.</p>
`.trim();

const SOW_BODY = `
<h1>STATEMENT OF WORK</h1>
<h2>TO MASTER SERVICES AGREEMENT</h2>

<p>This Statement of Work (this "SOW"), effective as of <strong>{{effective_date}}</strong> (the "SOW Date"), is entered into between <strong>{{fna_entity_name}}</strong> ("FNA") and <strong>{{client_name}}</strong> ("Client"), pursuant and subject to the terms and conditions of the Master Services Agreement between FNA and Client (the "MSA"). All defined terms in the MSA shall have the same meaning when used in this SOW unless otherwise defined herein.</p>

<h2>1. Term</h2>
<p>The term of this SOW for the project currently entitled <strong>{{project_name}}</strong> (Project Code: {{project_code}}) shall begin on the SOW Date and continue until FNA's provision of requested revisions to the Deliverables in accordance with Section 2.5 below. Either party may terminate this SOW if the other party materially breaches either the SOW or the MSA and the breaching party fails to cure that breach within {{cure_period_days}} days of receiving written notice of the breach in reasonable detail.</p>

<h2>2. Description of Services</h2>
<p><strong>2.1 Services.</strong> FNA shall work with Client to develop a summary of the contents that Client would like to include in each Work. FNA will then produce each Work and any other agreed upon Deliverables pursuant to the terms of the MSA and this SOW. For the avoidance of doubt, the parties can modify the scope of services by written agreement, including an exchange of emails.</p>
<p><strong>2.2 Schedule.</strong> Each Work will be produced according to the schedule in Exhibit A.</p>
<p><strong>2.3 Rescheduling Fees.</strong> Client hereby agrees and acknowledges that if Client fails to provide a Client Deliverable or otherwise prevents FNA from meeting the deadlines listed in Section 2.2, within 5 business days, then Client will pay FNA a rescheduling fee of {{rescheduling_fee}} (the "Rescheduling Fee").</p>

<p><strong>2.4 Additional Deliverables.</strong> FNA can provide the following additional Deliverables to Client:</p>
<p>{{#checked raw_footage}} Raw footage (10% of budget)<br>{{#checked lifestyle_photo}} Lifestyle Photography<br>{{#checked studio_photo}} Studio Photography</p>

<p><strong>2.5 Revisions.</strong> Upon receipt of either (a) the script for a Work or (b) a Work, Client will have {{revision_rounds}} opportunities to request additional revisions in a written request (email is acceptable) specifying the requested revisions in reasonable detail ("Revision Request"). If Client does not request revisions within {{approval_days}} business days of receiving the Deliverable, then the Deliverable will be deemed approved by Client, and any further revisions will be treated as Additional Services. If Client requests more than {{revision_rounds}} revision opportunities, then the Services for those additional revisions will be billed at {{revision_rate}} per hour (the "Additional Services").</p>
<p>If Client timely submits a Revision Request, then FNA will make such revisions for no additional charge provided that they do not require more than {{revision_hours}} hours of work per Revision Request (the "Revision Hours"). A "Revision" is defined as modifications to existing approved content. Requests that substantially alter the creative direction, add new scenes, or require additional production constitute a Change Order and will require a separate written agreement.</p>

<p><strong>2.6 Acceptance.</strong> FNA will notify Client via email when a review period has begun. If Client does not respond within {{approval_days}} business days, the Deliverable will be deemed approved.</p>

{{#if defer_payment}}
<h2>2A. Crowdfunding Payment Terms</h2>
<p><strong>2A.1</strong> Client pays {{quote_down_payment}} at signing. The remaining balance of {{quote_remaining}} is deferred per the terms of the applicable payment plan.</p>
<p><strong>2A.2 Launch Date Protection.</strong> Client shall launch the crowdfunding campaign no later than {{planned_launch_date}}. If the campaign has not launched within {{launch_grace_days}} days of the Final Delivery date, the full deferred balance becomes immediately due.</p>
{{/if}}

<h2>3. Fees</h2>
<p><strong>3.1 Fees.</strong> Client shall pay {{quote_total}} (the "Fee") for the Services, excluding charges for any Additional Services. FNA will invoice Client for {{quote_down_payment}} upon execution of this Agreement at kickoff, and will invoice Client for {{quote_remaining}} upon delivering the Final Deliverables.</p>
<p><strong>3.2 Additional Services.</strong> Any Additional Services provided under this SOW will be invoiced at the end of each month during which the Additional Services were provided to Client.</p>
<p><strong>3.3 Late Payment Fees.</strong> Invoices paid beyond the terms will accrue a late payment fee of {{late_payment_rate}}, or the maximum rate permitted by applicable law, whichever is less.</p>
{{#if stripe_fee}}<p><strong>3.4 Payment Processing.</strong> If Client pays via credit card, Client agrees to pay a {{stripe_fee}} processing fee in addition to the Fees.</p>{{/if}}

<h2>4. Intellectual Property Rights</h2>
<p>The Deliverables provided pursuant to this Statement of Work shall be owned in accordance with Section 6.1 of the Agreement.</p>

<h2>5. File Retention</h2>
<p>FNA will retain project files for {{retention_days}} days following Final Delivery. After this period, files may be deleted without notice.</p>

<h2>EXHIBIT A</h2>
<p>Subject to the terms of the MSA, and subject to the payment of all applicable fees, FNA will provide the following Deliverables to Client:</p>
<p><em>[Deliverables to be specified per project]</em></p>

<p>Each Work will be produced and each Deliverable will be provided to Client in accordance with the following proposed schedule:</p>
<table>
<tr><td><strong>Kickoff Date</strong></td><td>{{kickoff_date}}</td></tr>
<tr><td><strong>Production Date</strong></td><td>{{production_date}}</td></tr>
<tr><td><strong>Final Delivery Date</strong></td><td>{{delivery_date}}</td></tr>
</table>
`.trim();

const PITCH_VIDEO_BODY = `
<h1>PITCH VIDEO CONTRACT</h1>
<h2>STANDARD AGREEMENT</h2>

<p>This Contract Agreement (this "Contract"), effective as of the "Contract Date" outlined in the attached Exhibit A, is entered into between <strong>{{fna_entity_name}}</strong> ("FNA"), and the "Client" outlined in Exhibit A for the "Project" outlined in Exhibit A.</p>

<h2>1. Contract Term</h2>
<p>The term of this Contract shall begin on the Contract Date and continue until FNA's provision of the Deliverables in accordance with Section 6.1 below. Either party may terminate this Contract if the other party materially breaches the Contract and the breaching party fails to cure that breach within {{cure_period_days}} days of receiving written notice of the breach in reasonable written detail.</p>

<h2>2. Terms</h2>
<p><strong>2.1 Pitch Video.</strong> A "Pitch Video" refers to a chapter-separated 1920x1080p .mp4 ~3-5 minute video file delivered to Client that features: 1. Representative(s) of the Client company (the "Speaker(s)") recorded reading a pre-written script from a teleprompter in an environment lit by professional lighting equipment and captured by a professional video camera and microphone, 2. Simple, branded, animated, title graphics that separate sections and identify Speaker(s), and 3. Simple musical interludes between sections. Speaker(s) are encouraged to rehearse their script(s) ahead of the Production Day, and are afforded abundant "takes" so as to fine-tune their messaging. Pitch Video Projects include creative prep, scriptwriting, production logistics, equipment rentals, production labor, and post-production editorial days required.</p>
<p><strong>2.2 Production Day.</strong> "Production Day" or "Production" refers to the day(s) where FNA and Client and the Speaker (if they are different from Client) arrive at a specified and agreed upon location to film any type of content together.</p>
<p><strong>2.3 Premium Add-On.</strong> "Premium Add-On" refers to any services rendered outside of the base Pitch Video, including but not limited to: capturing B-Roll, capturing additional scripted content or unscripted FAQ Videos, filming any additional Speakers, creating Bespoke Motion Graphics, a One Week Rush Fee, a Travel-to-You Expense, an Additional Week of Post, or any Reshoot Days.</p>
<p><strong>2.4 B-Roll.</strong> "B-Roll" refers to a single Production Day where FNA captures footage that is of, about, or referencing Client's product(s) or service(s), which may or may not feature any Speakers.</p>
<p><strong>2.5 FAQ Videos.</strong> "FAQ Videos" refer to unscripted interview content captured under the same lighting and camera setup as the Pitch Video and filmed immediately prior to or immediately after filming the Pitch Video whereby FNA asks Client questions and they respond on-camera.</p>
<p><strong>2.6 Additional Speakers.</strong> Pitch Videos include at least one and up to two Speakers. If filming two Speakers, they are captured in the same video frame. "Additional Speakers" refers to scripting, filming, and editing additional Speakers from a unique frame into the final Deliverable(s).</p>
<p><strong>2.7 Bespoke Motion Graphics.</strong> "Bespoke Motion Graphics" refers to any animations requested in excess of the standard, included, branded title graphics.</p>
<p><strong>2.8 One Week Rush Fee.</strong> Typically, Pitch Videos are delivered to Client within two weeks of the date of Production. A "One Week Rush Fee" refers to a request made by Client and agreed to by FNA to deliver the final assets within one week instead of two.</p>
<p><strong>2.9 Travel.</strong> Typically, Pitch Videos are filmed within the San Francisco Bay Area. When FNA is required to travel to a domestic or international location, they may impose a "Travel-to-You Fee" Add-On, which is a flat fee meant to cover all travel expenses.</p>
<p><strong>2.10 Additional Week of Post.</strong> An "Additional Week of Post" refers to a request made by Client to extend post-production by an additional week, adding an additional review round. Additional Weeks of Post are billed per week requested.</p>
<p><strong>2.11 Reshoot Day.</strong> A "Reshoot Day" refers to a request by Client to film their material again, after the primary Pitch Video shoot has completely wrapped. Reshoot Days are billed per day required at the Premium Add-On rate.</p>

<h2>3. Services</h2>
<p>FNA shall work with Client to develop a script for their Pitch Video, prepare a location, secure equipment, coach the Speaker's performance during Production, and edit the footage into a final video asset. Client is responsible for providing relevant information about their business in a timely manner prior to Production. For the avoidance of doubt, the parties can modify the scope of services by written agreement, including an exchange of emails.</p>
<p><strong>3.1 Service Packages.</strong> Client has requested the Service Package(s) listed in the attached Exhibit A.</p>
<p><strong>3.2 Premium Add-Ons.</strong> Client has requested the Premium Add-Ons listed in the attached Exhibit A. Premium Add-Ons selected in excess of any included Premium Add-Ons from the selected package will incur additional fees. Premium Add-Ons are valued at {{addon_price}}/ea.</p>
<p><strong>3.3 Schedule.</strong> Unless otherwise specified under Exhibit A, Pitch Video projects operate on a fixed schedule. Beginning from the Kickoff Date, FNA will spend up to 1 week working with Client during Prep. Client is responsible for blocking an entire day of availability for Production Day(s). Beginning one day after Production, FNA will spend up to 2 weeks during Post to finalize video assets for delivery.</p>
<p><strong>3.4 Rescheduling Fees.</strong> Client agrees that if Client fails to provide a requested deliverable within 5 business days, causing the Production Date to shift, Client will pay FNA a rescheduling fee of {{rescheduling_fee}}. FNA will attempt to alert Client with reasonable notice before invoking this clause.</p>
<p><strong>3.5 Revisions.</strong> Upon receipt of the script, Client will have at least {{revision_rounds}} opportunities to request revisions. If Client does not request revisions within 3 business days, the script will be deemed approved. Upon receipt of the initial video edit, Client will have at least {{revision_rounds}} opportunities to request revisions via Frame.io within 5 business days.</p>

<h2>4. Script Liability</h2>
<p>Client acknowledges, agrees, and assumes full responsibility and liability for the content of the recorded script and any consequences arising from its use within the Deliverable(s). FNA makes no representations or warranties regarding the accuracy, completeness, or suitability of the content provided in the script.</p>

<h2>5. Fees</h2>
<p><strong>5.1 Fees and Packages.</strong> Pitch Video deliverables are billed as "Packages." The "Base" Package is valued at $15,000 and includes a Pitch Video featuring a single speaker, script support, performance coaching, use of teleprompter, premium lighting, camera and audio equipment rental, location rental, branded title graphics, revisions, and are generally completed within 3 weeks. Premium Add-Ons are valued at {{addon_price}}/ea. "Core", "Plus", and "Apex" packages include everything in the Base Package, plus Premium Add-Ons. Prices represent the "Package Fee" per package. The "Project Fee" refers to the Package Fee plus any Additional Premium Add-Ons requested.</p>
<p><strong>5.2 Fee Structure.</strong> Unless otherwise agreed to within the attached Exhibit A, Client agrees to pay a minimum deposit of {{deposit_percent}}% of the selected Package Fee upon signing of this Contract, and the remaining balance upon delivery of the final video Deliverable(s). Modifications are made solely at FNA's discretion.</p>
{{#if defer_payment}}
<p><strong>5.3 Pay When You Raise Payment Plan.</strong> If Client accepts this Payment Plan, Client agrees to pay up to 2.5x the Project Fee owed, less any Additional Services already billed, and less any at-will payments made prior to Delivery (the "Deferred Fee") once they raise funds in excess of 2.5x the Deferred Fee (the "Payment Threshold"). For purposes of this section, "raise" includes equity financing, convertible instruments, SAFEs, and revenue-based financing, but excludes grants and traditional debt. FNA reserves the right to request reasonable documentation verifying Client's fundraising status.</p>
<p><strong>5.3.1 Launch Date Protection.</strong> If the campaign has not launched within {{launch_grace_days}} days of the Final Delivery date, or by {{planned_launch_date}} (whichever is earlier), the full deferred balance becomes immediately due.</p>
{{/if}}
<p><strong>5.4 Additional Services.</strong> Additional Services specified under Exhibit A will be invoiced and due on the Final Delivery Date.</p>
<p><strong>5.5 Late Payment Fees.</strong> Late payments accrue a fee of {{late_payment_rate}}, or the maximum rate permitted by applicable law, whichever is less.</p>
{{#if stripe_fee}}<p><strong>5.6 Payment Processing.</strong> If Client pays via credit card, Client agrees to pay a {{stripe_fee}} processing fee in addition to the Fees.</p>{{/if}}

<h2>6. Deliverables</h2>
<p><strong>6.1 Final Delivery.</strong> Upon full payment of all Fees due (or acceptance of a deferred payment plan, if offered), and once all assets are rendered Approved by Client, FNA will deliver to Client the final assets via a private Frame, Vimeo or YouTube link with downloads enabled. Raw footage and project files are not considered Deliverables.</p>
<p><strong>6.2 Rights.</strong> Upon receipt of the Deliverables, Client is granted a perpetual, worldwide license to use the Deliverables for their own purposes. FNA shall also retain a perpetual and irrevocable, worldwide license to use, distribute, and display the Deliverables for portfolio, marketing, case studies, awards submissions, and promotional purposes.</p>
<p><strong>6.3 Footage Storage.</strong> FNA shall store the original raw footage and project files for a minimum of 1 year from the date of Production, archived on secure hard drives stored in at least two physical locations.</p>

<h2>7. Use of Artificial Intelligence</h2>
<p>FNA will, on the Production Day, capture video footage and an audio voiceprint from the Speaker(s) that can be utilized later, during Post, to modify what the Speaker(s) say through the use of AI/LLM tools. <strong>Use of this technology is entirely optional and will only occur after the Client provides express written consent and approval to engage.</strong></p>
<p><strong>7.1 Error Correction.</strong> Client agrees that AI/LLM tools may be employed to identify and correct spoken or visual errors. Any corrections will be reviewed and approved by Client and/or Speaker(s).</p>
<p><strong>7.2 Use of Speaker's Voice and Likeness.</strong> Client and Speaker(s) grant permission for their voice and likeness to be used in AI tools solely for improving the quality of the Deliverable(s). FNA agrees to take all reasonable measures to protect the Speaker(s)' voice and likeness from unauthorized use.</p>

{{#if defer_payment}}
<h2>8. Communication Requirements</h2>
<p><em>The following terms (8.1, 8.2) apply if Client accepts a Pay When You Raise Payment Plan. In all other circumstances they are void.</em></p>
<p><strong>8.1 Investor Updates.</strong> Client agrees to provide FNA with monthly updates regarding fundraising efforts, beginning within 30 days of delivery. Updates may be brief, including simple messages indicating "No news."</p>
<p><strong>8.2 Immediate Payment Upon Communication Lapse.</strong> If FNA does not receive any communication from Client for any consecutive period of {{communication_lapse_months}} months following delivery, Client agrees that the Total Fee owed shall become billable and due immediately, accruing interest at {{late_payment_rate}} from the date of lapse.</p>
{{/if}}

<h2>9. Force Majeure</h2>
<p>If either party is prevented from performing its obligations (other than Client's payment obligations) due to causes beyond reasonable control, including pandemic, government-ordered shutdown, or travel restriction, performance will be excused for the period of delay. If force majeure continues for more than 90 days, either party may terminate upon written notice.</p>

<h2>10. Limitation of Liability</h2>
<p>IN NO EVENT WILL FNA BE LIABLE FOR ANY INDIRECT, CONSEQUENTIAL, INCIDENTAL, SPECIAL, PUNITIVE, OR LOST PROFITS DAMAGES. FNA'S TOTAL LIABILITY SHALL NOT EXCEED THE PROJECT FEE PAID BY CLIENT.</p>

<h2>11. Dispute Resolution</h2>
<p>The parties agree to first attempt to resolve disputes through good-faith mediation. If mediation fails within 30 days, either party may pursue litigation. This Contract shall be governed by the laws of the State of California.</p>

<hr>

<h1>EXHIBIT A</h1>

<table>
<tr><td><strong>Contract Date:</strong></td><td>{{effective_date}}</td><td><strong>Client:</strong></td><td>{{client_name}}</td><td><strong>Project:</strong></td><td>{{project_name}}</td></tr>
</table>
<p><strong>Additional Notes:</strong> {{project_description}}</p>

<p><strong>Services:</strong></p>
<p>{{#checked pkg_base}} Pitch Video Base Package<br>{{#checked pkg_core}} Core Package, including any (1) Premium Add-On<br>{{#checked pkg_plus}} Plus Package, including any (3) Premium Add-Ons<br>{{#checked pkg_apex}} Apex Package, including any (6) Premium Add-Ons<br>{{#checked pkg_custom}} Pitch Video Custom Package</p>

<p><strong>Premium Add-Ons:</strong></p>
<p>{{#checked addon_broll}} B-Roll Footage Package<br>{{#checked addon_scripted}} 3x Add'l Scripted Videos<br>{{#checked addon_faq}} 5x Add'l Unscripted FAQ Videos<br>{{#checked addon_speakers}} Additional Speaker(s)<br>{{#checked addon_motion}} Bespoke Motion Graphics<br>{{#checked addon_rush}} One Week Rush Fee<br>{{#checked addon_post}} Additional Week(s) of Post<br>{{#checked addon_reshoot}} Re-Shoot Day(s)<br>{{#checked addon_travel}} Travel-to-You Fee<br>{{#checked addon_custom}} Custom Add-On<br>{{#checked addon_none}} No Premium Add-Ons</p>

<p><strong>Project Fee Total:</strong> {{quote_total}}</p>

<p><strong>Fee Schedule:</strong></p>
<table>
<tr><td><strong>Due Upon Signing</strong></td><td><strong>Due Upon Delivery</strong></td>{{#if defer_payment}}<td><strong>Due After Delivery</strong></td>{{/if}}</tr>
<tr><td>{{deposit_percent}}% — {{quote_down_payment}}</td><td>{{quote_remaining}}</td>{{#if defer_payment}}<td>Deferred per Section 5.3</td>{{/if}}</tr>
</table>

<p><strong>Schedule:</strong></p>
<table>
<tr><td><strong>Kickoff Date</strong></td><td><strong>Production Date</strong></td><td><strong>Final Delivery Date</strong></td></tr>
<tr><td>{{kickoff_date}}</td><td>{{production_date}}</td><td>{{delivery_date}}</td></tr>
</table>
`.trim();

const TALENT_RELEASE_BODY = `
<h1>TALENT RELEASE AGREEMENT</h1>

<p>This Talent Release Agreement (this "Release") is entered into in connection with the production titled <strong>{{project_name}}</strong> (the "Production") produced by or on behalf of <strong>{{client_name}}</strong> ("Client") and <strong>{{fna_entity_name}}</strong> ("FNA") on or about <strong>{{production_date}}</strong>.</p>

<p>I, the undersigned (<strong>{{talent_name}}</strong>), agree as follows:</p>

<p><strong>a. Grant of Rights.</strong> I grant to Client and FNA a perpetual, worldwide, non-exclusive license to use my name, voice, image, likeness, and any and all attributes of my personality, in, on, or in connection with any film, audio tape, video tape, audio-visual work, photograph, illustration, animation, or broadcast, in all media now known or hereafter devised, including digital, streaming, social media platforms, websites, mobile applications, and physical media, produced in connection with the Production, excluding billboards and broadcast television advertisements.</p>

<p>I further grant to Client and FNA a license to use my name, voice, image, likeness, and attributes of my personality in any advertising or promotional material created or used in connection with the Production and each such item will be considered a "Work" for purposes of this agreement.</p>

<p><strong>b. Assignment.</strong> I hereby irrevocably assign to Client all right, title and interest in and to the copyright in the Work, and grant Client the exclusive right throughout the world to use, print, produce, publish, copy, display, perform, exhibit, transmit, broadcast, disseminate, market, advertise, sell, lease, license, transfer, modify, and create derivative works from the Work in any media or format, excluding broadcast television advertisements, billboards, and any use prohibited under Section (f) below.</p>

<p><strong>c. FNA Portfolio Rights.</strong> I grant to FNA a separate, perpetual, non-exclusive license to use the Work for portfolio, marketing, case studies, awards submissions, and promotional purposes.</p>

<p><strong>d. AI Restrictions.</strong> My name, voice, image, and likeness shall not be used to (i) train, fine-tune, or otherwise develop any artificial intelligence, machine learning, or generative model; (ii) create synthetic or AI-generated reproductions of my voice or likeness; or (iii) upload to any dataset, platform, or service whose primary purpose is AI model training. For clarity, use of industry-standard AI-assisted production tools (e.g., noise reduction, color correction, captioning, editorial software features) in the normal course of post-production does not constitute a prohibited use. The foregoing AI restrictions may be modified by a separate, signed AI Likeness Addendum specifying the permitted AI uses, scope, and duration.</p>

<p><strong>e. Waiver.</strong> I waive any right to inspect, examine or approve the content of the Work.</p>

<p><strong>f. Release.</strong> I hereby release, discharge, and agree to hold harmless Client, FNA, their legal representatives and assigns, and all persons acting under their authority, from all claims, causes of action and liability of any kind, now known or unknown, including claims of libel, slander, invasion of privacy, right of publicity (including under any state statute), defamation, trademark infringement, and copyright infringement.</p>

<p><strong>g. Consideration.</strong> I acknowledge that I have received good and valuable consideration for this Release, including participation in the Production and/or other compensation as separately agreed.</p>

<p><strong>h. Representations.</strong> I represent and warrant that I am over the age of eighteen (18) years, and have the right to contract in my own name. I further affirm that the rights granted hereunder do not conflict with or violate the rights of any third party.</p>

<p><strong>i. Governing Law.</strong> This Release shall be governed by the laws of the State of California. If any provision is found unenforceable, the remaining provisions shall remain in full force and effect.</p>

<p><strong>j. Electronic Signatures.</strong> The parties agree that electronic signatures shall have the same legal force and effect as original signatures.</p>

<p>I have read the above authorization, release and agreement prior to its execution; I fully understand the contents thereof. This agreement will be binding upon my heirs, successors, representatives, and assigns.</p>

<table>
<tr><td><strong>Talent Name:</strong></td><td>{{talent_name}}</td></tr>
<tr><td><strong>Address:</strong></td><td>{{talent_address}}</td></tr>
<tr><td><strong>Phone:</strong></td><td>{{talent_phone}}</td></tr>
<tr><td><strong>Email:</strong></td><td>{{talent_email}}</td></tr>
</table>
`.trim();
