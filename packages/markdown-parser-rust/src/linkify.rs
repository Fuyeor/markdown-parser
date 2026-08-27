// packages/markdown-parser-rust/src/linkify.rs

/// A link match with byte offsets into the original UTF-8 string.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LinkMatch {
    /// Normalized, safe URL.
    pub url: String,
    /// Visible matched text.
    pub text: String,
    /// Start byte offset in the source text.
    pub index: usize,
    /// Exclusive end byte offset in the source text.
    pub last_index: usize,
}

const CC_TLD_BITMAP: [u32; 22] = [
    0xeedf597c, 0xdeddb9cf, 0x15843f27, 0x1e005480, 0xb0095c00, 0x15fb9f, 0x7818068d, 0x340400f,
    0xf42b1d00, 0xd54f8141, 0x25d7fffc, 0x100084b, 0x538f3c40, 0x40000001, 0xfdf15100, 0x9fbb3be7,
    0x404419a, 0x408557, 0x4002, 0x100000, 0x400408, 0x1,
];

/// Detects links using the same conservative candidate policy as the TS package.
pub fn linkify(text: &str) -> Vec<LinkMatch> {
    let mut matches = Vec::new();
    let mut index = 0;

    while index < text.len() {
        if !text.is_char_boundary(index) {
            index += 1;
            continue;
        }

        let explicit =
            text[index..].starts_with("http://") || text[index..].starts_with("https://");
        let fuzzy_candidate = !explicit
            && (index == 0
                || text[..index]
                    .chars()
                    .next_back()
                    .is_some_and(|character| character != '@' && !is_word_character(character)))
            && text[index..]
                .chars()
                .next()
                .is_some_and(|character| character.is_ascii_alphanumeric());

        if !explicit && !fuzzy_candidate {
            index += text[index..].chars().next().map_or(1, char::len_utf8);
            continue;
        }

        let end = candidate_end(text, index, explicit);
        if end == index {
            index += text[index..].chars().next().map_or(1, char::len_utf8);
            continue;
        }

        if !explicit
            && text[end..]
                .chars()
                .next()
                .is_some_and(is_domain_continuation)
        {
            index += text[index..].chars().next().map_or(1, char::len_utf8);
            continue;
        }

        let candidate = &text[index..end];
        let trimmed = trim_url(candidate);
        if trimmed.is_empty() {
            index += text[index..].chars().next().map_or(1, char::len_utf8);
            continue;
        }
        if !explicit && !is_supported_fuzzy_url(trimmed) {
            index += text[index..].chars().next().map_or(1, char::len_utf8);
            continue;
        }

        let normalized = normalize_match_text(trimmed);
        let url = if explicit {
            normalized.clone()
        } else {
            format!("https://{normalized}")
        };
        matches.push(LinkMatch {
            url,
            text: normalized,
            index,
            last_index: index + trimmed.len(),
        });
        index += trimmed.len();
    }

    matches
}

/// Scans a URL-shaped candidate before applying domain validation.
fn candidate_end(text: &str, start: usize, explicit: bool) -> usize {
    if explicit {
        return text[start..]
            .find(char::is_whitespace)
            .map_or(text.len(), |offset| start + offset);
    }

    let mut end = start;
    let mut in_path = false;
    while end < text.len() {
        let character = text[end..].chars().next().expect("valid UTF-8 boundary");
        if character.is_whitespace() {
            break;
        }
        if in_path {
            end += character.len_utf8();
        } else if character == '/' {
            in_path = true;
            end += 1;
        } else if character.is_alphanumeric() || matches!(character, '-' | '.') {
            end += character.len_utf8();
        } else {
            break;
        }
    }
    end
}

/// Keeps domain/path characters broad, then lets the fuzzy-domain validator reject invalid input.
fn is_supported_fuzzy_url(url: &str) -> bool {
    let hostname_end = url.find('/').unwrap_or(url.len());
    let hostname = &url[..hostname_end];
    let labels = hostname.split('.').collect::<Vec<_>>();
    if labels.len() < 2 || labels.iter().any(|label| label.is_empty()) {
        return false;
    }
    let tld = *labels.last().expect("at least two labels");
    if labels[..labels.len() - 1].iter().any(|label| {
        !label
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || character == '-')
    }) {
        return false;
    }
    if tld != "рф"
        && !tld
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || character == '-')
    {
        return false;
    }

    if matches!(
        tld,
        "рф" | "app"
            | "biz"
            | "com"
            | "dev"
            | "edu"
            | "gov"
            | "int"
            | "mil"
            | "net"
            | "org"
            | "pro"
            | "web"
            | "xyz"
            | "xn--p1ai"
    ) {
        return true;
    }
    if tld.len() != 2 || !tld.bytes().all(|byte| byte.is_ascii_alphabetic()) {
        return false;
    }
    is_cc_tld(tld)
}

/// Checks a two-letter TLD against the generated 26x26 bitmap used by linkify.
fn is_cc_tld(tld: &str) -> bool {
    let bytes = tld.as_bytes();
    let first = (bytes[0].to_ascii_lowercase() - b'a') as usize;
    let second = (bytes[1].to_ascii_lowercase() - b'a') as usize;
    let bit_index = first * 26 + second;
    (CC_TLD_BITMAP[bit_index >> 5] & (1 << (bit_index & 31))) != 0
}

/// Removes terminal punctuation and one unmatched closing parenthesis.
fn trim_url(candidate: &str) -> &str {
    let mut end = candidate.len();
    while end > 0 {
        let character = candidate[..end]
            .chars()
            .next_back()
            .expect("non-empty slice");
        if ".,:;?!".contains(character) {
            end -= character.len_utf8();
        } else {
            break;
        }
    }

    let mut trimmed = &candidate[..end];
    if trimmed.ends_with(')') {
        let open_count = trimmed
            .chars()
            .filter(|character| *character == '(')
            .count();
        let close_count = trimmed
            .chars()
            .filter(|character| *character == ')')
            .count();
        if close_count > open_count {
            trimmed = &trimmed[..trimmed.len() - 1];
        }
    }
    trimmed
}

/// Converts the supported Russian punycode suffix while preserving the visible match span.
fn normalize_match_text(url: &str) -> String {
    let hostname_end = url.find('/').unwrap_or(url.len());
    let suffix = ".xn--p1ai";
    if hostname_end <= suffix.len() || !url[..hostname_end].ends_with(suffix) {
        return url.to_owned();
    }

    let suffix_start = hostname_end - suffix.len();
    format!("{}.рф{}", &url[..suffix_start], &url[hostname_end..])
}

fn is_word_character(character: char) -> bool {
    character.is_ascii_alphanumeric() || character == '_'
}

/// Prevents fuzzy matches from ending inside a Unicode word.
fn is_domain_continuation(character: char) -> bool {
    character.is_alphanumeric() || matches!(character, '_' | '-')
}
