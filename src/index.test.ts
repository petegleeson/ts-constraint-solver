import {
  unify,
  solve,
  equals,
  tyConcat,
  tyVariable,
  tyApply,
  tyFunc,
  tyStringLiteral,
} from "./index";

test("type variable equals string literal", () => {
  expect(unify(tyVariable("x"), tyStringLiteral("hello world"))).toEqual({
    x: tyStringLiteral("hello world"),
  });
});

test("type variable equals type variable", () => {
  expect(unify(tyVariable("x"), tyVariable("y"))).toEqual({
    x: tyVariable("y"),
  });
});

test("equals is symmetric", () => {
  expect(unify(tyStringLiteral("hello world"), tyVariable("x"))).toEqual({
    x: tyStringLiteral("hello world"),
  });
});

test("string literal concat string literal", () => {
  expect(
    solve([
      equals(
        tyVariable("x"),
        tyConcat(tyStringLiteral("hello "), tyStringLiteral("world"))
      ),
    ])
  ).toEqual({ x: tyStringLiteral("hello world") });
});

test("nested string literal concat string literal", () => {
  expect(
    solve([
      equals(
        tyVariable("x"),
        tyConcat(
          tyStringLiteral("hello "),
          tyConcat(tyStringLiteral("brave "), tyStringLiteral("world"))
        )
      ),
    ])
  ).toEqual({ x: tyStringLiteral("hello brave world") });
});

test("unify multiple constraints", () => {
  expect(
    solve([
      equals(tyVariable("x"), tyStringLiteral("world")),
      equals(
        tyVariable("y"),
        tyConcat(tyStringLiteral("hello "), tyVariable("x"))
      ),
    ])
  ).toEqual({ x: tyStringLiteral("world"), y: tyStringLiteral("hello world") });
});

test("solve eq concat", () => {
  expect(
    solve([
      equals(
        tyConcat(tyStringLiteral("hello "), tyVariable("x")),
        tyConcat(tyStringLiteral("hello "), tyStringLiteral("world"))
      ),
    ])
  ).toEqual({ x: tyStringLiteral("world") });
});

test("solves var eq var", () => {
  expect(
    solve([
      equals(tyVariable("x"), tyVariable("y")),
      equals(tyVariable("y"), tyStringLiteral("hello")),
    ])
  ).toEqual({ x: tyStringLiteral("hello"), y: tyStringLiteral("hello") });
});

test("solves var eq func", () => {
  expect(
    solve([
      equals(tyVariable("y"), tyStringLiteral("hello")),
      equals(tyVariable("x"), tyFunc([], tyVariable("y"))),
    ])
  ).toEqual({
    y: tyStringLiteral("hello"),
    x: tyFunc([], tyStringLiteral("hello")),
  });
});

test("solves func eq func", () => {
  expect(
    solve([
      equals(tyVariable("x"), tyFunc([tyVariable("y")], tyVariable("y"))),
      equals(
        tyVariable("x"),
        tyFunc([tyStringLiteral("hello")], tyStringLiteral("hello"))
      ),
    ])
  ).toEqual({
    y: tyStringLiteral("hello"),
    x: tyFunc([tyStringLiteral("hello")], tyStringLiteral("hello")),
  });
});

test("solves eq identity apply", () => {
  expect(
    solve([
      equals(tyVariable("id"), tyFunc([tyVariable("x")], tyVariable("x"))),
      equals(
        tyVariable("y"),
        tyApply(tyVariable("id"), [tyStringLiteral("hello")])
      ),
    ])
  ).toEqual({
    id: tyFunc([tyVariable("x")], tyVariable("x")),
    y: tyStringLiteral("hello"),
  });
});

// function x(y) {
//   return y();
// }

test("solves higher order function", () => {
  expect(
    solve([
      equals(tyVariable("x"), tyFunc([tyVariable("y")], tyVariable("z"))),
      equals(
        tyVariable("z"),
        tyApply(tyVariable("y"), [tyStringLiteral("hello")])
      ),
    ])
  ).toEqual({
    x: tyFunc([tyVariable("y")], tyVariable("z")),
    y: tyFunc([tyVariable("hello")], tyVariable("z")),
  });
});
