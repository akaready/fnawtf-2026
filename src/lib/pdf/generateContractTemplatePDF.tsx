
export async function generateContractTemplatePDF(name: string, body: string): Promise<Blob> {
  const ReactPDF = await import('@react-pdf/renderer');
  const { Document, Page, Text, View, StyleSheet, Font } = ReactPDF;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  Font.register({
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
      color: '#1a1a1a',
      paddingTop: 64,
      paddingBottom: 64,
      paddingHorizontal: 72,
      lineHeight: 1.6,
    },
    header: {
      marginBottom: 32,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      paddingBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 700,
      color: '#111827',
      marginBottom: 4,
    },
    typeBadge: {
      fontSize: 9,
      fontWeight: 500,
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    body: {
      flex: 1,
    },
    paragraph: {
      marginBottom: 8,
    },
    h1: {
      fontSize: 16,
      fontWeight: 700,
      marginTop: 20,
      marginBottom: 8,
      color: '#111827',
    },
    h2: {
      fontSize: 13,
      fontWeight: 700,
      marginTop: 16,
      marginBottom: 6,
      color: '#111827',
    },
    h3: {
      fontSize: 11,
      fontWeight: 700,
      marginTop: 12,
      marginBottom: 4,
      color: '#374151',
    },
    hr: {
      borderBottomWidth: 1,
      borderBottomColor: '#d1d5db',
      marginVertical: 16,
    },
    token: {
      backgroundColor: '#e0f2fe',
      color: '#0369a1',
      borderRadius: 2,
    },
    footer: {
      position: 'absolute',
      bottom: 32,
      left: 72,
      right: 72,
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',
      paddingTop: 8,
      fontSize: 9,
      color: '#9ca3af',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });

  // Parse markdown body into renderable lines
  const renderBody = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# '))  return <Text key={i} style={styles.h1}>{line.slice(2)}</Text>;
      if (line.startsWith('## ')) return <Text key={i} style={styles.h2}>{line.slice(3)}</Text>;
      if (line.startsWith('### '))return <Text key={i} style={styles.h3}>{line.slice(4)}</Text>;
      if (/^---+$/.test(line.trim())) return <View key={i} style={styles.hr} />;
      if (line.trim() === '')     return <Text key={i} style={{ marginBottom: 4 }}>{' '}</Text>;

      // Inline token highlighting: split on {{token}} pattern
      const parts = line.split(/(\{\{[\w]+\}\})/g);
      return (
        <Text key={i} style={styles.paragraph}>
          {parts.map((part, j) =>
            /^\{\{[\w]+\}\}$/.test(part)
              ? <Text key={j} style={styles.token}>{part}</Text>
              : part
          )}
        </Text>
      );
    });
  };

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{name || 'Untitled Template'}</Text>
          <Text style={styles.typeBadge}>Template Preview</Text>
        </View>
        <View style={styles.body}>
          {renderBody(body)}
        </View>
        <View style={styles.footer} fixed>
          <Text>Template Preview — merge tokens will be replaced at contract creation</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ReactPDF.pdf(doc as any).toBlob();
}
