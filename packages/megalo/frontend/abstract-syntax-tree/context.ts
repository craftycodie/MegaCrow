import type { MegaloVersion } from "../../version";
import {
  type Diagnostics,
  type SourceCodeLocation,
  SourceLocationType,
} from "../diagnostics";
import { diagnosticMessages } from "../diagnostics/messages";
import type { ObjectLists } from "../object-lists";
import type { SymbolBinder } from "../symbol-table";
import { type Token, TokenKind, type Tokens } from "../tokens";
import { EngineDataParserRepository } from "./elements/engine_data";
import { PlayerTraitParserRepository } from "./elements/game_options/player_traits";
import { LoadoutParserRepository } from "./elements/loadout";
import { LoadoutPaletteParserRepository } from "./elements/loadout_palette";
import { TeamsParserRepository } from "./elements/teams";
import { ActionParserRepository } from "./elements/trigger/action";
import { ConditionParserRepository } from "./elements/trigger/condition";
import { ParserSymbolContext } from "./symbol-context";

// Used by the parse function to track it's progress & refer to variables in scope.
export class ParserContext {
  private readonly tokens: Tokens;
  private tokenIndex = 0;

  public readonly diagnostics: Diagnostics;
  public readonly symbolParser: ParserSymbolContext;

  public readonly playerTraitParserRepository: PlayerTraitParserRepository;
  public readonly loadoutParserRepository: LoadoutParserRepository;
  public readonly loadoutPaletteParserRepository: LoadoutPaletteParserRepository;
  public readonly teamsParserRepository: TeamsParserRepository;
  public readonly engineDataParserRepository: EngineDataParserRepository;
  public readonly actionParserRepository: ActionParserRepository;
  public readonly conditionParserRepository: ConditionParserRepository;

  public constructor(
    tokens: Tokens,
    megaloVersion: MegaloVersion,
    diagnostics: Diagnostics,
    symbolTable: SymbolBinder,
    objectLists: ObjectLists = {}
  ) {
    this.diagnostics = diagnostics;
    this.tokens = tokens;
    this.symbolParser = new ParserSymbolContext(
      megaloVersion,
      diagnostics,
      symbolTable,
      objectLists
    );
    this.playerTraitParserRepository = new PlayerTraitParserRepository(
      megaloVersion
    );
    this.loadoutParserRepository = new LoadoutParserRepository(megaloVersion);
    this.loadoutPaletteParserRepository = new LoadoutPaletteParserRepository(
      megaloVersion
    );
    this.teamsParserRepository = new TeamsParserRepository(megaloVersion);
    this.engineDataParserRepository = new EngineDataParserRepository(
      megaloVersion
    );
    this.actionParserRepository = new ActionParserRepository(megaloVersion);
    this.conditionParserRepository = new ConditionParserRepository(
      megaloVersion
    );
  }

  public getToken(): Token {
    return this.tokens[this.tokenIndex++];
  }

  public peekToken(offset = 0): Token | undefined {
    return this.tokens[this.tokenIndex + offset];
  }

  public hasMore(): boolean {
    return this.tokenIndex < this.tokens.length;
  }

  public mark(): number {
    return this.tokenIndex;
  }

  public reset(mark: number): void {
    this.tokenIndex = mark;
  }

  /**
   * Use with caution.
   * In Megalo, "end" is a valid variable name.
   * In some elements like string_table, variables are never used, so this is OK.
   */
  public parseUntilEnd(parseItem: () => void): void {
    while (this.hasMore()) {
      const token = this.peekToken()!;
      if (token.kind === TokenKind.Identifier && token.value === "end") {
        this.getToken();
        return;
      }

      const indexBefore = this.tokenIndex;
      parseItem();
      if (this.tokenIndex === indexBefore && this.hasMore()) {
        this.getToken();
      }
    }

    const lastToken = this.tokens.at(-1);
    const location: SourceCodeLocation = lastToken?.location ?? {
      type: SourceLocationType.SOURCE_CODE,
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 0, line: 1, column: 1 },
    };
    this.diagnostics.addError(
      diagnosticMessages.expectedEndBeforeEof(),
      location
    );
  }
}
