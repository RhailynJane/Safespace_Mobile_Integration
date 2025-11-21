// Mock implementation for avatarEvents
export type AvatarListener = (url: string | null) => void;

const mockSubscribe = jest.fn(() => jest.fn()); // returns unsubscribe function
const mockEmit = jest.fn();

export const avatarEvents = {
  subscribe: mockSubscribe,
  emit: mockEmit,
};

export default avatarEvents;