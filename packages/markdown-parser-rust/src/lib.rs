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
mod cross_language_fixtures {
    use serde::Deserialize;
    use serde_json::{Map, Value, json};

    use super::{
        AstNode, MarkdownParser, ParserOptions, create_fuyeor_markdown_parser,
        create_markdown_parser, is_safe_color_value, is_safe_link_url, linkify, render,
    };

    #[derive(Deserialize)]
    struct MarkdownFixtureFile {
        schema_version: u32,
        cases: Vec<MarkdownFixture>,
    }

    #[derive(Deserialize)]
    struct MarkdownFixture {
        id: String,
        parser: String,
        operation: Option<String>,
        source: Option<String>,
        value: Option<String>,
        expected: Option<bool>,
        expected_html: Option<String>,
        expected_error: Option<String>,
        expect_no_throw: Option<bool>,
        options: Option<FixtureOptions>,
        #[serde(default)]
        assertions: Vec<FixtureAssertion>,
    }

    #[derive(Deserialize)]
    struct FixtureOptions {
        max_nesting_depth: Option<usize>,
    }

    #[derive(Deserialize)]
    struct FixtureAssertion {
        path: String,
        equals: Option<Value>,
        length: Option<usize>,
    }

    #[derive(Deserialize)]
    struct LinkifyFixtureFile {
        schema_version: u32,
        cases: Vec<LinkifyFixture>,
    }

    #[derive(Deserialize)]
    struct LinkifyFixture {
        id: String,
        source: String,
        expected: Vec<ExpectedLink>,
    }

    #[derive(Deserialize)]
    struct ExpectedLink {
        text: String,
        url: String,
    }

    // Load the shared Markdown fixture from the repository root.
    fn markdown_fixtures() -> MarkdownFixtureFile {
        let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../../fixtures/markdown.json");
        serde_json::from_str(&std::fs::read_to_string(path).expect("markdown fixture must exist"))
            .expect("markdown fixture must be valid JSON")
    }

    // Load the shared linkify fixture from the repository root.
    fn linkify_fixtures() -> LinkifyFixtureFile {
        let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../../fixtures/linkify.json");
        serde_json::from_str(&std::fs::read_to_string(path).expect("linkify fixture must exist"))
            .expect("linkify fixture must be valid JSON")
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
    fn parser_options(fixture: &MarkdownFixture) -> ParserOptions {
        ParserOptions {
            max_nesting_depth: fixture
                .options
                .as_ref()
                .and_then(|options| options.max_nesting_depth)
                .unwrap_or(64),
            ..ParserOptions::default()
        }
    }

    // Execute one canonical Markdown fixture against the Rust implementation.
    fn execute_markdown_fixture(fixture: &MarkdownFixture) {
        let options = parser_options(fixture);
        match fixture.operation.as_deref() {
            Some("safe_link") => {
                assert_eq!(
                    is_safe_link_url(fixture.value.as_deref().unwrap_or("")),
                    fixture.expected.expect("safe_link fixture expected value"),
                    "fixture: {}",
                    fixture.id
                );
                return;
            }
            Some("safe_color") => {
                assert_eq!(
                    is_safe_color_value(fixture.value.as_deref().unwrap_or("")),
                    fixture.expected.expect("safe_color fixture expected value"),
                    "fixture: {}",
                    fixture.id
                );
                return;
            }
            Some("construct") => {
                assert!(
                    MarkdownParser::try_new(options).is_err(),
                    "fixture: {}",
                    fixture.id
                );
                assert_eq!(
                    fixture.expected_error.as_deref(),
                    Some("invalid_nesting_depth"),
                    "fixture: {}",
                    fixture.id
                );
                return;
            }
            Some("parse") | None => {}
            Some(operation) => panic!("unknown Markdown fixture operation: {operation}"),
        }

        let parser = if fixture.parser == "ffm" {
            create_fuyeor_markdown_parser(options)
        } else {
            create_markdown_parser(options)
        };
        let ast = parser.parse(fixture.source.as_deref().unwrap_or(""));
        if let Some(expected_html) = &fixture.expected_html {
            assert_eq!(render(&ast), *expected_html, "fixture: {}", fixture.id);
        }
        let normalized = Value::Array(ast.iter().map(normalize_node).collect());
        for assertion in &fixture.assertions {
            let actual = read_json_pointer(&normalized, &assertion.path).unwrap_or_else(|| {
                panic!(
                    "missing AST path {} in fixture {}",
                    assertion.path, fixture.id
                )
            });
            if let Some(length) = assertion.length {
                assert_eq!(
                    actual.as_array().map(Vec::len),
                    Some(length),
                    "fixture: {}",
                    fixture.id
                );
            } else {
                assert_eq!(
                    Some(actual),
                    assertion.equals.as_ref(),
                    "fixture: {}",
                    fixture.id
                );
            }
        }
        if fixture.expect_no_throw == Some(true) {
            assert!(normalized.is_array(), "fixture: {}", fixture.id);
        }
    }

    #[test]
    fn executes_all_shared_markdown_fixtures() {
        let fixtures = markdown_fixtures();
        assert_eq!(fixtures.schema_version, 1);
        for fixture in &fixtures.cases {
            execute_markdown_fixture(fixture);
        }
    }

    #[test]
    fn executes_all_shared_linkify_fixtures() {
        let fixtures = linkify_fixtures();
        assert_eq!(fixtures.schema_version, 1);
        for fixture in fixtures.cases {
            let actual = linkify(&fixture.source)
                .into_iter()
                .map(|matched| ExpectedLink {
                    text: matched.text,
                    url: matched.url,
                })
                .collect::<Vec<_>>();
            assert_eq!(
                actual.len(),
                fixture.expected.len(),
                "fixture: {}",
                fixture.id
            );
            for (actual, expected) in actual.iter().zip(fixture.expected.iter()) {
                assert_eq!(actual.text, expected.text, "fixture: {}", fixture.id);
                assert_eq!(actual.url, expected.url, "fixture: {}", fixture.id);
            }
        }
    }
}
