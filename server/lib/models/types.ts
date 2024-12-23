type AutomaticKeys = 'id' | 'uuid' | 'createdAt' | 'updatedAt';

export type Create<T, AdditionalAutomaticKeys extends keyof T> = Omit<T, AutomaticKeys | AdditionalAutomaticKeys>;
export type Update<T, AdditionalAutomaticKeys extends keyof T> = Partial<Omit<T, AutomaticKeys | AdditionalAutomaticKeys>>;