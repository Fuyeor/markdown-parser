// packages/markdown-parser-rust/src/rules.rs
use crate::ast::{Alignment, AstNode, NodeType};
use crate::parser::ParserContext;
use crate::safety::{is_safe_color_value, is_safe_link_url};
use crate::state::{BlockState, InlineState};

/// Result returned by a successful block rule.
pub struct BlockMatch {
    pub node: AstNode,
    pub consumed_lines: usize,
}

/// Result returned by a successful inline rule.
pub struct InlineMatch {
    pub node: AstNode,
    pub consumed_bytes: usize,
}

/// Extensible block-rule interface matching the TypeScript parser contract.
pub trait BlockRule {
    fn name(&self) -> &'static str;
    fn markers(&self) -> &'static [char];
    fn parse(&self, state: &BlockState, ctx: &ParserContext<'_>) -> Option<BlockMatch>;
}

/// Extensible inline-rule interface matching the TypeScript parser contract.
pub trait InlineRule {
    fn name(&self) -> &'static str;
    fn markers(&self) -> &'static [char];
    fn parse(&self, state: &mut InlineState, ctx: &ParserContext<'_>) -> Option<InlineMatch>;
}

/// Represents the content of a fenced code block.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FencedBlock {
    pub lang: String,
    pub content: String,
    pub consumed_lines: usize,
}

/// Extracts a fenced block using the same opening and closing rules as TypeScript.
pub fn extract_fenced_block(state: &BlockState) -> Option<FencedBlock> {
    let line = state.current_line()?;
    let (indent, fence, info) = parse_fence_opening(line)?;
    let mut consumed_lines = 1;
    let mut content_lines = Vec::new();

    while state.line_index + consumed_lines < state.lines.len() {
        let next_line = &state.lines[state.line_index + consumed_lines];
        consumed_lines += 1;
        if let Some((_, close_fence)) = parse_fence_closing(next_line)
            && close_fence.as_bytes().first() == fence.as_bytes().first()
            && close_fence.len() >= fence.len()
        {
            break;
        }

        if next_line.len() >= indent && next_line[..indent].chars().all(|c| c == ' ') {
            content_lines.push(next_line[indent..].to_owned());
        } else {
            content_lines.push(next_line.clone());
        }
    }

    Some(FencedBlock {
        lang: info.trim().to_owned(),
        content: content_lines.join("\n"),
        consumed_lines,
    })
}

/// Parses a fenced-block opening line with zero to three leading spaces.
fn parse_fence_opening(line: &str) -> Option<(usize, String, &str)> {
    let indent = line.chars().take_while(|c| *c == ' ').count();
    if indent > 3 {
        return None;
    }
    let rest = &line[indent..];
    let marker = rest.chars().next()?;
    if marker != '`' && marker != '~' {
        return None;
    }
    let fence_len = rest.chars().take_while(|c| *c == marker).count();
    if fence_len < 3 {
        return None;
    }
    let info = &rest[marker.len_utf8() * fence_len..];
    if info.contains('`') {
        return None;
    }
    Some((
        indent,
        rest[..marker.len_utf8() * fence_len].to_owned(),
        info,
    ))
}

/// Parses a fence closing line and accepts only spaces after the marker.
fn parse_fence_closing(line: &str) -> Option<(usize, String)> {
    let indent = line.chars().take_while(|c| *c == ' ').count();
    if indent > 3 {
        return None;
    }
    let rest = &line[indent..];
    let marker = rest.chars().next()?;
    if marker != '`' && marker != '~' {
        return None;
    }
    let length = rest.chars().take_while(|c| *c == marker).count();
    if length < 3
        || !rest[marker.len_utf8() * length..]
            .chars()
            .all(char::is_whitespace)
    {
        return None;
    }
    Some((indent, rest[..marker.len_utf8() * length].to_owned()))
}

/// Parses ATX headings.
pub struct HeadingRule;

impl BlockRule for HeadingRule {
    fn name(&self) -> &'static str {
        "heading"
    }

