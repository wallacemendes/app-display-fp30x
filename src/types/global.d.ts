/**
 * Type declarations for modules missing TypeScript definitions.
 */

// react-native-keep-awake lacks @types
declare module 'react-native-keep-awake' {
  export function useKeepAwake(): void;
  export function activateKeepAwake(): void;
  export function deactivateKeepAwake(): void;
}

// Extend global crypto for Hermes (RN 0.84+)
declare const crypto: {
  randomUUID: () => `${string}-${string}-${string}-${string}-${string}`;
};
