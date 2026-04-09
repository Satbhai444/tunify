<div align="center">
  
# 🎵 Tunify

**A Next-Generation, Premium Music Experience built with React Native & Expo.**

![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue)
![React Native](https://img.shields.io/badge/React_Native-v0.74-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK_51-000020?logo=expo)
![Zustand](https://img.shields.io/badge/State-Zustand-764ABC)

Tunify delivers a seamless, high-fidelity music streaming experience directly to your device. Designed with beautiful glassmorphic UI elements and dynamic colors, it offers advanced music playback, real-time synced lyrics, and deep artist insights out of the box.

[Features](#features) • [Screenshots](#screenshots) • [Tech Stack](#tech-stack) • [Installation](#installation)

</div>

---

## ✨ Features

- **📱 Premium Scrollable Player:** An immersive, Spotify-like full-screen player. Swipe down to seamlessly view synced lyrics, read about the artist's background, and check song credits.
- **🎧 High-Quality Streaming:** Fast, reliable audio playback powered by the JioSaavn API (with Deezer fallbacks).
- **🎤 Synchronized Lyrics:** Sing along with live, time-synced lyrics that automatically scroll with the song.
- **🎨 Dynamic Theming:** The UI (including mini-players and backgrounds) dynamically adapts to the current album artwork. Supports both deep **Dark Mode** and crisp **Light Mode**.
- **👨‍🎤 Deep Artist Insights:** Automatically fetches artist bios, monthly listeners, and curated top-song catalogs.
- **📚 Personal Library:** Easily "Like" songs to save to your local library, manage custom Playlists, and view your listening history.
- **📱 Background Audio & Lock Screen:** Full lock screen media control integration native to iOS and Android.

## 🛠️ Tech Stack

Tunify is built utilizing a modern, highly optimized JavaScript ecosystem:

- **Framework:** [React Native](https://reactnative.dev/) & [Expo (SDK 51)](https://expo.dev/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (for ultra-fast, boilerplate-free state)
- **Audio Engine:** `expo-av`
- **UI/UX:** `expo-linear-gradient`, `expo-blur`, and custom Animated API hooks for fluid 60FPS transitions.
- **Storage:** `@react-native-async-storage/async-storage` for caching metadata and saving user configurations locally.
- **Data APIs:** Customized internal API hooks connecting to JioSaavn, Last.fm, and Deezer for robust music routing.

## 🚀 Installation & Local Development

To run the application locally on your machine, you'll need Node.js and the Expo CLI installed.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/tunify.git
cd tunify
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Start the development server
```bash
npx expo start
```
*This will open the Expo Developer Tools. You can press `i` to open in an iOS simulator, `a` for an Android emulator, or scan the QR code using the Expo Go app on your physical device.*

### 4. Building for Production
To generate a production APK/AAB or IPA, it is highly recommended to use Expo Application Services (EAS):
```bash
npm install -g eas-cli
eas build -p android --profile production
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/your-username/tunify/issues) if you want to contribute.

## 📝 License
This project is [MIT](https://opensource.org/licenses/MIT) licensed.

---
<div align="center">
  <i>Designed and developed with passion. Enjoy the music! 🎧</i>
</div>
