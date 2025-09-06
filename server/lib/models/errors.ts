export class RecordNotFoundError extends Error {
  constructor(model: string, id: number | string, idField: string = 'id') {
    const message = `Did not find any ${model} with id ${id}`;
    super(message);

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
  constructor(model: string, invalidField: string, reason: string) {
    const message = `Invalid value on ${model} for ${invalidField}: ${reason}`;
    super(message);

    if(Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
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
