# How to Run FP-30X Controller on Physical iPhone

## Prerequisites
- **Xcode** installed (26.3+ recommended)
- **Apple ID** (free works for personal device testing)
- **iPhone** connected via USB
- **Node.js** (v22.8.0 via NVM already configured)

## One-Time Setup

### 1. Open the project in Xcode
```bash
open ios/FP30XController.xcworkspace
```
**Important:** Open `.xcworkspace` (NOT `.xcodeproj`) — this includes CocoaPods dependencies.

### 2. Configure code signing
1. Select **FP30XController** in the project navigator (left sidebar, blue icon)
2. Select the **FP30XController** target (under TARGETS)
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** from the dropdown
   - If no team appears: Xcode → Settings → Accounts → add your Apple ID

### 3. Trust developer certificate on iPhone (after first install)
1. Go to **Settings → General → VPN & Device Management**
2. Tap your Apple ID under "Developer App"
3. Tap **"Trust"**

## Running the App

### Option A: From Terminal (recommended)
```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Build and install on device
npm run ios -- --device
```

If multiple devices connected, specify the name:
```bash
npm run ios -- --device "Your iPhone Name"
```

### Option B: From Xcode
1. Select your iPhone from the device dropdown (top bar)
2. Click ▶ Play (or Cmd+R)

## Development Workflow
```bash
npm start       # Start Metro bundler (live reload)
npm test        # Run Jest tests (42 tests across 5 suites)
npm run lint    # Run ESLint
```

- **Hot reload**: JS/TS changes apply instantly without rebuilding
- **Native changes** (Podfile, Info.plist): require full rebuild (`npm run ios`)
- **Pod changes**: run `cd ios && pod install` then rebuild

## Key Notes
- **BLE only works on real device** — simulator does NOT support Bluetooth
- **Free Apple ID**: apps expire after 7 days, re-install to continue testing
- **Paid Apple Developer ($99/yr)**: apps last 1 year, can distribute via TestFlight

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Untrusted Developer" | Trust in Settings → General → VPN & Device Management |
| Build fails with signing error | Ensure team is selected in Xcode Signing & Capabilities |
| Metro bundler not found | Run `npm start` in a separate terminal first |
| `pod install` errors | `cd ios && pod install --repo-update` |
| "No bundle URL present" | Metro isn't running, or device isn't on same WiFi |
| BLE doesn't scan | Check Bluetooth ON, app has permission, use real device |
| Build error after dependency update | `cd ios && pod install && cd .. && npm run ios` |
