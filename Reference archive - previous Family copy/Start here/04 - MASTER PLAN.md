# 04 - SHOPWITHEZZ MASTER PLAN

## Purpose

This Master Plan is the detailed working and release checklist for ShopWithEzz.

The Roadmap explains the phases. This document explains exactly how each remaining step is completed, tested, approved, backed up, and recorded.

The live project status is maintained in `00 - SHOPWITHEZZ PROJECT TRACKER.html`.

---

## Mandatory Working Method

Every task follows this order:

1. Read the relevant project documents.
2. Work on one clearly defined step only.
3. Back up every existing file before changing it.
4. Make the smallest safe change required.
5. Check the changed files for errors.
6. Test the change on the real Android phone where applicable.
7. Ask for approval.
8. Record the approved task as Done.
9. Update the relevant project documentation.
10. Move to the next step only after approval.

Do not combine unrelated changes. Do not overwrite a stable approved version. Do not create the final build early.

---

## Approved App Baseline

The current approved ShopWithEzz app includes:

- Home screen with profile greeting and budget summary.
- Shopping List with add, edit, collect, uncollect, quantity, and delete controls.
- Budget, Spent, and Left tracking.
- Scanner and list-import tools.
- Sharing and printing.
- Hands-Free controls directly inside the Shopping List.
- Spoken remaining, collected, and complete lists.
- Voice deletion with confirmation.
- Settings with Profile, Extras, Feedback, Backup, Restore, and About.
- User-selected backup location and file-based restore.
- Offline local storage.
- Approved loading and home-screen artwork.
- Keyboard Done saving an edited item and returning to the Shopping List.

This baseline must be protected. Any later change requires a file backup, focused testing, and approval.

---

## Completed Quality Evidence

The following checks have passed on the real Android phone:

- Quick and Fast Test.
- Smart and Really Smart Test.
- App restart and saved-data test.
- Backup creation test.
- Restore test using changed data.
- Offline list editing and persistence test.
- Final Granny Test.

These tests should be repeated on the final clean-installed build before release.

---

## Step 1 - Finish the Project Documents

### 1.1 Bible

Status: Done and approved.

Acceptance criteria:

- Defines the app purpose, users, principles, approved features, trust rules, release rules, and long-term vision.
- Includes the standard dated footer.

### 1.2 Roadmap

Status: Done and approved.

Acceptance criteria:

- Records the development phases in the correct order.
- Separates completed work from pending release work.
- Includes the standard dated footer.

### 1.3 Master Plan

Status: In Progress.

Acceptance criteria:

- Gives an actionable completion and release checklist.
- Defines testing and approval gates.
- Protects the local-build requirement.
- Includes the standard dated footer.

### 1.4 Ideas

Status: Pending.

Actions:

1. Record future ideas without adding them to the current release.
2. Separate useful ideas from required fixes.
3. State that future work must pass the Bible and Granny Test.

Acceptance criteria: The release cannot be delayed by optional ideas unless an idea fixes safety, privacy, reliability, or compliance.

### 1.5 Changelog

Status: Pending.

Actions:

1. Record the current app version.
2. Record the completed core features.
3. Record Hands-Free, Settings, backup, restore, layout, and edit-flow improvements.
4. Use plain language that users can understand.

Acceptance criteria: The changelog accurately matches the finished app.

### 1.6 Backup Log

Status: Pending.

Actions:

1. Record existing development backups where practical.
2. Record the documentation-complete restore point.
3. Record the pre-release source backup.
4. Record the final matching source and build backup.

Acceptance criteria: A future developer can identify which backup belongs to the approved release.

### 1.7 Standard Document Footers

Status: Pending.

Actions:

1. Review every official Markdown document.
2. Add Version, Created, and Last Updated dates.
3. Add Designed & Created by Team Lalli61.
4. Add GSD - Get Stuff Done.
5. Correct broken character encoding where found.

Acceptance criteria: Every official document has a consistent readable footer and accurate date.

---

## Step 2 - Implement the 31-Day Beta Trial

Status: Pending.

### Required behaviour

- The trial begins only when the user first starts the eligible app experience.
- The original start time is saved reliably.
- The trial lasts 31 calendar days.
- The app clearly shows that it is a Beta Trial.
- The user can understand how much trial time remains.
- Changing normal app settings must not reset the trial.
- Closing, reopening, or updating the app must not reset the trial.
- Reinstall and device-change behaviour must follow the final purchase platform design.

### Test checklist

1. First launch starts the trial correctly.
2. Restart preserves the start date.
3. Simulated dates show correct remaining days.
4. The final trial day remains usable as intended.
5. The expiry boundary is correct.
6. Offline use does not bypass or corrupt the trial state.

Acceptance criteria: Every trial calculation and message is correct and understandable.

---

## Step 3 - Implement Trial Lock and One-Time Unlock

Status: Pending.

### Required behaviour

- When the trial expires, the app displays a calm, professional explanation.
- Existing user information is not silently deleted.
- The unlock price is shown clearly as a single one-time payment of AUD $29.99, subject to final Google Play configuration and approval.
- No subscription is offered.
- A successful purchase permanently unlocks the eligible app version.
- The app remembers the unlocked state.
- Restore Purchase is available where supported.
- Cancelled, failed, pending, and successful purchase results are handled clearly.

