import { Expand } from "../obj";

type AutomaticKeys = 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'ownerId' | 'state';
type KeysWithDefaults = 'starred' | 'displayOnProfile';

export type Create<
  T,
  AdditionalKeysWithDefaults extends keyof T = never,
  AdditionalAutomaticKeys extends keyof T = never,
> =
  Expand<
    Omit<T, AutomaticKeys | AdditionalAutomaticKeys | Extract<KeysWithDefaults | AdditionalKeysWithDefaults, keyof T>> &
    Partial<Pick<T,
      Extract<KeysWithDefaults | AdditionalKeysWithDefaults, keyof T>
    >>
  >;

export type Update<
  T,
  AdditionalAutomaticKeys extends keyof T = never
> = Expand<Partial<Create<T, AdditionalAutomaticKeys>>>;