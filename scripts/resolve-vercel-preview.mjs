const { GITHUB_REPOSITORY, GITHUB_DEPLOYMENT_SHA, GITHUB_TOKEN, GITHUB_OUTPUT, GITHUB_EVENT_NAME } = process.env;
if (!GITHUB_REPOSITORY || !GITHUB_DEPLOYMENT_SHA || !GITHUB_TOKEN || !GITHUB_OUTPUT) {
  throw new Error("GitHub repository, SHA, token, and output path are required");
}

const previewRequired = GITHUB_EVENT_NAME === "pull_request";
const deadline = Date.now() + 10 * 60_000;

while (Date.now() < deadline) {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/deployments?sha=${GITHUB_DEPLOYMENT_SHA}&per_page=30`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`GitHub deployments request failed with ${response.status}`);
  const deployments = await response.json();
  for (const deployment of deployments) {
    if (previewRequired && deployment.environment !== "Preview") continue;
    const statuses = await githubJson(deployment.statuses_url);
    const success = statuses.find((status) => status.state === "success" && status.environment_url);
    if (!success) continue;
    const url = new URL(success.environment_url);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app")) {
      throw new Error("Matching deployment URL is not a trusted Vercel HTTPS URL");
    }
    console.log(`::add-mask::${url.origin}`);
    await appendFile(GITHUB_OUTPUT, `base_url=${url.origin}\n`);
    process.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, 10_000));
}

throw new Error("Timed out waiting for a matching successful Vercel deployment");

async function githubJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`GitHub deployment status request failed with ${response.status}`);
  return await response.json();
}

async function appendFile(file, value) {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(file, value);
}