    fn markers(&self) -> &'static [char] {
        &['#']
    }

    fn parse(&self, state: &BlockState, ctx: &ParserContext<'_>) -> Option<BlockMatch> {
        let line = state.current_line()?;
        let indent = line.chars().take_while(|c| *c == ' ').count();
        if indent > 3 {
            return None;
        }
        let rest = &line[indent..];
        let level = rest.chars().take_while(|c| *c == '#').count();
        if !(1..=6).contains(&level) {
            return None;
        }
        let after = &rest[level..];
        if !after.is_empty() && !after.starts_with(char::is_whitespace) {
            return None;
        }
        let mut text = after.trim().to_owned();
        if let Some(hash_start) = text.rfind(char::is_whitespace)
            && text[hash_start..].trim().chars().all(|c| c == '#')
        {
            text.truncate(hash_start);
            text = text.trim_end().to_owned();
        } else if text.chars().all(|c| c == '#') {
            text.clear();
        }

        let mut node = AstNode::new(NodeType::Heading);
        node.level = Some(level as u8);
        node.children = if text.is_empty() {
            Vec::new()
        } else {
            ctx.parse_inline(&text)
        };
        Some(BlockMatch {
            node,
            consumed_lines: 1,
        })
    }
}

/// Parses fenced code blocks.
pub struct CodeBlockRule;

impl BlockRule for CodeBlockRule {
    fn name(&self) -> &'static str {
        "code_block"
    }

    fn markers(&self) -> &'static [char] {
        &['`', '~']
    }

    fn parse(&self, state: &BlockState, _ctx: &ParserContext<'_>) -> Option<BlockMatch> {
        let block = extract_fenced_block(state)?;
        let mut node = AstNode::new(NodeType::CodeBlock);
        node.lang = Some(block.lang);
        node.content = Some(block.content);
        Some(BlockMatch {
            node,
            consumed_lines: block.consumed_lines,
        })
    }
}

const TABLE_CELL_PATTERN: fn(&str) -> bool = |cell| {
    let trimmed = cell.trim();
    let value = trimmed
        .strip_prefix(':')
        .unwrap_or(trimmed)
        .strip_suffix(':')
        .unwrap_or(trimmed.strip_prefix(':').unwrap_or(trimmed));
    !value.is_empty() && value.chars().all(|c| c == '-')
};

/// Splits table rows while treating escaped pipes as cell content.
fn extract_table_cells(row: &str) -> Vec<String> {
    if !row.contains('\\') {
        let mut cells = row
            .split('|')
            .map(str::trim)
            .map(str::to_owned)
            .collect::<Vec<_>>();
        if cells.first().is_some_and(|cell| cell.is_empty()) {
            cells.remove(0);
        }
        if cells.last().is_some_and(|cell| cell.is_empty()) {
            cells.pop();
        }
        return cells;
    }

    let mut cells = Vec::new();
    let mut cell = String::new();
    let mut escaped = false;
    for character in row.chars() {
        if escaped {
            if character == '|' || character == '\\' {
                cell.push(character);
            } else {
                cell.push('\\');
                cell.push(character);
            }
            escaped = false;
        } else if character == '\\' {
            escaped = true;
        } else if character == '|' {
            cells.push(std::mem::take(&mut cell));
        } else {
            cell.push(character);
        }
    }
    if escaped {
        cell.push('\\');
    }
    cells.push(cell);
    if cells
        .first()
        .is_some_and(|value: &String| value.trim().is_empty())
    {
        cells.remove(0);
    }
    if cells
        .last()
        .is_some_and(|value: &String| value.trim().is_empty())
    {
        cells.pop();
    }
    cells
        .into_iter()
        .map(|value| value.trim().to_owned())
        .collect()
}

/// Converts separator cells into table alignment metadata.
fn parse_table_alignments(line: &str) -> Option<Vec<Option<Alignment>>> {
    let cells = extract_table_cells(line);
    if cells.is_empty() || cells.iter().any(|cell| !TABLE_CELL_PATTERN(cell)) {
        return None;
    }
    Some(
        cells
            .into_iter()
            .map(|cell| {
                let starts = cell.starts_with(':');
                let ends = cell.ends_with(':');
                match (starts, ends) {
                    (true, true) => Some(Alignment::Center),
                    (true, false) => Some(Alignment::Left),
                    (false, true) => Some(Alignment::Right),
                    (false, false) => None,
                }
            })
            .collect(),
    )
}

