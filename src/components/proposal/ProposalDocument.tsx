import {
  Document,
  Page,
  View,
  Text,
  Link,
  StyleSheet,
  Svg,
  Path,
} from '@react-pdf/renderer';
import type { ProposalPDFData } from '@/lib/pdf/generateProposalPDF';

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US');
}

// ── Styles ────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'SpaceGrotesk',
    color: '#1a1a1a',
    fontSize: 10,
    paddingBottom: 72,
  },
  header: {
    backgroundColor: '#000000',
    paddingHorizontal: 48,
    paddingVertical: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    width: 190,
    gap: 2,
  },
  headerCompany: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
    marginBottom: 1,
    textAlign: 'right',
  },
  headerTagline: {
    color: '#9ca3af',
    fontSize: 8,
    fontWeight: 400,
    letterSpacing: 0.5,
    marginBottom: 5,
    textAlign: 'right',
  },
  headerLink: {
    color: '#a14dfd',
    fontSize: 9,
    textDecoration: 'none',
    textAlign: 'right',
  },
  accentLine: {
    height: 3,
    backgroundColor: '#a14dfd',
  },
  body: {
    paddingHorizontal: 48,
    paddingTop: 36,
    paddingBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 8,
    letterSpacing: 2,
    color: '#9ca3af',
    fontWeight: 500,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 9,
    color: '#6b7280',
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  proposalTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  dividerLight: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
  // Sections
  sectionLabel: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: '#9ca3af',
    fontWeight: 500,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 10,
    color: '#4b5563',
    lineHeight: 1.6,
    marginBottom: 4,
  },
  // Items (videos, projects)
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 2,
  },
  itemBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#a14dfd',
    marginRight: 8,
  },
  itemLabel: {
    fontSize: 10,
    color: '#374151',
  },
  itemSub: {
    fontSize: 8,
    color: '#9ca3af',
    marginLeft: 4,
  },
  // Quote summary
  quoteHeader: {
    fontSize: 12,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    marginBottom: 1,
  },
  quoteLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  quoteValue: {
    fontSize: 9,
    color: '#374151',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#111827',
  },
  paymentBox: {
    backgroundColor: '#f0fdf4',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#bbf7d0',
    borderBottomColor: '#bbf7d0',
    marginLeft: -48,
    marginRight: -48,
    paddingLeft: 48,
    paddingRight: 48,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#15803d',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 700,
    color: '#15803d',
  },
  // Prepared for
  preparedLabel: {
    fontSize: 8,
    letterSpacing: 2,
    color: '#9ca3af',
    fontWeight: 500,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 24,
  },
  preparedName: {
    fontSize: 11,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 2,
  },
  preparedDetail: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 1,
  },
  // Fixed footer
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 48,
    paddingBottom: 28,
  },
  fixedFooterInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 2,
  },
  footerLink: {
    fontSize: 8,
    color: '#a14dfd',
    textDecoration: 'none',
  },
  footerPageNum: {
    fontSize: 8,
    color: '#9ca3af',
  },
});

// ── FNA Logo (same as QuoteDocument) ──────────────────────────────────────

