#include "tree_sitter/alloc.h"
#include "tree_sitter/array.h"
#include "tree_sitter/parser.h"

#include <ctype.h>

typedef Array(char) String;

enum TokenType {
    MACRO_EXPANSION,

    NONE,
};

struct Scanner {
    struct {
        size_t num_brackets;
    } macro;
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
                                       unsigned length) {
    // TODO
}

static inline bool rpmspec_scan_shell_macro(struct Scanner *scanner,
                                            TSLexer *lexer,
                                            const bool *valid_symbols) {
    // TODO

    return false;
}

static inline bool rpmspec_scan_simple_macro(struct Scanner *scanner,
                                             TSLexer *lexer,
                                             const bool *valid_symbols)
{
    bool ok = false;

    lexer->result_symbol = MACRO_EXPANSION;

    for (;!isspace(lexer->lookahead); advance(lexer)) {
        bool done = false;

        switch (lexer->lookahead) {
            case '*':
                lexer->mark_end(lexer);
                break;
            case '#':
                lexer->mark_end(lexer);
                break;
            case '_':
                lexer->mark_end(lexer);
                break;
            default:
                if (isalnum(lexer->lookahead)) {
                    lexer->mark_end(lexer);
                }
                break;
        }
    }

    return ok;
}

static inline bool rpmspec_scan_macro(struct Scanner *scanner,
                                      TSLexer *lexer,
                                      const bool *valid_symbols)
{
    return false;
}

static inline bool rpmspec_scan(struct Scanner *scanner,
                                TSLexer *lexer,
                                const bool *valid_symbols)
{
    switch (lexer->lookahead) {
        case '%':
            advance(lexer);

            switch (lexer->lookahead) {
                case '%':
                    /* Escape sequence */
                    return false;
                case '*':
                case '#':
                case '_':
                    return rpmspec_scan_simple_macro(scanner, lexer, valid_symbols);
                case '{':
                    return rpmspec_scan_macro(scanner, lexer, valid_symbols);
                case '(':
                    return rpmspec_scan_shell_macro(scanner, lexer, valid_symbols);
                default:
                    if (isalnum(lexer->lookahead)) {
                        return rpmspec_scan_macro(scanner, lexer, valid_symbols);
                    }

                    return false;
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
