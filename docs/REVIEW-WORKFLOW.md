# Updating Daymark with Codex and Claude Opus

1. **Describe the change to Codex.** Give one example of how you use the app and what should happen. For a bug, include the app version and the steps that trigger it.
2. **Have Codex prepare a draft pull request.** Ask it to start from the current main branch, implement the change, run the Windows tests with a temporary profile, and push source plus tests. The PR describes the visible changes and test results. Its Files changed tab is the diff.
3. **Give Opus the PR and commit ID.** Ask: “Review this commit for data loss, wrong dates or times, and regressions. For each finding give severity, file and line, reproduction steps, and a suggested test. Distinguish reproduced bugs from static observations.” If Opus cannot open GitHub, attach the source-only diff. Generated workers, build hashes and dependency lockfiles can be reviewed separately when relevant.
4. **Bring the findings back to Codex.** Ask it to verify each one, add a regression test for each confirmed bug, and push fixes to the same PR. For a second review, send Opus only the diff between the reviewed commit and the new commit.
5. **Approve the reviewed version.** Have Codex run the complete suite, build and smoke-test the installer from the final commit, and record its SHA-256. Merge the PR after review. Keep unsigned personal installers in a draft GitHub Release accessible to the repository owner. Publishing to everyone is a separate decision.
6. **Install on your PC.** Sign in to GitHub, open the draft release for the version you approved, and download its Windows setup EXE from Assets. Back up your planner under Data, quit Daymark from its File or tray menu, and run the installer. Check the version in Help → About. Git fetch and checkout are for working on the source. Running the installer updates the desktop app.

### Testing a candidate on Windows

1. Sign in to GitHub as the repository owner and open the draft release linked in the PR. Under **Assets**, download the setup EXE for that candidate. GitHub's source-code ZIP contains the project files.
2. In the working copy of Daymark, choose **Data → Backup** and save the backup somewhere you can find. Choose **File → Quit** so the tray process exits.
3. Run the downloaded installer and complete setup. Launch Daymark from Start. Review builds in the 1.12.0 series can show the same version in **Help → About**. Use the release's candidate filename and SHA-256 to distinguish them.
4. Try the change on a disposable calendar entry. Report the candidate number, what you did and what happened. Merge the PR once you accept the tested version.

### Getting the source on your PC

In PowerShell, open your Daymark repository and run these commands for the current review branch:

```powershell
git fetch origin
git switch feature/calendar-actions
git pull --ff-only origin feature/calendar-actions
```

Codex commits and pushes the changes it makes for you. If you edited files yourself, run `git status`, stage the specific files you intended to change, commit them with a short message, and run `git push` on the review branch. For example, an edit to README alone can be committed with `git add -- README.md` followed by `git commit -m "Clarify the installation steps"`. Keep your planner backups and installer outside the commit.

For the next change, use the merged main branch as the starting point. Keep one PR per related set of changes so the review stays small.
