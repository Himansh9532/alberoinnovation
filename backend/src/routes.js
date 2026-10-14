import { handleCreateRazorpayOrder, handleGetPlanUsage, handleVerifyRazorpayPayment } from "./modules/billing/billing-api.js";
import { handleGetIndiaJobsRequest } from "./modules/jobs/jobs-api.js";
import { handleGenerateAssessmentRequest, handleGenerateInterviewRequest } from "./modules/interview/interview-api.js";
import { handleResearchAssistantRequest } from "./modules/research/research-assistant-api.js";
import { handleResumeAssistantRequest } from "./modules/resume/resume-assistant-api.js";

export const apiRoutes = new Map([
  ["/api/generate-interview", handleGenerateInterviewRequest],
  ["/api/skill-assessment", handleGenerateAssessmentRequest],
  ["/api/research-assistant", handleResearchAssistantRequest],
  ["/api/resume-assistant", handleResumeAssistantRequest],
  ["/api/billing/usage", handleGetPlanUsage],
  ["/api/billing/order", handleCreateRazorpayOrder],
  ["/api/billing/verify-payment", handleVerifyRazorpayPayment],
  ["/api/jobs/india", handleGetIndiaJobsRequest],
]);
