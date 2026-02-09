export interface Token<T> {
  readonly key: symbol;
  readonly description: string;
  readonly _type?: T;
}

interface Registration<T> {
  factory: (container: Container) => T;
  value?: T;
}

export function createToken<T>(description: string): Token<T> {
  return {
    key: Symbol(description),
    description,
  };
}

export class Container {
  private readonly registrations = new Map<symbol, Registration<unknown>>();

  public registerSingleton<T>(
    token: Token<T>,
    factory: (container: Container) => T
  ): void {
    this.registrations.set(token.key, {
      factory,
      value: undefined,
    });
  }

  public resolve<T>(token: Token<T>): T {
    const registration = this.registrations.get(token.key);
    if (!registration) {
      throw new Error(`Token "${token.description}" is not registered`);
    }

    if (registration.value === undefined) {
      registration.value = registration.factory(this);
    }

    return registration.value as T;
  }
}
