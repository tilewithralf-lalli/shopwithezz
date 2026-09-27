# ShopWithEzz — App Master Plan

**App-only handover and release plan**  
**Updated:** 27 September 2026

This file contains only the ShopWithEzz information needed to continue this app. The shared Team LALLI61 master remains unchanged.

## 1. App identity — do not change

- App: **ShopWithEzz**
- Package: `com.lalli61.shopwithezz`
- Existing Google Play listing: ShopWithEzz
- Existing track: **Closed testing — Alpha**
- Current published release: **1.1.0, version code 12**
- Public information page: https://tilewithralf-lalli.github.io/shopwithezz/
- Closed-test opt-in page: https://play.google.com/apps/testing/com.lalli61.shopwithezz
- Google Play page: https://play.google.com/store/apps/details?id=com.lalli61.shopwithezz

This is an update to the existing app. Do not create a new Play listing, change the package name, replace the signing setup, or restart the tester process.

## 2. What the app does

ShopWithEzz helps people plan and manage shopping in one simple app. It supports shopping lists, quick item entry, quantities, prices, spending and budget tracking, barcode scanning, photo/import item capture, pantry information, recipes, backup/restore and in-app help.

Main areas: Home, My Shopping List, Scanner, Photo Item / Import Photo, Pantry, Recipes, Settings and How to Use.

## 3. Customer wording

Use this wording everywhere customer-facing access or pricing is described. Do not call the app a trial version.

> **ShopWithEzz is a yearly purchase.** When you install ShopWithEzz, all features are available for 31 days. After that, you can purchase one year of full access in Settings for **A$35**, which works out to about **10 cents per day**. A yearly purchase includes app updates during that paid year. You may cancel at any time, and your access continues until the end of the paid year. When that year ends, you can purchase another year whenever you choose.

The Google Play listing must be checked before upload so its wording matches this approved version.

## 4. Completed app work

- Items imported from Photo/Import now save to the active shopping list.
- Added ACTUAL AMOUNT for the current item.
- Added SHOPPING LIST TOTAL and quantity-aware totals.
- Quantity changes update the item amount and list total.
- Removed Scan Barcode from the Add/Edit Item screen.
- Improved keyboard handling on Photo/Import and Add/Edit screens.
- Compacted the Add/Edit amount area and stopped unwanted screen jumping.
- Preserved the over-budget money-rain alert on the Shopping List screen.
- Updated visible access and pricing wording in Home, Settings and How to Use.
- Added the walkthrough with multiple steps, Skip and Done.
- Reloaded the live development app after code changes.

## 5. Deferred or future work

- Handwritten OCR for prices such as `.98`, `0.98` and `98c` is deferred because the current OCR engine does not read handwritten numbers reliably.
- Compare My List is a future feature and is not part of this Google Play release.

## 6. Final walkthrough requirement

The walkthrough explains:

1. Welcome and what ShopWithEzz does.
2. Creating and editing a shopping list.
3. Scanner and Photo/Import.
4. Spending and the shopping-list total.
5. How to finish and return to the app.

It must have **Skip**, **Next** and **Done**. It must be available again from **How to Use** after the first display. Test it after closing and reopening the app.

## 7. Phone test checklist before building

- [ ] Walkthrough opens, Skip works, Next works, Done works, and How to Use can reopen it.
- [ ] Home opens correctly and access wording contains no customer-facing “trial” wording.
- [ ] Add an item by typing and save it.
- [ ] Add an item by voice and save it.
- [ ] Edit the item name without the keyboard hiding the field.
- [ ] Edit price and quantity; confirm ACTUAL AMOUNT changes.
- [ ] Confirm SHOPPING LIST TOTAL changes and items remain after reload.
- [ ] Mark items bought and reopen the list.
- [ ] Confirm over-budget money-rain alert still works.
- [ ] Test Scanner and camera permission.
- [ ] Test Photo/Import, including editing the detected item before saving.
- [ ] Test Pantry and Recipes.
- [ ] Test Backup/Restore only if the actual screen is present and working.
- [ ] Test on the real Android phone, not only the development preview.

