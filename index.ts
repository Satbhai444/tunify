import { registerRootComponent } from 'expo';
import App from './App';

// Disable TrackPlayer registration to prevent immediate crash in Expo Go
registerRootComponent(App);
