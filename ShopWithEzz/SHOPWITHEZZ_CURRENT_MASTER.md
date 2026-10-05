# ShopWithEzz — Current Master Plan

**Last updated:** 27 September 2026  
**Project:** `C:\SWE2`  
**Package:** `com.lalli61.shopwithezz`

## Use this file first

This is the short, current working plan. Use the HTML checklist for testing
and `SHOPWITHEZZ_GOOGLE_PLAY_HANDOVER.md` only for Play Console work. Older
master documents in this folder are historical reference, not active steps.

## App purpose

ShopWithEzz manages shopping lists, items, prices and quantities. It supports
typing, voice, barcode and photo/import entry, actual item amounts, shopping-
list totals, spending and budget alerts, pantry, recipes and help.

## Current app behaviour

- Photo Item and Import Photo open the normal editable item screen before save.
- The edit screen shows the item amount and shopping-list total.
- Quantity changes recalculate the item amount and list total.
- Manual prices accept decimal values and cents such as `.98`, `0.98` and
  `98c`.
- Keyboard handling keeps name and price fields usable.
- Scan Barcode is not shown as an edit-screen control.
- The over-budget money-rain alert remains on the main shopping screen.
- The walkthrough has Skip, Next and Done and can be reopened from How to Use.
- Customer wording uses yearly access wording and avoids the word “trial”.
- Handwritten OCR for `0.98` and `98c` remains deferred and is not part of this
  release.

## Locked Google Play identity

- Existing ShopWithEzz Play listing and Closed testing — Alpha track.
- Package: `com.lalli61.shopwithezz`.
- Do not create a new Play app or reuse a version code.
- Current update: version `1.1.0`, version code `13`.
- The version-13 AAB was uploaded and submitted for Play review.

## Current files

- Source project: `C:\SWE2`
- AAB: `C:\SWE2\android\app\build\outputs\bundle\release\app-release.aab`
- Release checklist: `SHOPWITHEZZ_RELEASE_CHECKLIST.html`
- Google handover: `SHOPWITHEZZ_GOOGLE_PLAY_HANDOVER.md`

## Complete

- App fixes completed and checked on the phone.
- Version 13 built successfully.
- Package, version and upload certificate checked.
- AAB uploaded to the existing Closed testing — Alpha release.
- Play changes saved and submitted for review.
- GitHub source and project documents updated.

## Remaining

1. Wait for Play review to finish.
2. Confirm version 13 becomes available to testers.
3. Have testers install/open it and record feedback.
4. Keep qualifying testers continuously opted in for the required period.
5. Request production access only after the testing requirement is complete.

## Yearly access wording

ShopWithEzz is a yearly purchase. All features are available for 31 days after
installation. After that, one year of full access can be purchased in Settings
for A$34.99, about 10 cents per day. The purchase includes app updates during
that paid year. Access continues until the paid year ends, and another year
can be purchased whenever needed. There is no automatic renewal.

## Future work

Compare My List, live supermarket price comparison and handwritten price OCR
are future work and are not part of this release.

## Future update process

1. Test the current source on the phone.
2. Check the next unused Play version code.
3. Verify the approved upload-key certificate.
4. Build and verify a fresh AAB from `C:\SWE2`.
5. Upload it to the existing Closed testing — Alpha track.
6. Confirm Play processing and tester availability.

---

**Document:** ShopWithEzz Current Master Plan  
**Version:** 2.0  
**Owner:** Team LALLI61