/// Pads or truncates a row to the separator-defined column count.
fn normalize_table_cells(mut cells: Vec<String>, column_count: usize) -> Vec<String> {
    cells.truncate(column_count);
    cells.resize(column_count, String::new());
    cells
}

/// Creates a table cell without allocating a default alignment.
fn create_table_cell(
    content: &str,
    alignment: Option<Alignment>,
    ctx: &ParserContext<'_>,
) -> AstNode {
    let mut node = AstNode::with_children(NodeType::TableCell, ctx.parse_inline(content));
    node.align = alignment;
    node
}

/// Parses pipe tables.
pub struct TableRule;

impl BlockRule for TableRule {
    fn name(&self) -> &'static str {
        "table"
    }

    fn markers(&self) -> &'static [char] {
        &['|']
    }

    fn parse(&self, state: &BlockState, ctx: &ParserContext<'_>) -> Option<BlockMatch> {
        let line = state.current_line()?;
        if !line.contains('|') {
            return None;
        }

        let mut alignments = parse_table_alignments(line);
        let mut header_cells = None;
        let mut consumed_lines = if alignments.is_some() { 1 } else { 0 };
        if alignments.is_none() {
            let next = state.lines.get(state.line_index + 1)?;
            alignments = parse_table_alignments(next);
            let parsed_headers = extract_table_cells(line);
            if alignments.as_ref()?.len() != parsed_headers.len() {
                return None;
            }
            header_cells = Some(parsed_headers);
            consumed_lines = 2;
        }

        let alignments = alignments?;
        let column_count = alignments.len();
        let headers = header_cells.map(|cells| normalize_table_cells(cells, column_count));
        let mut rows = Vec::new();
        while let Some(row_line) = state.lines.get(state.line_index + consumed_lines)
            && row_line.contains('|')
        {
            let cells = normalize_table_cells(extract_table_cells(row_line), column_count);
            let row_children = cells
                .iter()
                .enumerate()
                .map(|(index, cell)| create_table_cell(cell, alignments[index], ctx))
                .collect();
            rows.push(AstNode::with_children(NodeType::TableRow, row_children));
            consumed_lines += 1;
        }

        let mut node = AstNode::with_children(NodeType::Table, rows);
        node.headers = headers.map(|cells| {
            cells
                .iter()
                .enumerate()
                .map(|(index, cell)| create_table_cell(cell, alignments[index], ctx))
                .collect()
        });
        Some(BlockMatch {
            node,
            consumed_lines,
        })
    }
}

/// Parses thematic breaks.
pub struct HrRule;

impl BlockRule for HrRule {
    fn name(&self) -> &'static str {
        "hr"
    }

    fn markers(&self) -> &'static [char] {
        &['-', '*', '_']
    }

    fn parse(&self, state: &BlockState, _ctx: &ParserContext<'_>) -> Option<BlockMatch> {
        let line = state.current_line()?;
        if state.line_index > 0 && !state.lines[state.line_index - 1].trim().is_empty() {
            return None;
        }
        let symbols = line
            .chars()
            .filter(|c| matches!(c, '-' | '*' | '_'))
            .count();
        if symbols < 3
            || line
                .chars()
                .any(|c| !matches!(c, '-' | '*' | '_' | ' ' | '\t'))
        {
            return None;
        }
        Some(BlockMatch {
            node: AstNode::new(NodeType::Hr),
            consumed_lines: 1,
        })
    }
}

/// Parses blockquotes and lazy continuation lines.
pub struct BlockquoteRule;

impl BlockRule for BlockquoteRule {
    fn name(&self) -> &'static str {
        "blockquote"
    }

    fn markers(&self) -> &'static [char] {
        &['>']
    }

    fn parse(&self, state: &BlockState, ctx: &ParserContext<'_>) -> Option<BlockMatch> {
        let first = state.current_line()?;
        if !first.trim_start().starts_with('>') {
            return None;
        }
        let mut content_lines = Vec::new();
        let mut consumed_lines = 0;
        while let Some(line) = state.lines.get(state.line_index + consumed_lines) {
            if let Some(content) = line.trim_start().strip_prefix('>') {
                content_lines.push(content.strip_prefix(' ').unwrap_or(content).to_owned());
            } else if !line.trim().is_empty() && !content_lines.is_empty() {
                content_lines.push(line.trim_start().to_owned());
            } else {
                break;
            }
            consumed_lines += 1;
        }
        let mut node = AstNode::new(NodeType::Blockquote);
        node.children = ctx.parse_blocks(&content_lines.join("\n"));
        Some(BlockMatch {
            node,
            consumed_lines,
        })
    }
}

