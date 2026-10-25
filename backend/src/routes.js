import { handleCreateRazorpayOrder, handleGetPlanUsage, handleVerifyRazorpayPayment } from "./modules/billing/billing-api.js";
import { handleGetIndiaJobsRequest } from "./modules/jobs/jobs-api.js";
import { handleGenerateAssessmentRequest, handleGenerateInterviewRequest } from "./modules/interview/interview-api.js";
import { handleResearchAssistantRequest } from "./modules/research/research-assistant-api.js";
import { handleResumeAssistantRequest } from "./modules/resume/resume-assistant-api.js";
import { handleSaveUserProfile } from "./modules/users/users-api.js";
import { handleUserResume } from "./modules/users/resume-api.js";
import { handleAdminLogin, handleAdminStats } from "./modules/admin/admin-api.js";
import { handleContactRequest } from "./modules/contact/contact-api.js";

export const apiRoutes = new Map([
  ["/api/contact", handleContactRequest],
  ["/api/generate-interview", handleGenerateInterviewRequest],
  ["/api/skill-assessment", handleGenerateAssessmentRequest],
  ["/api/research-assistant", handleResearchAssistantRequest],
  ["/api/resume-assistant", handleResumeAssistantRequest],
  ["/api/users/profile", handleSaveUserProfile],
  ["/api/users/resume", handleUserResume],
  ["/api/admin/login", handleAdminLogin],
  ["/api/admin/stats", handleAdminStats],
  ["/api/billing/usage", handleGetPlanUsage],
  ["/api/billing/order", handleCreateRazorpayOrder],
  ["/api/billing/verify-payment", handleVerifyRazorpayPayment],
  ["/api/jobs/india", handleGetIndiaJobsRequest],
]);
