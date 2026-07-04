import { SourceLocation } from "./diagnostics";

export class FrontendError extends Error {
    public readonly location?: SourceLocation;

    public constructor(message: string, location: SourceLocation) {
        super(message);
        this.location = location;
    }
}