const LIST_MARKERS: &[char] = &['-', '*', '+', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/// Parses a list-item prefix and returns indentation, marker and content.
fn parse_list_item(line: &str) -> Option<(usize, String, String)> {
    let indent = line.chars().take_while(|c| c.is_whitespace()).count();
    let rest = &line[indent..];
    let first = rest.chars().next()?;
    let marker_len = if matches!(first, '-' | '*' | '+') {
        1
    } else if first.is_ascii_digit() {
        let digits = rest.chars().take_while(|c| c.is_ascii_digit()).count();
        if !(1..=9).contains(&digits)
            || !matches!(rest[digits..].chars().next(), Some('.') | Some(')'))
        {
            return None;
        }
        digits + 1
    } else {
        return None;
    };
    let after_marker = &rest[marker_len..];
    let whitespace = after_marker
        .chars()
        .take_while(|c| c.is_whitespace())
        .count();
    if whitespace == 0 {
        return None;
    }
    let content = after_marker[whitespace..].to_owned();
    Some((indent, rest[..marker_len].to_owned(), content))
}

/// Parses unordered and ordered lists with two-space nesting steps.
pub struct ListRule;

impl BlockRule for ListRule {
    fn name(&self) -> &'static str {
        "list"
    }

    fn markers(&self) -> &'static [char] {
        LIST_MARKERS
    }

    fn parse(&self, state: &BlockState, ctx: &ParserContext<'_>) -> Option<BlockMatch> {
        let first_line = state.current_line()?;
        let (base_indent, marker, _) = parse_list_item(first_line)?;
        let ordered = marker.chars().next()?.is_ascii_digit();
        let start_number = ordered.then(|| {
            marker[..marker.len() - 1]
                .parse::<u64>()
                .expect("validated list number")
        });
        let mut items = Vec::new();
        let mut consumed_lines = 0;

        while let Some(current_line) = state.lines.get(state.line_index + consumed_lines) {
            let Some((item_indent, item_marker, item_content)) = parse_list_item(current_line)
            else {
                break;
            };
            if item_indent != base_indent {
                break;
            }
            let mut item_lines = vec![item_content];
            let mut item_consumed_lines = 1;
            let marker_total_width = base_indent + marker.len() + 1;
            let nested_list_indent = base_indent + 2;

            while let Some(next_line) = state
                .lines
                .get(state.line_index + consumed_lines + item_consumed_lines)
            {
                if next_line.trim().is_empty() {
                    item_lines.push(String::new());
                    item_consumed_lines += 1;
                    continue;
                }
                let next_indent = next_line.chars().take_while(|c| c.is_whitespace()).count();
                let first_content_char = next_line[next_indent..].chars().next();
                let is_list_marker_candidate =
                    first_content_char.is_some_and(|c| matches!(c, '-' | '*' | '+' | '0'..='9'));
                let mut normalized_content_start = marker_total_width;
                if next_indent >= nested_list_indent && is_list_marker_candidate {
                    let relative_indent = next_indent - base_indent;
                    let nesting_level = relative_indent / 2;
                    let content_indent = nesting_level.saturating_sub(1) * 2;
                    normalized_content_start = next_indent - content_indent;
                }

                if normalized_content_start != marker_total_width
                    && parse_list_item(next_line).is_some()
                {
                    item_lines.push(next_line[normalized_content_start..].to_owned());
                    item_consumed_lines += 1;
                } else if next_indent >= marker_total_width {
                    item_lines.push(next_line[marker_total_width..].to_owned());
                    item_consumed_lines += 1;
                } else if next_indent > base_indent
                    && !next_line.trim_start().starts_with(['-', '*', '+'])
                    && !next_line
                        .trim_start()
                        .chars()
                        .next()
                        .is_some_and(|c| c.is_ascii_digit())
                {
                    item_lines.push(next_line.trim_start().to_owned());
                    item_consumed_lines += 1;
                } else {
                    break;
                }
            }

            let mut item = AstNode::new(NodeType::ListItem);
            item.children = ctx.parse_blocks(&item_lines.join("\n"));
            items.push(item);
            consumed_lines += item_consumed_lines;
            let _ = item_marker;
        }

        let mut node = AstNode::with_children(NodeType::List, items);
        node.ordered = Some(ordered);
        node.start = start_number;
        Some(BlockMatch {
            node,
            consumed_lines,
        })
    }
}

