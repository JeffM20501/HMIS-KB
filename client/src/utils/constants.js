// src/utils/constants.js

export const ROLES = {
  VIEWER: "viewer",
  EDITOR: "editor",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  [ROLES.VIEWER]: "Viewer",
  [ROLES.EDITOR]: "Editor",
  [ROLES.ADMIN]: "Admin",
};

export const ARTICLE_STATUS = {
  DRAFT: "draft",
  REVIEW: "pending_review",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const STATUS_CONFIG = {
  [ARTICLE_STATUS.PUBLISHED]: { label: "Published", bg: "#E6F7F1", color: "#00A368" },
  [ARTICLE_STATUS.DRAFT]: { label: "Draft", bg: "#F4F4F6", color: "#696E7A" },
  [ARTICLE_STATUS.REVIEW]: { label: "In Review", bg: "#FEF9E7", color: "#C9A000" },
  [ARTICLE_STATUS.ARCHIVED]: { label: "Archived", bg: "#F4F4F6", color: "#9EA6B3" },
};

// The six standardized content templates required by the PRD (Section 8.2)
export const ARTICLE_TYPES = {
  HOW_TO: 'how_to',
  SOP: 'sop',
  FAQ: 'faq',
  TROUBLESHOOTING: 'troubleshooting',
  FEATURE_REF: 'feature_ref',
  RELEASE_NOTES: 'release_notes',
};

export const ARTICLE_TYPE_LABELS = {
  [ARTICLE_TYPES.HOW_TO]: 'How-To Guide',
  [ARTICLE_TYPES.SOP]: 'SOP',
  [ARTICLE_TYPES.FAQ]: 'FAQ',
  [ARTICLE_TYPES.TROUBLESHOOTING]: 'Troubleshooting',
  [ARTICLE_TYPES.FEATURE_REF]: 'Feature Reference',
  [ARTICLE_TYPES.RELEASE_NOTES]: 'Release Notes',
};

export const ARTICLE_TYPE_CONFIG = {
  [ARTICLE_TYPES.HOW_TO]: {
    label: ARTICLE_TYPE_LABELS[ARTICLE_TYPES.HOW_TO],
    bg: "#E8F0FD",    
    color: "#0263E0", 
  },
  [ARTICLE_TYPES.SOP]: {
    label: ARTICLE_TYPE_LABELS[ARTICLE_TYPES.SOP],
    bg: "#E6F7F1",    
    color: "#00A368", 
  },
  [ARTICLE_TYPES.FAQ]: {
    label: ARTICLE_TYPE_LABELS[ARTICLE_TYPES.FAQ],
    bg: "#FEF3E7",    
    color: "#E87722", 
  },
  [ARTICLE_TYPES.TROUBLESHOOTING]: {
    label: ARTICLE_TYPE_LABELS[ARTICLE_TYPES.TROUBLESHOOTING],
    bg: "#FDEEF0",    
    color: "#F22F46",
  },
  [ARTICLE_TYPES.FEATURE_REF]: {
    label: ARTICLE_TYPE_LABELS[ARTICLE_TYPES.FEATURE_REF],
    bg: "#F0E6F7",    
    color: "#7B2FBE", 
  },
  [ARTICLE_TYPES.RELEASE_NOTES]: {
    label: ARTICLE_TYPE_LABELS[ARTICLE_TYPES.RELEASE_NOTES],
    bg: "#E6F8F6",    
    color: "#0D9488",
  },
};

export const TEMPLATE_SECTIONS = {
  [ARTICLE_TYPES.HOW_TO]: ['Step-by-step', 'Procedures', 'Best practices'],
  [ARTICLE_TYPES.SOP]: ['Standard Operating Procedure', 'Checklist', 'Compliance'],
  [ARTICLE_TYPES.FAQ]: ['Questions', 'Answers', 'Troubleshooting'],
  [ARTICLE_TYPES.TROUBLESHOOTING]: ['Problem', 'Diagnosis', 'Resolution'],
  [ARTICLE_TYPES.FEATURE_REF]: ['Overview', 'Usage', 'Examples'],
  [ARTICLE_TYPES.RELEASE_NOTES]: ['New features', 'Bug fixes', 'Upgrade notes'],
};

export const DEPARTMENTS = [
  "Nursing",
  "Laboratory",
  "Pharmacy",
  "Radiology",
  "Outpatient",
  "Inpatient",
  "Billing & Finance",
  "IT Systems",
  "Compliance",
  "Support",
  "Other",
];

export const ACCEPTED_MEDIA_TYPES = {
  image: ["image/png", "image/jpeg", "image/gif", "image/webp"],
  pdf: ["application/pdf"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

export const MAX_MEDIA_SIZE_MB = 50;