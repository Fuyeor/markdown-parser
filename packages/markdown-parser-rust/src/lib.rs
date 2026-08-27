// packages/markdown-parser-rust/src/lib.rs
//! Fuyeor Flavored Markdown parser and safe HTML renderer for Rust.
//!
//! The implementation mirrors the rule order and AST semantics of the
//! TypeScript reference parser in `packages/markdown-parser`.
#![forbid(unsafe_code)]
#![warn(missing_docs)]

mod ast;
mod linkify;
mod parser;
mod render;
mod rules;
mod safety;
mod state;

pub use ast::{Alignment, AstNode, NodeType};
pub use linkify::{LinkMatch, linkify};
pub use parser::{Linkifier, MarkdownParser, ParserContext, ParserError, ParserOptions};
pub use render::{render, render_optional};
pub use safety::{is_safe_color_value, is_safe_link_url};
pub use state::{BlockState, InlineState};

/// Constructs a parser with the base Markdown rule set.
pub fn create_markdown_parser(options: ParserOptions) -> MarkdownParser {
    MarkdownParser::create_standard(options)
}

/// Constructs a parser with the base Markdown rules and FFM extensions.
pub fn create_fuyeor_markdown_parser(options: ParserOptions) -> MarkdownParser {
    MarkdownParser::create_ffm(options)
}

#[cfg(test)]
mod tests {
    use super::{
        AstNode, NodeType, ParserOptions, create_fuyeor_markdown_parser, create_markdown_parser,
        render,
    };

    fn ffm() -> super::MarkdownParser {
        create_fuyeor_markdown_parser(ParserOptions::default())
    }

    #[test]
    fn parses_atx_heading_with_nested_bold() {
        let ast = create_markdown_parser(ParserOptions::default()).parse("## Hello **World**");
        assert_eq!(ast[0].node_type, NodeType::Heading);
        assert_eq!(ast[0].level, Some(2));
        assert_eq!(ast[0].children[0], AstNode::text("Hello "));
        assert_eq!(ast[0].children[1].node_type, NodeType::Bold);
    }

    #[test]
    fn parses_fenced_code_block() {
        let ast =
            create_markdown_parser(ParserOptions::default()).parse("```ts\nconst a = 1;\n```");
        assert_eq!(ast[0].node_type, NodeType::CodeBlock);
        assert_eq!(ast[0].lang.as_deref(), Some("ts"));
        assert_eq!(ast[0].content.as_deref(), Some("const a = 1;"));
    }

    #[test]
    fn parses_safe_links_and_keeps_unsafe_links_as_text() {
        let ast = create_markdown_parser(ParserOptions::default()).parse(
            "visit www.fuyeor.com or [click here](https://fuyeor.com) [bad](javascript:alert(1))",
        );
        let children = &ast[0].children;
        assert_eq!(children[1].node_type, NodeType::Link);
        assert_eq!(children[1].url.as_deref(), Some("https://www.fuyeor.com"));
        assert_eq!(children[3].node_type, NodeType::Link);
        assert!(
            !children
                .iter()
                .any(|node| node.url.as_deref() == Some("javascript:alert(1)"))
        );
    }

    #[test]
    fn parses_internationalized_fuzzy_domains() {
        let ast = ffm().parse("Visit fuyeor.xn--p1ai");
        let link = ast[0]
            .children
            .iter()
            .find(|node| node.node_type == NodeType::Link)
            .expect("linkify should find the IDN");
        assert_eq!(link.url.as_deref(), Some("https://fuyeor.рф"));
        assert_eq!(link.children, vec![AstNode::text("fuyeor.рф")]);
    }

    #[test]
    fn renders_aligned_headed_table() {
        let ast = ffm()
            .parse("| 属性 | 类型 | 说明 |\n| :--- | :---: | ---: |\n| name | string | 用户名 |");
        assert_eq!(
            render(&ast),
            "<table>\n<thead>\n<tr>\n<th align=\"left\">属性</th>\n<th align=\"center\">类型</th>\n<th align=\"right\">说明</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td align=\"left\">name</td>\n<td align=\"center\">string</td>\n<td align=\"right\">用户名</td>\n</tr>\n</tbody>\n</table>\n"
        );
    }

    #[test]
    fn renders_separator_first_table_without_header() {
        let ast = ffm()
            .parse("| :--- | ---: |\n| Ray ID | a2c5ac427b7aa727 |\n| IP 地址 | 172.214.47.18 |");
        assert!(ast[0].headers.is_none());
        assert_eq!(ast[0].children.len(), 2);
        assert!(render(&ast).starts_with("<table>\n<tbody>"));
    }

