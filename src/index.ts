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

type TyFunc = {
  type: "func";
  params: Type[];
  returns: Type;
};
export const tyFunc = (params: Type[], returns: Type): TyFunc => ({
  type: "func" as const,
  params,
  returns,
});

type TyApply = {
  type: "apply";
  func: Type;
  args: Type[];
};
export const tyApply = (func: Type, args: Type[]): TyApply => ({
  type: "apply" as const,
  args,
  func,
});

type Type =
  | TyConcat
  | TyString
  | TyStringLiteral
  | TyVariable
  | TyFunc
  | TyApply;

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
    return { [a.name]: b };
  } else if (b.type === "var") {
    return unify(b, a);
  } else if (a.type === "concat" && b.type === "concat") {
    return compose(unify(a.first, b.first), unify(a.second, b.second));
  } else if (
    a.type === "strlit" &&
    b.type === "strlit" &&
    a.value === b.value
  ) {
    return {};
  } else if (
    a.type === "func" &&
    b.type === "func" &&
    a.params.length === b.params.length
  ) {
    return [...a.params.map((p, i) => unify(p, b.params[i]))].reduce(
      (combined, subst) => compose(combined, subst),
      unify(a.returns, b.returns)
    );
  }
  throw `Types do not unify ${a.type} and ${b.type}`;
};

const applySubst = (subst: Substitution, ty: Type): Type => {
  if (ty.type === "str" || ty.type === "strlit") {
    return ty;
  } else if (ty.type === "var") {
    return subst[ty.name] || ty;
  } else if (ty.type === "func") {
    return tyFunc(
      ty.params.map((t) => applySubst(subst, t)),
      applySubst(subst, ty.returns)
    );
  } else if (ty.type === "apply") {
    const result = unify(
      applySubst(subst, ty.func),
      tyFunc(ty.args, tyVariable("_return"))
    );
    if (result._return) {
      return result._return;
    }
    throw Error("Unable to apply substitution");
  }
  return tyConcat(applySubst(subst, ty.first), applySubst(subst, ty.second));
};

const extend = (subst: Substitution, name: string, ty: Type): Substitution => {
  // if there already exists a substitution for var k
  if (subst[name]) {
    return {
      ...subst,
      ...compose(subst, unify(ty, subst[name])),
    };
  }
  // n^2
  return {
    // apply ty subst to current subst
    ...Object.entries(subst).reduce((curr, [k, t]) => {
      return {
        ...curr,
        [k]: simplify(applySubst({ [name]: ty }, t)),
      };
    }, {}),
    // apply current subst to ty
    [name]: simplify(applySubst(subst, ty)),
  };
};

const compose = (a: Substitution, b: Substitution): Substitution => {
  return Object.entries(b).reduce((subst, [k, type]) => {
    return extend(subst, k, type);
  }, a);
};

export const solve = (constraints: Constraint[]): Substitution => {
  return constraints.reduce((subst, constraint) => {
    return compose(subst, unify(constraint.left, constraint.right));
  }, {});
};
