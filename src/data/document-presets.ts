import type { ReportSection } from '@/components/report-pdf';
import type { ReportFormat } from './report-presets';

export const documentTypes = ['Lab Report', 'Assignment', 'Research Paper', 'Thesis'] as const;
export type DocumentType = (typeof documentTypes)[number];

export const titleStyles = [
  { id: 'bold', label: 'Bold' },
  { id: 'underlined', label: 'Underlined' },
  { id: 'plain', label: 'Plain' },
] as const;
export type TitleStyle = (typeof titleStyles)[number]['id'];

const section = (
  id: string,
  title: string,
  placeholder: string,
  kind?: ReportSection['kind'],
): ReportSection => ({ id, title, body: '', placeholder, kind });

const labSections: Record<ReportFormat, ReportSection[]> = {
  assembly: [
    section('objective', 'Objective', 'State the purpose of the experiment clearly.'),
    section('theory', 'Theory', 'Explain the instructions, registers, or concepts used.'),
    section('code', 'Assembly Language Code', 'Paste the complete executable program here.', 'code'),
    section('output', 'Output', 'Add the observed output or upload an image.'),
    section('verdict', 'Verdict', 'State whether the expected result was obtained.'),
    section('discussion', 'Discussion', 'Explain the program flow and observed output.'),
    section('conclusion', 'Conclusion', 'Summarize what the experiment demonstrated.'),
  ],
  programming: [
    section('objective', 'Objective', 'Describe what the exercise verifies.'),
    section('theory', 'Theory', 'Explain the relevant ideas or logical rules.'),
    section('algorithm', 'Algorithm', 'Write the steps of the algorithm.'),
    section('code', 'Code', 'Paste clean, runnable code here.', 'code'),
    section('output', 'Sample Output', 'Add the program output or an observation.'),
    section('discussion', 'Discussion', 'Interpret the output and noteworthy cases.'),
    section('conclusion', 'Conclusion', 'Summarize what was verified and learned.'),
  ],
  electrical: [
    section('objectives', 'Objectives', 'State the objectives of the experiment.'),
    section('theory', 'Theory', 'Explain the operating principle and relevant formulae.'),
    section('apparatus', 'Required Apparatus', 'List equipment, ratings, and quantities.'),
    section('diagram', 'Circuit Diagram', 'Add the circuit diagram and its caption.'),
    section('procedure', 'Procedure', 'Describe connections, checks, and measurement steps.'),
    section('data', 'Data Table and Calculations', 'Add values, units, equations, and calculations.'),
    section('result', 'Result and Discussion', 'Compare results and discuss errors or limitations.'),
    section('conclusion', 'Conclusion', 'State what the experiment verified.'),
  ],
  experimental: [
    section('objective', 'Objective', 'State the purpose of the experiment.'),
    section('theory', 'Theory', 'Explain the scientific principle and relevant formulae.'),
    section('apparatus', 'Required Apparatus', 'List the equipment and materials used.'),
    section('procedure', 'Procedure', 'Describe the experimental steps in order.'),
    section('data', 'Observations and Calculations', 'Record observations, units, and calculations.'),
    section('result', 'Result', 'State the result obtained.'),
    section('discussion', 'Discussion', 'Interpret the result and discuss limitations.'),
    section('conclusion', 'Conclusion', 'Summarize what the experiment demonstrated.'),
  ],
  general: [
    section('objective', 'Objective', 'State the purpose and learning outcome.'),
    section('introduction', 'Introduction or Theory', 'Explain the relevant concepts.'),
    section('method', 'Method or Activity', 'Describe the completed work in sequence.'),
    section('output', 'Output or Deliverable', 'Add the produced work or observation.'),
    section('discussion', 'Discussion', 'Explain the outcome and limitations.'),
    section('conclusion', 'Conclusion', 'Summarize the completed work.'),
  ],
};

const documentSections: Record<Exclude<DocumentType, 'Lab Report'>, ReportSection[]> = {
  Assignment: [
    section('introduction', 'Introduction', 'Introduce the topic and purpose of the assignment.'),
    section('task', 'Problem or Task', 'State the assigned problem, question, or task.'),
    section('solution', 'Solution', 'Present the complete answer, analysis, or solution.'),
    section('discussion', 'Discussion', 'Discuss the result, reasoning, or limitations.'),
    section('conclusion', 'Conclusion', 'Summarize the main outcome.'),
    section('references', 'References', 'List the sources used.'),
  ],
  'Research Paper': [
    section('abstract', 'Abstract', 'Summarize the problem, method, findings, and conclusion.'),
    section('keywords', 'Keywords', 'Add relevant keywords.'),
    section('introduction', 'Introduction', 'Introduce the research problem and objectives.'),
    section('literature', 'Literature Review', 'Review relevant previous work.'),
    section('methodology', 'Methodology', 'Describe the research design, data, and methods.'),
    section('results', 'Results', 'Present the findings.'),
    section('discussion', 'Discussion', 'Interpret the findings and limitations.'),
    section('conclusion', 'Conclusion', 'Summarize the findings and implications.'),
    section('references', 'References', 'List all cited sources.'),
  ],
  Thesis: [
    section('abstract', 'Abstract', 'Summarize the research and its principal findings.'),
    section('acknowledgements', 'Acknowledgements', 'Acknowledge relevant support and guidance.'),
    section('introduction', 'Introduction', 'Present the background, problem, and objectives.'),
    section('literature', 'Literature Review', 'Critically review relevant literature.'),
    section('methodology', 'Methodology', 'Describe the research design and methods.'),
    section('results', 'Results', 'Present the research findings.'),
    section('discussion', 'Discussion', 'Interpret the results and their significance.'),
    section('conclusion', 'Conclusion', 'Summarize the research conclusions.'),
    section('recommendations', 'Recommendations', 'State recommendations and future work.'),
    section('references', 'References', 'List all cited sources.'),
    section('appendices', 'Appendices', 'Add supporting material when applicable.'),
  ],
};

export const getDocumentSections = (
  documentType: DocumentType,
  labFormat: ReportFormat = 'general',
) => (documentType === 'Lab Report' ? labSections[labFormat] : documentSections[documentType])
  .map((item) => ({ ...item }));

export const mergeDocumentSections = (
  current: ReportSection[],
  next: ReportSection[],
) => next.map((item) => ({
  ...item,
  body: current.find((existing) => existing.id === item.id)?.body ?? '',
}));

export const hasRemovedContent = (current: ReportSection[], next: ReportSection[]) => {
  const nextIds = new Set(next.map((item) => item.id));
  return current.some((item) => item.body.trim() && !nextIds.has(item.id));
};
