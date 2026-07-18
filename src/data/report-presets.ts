export type DepartmentOption = {
  code: string;
  name: string;
};

export type UniversityOption = {
  id: string;
  shortName: string;
  name: string;
  verified: boolean;
  departments: DepartmentOption[];
};

export const academicTerms = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"] as const;

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
    departments: ruetDepartments,
  },
  {
    id: "buet",
    shortName: "BUET",
    name: "Bangladesh University of Engineering and Technology",
    verified: false,
    departments: demoDepartments,
  },
  {
    id: "ru",
    shortName: "RU",
    name: "University of Rajshahi",
    verified: false,
    departments: demoDepartments,
  },
  {
    id: "cuet",
    shortName: "CUET",
    name: "Chittagong University of Engineering & Technology",
    verified: false,
    departments: demoDepartments,
  },
  {
    id: "kuet",
    shortName: "KUET",
    name: "Khulna University of Engineering & Technology",
    verified: false,
    departments: demoDepartments,
  },
  {
    id: "sust",
    shortName: "SUST",
    name: "Shahjalal University of Science and Technology",
    verified: false,
    departments: demoDepartments,
  },
  {
    id: "du",
    shortName: "DU",
    name: "University of Dhaka",
    verified: false,
    departments: demoDepartments,
  },
  {
    id: "other",
    shortName: "Other",
    name: "Other University",
    verified: false,
    departments: demoDepartments,
  },
];

export const getUniversity = (id: string) => universities.find(university => university.id === id) ?? universities[0];

export const getDepartment = (universityId: string, code: string) => {
  const university = getUniversity(universityId);
  return university.departments.find(department => department.code === code) ?? university.departments[0];
};
