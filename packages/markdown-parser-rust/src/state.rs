// packages/markdown-parser-rust/src/state.rs
use std::collections::HashMap;

/// Holds normalized lines and the current block-parser position.
#[derive(Clone, Debug)]
pub struct BlockState {
    /// Normalized source lines.
    pub lines: Vec<String>,
    /// Current zero-based line index.
    pub line_index: usize,
}

impl BlockState {
    /// Normalizes line endings and converts a leading tab to four spaces.
    pub fn new(content: &str) -> Self {
        let normalized = content.replace("\r\n", "\n").replace('\r', "\n");
        let lines = normalized.split('\n').map(normalize_leading_tab).collect();
        Self {
            lines,
            line_index: 0,
        }
    }

    /// Returns the current line, if the cursor has not reached the end.
    pub fn current_line(&self) -> Option<&str> {
        self.lines.get(self.line_index).map(String::as_str)
    }

    /// Returns the unconsumed lines as owned strings.
    pub fn remaining_lines(&self) -> Vec<String> {
        self.lines[self.line_index..].to_vec()
    }

    /// Advances the block cursor by a validated number of lines.
    pub fn advance(&mut self, count: usize) {
        self.line_index = self.line_index.saturating_add(count);
    }
}

/// Replaces the leading whitespace through its last tab with four spaces.
fn normalize_leading_tab(line: &str) -> String {
    let leading_end = line
        .char_indices()
        .take_while(|(_, character)| *character == ' ' || *character == '\t')
        .map(|(index, character)| index + character.len_utf8())
        .last()
        .unwrap_or(0);
    let leading = &line[..leading_end];

    if let Some(tab_index) = leading.rfind('\t') {
        format!("    {}", &line[tab_index + 1..])
    } else {
        line.to_owned()
    }
}

/// Holds inline source and a byte-position cursor.
#[derive(Clone, Debug)]
pub struct InlineState {
    /// Inline source text.
    pub content: String,
    /// Current UTF-8 byte offset.
    pub pos: usize,
    token_positions: HashMap<String, Vec<usize>>,
}

impl InlineState {
    /// Creates an inline state from source text.
    pub fn new(content: impl Into<String>) -> Self {
        let content = content.into();
        Self {
            content,
            pos: 0,
            token_positions: HashMap::new(),
        }
    }

    /// Returns the character at the current cursor.
    pub fn current_char(&self) -> Option<char> {
        self.content.get(self.pos..)?.chars().next()
    }

    /// Returns the next byte position at or after `from` for a token.
    pub fn find_next_token(&mut self, token: &str, from: usize) -> Option<usize> {
        assert!(!token.is_empty(), "token must not be empty");
        let positions = self
            .token_positions
            .entry(token.to_owned())
            .or_insert_with(|| {
                let mut positions = Vec::new();
                let mut search_from = 0;
                while let Some(relative) = self.content[search_from..].find(token) {
                    let position = search_from + relative;
                    positions.push(position);
                    search_from =
                        position + token.chars().next().expect("token is not empty").len_utf8();
                }
                positions
            });
        positions.binary_search(&from).map_or_else(
            |index| positions.get(index).copied(),
            |index| positions.get(index).copied(),
        )
    }

    /// Advances by a byte count that must end on a UTF-8 boundary.
    pub fn advance(&mut self, count: usize) {
        self.pos = self.pos.saturating_add(count);
    }
}
