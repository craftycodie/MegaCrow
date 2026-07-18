import { T } from "vitest/dist/chunks/reporters.d.BuRON0I0.js";
import { ASTElementBase, ASTElementNode, ElementKind } from "../../abstract-syntax-tree/elements";
import { IR } from "..";
import { Diagnostics } from "../../diagnostics";
import { AST } from "../../abstract-syntax-tree";
import { engineDataLowerer } from "./engine_data";

export type ElementLowerer<T extends ASTElementNode> = (element: T, ast: AST, ir: IR, diagnostics: Diagnostics) => void;

export const NULL_LOWERER: ElementLowerer<any> = () => {};

export const ELEMENT_LOWERERS = new Map<ElementKind, ElementLowerer<any>>();

// string table is build out by all lowerers
ELEMENT_LOWERERS.set(ElementKind.STRING_TABLE, NULL_LOWERER);
// constants are removed at lower.
ELEMENT_LOWERERS.set(ElementKind.CONSTANTS, NULL_LOWERER);

ELEMENT_LOWERERS.set(ElementKind.ENGINE_DATA, engineDataLowerer);
