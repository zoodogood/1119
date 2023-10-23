const TokenTypeEnum = {
  Digit: 1,
  Operator: 2,
  OpenBracket: 4,
  CloseBracket: 8,
  Bracket: 4 & 8,
};

function generalOperatorValidation({ previousToken, nextToken }) {
  return (
    [TokenTypeEnum.CloseBracket, TokenTypeEnum.Digit].includes(
      previousToken?.type,
    ) &&
    [TokenTypeEnum.OpenBracket, TokenTypeEnum.Digit].includes(nextToken?.type)
  );
}

class ExpressionParser {
  static #memory = {};
  static Tokens = {
    Digit: {
      key: "Digit",
      validate: () => true,
      type: TokenTypeEnum.Digit,
      regexp: "(?:\\d|\\.)+",
    },
    PositiveDigit: {
      key: "PositiveDigit",
      validate: () => true,
      type: TokenTypeEnum.Digit,
      regexp: "(?<!\\d)\\+(?:\\d|\\.)+",
    },
    Plus: {
      key: "Plus",
      validate: ({ nextToken, previousToken }) =>
        [
          undefined,
          TokenTypeEnum.OpenBracket,
          TokenTypeEnum.CloseBracket,
          TokenTypeEnum.Digit,
        ].includes(previousToken?.type) &&
        [TokenTypeEnum.OpenBracket, TokenTypeEnum.Digit].includes(
          nextToken?.type,
        ),
      type: TokenTypeEnum.Operator,
      regexp: "\\+",
      operatorPriority: 1,
      merge: ({ previousToken, nextToken }) => {
        const isPreviousIsNumber = previousToken?.type === TokenTypeEnum.Digit;

        if (!nextToken) {
          throw new Error("Bad operator position");
        }

        const value = isPreviousIsNumber
          ? Number(previousToken.raw) + Number(nextToken.raw)
          : Number(nextToken?.raw);
        const merged = this.createToken(value, "Digit");
        return isPreviousIsNumber ? [merged] : [previousToken, merged];
      },
    },
    NegativeDigit: {
      key: "NegativeDigit",
      validate: () => true,
      type: TokenTypeEnum.Digit,
      regexp: "(?<!\\d)-(?:\\d|\\.)+",
    },
    Minus: {
      key: "Minus",
      validate: ({ nextToken, previousToken }) =>
        [
          undefined,
          TokenTypeEnum.OpenBracket,
          TokenTypeEnum.CloseBracket,
          TokenTypeEnum.Digit,
        ].includes(previousToken?.type) &&
        [TokenTypeEnum.OpenBracket, TokenTypeEnum.Digit].includes(
          nextToken?.type,
        ),
      type: TokenTypeEnum.Operator,
      regexp: "\\-",
      operatorPriority: 1,
      merge: ({ previousToken, nextToken }) => {
        const isPreviousIsNumber = previousToken?.type === TokenTypeEnum.Digit;
        if (!nextToken) {
          throw new Error("Bad operator position");
        }

        const value = isPreviousIsNumber
          ? Number(previousToken.raw) - Number(nextToken.raw)
          : -Number(nextToken.raw);
        const merged = this.createToken(value, "Digit");
        return isPreviousIsNumber ? [merged] : [previousToken, merged];
      },
    },
    Divide: {
      key: "Divide",
      validate: generalOperatorValidation,
      type: TokenTypeEnum.Operator,
      regexp: "\\/",
      operatorPriority: 2,
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken || !previousToken) {
          throw new Error("Bad operator position");
        }
        const value = Math.floor(
          Number(previousToken.raw) / Number(nextToken.raw),
        );

        if (!Number.isFinite(value)) {
          const merged = this.createToken(0, "Digit");
          return [merged];
        }

        const merged = this.createToken(value, "Digit");
        return [merged];
      },
    },
    Power: {
      key: "Power",
      validate: generalOperatorValidation,
      type: TokenTypeEnum.Operator,
      regexp: "\\*\\*",
      operatorPriority: 3,
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken || !previousToken) {
          throw new Error("Bad operator position");
        }
        const value = Number(previousToken.raw) ** Number(nextToken.raw);
        const merged = this.createToken(value, "Digit");
        return [merged];
      },
    },
    Multiply: {
      key: "Multiply",
      validate: generalOperatorValidation,
      type: TokenTypeEnum.Operator,
      regexp: "\\*",
      operatorPriority: 2,
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken || !previousToken) {
          throw new Error("Bad operator position");
        }
        const value = Number(previousToken.raw) * Number(nextToken.raw);
        const merged = this.createToken(value, "Digit");
        return [merged];
      },
    },
    Modulo: {
      key: "Modulo",
      validate: generalOperatorValidation,
      type: TokenTypeEnum.Operator,
      regexp: "%",
      operatorPriority: 2,
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken || !previousToken) {
          throw new Error("Bad operator position");
        }
        const value = Number(previousToken.raw) % Number(nextToken.raw) || 0;
        const merged = this.createToken(value, "Digit");
        return [merged];
      },
    },
    BitwiseXOR: {
      key: "BitwiseXOR",
      validate: generalOperatorValidation,
      type: TokenTypeEnum.Operator,
      regexp: "\\^",
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken || !previousToken) {
          throw new Error("Bad operator position");
        }
        const value = Number(previousToken.raw) ^ Number(nextToken.raw);
        const merged = this.createToken(value, "Digit");
        return [merged];
      },
    },
    BitwiseAND: {
      key: "BitwiseAND",
      validate: generalOperatorValidation,
      type: TokenTypeEnum.Operator,
      regexp: "&",
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken || !previousToken) {
          throw new Error("Bad operator position");
        }
        const value = Number(previousToken.raw) & Number(nextToken.raw);
        const merged = this.createToken(value, "Digit");
        return [merged];
      },
    },
    BitwiseOR: {
      key: "BitwiseOR",
      validate: generalOperatorValidation,
      type: TokenTypeEnum.Operator,
      regexp: "\\|",
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken || !previousToken) {
          throw new Error("Bad operator position");
        }
        const value = Number(previousToken.raw) | Number(nextToken.raw);
        const merged = this.createToken(value, "Digit");
        return [merged];
      },
    },
    LogicalOR: {
      key: "LogicalOR",
      validate: generalOperatorValidation,
      type: TokenTypeEnum.Operator,
      regexp: "\\|\\|",
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken || !previousToken) {
          throw new Error("Bad operator position");
        }
        const value = +(Number(previousToken.raw) || Number(nextToken.raw));
        const merged = this.createToken(value, "Digit");
        return [merged];
      },
    },
    LogicalAND: {
      key: "LogicalAND",
      validate: generalOperatorValidation,
      type: TokenTypeEnum.Operator,
      regexp: "&&",
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken || !previousToken) {
          throw new Error("Bad operator position");
        }
        const value = +(Number(previousToken.raw) && Number(nextToken.raw));
        const merged = this.createToken(value, "Digit");
        return [merged];
      },
    },

    LogicalNOT: {
      key: "LogicalNOT",
      validate: ({ previousToken, nextToken }) => {
        const previousValide =
          !previousToken ||
          previousToken.type === TokenTypeEnum.OpenBracket ||
          previousToken.type === TokenTypeEnum.Digit;

        const nextValide =
          nextToken &&
          (nextToken.type === TokenTypeEnum.Digit ||
            nextToken.type === TokenTypeEnum.OpenBracket);

        return previousValide && nextValide;
      },
      type: TokenTypeEnum.Operator,
      regexp: "!",
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken) {
          throw new Error("Bad operator position");
        }
        const value = +!Number(nextToken.raw);
        const merged = this.createToken(value, "Digit");
        return [previousToken, merged];
      },
    },
    LessThan: {
      key: "LessThan",
      validate: generalOperatorValidation,
      type: TokenTypeEnum.Operator,
      regexp: "<",
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken || !previousToken) {
          throw new Error("Bad operator position");
        }
        const value = +(Number(previousToken.raw) < Number(nextToken.raw));
        const merged = this.createToken(value, "Digit");
        return [merged];
      },
    },
    GreaterThan: {
      key: "GreaterThan",
      validate: generalOperatorValidation,
      type: TokenTypeEnum.Operator,
      regexp: ">",
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken || !previousToken) {
          throw new Error("Bad operator position");
        }
        const value = +(Number(previousToken.raw) > Number(nextToken.raw));
        const merged = this.createToken(value, "Digit");
        return [merged];
      },
    },
    StrictEqual: {
      key: "StrictEqual",
      validate: generalOperatorValidation,
      type: TokenTypeEnum.Operator,
      regexp: "===",
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken || !previousToken) {
          throw new Error("Bad operator position");
        }
        const value = +(Number(previousToken.raw) === Number(nextToken.raw));
        const merged = this.createToken(value, "Digit");
        return [merged];
      },
    },

    Tilde: {
      key: "Tilde",
      validate: ({ previousToken, nextToken }) => {
        const previousValide =
          !previousToken ||
          previousToken.type === TokenTypeEnum.OpenBracket ||
          previousToken.type === TokenTypeEnum.Digit;

        const nextValide =
          nextToken &&
          (nextToken.type === TokenTypeEnum.Digit ||
            nextToken.type === TokenTypeEnum.OpenBracket);

        return previousValide && nextValide;
      },
      type: TokenTypeEnum.Operator,
      regexp: "~",
      merge: ({ previousToken, nextToken }) => {
        if (!nextToken) {
          throw new Error("Bad operator position");
        }
        const value = ~Number(nextToken.raw);
        const merged = this.createToken(value, "Digit");
        return [previousToken, merged];
      },
    },
    OpenBracket: {
      key: "OpenBracket",
      validate: () => true,
      type: TokenTypeEnum.OpenBracket,
      regexp: "\\(",
    },
    CloseBracket: {
      key: "CloseBracket",
      validate: () => true,
      type: TokenTypeEnum.CloseBracket,
      regexp: "\\)",
    },
  };

  static lexAnalyze(expression) {
    const tokens = expression.matchAll(
      new RegExp(
        Object.values(this.Tokens)
          .map(({ regexp, key }) => `(?<${key}>${regexp})`)
          .join("|"),
        "g",
      ),
    );

    return [...tokens].map((iterator) => {
      const groups = iterator.groups;
      const key = Object.keys(groups).find((name) => !!groups[name]);
      const raw = groups[key];
      return this.createToken(raw, key);
    });
  }

  static normalizeExpression(expression) {
    expression = expression.replaceAll(/\s|\./g, "");

    expression = this.insertMultiplicationsNearBrackets(
      this.processUnaryOperator(expression),
    );
    const tokens = this.validateTokens(this.lexAnalyze(expression));
    return tokens.map(({ raw }) => raw).join("");
  }

  static processUnaryOperator(expression) {
    return expression.replaceAll(/.?~.+$/g, (value) => {
      const indexOfTilda = value.indexOf("~");
      const needFrontBracket = indexOfTilda === 0 || value[0] !== "(";
      const needBackBracket = value[indexOfTilda + 1] !== "(";
      const raw = value.slice(indexOfTilda + 1);

      const content = this.processUnaryOperator(raw);
      return (
        (indexOfTilda !== 0 ? value[0] : "") +
        (needFrontBracket ? "(" : "") +
        "~" +
        (needBackBracket ? "(" : "") +
        content +
        (needFrontBracket ? ")" : "") +
        (needBackBracket ? ")" : "")
      );
    });
  }

  static insertMultiplicationsNearBrackets(expression) {
    return expression.replaceAll(/(?<=\d)\(|\)(?=\d)/g, (bracket) =>
      bracket === "(" ? "*(" : ")*",
    );
  }

  static validateTokens(tokens) {
    const filtered = [];
    for (let index = 0; index < tokens.length; index++) {
      const element = tokens[index];
      const base = this.Tokens[element.key];
      const isValided = base.validate({
        token: element,
        previousToken: tokens[index - 1],
        nextToken: tokens[index + 1],
      });

      isValided && filtered.push(element);
      !isValided && tokens.splice(index--, 1);
    }

    return filtered;
  }

  static findBracketBorders(expression) {
    const nesting = [];

    for (let index = 0; index < expression.length; index++) {
      const symbol = expression[index];
      if (symbol === "(") {
        nesting.push({ symbol, index });
      }
      if (symbol === ")") {
        const last = nesting.pop();
        if (!last) {
          throw new Error();
        }

        return { from: last.index, to: index };
      }
    }

    if (nesting.length) {
      throw new Error();
    }
    return null;
  }

  static calculate(expression) {
    while (true) {
      const position = this.findBracketBorders(expression);
      if (!position) {
        break;
      }
      const { from, to } = position;
      const replaced = this.foldTokens(
        this.lexAnalyze(expression.slice(from + 1, to)),
      );
      expression =
        expression.slice(0, from) + replaced + expression.slice(to + 1);
    }

    return this.foldTokens(this.lexAnalyze(expression));
  }

  static getSortedTokensBase() {
    if ("SortedTokensBase" in this.#memory) {
      return this.#memory.SortedTokensBase;
    }

    const bases = [...Object.values(this.Tokens)].sort(
      (a, b) => (b.operatorPriority ?? 0) - (a.operatorPriority ?? 0),
    );
    this.#memory.SortedTokensBase = bases;
    return bases;
  }

  static foldTokens(tokens) {
    tokens = [...tokens];

    while (tokens.length > 1) {
      const base = this.getSortedTokensBase().find((base) => {
        if (base.type !== TokenTypeEnum.Operator) {
          return false;
        }

        const indexOfOperator = tokens.findIndex(
          (element) => element.key === base.key,
        );
        if (indexOfOperator === -1) {
          return false;
        }

        const token = tokens[indexOfOperator];
        const previousToken =
          indexOfOperator === 0 ? null : tokens.at(indexOfOperator - 1);
        const nextToken =
          indexOfOperator === tokens.length - 1
            ? null
            : tokens.at(indexOfOperator + 1);
        const newTokensSet = base
          .merge({
            token,
            previousToken,
            nextToken,
          })
          .filter(Boolean);

        tokens.splice(
          indexOfOperator !== 0 ? indexOfOperator - 1 : 0,
          indexOfOperator !== 0 ? 3 : 2,
          ...newTokensSet,
        );

        return true;
      });
      if (!base) {
        throw new Error();
      }
    }
    return tokens.at(0).raw;
  }

  static createToken(raw, key) {
    const base = this.Tokens[key];
    return { type: base.type, raw: String(raw), key };
  }

  static toDigit(expression) {
    return +this.calculate(this.normalizeExpression(expression));
  }
}

export { ExpressionParser };