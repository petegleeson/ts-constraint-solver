import {
  unify,
  solve,
  apply,
  equals,
  concat,
  index,
  tyObject,
  tyVariable,
  tyFunc,
  tyStringLiteral,
  tyNumberLiteral,
  tyNumber,
  tyBooleanLiteral,
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
      concat(
        tyStringLiteral("hello "),
        tyStringLiteral("world"),
        tyVariable("x")
      ),
    ])
  ).toEqual({ x: tyStringLiteral("hello world") });
});

test("chained string literal concat string literal", () => {
  expect(
    solve([
      concat(
        tyStringLiteral("brave "),
        tyStringLiteral("world"),
        tyVariable("y")
      ),
      concat(tyStringLiteral("hello "), tyVariable("y"), tyVariable("x")),
    ])
  ).toEqual({
    x: tyStringLiteral("hello brave world"),
    y: tyStringLiteral("brave world"),
  });
});

test("unify multiple constraints", () => {
  expect(
    solve([
      equals(tyVariable("x"), tyStringLiteral("world")),
      concat(tyStringLiteral("hello "), tyVariable("x"), tyVariable("y")),
    ])
  ).toEqual({ x: tyStringLiteral("world"), y: tyStringLiteral("hello world") });
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
      apply(tyVariable("id"), [tyStringLiteral("hello")], tyVariable("y")),
    ])
  ).toEqual({
    id: tyFunc([tyVariable("x")], tyVariable("x")),
    y: tyStringLiteral("hello"),
  });
});

// id("hello")
test("solves apply", () => {
  expect(
    solve([
      apply(tyVariable("id"), [tyStringLiteral("hello")], tyVariable("y")),
    ])
  ).toEqual({
    id: tyFunc([tyStringLiteral("hello")], tyVariable("y")),
  });
});

// function x(y) {
//   return y("hello");
// }
test("solves higher order function", () => {
  expect(
    solve([
      equals(tyVariable("x"), tyFunc([tyVariable("y")], tyVariable("z"))),
      apply(tyVariable("y"), [tyStringLiteral("hello")], tyVariable("j")),
      equals(tyVariable("j"), tyVariable("z")),
    ])
  ).toEqual({
    j: tyVariable("z"),
    y: tyFunc([tyStringLiteral("hello")], tyVariable("z")),
    x: tyFunc(
      [tyFunc([tyStringLiteral("hello")], tyVariable("z"))],
      tyVariable("z")
    ),
  });
});

// id(1)
// id("hello")
test("solves most general type", () => {
  expect(
    solve([
      equals(tyVariable("id"), tyFunc([tyVariable("x")], tyVariable("x"))),
      apply(tyVariable("id"), [tyStringLiteral("hello")], tyVariable("a")),
      apply(tyVariable("id"), [tyBooleanLiteral(true)], tyVariable("b")),
    ])
  ).toEqual({
    id: tyFunc([tyVariable("x")], tyVariable("x")),
    a: tyStringLiteral("hello"),
    b: tyBooleanLiteral(true),
  });
});

test("valid object index", () => {
  expect(
    solve([
      index(
        tyObject({ firstName: tyStringLiteral("pete") }),
        tyStringLiteral("firstName"),
        tyVariable("x")
      ),
    ])
  ).toEqual({
    x: tyStringLiteral("pete"),
  });
});

test("invalid object index", () => {
  expect(
    solve([
      index(
        tyObject({ firstName: tyStringLiteral("pete") }),
        tyStringLiteral("lastName"),
        tyVariable("x")
      ),
    ])
  ).toEqual({});
});

test("equal number types", () => {
  expect(
    solve([
      equals(tyNumber(), tyVariable("x")),
      equals(tyNumberLiteral(1), tyVariable("y")),
    ])
  ).toEqual({
    x: tyNumber(),
    y: tyNumberLiteral(1),
  });
});
