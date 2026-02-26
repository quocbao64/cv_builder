import { CVFormValues } from '../schema/cvSchema';
import { Mail, Phone, Linkedin, Github, Globe } from 'lucide-react';
import React from 'react';

interface CVPreviewProps {
  data: CVFormValues;
}

// Helper to render HTML from wysiwyg, or convert old plain text (from db) to HTML
function renderHTMLContent(text: string) {
  if (!text) return '';
  // If it already contains HTML tags like <p>, <ul>, <br>, just return it
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text;
  }
  // Otherwise, it's legacy plain text. Convert \n to <br/> and wrap bullets if any.
  // We'll just convert \n to <br/> and let the old text render. If they used bullets (- or •), we just leave them.
  let html = text.replace(/\n/g, '<br/>');
  return html;
}

export default function CVPreview({ data }: CVPreviewProps) {
  const { profile, experience, education, skills, projects, certifications, settings } = data;
  const moduleOrder = settings?.moduleOrder || ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'];
  const primaryColor = settings?.primaryColor || '#111';
  const language = settings?.language || 'vi';

  const translations = {
    vi: {
      summary: 'Mục tiêu & Giới thiệu',
      experience: 'Kinh nghiệm làm việc',
      education: 'Học vấn',
      projects: 'Dự án tham gia',
      skills: 'Kỹ năng chuyên môn',
      certifications: 'Chứng chỉ & Giải thưởng',
      present: 'Hiện tại',
      techStack: 'Công nghệ sử dụng:',
      link: '[Liên kết]'
    },
    en: {
      summary: 'Objective',
      experience: 'Work Experience',
      education: 'Education',
      projects: 'Projects',
      skills: 'Skills',
      certifications: 'Certifications & Awards',
      present: 'Present',
      techStack: 'Tech Stack:',
      link: '[Link]'
    }
  };
  
  const t = translations[language as keyof typeof translations] || translations.vi;

  const fontFamilyMap: Record<string, string> = {
    'font-sans': "'Inter', 'Segoe UI', Arial, sans-serif",
    'font-serif': "'Times New Roman', 'Noto Serif', Georgia, serif",
    'font-mono': "'Fira Code', 'Consolas', monospace",
  };
  const fontFamily = fontFamilyMap[settings?.fontFamily || 'font-serif'] || fontFamilyMap['font-serif'];

  const paddingMap: Record<string, string> = {
    'p-6': '24px 28px 40px 28px',
    'p-10': '40px 48px 60px 48px',
    'p-14': '56px 64px 80px 64px',
  };
  const padding = paddingMap[settings?.margin || 'p-10'] || paddingMap['p-10'];

  /* ── Section heading ──────────────────────────────────── */
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2
      style={{
        fontSize: '14px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: `2px solid ${primaryColor}`,
        paddingBottom: '3px',
        marginBottom: '10px',
        marginTop: '16px',
        color: primaryColor,
      }}
    >
      {children}
    </h2>
  );

  /* ── Render helpers ───────────────────────────────────── */
  const renderSummary = () => {
    if (!profile?.summary) return null;
    return (
      <section key="summary">
        <SectionTitle>{t.summary}</SectionTitle>
        <div 
          className="cv-html-content"
          style={{ textAlign: 'justify', lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: renderHTMLContent(profile.summary) }}
        />
      </section>
    );
  };

  const renderSkills = () => {
    if (!skills || skills.length === 0) return null;
    return (
      <section key="skills">
        <SectionTitle>{t.skills}</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {skills.map((skill) => (
              <tr key={skill.id} style={{ verticalAlign: 'top' }}>
                <td
                  style={{
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    paddingRight: '24px',
                    paddingBottom: '4px',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    width: '180px',
                  }}
                >
                  {skill.category}
                </td>
                <td 
                  className="cv-html-content"
                  style={{ paddingBottom: '4px', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: renderHTMLContent(skill.description || '') }}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  };

  const renderExperience = () => {
    if (!experience || experience.length === 0) return null;
    return (
      <section key="experience">
        <SectionTitle>{t.experience}</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {experience.map((exp) => (
            <div key={exp.id} className="cv-entry-block">
              {/* Company + Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '13px' }}>
                  ◆ {exp.company}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {exp.startDate}{exp.startDate && ' - '}{exp.isCurrent ? t.present : exp.endDate || (exp.startDate ? t.present : '')}
                </span>
              </div>
              {/* Role */}
              {exp.role && (
                <div style={{ fontStyle: 'italic', fontSize: '12.5px', marginBottom: '4px' }}>
                  {exp.role}
                </div>
              )}
              {/* Description as HTML or converted plain text */}
              {exp.description && (
                <div 
                  className="cv-html-content"
                  style={{ lineHeight: 1.6, textAlign: 'justify' }}
                  dangerouslySetInnerHTML={{ __html: renderHTMLContent(exp.description) }}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderEducation = () => {
    if (!education || education.length === 0) return null;
    return (
      <section key="education">
        <SectionTitle>{t.education}</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {education.map((edu) => (
            <div key={edu.id} className="cv-entry-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '13px' }}>
                  ◆ {edu.institution}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {edu.startDate}{edu.startDate && edu.endDate ? ' - ' : ''}{edu.endDate || ''}
                </span>
              </div>
              {edu.degree && (
                <div style={{ fontStyle: 'italic', fontSize: '12.5px', marginBottom: '2px' }}>
                  {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ''}
                </div>
              )}
              {edu.description && (
                <div 
                  className="cv-html-content"
                  style={{ lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: renderHTMLContent(edu.description) }}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderProjects = () => {
    if (!projects || projects.length === 0) return null;
    return (
      <section key="projects">
        <SectionTitle>{t.projects}</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {projects.map((proj) => (
            <div key={proj.id} className="cv-entry-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '13px' }}>
                  ◆ {proj.name}
                  {proj.link && (
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontWeight: 400, fontSize: '11px', marginLeft: '8px', color: '#2563eb' }}
                    >
                      {t.link}
                    </a>
                  )}
                </span>
                {(proj.startDate || proj.endDate) && (
                  <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {proj.startDate}{proj.startDate && proj.endDate ? ' - ' : ''}{proj.endDate || ''}
                  </span>
                )}
              </div>
              {proj.role && (
                <div style={{ fontStyle: 'italic', fontSize: '12.5px', marginBottom: '4px' }}>
                  {proj.role}
                </div>
              )}
              {proj.description && (
                <div 
                  className="cv-html-content"
                  style={{ lineHeight: 1.6, textAlign: 'justify' }}
                  dangerouslySetInnerHTML={{ __html: renderHTMLContent(proj.description) }}
                />
              )}
              {proj.technologies && proj.technologies.length > 0 && (
                <div style={{ marginTop: '2px' }}>
                  <span style={{ fontWeight: 700 }}>{t.techStack} </span>
                  <span>{proj.technologies.join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderCertifications = () => {
    if (!certifications || certifications.length === 0) return null;
    return (
      <section key="certifications">
        <SectionTitle>{t.certifications}</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {certifications.map((cert) => (
            <div key={cert.id} className="cv-entry-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span>{cert.name}</span>
              {cert.year && <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{cert.year}</span>}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const sectionMap: Record<string, () => React.ReactNode> = {
    summary: renderSummary,
    experience: renderExperience,
    education: renderEducation,
    projects: renderProjects,
    skills: renderSkills,
    certifications: renderCertifications,
  };

  // A4 page height in px (at 96dpi: 297mm ≈ 1123px)
  const A4_HEIGHT = '297mm';

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          .cv-preview-page-container {
            background-image: none !important;
            transform: none !important;
          }
          .cv-preview-page-container header {
            break-inside: avoid;
          }
          .cv-entry-block {
            break-inside: avoid;
          }
          .cv-preview-page-container h2 {
            break-after: avoid;
          }
        }
      `}</style>
      <div
        className="cv-preview-page-container"
        style={{
          width: '100%',
          minHeight: A4_HEIGHT,
          backgroundColor: '#fff',
          color: '#111',
          fontFamily,
          fontSize: '12.5px',
          lineHeight: 1.5,
          padding,
          boxSizing: 'border-box',
          /* Visual page break lines */
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            transparent,
            transparent calc(${A4_HEIGHT} - 1px),
            #ef4444 calc(${A4_HEIGHT} - 1px),
            #ef4444 ${A4_HEIGHT}
          )`,
          backgroundSize: `100% ${A4_HEIGHT}`,
        }}
    >
      {/* ── Header ─────────────────────────────────── */}
      <header style={{ textAlign: 'center', marginBottom: '8px' }}>
        {/* Name - Position */}
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            margin: 0,
            letterSpacing: '0.5px',
          }}
        >
          {profile.fullName || 'Your Name'}
          {profile.position && (
            <span> - {profile.position}</span>
          )}
        </h1>

        {/* Location */}
        {profile.location && (
          <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '2px', color: '#333' }}>
            {profile.location}
          </div>
        )}

        {/* Contact row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginTop: '6px',
            fontSize: '12px',
          }}
        >
          {profile.phone && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={12} /> {profile.phone}
            </span>
          )}
          {profile.email && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={12} /> {profile.email}
            </span>
          )}
          {profile.linkedin && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Linkedin size={12} />
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#111' }}>
                {profile.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </span>
          )}
          {profile.github && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Github size={12} />
              <a href={profile.github} target="_blank" rel="noopener noreferrer" style={{ color: '#111' }}>
                {profile.github.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </span>
          )}
          {profile.website && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={12} />
              <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: '#111' }}>
                {profile.website.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </span>
          )}
        </div>
      </header>

      {/* ── Dynamic sections ───────────────────────── */}
      {moduleOrder.map((mod) => sectionMap[mod] && sectionMap[mod]())}
    </div>
    </>
  );
}
