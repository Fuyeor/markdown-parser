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
mod plain_text;
mod render;
mod rules;
mod safety;
mod state;

pub use ast::{Alignment, AstNode, NodeType};
pub use linkify::{LinkMatch, linkify};
pub use parser::{Linkifier, MarkdownParser, ParserContext, ParserError, ParserOptions};
pub use plain_text::to_plain_text;
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
mod cross_language_fixtures {
    use serde::Deserialize;
    use serde_json::{Map, Value, json};

    use super::{
        AstNode, MarkdownParser, ParserOptions, create_fuyeor_markdown_parser,
        create_markdown_parser, is_safe_color_value, is_safe_link_url, linkify, render,
        to_plain_text,
    };

    #[derive(Deserialize)]
    struct MarkdownFixtureFile {
        schema_version: u32,
        cases: Vec<MarkdownCase>,
    }

    #[derive(Deserialize)]
    struct MarkdownCase {
        input: Option<String>,
        html: Option<String>,
        plain_text: Option<String>,
        #[serde(default)]
        assert: Vec<MarkdownAssertion>,
        error: Option<String>,
        no_throw: Option<bool>,
        options: Option<FixtureOptions>,
    }

    #[derive(Deserialize)]
    struct MarkdownAssertion {
        path: String,
        value: Option<Value>,
        length: Option<usize>,
    }

    #[derive(Deserialize)]
    struct FixtureOptions {
        max_nesting_depth: Option<usize>,
    }

    #[derive(Deserialize)]
    struct SafetyFixtureFile {
        schema_version: u32,
        links: Vec<SafetyCase>,
        colors: Vec<SafetyCase>,
    }

    #[derive(Deserialize)]
    struct SafetyCase {
        input: String,
        valid: bool,
    }

    #[derive(Deserialize)]
    struct LinkifyFixtureFile {
        schema_version: u32,
        cases: Vec<LinkifyCase>,
    }

    #[derive(Deserialize)]
    struct LinkifyCase {
        input: String,
        links: Vec<ExpectedLink>,
    }

    #[derive(Deserialize)]
    struct ExpectedLink {
        text: String,
        url: String,
    }

    // Load a shared JSON fixture from the repository root.
    fn read_fixture<T: for<'de> Deserialize<'de>>(name: &str) -> T {
        let path = format!("{}/../../fixtures/{name}", env!("CARGO_MANIFEST_DIR"));
        serde_json::from_str(&std::fs::read_to_string(path).expect("fixture must exist"))
            .expect("fixture must be valid JSON")
    }

    // Convert the Rust AST into the TypeScript-compatible wire projection.
    fn normalize_node(node: &AstNode) -> Value {
        let mut object = Map::new();
        object.insert("type".into(), json!(node.node_type.as_str()));
        if let Some(content) = &node.content {
            object.insert("content".into(), json!(content));
        }
        if !node.children.is_empty() {
            object.insert(
                "children".into(),
                Value::Array(node.children.iter().map(normalize_node).collect()),
            );
        }
        if let Some(level) = node.level {
            object.insert("level".into(), json!(level));
        }
        if let Some(lang) = &node.lang {
            object.insert("lang".into(), json!(lang));
        }
        if let Some(url) = &node.url {
            object.insert("url".into(), json!(url));
        }
        if let Some(ordered) = node.ordered {
            object.insert("ordered".into(), json!(ordered));
        }
        if let Some(start) = node.start {
            object.insert("start".into(), json!(start));
        }
        if let Some(headers) = &node.headers {
            object.insert(
                "headers".into(),
                Value::Array(headers.iter().map(normalize_node).collect()),
            );
        }
        if let Some(name) = &node.name {
            object.insert("name".into(), json!(name));
        }
        if let Some(title) = &node.title {
            object.insert(
                "title".into(),
                Value::Array(title.iter().map(normalize_node).collect()),
            );
        }
        if let Some(is_completed) = node.is_completed {
            object.insert("isCompleted".into(), json!(is_completed));
        }
        if let Some(has_checkbox) = node.has_checkbox {
            object.insert("hasCheckbox".into(), json!(has_checkbox));
        }
        if let Some(align) = node.align {
            object.insert("align".into(), json!(align.as_str()));
        }
        Value::Object(object)
    }

