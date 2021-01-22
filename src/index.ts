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

type TyBooleanLiteral = ReturnType<typeof tyBooleanLiteral>;
export const tyBooleanLiteral = (value: boolean) => ({
  type: "boollit" as const,
  value,
});

type TyBoolean = ReturnType<typeof tyBoolean>;
export const tyBoolean = () => ({
  type: "bool" as const,
});

type TyVariable = ReturnType<typeof tyVariable>;
export const tyVariable = (name: string) => ({
  type: "var" as const,
  name,
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

type Type =
  | TyString
  | TyStringLiteral
  | TyBoolean
  | TyBooleanLiteral
  | TyVariable
  | TyFunc;

// constraints
type Equals = ReturnType<typeof equals>;
export const equals = (left: Type, right: Type) => ({
  type: "eq" as const,
  left,
  right,
});

type Apply = ReturnType<typeof apply>;
export const apply = (func: Type, args: Type[], ret: Type) => ({
  type: "apply" as const,
  func,
  args,
  ret,
});

type Concat = ReturnType<typeof concat>;
export const concat = (first: Type, second: Type, ret: Type) => ({
  type: "concat" as const,
  first,
  second,
  ret,
});

type Constraint = Equals | Apply | Concat;

// type substitutions
type Substitution = { [name: string]: Type }; // @idea extend value to include history

export const unify = (a: Type, b: Type): Substitution => {
  if (a.type === "var") {
    return { [a.name]: b };
  } else if (b.type === "var") {
    return unify(b, a);
  } else if (
    a.type === "strlit" &&
    b.type === "strlit" &&
    a.value === b.value
  ) {
    return {};
  } else if (
    a.type === "boollit" &&
    b.type === "boollit" &&
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
  if (
    ty.type === "str" ||
    ty.type === "strlit" ||
    ty.type === "bool" ||
    ty.type === "boollit"
  ) {
    return ty;
  } else if (ty.type === "var") {
    return subst[ty.name] || ty;
  } else if (ty.type === "func") {
    return tyFunc(
      ty.params.map((t) => applySubst(subst, t)),
      applySubst(subst, ty.returns)
    );
  }
  throw `Cannot apply substitution to type ${ty}`;
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
        [k]: applySubst({ [name]: ty }, t),
      };
    }, {}),
    // apply current subst to ty
    [name]: applySubst(subst, ty),
  };
};

const compose = (a: Substitution, b: Substitution): Substitution => {
  return Object.entries(b).reduce((subst, [k, type]) => {
    return extend(subst, k, type);
  }, a);
};

const initialise = (ty: Type): Type => {
  if (ty.type === "func") {
    return tyFunc(
      ty.params.map((p) =>
        p.type === "var" ? tyVariable(`${p.name}'`) : initialise(p)
      ),
      ty.returns.type === "var"
        ? tyVariable(`${ty.returns.name}'`)
        : initialise(ty.returns)
    );
  }
  return ty;
};

export const solve = (constraints: Constraint[]): Substitution => {
  return constraints.reduce((subst, constraint) => {
    if (constraint.type === "apply") {
      let application = unify(
        initialise(applySubst(subst, constraint.func)),
        tyFunc(constraint.args, constraint.ret)
      );
      return compose(
        subst,
        Object.keys(application)
          .filter((k) => !k.endsWith("'"))
          .reduce((s, k) => {
            // @ts-ignore
            s[k] = application[k];
            return s;
          }, {})
      );
    } else if (constraint.type === "concat") {
      const first = applySubst(subst, constraint.first);
      const second = applySubst(subst, constraint.second);
      if (first.type === "strlit" && second.type === "strlit") {
        return compose(
          subst,
          unify(
            constraint.ret,
            tyStringLiteral(`${first.value}${second.value}`)
          )
        );
      }
      return subst;
    }
    return compose(subst, unify(constraint.left, constraint.right));
  }, {});
};
