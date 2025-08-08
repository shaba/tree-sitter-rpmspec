# Load the parser in Neovim

## Prepare the directory

```bash
mkdir parser
ln -s ../build/libtree-sitter-rpmspec.so parser/rpmspec.so
ln -s . queries/rpmspec
```

## Load it in Neovim

```lua
vim.opt.runtimepath:prepend('/path/to/tree-sitter-rpmspec')
lua vim.treesitter.start(0, 'rpmspec')
```

## Auto command to add it for filetype

This will load rpmspec automatically for the spec filetype and allow you to use
`:InspectTree`

```lua
vim.opt.runtimepath:prepend('/path/to/tree-sitter-rpmspec')

local augroup = vim.api.nvim_create_augroup('rpmspec', {})

vim.api.nvim_create_autocmd('FileType', {
    group = augroup,
    pattern = 'spec',
    callback = function()
        vim.treesitter.language.register('rpmspec', 'spec')
    end,
})
```
