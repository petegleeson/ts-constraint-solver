import { solve, equals, tyConcat, tyVariable, tyStringLiteral } from "./index";

test("type variable equals string literal", () => {
  expect(
    solve(equals(tyVariable("x"), tyStringLiteral("hello world")))
  ).toEqual({ x: tyStringLiteral("hello world") });
});

test("type variable equals type variable", () => {
  expect(solve(equals(tyVariable("x"), tyVariable("y")))).toEqual({
    x: tyVariable("y"),
  });
});

test("equals is symmetric", () => {
  expect(
    solve(equals(tyStringLiteral("hello world"), tyVariable("x")))
  ).toEqual({ x: tyStringLiteral("hello world") });
});

test("string literal concat string literal", () => {
  expect(
    solve(
      equals(
        tyVariable("x"),
        tyConcat(
          tyStringLiteral("hello "),
          tyConcat(tyStringLiteral("brave "), tyStringLiteral("world"))
        )
      )
    )
  ).toEqual({ x: tyStringLiteral("hello brave world") });
});
