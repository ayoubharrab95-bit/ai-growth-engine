# Safe Bounty PR Protocol

## The root fix

A bounty PR is not always created inside the repository being targeted.

There are two repositories:

- **base** = the project that owns the bounty and receives the PR.
- **head** = the repository where MoneyHunter can actually push its branch.

For an upstream project, the normal safe path is:

`discover -> claim -> fork/choose writable head repo -> branch -> implement -> test -> push -> preflight -> create cross-repo PR -> verify -> review -> merge -> payout`

### Rules

1. Never assume MoneyHunter can push to the bounty's upstream repository.
2. Never use the upstream repository as `origin` when the token only has fork permissions.
3. Before creating a PR, verify:
   - bounty issue is open;
   - head branch exists;
   - head is not main/master;
   - the exact head repository is known;
   - no equivalent open PR already exists.
4. For a fork, create the PR against the upstream repository using a cross-repository head:
   `HEAD_OWNER:HEAD_BRANCH`.
5. A failed PR creation is a **recoverable submission state**, not a failed bounty.
6. Do not auto-approve or auto-merge from the untrusted PR execution workflow.
7. Never execute fork code from a privileged `pull_request_target` workflow.
8. After PR creation, persist the PR number/URL and move the bounty to `PR_OPEN`.
9. Only the review/merge stage may decide whether the work is accepted.
10. Payment is a separate stage triggered by confirmed merge.

## States

`DISCOVERED -> PREFLIGHT_OK -> CLAIMED -> IN_PROGRESS -> TESTED -> PR_READY -> PR_OPEN -> REVIEW -> MERGED -> PAYOUT_PENDING -> PAID`

Recoverable failures:

- `SUBMISSION_RETRY`: GitHub/network/API transient failure.
- `SUBMISSION_BLOCKED`: missing permission, authentication, or invalid repository state.
- `NEEDS_HUMAN`: login/2FA, legal consent, secret, wallet signing, or spending approval.

The implementation is in `src/bounty/pr-submit.ts`.
