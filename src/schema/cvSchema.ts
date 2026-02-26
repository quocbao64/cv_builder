import * as z from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(1, "Họ và tên là bắt buộc"),
  position: z.string().optional(),
  email: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
  phone: z.string().min(1, "Số điện thoại là bắt buộc"),
  location: z.string().optional(),
  linkedin: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  github: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  website: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  summary: z.string().optional(),
});

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Tên công ty là bắt buộc"),
  role: z.string().min(1, "Vị trí là bắt buộc"),
  location: z.string().optional(),
  startDate: z.string().min(1, "Ngày bắt đầu là bắt buộc"),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
});

export const educationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "Tên trường/tổ chức là bắt buộc"),
  degree: z.string().min(1, "Bằng cấp là bắt buộc"),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const skillCategorySchema = z.object({
  id: z.string(),
  category: z.string().min(1, "Tên danh mục là bắt buộc"),
  description: z.string().optional(),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tên dự án là bắt buộc"),
  description: z.string().min(1, "Mô tả là bắt buộc"),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  link: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
});

export const certificationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tên chứng chỉ/giải thưởng là bắt buộc"),
  year: z.string().optional(),
});

export const settingsSchema = z.object({
  primaryColor: z.string().default("#2563eb"), // default blue-600
  fontFamily: z.string().default("font-sans"),
  margin: z.string().default("p-10"),
  language: z.enum(["vi", "en"]).default("vi"),
  moduleOrder: z.array(z.string()).default([
    "summary",
    "experience",
    "education",
    "projects",
    "skills",
    "certifications",
  ]),
});

export const cvSchema = z.object({
  profile: profileSchema,
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(skillCategorySchema).default([]),
  projects: z.array(projectSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  settings: settingsSchema.default({
    primaryColor: "#2563eb",
    fontFamily: "font-sans",
    margin: "p-10",
    language: "vi",
    moduleOrder: [
      "summary",
      "experience",
      "education",
      "projects",
      "skills",
      "certifications",
    ],
  }),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type ExperienceFormValues = z.infer<typeof experienceSchema>;
export type EducationFormValues = z.infer<typeof educationSchema>;
export type SkillCategoryFormValues = z.infer<typeof skillCategorySchema>;
export type ProjectFormValues = z.infer<typeof projectSchema>;
export type CertificationFormValues = z.infer<typeof certificationSchema>;
export type CVFormValues = z.infer<typeof cvSchema>;

export const defaultCVValues: CVFormValues = {
  profile: {
    fullName: "",
    position: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  settings: {
    primaryColor: "#2563eb",
    fontFamily: "font-sans",
    margin: "p-10",
    language: "vi",
    moduleOrder: [
      "summary",
      "experience",
      "education",
      "projects",
      "skills",
      "certifications",
    ],
  },
};
