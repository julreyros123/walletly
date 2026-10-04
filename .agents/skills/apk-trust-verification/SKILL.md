---
name: Android APK Trust & Safe Browsing Verification
description: Comprehensive workflow to eliminate browser virus/harmful download warnings and Google Play Protect flags on Android APKs through official verification, production keystore signing, and Play Store distribution.
---

# Android APK Trust & Safe Browsing Verification Runbook

When a user downloads an `.apk` file directly through a web browser (Chrome, Edge, Samsung Internet) or installs it on an Android device, Google Safe Browsing and Google Play Protect may display warnings such as:
- *"File might be harmful"*
- *"Blocked by Play Protect: Unrecognized app details"*
- *"This type of file can harm your device"*

This runbook documents the **official, legitimate, non-bypass industry standards** to achieve complete trust, eliminate false-positive flags, and properly distribute Android builds.

---

## 1. Root Cause Analysis

Browsers and mobile operating systems flag APKs due to three distinct security checkpoints:

1. **Chromium Safe Browsing Heuristic**:
   - Browsers maintain a cloud-reputation database of downloaded files.
   - Any binary with an `.apk` extension downloaded outside the Google Play Store without an established domain/binary reputation is automatically flagged with an advisory warning by default.
2. **Play Protect Signature Unknown**:
   - Android scans installed packages against Google's known developer signatures.
   - If an APK is signed with a generic, newly generated, or self-signed test key that has never been registered with Google Play or Play Protect, it is classified as "Unrecognized Developer".
3. **Sensitive Permissions in `AndroidManifest.xml`**:
   - Permissions like `RECORD_AUDIO`, `FOREGROUND_SERVICE`, `REQUEST_INSTALL_PACKAGES`, or accessibility services trigger elevated heuristic scrutiny from virus engines.

---

## 2. Proper Resolution Pathways

### Pathway A: Google Play Console Internal App Sharing / Closed Testing (Standard & Permanent)
This is Google's **official mechanism** for distributing test builds to users and testers without triggering any browser or Play Protect flags.

1. **Why it solves the problem**:
   - The app is delivered via the Google Play Store client (`play.google.com`).
   - Safe Browsing and Play Protect treat Google Play as a verified trusted source.
2. **Setup Workflow**:
   1. Create an app listing in the [Google Play Console](https://play.google.com/console).
   2. Navigate to **Release** ➔ **Internal app sharing** or **Testing** ➔ **Closed testing**.
   3. In `eas.json`, configure the build profile for App Bundle (`.aab`):
      ```json
      "preview": {
        "distribution": "internal",
        "android": {
          "buildType": "app-bundle"
        }
      }
      ```
   4. Build and submit:
      ```bash
      eas build --platform android --profile preview
      eas submit --platform android
      ```
   5. Share the internal testing link with testers. Testers install directly through the Play Store app with 0 warnings.

---

### Pathway B: Official Google Play Protect Whitelist / False Positive Appeal
If distributing APKs directly from your own website or cloud storage (outside Google Play), you must submit your app binary to Google's Android Security Team to clear the false positive.

1. **Official Submission Portal**:
   - URL: [Google Play Protect Developer Appeal Form](https://support.google.com/googleplay/android-developer/contact/protectappeals)
2. **Required Information**:
   - **Application Package Name**: e.g. `com.julreyros123.cbudget`
   - **App Version Code & Name**: e.g. Version `1.0.0`, Code `1`
   - **Download Link**: Publicly accessible direct link to the APK
   - **Certificate SHA-256 Fingerprint**: (See extraction command below)
   - **Explanation**: Statement confirming the app is a legitimate financial management application, detailing its purpose and requesting Safe Browsing / Play Protect verification.
3. **Turnaround Time**:
   - Google typically processes and whitelists submitted binaries within 24 to 72 hours. Once verified, Safe Browsing updates its cloud definitions and stops flagging the APK hash.

---

### Pathway C: Production Keystore Setup (Dedicated Developer Identity)
Ensure the APK is signed using a persistent, valid Release Keystore rather than a generic debug certificate.

1. **Inspect Existing Certificate**:
   ```powershell
   keytool -printcert -jarfile <path-to-apk>
   ```
2. **Extract Signing Fingerprint**:
   ```powershell
   # Get SHA-256 of the certificate
   keytool -printcert -jarfile <path-to-apk> | Select-String "SHA256:"
   
   # Get SHA-256 of the APK file itself
   Get-FileHash -Algorithm SHA256 <path-to-apk>
   ```
3. **Configure Dedicated EAS Credentials**:
   - Ensure the Android keystore is configured with explicit organization and developer credentials:
   ```bash
   eas credentials -p android
   ```

---

### Pathway D: Audit Android Permissions
Remove unnecessary elevated permissions that trigger automated malware heuristics.

1. In [`app.json`](file:///c:/Users/acer%20laptop/walletly/app.json) and [`android/app/src/main/AndroidManifest.xml`](file:///c:/Users/acer%20laptop/walletly/android/app/src/main/AndroidManifest.xml), review `android.permissions`:
   - Keep only permissions that the app actively uses in its core user flow.
   - For example, if audio recording is only needed for voice budgeting, ensure appropriate disclosure is present in your privacy policy.
2. In Google Play Developer Console, ensure your **Data Safety Form** and **Privacy Policy** URL are completed and linked.

---

## 3. Quick Verification Checklist

When diagnosing a flagged APK:
- [ ] **Check APK File Hash**: Run `Get-FileHash -Algorithm SHA256 <apk>` to obtain the exact binary fingerprint.
- [ ] **Check VirusTotal Report**: Upload the APK to [VirusTotal](https://www.virustotal.com/) to confirm 0/70 detections and identify which specific engine (e.g. Google Safe Browsing) raised a heuristic flag.
- [ ] **Verify Certificate**: Confirm the APK is signed with a valid v2/v3 signature and not expired (`apksigner verify --verbose <apk>`).
- [ ] **Submit to Google Play Protect**: Use the [Protect Appeals Form](https://support.google.com/googleplay/android-developer/contact/protectappeals) for standalone APKs.
- [ ] **Or Route via Play Internal Testing**: Distribute `.aab` via Google Play Console Internal Track for instant trusted installation.