    #[test]
    fn preserves_ffm_inline_and_block_nodes() {
        let ast = ffm().parse("__under__ and --strike--\n\n```quote\n## nested\n```");
        assert_eq!(ast[0].children[0].node_type, NodeType::Underline);
        assert_eq!(ast[0].children[2].node_type, NodeType::Strike);
        assert_eq!(ast[1].node_type, NodeType::Blockquote);
        assert_eq!(ast[1].children[0].node_type, NodeType::Heading);
    }

    #[test]
    fn accepts_spaced_slide_separators() {
        let ast = ffm().parse("```slide\nFirst\n\n  ---  \n\nSecond\n```");
        assert_eq!(ast[0].node_type, NodeType::Slide);
        assert_eq!(ast[0].children.len(), 2);
    }

    #[test]
    fn parses_accordion_and_chain_state() {
        let ast = ffm().parse("```accordion\n**First**\nBody\n\n**Second**\nMore\n```");
        assert_eq!(ast[0].node_type, NodeType::Accordion);
        assert_eq!(ast[0].children.len(), 2);
        assert_eq!(ast[0].children[0].name.as_deref(), Some("acc-0"));

        let chain = ffm().parse("```chain\n**[x] Done**\nBody\n```");
        assert_eq!(chain[0].children[0].is_completed, Some(true));
        assert_eq!(chain[0].children[0].has_checkbox, Some(true));
    }

    #[test]
    fn matches_ffm_golden_fixtures() {
        let cases = [
            ("--Fuyeor--", "<p><del>Fuyeor</del></p>\n"),
            ("__Fuyeor__", "<p><u>Fuyeor</u></p>\n"),
            (
                "`#ff0000`",
                "<p><code class=\"ffm-color-code\"><span class=\"ffm-color-swatch\" style=\"display:inline-block;width:0.8em;height:0.8em;border-radius:50%;background-color:#ff0000;vertical-align:middle;margin-right:0.3em;border:1px solid #00000030;\"></span>#ff0000</code></p>\n",
            ),
            (
                "```quote\n## Title\n```",
                "<blockquote>\n<h2>Title</h2>\n</blockquote>\n",
            ),
            (
                "```accordion\n**One**\nContent\n```",
                "<div class=\"ffm-accordion\"><details name=\"acc-0\"><summary>One</summary><div class=\"accordion-content\"><p>Content</p>\n</div></details></div>",
            ),
            (
                "```chain\n**[x] Done**\nBody\n```",
                "<div class=\"chain-container\"><div class=\"chain-item is-completed\"><div class=\"chain-marker\"></div><div class=\"chain-content-wrapper\"><div class=\"chain-title\">Done</div><div class=\"chain-body\"><p>Body</p>\n</div></div></div></div>",
            ),
            (
                "```slide\nFirst\n\n---\n\nSecond\n```",
                "<div class=\"slide-container-wrapper\"><div class=\"slide-container\"><div class=\"slide-item\"><p>First</p>\n</div><div class=\"slide-item\"><p>Second</p>\n</div></div></div>",
            ),
            (
                "[x](javascript:alert(1))",
                "<p>[x](javascript:alert(1))</p>\n",
            ),
            (
                "[x](data:text/html,<script>alert(1)</script>)",
                "<p>[x](data:text/html,&lt;script&gt;alert(1)&lt;/script&gt;)</p>\n",
            ),
            (
                "[x](file:///etc/passwd)",
                "<p>[x](file:///etc/passwd)</p>\n",
            ),
        ];
        for (source, expected) in cases {
            assert_eq!(render(&ffm().parse(source)), expected, "fixture: {source}");
        }
    }

    #[test]
    fn bounds_recursive_block_parsing_and_rejects_zero_depth() {
        let bounded = create_fuyeor_markdown_parser(ParserOptions {
            max_nesting_depth: 8,
            ..ParserOptions::default()
        });
        let _ = bounded.parse(&format!("{} value", ">".repeat(100)));
        assert!(
            super::MarkdownParser::try_new(ParserOptions {
                max_nesting_depth: 0,
                ..ParserOptions::default()
            })
            .is_err()
        );
    }

    #[test]
    fn uses_two_space_steps_for_deeper_lists() {
        let ast = ffm().parse("1. root\n   - level 1\n    - level 2");
        assert_eq!(ast[0].node_type, NodeType::List);
        let level_one = ast[0].children[0]
            .children
            .iter()
            .find(|node| node.node_type == NodeType::List)
            .expect("first nested list");
        assert_eq!(level_one.node_type, NodeType::List);
        let level_two = level_one.children[0]
            .children
            .iter()
            .find(|node| node.node_type == NodeType::List)
            .expect("second nested list");
        assert_eq!(level_two.node_type, NodeType::List);
    }
}
