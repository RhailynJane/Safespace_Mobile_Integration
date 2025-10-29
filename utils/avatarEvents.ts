// Lightweight event bus for avatar/profile image updates across screens
// No external deps; works in RN/Expo

export type AvatarListener = (url: string | null) => void;

const listeners = new Set<AvatarListener>();

export const avatarEvents = {
  subscribe(listener: AvatarListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emit(url: string | null) {
    listeners.forEach((fn) => {
      try {
        fn(url);
      } catch (e) {
        // isolate listener errors
        console.warn('avatarEvents listener error:', e);
      }
    });
  },
};

export default avatarEvents;
