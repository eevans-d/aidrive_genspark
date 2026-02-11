type AuthEvent = 'auth_required';
type AuthEventListener = (event: AuthEvent) => void;

const listeners: Set<AuthEventListener> = new Set();

export const authEvents = {
  on(listener: AuthEventListener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  emit(event: AuthEvent) {
    listeners.forEach((listener) => listener(event));
  },
};
