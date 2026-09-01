# ShopWithEzz — Google Play Console handoff and recovery plan

Date: 1 September 2026  
Package: `com.lalli61.shopwithezz`  
Developer account: TEAM LALLI61

## The likely root cause

The most likely explanation is that the correct, current ShopWithEzz app was tested locally on the PC and confirmed working, but Work Mode later built or uploaded the AAB from an old or wrong local project/build folder. GitHub may not have been involved in that upload at all.

The sequence appears to have been:

1. The current full app was tested on the phone.
2. We confirmed that it worked correctly.
3. We said to make the APK/AAB.
4. Work Mode then made or uploaded the AAB directly from the PC.
5. The build or selected upload file came from older files in an old PC folder, an old project/build location, or an old AAB copy.
6. Google Play received the old startup app instead of the current full ShopWithEzz app.

This explains why the tested app looked correct while the Google Play downloads still showed the old startup app. It also explains why the AAB available from Downloads was Version Code 8 / version 1.1.0.

This is the working conclusion, but it must be confirmed by comparing the real PC project, the actual project/folder used by Work Mode, the AAB build output, and the tested app before any new build is made. GitHub should also be checked as a backup, but we must not assume it was the source of the upload.

## What the current full app must show

The correct current ShopWithEzz app is the app shown on the phone with:

- ShopWithEzz logo and name
- Welcome Back / Hi, Ralf
- My Shopping List
- Spending
- Scanner
- Photo Item / Import Photo
- How to Use

## Evidence from the uploaded and Play Console files

- The AAB checked today contains package `com.lalli61.shopwithezz`.
- Its Version Name is `1.1.0`.
- Its Version Code is `8`.
- Google rejected that file because Version Code 8 had already been used.
- Google Play showed old bundles with Version Codes 6, 7, 8 and 9.
- The Google Play downloads for Codes 6, 7, 8 and 9 all showed the old startup app, not the current full app.
- Therefore, Codes 6, 7, 8 and 9 must not be used for the current app.
- Version Code 9 is already used and cannot be changed, deleted, or reused.
- The next correct build must use Version Code 10.

Changing the number alone will not fix the app. If an old project is relabelled from Code 8 to Code 10, it will still contain the old app. The correct full project must be found first.

## What went wrong with the version number

The Version Code is permanently stored inside the finished AAB. It cannot be edited after the AAB has been created.

The only correct process is:

1. Open the correct current ShopWithEzz source project.
2. Confirm the final tested features and screens are present.
3. Save and commit all final changes.
4. Push those changes to GitHub.
5. Change the Version Code to the next unused number, which is 10.
6. Build a new AAB.
7. Inspect that AAB before uploading it.

## Current Play Console state

- ShopWithEzz app listing and app information are present in Play Console.
- Internal testing is Active.
- Closed testing showed Active — 1 track on the dashboard, but the Closed testing - Alpha setup page also showed an inactive setup with no current release attached. Treat the track/release state as needing verification.
- Old releases remain in Play Console because used version codes cannot be deleted or reused.
- Existing old drafts may be discarded, but published/uploaded version-code history cannot be deleted.
- Do not restart an existing review. A modal warned that restarting would cancel the review in progress and increase the wait time.
- The original Submission 1 was shown as Published. Submission 2, which contained a store-description change, was Cancelled. Do not assume the corrected description is live until it is verified.

## Do not repeat these mistakes

- Do not select an old bundle from **Add from library**.
- Do not upload `Shopwithezz.aab` from Downloads until its version code and app contents have been checked.
- Do not use Version Codes 6, 7, 8 or 9 for the current app.
- Do not upload Version Code 10 until the AAB has been checked and confirmed to contain the current full app.
- Do not delete or recreate the Play app listing.
- Do not restart the existing review.
- Do not rebuild or change the app blindly.
- Do not assume that changing the version number makes an old build current.
- Do not send the user through the old Internal testing → Testers loop when the actual issue is the wrong bundle.

## Correct next PC session plan

Use the Windows PC with USB phone tethering, as previously planned.

1. Open the real ShopWithEzz project in VS Code.
2. Find the exact project/folder used when the current full app was tested successfully on the phone.
3. Check whether the final changes are present in that local project.
4. Identify exactly which local project and build folder Work Mode used when it made the uploaded AAB.
5. Do not delete or overwrite any project until the correct one has been identified.
6. Save all final changes in the correct project.
7. Compare the confirmed project with GitHub and save/push it as a permanent backup if needed.
8. Only then change the Version Code to 10.
9. Build a new AAB from that confirmed project.
10. Inspect the AAB before uploading. Confirm:
    - package is `com.lalli61.shopwithezz`;
    - version code is 10;
    - the file is newly created from the confirmed project;
    - the app screens and features match the current full app shown on the phone;
    - it is not an old `Shopwithezz.aab` copy from Downloads.
11. In Play Console, use the required testing track and choose **Upload**, not **Add from library**.
12. Upload only the verified current AAB.
13. Confirm the displayed Version Code is 10 before saving.
14. Save, preview and submit the release only after the bundle identity is correct.
15. After publication, verify that the Google Play tester page shows the current full app screens, not the old startup app.
16. Then verify the existing ShopWithEzz tester list contains `ralfyvonne1@gmail.com` and save it if needed.

## Store description text intended for ShopWithEzz

The user does not want the words “trial”, “locked”, “limited access”, “full version”, or “unlocked” in the store description.

```text
ShopWithEzz helps you plan and manage your shopping in one simple app.

Create shopping lists, add items quickly, track prices and budgets, scan product barcodes, import item photos, and keep useful pantry and recipe information together.

When you install ShopWithEzz, all features are available for 31 days. If you wish to upgrade now, purchase it in Settings for A$35. If not, use the app for 31 days and decide later. Once purchased, the app is yours to use for as long as you wish.
```

The description change containing this text was previously cancelled in Submission 2, so verify the live listing before assuming this text is published.

## Final truth to carry forward

The Play Console app/listing is not the main problem. The main problem is identifying and preserving the correct current ShopWithEzz source before creating the next AAB.

The correct app was tested and worked on the phone, but Work Mode appears to have built or uploaded from the wrong/old local PC project or AAB location. GitHub was not necessarily used for that upload. The old Play bundles were then used or uploaded instead.

The attached AAB proves that the available file is the old Version Code 8 / version 1.1.0 build. Version Code 9 is already used. The next upload must be Version Code 10, built only after the correct full project has been found, saved to GitHub, and verified.

**No more uploading until the correct project and AAB are confirmed.**
