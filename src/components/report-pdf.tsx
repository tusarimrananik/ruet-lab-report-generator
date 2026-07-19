import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import TeXGyreTermesBold from '@/assets/fonts/TeXGyreTermes-Bold.ttf';
import TeXGyreTermes from '@/assets/fonts/TeXGyreTermes-Regular.ttf';
import type { DocumentType, TitleStyle } from '@/data/document-presets';

Font.register({
  family: 'TeX Gyre Termes',
  fonts: [{ src: TeXGyreTermes }, { src: TeXGyreTermesBold, fontWeight: 700 }],
});

export type ReportSection = {
  id: string;
  title: string;
  body: string;
  kind?: 'code' | 'text';
  placeholder?: string;
};

export type LabReport = {
  documentType: DocumentType;
  titleStyle: TitleStyle;
  preset: string;
  university: string;
  presetDepartment: string;
  semester: string;
  sessionalCourse: string;
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
  page: { padding: 72, fontFamily: 'TeX Gyre Termes', fontSize: 12, lineHeight: 1.5 },
  title: { marginBottom: 22, fontSize: 15, fontWeight: 700 },
  titleUnderlined: { textDecoration: 'underline' },
  titlePlain: { fontWeight: 400 },
  section: { marginBottom: 14 },
  heading: { marginBottom: 5, fontSize: 14, fontWeight: 700 },
  paragraph: { marginBottom: 4, textAlign: 'justify' },
  code: { marginBottom: 6, padding: 10, border: '1px solid #222', fontFamily: 'Courier', fontSize: 11, lineHeight: 1.3 },
  image: { maxWidth: '100%', objectFit: 'contain', marginVertical: 8 },
});

const splitContent = (body: string) =>
  body.split(/(\[IMAGE:data:image\/[^\]]+\])/).filter(Boolean);

export function ReportDocument({ report }: { report: LabReport }) {
  const documentTitle = report.documentType === 'Lab Report'
    ? `Lab No. ${report.labNo}: ${report.labTitle}`
    : report.labTitle || report.documentType;
  const titleStyle = report.titleStyle === 'underlined'
    ? [styles.title, styles.titleUnderlined]
    : report.titleStyle === 'plain'
      ? [styles.title, styles.titlePlain]
      : styles.title;
  return (
    <Document title={`${report.courseCode} ${report.documentType}`}>
      <Page size="A4" style={styles.page} wrap>
        <Text style={titleStyle}>{documentTitle}</Text>
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
      </Page>
    </Document>
  );
}
