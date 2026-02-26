import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { v4 as uuidv4 } from 'uuid';
import type { CVFormValues } from '../schema/cvSchema';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Helper to convert raw text lines from PDF into HTML for Tiptap Editor.
 * Detects bullet points and wraps them in <ul><li>, otherwise wraps in <p>.
 */
function formatLinesToHTML(lines: string[]): string {
  if (!lines || lines.length === 0) return '';
  let inList = false;
  let html = '';
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Check if line starts with a common bullet symbol
    const isBullet = /^[-•●◦▪❖◆◇►★☆✦✧\*\+]\s+/.test(line);
    
    if (isBullet) {
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      const cleanLine = line.replace(/^[-•●◦▪❖◆◇►★☆✦✧\*\+]\s+/, '');
      html += `<li>${cleanLine}</li>\n`;
    } else {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      // Tech stack might be bolded already or just normal text
      html += `<p>${line}</p>\n`;
    }
  }
  
  if (inList) {
    html += '</ul>\n';
  }
  
  return html.trim();
}

// ── Regex helpers ──────────────────────────────────────────────────
const DATE_PATTERN =
  /(?:\d{1,2}[\/\-]\d{4}|\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s.]*\d{4}|Tháng\s*\d{1,2}[\/\-]\d{4})/i;

const DATE_RANGE_RE =
  /(?<start>(?:\d{1,2}[\/\-])?\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s.]*\d{4}|Tháng\s*\d{1,2}[\/\-]\d{4})\s*[-–—~]\s*(?<end>(?:\d{1,2}[\/\-])?\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s.]*\d{4}|Tháng\s*\d{1,2}[\/\-]\d{4}|Present|Hiện tại|Nay|Current|Now)/i;

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:(?:\+|00)84|0)(?:\s*\d){9}/;
const URL_RE = /https?:\/\/[^\s,)]+/g;

// ── Section heading patterns (Vietnamese + English) ────────────────
const SECTION_PATTERNS: Record<string, RegExp> = {
  summary:
    /^(?:Tóm tắt|Summary|Giới thiệu(?: bản thân)?|Mục tiêu(?: nghề nghiệp)?|Objective|About(?: Me)?|Profile|Thông tin chung|Career (?:Objective|Summary)|Professional Summary)$/i,
  experience:
    /^(?:Kinh nghiệm(?: làm việc)?|Experience|Work Experience|Lịch sử làm việc|Employment(?: History)?|Professional Experience|Quá trình làm việc)$/i,
  education:
    /^(?:Học vấn|Trình độ(?: học vấn)?|Giáo dục|Education|Quá trình học tập|Academic(?: Background)?|Bằng cấp)$/i,
  skills:
    /^(?:Kỹ năng(?: chuyên môn| mềm| kỹ thuật)?|Skills|Core Competencies|Technical Skills|Competencies|Năng lực|Chuyên môn)$/i,
  projects:
    /^(?:Dự án(?: cá nhân| nổi bật| tiêu biểu)?|Projects|Personal Projects|Notable Projects|Side Projects)$/i,
  certifications:
    /^(?:Chứng chỉ|Certifications?|Licenses?|Awards?|Giải thưởng|Thành tích|Honors?\s*(?:\&|and)\s*Awards?)$/i,
};

// ── Text extraction from PDF (sorted by coordinates) ──────────────
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allLines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Collect all text items with coordinates
    const items = textContent.items
      .filter((item: any) => item.str && item.str.trim())
      .map((item: any) => ({
        x: item.transform[4] as number,
        y: item.transform[5] as number,
        text: item.str as string,
      }));

    // CRITICAL FIX: Sort items by Y descending (top to bottom), then X ascending (left to right)
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
      return a.x - b.x;
    });

    // Merge items on same line (within 3px Y tolerance)
    let lastY = -1;
    let currentLine = '';
    for (const item of items) {
      if (lastY !== -1 && Math.abs(item.y - lastY) > 3) {
        allLines.push(currentLine.replace(/ +/g, ' ').trim());
        currentLine = item.text;
      } else {
        currentLine += (currentLine ? ' ' : '') + item.text;
      }
      lastY = item.y;
    }
    if (currentLine) {
      allLines.push(currentLine.replace(/ +/g, ' ').trim());
    }
  }

  return allLines.filter(Boolean).join('\n');
}

// ── Contact info extraction ───────────────────────────────────────
function extractContactInfo(text: string) {
  const emailMatch = text.match(EMAIL_RE);
  const phoneMatch = text.match(PHONE_RE);
  const linkMatches = text.match(URL_RE) || [];

  let linkedin = '',
    github = '',
    website = '';
  linkMatches.forEach((link) => {
    const clean = link.replace(/[.,;:)]+$/, '');
    if (clean.includes('linkedin.com')) linkedin = clean;
    else if (clean.includes('github.com')) github = clean;
    else if (!website) website = clean;
  });

  return {
    email: emailMatch?.[0] || '',
    phone: phoneMatch ? phoneMatch[0].replace(/\s/g, '') : '',
    linkedin,
    github,
    website,
  };
}

