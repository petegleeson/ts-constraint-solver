// types
type TyStringLiteral = ReturnType<typeof tyStringLiteral>;
export const tyStringLiteral = (value: string) => ({
  type: "strlit" as const,
  value,
});

type TyString = ReturnType<typeof tyString>;
export const tyString = (value: string) => ({
  type: "str" as const,
  value,
});

type TyVariable = ReturnType<typeof tyVariable>;
export const tyVariable = (name: string) => ({
  type: "var" as const,
  name,
});

type Type = TyString | TyStringLiteral | TyVariable;

// constraints
type Equals = ReturnType<typeof equals>;
export const equals = (left: Type, right: Type) => ({
  type: "eq",
  left,
  right,
});

type Constraint = Equals;

// type substitutions
type Substitution = { [name: string]: Type };

export const solve = (constraint: Constraint): Substitution => {
  return {};
};

const hello = "jello";