    // Read a JSON Pointer from the normalized AST projection.
    fn read_json_pointer<'a>(root: &'a Value, pointer: &str) -> Option<&'a Value> {
        pointer
            .split('/')
            .skip(1)
            .try_fold(root, |value, segment| match value {
                Value::Array(values) => values.get(segment.parse::<usize>().ok()?),
                Value::Object(values) => values.get(segment),
                _ => None,
            })
    }

    // Translate fixture options into the Rust parser API.
    fn parser_options(case: &MarkdownCase) -> ParserOptions {
        ParserOptions {
            max_nesting_depth: case
                .options
                .as_ref()
                .and_then(|options| options.max_nesting_depth)
                .unwrap_or(64),
            ..ParserOptions::default()
        }
    }

    // Execute one standard or FFM Markdown case against the Rust parser.
    fn execute_markdown_case(case: &MarkdownCase, ffm: bool) {
        let options = parser_options(case);
        if case.error.as_deref() == Some("invalid_nesting_depth") {
            assert!(MarkdownParser::try_new(options).is_err());
            return;
        }
        let parser = if ffm {
            create_fuyeor_markdown_parser(options)
        } else {
            create_markdown_parser(options)
        };
        let ast = parser.parse(case.input.as_deref().unwrap_or(""));
        if let Some(expected_html) = &case.html {
            assert_eq!(render(&ast).trim(), expected_html, "Markdown fixture");
        }
        if let Some(expected_plain_text) = &case.plain_text {
            assert_eq!(
                to_plain_text(&ast),
                *expected_plain_text,
                "Markdown fixture"
            );
        }
        let normalized = Value::Array(ast.iter().map(normalize_node).collect());
        for assertion in &case.assert {
            let actual = read_json_pointer(&normalized, &assertion.path)
                .unwrap_or_else(|| panic!("missing AST path {}", assertion.path));
            if let Some(length) = assertion.length {
                assert_eq!(actual.as_array().map(Vec::len), Some(length));
            } else {
                assert_eq!(Some(actual), assertion.value.as_ref());
            }
        }
        if case.no_throw == Some(true) {
            assert!(normalized.is_array());
        }
    }

    #[test]
    fn executes_shared_markdown_fixtures() {
        let standard = read_fixture::<MarkdownFixtureFile>("markdown.json");
        assert_eq!(standard.schema_version, 2);
        for case in &standard.cases {
            execute_markdown_case(case, false);
        }
        let ffm = read_fixture::<MarkdownFixtureFile>("ffm.json");
        assert_eq!(ffm.schema_version, 2);
        for case in &ffm.cases {
            execute_markdown_case(case, true);
        }
    }

    #[test]
    fn executes_shared_safety_and_linkify_fixtures() {
        let safety = read_fixture::<SafetyFixtureFile>("safety.json");
        assert_eq!(safety.schema_version, 1);
        for case in safety.links {
            assert_eq!(is_safe_link_url(&case.input), case.valid);
        }
        for case in safety.colors {
            assert_eq!(is_safe_color_value(&case.input), case.valid);
        }

        let linkify_cases = read_fixture::<LinkifyFixtureFile>("linkify.json");
        assert_eq!(linkify_cases.schema_version, 1);
        for case in linkify_cases.cases {
            let actual = linkify(&case.input);
            assert_eq!(
                actual.len(),
                case.links.len(),
                "linkify input: {}",
                case.input
            );
            for (actual, expected) in actual.iter().zip(case.links.iter()) {
                assert_eq!(actual.text, expected.text);
                assert_eq!(actual.url, expected.url);
            }
        }
    }
}
