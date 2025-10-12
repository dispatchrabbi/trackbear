import { type Expand } from '../obj';

type KeysWithDefaults = 'starred' | 'displayOnProfile';
type AutomaticKeys = 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'ownerId' | 'state';

/**
 * A utility type to make objects holding initialization data for models.
 *
 * @type
 * @param T The base model type
 * @param AdditionalKeysWithDefaults Keys that are optional on creation because they have a default value
 * @param AdditionalAutomaticKeys Keys that will be omitted from the type because their value is automatically supplied
 */
export type Create<
  T,
  AdditionalKeysWithDefaults extends keyof T = never,
  AdditionalAutomaticKeys extends keyof T = never,
> =
  Expand<
    Omit<T, AutomaticKeys | AdditionalAutomaticKeys | Extract<KeysWithDefaults | AdditionalKeysWithDefaults, keyof T>> &
    Partial<Pick<T,
      Extract<KeysWithDefaults | AdditionalKeysWithDefaults, Exclude<keyof T, AutomaticKeys | AdditionalAutomaticKeys>>
    >>
  >;

/**
 * A utility type to make objects holding update data for models.
 *
 * @type
 * @param T The base modeil type
 * @param AdditionalAutomaticKeys Keys that will be omitted from the type because their value is automatically supplied
 */
export type Update<
  T,
  AdditionalAutomaticKeys extends keyof T = never,
> = Expand<Partial<Create<T, never, AdditionalAutomaticKeys>>>;