## 8. Google Play upload checklist

1. Finish the phone checklist above.
2. Confirm the exact source folder is `C:\SWE2`.
3. Check Google Play for the next unused version code; never guess or reuse one.
4. Confirm the approved upload keystore and certificate match Play Console.
5. Build a fresh AAB from the tested source.
6. Inspect the AAB package, version name, version code and signing certificate.
7. In Play Console open **Closed testing → Alpha → Create new release → Upload**.
8. Upload the new AAB; do not use an old bundle from the library.
9. Confirm Play Console shows the correct ShopWithEzz identity and version.
10. Roll out the release to the existing closed testers.
11. Confirm testers remain opted in, install from Google Play and provide feedback.
12. Keep at least 12 qualifying testers continuously opted in for 14 consecutive days before requesting production access. Aim for 15 testers.

## 9. Release safety rules

- Do not create a new Google Play app.
- Do not change `com.lalli61.shopwithezz`.
- Do not use an old AAB just because its filename looks correct.
- Do not reuse a version code.
- Do not upload until the AAB signing certificate is verified.
- Do not require a Google reviewer to purchase access.
- Do not start a production release before closed testing and feedback requirements are genuinely complete.

## 10. Working files and key locations

- Project: `C:\SWE2`
- App source: `C:\SWE2\app`
- Android project: `C:\SWE2\android`
- Release files: `C:\SWE2\Releases\Google Play`
- App icon: `C:\SWE2\assets\images\shopwithezz-icon.png`
- This app-only master: `C:\SWE2\ShopWithEzz\SHOPWITHEZZ_APP_MASTER.md`
- Shared master, retained separately: `C:\SWE2\00_SHOPWITHEZZ_DONE_AND_FIXED_MASTER.md`

## Current next step

Complete and verify the walkthrough on the real phone. Then run the complete phone checklist before starting the Google Play build/upload process.

## 11. Real remaining-work checklist

This is the live checklist. Tick an item only after it has been tested and confirmed.

### App testing still required

- [ ] Walkthrough appears on a fresh start.
- [ ] Walkthrough Skip, Next and Done buttons work.
- [ ] Walkthrough can be opened again from How to Use.
- [ ] Home wording is correct and shows no customer-facing “trial” wording.
- [ ] Add, edit, save and reload a normal shopping-list item.
- [ ] Change an item price and confirm ACTUAL AMOUNT changes.
- [ ] Change quantity to 3, 4 and 5 and confirm the total changes correctly.
- [ ] Confirm SHOPPING LIST TOTAL includes all saved items after reopening the app.
- [ ] Confirm the keyboard does not hide the name or price fields.
- [ ] Confirm Photo/Import opens the normal edit screen before saving.
- [ ] Confirm Scanner still works and barcode controls are absent from Add/Edit.
- [ ] Confirm the over-budget money-rain alert still works.
- [ ] Test Pantry, Recipes and Settings.
- [ ] Test Backup/Restore only if the real screen is available.
- [ ] Repeat the important checks on the real Android phone.

### Release checks still required

- [ ] Confirm the final yearly A$35 wording in the Play Console store listing.
- [ ] Confirm the next unused Play version code.
- [ ] Confirm the upload keystore certificate matches Play Console.
- [ ] Confirm the tested source is `C:\SWE2`.
- [ ] Build the new AAB only after the phone checks pass.
- [ ] Verify the AAB package, version code and signing certificate.
- [ ] Upload it to the existing **Closed testing — Alpha** track.
- [ ] Confirm Play processing shows the correct ShopWithEzz release.
- [ ] Roll out the release to the existing testers.
- [ ] Confirm at least 12 testers are continuously opted in for 14 days; aim for 15.
- [ ] Record tester feedback and any fixes.
- [ ] Request production access only after the testing requirement is complete.
