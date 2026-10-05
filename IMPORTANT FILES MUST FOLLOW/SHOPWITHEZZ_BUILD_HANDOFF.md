# ShopWithEzz — Build and Release Handover

> **READ `00_SHOPWITHEZZ_MASTER_CURRENT.md` FIRST. This handover is the single local build/release companion. Do not use old duplicate handovers or guess version codes.**

## Project

- Folder: `C:\SWE2`
- Package: `com.lalli61.shopwithezz`
- Main master: `00_SHOPWITHEZZ_MASTER_CURRENT.md`
- Public information/download page: `https://tilewithralf-lalli.github.io/shopwithezz/`

## Verified Google Play position

- The existing ShopWithEzz Play app and listing must be kept; do not create another app.
- Google Play has already used earlier version codes. Check the actual Play Console release history before every build.
- The latest Play Console check showed version code **15 (1.1.1) in review**. Older records mentioning version 13 are historical and must not be treated as the current release.
- Never reuse a version code, upload an old AAB, or use **Add from library** for a new release.

## Mandatory preflight before any build

1. Open ShopWithEzz release history in Google Play Console.
2. Record the highest uploaded version code and set the next unused code in both the project configuration and Android Gradle configuration.
3. Confirm package ID `com.lalli61.shopwithezz`.
4. Confirm the release keystore and upload certificate match Google Play App integrity.
5. Confirm the source is the full ShopWithEzz app: logo, Welcome Back, My Shopping List, Spending, Scanner, Photo/Import Photo and How to Use.
6. Run the type check after dependencies are installed.
7. Build visibly, inspect the AAB package/version/signing, and only then upload.

## Restore dependencies after clean handover

`node_modules` and generated Android build folders were removed from this sellable copy. Recreate dependencies before building:

```cmd
cd /d C:\SWE2
npm install
```

## Local build

Use the version code confirmed in Play Console before running this:

```cmd
cd /d C:\SWE2\android
gradlew.bat bundleRelease --no-daemon --max-workers=1
```

Expected output:

`C:\SWE2\android\app\build\outputs\bundle\release\app-release.aab`

## Upload sequence

1. Verify the new AAB exists and is release-signed.
2. Open the correct ShopWithEzz track in Play Console.
3. Upload the new AAB; do not select an old bundle from the library.
4. Confirm the displayed package, version name and new version code.
5. Review release notes, countries, rollout and warnings.
6. Save/roll out the release and record the exact Play status.
7. Do not restart an existing review without explicit approval.

## Testing and closed testing

- Test the real phone build before calling the release complete.
- Keep the public information page separate from the closed-test opt-in link.
- Record tester account, opt-in date, install/open date, features tested and feedback.
- Do not claim production readiness until Play Console confirms the required qualifying testers and testing period.

## Folder rule

The root of `C:\SWE2` is the single project handover location. Keep the current master, this handover, the release checklist, supporting documents, source, Android project, assets and release materials here. Do not recreate duplicate stale master files in subfolders.