/// Parses FFM inline line breaks.
pub struct HardBreakRule;

impl InlineRule for HardBreakRule {
    fn name(&self) -> &'static str {
        "hardbreak"
    }

    fn markers(&self) -> &'static [char] {
        &['\\', ' ']
    }

    fn parse(&self, state: &mut InlineState, _ctx: &ParserContext<'_>) -> Option<InlineMatch> {
        if state.current_char() == Some('\\') && state.content[state.pos + 1..].starts_with('\n') {
            Some(InlineMatch {
                node: AstNode::new(NodeType::Hardbreak),
                consumed_bytes: 2,
            })
        } else {
            None
        }
    }
}

/// Parses variable-length inline code fences.
pub struct InlineCodeRule;

impl InlineRule for InlineCodeRule {
    fn name(&self) -> &'static str {
        "inline_code"
    }

    fn markers(&self) -> &'static [char] {
        &['`']
    }

    fn parse(&self, state: &mut InlineState, _ctx: &ParserContext<'_>) -> Option<InlineMatch> {
        if state.current_char() != Some('`') {
            return None;
        }
        let marker_len = state.content[state.pos..]
            .chars()
            .take_while(|c| *c == '`')
            .count();
        let marker = "`".repeat(marker_len);
        let mut current_pos = state.pos + marker_len;
        let mut end = None;
        while current_pos < state.content.len() {
            let Some(found) = state.find_next_token(&marker, current_pos) else {
                break;
            };
            if state.content[found + marker_len..].starts_with('`') {
                let mut skip = found + marker_len;
                while state.content[skip..].starts_with('`') {
                    skip += 1;
                }
                current_pos = skip;
            } else {
                end = Some(found);
                break;
            }
        }
        let Some(end) = end else {
            return Some(InlineMatch {
                node: AstNode::text(marker),
                consumed_bytes: marker_len,
            });
        };

        let mut raw = state.content[state.pos + marker_len..end].to_owned();
        if raw.starts_with(' ') && raw.ends_with(' ') && !raw.trim().is_empty() {
            raw = raw[1..raw.len() - 1].to_owned();
        }
        let node_type = if is_safe_color_value(&raw) {
            NodeType::ColorCode
        } else {
            NodeType::InlineCode
        };
        let mut node = AstNode::new(node_type);
        node.content = Some(raw);
        Some(InlineMatch {
            node,
            consumed_bytes: end + marker_len - state.pos,
        })
    }
}

/// Parses explicit links and applies the shared URL policy.
pub struct LinkRule;

impl InlineRule for LinkRule {
    fn name(&self) -> &'static str {
        "link"
    }

    fn markers(&self) -> &'static [char] {
        &['[']
    }

    fn parse(&self, state: &mut InlineState, ctx: &ParserContext<'_>) -> Option<InlineMatch> {
        if state.current_char() != Some('[') {
            return None;
        }
        let text_end = state.find_next_token("](", state.pos + 1)?;
        let url_end = state.find_next_token(")", text_end + 2)?;
        let inner = state.content[state.pos + 1..text_end].to_owned();
        let mut url = state.content[text_end + 2..url_end].trim().to_owned();
        if let Some(rest) = url.strip_prefix("www.") {
            url = format!("http://www.{rest}");
        }
        if !is_safe_link_url(&url) {
            return None;
        }
        let mut node = AstNode::new(NodeType::Link);
        node.url = Some(url);
        node.children = ctx.parse_inline(&inner);
        Some(InlineMatch {
            node,
            consumed_bytes: url_end + 1 - state.pos,
        })
    }
}

/// Parses FFM underline syntax.
pub struct UnderlineRule;

