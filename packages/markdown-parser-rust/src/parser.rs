// packages/markdown-parser-rust/src/parser.rs
use std::cell::RefCell;
use std::collections::HashMap;

use crate::ast::{AstNode, NodeType};
use crate::linkify::{LinkMatch, linkify};
use crate::rules::{BlockRule, FfmBlockRule, InlineRule};
use crate::safety::is_safe_link_url;
use crate::state::{BlockState, InlineState};

const LINKIFY_CANDIDATE_MARKERS: &[char] = &['.'];
const PRELIGHT_BLOCK_RULES: &[&str] = &[
    "heading",
    "hr",
    "blockquote",
    "list",
    "code_block",
    "ffm_blocks",
];

/// A linkifier callback used by the parser's inline text projection.
pub type Linkifier = fn(&str) -> Vec<LinkMatch>;

/// Parser options matching the TypeScript parser constructor.
#[derive(Clone, Copy)]
pub struct ParserOptions {
    /// Maximum recursive block/inline parsing depth.
    pub max_nesting_depth: usize,
    /// Callback used to discover links in plain text.
    pub linkifier: Linkifier,
}

impl Default for ParserOptions {
    fn default() -> Self {
        Self {
            max_nesting_depth: 64,
            linkifier: linkify,
        }
    }
}

/// Errors returned when parser configuration is invalid.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ParserError {
    /// The configured maximum nesting depth is zero.
    InvalidMaxNestingDepth,
}

impl std::fmt::Display for ParserError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidMaxNestingDepth => {
                formatter.write_str("max_nesting_depth must be a positive integer")
            }
        }
    }
}

impl std::error::Error for ParserError {}

/// Recursive parser context passed to custom block and inline rules.
pub struct ParserContext<'a> {
    pub(crate) parser: &'a MarkdownParser,
    pub(crate) depth: usize,
    runtime: &'a RefCell<ParseRuntime>,
}

impl ParserContext<'_> {
    /// Recursively parses inline content using the current parser configuration.
    pub fn parse_inline(&self, content: &str) -> Vec<AstNode> {
        self.parser
            .parse_inline_inner(content, self.depth + 1, self.runtime)
    }

    /// Recursively parses block content using the current parser configuration.
    pub fn parse_blocks(&self, content: &str) -> Vec<AstNode> {
        self.parser
            .parse_blocks_inner(content, self.depth + 1, self.runtime)
    }

    /// Creates an ID with the probe suffix during paragraph preflight.
    pub fn create_id(&self, prefix: &str) -> String {
        if self.runtime.borrow().is_preflight {
            format!("{prefix}-probe")
        } else {
            let mut runtime = self.runtime.borrow_mut();
            let sequence = runtime.id_sequence;
            runtime.id_sequence += 1;
            format!("{prefix}-{sequence}")
        }
    }
}

/// State isolated to one parser invocation.
#[derive(Default)]
struct ParseRuntime {
    id_sequence: usize,
    is_preflight: bool,
}

/// A lightweight, extensible Markdown and FFM parser.
pub struct MarkdownParser {
    block_rules: Vec<Box<dyn BlockRule>>,
    inline_rules: Vec<Box<dyn InlineRule>>,
    block_rule_map: HashMap<char, Vec<usize>>,
    inline_rule_map: HashMap<char, Vec<usize>>,
    max_nesting_depth: usize,
    linkifier: Linkifier,
}

impl MarkdownParser {
    /// Creates a parser and fails fast if its options are invalid.
    pub fn new(options: ParserOptions) -> Self {
        Self::try_new(options).expect("invalid MarkdownParser options")
    }

    /// Creates a parser without panicking on invalid configuration.
    pub fn try_new(options: ParserOptions) -> Result<Self, ParserError> {
        if options.max_nesting_depth == 0 {
            return Err(ParserError::InvalidMaxNestingDepth);
        }
        Ok(Self {
            block_rules: Vec::new(),
            inline_rules: Vec::new(),
            block_rule_map: HashMap::new(),
            inline_rule_map: HashMap::new(),
            max_nesting_depth: options.max_nesting_depth,
            linkifier: options.linkifier,
        })
    }

    /// Registers a block rule and appends it to the matching marker lists.
    pub fn add_block_rule<R>(&mut self, rule: R) -> &mut Self
    where
        R: BlockRule + 'static,
    {
        let rule_index = self.block_rules.len();
        let markers = rule.markers();
        self.block_rules.push(Box::new(rule));
        for marker in markers {
            self.block_rule_map
                .entry(*marker)
                .or_default()
                .push(rule_index);
        }
        self
    }

