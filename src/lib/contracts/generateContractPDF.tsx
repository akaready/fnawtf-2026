import React from 'react';

export interface ContractPDFInput {
  title: string;
  contractType: string;
  body: string;
  signers: Array<{ name: string; email: string }>;
}

export async function generateContractPDF(input: ContractPDFInput): Promise<Blob> {
  const ReactPDF = await import('@react-pdf/renderer');
  const { Document, Page, Text, View, StyleSheet } = ReactPDF;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  ReactPDF.Font.register({
    family: 'SpaceGrotesk',
    fonts: [
      { src: `${origin}/fonts/SpaceGrotesk-Regular.ttf`, fontWeight: 400 },
      { src: `${origin}/fonts/SpaceGrotesk-Medium.ttf`, fontWeight: 500 },
      { src: `${origin}/fonts/SpaceGrotesk-Bold.ttf`, fontWeight: 700 },
    ],
  });

  const styles = StyleSheet.create({
    page: {
      fontFamily: 'SpaceGrotesk',
      fontSize: 11,
      lineHeight: 1.6,
      padding: 60,
      color: '#1a1a1a',
    },
    header: {
      marginBottom: 40,
      borderBottom: '2px solid #1a1a1a',
      paddingBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 700,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 12,
      color: '#666',
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    body: {
      marginBottom: 40,
    },
    paragraph: {
      marginBottom: 12,
    },
    signatureSection: {
      marginTop: 40,
      borderTop: '1px solid #ccc',
      paddingTop: 20,
    },
    signatureBlock: {
      marginBottom: 40,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    signatureLine: {
      borderBottom: '1px solid #1a1a1a',
      width: 200,
      marginBottom: 4,
      marginTop: 40,
    },
    signatureLabel: {
      fontSize: 9,
      color: '#666',
    },
    signerName: {
      fontSize: 11,
      fontWeight: 500,
      marginBottom: 2,
    },
    footer: {
      position: 'absolute' as const,
      bottom: 30,
      left: 60,
      right: 60,
      fontSize: 8,
      color: '#999',
      textAlign: 'center' as const,
    },
  });

  const typeLabel = input.contractType.toUpperCase().replace(/-/g, ' ');

  // Split body on double newlines for paragraphs
  const paragraphs = input.body.split(/\n\n+/).filter(Boolean);

  const ContractDoc = () => (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>{typeLabel}</Text>
          <Text style={styles.title}>{input.title}</Text>
        </View>
        <View style={styles.body}>
          {paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p.trim()}
            </Text>
          ))}
        </View>
        {input.signers.length > 0 && (
          <View style={styles.signatureSection}>
            <Text style={{ fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
              Signatures
            </Text>
            {input.signers.map((signer, i) => (
              <View key={i} style={styles.signatureBlock}>
                <View>
                  <Text style={styles.signerName}>{signer.name}</Text>
                  <Text style={styles.signatureLabel}>{signer.email}</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureLabel}>Signature</Text>
                </View>
                <View>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureLabel}>Date</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.footer}>
          Friends &apos;n Allies — {typeLabel} — Confidential
        </Text>
      </Page>
    </Document>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(ContractDoc) as any;
  const blob = await ReactPDF.pdf(element).toBlob();
  return blob;
}