impl InlineRule for UnderlineRule {
    fn name(&self) -> &'static str {
        "underline"
    }

    fn markers(&self) -> &'static [char] {
        &['_']
    }

    fn parse(&self, state: &mut InlineState, ctx: &ParserContext<'_>) -> Option<InlineMatch> {
        if !state.content[state.pos..].starts_with("__") {
            return None;
        }
        let end = state.find_next_token("__", state.pos + 2)?;
        let mut node = AstNode::new(NodeType::Underline);
        node.children = ctx.parse_inline(&state.content[state.pos + 2..end]);
        Some(InlineMatch {
            node,
            consumed_bytes: end + 2 - state.pos,
        })
    }
}

/// Parses FFM dash strike syntax.
pub struct StrikeRule;

impl InlineRule for StrikeRule {
    fn name(&self) -> &'static str {
        "strike"
    }

    fn markers(&self) -> &'static [char] {
        &['-']
    }

    fn parse(&self, state: &mut InlineState, ctx: &ParserContext<'_>) -> Option<InlineMatch> {
        if !state.content[state.pos..].starts_with("--") {
            return None;
        }
        let end = state.find_next_token("--", state.pos + 2)?;
        let mut node = AstNode::new(NodeType::Strike);
        node.children = ctx.parse_inline(&state.content[state.pos + 2..end]);
        Some(InlineMatch {
            node,
            consumed_bytes: end + 2 - state.pos,
        })
    }
}

/// Parses FFM bold syntax.
pub struct BoldRule;

impl InlineRule for BoldRule {
    fn name(&self) -> &'static str {
        "bold"
    }

    fn markers(&self) -> &'static [char] {
        &['*']
    }

    fn parse(&self, state: &mut InlineState, ctx: &ParserContext<'_>) -> Option<InlineMatch> {
        if !state.content[state.pos..].starts_with("**") {
            return None;
        }
        let end = state.find_next_token("**", state.pos + 2)?;
        let mut node = AstNode::new(NodeType::Bold);
        node.children = ctx.parse_inline(&state.content[state.pos + 2..end]);
        Some(InlineMatch {
            node,
            consumed_bytes: end + 2 - state.pos,
        })
    }
}

/// Parses single-asterisk italic syntax.
pub struct ItalicRule;

impl InlineRule for ItalicRule {
    fn name(&self) -> &'static str {
        "italic"
    }

    fn markers(&self) -> &'static [char] {
        &['*']
    }

    fn parse(&self, state: &mut InlineState, ctx: &ParserContext<'_>) -> Option<InlineMatch> {
        if state.current_char() != Some('*') || state.content[state.pos + 1..].starts_with('*') {
            return None;
        }
        let end = state.find_next_token("*", state.pos + 1)?;
        if end == state.pos + 1 {
            return None;
        }
        let mut node = AstNode::new(NodeType::Italic);
        node.children = ctx.parse_inline(&state.content[state.pos + 1..end]);
        Some(InlineMatch {
            node,
            consumed_bytes: end + 1 - state.pos,
        })
    }
}

const FFM_KEYWORDS: &[&str] = &["quote", "slide", "chain", "accordion"];

/// Parses FFM fenced blocks before generic code blocks.
pub struct FfmBlockRule;

impl BlockRule for FfmBlockRule {
    fn name(&self) -> &'static str {
        "ffm_blocks"
    }

    fn markers(&self) -> &'static [char] {
        &['`', '~']
    }

    fn parse(&self, state: &BlockState, ctx: &ParserContext<'_>) -> Option<BlockMatch> {
        let block = extract_fenced_block(state)?;
        let block_type = block.lang.split_whitespace().next().unwrap_or_default();
        if !FFM_KEYWORDS.contains(&block_type) {
            return None;
        }

        let node = match block_type {
            "quote" => {
                AstNode::with_children(NodeType::Blockquote, ctx.parse_blocks(&block.content))
            }
            "slide" => {
                let slides = split_slide_contents(&block.content)
                    .into_iter()
                    .filter(|content| !content.trim().is_empty())
                    .map(|content| {
                        AstNode::with_children(
                            NodeType::SlideItem,
                            ctx.parse_blocks(content.trim()),
                        )
                    })
                    .collect();
                AstNode::with_children(NodeType::Slide, slides)
            }
            "accordion" | "chain" => parse_foldable_block(block_type, &block.content, ctx),
            _ => unreachable!("FFM keywords are exhaustive"),
        };
        Some(BlockMatch {
            node,
            consumed_lines: block.consumed_lines,
        })
    }
}

