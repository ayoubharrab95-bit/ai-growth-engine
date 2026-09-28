/**
 * Safe bounty PR submission router.
 *
 * The key rule: the repository that receives the PR (base) and the repository
 * that owns the working branch (head) are independent. This supports both:
 *   1) same-repository branches
 *   2) fork -> upstream pull requests
 *
 * It is intentionally NOT an auto-merge module.
 */

export type SubmissionPlan = {
  baseOwner: string;
  baseRepo: string;
  baseBranch: string;
  headOwner: string;
  headRepo: string;
  headBranch: string;
  issueNumber: number;
  title: string;
  body: string;
};

export type SubmissionResult =
  | { status: "ready"; plan: SubmissionPlan }
  | { status: "existing"; prNumber: number; url: string }
  | { status: "created"; prNumber: number; url: string }
  | { status: "blocked"; reason: string };

function apiHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function github<T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { ...apiHeaders(token), ...(init.headers ?? {}) },
  });
  const text = await response.text();
  let data: unknown = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* keep raw status */ }
  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data
      ? String((data as { message: unknown }).message)
      : `GitHub HTTP ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

type PullRequest = {
  number: number;
  html_url: string;
  state: string;
  head: { ref: string; repo: { full_name: string } | null };
  base: { ref: string; repo: { full_name: string } };
};

type Issue = { number: number; state: string; pull_request?: unknown };

type Ref = { ref: string };

function validName(value: string): boolean {
  return /^[A-Za-z0-9_.-]+$/.test(value) && value.length <= 100;
}

function validBranch(value: string): boolean {
  return value.length > 0 && value.length <= 255 && !/[\\s~^:?*\\[\\]]/.test(value);
}

export async function planSubmission(
  token: string,
  plan: SubmissionPlan,
): Promise<SubmissionResult> {
  if (!token) return { status: "blocked", reason: "GITHUB_TOKEN is missing." };

  const owners = [plan.baseOwner, plan.headOwner];
  if (owners.some((v) => !validName(v))) {
    return { status: "blocked", reason: "Invalid GitHub owner." };
  }
  if (!validName(plan.baseRepo) || !validName(plan.headRepo)) {
    return { status: "blocked", reason: "Invalid GitHub repository name." };
  }
  if (!validBranch(plan.baseBranch) || !validBranch(plan.headBranch)) {
    return { status: "blocked", reason: "Invalid Git branch name." };
  }
  if (plan.baseBranch === "main" && plan.headBranch === "main") {
    return { status: "blocked", reason: "A bounty submission cannot use main as both head and base." };
  }
  if (!Number.isInteger(plan.issueNumber) || plan.issueNumber <= 0) {
    return { status: "blocked", reason: "A valid bounty issue number is required." };
  }

  const baseFull = `${plan.baseOwner}/${plan.baseRepo}`;
  const headFull = `${plan.headOwner}/${plan.headRepo}`;

  const [issue, branch] = await Promise.all([
    github<Issue>(token, `/repos/${baseFull}/issues/${plan.issueNumber}`),
    github<Ref>(token, `/repos/${headFull}/git/ref/heads/${encodeURIComponent(plan.headBranch)}`),
  ]);

  if (issue.pull_request) {
    return { status: "blocked", reason: `Issue #${plan.issueNumber} is already a pull request.` };
  }
  if (issue.state !== "open") {
    return { status: "blocked", reason: `Bounty issue #${plan.issueNumber} is not open.` };
  }
  if (!branch.ref.endsWith(plan.headBranch)) {
    return { status: "blocked", reason: "Head branch verification failed." };
  }

  const existing = await github<PullRequest[]>(
    token,
    `/repos/${baseFull}/pulls?state=open&base=${encodeURIComponent(plan.baseBranch)}&head=${encodeURIComponent(headFull + ":" + plan.headBranch)}&per_page=10`,
  );

  if (existing.length > 0) {
    return {
      status: "existing",
      prNumber: existing[0].number,
      url: existing[0].html_url,
    };
  }

  return { status: "ready", plan };
}

export async function submitBountyPR(
  token: string,
  plan: SubmissionPlan,
): Promise<SubmissionResult> {
  const preflight = await planSubmission(token, plan);
  if (preflight.status !== "ready") return preflight;

  const baseFull = `${plan.baseOwner}/${plan.baseRepo}`;
  const headFull = `${plan.headOwner}/${plan.headRepo}`;
  const head = headFull === baseFull
    ? plan.headBranch
    : `${headFull}:${plan.headBranch}`;

  const created = await github<PullRequest>(token, `/repos/${baseFull}/pulls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: plan.title,
      body: plan.body,
      head,
      base: plan.baseBranch,
      maintainer_can_modify: true,
      draft: false,
    }),
  });

  return { status: "created", prNumber: created.number, url: created.html_url };
}
