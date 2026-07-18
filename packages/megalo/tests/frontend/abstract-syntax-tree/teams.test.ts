import { describe, expect, it } from "vitest";
import { Parser, SyntaxKind } from "../../../frontend/abstract-syntax-tree";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Diagnostics } from "../../../frontend/diagnostics";
import { Lexer } from "../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../version";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const tokens = new Lexer(version).lex(source, diagnostics);
  const ast = new Parser(version).parse(tokens, diagnostics);
  return { ast, symbolTable: ast.symbolTable.toArray(), diagnostics };
};

describe("teamsParser", () => {
  it("parses teams with shared model and nested team blocks", () => {
    const source = `teams
\tmodel by_designator

\tteam
\t\tfireteam_count 3
\tend

\tteam
\t\tfireteam_count 3
\tend
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.TEAMS);
    if (element.elementKind !== ElementKind.TEAMS) {
      return;
    }

    expect(element.properties).toHaveLength(1);
    expect(element.properties[0]).toMatchObject({
      identifier: "model",
      parameters: [{ kind: SyntaxKind.KEYWORD, value: "by_designator" }],
    });

    expect(element.teams).toHaveLength(2);
    expect(element.teams[0]?.properties).toMatchObject([
      {
        identifier: "fireteam_count",
        parameters: [{ kind: SyntaxKind.INTEGER, value: 3 }],
      },
    ]);
    expect(element.teams[1]?.properties).toMatchObject([
      {
        identifier: "fireteam_count",
        parameters: [{ kind: SyntaxKind.INTEGER, value: 3 }],
      },
    ]);
  });

  it("parses teams with designators", () => {
    const source = `teams
\tteam
\t\tdesignator defenders
\tend
\tteam
\t\tdesignator attackers
\tend
\tteam
\t\tdesignator third_party
\tend
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.TEAMS) {
      return;
    }

    expect(element.properties).toHaveLength(0);
    expect(element.teams).toHaveLength(3);
    expect(element.teams[0]?.properties[0]).toMatchObject({
      identifier: "designator",
      parameters: [{ kind: SyntaxKind.KEYWORD, value: "defenders" }],
    });
    expect(element.teams[2]?.properties[0]).toMatchObject({
      identifier: "designator",
      parameters: [{ kind: SyntaxKind.KEYWORD, value: "third_party" }],
    });
  });

  it("parses team properties including name, model, and color", () => {
    const source = `teams
\tmodel spartan
\tteam
\t\tname team_name_red
\t\tdesignator defenders
\t\tmodel spartan
\t\tcolor 255 0 0
\t\tfireteam_count 2
\tend
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.TEAMS) {
      return;
    }

    expect(element.properties[0]).toMatchObject({
      identifier: "model",
      parameters: [{ kind: SyntaxKind.KEYWORD, value: "spartan" }],
    });

    const team = element.teams[0]!;
    expect(team.properties).toHaveLength(5);
    expect(team.properties[0]).toMatchObject({
      identifier: "name",
      parameters: [{ kind: SyntaxKind.KEYWORD, value: "team_name_red" }],
    });
    expect(team.properties[3]).toMatchObject({
      identifier: "color",
      parameters: [
        { kind: SyntaxKind.INTEGER, value: 255 },
        { kind: SyntaxKind.INTEGER, value: 0 },
        { kind: SyntaxKind.INTEGER, value: 0 },
      ],
    });
  });

  it("reports unknown teams block properties", () => {
    const source = `teams
\tnot_a_property 1
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain(
      "teams block property"
    );
    expect(diagnostics.getErrors()[0]?.message).toContain("not_a_property");

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.TEAMS) {
      return;
    }

    expect(element.properties).toHaveLength(0);
  });

  it("reports unknown team properties", () => {
    const source = `teams
\tteam
\t\tnot_a_property 1
\tend
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("team property");
    expect(diagnostics.getErrors()[0]?.message).toContain("not_a_property");

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.TEAMS) {
      return;
    }

    expect(element.teams[0]?.properties).toHaveLength(0);
  });

  it("reports missing end before eof", () => {
    const source = `teams
\tmodel by_designator
\tteam
\t\tfireteam_count 3
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("end");
  });
});