function FnaLogo({ width = 108, height = 42 }: { width?: number; height?: number }) {
  return (
    <Svg viewBox="0 0 432 168" width={width} height={height}>
      <Path
        fillRule="evenodd"
        d="M175.92 35.54L176.02 35.43C176.27 35.13 176.48 34.78 176.67 34.4L176.8 34.15C176.94 33.81 177.04 33.44 177.11 33.06C177.2 32.58 177.22 32.08 177.19 31.59L177.17 31.54C177.13 31.03 177.04 30.56 176.9 30.16C176.74 29.7 176.52 29.27 176.24 28.88C175.97 28.5 175.65 28.15 175.3 27.86C174.92 27.55 174.49 27.28 174.03 27.06L154.06 17.9L133.47 64.02C133.7 63.91 133.92 63.79 134.13 63.65L174.78 36.53C175.2 36.25 175.59 35.91 175.92 35.53V35.54Z"
        fill="white"
      />
      <Path
        fillRule="evenodd"
        d="M125.93 77.76L125.52 77.71L78.06 73.72L69.09 72.97L62.35 72.4L53.06 59.99L74.38 53.97L125.23 39.62C126.93 39.14 127.93 37.38 127.45 35.67L117.08 2.26C116.56 0.57 114.76 -0.38 113.07 0.14L16.7 29.12C15.02 29.62 14.05 31.39 14.54 33.08L20.75 54.53L19.07 64.56L17.45 74.26L0.07 157.69C-0.29 159.42 0.81 161.11 2.54 161.48L2.74 161.52L46.64 167.81C48.39 168.06 50.02 166.85 50.27 165.1L58.95 115.63L118.3 121.25C120.04 121.42 121.59 120.17 121.8 118.45L128.52 81.48C128.84 79.75 127.68 78.08 125.94 77.76H125.93ZM34.74 77.42C34.56 80.38 32.02 82.64 29.06 82.46C26.1 82.28 23.84 79.74 24.02 76.78C24.2 73.82 26.74 71.56 29.7 71.74C32.66 71.92 34.92 74.46 34.74 77.42ZM37.14 57.32C36.96 60.28 34.42 62.54 31.46 62.36C28.5 62.18 26.24 59.64 26.42 56.68C26.6 53.72 29.14 51.46 32.1 51.64C35.06 51.82 37.32 54.36 37.14 57.32ZM57.5 79.23C57.32 82.19 54.78 84.45 51.82 84.27C48.86 84.09 46.6 81.55 46.78 78.59C46.96 75.63 49.5 73.37 52.46 73.55C55.42 73.73 57.68 76.27 57.5 79.23Z"
        fill="white"
      />
      <Path
        fillRule="evenodd"
        d="M239.43 38.59C238.77 36.9 236.87 36.06 235.18 36.7L228.73 39.17L222.28 41.64L222.2 41.67L221.31 42.01L228.95 62.6C229.13 63.08 229.24 63.57 229.28 64.06C229.32 64.51 229.3 64.98 229.22 65.45C229.14 65.92 228.99 66.38 228.78 66.82C228.59 67.2 228.33 67.6 228 67.99L227.98 68.04C227.66 68.41 227.29 68.75 226.89 69.02C226.57 69.24 226.24 69.43 225.9 69.58L225.64 69.66C225.24 69.8 224.84 69.89 224.45 69.93H224.3C223.79 69.97 223.27 69.93 222.78 69.84L174.85 60.27C174.61 60.22 174.36 60.16 174.13 60.07L142.81 72.06C141.11 72.71 140.25 74.62 140.9 76.32L174.4 156.22C175.1 157.9 177.04 158.69 178.72 157.99L190.62 153.24C192.31 152.57 193.14 150.66 192.47 148.97C191.23 145.9 189.89 142.84 188.6 139.78L205.08 132.84L209.11 142.41C209.81 144.07 211.7 144.85 213.36 144.19L268.63 122.2C270.32 121.53 271.14 119.63 270.49 117.94L239.42 38.59H239.43ZM174.5 106.58L167.56 90.1L184.04 83.16L190.98 99.64L174.5 106.58ZM185.28 131.2L178.34 114.72L194.82 107.78L201.76 124.26L185.28 131.2Z"
        fill="white"
      />
      <Path
        fillRule="evenodd"
        d="M431.98 150.75C431.92 150.25 431.75 149.79 431.5 149.39L364.32 18.59C363.67 17.31 362.29 16.64 360.94 16.82L318.88 22.74C317.51 22.93 316.45 23.94 316.14 25.2L272.13 163.55C271.58 165.28 272.54 167.13 274.27 167.68C274.7 167.82 275.13 167.86 275.55 167.82L321.6 163.76C323.07 163.63 324.23 162.57 324.54 161.21L333.13 135.37L369.8 132.18L381.61 157.83C382.22 159.16 383.61 159.89 384.99 159.73L429.1 154.41C430.91 154.2 432.2 152.55 431.99 150.74L431.98 150.75ZM366.93 88.03C366.85 88.32 366.73 88.59 366.59 88.84C366.46 89.07 366.27 89.31 366.04 89.54C365.82 89.76 365.58 89.95 365.32 90.1L337.82 106.28C337.54 106.45 337.23 106.58 336.91 106.67L336.82 106.7C336.57 106.76 336.31 106.79 336.03 106.79H335.85C335.61 106.78 335.36 106.73 335.12 106.67C334.81 106.58 334.51 106.46 334.24 106.3L334.22 106.27C333.93 106.1 333.68 105.92 333.49 105.72C333.27 105.49 333.07 105.24 332.92 104.97C332.77 104.7 332.66 104.42 332.59 104.13C332.51 103.82 332.48 103.49 332.48 103.16L333.18 69.68C333.18 69.34 333.23 69.02 333.32 68.73C333.4 68.44 333.53 68.16 333.7 67.89L333.78 67.75C333.92 67.54 334.08 67.36 334.27 67.19C334.51 66.97 334.78 66.77 335.07 66.62H335.1C335.39 66.46 335.68 66.35 335.95 66.29C336.26 66.22 336.57 66.19 336.87 66.2H336.89C337.2 66.21 337.5 66.27 337.79 66.36L337.89 66.39C338.14 66.48 338.4 66.61 338.66 66.77L365.47 84.07C365.76 84.26 366 84.46 366.19 84.67C366.39 84.88 366.56 85.12 366.69 85.36L366.75 85.48C366.85 85.7 366.93 85.93 366.99 86.18C367.06 86.49 367.1 86.81 367.09 87.12C367.09 87.43 367.04 87.74 366.95 88.04L366.93 88.03Z"
        fill="white"
      />
    </Svg>
  );
}

