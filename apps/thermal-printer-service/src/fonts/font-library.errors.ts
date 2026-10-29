export class UnsupportedFontFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedFontFormatError';
  }
}

export class InvalidFontFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFontFileError';
  }
}

export class DuplicateFontError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateFontError';
  }
}

export class FontNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FontNotFoundError';
  }
}

export class BuiltInFontImmutableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BuiltInFontImmutableError';
  }
}

export class FontInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FontInUseError';
  }
}
