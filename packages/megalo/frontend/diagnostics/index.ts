export type SourcePosition = {
    offset: number;
    // Megalo does not support multi-line tokens, so tokens start and end on the same line.
    // However, SourcePosition is not just used for single token locations.
    line: number;
    column: number;
}

export const enum SourceLocationType {
    SOURCE_CODE,
    INCLUDE,
    BUILT_IN,
}

export const BUILT_IN_LOCATION: BuiltInLocation = {
    type: SourceLocationType.BUILT_IN,
}

export type SourceCodeLocation = {
    type: SourceLocationType.SOURCE_CODE;
    start: SourcePosition;
    end: SourcePosition;
}

// TODO
// export type IncludeLocation = {
//     type: SourceLocationType.INCLUDE;
//     file: string;
// }
export type IncludeLocation = SourceCodeLocation;

export type BuiltInLocation = {
    type: SourceLocationType.BUILT_IN
}

export type SourceLocation = SourceCodeLocation | IncludeLocation | BuiltInLocation;

export enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

export type Diagnostic = {
    message: string;
    severity: DiagnosticSeverity;
    location: SourceCodeLocation;
}

export class Diagnostics {
    private warnings: Diagnostic[] = [];
    private errors: Diagnostic[] = [];

    public addWarning(message: string, location: SourceCodeLocation): void {
        this.warnings.push({ message, severity: DiagnosticSeverity.Warning, location });
    }

    public addError(message: string, location: SourceCodeLocation): void {
        this.errors.push({ message, severity: DiagnosticSeverity.Error, location });
    }

    public getWarnings(): Diagnostic[] {
        return this.warnings;
    }

    public getErrors(): Diagnostic[] {
        return this.errors;
    }

    public hasErrors(): boolean {
        return this.errors.length > 0;
    }
}