// ── Section splitting ─────────────────────────────────────────────
interface RawSection {
  key: string;
  lines: string[];
}

function splitSections(text: string): { headerLines: string[]; sections: RawSection[] } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const headerLines: string[] = [];
  const sections: RawSection[] = [];
  let currentSection: RawSection | null = null;

  for (const line of lines) {
    // Check if line is a section heading (usually short)
    if (line.length < 60) {
      let matched = false;
      for (const [key, re] of Object.entries(SECTION_PATTERNS)) {
        if (re.test(line)) {
          if (currentSection) sections.push(currentSection);
          currentSection = { key, lines: [] };
          matched = true;
          break;
        }
      }
      if (matched) continue;
    }

    if (currentSection) {
      currentSection.lines.push(line);
    } else {
      headerLines.push(line);
    }
  }
  if (currentSection) sections.push(currentSection);

  return { headerLines, sections };
}

// ── Parse profile from header ─────────────────────────────────────
function parseProfile(
  headerLines: string[],
  contact: ReturnType<typeof extractContactInfo>,
  summarySectionLines: string[]
) {
  const contactStrings = [contact.email, contact.phone, contact.linkedin, contact.github, contact.website].filter(
    Boolean
  );

  let fullName = '';
  let position = '';
  let location = '';

  for (const line of headerLines) {
    // Skip lines that are purely contact info
    if (contactStrings.some((c) => line.includes(c))) continue;
    if (URL_RE.test(line)) continue;

    if (!fullName) {
      // First header line: "Huynh Quoc Bao - Backend Developer" → split name and position
      const namePosMatch = line.match(/^(.+?)\s*[-–—]\s*(.+)$/);
      if (namePosMatch) {
        fullName = namePosMatch[1].trim();
        position = namePosMatch[2].trim();
      } else {
        fullName = line;
      }
    } else if (!position) {
      position = line;
    } else if (!location) {
      if (line.length < 60 && !DATE_PATTERN.test(line)) {
        location = line;
      }
    }
  }

  return {
    fullName,
    position,
    email: contact.email,
    phone: contact.phone,
    location,
    linkedin: contact.linkedin,
    github: contact.github,
    website: contact.website,
    summary: formatLinesToHTML(summarySectionLines),
  };
}

// ── Parse experience entries ──────────────────────────────────────
// Expected format from sorted PDF:
//   ❖ Bach Khoa Technology 06/2024 - Present
//   Backend Developer
//   ...bullet descriptions...
//   Tech Stack: ...
function parseExperience(lines: string[]) {
  const entries: CVFormValues['experience'] = [];
  let current: {
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string[];
    isCurrent: boolean;
    location: string;
  } | null = null;

  const ENTRY_START_RE = /^[❖◆◇►▪●★☆✦✧⬥♦]\s*(.+)/;

  const flushCurrent = () => {
    if (current) {
      entries.push({
        id: uuidv4(),
        company: current.company,
        role: current.role,
        startDate: current.startDate,
        endDate: current.endDate,
        description: formatLinesToHTML(current.description),
        isCurrent: current.isCurrent,
        location: current.location,
      });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for entry start: ❖ Company Name  06/2024 - Present
    const entryMatch = line.match(ENTRY_START_RE);
    if (entryMatch) {
      flushCurrent();

      const entryText = entryMatch[1];
      const dateRangeMatch = entryText.match(DATE_RANGE_RE);

      let company = entryText;
      let startDate = '';
      let endDate = '';
      let isCurrent = false;

      if (dateRangeMatch) {
        startDate = dateRangeMatch.groups?.start || '';
        endDate = dateRangeMatch.groups?.end || '';
        isCurrent = /present|hiện tại|nay|current|now/i.test(endDate);
        if (isCurrent) endDate = '';
        company = entryText.replace(DATE_RANGE_RE, '').trim();
      }

      // Next line is usually the role
      let role = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!ENTRY_START_RE.test(nextLine) && nextLine.length < 80) {
          role = nextLine;
          i++; // skip next line
        }
      }

      current = { company, role, startDate, endDate, description: [], isCurrent, location: '' };
      continue;
    }

    if (current) {
      const techMatch = line.match(/^Tech\s*Stack\s*[:：]\s*(.+)/i);
      if (techMatch) {
        current.description.push(`<b>Tech Stack:</b> ${techMatch[1].trim()}`);
      } else {
        current.description.push(line);
      }
    }
  }

  flushCurrent();

  // Fallback: if no ❖ markers, try date-range based parsing
  if (entries.length === 0 && lines.length > 0) {
    let curr: typeof current = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dateRangeMatch = line.match(DATE_RANGE_RE);
      if (dateRangeMatch) {
        if (curr) {
          entries.push({
            id: uuidv4(),
            company: curr.company,
            role: curr.role,
            startDate: curr.startDate,
            endDate: curr.endDate,
            description: formatLinesToHTML(curr.description),
            isCurrent: curr.isCurrent,
            location: curr.location,
          });
        }
        const start = dateRangeMatch.groups?.start || '';
        const end = dateRangeMatch.groups?.end || '';
        const isCurrent = /present|hiện tại|nay|current|now/i.test(end);
        const withoutDate = line.replace(DATE_RANGE_RE, '').trim();
        const role = i + 1 < lines.length ? lines[++i] : '';
        curr = { company: withoutDate, role, startDate: start, endDate: isCurrent ? '' : end, description: [], isCurrent, location: '' };
      } else if (curr) {
        const techMatch = line.match(/^Tech\s*Stack\s*[:：]\s*(.+)/i);
        if (techMatch) curr.description.push(`<b>Tech Stack:</b> ${techMatch[1].trim()}`);
        else curr.description.push(line);
      }
    }
    if (curr) {
      entries.push({
        id: uuidv4(), company: curr.company, role: curr.role,
        startDate: curr.startDate, endDate: curr.endDate,
        description: formatLinesToHTML(curr.description),
        isCurrent: curr.isCurrent, location: curr.location,
      });
    }
  }

  return entries;
}

