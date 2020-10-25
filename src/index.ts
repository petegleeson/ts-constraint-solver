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

const simplify = (x: Type): Type => {
  if (x.type === "concat") {
    const first = simplify(x.first);
    const second = simplify(x.second);
    if (first.type === "strlit" && second.type === "strlit") {
      return tyStringLiteral(`${first.value}${second.value}`);
    } else {
      return tyConcat(first, second);
    }
  }
  return x;
};

export const unify = (a: Type, b: Type): Substitution => {
  if (a.type === "var") {
    return { [a.name]: simplify(b) };
  } else if (b.type === "var") {
    return unify(b, a);
  }
  throw `Types do not unify ${a.type} and ${b.type}`;
};

const extend = (
  a: Substitution,
  b: Substitution,
  onCollision: (t1: Type, t2: Type) => Substitution
): Substitution => {
  return Object.entries(a).reduce((subst, [k, type]) => {
    if (subst[k]) {
      return {
        ...subst,
        ...onCollision(type, subst[k]),
      };
    }
    return subst;
  }, b);
};

export const solve = (constraints: Constraint[]): Substitution => {
  let ret = constraints.reduce((subst, constraint) => {
    return extend(subst, unify(constraint.left, constraint.right), unify);
  }, {});
  console.log(ret);
  return ret;
};
