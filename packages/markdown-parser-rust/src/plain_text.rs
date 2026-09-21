// packages/markdown-parser-rust/src/plain_text.rs
use std::fmt::Write;

use crate::ast::{AstNode, NodeType};

/// Converts Markdown/FFM AST nodes into the plain text used by search indexing.
///
/// The projection preserves visible text and code content, omits link destinations
/// and presentation metadata, and treats HTML/CSS text as ordinary node content.
pub fn to_plain_text(nodes: &[AstNode]) -> String {
    let mut output = String::new();
    append_block_nodes(nodes, &mut output);
    output.trim_end_matches('\n').to_owned()
}

/// Appends block-level nodes with one newline between adjacent blocks.
fn append_block_nodes(nodes: &[AstNode], output: &mut String) {
    for (index, node) in nodes.iter().enumerate() {
        if index > 0 {
            push_separator(output);
        }
        append_block_node(node, output);
    }
}

/// Appends one node using its Markdown/FFM text semantics.
fn append_block_node(node: &AstNode, output: &mut String) {
    match &node.node_type {
        NodeType::Text | NodeType::InlineCode | NodeType::ColorCode => {
            if let Some(content) = &node.content {
                output.push_str(content);
            }
        }
        NodeType::Heading
        | NodeType::Paragraph
        | NodeType::Bold
        | NodeType::Italic
        | NodeType::Underline
        | NodeType::Strike
        | NodeType::Link => append_inline_nodes(&node.children, output),
        NodeType::CodeBlock => {
            if let Some(content) = &node.content {
                output.push_str(content);
            }
        }
        NodeType::Blockquote
        | NodeType::List
        | NodeType::ListItem
        | NodeType::Slide
        | NodeType::SlideItem
        | NodeType::Accordion
        | NodeType::Chain => append_block_nodes(&node.children, output),
        NodeType::AccordionItem => {
            append_inline_nodes(node.title.as_deref().unwrap_or_default(), output);
            if !output.is_empty() && !output.ends_with('\n') && !node.children.is_empty() {
                output.push('\n');
            }
            append_block_nodes(&node.children, output);
        }
        NodeType::ChainItem => {
            if let Some(title) = &node.title {
                append_inline_nodes(title, output);
                if !output.is_empty() && !output.ends_with('\n') && !node.children.is_empty() {
                    output.push('\n');
                }
            }
            append_block_nodes(&node.children, output);
        }
        NodeType::Table => {
            if let Some(headers) = &node.headers {
                append_table_cells(headers, output);
            }
            if !node.children.is_empty() {
                if !output.is_empty() {
                    push_separator(output);
                }
                append_block_nodes(&node.children, output);
            }
        }
        NodeType::TableRow => append_table_cells(&node.children, output),
        NodeType::TableCell => append_inline_nodes(&node.children, output),
        NodeType::Hardbreak => output.push('\n'),
        NodeType::Hr => {}
        NodeType::Root | NodeType::Custom(_) => append_block_nodes(&node.children, output),
    }
}

/// Appends inline children without inserting separators between formatting nodes.
fn append_inline_nodes(nodes: &[AstNode], output: &mut String) {
    for node in nodes {
        append_block_node(node, output);
    }
}

/// Appends table cells with a newline boundary so adjacent values remain distinct.
fn append_table_cells(cells: &[AstNode], output: &mut String) {
    for (index, cell) in cells.iter().enumerate() {
        if index > 0 {
            push_separator(output);
        }
        append_block_node(cell, output);
    }
}

/// Adds a single logical newline without accumulating duplicate separators.
fn push_separator(output: &mut String) {
    if !output.is_empty() && !output.ends_with('\n') {
        let _ = writeln!(output);
    }
}