// ── Parse education entries ───────────────────────────────────────
function parseEducation(lines: string[]) {
  const entries: CVFormValues['education'] = [];
  const ENTRY_START_RE = /^[❖◆◇►▪●★☆✦✧⬥♦]\s*(.+)/;

  let current: { institution: string; degree: string; startDate: string; endDate: string; description: string[] } | null = null;

  const flushCurrent = () => {
    if (current) {
      entries.push({
        id: uuidv4(),
        institution: current.institution,
        degree: current.degree,
        startDate: current.startDate,
        endDate: current.endDate,
        description: formatLinesToHTML(current.description),
      });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const entryMatch = line.match(ENTRY_START_RE);

    if (entryMatch) {
      flushCurrent();
      const entryText = entryMatch[1];
      const dateRangeMatch = entryText.match(DATE_RANGE_RE);

      let institution = entryText;
      let startDate = '';
      let endDate = '';

      if (dateRangeMatch) {
        startDate = dateRangeMatch.groups?.start || '';
        endDate = dateRangeMatch.groups?.end || '';
        institution = entryText.replace(DATE_RANGE_RE, '').trim();
      }

      let degree = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!ENTRY_START_RE.test(nextLine) && nextLine.length < 100) {
          degree = nextLine.replace(/^Major:\s*/i, '').trim();
          i++;
        }
      }

      current = { institution, degree, startDate, endDate, description: [] };
    } else if (current) {
      current.description.push(line);
    }
  }

  flushCurrent();

  // Fallback
  if (entries.length === 0 && lines.length > 0) {
    entries.push({
      id: uuidv4(),
      institution: lines[0] || '',
      degree: lines[1] || '',
      startDate: '',
      endDate: '',
      description: lines.slice(2).join('\n').trim(),
    });
  }

  return entries;
}

// ── Parse skills ──────────────────────────────────────────────────
function parseSkills(lines: string[]) {
  const entries: CVFormValues['skills'] = [];
  const CATEGORY_LINE_RE = /^([A-Z][A-Z\s&]+?)\s+([-–].+)$/;
  let currentCategory = '';
  let currentItems: string[] = [];

  const flushCategory = () => {
    if (currentCategory && currentItems.length > 0) {
      const description = '<ul>' + currentItems.map(i => `<li>${i}</li>`).join('') + '</ul>';
      entries.push({ id: uuidv4(), category: currentCategory, description });
    }
    currentItems = [];
  };

  for (const line of lines) {
    // Pattern: "TECHNICAL SKILLS - Programming/Frameworks: ..."
    const catMatch = line.match(CATEGORY_LINE_RE);
    if (catMatch) {
      flushCategory();
      currentCategory = catMatch[1].trim();
      // The rest is the first skill item
      const itemText = catMatch[2].replace(/^[-–]\s*/, '').trim();
      if (itemText) currentItems.push(itemText);
      continue;
    }

    // Lines starting with "- " are skill items within current category
    if (line.startsWith('-') || line.startsWith('–')) {
      const item = line.replace(/^[-–]\s*/, '').trim();
      if (item) currentItems.push(item);
    } else {
      // Might be a standalone category name or continuation
      const parts = line.split(/[:：]\s*/);
      if (parts.length >= 2) {
        flushCategory();
        currentCategory = parts[0].trim();
        const items = parts.slice(1).join(':').split(/[,;]/).map(s => s.trim()).filter(Boolean);
        currentItems = items;
      } else if (currentCategory) {
        // Continuation of items (e.g. "Golang" on its own line)
        currentItems.push(line.trim());
      }
    }
  }

  flushCategory();
  return entries;
}