// ── Document ──────────────────────────────────────────────────────────────

interface ProposalDocumentProps {
  data: ProposalPDFData;
}

export function ProposalDocument({ data }: ProposalDocumentProps) {
  const { proposal, sections, quotes, videos, projects } = data;
  const fnaQuote = quotes.find((q) => q.is_fna_quote);
  const date = new Date(proposal.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document
      title={`Proposal — ${proposal.contact_name}`}
      author="Friends 'n Allies"
      subject={proposal.title}
    >
      <Page size="LETTER" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <FnaLogo width={108} height={42} />
          <View style={S.headerRight}>
            <Text style={S.headerCompany}>Friends &apos;n Allies</Text>
            <Text style={S.headerTagline}>Boutique Creative Agency</Text>
            <Link src="https://fna.wtf" style={S.headerLink}>https://fna.wtf</Link>
          </View>
        </View>
        <View style={S.accentLine} />

        {/* Body */}
        <View style={S.body}>
          {/* Meta */}
          <View style={S.metaRow}>
            <View>
              <Text style={S.metaLabel}>Proposal</Text>
              <Text style={S.proposalTitle}>{proposal.title}</Text>
              <Text style={S.subtitle}>{proposal.subtitle}</Text>
            </View>
            <View style={S.metaRight}>
              <Text style={[S.metaValue, { fontWeight: 600, color: '#374151', marginBottom: 3 }]}>
                #{proposal.proposal_number}
              </Text>
              <Text style={S.metaValue}>{date}</Text>
            </View>
          </View>

          <View style={S.divider} />

          {/* Sections */}
          {sections.map((section) => {
            if (section.section_type === 'text' || section.section_type === 'custom_text') {
              return (
                <View key={section.id} wrap={false} style={{ marginBottom: 16 }}>
                  {section.custom_title && (
                    <Text style={S.sectionTitle}>{section.custom_title}</Text>
                  )}
                  {section.custom_content && (
                    <Text style={S.sectionBody}>{section.custom_content}</Text>
                  )}
                </View>
              );
            }

            if (section.section_type === 'video' && videos.length > 0) {
              return (
                <View key={section.id} wrap={false} style={{ marginBottom: 16 }}>
                  <Text style={S.sectionLabel}>Video Samples</Text>
                  {videos.map((v, i) => (
                    <View key={i} style={S.itemRow}>
                      <View style={S.itemBullet} />
                      <Text style={S.itemLabel}>{v.title}</Text>
                      <Text style={S.itemSub}>({v.video_type.replace(/_/g, ' ')})</Text>
                    </View>
                  ))}
                </View>
              );
            }

            if (section.section_type === 'projects' && projects.length > 0) {
              return (
                <View key={section.id} wrap={false} style={{ marginBottom: 16 }}>
                  <Text style={S.sectionLabel}>Selected Work</Text>
                  {projects.map((p, i) => (
                    <View key={i} style={S.itemRow}>
                      <View style={S.itemBullet} />
                      <Text style={S.itemLabel}>{p.title}</Text>
                      <Text style={S.itemSub}>— {p.client_name}</Text>
                    </View>
                  ))}
                </View>
              );
            }

            if (section.section_type === 'quote' && fnaQuote) {
              const addons = Object.entries(fnaQuote.selected_addons).filter(([, qty]) => qty > 0);
              return (
                <View key={section.id} style={{ marginBottom: 16 }}>
                  <View style={S.divider} />
                  <Text style={S.quoteHeader}>{fnaQuote.label || 'Quote'}</Text>
                  <Text style={[S.sectionLabel, { marginBottom: 6 }]}>
                    {fnaQuote.quote_type.replace(/_/g, ' ').toUpperCase()} PACKAGE
                  </Text>

                  {addons.map(([name, qty]) => (
                    <View key={name} style={S.quoteRow}>
                      <Text style={S.quoteLabel}>{name}{qty > 1 ? ` ×${qty}` : ''}</Text>
                    </View>
                  ))}

                  {fnaQuote.friendly_discount_pct > 0 && (
                    <View style={[S.quoteRow, { marginTop: 4 }]}>
                      <Text style={[S.quoteLabel, { color: '#15803d' }]}>
                        Friendly discount ({fnaQuote.friendly_discount_pct}%)
                      </Text>
                    </View>
                  )}

                  {fnaQuote.total_amount != null && (
                    <View wrap={false}>
                      <View style={S.divider} />
                      <View style={S.totalRow}>
                        <Text style={S.totalLabel}>TOTAL</Text>
                        <Text style={S.totalValue}>{fmt(fnaQuote.total_amount)}</Text>
                      </View>
                    </View>
                  )}

                  {fnaQuote.down_amount != null && (
                    <View wrap={false} style={S.paymentBox}>
                      <View style={S.paymentRow}>
                        <Text style={S.paymentLabel}>Due at signing</Text>
                        <Text style={S.paymentAmount}>{fmt(fnaQuote.down_amount)}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            }

            // Calendar section — just a note in PDF
            if (section.section_type === 'calendar') {
              return (
                <View key={section.id} wrap={false} style={{ marginBottom: 16 }}>
                  <View style={S.dividerLight} />
                  <Text style={[S.sectionBody, { fontStyle: 'italic' }]}>
                    Ready to move forward? Book a call at cal.com/fnawtf/introduction
                  </Text>
                </View>
              );
            }

            return null;
          })}

          {/* Prepared for */}
          <View wrap={false}>
            <Text style={S.preparedLabel}>Prepared for</Text>
            <Text style={S.preparedName}>{proposal.contact_name}</Text>
            {proposal.contact_company && (
              <Text style={S.preparedDetail}>{proposal.contact_company}</Text>
            )}
            {proposal.contact_email && (
              <Text style={S.preparedDetail}>{proposal.contact_email}</Text>
            )}
          </View>
        </View>

        {/* Fixed footer */}
        <View fixed style={S.fixedFooter}>
          <View style={S.fixedFooterInner}>
            <View>
              <Text style={S.footerText}>
                Ready to move forward?{' '}
                <Link src="https://cal.com/fnawtf/introduction" style={S.footerLink}>
                  Book an intro call.
                </Link>
              </Text>
            </View>
            <Text
              style={S.footerPageNum}
              render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
                totalPages > 1 ? `${pageNumber} / ${totalPages}` : ''
              }
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}
