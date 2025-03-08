export class RecordNotFoundError extends Error {
  constructor(model: string, id: number | string, idField: string = 'id', ...args: unknown[]) {
    const message = `Did not find any ${model} with id ${id}`;
    super(message, ...args);

    if(Error.captureStackTrace) {
      Error.captureStackTrace(this, RecordNotFoundError);
    }

    this.name = this.constructor.name;
    this.meta = {
      model,
      idField,
      id: JSON.stringify(id),
    };
  }

  meta: { 
    model: string;
    idField: string;
    id: string;
  };
}

export class ValidationError extends Error {
  constructor(model: string, invalidField: string, reason: string, ...args: unknown[]) {
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