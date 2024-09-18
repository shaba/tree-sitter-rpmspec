#include "tree_sitter/alloc.h"
#include "tree_sitter/array.h"
#include "tree_sitter/parser.h"

#include <wctype.h>

typedef Array(char) String;

enum TokenType {
    MACRO_START,
    MACRO_EXPR_START,
    MACRO_SHELL_START,
    MACRO_END,

    NONE,
};

struct Literal {
    enum TokenType type;
    int32_t open_delimiter;
    int32_t close_delimiter;
    int32_t nesting_depth;
    bool allows_interpolation;
};

struct Scanner {
    Array(struct Literal) literal_stack;
};

static inline void advance(TSLexer *lexer) {
    lexer->advance(lexer, false);
}

/*
 * This function copies the complete state of the scanner into the given byte
 * buffer, and return the number of bytes written.
 */
static inline unsigned rpmspec_serialize(struct Scanner *scanner,
                                         char *buffer) {
    size_t size = 0;

    // TODO

    return size;
}

/*
 * This function restores the state of the scanner based the bytes that were
 * previously written by the serialize function.
 */
static inline void rpmspec_deserialize(struct Scanner *scanner,
                                       const char *buffer,
                                       unsigned length)
{
    // TODO
}

static inline bool rpmspec_macro_start(struct Scanner *scanner,
                                       TSLexer *lexer,
                                       struct Literal *literal,
                                       const bool *valid_symbols)
{
    switch (lexer->lookahead) {
    case '%':
        advance(lexer);

        switch (lexer->lookahead) {
        case '{':
            if (!valid_symbols[MACRO_START]) {
                return false;
            }

            literal->type = MACRO_START;
            literal->open_delimiter = '{';
            literal->close_delimiter = '}';

            advance(lexer);
            break;
        case '[':
            if (!valid_symbols[MACRO_EXPR_START]) {
                return false;
            }

            literal->type = MACRO_EXPR_START;
            literal->open_delimiter = '[';
            literal->close_delimiter = ']';

            advance(lexer);
            break;
        case '(':
            if (!valid_symbols[MACRO_SHELL_START]) {
                return false;
            }

            literal->type = MACRO_SHELL_START;
            literal->open_delimiter = '(';
            literal->close_delimiter = ')';

            advance(lexer);
            break;
        default:
            break;
        }

        break;
    }

    return false;
}

static inline bool rpmspec_scan(struct Scanner *scanner,
                                TSLexer *lexer,
                                const bool *valid_symbols)
{
    if (valid_symbols[MACRO_START]) {
        struct Literal literal = {
            .nesting_depth = 1,
        };
        bool ok;

        ok = rpmspec_macro_start(scanner, lexer, &literal, valid_symbols);
        if (ok) {
            array_push(&scanner->literal_stack, literal);
            lexer->result_symbol = literal.type;

            return true;
        }
    }

    /* Escape symbol %% */
    switch (lexer->lookahead) {
    case '%':
        advance(lexer);

        switch (lexer->lookahead) {
            case '%':
                /* Escape sequence */
                return false;
            default:
                break;
        }
        break;
    default:
        break;
    }

    return false;
}

void *tree_sitter_rpmspec_external_scanner_create()
{
    struct Scanner *scanner = ts_calloc(1, sizeof(struct Scanner));

    return scanner;
}

void tree_sitter_rpmspec_external_scanner_destroy(void *payload) {
    struct Scanner *scanner = (struct Scanner *)payload;

    ts_free(scanner);
}

unsigned tree_sitter_rpmspec_external_scanner_serialize(void *payload,
                                                        char *buffer)
{
    struct Scanner *scanner = (struct Scanner *)payload;

    return rpmspec_serialize(scanner, buffer);
}

void tree_sitter_rpmspec_external_scanner_deserialize(void *payload,
                                                      const char *buffer,
                                                      unsigned length)
{
    struct Scanner *scanner = (struct Scanner *)payload;

    rpmspec_deserialize(scanner, buffer, length);
}

bool tree_sitter_rpmspec_external_scanner_scan(void *payload, TSLexer *lexer,
                                              const bool *valid_symbols) {
    struct Scanner *scanner = (struct Scanner *)payload;

    return rpmspec_scan(scanner, lexer, valid_symbols);
}
