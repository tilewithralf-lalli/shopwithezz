# 07 - SHOPWITHEZZ BACKUP LOG

## Purpose

This log records ShopWithEzz file backups, restore points, final source backups, and matching release-build backups.

The goal is to protect every approved working version and make recovery clear and safe.

---

## Backup Locations

### Working project

`C:\SWE2`

This is the active ShopWithEzz source folder. It is not itself a backup.

### File-change backups

`C:\SWE2-file-backups`

This folder contains dated copies made before existing project files were changed.

Important: These are **file-level recovery backups**. They protect changed files but do not replace the required final full-source backup.

### User-created app-data backups

The user chooses the destination from ShopWithEzz Settings.

These JSON backup files protect shopping data stored by the app. They do not contain the app source code or Android installation file.

### Final full-source backup

**Status:** Pending

The final location will be recorded here after documentation, release-system work, source checks, and approval are complete.

### Final Android build backup

**Status:** Pending

The final locally built Android installation file and matching source restore point will be recorded here after clean-install testing and approval.

---

## Backup Rules

1. Back up every existing file before changing it.
2. Store file backups outside `C:\SWE2`.
3. Use a dated folder name that explains the change.
4. Preserve the file's project path in its backup filename where practical.
5. Never silently overwrite an approved stable backup.
6. Record important restore points in this log.
7. Verify a backup exists before making the planned change.
8. Create a full-source backup before the final local build.
9. Keep the final approved build with a reference to its matching source backup.

---

## Verified App-Data Backup Test

**Date:** 09 August 2026  
**Type:** ShopWithEzz user-data backup and restore  
**Result:** Passed on the real Android phone

Test performed:

1. Created a ShopWithEzz backup through Settings.
2. Chose the backup destination.
3. Changed shopping-list and budget data.
4. Selected Restore from Backup.
5. Chose the saved ShopWithEzz JSON file.
6. Confirmed the restore.
7. Verified the earlier shopping list and budget returned correctly.

This test proves the approved in-app backup and restore flow worked on the test phone. It does not replace the final clean-install restore test.

---

## File-Backup Inventory - 09 August 2026

The following backup folders exist under `C:\SWE2-file-backups`.

### Voice, Shopping List, and Settings

- `2026-08-09-settings-and-collected-command`
- `2026-08-09-before-settings-type-fix`
- `2026-08-09-before-shopping-list-read-collected`
- `2026-08-09-before-shopping-list-quote-fix`
- `2026-08-09-before-all-shopping-list-voice-commands`
- `2026-08-09-before-read-my-whole-list-command`
- `2026-08-09-before-voice-delete-commands`
- `2026-08-09-before-folder-based-backup`
- `2026-08-09-before-remove-document-picker`
- `2026-08-09-before-removing-delete-all-data`
- `2026-08-09-edit-item-done-saves`
- `2026-08-09-how-to-use-voice-commands`
- `2026-08-09-complete-speaking-command-list`
- `2026-08-09-how-to-use-i-need-notice`
- `2026-08-09-how-to-use-15-second-rule`

### Home Screen, Layout, and About

- `2026-08-09-before-home-layout-refresh`
- `2026-08-09-before-home-tool-row-alignment`
- `2026-08-09-before-compact-spending-strip`
- `2026-08-09-before-home-navigation-simplification`
- `2026-08-09-before-settings-position-fix`
- `2026-08-09-before-home-offset-and-team-footer`
- `2026-08-09-before-complete-dated-footer`
- `2026-08-09-before-footer-readability`
- `2026-08-09-before-moving-footer-to-about`
- `2026-08-09-before-footer-inside-green-about`
- `2026-08-09-home-trolley-spacing`
- `2026-08-09-loading-woman-trolley-header`
- `2026-08-09-trolley-down-settings-up`

### Tracker, Testing, and Documentation

- `2026-08-09-tracker-quick-test-done`
- `2026-08-09-tracker-smart-test-done`
- `2026-08-09-tracker-visible-save`
- `2026-08-09-tracker-reliability-done`
- `2026-08-09-tracker-granny-test-done`
- `2026-08-09-complete-shopwithezz-bible`
- `2026-08-09-bible-done-start-roadmap`
- `2026-08-09-roadmap-done-start-master-plan`
- `2026-08-09-master-plan-done-stop`
- `2026-08-09-complete-shopwithezz-ideas`
- `2026-08-09-ideas-done-start-changelog`
- `2026-08-09-changelog-done-start-backup-log`

