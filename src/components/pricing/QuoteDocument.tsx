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
import type { QuoteData, ContactInfo } from '@/lib/pdf/types';

// ── Helpers ───────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US');
}

function quoteId() {
  const d = new Date();
  // Use LA local date + 24hr time (HHMM) so the ID is human-readable and time-stamped
  const ymd = d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }).replace(/-/g, '');
  const hhmm = d.toLocaleTimeString('en-GB', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' }).replace(':', '');
  return `FNA-${ymd}-${hhmm}`;
}

// ── Styles ────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'SpaceGrotesk',
    color: '#1a1a1a',
    fontSize: 10,
    paddingBottom: 72, // reserves footer space on EVERY page for the break algorithm
  },

  // Header
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
  headerSiteLink: {
    color: '#a14dfd',
    fontSize: 9,
    textDecoration: 'none',
    textAlign: 'right',
  },
  headerEmailLink: {
    color: '#d1d5db',
    fontSize: 9,
    textDecoration: 'none',
    textAlign: 'right',
  },
  accentLine: {
    height: 3,
    backgroundColor: '#a14dfd',
  },

  // Body
  body: {
    paddingHorizontal: 48,
    paddingTop: 36,
    paddingBottom: 16,
  },

  // Meta
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

  tierRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
    gap: 8,
  },
  tierName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    letterSpacing: -0.5,
  },
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

  // Dividers
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
  dividerHeavy: {
    height: 1,
    backgroundColor: '#d1d5db',
    marginVertical: 16,
  },

  // Table
  sectionLabel: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: '#9ca3af',
    fontWeight: 500,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  baseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 2,
  },
  baseLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#111827',
  },
  baseValue: {
    fontSize: 10,
    fontWeight: 600,
    color: '#111827',
  },
  addonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    marginBottom: 1,
  },
  addonLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  addonValue: {
    fontSize: 9,
    color: '#374151',
  },

  // Overhead / discounts
  overheadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    marginBottom: 2,
  },
  overheadLabel: {
    fontSize: 9,
    color: '#9ca3af',
  },
  overheadValue: {
    fontSize: 9,
    color: '#9ca3af',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    marginBottom: 2,
  },
  discountLabel: {
    fontSize: 9,
    color: '#15803d',
  },
  discountValue: {
    fontSize: 9,
    color: '#15803d',
  },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    color: '#111827',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
  },

  // Payment box — full-bleed (extends into page margins)
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
    paddingVertical: 18,
    marginBottom: 28,
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
    fontSize: 22,
    fontWeight: 700,
    color: '#15803d',
  },
  paymentSub: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 4,
  },

  // Special program note
  programNote: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
  },
  programNoteText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  programNoteTitle: {
    fontSize: 9,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 4,
  },

  // Book a call
  bookCallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 4,
  },
  bookCallLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  bookCallLink: {
    fontSize: 9,
    color: '#a14dfd',
    textDecoration: 'none',
    fontWeight: 500,
  },

  // Fixed footer (every page, absolutely positioned)
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
    color: '#9ca3af',
    textDecoration: 'none',
  },
  footerCallLink: {
    fontSize: 8,
    color: '#a14dfd',
    textDecoration: 'none',
  },
  footerPageNum: {
    fontSize: 8,
    color: '#9ca3af',
  },
});

// ── FNA Logo (inline SVG from fna-logo.svg, white fill) ──────────────────

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

interface QuoteDocumentProps {
  data: QuoteData;
  contact: ContactInfo;
}

