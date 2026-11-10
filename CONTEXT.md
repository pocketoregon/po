# PATCHBAY AI INSTRUCTIONS

You and I are using a tool called Patchbay to edit code files without rewriting the entire file each time.

I will provide file content with line numbers prefixed like `12| <content>`. The `N|` prefix is only a line-number reference and is not part of the actual file.

When I request a code change, respond ONLY with a Patchbay DSL patch script. Do not provide a complete file, explanations, or Markdown code fences around the patch script.

## 1. FILE — Global Workspace Targeting

`FILE path/to/file` identifies the repository file that subsequent commands will modify.

Example:

FILE admin.html
REPLACE 25
[[[
const enabled = true;
]]]

Multiple files can be targeted in one script by repeating `FILE` blocks:

FILE admin.html
REPLACE 25
[[[
const enabled = true;
]]]

FILE assets/app.js
APPEND
[[[
// New code
]]]

Each FILE block applies only to its specified file.

## 2. REPLACE — Replace lines

`REPLACE <line>` replaces one line.

`REPLACE <start>-<end>` replaces a range of lines.

Follow with:

[[[
new content
]]]

## 3. INSERT_AFTER / INSERT_BEFORE

`INSERT_AFTER <line>` inserts content after a specified line.

`INSERT_BEFORE <line>` inserts content before a specified line.

Follow with:

[[[
new content
]]]

## 4. DELETE — Delete lines

`DELETE <line>` deletes one line.

`DELETE <start>-<end>` deletes a range of lines.

No content block is required.

## 5. FIND / REPLACE_WITH — Exact text replacement

Use this when line numbers are uncertain or the target is easier to identify by its exact content.

FIND
[[[
exact existing text
]]]
REPLACE_WITH
[[[
replacement text
]]]

## 6. PREPEND / APPEND

`PREPEND` inserts content at the beginning of the file.

`APPEND` inserts content at the end of the file.

Both require:

[[[
new content
]]]

## 7. GLOBAL WORKSPACE RULES

- Always use `FILE path/to/file` to identify the target file.
- A script can contain multiple FILE blocks.
- Each file must have its own commands.
- Never assume a file's content; use the supplied file content or available file-reading functionality.
- Never modify files that are not explicitly targeted.
- Use safe, repository-relative paths.
- Do not use absolute paths, `..`, backslashes, or `.github/` targets.
- Do not repeat the same file target in one script.
- Each FILE declaration starts a new target-file block.
- Commands following a FILE declaration apply to that file until another FILE declaration appears.
- Do not interpret FILE text inside a `[[[ ... ]]]` content block as a new target declaration.

## 8. FILE PARSING AND NORMALIZATION RULES

When interpreting Global Workspace scripts:

- Recognize `FILE path/to/file` as a file-target declaration.
- Ignore leading and trailing whitespace around FILE declarations.
- Normalize Windows line endings (`\r\n` and `\r`) to `\n`.
- Ignore invisible Unicode formatting characters, including zero-width characters, directional formatting characters, word joiners, and BOM.
- Accept optional Markdown code fences surrounding a patch script.
- Do not mistake FILE text inside content blocks for a new file declaration.
- Validate every target path before applying changes.
- Reject absolute paths, `..` traversal, backslashes, `.github` and `.github/` paths, and duplicate targets.
- Reject empty FILE blocks.
- Preserve original file content outside the requested patch operations.
- If a target cannot be identified unambiguously, stop and report the problem instead of guessing.

## 9. OPENED-FILE MODE RULES

When Patchbay is operating in Opened-file mode:

- The currently opened file is the only permitted target.
- Do not use FILE commands.
- Do not target or modify other files.
- Do not perform global file operations.
- Use only content-editing commands.
- Never silently switch from Opened-file mode to Global Workspace mode.

## 10. PATCH EXECUTION AND SAFETY

- Preview changes before applying them.
- Never claim a patch was successfully applied unless the tool confirms it.
- Use the original file content as the basis for every patch.
- Line numbers always refer to the original numbering supplied in my message.
- Never renumber lines after your own edits within the same script.
- Keep multiple line-based edits to non-overlapping ranges.
- Reject ambiguous FIND matches rather than replacing an arbitrary occurrence.
- If FIND text cannot be found, report the error instead of guessing.
- Reject invalid line numbers and missing replacement blocks.
- Preserve file encoding and line-ending conventions whenever possible.
- Do not silently overwrite changes made after a preview.
- Respect file-size and repository path restrictions.
- Do not claim support for file-management commands unless the actual Patchbay implementation provides them.

## 11. IMPORTANT OUTPUT RULES

- When I request a code change, output ONLY the Patchbay DSL patch script.
- Do not include explanations, introductions, summaries, or Markdown code fences around the script.
- Use only supported commands:
  `FILE`, `REPLACE`, `INSERT_AFTER`, `INSERT_BEFORE`, `DELETE`, `FIND`, `REPLACE_WITH`, `PREPEND`, and `APPEND`.
- Lines beginning with `#` are comments and ignored.
- Never restate the entire file.
- Prefer small, targeted patches.
- If an exact FIND snippet is not present, do not invent a replacement target.
- Keep multiple file changes separated into their own FILE blocks.
- Never modify unrelated code.