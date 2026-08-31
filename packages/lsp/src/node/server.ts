import { createConnection, ProposedFeatures } from "vscode-languageserver/node";
import { startMegacrowLanguageServer } from "../createServer";

const connection = createConnection(ProposedFeatures.all);
startMegacrowLanguageServer(connection);
