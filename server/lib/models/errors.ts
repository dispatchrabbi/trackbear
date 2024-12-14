export class RecordNotFoundError extends Error {
  constructor(model: string, id: number, ...args) {
    const message = `Did not find any ${model} with id ${id}`;
    super(message, ...args);

    if(Error.captureStackTrace) {
      Error.captureStackTrace(this, RecordNotFoundError);
    }

    this.name = this.constructor.name;
    this.meta = {
      model,
      id
    };
  }

  meta: { model: string; id: number };
}

export class CollisionError extends Error {
  constructor(model: string, collidingField: string, value: unknown, ...args) {
    const message = `A record of type ${model} with a ${collidingField} of '${value}' already exists`;
    super(message, ...args);

    if(Error.captureStackTrace) {
      Error.captureStackTrace(this, RecordNotFoundError);
    }

    this.name = this.constructor.name;
    this.meta = {
      model,
      collidingField,
      value,
    };
  }

  meta: {
    model: string;
    collidingField: string;
    value: unknown;
  };
}

export class ValidationError extends Error {
  constructor(model: string, invalidField: string, reason: string, ...args) {
    const message = `Invalid value on ${model} for ${invalidField}: ${reason}`;
    super(message, ...args);

    if(Error.captureStackTrace) {
      Error.captureStackTrace(this, RecordNotFoundError);
    }

    this.name = this.constructor.name;
    this.meta = {
      model,
      invalidField,
      reason,
    };
  }

  meta: {
    model: string;
    invalidField: string;
    reason: string;
  };
}