    /// Registers an inline rule at the front of each matching marker list.
    pub fn add_inline_rule<R>(&mut self, rule: R) -> &mut Self
    where
        R: InlineRule + 'static,
    {
        let rule_index = self.inline_rules.len();
        let markers = rule.markers();
        self.inline_rules.push(Box::new(rule));
        for marker in markers {
            self.inline_rule_map
                .entry(*marker)
                .or_default()
                .insert(0, rule_index);
        }
        self
    }

    /// Installs a plugin that can register rules or otherwise configure the parser.
    pub fn use_plugin(&mut self, plugin: fn(&mut MarkdownParser)) -> &mut Self {
        plugin(self);
        self
    }

    /// Parses a complete document and resets generated FFM IDs for this invocation.
    pub fn parse(&self, content: &str) -> Vec<AstNode> {
        let runtime = RefCell::new(ParseRuntime::default());
        self.parse_blocks_inner(content, 0, &runtime)
    }

    /// Parses the input with the standard rule set.
    pub fn create_standard(options: ParserOptions) -> Self {
        let mut parser = Self::new(options);
        parser.add_block_rule(crate::rules::CodeBlockRule);
        parser.add_block_rule(crate::rules::ListRule);
        parser.add_block_rule(crate::rules::HeadingRule);
        parser.add_block_rule(crate::rules::TableRule);
        parser.add_block_rule(crate::rules::HrRule);
        parser.add_block_rule(crate::rules::BlockquoteRule);
        parser.add_inline_rule(crate::rules::HardBreakRule);
        parser.add_inline_rule(crate::rules::InlineCodeRule);
        parser.add_inline_rule(crate::rules::LinkRule);
        parser.add_inline_rule(crate::rules::BoldRule);
        parser.add_inline_rule(crate::rules::UnderlineRule);
        parser.add_inline_rule(crate::rules::ItalicRule);
        parser.add_inline_rule(crate::rules::StrikeRule);
        parser
    }

    /// Parses the input with the standard rule set plus FFM fenced blocks.
    pub fn create_ffm(options: ParserOptions) -> Self {
        let mut parser = Self::new(options);
        parser.add_block_rule(FfmBlockRule);
        parser.add_block_rule(crate::rules::CodeBlockRule);
        parser.add_block_rule(crate::rules::ListRule);
        parser.add_block_rule(crate::rules::HeadingRule);
        parser.add_block_rule(crate::rules::TableRule);
        parser.add_block_rule(crate::rules::HrRule);
        parser.add_block_rule(crate::rules::BlockquoteRule);
        parser.add_inline_rule(crate::rules::HardBreakRule);
        parser.add_inline_rule(crate::rules::InlineCodeRule);
        parser.add_inline_rule(crate::rules::LinkRule);
        parser.add_inline_rule(crate::rules::BoldRule);
        parser.add_inline_rule(crate::rules::UnderlineRule);
        parser.add_inline_rule(crate::rules::ItalicRule);
        parser.add_inline_rule(crate::rules::StrikeRule);
        parser
    }

    /// Parses block content at a specific recursion depth.
    fn parse_blocks_inner(
        &self,
        content: &str,
        depth: usize,
        runtime: &RefCell<ParseRuntime>,
    ) -> Vec<AstNode> {
        let mut state = BlockState::new(content);
        self.parse_blocks_state(&mut state, depth, runtime)
    }

