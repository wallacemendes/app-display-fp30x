// CSS module side-effect import (NativeWind)
declare module '*.css';

// Missing type declarations
declare module 'react-native-keep-awake';
declare module 'react-native-haptic-feedback';

// Globals available in Hermes/RN runtime but not in TS lib
declare function atob(data: string): string;
declare function btoa(data: string): string;
