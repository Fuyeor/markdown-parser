// packages/markdown-parser-rust/src/render.rs
use std::fmt::Write;

use crate::ast::{AstNode, NodeType};
use crate::safety::{is_safe_color_value, is_safe_link_url};

/// Renders AST nodes to the same safe HTML shape as the TypeScript renderer.
pub fn render(nodes: &[AstNode]) -> String {
    let mut html = String::new();
    render_into(&mut html, nodes);
    html
}

/// Renders an optional node list, matching the TypeScript optional argument behavior.
pub fn render_optional(nodes: Option<&[AstNode]>) -> String {
    nodes.map_or_else(String::new, render)
}

/// Escapes the five characters that can change HTML parsing semantics.
fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

/// Renders a node list without creating temporary child strings.
fn render_into(output: &mut String, nodes: &[AstNode]) {
    for node in nodes {
        match &node.node_type {
            NodeType::Heading => {
                if let Some(level @ 1..=6) = node.level {
                    let _ = write!(output, "<h{level}>");
                    render_into(output, &node.children);
                    let _ = writeln!(output, "</h{level}>");
                } else {
                    output.push_str("<span>");
                    render_into(output, &node.children);
                    output.push_str("</span>");
                }
            }
            NodeType::Paragraph => {
                output.push_str("<p>");
                render_into(output, &node.children);
                output.push_str("</p>\n");
            }
            NodeType::Text => {
                if let Some(content) = &node.content {
                    output.push_str(&escape_html(content));
                }
            }
            NodeType::Bold => {
                output.push_str("<strong>");
                render_into(output, &node.children);
                output.push_str("</strong>");
            }
            NodeType::Italic => {
                output.push_str("<em>");
                render_into(output, &node.children);
                output.push_str("</em>");
            }
            NodeType::Underline => {
                output.push_str("<u>");
                render_into(output, &node.children);
                output.push_str("</u>");
            }
            NodeType::Strike => {
                output.push_str("<del>");
                render_into(output, &node.children);
                output.push_str("</del>");
            }
            NodeType::InlineCode => {
                output.push_str("<code>");
                if let Some(content) = &node.content {
                    output.push_str(&escape_html(content));
                }
                output.push_str("</code>");
            }
            NodeType::ColorCode => {
                let color = node.content.as_deref().unwrap_or_default();
                if !is_safe_color_value(color) {
                    output.push_str(&escape_html(color));
                } else {
                    let escaped = escape_html(color);
                    let _ = write!(
                        output,
                        "<code class=\"ffm-color-code\"><span class=\"ffm-color-swatch\" style=\"display:inline-block;width:0.8em;height:0.8em;border-radius:50%;background-color:{escaped};vertical-align:middle;margin-right:0.3em;border:1px solid #00000030;\"></span>{escaped}</code>"
                    );
                }
            }
            NodeType::Link => {
                let url = node.url.as_deref().unwrap_or_default().trim();
                if is_safe_link_url(url) {
                    let escaped = escape_html(url);
                    let _ = write!(output, "<a href=\"{escaped}\">");
                    render_into(output, &node.children);
                    output.push_str("</a>");
                } else {
                    render_into(output, &node.children);
                }
            }
            NodeType::CodeBlock => {
                output.push_str("<div class=\"code-block-wrapper\">");
                if let Some(lang) = node.lang.as_deref().filter(|lang| !lang.is_empty()) {
                    let _ = write!(
                        output,
                        "<div class=\"code-lang\">{}</div>",
                        escape_html(lang)
                    );
                }
                output.push_str("<pre><code");
                if let Some(lang) = node.lang.as_deref().filter(|lang| !lang.is_empty()) {
                    let _ = write!(output, " class=\"language-{}\"", escape_html(lang));
                }
                output.push('>');
                if let Some(content) = &node.content {
                    output.push_str(&escape_html(content));
                }
                output.push_str("\n</code></pre></div>\n");
            }
            NodeType::List => {
                let tag = if node.ordered.unwrap_or(false) {
                    "ol"
                } else {
                    "ul"
                };
                let start = if node.ordered.unwrap_or(false)
                    && node.start.is_some_and(|value| value != 1)
                {
                    format!(" start=\"{}\"", node.start.unwrap_or_default())
                } else {
                    String::new()
                };
                let _ = writeln!(output, "<{tag}{start}>");
                render_into(output, &node.children);
                let _ = writeln!(output, "</{tag}>");
            }
            NodeType::ListItem => {
                output.push_str("<li>");
                render_into(output, &node.children);
                output.push_str("</li>\n");
            }
            NodeType::Table => {
                output.push_str("<table>\n");
                if let Some(headers) = &node.headers {
                    output.push_str("<thead>\n<tr>\n");
                    for cell in headers {
                        let _ = write!(output, "<th{}>", table_alignment(cell));
                        render_into(output, &cell.children);
                        output.push_str("</th>\n");
                    }
                    output.push_str("</tr>\n</thead>\n");
                }
                if !node.children.is_empty() {
                    output.push_str("<tbody>\n");
                    for row in &node.children {
                        output.push_str("<tr>\n");
                        for cell in &row.children {
                            let _ = write!(output, "<td{}>", table_alignment(cell));
                            render_into(output, &cell.children);
                            output.push_str("</td>\n");
                        }
                        output.push_str("</tr>\n");
                    }
                    output.push_str("</tbody>\n");
                }
                output.push_str("</table>\n");
            }
            NodeType::Hr => output.push_str("<hr />\n"),
            NodeType::Blockquote => {
                output.push_str("<blockquote>\n");
                render_into(output, &node.children);
                output.push_str("</blockquote>\n");
            }
            NodeType::Accordion => {
                output.push_str("<div class=\"ffm-accordion\">");
                render_into(output, &node.children);
                output.push_str("</div>");
            }
            NodeType::AccordionItem => {
                let name = escape_html(node.name.as_deref().unwrap_or_default());
                let _ = write!(output, "<details name=\"{name}\"><summary>");
                render_optional_into(output, node.title.as_deref());
                output.push_str("</summary><div class=\"accordion-content\">");
                render_into(output, &node.children);
                output.push_str("</div></details>");
            }
            NodeType::Chain => {
                output.push_str("<div class=\"chain-container\">");
                render_into(output, &node.children);
                output.push_str("</div>");
            }
            NodeType::ChainItem => {
                let status_class = match (node.has_checkbox, node.is_completed) {
                    (Some(true), Some(true)) => "is-completed",
                    (Some(true), _) => "is-pending",
                    _ => "",
                };
                let title = if node.title.as_ref().is_some_and(|title| !title.is_empty()) {
                    let mut title_html = String::from("<div class=\"chain-title\">");
                    render_optional_into(&mut title_html, node.title.as_deref());
                    title_html.push_str("</div>");
                    title_html
                } else {
                    String::new()
                };
                let _ = write!(
                    output,
                    "<div class=\"chain-item {status_class}\"><div class=\"chain-marker\"></div><div class=\"chain-content-wrapper\">{title}<div class=\"chain-body\">"
                );
                render_into(output, &node.children);
                output.push_str("</div></div></div>");
            }
            NodeType::Slide => {
                output.push_str(
                    "<div class=\"slide-container-wrapper\"><div class=\"slide-container\">",
                );
                render_into(output, &node.children);
                output.push_str("</div></div>");
            }
            NodeType::SlideItem => {
                output.push_str("<div class=\"slide-item\">");
                render_into(output, &node.children);
                output.push_str("</div>");
            }
            NodeType::Hardbreak => output.push_str("<br />\n"),
            NodeType::Root | NodeType::TableRow | NodeType::TableCell | NodeType::Custom(_) => {
                output.push_str("<span>");
                render_into(output, &node.children);
                output.push_str("</span>");
            }
        }
    }
}

/// Renders optional title children without allocating when absent.
fn render_optional_into(output: &mut String, nodes: Option<&[AstNode]>) {
    if let Some(nodes) = nodes {
        render_into(output, nodes);
    }
}

/// Returns a safe table alignment attribute.
fn table_alignment(node: &AstNode) -> String {
    node.align.map_or_else(String::new, |alignment| {
        format!(" align=\"{}\"", alignment.as_str())
    })
}
