import {
  unify,
  solve,
  equals,
  tyConcat,
  tyVariable,
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
