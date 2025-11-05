type Listener = () => void | Promise<void>;

class AuthEventBus {
  private refreshListeners = new Set<Listener>();
  private expireListeners = new Set<Listener>();

  onRefresh(listener: Listener) {
    this.refreshListeners.add(listener);
    return () => this.refreshListeners.delete(listener);
  }

  onExpired(listener: Listener) {
    this.expireListeners.add(listener);
    return () => this.expireListeners.delete(listener);
  }

  async emitRefreshRequested() {
    for (const listener of Array.from(this.refreshListeners)) {
      await listener();
    }
  }

  emitSessionExpired() {
    for (const listener of Array.from(this.expireListeners)) {
      void listener();
    }
  }
}

export const authEvents = new AuthEventBus();
