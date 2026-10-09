import { handleGetIndiaJobsRequest } from "../../backend/server/jobs-api.js";

export default async function searchIndiaJobs(request, response) {
  await handleGetIndiaJobsRequest(request, response);
}
