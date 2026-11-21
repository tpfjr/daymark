# Updating Daymark with Codex and Claude Opus

1. **Describe the change to Codex.** Give one example of how you use the app and what should happen. For a bug, include the app version and the steps that trigger it.
2. **Have Codex prepare a draft pull request.** Ask it to start from the current main branch, implement the change, run the Windows tests with a temporary profile, and push source plus tests. The PR describes the visible changes and test results. Its Files changed tab is the diff.
3. **Give Opus the PR and commit ID.** Ask: “Review this commit for data loss, wrong dates or times, and regressions. For each finding give severity, file and line, reproduction steps, and a suggested test. Distinguish reproduced bugs from static observations.” If Opus cannot open GitHub, attach the source-only diff. Generated workers, build hashes and dependency lockfiles can be reviewed separately when relevant.
4. **Bring the findings back to Codex.** Ask it to verify each one, add a regression test for each confirmed bug, and push fixes to the same PR. For a second review, send Opus only the diff between the reviewed commit and the new commit.
5. **Approve the reviewed version.** Have Codex run the complete suite, build and smoke-test the installer from the final commit, and record its SHA-256. Merge the PR after review. Keep unsigned personal installers in a draft GitHub Release accessible to the repository owner. Publishing to everyone is a separate decision.
6. **Install on your PC.** Sign in to GitHub, open the draft release for the version you approved, and download its Windows setup EXE from Assets. Back up your planner under Data, quit Daymark from its File or tray menu, and run the installer. Check the version in Help → About. Git fetch and checkout are for working on the source. Running the installer updates the desktop app.

For the next change, use the merged main branch as the starting point. Keep one PR per related set of changes so the review stays small.
