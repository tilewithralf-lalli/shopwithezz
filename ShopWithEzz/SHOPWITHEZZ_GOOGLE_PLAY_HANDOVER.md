# ShopWithEzz — Google Play Update Handover

**Status:** App testing complete; Google Play release steps remain.  
**Updated:** 27 September 2026

## Local release audit result

- Android package is confirmed as `com.lalli61.shopwithezz`.
- Local Android version is currently **1.1.0 / version code 12**, which is the last published code and must not be uploaded again.
- Play Console confirms code **12** is the current Closed Alpha release, so the next upload must use **version code 13 or higher**.
- Play Console accepted the new AAB as version **13 (1.1.0)**. Its only validation message is a warning: supported-device counts are unchanged (0 devices removed, 0 newly added).
- The local upload keystore is present, but its certificate still needs to be compared with Play Console's Upload key certificate.
- Local upload certificate SHA-256: `9E:7A:51:55:F0:26:8C:8C:ED:70:87:65:EC:B9:E6:84:4D:03:F1:B2:60:4D:43:34:99:DB:4D:94:44:71:4A:07`

## Fixed app identity

- App: **ShopWithEzz**
- Package: `com.lalli61.shopwithezz`
- Existing Play listing and signing setup must be retained.
- Existing track: **Closed testing — Alpha**
- Last published release: **1.1.0, version code 12**

## Confirmed before Google upload

- The ShopWithEzz app checklist has been completed on the real phone.
- The walkthrough, item editing, prices, quantities, totals, Photo/Import, Scanner, keyboard handling and budget alert were checked.
- The app-side work is ready for the release process.
- Handwritten OCR for `.98`, `0.98` and `98c` remains deferred and is not part of this upload.

## Google Play work still to do

- [ ] Open the existing ShopWithEzz app in Play Console.
- [ ] Confirm the next unused version code. Never reuse a previous code.
- [ ] Confirm the final yearly A$35 wording in the store listing.
- [ ] Confirm the upload-key certificate matches Play Console App integrity.
- [ ] Build the new AAB from the tested `C:\SWE2` project.
- [ ] Verify the AAB package is `com.lalli61.shopwithezz`.
- [ ] Verify the AAB version name, version code and signing certificate.
- [ ] Open **Closed testing → Alpha → Create new release**.
- [ ] Upload the new AAB. Do not use an old bundle from the library.
- [ ] Wait for processing and confirm the displayed version is correct.
- [ ] Roll out the release to the existing closed testers.
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

Start with the first Google check: open Play Console and confirm the next unused version code, expected to be higher than 12. Then compare the Play Console Upload key certificate with the local keystore. Do not build until both are confirmed.
