// types
type TyStringLiteral = ReturnType<typeof tyStringLiteral>;
export const tyStringLiteral = (value: string) => ({
  type: "strlit" as const,
  value,
});

type TyString = ReturnType<typeof tyString>;
export const tyString = () => ({
  type: "str" as const,
});

type TyVariable = ReturnType<typeof tyVariable>;
export const tyVariable = (name: string) => ({
  type: "var" as const,
  name,
});

type TyConcat = {
  type: "concat";
  first: Type;
  second: Type;
};
export const tyConcat = (first: Type, second: Type): TyConcat => ({
  type: "concat" as const,
  first,
  second,
});

type Type = TyConcat | TyString | TyStringLiteral | TyVariable;

// constraints
type Equals = ReturnType<typeof equals>;
export const equals = (left: Type, right: Type) => ({
  type: "eq" as const,
  left,
  right,
});

type Constraint = Equals;

// type substitutions
type Substitution = { [name: string]: Type }; // @idea extend value to include history

export const solve = (constraint: Constraint): Substitution => {
  if (constraint.type === "eq") {
    const { left, right } = constraint;
    // order is important here
    if (left.type === "concat") {
      const { first, second } = left;
      if (first.type === "strlit" && second.type === "strlit") {
        return solve(
          equals(tyStringLiteral(first.value + second.value), right)
        );
      }
      return Object.entries(solve(equals(first, right))).reduce(
        (subst, [k, type]) => {
          if (subst[k]) {
            return {
              ...subst,
              ...solve(equals(tyConcat(type, subst[k]), right)),
            };
          }
          return subst;
        },
        solve(equals(second, right))
      );
    } else if (right.type === "concat") {
      return solve(equals(right, left));
    } else if (left.type === "var") {
      return { [left.name]: right };
    } else if (right.type === "var") {
      return solve(equals(right, left));
    }
  }
  return {};
};

const hello = "jello";