// ── Parse projects ────────────────────────────────────────────────
function parseProjects(lines: string[]) {
  const entries: CVFormValues['projects'] = [];
  const ENTRY_START_RE = /^[❖◆◇►▪●★☆✦✧⬥♦]\s*(.+)/;
  const TECH_RE = /^(?:Công nghệ|Technologies?|Tech(?:nical)?\s*Stack|Sử dụng)[:\s：]+(.+)$/i;
  const ROLE_RE = /^(?:Vai trò|Role|Position)[:\s：]+(.+)$/i;

  let current: {
    name: string;
    role: string;
    description: string[];
    technologies: string[];
    link: string;
    startDate: string;
    endDate: string;
  } | null = null;

  const flushCurrent = () => {
    if (current) {
      entries.push({
        id: uuidv4(),
        name: current.name,
        role: current.role,
        description: formatLinesToHTML(current.description),
        technologies: current.technologies,
        link: current.link,
        startDate: current.startDate,
        endDate: current.endDate,
      });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const entryMatch = line.match(ENTRY_START_RE);

    if (entryMatch) {
      flushCurrent();
      const entryText = entryMatch[1];
      const dateRangeMatch = entryText.match(DATE_RANGE_RE);
      let name = entryText;
      let startDate = '';
      let endDate = '';

      if (dateRangeMatch) {
        startDate = dateRangeMatch.groups?.start || '';
        endDate = dateRangeMatch.groups?.end || '';
        name = entryText.replace(DATE_RANGE_RE, '').trim();
      }

      let role = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (ROLE_RE.test(nextLine)) {
          role = nextLine.match(ROLE_RE)![1].trim();
          i++;
        } else if (!ENTRY_START_RE.test(nextLine) && !TECH_RE.test(nextLine) && nextLine.length < 60) {
          role = nextLine;
          i++;
        }
      }

      current = { name, role, description: [], technologies: [], link: '', startDate, endDate };
    } else if (current) {
      const techMatch = line.match(TECH_RE);
      if (techMatch) {
        current.technologies = techMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
      } else {
        const urlMatch = line.match(URL_RE);
        if (urlMatch && !current.link) {
          current.link = urlMatch[0].replace(/[.,;:)]+$/, '');
        }
        current.description.push(line);
      }
    }
  }

  flushCurrent();
  return entries;
}

// ── Parse certifications / awards ─────────────────────────────────
function parseCertifications(lines: string[]) {
  const entries: CVFormValues['certifications'] = [];
  const YEAR_RE = /(\d{4})\s*$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const yearMatch = trimmed.match(YEAR_RE);
    const year = yearMatch ? yearMatch[1] : '';
    const name = yearMatch ? trimmed.replace(YEAR_RE, '').trim() : trimmed;

    entries.push({ id: uuidv4(), name, year });
  }

  return entries;
}

// ── Main public API ───────────────────────────────────────────────
export const parseCVFromPDF = async (file: File): Promise<CVFormValues | null> => {
  try {
    const fullText = await extractTextFromPDF(file);
    const contact = extractContactInfo(fullText);
    const { headerLines, sections } = splitSections(fullText);

    const summarySection = sections.find((s) => s.key === 'summary');
    const summaryLines = summarySection?.lines || [];

    const profile = parseProfile(headerLines, contact, summaryLines);

    let experience: CVFormValues['experience'] = [];
    let education: CVFormValues['education'] = [];
    let skills: CVFormValues['skills'] = [];
    let projects: CVFormValues['projects'] = [];
    let certifications: CVFormValues['certifications'] = [];

    for (const section of sections) {
      switch (section.key) {
        case 'experience':
          experience = parseExperience(section.lines);
          break;
        case 'education':
          education = parseEducation(section.lines);
          break;
        case 'skills':
          skills = parseSkills(section.lines);
          break;
        case 'projects':
          projects = parseProjects(section.lines);
          break;
        case 'certifications':
          certifications = parseCertifications(section.lines);
          break;
      }
    }

    return {
      profile,
      experience,
      education,
      skills,
      projects,
      certifications,
      settings: {
        primaryColor: '#2563eb',
        fontFamily: 'font-sans',
        margin: 'p-10',
        language: 'vi',
        moduleOrder: ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'],
      },
    };
  } catch (error) {
    console.error('Lỗi khi đọc file PDF:', error);
    return null;
  }
};
