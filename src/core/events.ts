type Listener<Payload> = (payload: Payload) => void;

export class EventBus<EventMap extends object> {
  private readonly listeners: { [Name in keyof EventMap]?: Set<Listener<EventMap[Name]>> } = {};

  on<Name extends keyof EventMap>(name: Name, listener: Listener<EventMap[Name]>): () => void {
    const registered = this.listeners[name] ?? new Set<Listener<EventMap[Name]>>();
    registered.add(listener);
    this.listeners[name] = registered;
    return () => this.off(name, listener);
  }

  off<Name extends keyof EventMap>(name: Name, listener: Listener<EventMap[Name]>): void {
    this.listeners[name]?.delete(listener);
  }

  emit<Name extends keyof EventMap>(name: Name, payload: EventMap[Name]): void {
    this.listeners[name]?.forEach((listener) => listener(payload));
  }
}
