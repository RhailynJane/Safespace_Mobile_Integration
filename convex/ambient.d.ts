// Temporary ambient declarations so TypeScript doesn't error before `npx convex dev`
declare module "./_generated/server" {
  export const query: any;
  export const mutation: any;
}

declare module "./_generated/api" {
  export const api: any;
}

// Common relative import path used from app/* files
declare module "../convex/_generated/api" {
  export const api: any;
}

// For utility imports that resolve from project root
declare module "./_generated/api" {
  export const api: any;
}
