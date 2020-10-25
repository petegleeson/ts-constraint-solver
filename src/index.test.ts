import { solve, equals, tyVariable, tyStringLiteral } from "./index";

test("it works", () => {
  expect(
    solve(equals(tyVariable("x"), tyStringLiteral("hello world")))
  ).toEqual({ x: tyStringLiteral("hello world") });
});
