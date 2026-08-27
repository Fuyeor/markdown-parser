// packages/markdown-parser-rust/src/safety.rs

/// Validates links using the same relative-URL and protocol policy as FFM.
pub fn is_safe_link_url(value: &str) -> bool {
    let value = value.trim();
    if value.is_empty() {
        return false;
    }

    if value.starts_with('/')
        || value.starts_with('#')
        || value.starts_with("./")
        || value.starts_with("../")
    {
        return true;
    }

    let Some(colon_index) = value.find(':') else {
        return false;
    };
    let scheme = &value[..colon_index];
    if scheme.is_empty()
        || !scheme.chars().enumerate().all(|(index, character)| {
            (index == 0 && character.is_ascii_alphabetic())
                || (index > 0
                    && (character.is_ascii_alphanumeric() || matches!(character, '+' | '-' | '.')))
        })
    {
        return false;
    }

    matches!(
        scheme.to_ascii_lowercase().as_str(),
        "http" | "https" | "mailto" | "tel"
    )
}

/// Validates the deliberately narrow FFM CSS color grammar.
pub fn is_safe_color_value(value: &str) -> bool {
    if let Some(hex) = value.strip_prefix('#') {
        return matches!(hex.len(), 3 | 4 | 6 | 8) && hex.chars().all(|c| c.is_ascii_hexdigit());
    }

    let Some(opening) = value.find('(') else {
        return false;
    };
    let Some(closing) = value.strip_suffix(')') else {
        return false;
    };
    if closing.len() <= opening + 1 || value[opening + 1..value.len() - 1].contains(')') {
        return false;
    }

    let function = &value[..opening];
    if !matches!(function, "rgb" | "rgba" | "hsl" | "hsla") {
        return false;
    }

    value[opening + 1..value.len() - 1]
        .chars()
        .all(|character| {
            character.is_ascii_digit() || matches!(character, ' ' | '\t' | ',' | '%' | '.')
        })
}

#[cfg(test)]
mod tests {
    use super::{is_safe_color_value, is_safe_link_url};

    #[test]
    fn accepts_safe_links_and_rejects_script_schemes() {
        assert!(is_safe_link_url("https://fuyeor.com"));
        assert!(is_safe_link_url("#section"));
        assert!(is_safe_link_url("../doc"));
        assert!(!is_safe_link_url("javascript:alert(1)"));
        assert!(!is_safe_link_url("data:text/html,alert(1)"));
    }

    #[test]
    fn accepts_only_supported_color_forms() {
        assert!(is_safe_color_value("#fff"));
        assert!(is_safe_color_value("rgba(0, 0, 0, 50%)"));
        assert!(!is_safe_color_value("red"));
        assert!(!is_safe_color_value("url(javascript:alert(1))"));
    }
}
