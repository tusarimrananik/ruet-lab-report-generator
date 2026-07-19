export type DepartmentOption = {
  code: string;
  name: string;
};

export type ReportFormat = "assembly" | "programming" | "electrical" | "experimental" | "general";

export type SessionalCourse = {
  code: string;
  title: string;
  format: ReportFormat;
};

export type UniversityOption = {
  id: string;
  shortName: string;
  name: string;
  verified: boolean;
  enabled: boolean;
  coverPreset: {
    institutionName: string;
    shortName: string;
    motto?: string;
    logo: "ruet" | "custom";
  };
  departments: DepartmentOption[];
};

export const academicTerms = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"] as const;
export type AcademicTerm = typeof academicTerms[number];

const course = (code: string, title: string, format: ReportFormat = "programming"): SessionalCourse => ({ code, title, format });

export const ruetCseSessionalCourses: Record<AcademicTerm, SessionalCourse[]> = {
  "1-1": [
    course("CSE 1100", "Computer Fundamentals and Ethics Sessional", "general"),
    course("CSE 1102", "Structured Programming Sessional"),
    course("EEE 1152", "Basic Electrical Engineering Sessional", "electrical"),
    course("Hum 1114", "Functional English Sessional", "general"),
    course("Chem 1114", "Inorganic and Physical Chemistry Sessional", "experimental"),
  ],
  "1-2": [
    course("CSE 1200", "Competitive Programming Sessional"),
    course("CSE 1202", "Data Structure Sessional"),
    course("CSE 1204", "Object Oriented Programming Sessional"),
    course("EEE 1252", "Electronic Devices and Circuits Sessional", "electrical"),
    course("Phy 1214", "Physics Sessional", "experimental"),
  ],
  "2-1": [
    course("CSE 2102", "Discrete Mathematics Sessional", "general"),
    course("CSE 2104", "Digital Logic Design Sessional", "electrical"),
    course("EEE 2152", "Electrical Drives and Instrumentations Sessional", "electrical"),
  ],
  "2-2": [
    course("CSE 2200", "Technical Writing and Presentation Sessional", "general"),
    course("CSE 2202", "Algorithm Analysis and Design Sessional"),
    course("CSE 2204", "Numerical Methods Sessional"),
    course("CSE 2206", "Microprocessors, Microcontrollers and Assembly Language Sessional", "assembly"),
  ],
  "3-1": [
    course("CSE 3102", "Database Systems Sessional"),
    course("CSE 3106", "Computer Interfacing and Embedded System Sessional", "electrical"),
    course("CSE 3108", "Computer Architecture Sessional", "electrical"),
  ],
  "3-2": [
    course("CSE 3202", "Operating Systems Sessional"),
    course("CSE 3204", "Data Communication Sessional", "electrical"),
    course("CSE 3206", "Software Engineering Sessional"),
    course("CSE 3208", "Artificial Intelligence Sessional"),
    course("CSE 3210", "Digital Signal Processing Sessional", "electrical"),
  ],
  "4-1": [
    course("CSE 4102", "Compiler Design Sessional"),
    course("CSE 4104", "Computer Networks Sessional"),
    course("CSE 4106", "Digital Image Processing Sessional"),
    course("CSE 4110", "Information Systems Analysis and Design Sessional"),
    course("CSE 4112", "Unix Programming Sessional"),
    course("CSE 4114", "Digital System Design Sessional", "electrical"),
    course("CSE 4116", "Simulation and Modeling Sessional"),
    course("CSE 4118", "Wireless Networks Sessional"),
    course("CSE 4120", "Data Mining Sessional"),
    course("CSE 4122", "Computer Vision Sessional"),
    course("CSE 4124", "Knowledge Engineering Sessional"),
  ],
  "4-2": [
    course("CSE 4202", "Computer Graphics Sessional"),
    course("CSE 4204", "Machine Learning Sessional"),
    course("CSE 4206", "Security and Privacy Sessional"),
  ],
};

const demoSessionalCourses: SessionalCourse[] = [
  course("DEMO 1002", "Programming Sessional"),
  course("DEMO 1004", "Electrical Engineering Sessional", "electrical"),
  course("DEMO 1006", "Instrumentation Sessional", "electrical"),
];

