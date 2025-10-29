type Listener = (payload?: any) => void;

class NotificationEvents {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(payload?: any) {
    for (const l of Array.from(this.listeners)) {
      try { l(payload); } catch { /* no-op */ }
    }
  }
}

const notificationEvents = new NotificationEvents();
export default notificationEvents;
