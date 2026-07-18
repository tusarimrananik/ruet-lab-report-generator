import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import TeXGyreTermesBold from '@/assets/fonts/TeXGyreTermes-Bold.ttf';
import TeXGyreTermes from '@/assets/fonts/TeXGyreTermes-Regular.ttf';

Font.register({
  family: 'TeX Gyre Termes',
  fonts: [{ src: TeXGyreTermes }, { src: TeXGyreTermesBold, fontWeight: 700 }],
});

export type ReportSection = {
  id: string;
  title: string;
  body: string;
  kind?: 'code' | 'text';
};

export type LabReport = {
  preset: string;
  department: string;
  courseCode: string;
  courseTitle: string;
  labNo: string;
  labTitle: string;
  experimentDate: string;
  submissionDate: string;
  studentName: string;
  roll: string;
  section: string;
  series: string;
  teacherName: string;
  teacherTitle: string;
  sections: ReportSection[];
};

const styles = StyleSheet.create({
  page: { paddingTop: 56, paddingBottom: 56, paddingHorizontal: 64, fontFamily: 'TeX Gyre Termes', fontSize: 12, lineHeight: 1.5 },
  title: { marginBottom: 24, textAlign: 'center', fontSize: 16, fontWeight: 700 },
  meta: { marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #777' },
  metaRow: { flexDirection: 'row', marginBottom: 3 },
  metaLabel: { width: 105, fontWeight: 700 },
  metaValue: { flex: 1 },
  section: { marginBottom: 18 },
  heading: { marginBottom: 6, paddingBottom: 3, borderBottom: '1px solid #333', fontSize: 14, fontWeight: 700 },
  paragraph: { marginBottom: 5 },
  code: { marginBottom: 8, padding: 10, border: '1px solid #777', backgroundColor: '#f7f7f7', fontFamily: 'Courier', fontSize: 10, lineHeight: 1.35 },
  image: { maxWidth: '100%', objectFit: 'contain', marginVertical: 10 },
  pageNumber: { position: 'absolute', right: 64, bottom: 28, color: '#666', fontSize: 9 },
});

const splitContent = (body: string) =>
  body.split(/(\[IMAGE:data:image\/[^\]]+\])/).filter(Boolean);

export function ReportDocument({ report }: { report: LabReport }) {
  return (
    <Document title={`${report.courseCode} Lab ${report.labNo}`}>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>Lab No. {report.labNo}: {report.labTitle}</Text>
        <View style={styles.meta} wrap={false}>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Course Code:</Text><Text style={styles.metaValue}>{report.courseCode}</Text></View>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Course Title:</Text><Text style={styles.metaValue}>{report.courseTitle}</Text></View>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Student:</Text><Text style={styles.metaValue}>{report.studentName} ({report.roll})</Text></View>
        </View>
        {report.sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.heading}>{section.title}</Text>
            {splitContent(section.body).map((part, index) =>
              part.startsWith('[IMAGE:') ? (
                <Image key={`${section.id}-${index}`} src={part.slice(7, -1)} style={styles.image} />
              ) : (
                <Text key={`${section.id}-${index}`} style={section.kind === 'code' ? styles.code : styles.paragraph}>{part}</Text>
              ),
            )}
          </View>
        ))}
        <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>
    </Document>
  );
}