### Test checklist

1. Active trial remains unlocked.
2. Expired trial shows the correct lock screen.
3. Cancelled purchase leaves the app safely locked.
4. Failed purchase gives a useful message.
5. Successful purchase unlocks permanently.
6. Restart preserves the unlock.
7. Restore Purchase restores access for the correct account.
8. Existing shopping data remains protected through the process.

Acceptance criteria: Trial lock, purchase, permanent unlock, and restoration all pass real-device testing.

---

## Step 4 - Final Version and Branding Review

Status: Pending.

Actions:

1. Choose the approved public version number.
2. Choose the Android build number.
3. Confirm Beta Release or Official Release wording.
4. Confirm the release date.
5. Update About/App Version.
6. Update the public download page information.
7. Update the Changelog and Backup Log.
8. Confirm Team Lalli61 and GSD wording is consistent.

Acceptance criteria: The app, build, public page, and documents all show matching release information.

---

## Step 5 - Final Source Review

Status: Pending.

Actions:

1. Confirm the app opens in the live development environment.
2. Run the project lint checks.
3. Run the project type checks and resolve release-blocking errors.
4. Review the project for accidental temporary dependencies or abandoned experiments.
5. Confirm required native modules are included.
6. Confirm Android permissions are limited to what the app needs.
7. Confirm no secrets, personal files, or temporary backups are packaged.
8. Confirm the approved artwork and app identifiers.

Acceptance criteria: No known release-blocking source, configuration, dependency, or privacy problem remains.

---

## Step 6 - Final Approved Source Backup

Status: Pending.

Actions:

1. Stop making feature changes.
2. Create a dated full source backup outside the working project folder.
3. Include the complete source and required assets.
4. Exclude disposable generated folders only when they can be recreated safely.
5. Record the backup location, date, version, and purpose in the Backup Log.
6. Verify the backup can be opened and its important files are present.

Acceptance criteria: The approved pre-build source can be recovered without relying on the working folder.

---

## Step 7 - Final Local Android Build

Status: Pending.

The final Android app must be built locally. Do not use a cloud build unless a separate future decision explicitly approves it.

Build gate - all must be true before starting:

- Documentation is complete.
- Trial and purchase system is complete.
- Release version information is final.
- Source checks pass.
- Final source backup exists and is logged.
- The user gives clear approval to build.

Build actions:

1. Use the approved local Android build process.
2. Keep the build logs for troubleshooting.
3. Record the exact source version used.
4. Preserve the resulting Android installation file.
5. Record its filename, date, version, and purpose.

Acceptance criteria: The local build completes successfully and matches the approved source.

---

## Step 8 - Clean Installation and Final Device Test

Status: Pending.

Use the final local build, not the live development version.

Test order:

1. Preserve any required user backup.
2. Remove the previous test installation only when it is safe to do so.
3. Install the final local build.
4. Confirm the loading screen and home screen.
5. Add, edit, collect, uncollect, and delete items.
6. Set and change a budget.
7. Test scanner and importing where supported.
8. Test all important voice commands.
9. Test Settings and Feedback.
10. Create a backup.
11. Change app data and restore the backup.
12. Test offline use.
13. Test trial, expiry, purchase, and restoration states.
14. Restart the phone and confirm saved state.
15. Repeat the Granny Test.

Acceptance criteria: No release-blocking problem appears in the clean-installed final build.

---

## Step 9 - Preserve the Approved Release

Status: Pending.

Actions:

1. Create a final release folder outside the working project.
2. Store the approved Android installation file.
3. Store or reference the matching source backup.
4. Store final version and release notes.
5. Record file checksums where practical.
6. Update the Backup Log and Changelog.
7. Mark the build as the stable approved release.

Acceptance criteria: The exact released build and matching source can be identified and recovered later.

---

## Step 10 - Public Download Page

Status: Pending.

Actions:

1. Replace template placeholders with ShopWithEzz details.
2. Confirm features, privacy, trial, price, release date, and version.
3. Add the approved Android build download.
4. Detect the visitor's device.
5. Show Download to Android visitors.
6. Show iOS Version Coming Soon to iPhone and iPad visitors.
7. Test the page on Android, iPhone/iPad-sized devices, and desktop.
8. Confirm the shared public link always opens the information page first.

Acceptance criteria: One public link provides the correct clear experience for every visitor.

---

## Release Stop Conditions

Stop and do not release if any of these occur:

- A required tracker item is not Done.
- A serious test fails.
- Backup or restore is unreliable.
- Trial or purchase behaviour is unclear or incorrect.
- The final build does not match the approved source.
- Version information disagrees between the app and documents.
- The user has not approved the final build.

Resolve the problem, retest it, record the result, and only then continue.

---

## Final Approval Statement

ShopWithEzz becomes Feature Complete when its approved app functions, Settings, documentation, trial, purchase, and release checks are complete.

ShopWithEzz becomes Release Ready only after the final local Android build passes clean-install testing and the matching source and build are safely preserved.

---

# Document Information

**Version:** 1.1  
**Created:** 09 August 2026  
**Last Updated:** 09 August 2026

---

Designed & Created by Team Lalli61

GSD - Get Stuff Done
