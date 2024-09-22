/**
 * @file Tree-sitter grammar definition for RPM spec files
 * @author Andreas Schneider
 * @author Omair Majid
 * @license MIT
 * @see {@link https://rpm-software-management.github.io/rpm/manual/spec.html|spec syntax documentation}
 */

const PREC = {
    parenthesized_expression: 1,

    or: 10,
    and: 11,
    not: 12,
    compare: 13,
    plus: 14,
    times: 15,
};

const NEWLINE = /\r?\n/;
const ANYTHING = /[^\r\n]*/;
const BLANK = /( |\t)+/;

/* https://rpm-software-management.github.io/rpm/manual/spec.html */
module.exports = grammar({
    name: 'rpmspec',

    // Array of tokens that may appear anywhere in the language.
    extras: ($) => [
        $.comment,
        /\s+/,
        /\\( |\t|\v|\f)/,
        NEWLINE,
        $.line_continuation,
    ],

    supertypes: ($) => [
        $._simple_statements,
        $._compound_statements,
        $.expression,
        $.primary_expression,
    ],

    inline: ($) => [
        $._simple_statements,
        $._compound_statements,
        $._conditional_block,
    ],

    word: ($) => $.identifier,

    rules: {
        spec: ($) => repeat($._statements),

        _statements: ($) =>
            choice($._simple_statements, $._compound_statements),

        _simple_statements: ($) =>
            choice(
                $.macro_expansion,
                $.macro_ternary,
                $.macro_invocation,
                $.macro_shell_expansion,
                $.preamble,
                $.description,
                $.package,
                $.prep_scriptlet,
                $.generate_buildrequires,
                $.conf_scriptlet,
                $.build_scriptlet,
                $.install_scriptlet,
                $.check_scriptlet,
                $.clean_scriptlet,
                $.runtime_scriptlet,
                $.trigger,
                $.file_trigger,
                $.files,
                $.changelog
            ),

        comment: ($) =>
            token(choice(seq('#', ANYTHING), seq('%dnl ', ANYTHING))),

        line_continuation: (_) =>
            token(seq('\\', choice(seq(optional('\r'), '\n'), '\0'))),

        identifier: (_) =>
            /(\p{XID_Start}|\$|_|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8})(\p{XID_Continue}|\$|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8})*/,

        ///////////////////////////////////////////////////////////////////////
        // Conditionals (%if, %ifarch, %ifos)
        ///////////////////////////////////////////////////////////////////////

        _compound_statements: ($) =>
            choice($.if_statement, $.ifarch_statement, $.ifos_statement),

        primary_expression: ($) =>
            prec(
                1,
                choice(
                    $.string,
                    $.quoted_string,
                    $.integer,
                    $.float,
                    $.parenthesized_expression,
                    $.integer_expansion,
                    $.macro_expansion
                )
            ),

        // This adds support for: 0%{?fedora}
        integer_expansion: ($) =>
            seq($.integer, choice($.macro_expansion, $.macro_ternary)),

        boolean_operator: ($) =>
            choice(
                prec.left(
                    PREC.and,
                    seq(
                        field('left', $.expression),
                        field('operator', '&&'),
                        field('right', $.expression)
                    )
                ),
                prec.left(
                    PREC.or,
                    seq(
                        field('left', $.expression),
                        field('operator', '||'),
                        field('right', $.expression)
                    )
                )
            ),

        not_operator: ($) =>
            prec(PREC.not, seq('!', field('argument', $.expression))),

        arithmetic_operator: ($) => {
            const table = [
                [prec.left, '+', PREC.plus],
                [prec.left, '-', PREC.plus],
                [prec.left, '*', PREC.times],
                [prec.left, '/', PREC.times],
            ];

            return choice(
                ...table.map(([fn, operator, precedence]) =>
                    fn(
                        precedence,
                        seq(
                            field('left', $.primary_expression),
                            field('operator', operator),
                            field('right', $.primary_expression)
                        )
                    )
                )
            );
        },

        comparison_operator: ($) =>
            prec.left(
                PREC.compare,
                seq(
                    $.primary_expression,
                    repeat1(
                        seq(
                            field(
                                'operators',
                                choice('<', '<=', '==', '!=', '>=', '>')
                            ),
                            $.primary_expression
                        )
                    )
                )
            ),

        with_operator: ($) =>
            seq(
                '%{',
                field('operators', choice('with', 'without')),
                $.identifier,
                '}'
            ),

        defined_operator: ($) =>
            seq(
                '%{',
                field('operators', choice('defined', 'undefined')),
                $.identifier,
                '}'
            ),

        parenthesized_expression: ($) =>
            prec(PREC.parenthesized_expression, seq('(', $.expression, ')')),

        expression: ($) =>
            choice(
                $.arithmetic_operator,
                $.comparison_operator,
                $.not_operator,
                $.boolean_operator,
                $.with_operator,
                $.defined_operator,
                $.primary_expression
            ),

        _conditional_block: ($) =>
            repeat1(
                choice(
                    prec(-1, $._simple_statements),
                    $._compound_statements,
                    $.defattr,
                    $.file
                )
            ),

        // %if
        if_statement: ($) =>
            seq(
                '%if',
                field('condition', $.expression),
                token.immediate(NEWLINE),
                optional(field('consequence', $._conditional_block)),
                repeat(field('alternative', $.elif_clause)),
                optional(field('alternative', $.else_clause)),
                '%endif',
                token.immediate(NEWLINE)
            ),

        elif_clause: ($) =>
            seq(
                '%elif',
                field('condition', $.expression),
                token.immediate(NEWLINE),
                field('consequence', $._conditional_block)
            ),

        else_clause: ($) =>
            seq(
                '%else',
                token.immediate(NEWLINE),
                field('body', $._conditional_block)
            ),

        // %ifarch
        arch: ($) => repeat1(choice($.macro_expansion, $.identifier)),

        ifarch_statement: ($) =>
            seq(
                choice('%ifarch', '%ifnarch'),
                field('condition', $.arch),
                token.immediate(NEWLINE),
                optional(field('consequence', $._conditional_block)),
                repeat(field('alternative', $.elifarch_clause)),
                optional(field('alternative', $.else_clause)),
                '%endif',
                token.immediate(NEWLINE)
            ),

        elifarch_clause: ($) =>
            seq(
                '%elifarch',
                optional(field('consequence', $.single_word)),
                token.immediate(NEWLINE),
                field('consequence', $._conditional_block)
            ),

        // %ifos
        os: ($) => repeat1(choice($.macro_expansion, $.identifier)),

        ifos_statement: ($) =>
            seq(
                choice('%ifos', '%ifnos'),
                field('condition', $.os),
                token.immediate(NEWLINE),
                optional(field('consequence', $._conditional_block)),
                repeat(field('alternative', $.elifos_clause)),
                optional(field('alternative', $.else_clause)),
                '%endif',
                token.immediate(NEWLINE)
            ),

        elifos_clause: ($) =>
            seq(
                '%elifos',
                optional(field('consequence', $.single_word)),
                token.immediate(NEWLINE),
                field('consequence', $._conditional_block)
            ),

        ///////////////////////////////////////////////////////////////////////
        // Preamble Section (Name, Version, Release, ...)
        ///////////////////////////////////////////////////////////////////////

        preamble: ($) => seq($.tags),

        // Name:   tree-sitter-rpmspec
        // Requires(pre): tree-sitter
        // Summary: A parser generator Tool
        tags: ($) =>
            seq(
                choice($.tag, $.dependency_tag),
                token.immediate(/:( |\t)*/),
                field('value', $._value),
                token.immediate(NEWLINE)
            ),

        tag: ($) =>
            choice(
                'AutoProv',
                'AutoReq',
                'AutoReqProv',
                'BugUrl',
                'BuildRoot',
                'BuildSystem',
                'DistTag',
                'Distribution',
                'Epoch',
                'Group',
                'License',
                'ModularityLabel',
                'Name',
                'NoPatch',
                'NoSource',
                'Packager',
                'Release',
                'SourceLicense',
                'Summary',
                'URL',
                'Url',
                'VCS',
                'Vendor',
                'Version',
                /Patch\d*/,
                /Source\d*/
            ),

        // Dependencies:
        // Requires(pre): tree-sitter
        qualifier: ($) =>
            choice(
                'pre',
                'post',
                'preun',
                'postun',
                'pretrans',
                'posttrans',
                'verify',
                'interp',
                'meta'
            ),

        // BuildRequires: tree-sitter-cli
        dependency_tag: ($) =>
            choice(
                seq('Requires', optional(seq('(', $.qualifier, ')'))),
                'BuildArch',
                'BuildArchitectures',
                'BuildConflicts',
                'BuildPrereq',
                'BuildRequires',
                'Conflicts',
                'DocDir',
                'Enhances',
                'ExcludeArch',
                'ExcludeOS',
                'ExclusiveArch',
                'ExclusiveOS',
                'Obsoletes',
                'OrderWithRequires',
                'Prefix',
                'Prefixes',
                'Prereq',
                'Provides',
                'Recommends',
                'RemovePathPostfixes',
                'Suggests',
                'Supplements'
            ),

        _value: ($) =>
            prec(
                -1,
                choice(
                    prec(1, $.integer_expansion),
                    $.macro_ternary,
                    $.integer,
                    $.float,
                    $.version,
                    $.string,
                    $.quoted_string
                )
            ),

        ///////////////////////////////////////////////////////////////////////
        // Description Section (%description)
        ///////////////////////////////////////////////////////////////////////

        section_name: ($) => seq('%', $.identifier),

        description: ($) =>
            prec.right(
                seq(
                    alias('%description', $.section_name),
                    optional(seq(optional('-n'), $.single_word)),
                    token.immediate(NEWLINE),
                    optional($.text)
                )
            ),

        ///////////////////////////////////////////////////////////////////////
        // Preamble Sub-Sections (%package)
        ///////////////////////////////////////////////////////////////////////

        package: ($) =>
            prec.right(
                seq(
                    alias('%package', $.section_name),
                    optional('-n'),
                    $.single_word,
                    token.immediate(NEWLINE),
                    repeat1($.preamble)
                )
            ),

        ///////////////////////////////////////////////////////////////////////
        // Build scriptlets (%prep, %build, %install, ...)
        ///////////////////////////////////////////////////////////////////////

        shell_block: ($) =>
            prec.right(
                repeat1(
                    choice(
                        $._compound_statements,
                        $.macro_invocation,
                        prec(1, $.macro_expansion),
                        $.string
                    )
                )
            ),

        prep_scriptlet: ($) =>
            prec.right(
                seq(
                    alias(token(seq('%prep', NEWLINE)), $.section_name),
                    optional($.shell_block)
                )
            ),

        generate_buildrequires: ($) =>
            prec.right(
                seq(
                    alias(
                        token(seq('%generate_buildrequires', NEWLINE)),
                        $.section_name
                    ),
                    optional($.shell_block)
                )
            ),

        conf_scriptlet: ($) =>
            prec.right(
                seq(
                    alias(token(seq('%conf', NEWLINE)), $.section_name),
                    optional($.shell_block)
                )
            ),

        build_scriptlet: ($) =>
            prec.right(
                seq(
                    alias(token(seq('%build', NEWLINE)), $.section_name),
                    optional($.shell_block)
                )
            ),

        install_scriptlet: ($) =>
            prec.right(
                seq(
                    alias(token(seq('%install', NEWLINE)), $.section_name),
                    optional($.shell_block)
                )
            ),

        check_scriptlet: ($) =>
            prec.right(
                seq(
                    alias(token(seq('%check', NEWLINE)), $.section_name),
                    optional($.shell_block)
                )
            ),

        clean_scriptlet: ($) =>
            prec.right(
                seq(
                    alias(token(seq('%clean', NEWLINE)), $.section_name),
                    optional($.shell_block)
                )
            ),

        ///////////////////////////////////////////////////////////////////////
        // Runtime scriptlets (%pre, %post, ...)
        ///////////////////////////////////////////////////////////////////////

        runtime_scriptlet: ($) =>
            prec.right(
                seq(
                    choice(
                        '%pre',
                        '%post',
                        '%preun',
                        '%postun',
                        '%pretrans',
                        '%posttrans',
                        '%preuntrans',
                        '%postuntrans',
                        '%verify'
                    ),
                    optional(seq(optional('-n'), $.single_word)),
                    token.immediate(NEWLINE),
                    optional($.shell_block)
                )
            ),

        ///////////////////////////////////////////////////////////////////////
        // Triggers (%triggerin, %triggerun, ...)
        ///////////////////////////////////////////////////////////////////////

        trigger: ($) =>
            prec.right(
                seq(
                    choice(
                        '%triggerprein',
                        '%triggerin',
                        '%triggerun',
                        '%triggerpostun'
                    ),
                    optional(seq(optional('-n'), $.single_word)),
                    token.immediate(NEWLINE),
                    optional($.shell_block)
                )
            ),

        ///////////////////////////////////////////////////////////////////////
        // File triggers (%filetriggerin, %filetriggerun, ...)
        ///////////////////////////////////////////////////////////////////////

        file_trigger: ($) =>
            prec.right(
                seq(
                    choice(
                        '%filetriggerin',
                        '%filetriggerun',
                        '%filetriggerpostun',
                        '%transfiletriggerin',
                        '%transfiletriggerun',
                        '%transfiletriggerpostun'
                    ),
                    optional(seq(optional('-n'), $.single_word)),
                    token.immediate(NEWLINE),
                    optional($.shell_block)
                )
            ),

        ///////////////////////////////////////////////////////////////////////
        // Files section (%files)
        ///////////////////////////////////////////////////////////////////////

        files: ($) =>
            prec.right(
                seq(
                    alias('%files', $.section_name),
                    optional(choice($.string, seq('-n', $.string))),
                    optional(seq('-f', $.string)),
                    token.immediate(NEWLINE),
                    repeat(choice($._compound_statements, $.defattr, $.file))
                )
            ),

        defattr: ($) =>
            seq(
                '%defattr',
                '(',
                choice('-', /[0-9]+/),
                ',',
                /[a-zA-Z]+/,
                ',',
                /[a-zA-Z]+/,
                ')',
                token.immediate(NEWLINE)
            ),

        file_qualifier: ($) =>
            seq(
                choice(
                    '%artifact',
                    '%config',
                    '%dir',
                    '%doc',
                    '%docdir',
                    '%ghost',
                    '%license',
                    '%missingok',
                    '%readme',
                    $.verify
                ),
                token.immediate(BLANK)
            ),

        file: ($) =>
            seq(
                optional($.attr),
                optional($.file_qualifier),
                $.string,
                token.immediate(NEWLINE)
            ),

        attr: ($) =>
            seq(
                '%attr',
                '(',
                choice('-', /[0-9]+/),
                ',',
                /[a-zA-Z]+/,
                ',',
                /[a-zA-Z]+/,
                ')',
                token.immediate(BLANK)
            ),

        // %verify(not size filedigest mtime) %{prefix}/bin/file
        verify: ($) =>
            seq(
                '%verify',
                token.immediate('('),
                repeat(
                    choice(
                        'filedigest',
                        'group',
                        'maj',
                        'md5',
                        'mode',
                        'min',
                        'mtime',
                        'not',
                        'owner',
                        'size',
                        'symlink'
                    )
                ),
                token.immediate(')')
            ),

        ///////////////////////////////////////////////////////////////////////
        // Changelog Section (%changelog)
        ///////////////////////////////////////////////////////////////////////

        changelog: ($) =>
            seq(
                alias(token(seq('%changelog', NEWLINE)), $.section_name),
                repeat($.changelog_entry)
            ),

        // * Tue May 31 2016 Adam Miller <maxamillion@fedoraproject.org> - 0.1-1
        // * Fri Jun 21 2002 Bob Marley <marley@redhat.com>

        changelog_entry: ($) =>
            seq(
                '*',
                $.string_content,
                NEWLINE,
                repeat(seq('-', $.string, NEWLINE))
            ),

        ///////////////////////////////////////////////////////////////////////
        // Special Macros (%autosetup, %autopatch, %setup, ...)
        ///////////////////////////////////////////////////////////////////////

        // TODO

        ///////////////////////////////////////////////////////////////////////
        // Directives (%attr, %dir, %config, ...)
        ///////////////////////////////////////////////////////////////////////

        integer: ($) => token(/-?(0x)?[0-9]+(#[0-9A-Za-z@_]+)?/),

        float: ($) => {
            const digits = repeat1(/[0-9]+_?/);

            return token(seq(digits, '.', digits));
        },

        version: ($) => {
            const digits = repeat1(/[0-9]+_?/);

            return token(
                seq(digits, '.', digits, optional(/[a-zA-Z0-9+._-~]+/))
            );
        },

        text: ($) =>
            prec(
                -1,
                repeat1(
                    seq(
                        choice(
                            seq(optional('%'), $.text_content),
                            $.macro_expansion
                        )
                    )
                )
            ),

        text_content: (_) => token(prec(-1, /([^"%\\\r\n]|\\(.|\r?\n))+/)),

        string: ($) =>
            prec(-1, repeat1(seq(choice($.macro_expansion, $.string_content)))),

        string_content: (_) => token(prec(-1, /([^%\\\r\n])+/)),

        quoted_string: ($) =>
            seq(
                '"',
                repeat(choice($.macro_expansion, $.quoted_string_content)),
                '"'
            ),

        quoted_string_content: (_) => token(prec(-1, /([^"%\\\r\n])+/)),

        single_word: ($) =>
            prec(
                -1,
                choice(
                    $.macro_expansion,
                    $._word,
                    seq($.macro_expansion, $._word),
                    seq($._word, $.macro_expansion)
                )
            ),

        _word: (_) => /([^"%{}()\\\s])+/,

        ///////////////////////////////////////////////////////////////////////
        // Macros
        ///////////////////////////////////////////////////////////////////////

        // TODO FIXME Macros can be nested, this can only be detected correctly
        // using an external scanner

        // default: %{<name>}
        //
        // The macro invocation should have a higher precedence than macro
        // expansion.
        //
        // TODO: Add support for nested macros
        macro_expansion: ($) =>
            prec(
                -1,
                seq('%', choice($._macro_expansion, $._macro_curly_expansion))
            ),

        _macro_expansion: ($) => choice($.macro_builtin, $.identifier),

        _macro_curly_expansion: ($) =>
            seq(token.immediate('{'), $._macro_expansion, '}'),

        macro_builtin: ($) =>
            choice(
                'P',
                'S',
                'basename',
                'define',
                'dirname',
                'dnl',
                'dump',
                'echo',
                'error',
                'exists',
                'expand',
                'expr',
                'getdirconf',
                'getenv',
                'getncpus',
                'global',
                'gsub',
                'len',
                'load',
                'lower',
                'lua',
                'macrobody',
                'quote',
                'rep',
                'reverse',
                'rpmversion',
                'shrink',
                'sub',
                'suffix',
                'trace',
                'u2p',
                'shescape',
                'uncompress',
                'undefine',
                'upper',
                'url2path',
                'verbose',
                'warn'
            ),

        // %define foo bar
        macro_invocation: ($) =>
            seq(
                token.immediate('%'),
                $._macro_invocation,
                //token.immediate(NEWLINE)
            ),

        _macro_invocation: ($) =>
            seq(
                field('macro', $._macro_expansion),
                optional(
                    seq(
                        token.immediate(BLANK),
                        field('arguments', $.macro_argument_list)
                    )
                )
            ),

        macro_argument_list: ($) =>
            sep1(
                choice($.integer, $.float, $.single_word, $.quoted_string),
                BLANK
            ),

        //
        // builtin: %{builtin: ...}
        //
        // ternary: %{?<identifier>}
        // ternary: %{?<identifier>:<builtin> ...}
        // ternary: %{!?<identifier>:<builtin> ...}
        //
        macro_ternary: ($) =>
            seq(
                '%{',
                optional(alias('!', $.not_operator)),
                alias('?', $.defined_operator),
                field('condition', $.identifier),
                optional(field('consequence', seq(':', $.macro_invocation))),
                '}'
            ),

        // TODO: macro_shell_expansion needs to be implemented in an
        // external scanner.
        // Inside the $(...) are also () allowed, so you need to count them to
        // detect the last one.
        // %(...)
        macro_shell_expansion: ($) =>
            choice(
                seq('%(', ')'),
                seq(
                    '%(',
                    repeat1(
                        choice(
                            prec(1, $.macro_expansion),
                            $.quoted_string,
                            $.string
                        )
                    ),
                    ')'
                )
            ),
    },
});

/**
 * Creates a rule to match one or more occurrences of `rule` separated by `sep`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @return {SeqRule}
 *
 */
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