export function QuoteDocument({ data, contact }: QuoteDocumentProps) {
  const id = quoteId();
  const hasDeferredFee = data.deferredFee > 0;

  return (
    <Document
      title={`FNA Quote — ${contact.name}`}
      author="Friends 'n Allies"
      subject="Project Estimate"
    >
      <Page size="LETTER" style={S.page}>

        {/* ── Header ── */}
        <View style={S.header}>
          <FnaLogo width={108} height={42} />
          <View style={S.headerRight}>
            <Text style={S.headerCompany}>Friends &apos;n Allies</Text>
            <Text style={S.headerTagline}>Boutique Creative Agency</Text>
            <Link src="https://fna.wtf" style={S.headerSiteLink}>https://fna.wtf</Link>
            <Link src="mailto:hi@fna.wtf" style={S.headerEmailLink}>hi@fna.wtf</Link>
          </View>
        </View>
        <View style={S.accentLine} />

        {/* ── Body ── */}
        <View style={S.body}>

          {/* Meta row */}
          <View style={S.metaRow}>
            <View>
              <Text style={S.metaLabel}>Estimate</Text>
              <View style={S.tierRow}>
                <Text style={S.tierName}>{data.tier}</Text>
              </View>
            </View>
            <View style={S.metaRight}>
              <Text style={[S.metaValue, { fontWeight: 600, color: '#374151', marginBottom: 3 }]}>{id}</Text>
              <Text style={S.metaValue}>{data.date}</Text>
            </View>
          </View>

          <View style={S.divider} />

          {/* ── Build section ── */}
          {data.buildBase > 0 && (
            <View>
              <Text style={S.sectionLabel}>Build</Text>
              <View style={S.baseRow}>
                <Text style={S.baseLabel}>Base</Text>
                <Text style={S.baseValue}>{fmt(data.buildBase)}</Text>
              </View>
              {data.buildItems.map((item, i) => (
                <View key={i} style={S.addonRow}>
                  <Text style={S.addonLabel}>{item.name}</Text>
                  <Text style={S.addonValue}>{fmt(item.price)}</Text>
                </View>
              ))}
              {(data.launchBase > 0 || data.fundraisingBase > 0) && (
                <View style={S.dividerLight} />
              )}
            </View>
          )}

          {/* ── Launch section ── */}
          {data.launchBase > 0 && (
            <View>
              <Text style={[S.sectionLabel, { marginTop: data.buildBase > 0 ? 4 : 0 }]}>Launch</Text>
              <View style={S.baseRow}>
                <Text style={S.baseLabel}>Base</Text>
                <Text style={S.baseValue}>{fmt(data.launchBase)}</Text>
              </View>
              {data.launchItems.map((item, i) => (
                <View key={i} style={S.addonRow}>
                  <Text style={S.addonLabel}>{item.name}</Text>
                  <Text style={S.addonValue}>{fmt(item.price)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Fundraising section ── */}
          {data.fundraisingBase > 0 && (
            <View>
              <Text style={S.sectionLabel}>Fundraising</Text>
              <View style={S.baseRow}>
                <Text style={S.baseLabel}>Base</Text>
                <Text style={S.baseValue}>{fmt(data.fundraisingBase)}</Text>
              </View>
              {data.fundraisingItems.map((item, i) => (
                <View key={i} style={S.addonRow}>
                  <Text style={S.addonLabel}>{item.name}</Text>
                  <Text style={S.addonValue}>{fmt(item.price)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Overhead + discounts ── */}
          <View style={S.divider} />

          <View style={S.overheadRow}>
            <Text style={S.overheadLabel}>Overhead (10%)</Text>
            {data.overheadWaived ? (
              <Text style={[S.overheadValue, { color: '#9ca3af' }]}>Waived</Text>
            ) : (
              <Text style={S.overheadValue}>{fmt(data.overhead)}</Text>
            )}
          </View>

          {hasDeferredFee && (
            <View style={S.overheadRow}>
              <Text style={S.overheadLabel}>Deferred payment fee</Text>
              <Text style={S.overheadValue}>+{fmt(data.deferredFee)}</Text>
            </View>
          )}

          {data.crowdfundingDiscount > 0 && (
            <View style={S.discountRow}>
              <Text style={S.discountLabel}>
                Crowdfunding discount ({data.crowdfundingPercent}% off)
              </Text>
              <Text style={S.discountValue}>−{fmt(data.crowdfundingDiscount)}</Text>
            </View>
          )}

          {data.friendlyDiscount > 0 && (
            <View style={S.discountRow}>
              <Text style={S.discountLabel}>
                Friendly discount ({data.friendlyDiscountPercent}% off)
              </Text>
              <Text style={S.discountValue}>−{fmt(data.friendlyDiscount)}</Text>
            </View>
          )}

          {/* ── Total (keep divider + row together) ── */}
          <View wrap={false}>
            <View style={S.dividerHeavy} />
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TOTAL</Text>
              <Text style={S.totalValue}>{fmt(data.total)}</Text>
            </View>
          </View>

          {/* ── Payment box (full-bleed, never split) ── */}
          <View wrap={false} style={S.paymentBox}>
            <View style={S.paymentRow}>
              <Text style={S.paymentLabel}>{data.downPercent}% due at signing</Text>
              <Text style={S.paymentAmount}>{fmt(data.downAmount)}</Text>
            </View>
            <Text style={S.paymentSub}>Minimum payment to begin</Text>
          </View>

          {/* ── Special program note (never split) ── */}
          {data.specialProgram === 'crowdfunding' && (
            <View wrap={false} style={S.programNote}>
              <Text style={S.programNoteTitle}>Crowdfunding Program</Text>
              <Text style={S.programNoteText}>
                This quote includes a crowdfunding discount applied to all eligible line items
                (excludes Cast + Crew). Cast + Crew costs are billed at standard rates regardless
                of crowdfunding status.
                {data.deferPayment ? ' Deferred payment terms apply — balance due after campaign launch.' : ''}
              </Text>
            </View>
          )}
          {data.specialProgram === 'fundraising' && (
            <View wrap={false} style={S.programNote}>
              <Text style={S.programNoteTitle}>Private Equity Fundraising Program</Text>
              <Text style={S.programNoteText}>
                Minimum 20% due at signing, the remainder due on delivery or after you raise.
                Any amount unpaid at delivery pre-raise is billed at 2× post-raise.
                Travel outside Silicon Valley billed at 2× (flights, hotel, rental car, per diem).
                A maximum fee of 50% of the total will be due after 1 year if no funds have yet been raised.
              </Text>
            </View>
          )}

          {/* ── Prepared for (keep together, never split) ── */}
          <View wrap={false}>
            <Text style={S.preparedLabel}>Prepared for</Text>
            <Text style={S.preparedName}>{contact.name}</Text>
            <Text style={S.preparedDetail}>{contact.company}</Text>
            <Text style={S.preparedDetail}>{contact.email}</Text>
          </View>

        </View>

        {/* ── Fixed footer (repeats on every page) ── */}
        <View fixed style={S.fixedFooter}>
          <View style={S.fixedFooterInner}>
            <View>
              <Text style={S.footerText}>This quote is valid for 30 days from the date above.</Text>
              <Text style={S.footerText}>
                Ready to move forward?{' '}
                <Link src="https://cal.com/fnawtf/introduction" style={S.footerCallLink}>
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