/// Splits slide content on the exact blank-line-delimited `---` pattern.
fn split_slide_contents(content: &str) -> Vec<String> {
    let mut sections = Vec::new();
    let mut section_start = 0;
    let mut search_from = 0;

    while let Some(relative_start) = content[search_from..].find("\n\n") {
        let separator_start = search_from + relative_start;
        let mut marker_start = separator_start + 2;
        while marker_start < content.len()
            && content[marker_start..]
                .chars()
                .next()
                .is_some_and(char::is_whitespace)
        {
            marker_start += content[marker_start..]
                .chars()
                .next()
                .expect("whitespace character exists")
                .len_utf8();
        }
        if !content[marker_start..].starts_with("---") {
            search_from = separator_start + 2;
            continue;
        }

        let mut separator_end = marker_start + 3;
        while separator_end < content.len()
            && content[separator_end..]
                .chars()
                .next()
                .is_some_and(|character| matches!(character, ' ' | '\t'))
        {
            separator_end += content[separator_end..]
                .chars()
                .next()
                .expect("whitespace character exists")
                .len_utf8();
        }
        if !content[separator_end..].starts_with("\n\n") {
            search_from = separator_start + 2;
            continue;
        }

        sections.push(content[section_start..separator_start].to_owned());
        section_start = separator_end + 2;
        search_from = section_start;
    }
    sections.push(content[section_start..].to_owned());
    sections
}

/// Parses accordion and chain item titles and checkbox state.
fn parse_foldable_block(block_type: &str, content: &str, ctx: &ParserContext<'_>) -> AstNode {
    let accordion_name = (block_type == "accordion").then(|| ctx.create_id("acc"));
    let mut items = Vec::new();
    let mut current_item: Option<AstNode> = None;
    let mut current_lines = Vec::new();
    let mut preamble_lines = Vec::new();

    for line in content.split('\n') {
        if let Some((checkbox, title)) = parse_ffm_title(line) {
            if let Some(mut previous) = current_item.take() {
                previous.children = ctx.parse_blocks(current_lines.join("\n").trim());
                items.push(previous);
            } else if !current_lines.is_empty() && !current_lines.join("").trim().is_empty() {
                preamble_lines = std::mem::take(&mut current_lines);
            }

            let node_type = if block_type == "accordion" {
                NodeType::AccordionItem
            } else {
                NodeType::ChainItem
            };
            let mut item = AstNode::new(node_type);
            item.name = accordion_name.clone();
            item.title = Some(ctx.parse_inline(title));
            if block_type == "chain" {
                item.is_completed = Some(checkbox == Some('x') || checkbox == Some('X'));
                item.has_checkbox = Some(checkbox.is_some());
            }
            current_item = Some(item);
            current_lines.clear();
        } else {
            current_lines.push(line.to_owned());
        }
    }

    if let Some(mut last) = current_item {
        last.children = ctx.parse_blocks(current_lines.join("\n").trim());
        items.push(last);
    } else if !current_lines.is_empty() && !current_lines.join("").trim().is_empty() {
        preamble_lines = current_lines;
    }

    let mut children = if preamble_lines.is_empty() {
        Vec::new()
    } else {
        ctx.parse_blocks(preamble_lines.join("\n").trim())
    };
    children.extend(items);
    let node_type = if block_type == "accordion" {
        NodeType::Accordion
    } else {
        NodeType::Chain
    };
    let mut node = AstNode::with_children(node_type, children);
    node.name = accordion_name;
    node
}

/// Parses the bold FFM title syntax and optional checkbox marker.
fn parse_ffm_title(line: &str) -> Option<(Option<char>, &str)> {
    let trimmed = line.trim();
    if !trimmed.starts_with("**") || !trimmed.ends_with("**") || trimmed.len() <= 4 {
        return None;
    }
    let mut title = &trimmed[2..trimmed.len() - 2];
    let checkbox = if title.starts_with('[')
        && title.as_bytes().get(2) == Some(&b']')
        && matches!(
            title.as_bytes().get(1),
            Some(b' ') | Some(b'x') | Some(b'X')
        ) {
        let mark = title.as_bytes()[1] as char;
        title = title[3..].trim_start();
        Some(mark)
    } else {
        None
    };
    (!title.is_empty()).then_some((checkbox, title.trim_end()))
}