const ruetDepartments: DepartmentOption[] = [
  { code: "EEE", name: "Electrical & Electronic Engineering" },
  { code: "CSE", name: "Computer Science & Engineering" },
  { code: "ECE", name: "Electrical & Computer Engineering" },
  { code: "ETE", name: "Electronics & Telecommunication Engineering" },
  { code: "CE", name: "Civil Engineering" },
  { code: "Arch", name: "Architecture" },
  { code: "URP", name: "Urban & Regional Planning" },
  { code: "BECM", name: "Building Engineering & Construction Management" },
  { code: "IPE", name: "Industrial & Production Engineering" },
  { code: "CME", name: "Ceramic & Metallurgical Engineering" },
  { code: "MTE", name: "Mechatronics Engineering" },
  { code: "MSE", name: "Materials Science & Engineering" },
  { code: "ME", name: "Mechanical Engineering" },
  { code: "ChE", name: "Chemical Engineering" },
  { code: "Chem", name: "Chemistry" },
  { code: "Math", name: "Mathematics" },
  { code: "Phy", name: "Physics" },
  { code: "Hum", name: "Humanities" },
];

const demoDepartments: DepartmentOption[] = [
  { code: "CSE", name: "Computer Science & Engineering" },
  { code: "EEE", name: "Electrical & Electronic Engineering" },
  { code: "CE", name: "Civil Engineering" },
  { code: "ME", name: "Mechanical Engineering" },
  { code: "ECE", name: "Electrical & Computer Engineering" },
  { code: "ETE", name: "Electronics & Telecommunication Engineering" },
  { code: "IPE", name: "Industrial & Production Engineering" },
  { code: "Arch", name: "Architecture" },
  { code: "URP", name: "Urban & Regional Planning" },
  { code: "ChE", name: "Chemical Engineering" },
];

export const universities: UniversityOption[] = [
  {
    id: "ruet",
    shortName: "RUET",
    name: "Rajshahi University of Engineering & Technology",
    verified: true,
    enabled: true,
    coverPreset: { institutionName: "Rajshahi University of Engineering & Technology", shortName: "RUET", motto: "Heaven’s Light is Our Guide", logo: "ruet" },
    departments: ruetDepartments,
  },
  {
    id: "buet",
    shortName: "BUET",
    name: "Bangladesh University of Engineering and Technology",
    verified: false,
    enabled: false,
    coverPreset: { institutionName: "Bangladesh University of Engineering and Technology", shortName: "BUET", logo: "custom" },
    departments: demoDepartments,
  },
  {
    id: "ru",
    shortName: "RU",
    name: "University of Rajshahi",
    verified: false,
    enabled: false,
    coverPreset: { institutionName: "University of Rajshahi", shortName: "RU", logo: "custom" },
    departments: demoDepartments,
  },
  {
    id: "cuet",
    shortName: "CUET",
    name: "Chittagong University of Engineering & Technology",
    verified: false,
    enabled: false,
    coverPreset: { institutionName: "Chittagong University of Engineering & Technology", shortName: "CUET", logo: "custom" },
    departments: demoDepartments,
  },
  {
    id: "kuet",
    shortName: "KUET",
    name: "Khulna University of Engineering & Technology",
    verified: false,
    enabled: false,
    coverPreset: { institutionName: "Khulna University of Engineering & Technology", shortName: "KUET", logo: "custom" },
    departments: demoDepartments,
  },
  {
    id: "sust",
    shortName: "SUST",
    name: "Shahjalal University of Science and Technology",
    verified: false,
    enabled: false,
    coverPreset: { institutionName: "Shahjalal University of Science and Technology", shortName: "SUST", logo: "custom" },
    departments: demoDepartments,
  },
  {
    id: "du",
    shortName: "DU",
    name: "University of Dhaka",
    verified: false,
    enabled: false,
    coverPreset: { institutionName: "University of Dhaka", shortName: "DU", logo: "custom" },
    departments: demoDepartments,
  },
  {
    id: "other",
    shortName: "Other",
    name: "Other University",
    verified: false,
    enabled: false,
    coverPreset: { institutionName: "Other University", shortName: "University", logo: "custom" },
    departments: demoDepartments,
  },
];

export const enabledUniversities = universities.filter((university) => university.enabled);

export const getUniversity = (id: string) => universities.find(university => university.id === id) ?? universities[0];

export const getDepartment = (universityId: string, code: string) => {
  const university = getUniversity(universityId);
  return university.departments.find(department => department.code === code) ?? university.departments[0];
};

export const getSessionalCourses = (universityId: string, departmentCode: string, term: string): SessionalCourse[] => {
  const university = getUniversity(universityId);
  if (!university.verified) return demoSessionalCourses;
  if (departmentCode === "CSE" && academicTerms.includes(term as AcademicTerm)) {
    return ruetCseSessionalCourses[term as AcademicTerm];
  }
  return [];
};
