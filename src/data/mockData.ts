import { Employee, Evaluation, Criterion } from '../types';

// Sample employees
export const employees: Employee[] = [
  {
    id: '1',
    name: 'João Silva',
    position: 'Tech Lead',
    department: 'Engineering',
    joinDate: '2020-03-15',
  },
  {
    id: '2',
    name: 'Maria Santos',
    position: 'UX Designer',
    department: 'Design',
    joinDate: '2021-06-10',
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    position: 'Project Manager',
    department: 'Project Management',
    joinDate: '2019-11-05',
  },
  {
    id: '4',
    name: 'Ana Costa',
    position: 'Software Developer',
    department: 'Engineering',
    joinDate: '2022-01-20',
  },
  {
    id: '5',
    name: 'Carlos Mendes',
    position: 'HR Specialist',
    department: 'People & Management',
    joinDate: '2021-04-12',
  },
];

// Technical criteria
export const technicalCriteria: Criterion[] = [
  {
    id: 't1',
    name: 'Technical Knowledge',
    description: 'Demonstrates domain expertise in their area of specialization',
    category: 'technical',
  },
  {
    id: 't2',
    name: 'Problem Solving',
    description: 'Ability to analyze issues and develop effective solutions',
    category: 'technical',
  },
  {
    id: 't3',
    name: 'Quality of Work',
    description: 'Delivers high-quality work that meets standards and requirements',
    category: 'technical',
  },
  {
    id: 't4',
    name: 'Process Adherence',
    description: 'Follows established processes and procedures correctly',
    category: 'technical',
  },
];

// Behavioral criteria
export const behavioralCriteria: Criterion[] = [
  {
    id: 'b1',
    name: 'Communication',
    description: 'Communicates clearly and effectively with team members and stakeholders',
    category: 'behavioral',
  },
  {
    id: 'b2',
    name: 'Teamwork',
    description: 'Collaborates well with others and contributes positively to team dynamics',
    category: 'behavioral',
  },
  {
    id: 'b3',
    name: 'Adaptability',
    description: 'Adapts well to changes and new challenges',
    category: 'behavioral',
  },
  {
    id: 'b4',
    name: 'Initiative',
    description: 'Takes initiative and proactively identifies opportunities for improvement',
    category: 'behavioral',
  },
];

// Deliveries criteria
export const deliveriesCriteria: Criterion[] = [
  {
    id: 'd1',
    name: 'Meeting Deadlines',
    description: 'Consistently delivers work within agreed timeframes',
    category: 'deliveries',
  },
  {
    id: 'd2',
    name: 'Goal Achievement',
    description: 'Achieves established goals and objectives',
    category: 'deliveries',
  },
  {
    id: 'd3',
    name: 'Productivity',
    description: 'Maintains high productivity levels and efficient use of time',
    category: 'deliveries',
  },
  {
    id: 'd4',
    name: 'Value Generation',
    description: 'Generates valuable outcomes that contribute to company objectives',
    category: 'deliveries',
  },
];

// Sample evaluations
export const evaluations: Evaluation[] = [
  {
    id: 'eval1',
    employeeId: '1',
    evaluatorId: 'admin',
    date: '2023-11-15',
    status: 'completed',
    criteria: [
      { ...technicalCriteria[0], score: 5 },
      { ...technicalCriteria[1], score: 4 },
      { ...technicalCriteria[2], score: 4 },
      { ...technicalCriteria[3], score: 5 },
      { ...behavioralCriteria[0], score: 4 },
      { ...behavioralCriteria[1], score: 5 },
      { ...behavioralCriteria[2], score: 4 },
      { ...behavioralCriteria[3], score: 5 },
      { ...deliveriesCriteria[0], score: 4 },
      { ...deliveriesCriteria[1], score: 5 },
      { ...deliveriesCriteria[2], score: 4 },
      { ...deliveriesCriteria[3], score: 5 },
    ],
    feedback: {
      strengths: 'Excellent technical skills and leadership qualities. Takes initiative in solving complex problems.',
      improvements: 'Could delegate more tasks to team members to develop their skills.',
      observations: 'João has been a key contributor to project success this year.',
    },
    technicalScore: 4.5,
    behavioralScore: 4.5,
    deliveriesScore: 4.5,
    finalScore: 4.5,
    lastUpdated: '2023-11-15',
    isDraft: false,
  },
  {
    id: 'eval2',
    employeeId: '2',
    evaluatorId: 'admin',
    date: '2023-10-20',
    status: 'completed',
    criteria: [
      { ...technicalCriteria[0], score: 4 },
      { ...technicalCriteria[1], score: 4 },
      { ...technicalCriteria[2], score: 5 },
      { ...technicalCriteria[3], score: 4 },
      { ...behavioralCriteria[0], score: 5 },
      { ...behavioralCriteria[1], score: 4 },
      { ...behavioralCriteria[2], score: 4 },
      { ...behavioralCriteria[3], score: 3 },
      { ...deliveriesCriteria[0], score: 4 },
      { ...deliveriesCriteria[1], score: 4 },
      { ...deliveriesCriteria[2], score: 3 },
      { ...deliveriesCriteria[3], score: 4 },
    ],
    feedback: {
      strengths: 'Creative designs and excellent user research. Strong communication with stakeholders.',
      improvements: 'Could improve on taking more initiative with new project ideas.',
      observations: 'Maria has made significant contributions to improving our product UX.',
    },
    technicalScore: 4.25,
    behavioralScore: 4.0,
    deliveriesScore: 3.75,
    finalScore: 4.0,
    lastUpdated: '2023-10-20',
    isDraft: false,
  },
  {
    id: 'eval3',
    employeeId: '3',
    evaluatorId: 'admin',
    date: '2023-12-05',
    status: 'in-progress',
    criteria: [
      { ...technicalCriteria[0], score: 4 },
      { ...technicalCriteria[1], score: 3 },
      { ...technicalCriteria[2], score: 4 },
      { ...technicalCriteria[3], score: 4 },
      { ...behavioralCriteria[0], score: 3 },
      { ...behavioralCriteria[1], score: 4 },
      { ...behavioralCriteria[2], score: 3 },
      { ...behavioralCriteria[3], score: 3 },
    ],
    feedback: {
      strengths: 'Good project planning and coordination. Effective at managing timelines.',
      improvements: 'Communication could be more proactive, especially for project changes.',
      observations: '',
    },
    technicalScore: 3.75,
    behavioralScore: 3.25,
    deliveriesScore: 0,
    finalScore: 0,
    lastUpdated: '2023-12-10',
    isDraft: true,
  },
  {
    id: 'eval4',
    employeeId: '4',
    evaluatorId: 'admin',
    date: '2024-01-10',
    status: 'pending',
    criteria: [],
    feedback: {
      strengths: '',
      improvements: '',
      observations: '',
    },
    technicalScore: 0,
    behavioralScore: 0,
    deliveriesScore: 0,
    finalScore: 0,
    lastUpdated: '2024-01-10',
    isDraft: false,
  },
  {
    id: 'eval5',
    employeeId: '5',
    evaluatorId: 'admin',
    date: '2024-01-15',
    status: 'pending',
    criteria: [],
    feedback: {
      strengths: '',
      improvements: '',
      observations: '',
    },
    technicalScore: 0,
    behavioralScore: 0,
    deliveriesScore: 0,
    finalScore: 0,
    lastUpdated: '2024-01-15',
    isDraft: false,
  },
];

// Get all criteria combined
export const allCriteria = [...technicalCriteria, ...behavioralCriteria, ...deliveriesCriteria];