    /// Runs block rules and merges unmatched consecutive lines into paragraphs.
    fn parse_blocks_state(
        &self,
        state: &mut BlockState,
        depth: usize,
        runtime: &RefCell<ParseRuntime>,
    ) -> Vec<AstNode> {
        if depth > self.max_nesting_depth {
            return vec![AstNode::with_children(
                NodeType::Paragraph,
                vec![AstNode::text(state.remaining_lines().join("\n"))],
            )];
        }

        let context = ParserContext {
            parser: self,
            depth,
            runtime,
        };
        let mut nodes = Vec::new();
        while state.line_index < state.lines.len() {
            let Some(line) = state.current_line() else {
                break;
            };
            if line.is_empty() || line.trim().is_empty() {
                state.advance(1);
                continue;
            }

            let first_char = line.trim_start().chars().next();
            let mut matched = false;
            if let Some(first_char) = first_char
                && let Some(rule_indices) = self.block_rule_map.get(&first_char)
            {
                for rule_index in rule_indices {
                    if let Some(result) = self.block_rules[*rule_index].parse(state, &context) {
                        nodes.push(result.node);
                        state.advance(result.consumed_lines);
                        matched = true;
                        break;
                    }
                }
            }

            if matched {
                continue;
            }

            let mut paragraph_lines = Vec::new();
            while state.line_index < state.lines.len() {
                let Some(current_line) = state.current_line() else {
                    break;
                };
                if current_line.is_empty() || current_line.trim().is_empty() {
                    break;
                }
                let first = current_line.trim_start().chars().next();
                let may_interrupt = first.is_some_and(|character| {
                    matches!(
                        character,
                        '#' | '*' | '_' | '+' | '-' | '0'..='9' | '>' | '`' | '~'
                    )
                });
                if may_interrupt {
                    let mut is_interrupted = false;
                    if let Some(first) = first
                        && let Some(rule_indices) = self.block_rule_map.get(&first)
                    {
                        for rule_index in rule_indices {
                            let rule = &self.block_rules[*rule_index];
                            if PRELIGHT_BLOCK_RULES.contains(&rule.name()) {
                                runtime.borrow_mut().is_preflight = true;
                                let result = rule.parse(state, &context).is_some();
                                runtime.borrow_mut().is_preflight = false;
                                if result {
                                    is_interrupted = true;
                                    break;
                                }
                            }
                        }
                    }
                    if is_interrupted && !paragraph_lines.is_empty() {
                        break;
                    }
                }
                paragraph_lines.push(current_line.to_owned());
                state.advance(1);
            }

            if !paragraph_lines.is_empty() {
                let inline_content = paragraph_lines.join("\n");
                nodes.push(AstNode::with_children(
                    NodeType::Paragraph,
                    self.parse_inline_inner(&inline_content, depth, runtime),
                ));
            }
        }
        nodes
    }

    /// Parses inline content at a specific recursion depth.
    fn parse_inline_inner(
        &self,
        content: &str,
        depth: usize,
        runtime: &RefCell<ParseRuntime>,
    ) -> Vec<AstNode> {
        let mut state = InlineState::new(content);
        self.parse_inline_state(&mut state, depth, runtime)
    }

    /// Runs marker-selected inline rules and linkifies the remaining text.
    fn parse_inline_state(
        &self,
        state: &mut InlineState,
        depth: usize,
        runtime: &RefCell<ParseRuntime>,
    ) -> Vec<AstNode> {
        if depth > self.max_nesting_depth {
            return vec![AstNode::text(&state.content[state.pos..])];
        }

        let context = ParserContext {
            parser: self,
            depth,
            runtime,
        };
        let mut nodes = Vec::new();
        let mut text_start = state.pos;
        while state.pos < state.content.len() {
            let Some(character) = state.current_char() else {
                break;
            };
            if let Some(rule_indices) = self.inline_rule_map.get(&character).cloned() {
                let mut matched = false;
                for rule_index in rule_indices {
                    if let Some(result) = self.inline_rules[rule_index].parse(state, &context) {
                        self.flush_text(
                            &mut nodes,
                            &state.content[text_start..state.pos],
                            text_start,
                        );
                        nodes.push(result.node);
                        state.advance(result.consumed_bytes);
                        text_start = state.pos;
                        matched = true;
                        break;
                    }
                }
                if matched {
                    continue;
                }
            }

            if character == '\n' {
                self.flush_text(
                    &mut nodes,
                    &state.content[text_start..state.pos],
                    text_start,
                );
                nodes.push(AstNode::new(NodeType::Hardbreak));
                state.advance(1);
                text_start = state.pos;
                continue;
            }
            state.advance(character.len_utf8());
        }
        self.flush_text(&mut nodes, &state.content[text_start..], text_start);
        nodes
    }

    /// Converts a plain-text range into safe links and text nodes.
    fn flush_text(&self, nodes: &mut Vec<AstNode>, text: &str, _offset: usize) {
        if text.is_empty() || !has_linkify_candidate(text) {
            if !text.is_empty() {
                nodes.push(AstNode::text(text));
            }
            return;
        }

        let mut last_index = 0;
        for matched in (self.linkifier)(text) {
            if !is_safe_link_url(&matched.url) {
                continue;
            }
            if matched.index > last_index {
                nodes.push(AstNode::text(&text[last_index..matched.index]));
            }
            let mut link = AstNode::new(NodeType::Link);
            link.url = Some(matched.url);
            link.children = vec![AstNode::text(matched.text)];
            nodes.push(link);
            last_index = matched.last_index;
        }
        if last_index < text.len() {
            nodes.push(AstNode::text(&text[last_index..]));
        }
    }
}

/// Avoids the linkifier call for text that cannot contain an URL candidate.
fn has_linkify_candidate(text: &str) -> bool {
    text.contains("://")
        || text
            .chars()
            .any(|character| LINKIFY_CANDIDATE_MARKERS.contains(&character))
}
