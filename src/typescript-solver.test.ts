import ts, { NamedDeclaration } from "typescript";
import path from "path";
import fs from "fs";
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
  Constraint,
  Type,
} from "./index";

const getId = (node: ts.Node) => `${node.pos}${node.end}`;

const generateContraints = (
  node: ts.Node,
  checker: ts.TypeChecker
): Constraint[] => {
  const generateChildrenConstraints = () => {
    let ret: Constraint[] = [];
    ts.forEachChild(node, (node) => {
      ret = ret.concat(generateContraints(node, checker));
    });
    return ret;
  };
  let n; // 🤮
  switch (node.kind) {
    case ts.SyntaxKind.VariableDeclaration:
      n = node as ts.VariableDeclaration;
      return [
        equals(tyVariable(getId(n.name)), tyVariable(getId(n.initializer!))),
        ...generateChildrenConstraints(),
      ];
    case ts.SyntaxKind.Identifier:
      n = node as ts.Identifier;
      let declarationId = (() => {
        const symbol = checker.getSymbolAtLocation(n);
        if (symbol && "name" in symbol.valueDeclaration) {
          return getId((symbol.valueDeclaration as NamedDeclaration).name!);
        }
        return undefined;
      })();
      let nodeId = getId(n);
      return declarationId && declarationId != nodeId
        ? // identifer is a usage
          [equals(tyVariable(nodeId), tyVariable(declarationId))]
        : // identifer is a declaration
          [equals(tyVariable(nodeId), tyVariable(n.text))];
    case ts.SyntaxKind.NumericLiteral:
      n = node as ts.NumericLiteral;
      return [equals(tyVariable(getId(n)), tyNumberLiteral(parseInt(n.text)))];
    default:
      return generateChildrenConstraints();
  }
};

test("assignment", () => {
  let entryPoint = path.resolve("./src/__fixtures__/assignment.ts");
  let program = ts.createProgram([entryPoint], {
    target: ts.ScriptTarget.ES2015,
  });
  let entry = program.getSourceFiles().find((f) => f.fileName === entryPoint)!;
  let checker = program.getTypeChecker();
  let constraints = generateContraints(entry, checker);
  let substitutions = solve(constraints);
  expect(substitutions.anotherOne).toEqual(tyNumberLiteral(1));
  expect(substitutions.one).toEqual(tyNumberLiteral(1));
});

// test("template-string", () => {
//   let entryPoint = path.resolve("./src/__fixtures__/template-string.ts");
//   let program = ts.createProgram([entryPoint], {
//     target: ts.ScriptTarget.ES2015,
//   });
//   let entry = program.getSourceFiles().find((f) => f.fileName === entryPoint)!;
//   let checker = program.getTypeChecker();
//   let constraints = generateContraints(entry, checker);
//   expect(solve(constraints)).toEqual({
//     contentId: tyNumberLiteral(1),
//     url: tyStringLiteral("/api/content/1"),
//   });
// });
