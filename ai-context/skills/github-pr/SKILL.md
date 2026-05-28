---
name: github-pr
description: Use when creating a GitHub Pull Request for this project. Handles fetching context from the YouTrack issue linked to the branch, verifying the branch is pushed, building the PR description from the project template, and submitting with gh pr create.
---

# GitHub Pull Request Creation

Use this skill whenever a developer asks to open, create, or submit a PR (pull request) for this project.

## Step 1 — Extract the YouTrack issue key from the branch name

```bash
git rev-parse --abbrev-ref HEAD
```

Branch names follow the pattern `ASP-XXXX-short-description`. Extract the issue key (e.g. `ASP-1234`).

If the branch does not match this pattern, ask the developer for the YouTrack issue key before continuing.

## Step 2 — Fetch the YouTrack issue title and description

YouTrack base URL: `https://systemone.youtrack.cloud/issue/`

**Preferred:** If a YouTrack MCP is available (check your tool list for any tool with "youtrack" in its name), use it to retrieve the issue by key (`ASP-XXXX`). It will return the summary, description, and any acceptance criteria directly.

**Fallback — REST API:**

```bash
curl -s "https://systemone.youtrack.cloud/api/issues/ASP-XXXX?fields=summary,description" \
  -H "Authorization: Bearer $YOUTRACK_TOKEN"
```

**Fallback — browser:** If neither MCP nor token is available, ask the developer to paste the issue title from:

```
https://systemone.youtrack.cloud/issue/ASP-XXXX
```

Build the PR title as `ASP-XXXX <summary>`, e.g. `ASP-7985 Improve Device List performance`. Always prefix with the issue key.

## Step 3 — Verify the branch is pushed to origin

```bash
git status -sb
```

Check whether the local branch has a tracking remote branch (`origin/ASP-XXXX-...`). If not, push it:

```bash
git push -u origin HEAD
```

If you are unsure or the push requires confirmation (e.g. protected branch), ask the developer before pushing.

## Step 4 — Build the PR description

Use the following template exactly. Fill in each section using context from the YouTrack issue, the git diff, and any additional information from the developer. Leave section headers intact. Where there is nothing to add, write a short placeholder rather than deleting the section.

```markdown
## What does this PR do?
<!-- Stakeholder-friendly summary: what problem does this solve and why does it matter? -->

## List of the changes done
<!-- Bullet list of technical changes made in this PR -->
-

## Background context
<!-- Tech debt addressed, architectural decisions, future improvements, or leave blank -->

## How can this be manually tested?
<!-- Step-by-step QA instructions -->
1.

## Relevant stories
[ASP-XXXX](https://systemone.youtrack.cloud/issue/ASP-XXXX) Issue title here

## Screenshots
<!-- Leave blank if no UI changes; add before/after screenshots for visual changes -->
```

## Step 5 — Submit with gh pr create

```bash
gh pr create \
  --title "ASP-XXXX Issue title from YouTrack" \
  --body "$(cat <<'EOF'
<filled-in template>
EOF
)"
```

After the PR is created, output the PR URL for the developer.

## Notes

- Do not add `Co-Authored-By` trailers to the PR description.
- Target branch defaults to `main` unless the developer specifies otherwise.
- If the YouTrack issue has acceptance criteria or QA steps in its description, include them in the "How can this be manually tested?" section.
- The PR title format is always `ASP-XXXX <YouTrack summary>`. Never omit the issue key prefix.
- Keep the PR title concise (under 72 characters total) — trim the YouTrack summary only if it is significantly longer.