---

## Important Restore Points

### RP-01 - Before Standard Settings and Read Collected Work

**Folder:** `2026-08-09-settings-and-collected-command`  
**Type:** File-level restore point  
**Use:** Recover files from before the Settings and collected-list command work.

### RP-02 - Before Complete Shopping-List Voice Controls

**Folder:** `2026-08-09-before-all-shopping-list-voice-commands`  
**Type:** File-level restore point  
**Use:** Recover the earlier Shopping List voice-control files.

### RP-03 - Before Folder-Based Backup

**Folder:** `2026-08-09-before-folder-based-backup`  
**Type:** File-level restore point  
**Use:** Recover Settings from before the user-selected folder backup implementation.

### RP-04 - Before Home-Screen Simplification

**Folder:** `2026-08-09-before-home-navigation-simplification`  
**Type:** File-level restore point  
**Use:** Recover the earlier home navigation layout.

### RP-05 - Before Voice Delete Commands

**Folder:** `2026-08-09-before-voice-delete-commands`  
**Type:** File-level restore point  
**Use:** Recover files from before collected-list and whole-list voice deletion commands.

### RP-06 - Before Keyboard Done Auto-Save

**Folder:** `2026-08-09-edit-item-done-saves`  
**Type:** File-level restore point  
**Use:** Recover the earlier edit-item screen.

### RP-07 - Before the Full How to Use Screen

**Folder:** `2026-08-09-how-to-use-voice-commands`  
**Type:** File-level restore point  
**Use:** Recover Settings from before the dedicated speaking-command guide.

### RP-08 - Before the 15-Second Hands-Free Explanation

**Folder:** `2026-08-09-how-to-use-15-second-rule`  
**Type:** File-level restore point  
**Use:** Recover the previous How to Use wording.

### RP-09 - Documentation Through Approved Master Plan

**Folder:** `2026-08-09-master-plan-done-stop`  
**Type:** Tracker file restore point  
**Use:** Recover the tracker state after Master Plan approval.

---

## Safe File Restore Procedure

Use this only when a specific project file needs to be recovered.

1. Stop development work.
2. Identify the exact damaged or unwanted file.
3. Identify the correct dated backup folder.
4. Inspect the backup file before copying it.
5. Back up the current file before replacing it.
6. Copy only the required backup file into the correct project location.
7. Run the relevant source checks.
8. Test the recovered feature on the real phone.
9. Record the recovery in this log.

Never restore a large group of files blindly. Never delete the working project to perform a file restore.

---

## Final Full-Source Backup Record

Complete this section before the final local Android build.

**Status:** Pending  
**Backup ID:**  
**Date and Time:**  
**App Version:**  
**Build Number:**  
**Source Folder:** `C:\SWE2`  
**Backup Location:**  
**Included:**  
**Excluded and Re-creatable:**  
**Verification Performed:**  
**Approved By:**  
**Notes:**

---

## Final Local Build Record

Complete this section after the final Android build passes clean-install testing.

**Status:** Pending  
**Build ID:**  
**Build Date and Time:**  
**App Version:**  
**Build Number:**  
**Android Filename:**  
**Build Storage Location:**  
**Matching Source Backup ID:**  
**Clean Installation Tested:**  
**Backup and Restore Tested:**  
**Offline Use Tested:**  
**Trial and Purchase Tested:**  
**Approved By:**  
**Notes:**

---

## Recovery Record Template

Copy this section whenever a backup is used.

**Recovery Date:**  
**Reason:**  
**Backup or Restore Point Used:**  
**Files Restored:**  
**Current Files Backed Up First:**  
**Checks Performed:**  
**Real-Device Test Result:**  
**Approved By:**  
**Notes:**

---

# Document Information

**Version:** 1.0  
**Created:** 09 August 2026  
**Last Updated:** 09 August 2026

---

Designed & Created by Team Lalli61

GSD - Get Stuff Done
