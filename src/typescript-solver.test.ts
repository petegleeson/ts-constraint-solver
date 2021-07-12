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
  tyString,
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
    case ts.SyntaxKind.StringLiteral:
      n = node as ts.StringLiteral;
      return [equals(tyVariable(getId(n)), tyStringLiteral(n.text))];
    case ts.SyntaxKind.TemplateExpression:
      n = node as ts.TemplateExpression;

      const concatParts = (first: Type, parts: ts.Node[]): Constraint[] => {
        const [second, ...others] = parts;
        if (others.length === 0) {
          return [
            concat(first, tyVariable(getId(second)), tyVariable(getId(node))),
          ];
        }
        let localId = `${getId(node)}-${parts.length}`;
        return [
          concat(first, tyVariable(getId(second)), tyVariable(localId)),
          ...concatParts(tyVariable(localId), others),
        ];
      };

      return [
        // ordering important
        ...generateChildrenConstraints(),
        ...concatParts(tyStringLiteral(n.head.rawText || ""), [
          ...n.templateSpans,
        ]),
      ];
    case ts.SyntaxKind.TemplateSpan:
      n = node as ts.TemplateSpan;
      return [
        ...generateChildrenConstraints(),
        concat(
          tyVariable(getId(n.expression)),
          tyStringLiteral(n.literal.text),
          tyVariable(getId(n))
        ),
      ];
    case ts.SyntaxKind.VariableDeclaration:
      n = node as ts.VariableDeclaration;
      return [
        equals(tyVariable(getId(n.name)), tyVariable(getId(n.initializer!))),
        ...generateChildrenConstraints(),
      ];
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

test("template-string", () => {
  let entryPoint = path.resolve("./src/__fixtures__/template-string.ts");
  let program = ts.createProgram([entryPoint], {
    target: ts.ScriptTarget.ES2015,
  });
  let entry = program.getSourceFiles().find((f) => f.fileName === entryPoint)!;
  let checker = program.getTypeChecker();
  let constraints = generateContraints(entry, checker);
  let substitutions = solve(constraints);
  expect(substitutions.contentId).toEqual(tyStringLiteral("1"));
  expect(substitutions.url).toEqual(tyStringLiteral("/api/content/1"));
  expect(substitutions.domain).toEqual(
    tyStringLiteral("http://mysite.com/api/content/1")
  );
  expect(substitutions.greeting).toEqual(tyStringLiteral("gday there, bob"));
});
