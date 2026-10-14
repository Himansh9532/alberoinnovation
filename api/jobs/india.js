import { handleGetIndiaJobsRequest } from "../../backend/src/modules/jobs/jobs-api.js";

export default async function searchIndiaJobs(request, response) {
  await handleGetIndiaJobsRequest(request, response);
}
