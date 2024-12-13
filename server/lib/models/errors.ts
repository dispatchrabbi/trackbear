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