// packages/markdown-parser-rust/src/ast.rs
use std::collections::BTreeMap;

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

/// Represents a built-in Markdown node or an extension-defined node.
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum NodeType {
    /// Root document node.
    Root,
    /// Paragraph block.
    Paragraph,
    /// Plain text node.
    Text,
    /// ATX heading node.
    Heading,
    /// Fenced code block.
    CodeBlock,
    /// Blockquote node.
    Blockquote,
    /// Ordered or unordered list.
    List,
    /// List item node.
    ListItem,
    /// Pipe table node.
    Table,
    /// Table row node.
    TableRow,
    /// Table cell node.
    TableCell,
    /// Strong emphasis node.
    Bold,
    /// Emphasis node.
    Italic,
    /// Link node.
    Link,
    /// Explicit hard line break.
    Hardbreak,
    /// Thematic break node.
    Hr,
    /// FFM underline node.
    Underline,
    /// FFM strike node.
    Strike,
    /// Inline code span.
    InlineCode,
    /// Safe FFM color code span.
    ColorCode,
    /// FFM slide container.
    Slide,
    /// FFM slide item.
    SlideItem,
    /// FFM accordion container.
    Accordion,
    /// FFM accordion item.
    AccordionItem,
    /// FFM chain container.
    Chain,
    /// FFM chain item.
    ChainItem,
    /// Extension-defined node name.
    Custom(String),
}

impl NodeType {
    /// Returns the wire-compatible node name used by the TypeScript parser.
    pub fn as_str(&self) -> &str {
        match self {
            Self::Root => "root",
            Self::Paragraph => "paragraph",
            Self::Text => "text",
            Self::Heading => "heading",
            Self::CodeBlock => "code_block",
            Self::Blockquote => "blockquote",
            Self::List => "list",
            Self::ListItem => "list_item",
            Self::Table => "table",
            Self::TableRow => "table_row",
            Self::TableCell => "table_cell",
            Self::Bold => "bold",
            Self::Italic => "italic",
            Self::Link => "link",
            Self::Hardbreak => "hardbreak",
            Self::Hr => "hr",
            Self::Underline => "underline",
            Self::Strike => "strike",
            Self::InlineCode => "inline_code",
            Self::ColorCode => "color_code",
            Self::Slide => "slide",
            Self::SlideItem => "slide_item",
            Self::Accordion => "accordion",
            Self::AccordionItem => "accordion_item",
            Self::Chain => "chain",
            Self::ChainItem => "chain_item",
            Self::Custom(name) => name,
        }
    }
}

/// Represents table alignment metadata.
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Alignment {
    /// Aligns content to the left.
    Left,
    /// Centers content.
    Center,
    /// Aligns content to the right.
    Right,
}

impl Alignment {
    /// Returns the HTML-compatible alignment value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Left => "left",
            Self::Center => "center",
            Self::Right => "right",
        }
    }
}

/// Extensible AST node equivalent to the TypeScript `ASTNode` interface.
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq)]
pub struct AstNode {
    /// The semantic node type.
    pub node_type: NodeType,
    /// Literal text or code content, when present.
    pub content: Option<String>,
    /// Child nodes in source order.
    pub children: Vec<AstNode>,
    /// ATX heading level.
    pub level: Option<u8>,
    /// Fenced code info string.
    pub lang: Option<String>,
    /// Link destination.
    pub url: Option<String>,
    /// Whether a list is ordered.
    pub ordered: Option<bool>,
    /// Ordered-list starting number.
    pub start: Option<u64>,
    /// Table header cells.
    pub headers: Option<Vec<AstNode>>,
    /// Accordion or chain group name.
    pub name: Option<String>,
    /// Accordion or chain item title nodes.
    pub title: Option<Vec<AstNode>>,
    /// Whether a chain item is completed.
    pub is_completed: Option<bool>,
    /// Whether a chain item explicitly contains a checkbox.
    pub has_checkbox: Option<bool>,
    /// Table-cell alignment.
    pub align: Option<Alignment>,
    /// Extension attributes not represented by built-in fields.
    pub attributes: BTreeMap<String, String>,
}

impl AstNode {
    /// Creates an empty AST node with no optional metadata.
    pub fn new(node_type: NodeType) -> Self {
        Self {
            node_type,
            content: None,
            children: Vec::new(),
            level: None,
            lang: None,
            url: None,
            ordered: None,
            start: None,
            headers: None,
            name: None,
            title: None,
            is_completed: None,
            has_checkbox: None,
            align: None,
            attributes: BTreeMap::new(),
        }
    }

    /// Creates a text node with the supplied content.
    pub fn text(content: impl Into<String>) -> Self {
        let mut node = Self::new(NodeType::Text);
        node.content = Some(content.into());
        node
    }

    /// Creates a node with child nodes.
    pub fn with_children(node_type: NodeType, children: Vec<AstNode>) -> Self {
        let mut node = Self::new(node_type);
        node.children = children;
        node
    }
}
