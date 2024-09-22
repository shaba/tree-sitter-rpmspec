(identifier) @variable

[
  "define"
  "global"
] @keyword.directive.define

[
  "P"
  "S"
  "basename"
  "dirname"
  "dnl"
  "dump"
  "echo"
  "error"
  "exists"
  "expand"
  "expr"
  "getdirconf"
  "getenv"
  "getncpus"
  "gsub"
  "len"
  "load"
  "lower"
  "lua"
  "macrobody"
  "quote"
  "rep"
  "reverse"
  "rpmversion"
  "shrink"
  "sub"
  "suffix"
  "trace"
  "u2p"
  "shescape"
  "uncompress"
  "undefine"
  "upper"
  "url2path"
  "verbose"
  "warn"
] @function.builtin

(macro_invocation
  "%" @punctuation.special
) @none

(macro_invocation
  macro: (identifier) @function.macro)

(macro_invocation
  macro: (macro_builtin) @function.builtin)

(macro_expansion
  "%" @punctuation.special
  "{" @punctuation.special
  "}" @punctuation.special) @none

(macro_expansion
  "%" @punctuation.special) @none

(macro_ternary
  "%{" @punctuation.special
  (not_operator) @operator
  (defined_operator) @operator
  ":" @operator
  "}" @punctuation.special)

[
  (tag)
  (dependency_tag)
] @type.definition

(integer) @number
(float) @number.float
(version) @number.float

(comment) @comment
(string) @string

(description
  (section_name) @type.definition)
(package
  (section_name) @type.definition)
(files
  (section_name) @type.definition)
(changelog
  (section_name) @type.definition)

(prep_scriptlet
  (section_name) @function.builtin)
(generate_buildrequires
  (section_name) @function.builtin)
(conf_scriptlet
  (section_name) @function.builtin)
(build_scriptlet
  (section_name) @function.builtin)
(install_scriptlet
  (section_name) @function.builtin)
(check_scriptlet
  (section_name) @function.builtin)
(clean_scriptlet
  (section_name) @function.builtin)

[
  "%artifact"
  "%attr"
  "%config"
  "%dir"
  "%doc"
  "%docdir"
  "%ghost"
  "%license"
  "%missingok"
  "%readme"
] @keyword.type

[
  "!="
  "<"
  "<="
  "=="
  ">"
  ">="
  "&&"
  "||"
  "with"
  "without"
  "defined"
  "undefined"
] @operator

[
  "%if"
  "%ifarch"
  "%ifos"
  "%ifnarch"
  "%ifnos"
  "%elif"
  "%elifarch"
  "%elifos"
  "%else"
  "%endif"
] @keyword.conditional
