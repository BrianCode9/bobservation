// resumeInference.ts — infer target role and skill gaps from resume text

import { SKILL_DICT } from './skills';

// Role signals: keywords that suggest a particular target role
const ROLE_SIGNALS: { role: string; keywords: string[] }[] = [
  { role: 'Software Engineer',           keywords: ['software engineer', 'swe', 'backend', 'frontend', 'full stack', 'full-stack', 'web developer', 'developer'] },
  { role: 'Data Scientist',              keywords: ['data scientist', 'machine learning', 'ml engineer', 'deep learning', 'neural network', 'pytorch', 'tensorflow', 'scikit'] },
  { role: 'Data Analyst',                keywords: ['data analyst', 'analytics', 'tableau', 'power bi', 'sql', 'excel', 'business intelligence', 'bi analyst'] },
  { role: 'DevOps / Cloud Engineer',     keywords: ['devops', 'cloud engineer', 'infrastructure', 'kubernetes', 'terraform', 'ci/cd', 'docker', 'aws', 'azure', 'gcp'] },
  { role: 'Frontend Developer',          keywords: ['frontend', 'front end', 'react', 'vue', 'angular', 'css', 'html', 'ui developer', 'web design'] },
  { role: 'Backend Developer',           keywords: ['backend', 'back end', 'api', 'node.js', 'django', 'flask', 'spring', 'microservices'] },
  { role: 'Product Manager',             keywords: ['product manager', 'product management', 'roadmap', 'stakeholder', 'user story', 'agile', 'scrum master'] },
  { role: 'UX / Product Designer',       keywords: ['ux designer', 'product designer', 'figma', 'user research', 'wireframe', 'prototyping', 'design system'] },
  { role: 'Machine Learning Engineer',   keywords: ['ml engineer', 'mlops', 'model deployment', 'feature engineering', 'llm', 'nlp', 'computer vision'] },
  { role: 'Security Engineer',           keywords: ['security engineer', 'cybersecurity', 'penetration testing', 'soc', 'siem', 'vulnerability'] },
  { role: 'Mobile Developer',            keywords: ['ios', 'android', 'swift', 'kotlin', 'react native', 'flutter', 'mobile developer'] },
];

// Skills that are considered "foundational" and expected for most tech roles
const FOUNDATIONAL_SKILLS = ['Git', 'communication', 'teamwork', 'problem solving'];

export interface ResumeInference {
  inferredRole: string | null;         // most likely target role
  confidence: 'high' | 'medium' | 'low';
  topSkills: string[];                  // skills found in resume, top 8
  suggestedGaps: string[];              // skills commonly expected for that role but not found
  resumeSummary: string;                // one-line Bob summary
}

// Skills commonly needed per role (used for gap suggestions)
const ROLE_SKILL_EXPECTATIONS: Record<string, string[]> = {
  'Software Engineer':          ['Git', 'JavaScript', 'Python', 'SQL', 'Docker', 'React', 'communication'],
  'Data Scientist':             ['Python', 'SQL', 'machine learning', 'pandas', 'NumPy', 'TensorFlow', 'Jupyter'],
  'Data Analyst':               ['SQL', 'Excel', 'Python', 'Tableau', 'Power BI', 'data analysis'],
  'DevOps / Cloud Engineer':    ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD', 'Bash', 'Terraform'],
  'Frontend Developer':         ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Git'],
  'Backend Developer':          ['Python', 'Java', 'Node.js', 'SQL', 'Docker', 'REST', 'Git'],
  'Product Manager':            ['communication', 'leadership', 'Agile', 'Scrum', 'Jira', 'teamwork'],
  'UX / Product Designer':      ['Figma', 'communication', 'teamwork', 'problem solving'],
  'Machine Learning Engineer':  ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'Docker', 'machine learning', 'Git'],
  'Security Engineer':          ['Linux', 'Python', 'Git', 'communication'],
  'Mobile Developer':           ['Swift', 'Kotlin', 'Git', 'JavaScript'],
};

export function inferFromResume(resumeText: string): ResumeInference {
  const lower = resumeText.toLowerCase();

  // Find detected skills
  const topSkills = SKILL_DICT.filter(s => lower.includes(s.toLowerCase()));

  if (resumeText.trim().length < 50) {
    return { inferredRole: null, confidence: 'low', topSkills: [], suggestedGaps: [], resumeSummary: 'Paste more resume text for Bob to analyse.' };
  }

  // Score each role by keyword hits
  const scores = ROLE_SIGNALS.map(({ role, keywords }) => ({
    role,
    score: keywords.filter(k => lower.includes(k)).length,
  }));
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  const inferredRole = best.score > 0 ? best.role : null;
  const confidence = best.score >= 3 ? 'high' : best.score >= 1 ? 'medium' : 'low';

  // Skill gaps for inferred role
  const resumeSkillSet = new Set(topSkills.map(s => s.toLowerCase()));
  const expected = inferredRole ? (ROLE_SKILL_EXPECTATIONS[inferredRole] ?? []) : FOUNDATIONAL_SKILLS;
  const suggestedGaps = expected.filter(s => !resumeSkillSet.has(s.toLowerCase())).slice(0, 5);

  // Summary
  let resumeSummary = '';
  if (!inferredRole) {
    resumeSummary = `Bob found ${topSkills.length} skill${topSkills.length !== 1 ? 's' : ''} but couldn't pin down a target role. Add a summary or job title.`;
  } else if (confidence === 'high') {
    resumeSummary = `Bob thinks you're targeting ${inferredRole}. ${topSkills.length} skills found, ${suggestedGaps.length} gap${suggestedGaps.length !== 1 ? 's' : ''} spotted.`;
  } else {
    resumeSummary = `Bob guesses ${inferredRole} — could be wrong. Add more role-specific keywords to confirm.`;
  }

  return { inferredRole, confidence, topSkills: topSkills.slice(0, 10), suggestedGaps, resumeSummary };
}
