// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function traced<This, Args extends any[], Return>(
  fn: (this: This, ...args: Args) => Return,
  // context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  return fn;
}
