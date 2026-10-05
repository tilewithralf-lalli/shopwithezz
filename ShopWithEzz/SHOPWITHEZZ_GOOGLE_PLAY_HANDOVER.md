# ShopWithEzz — Google Play Update Handover

**Status:** Version 13 uploaded to the existing Closed testing — Alpha track and submitted for review.  
**Updated:** 27 September 2026

## Local release audit result

- Android package is confirmed as `com.lalli61.shopwithezz`.
- Version **12** was the previous release and must not be reused.
- Play Console accepted the new AAB as version **13 (1.1.0)**. Its only validation message was a warning: supported-device counts are unchanged (0 devices removed, 0 newly added).
- The version-13 release was saved and submitted for review.
- The local upload certificate matches the certificate used for the uploaded AAB.
- Local upload certificate SHA-256: `9E:7A:51:55:F0:26:8C:8C:ED:70:87:65:EC:B9:E6:84:4D:03:F1:B2:60:4D:43:34:99:DB:4D:94:44:71:4A:07`

## Fixed app identity

- App: **ShopWithEzz**
- Package: `com.lalli61.shopwithezz`
- Existing Play listing and signing setup must be retained.
- Existing track: **Closed testing — Alpha**
- Uploaded release under review: **1.1.0, version code 13**

## Confirmed before Google upload

- The ShopWithEzz app checklist has been completed on the real phone.
- The walkthrough, item editing, prices, quantities, totals, Photo/Import, Scanner, keyboard handling and budget alert were checked.
- The app-side work is ready for the release process.
- Handwritten OCR for `.98`, `0.98` and `98c` remains deferred and is not part of this upload.

## Google Play work still to do

- [x] Open the existing ShopWithEzz app in Play Console.
- [x] Confirm the next unused version code: **13**.
- [ ] Confirm the final yearly A$34.99 wording in the store listing.
- [x] Confirm the upload-key certificate for the uploaded AAB.
- [x] Build the new AAB from the tested `C:\SWE2` project.
- [x] Verify the AAB package, version name, version code and signing certificate.
- [x] Upload the AAB to **Closed testing → Alpha**.
- [x] Wait for processing and confirm the displayed version is correct.
- [ ] Wait for Play review to finish and roll out the release to existing closed testers.
- [ ] Confirm tester installs and feedback.
- [ ] Keep at least 12 qualifying testers continuously opted in for 14 days; aim for 15.
- [ ] Record the feedback and any action taken.
- [ ] Request production access after the qualifying test is complete.

## Rules

Do not create a new Play app. Do not change the package name. Do not reuse a version code. Do not upload until the signing certificate is verified. Do not ask reviewers to purchase access.

## Important links

- Closed-test opt-in: https://play.google.com/apps/testing/com.lalli61.shopwithezz
- Play listing: https://play.google.com/store/apps/details?id=com.lalli61.shopwithezz

## Next action

Wait for Play Console review. When the release changes from review to available
to testers, confirm tester installation and record feedback. No rebuild is
needed unless Google reports a specific problem.
