export type SourcePosition = {
    offset: number;
    // Megalo does not support multi-line tokens, so tokens start and end on the same line.
    // However, SourcePosition is not just used for single token locations.
    line: number;
    column: number;
}

export type SourceLocation = {
    start: SourcePosition;
    end: SourcePosition;
}

export enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

export type Diagnostic = {
    message: string;
    severity: DiagnosticSeverity;
    location: SourceLocation;
}

export class Diagnostics {
    private warnings: Diagnostic[] = [];
    private errors: Diagnostic[] = [];

    public addWarning(message: string, location: SourceLocation): void {
        this.warnings.push({ message, severity: DiagnosticSeverity.Warning, location });
    }

    public addError(message: string, location: SourceLocation): void {
        this.errors.push({ message, severity: DiagnosticSeverity.Error, location });
    }

    public getWarnings(): Diagnostic[] {
        return this.warnings;
    }

    public getErrors(): Diagnostic[] {
        return this.errors;
    }
}