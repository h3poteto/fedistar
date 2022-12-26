use reqwest::{self, header::CONTENT_TYPE};
use scraper::{Html, Selector};

pub async fn get_favicon_url(url: &str) -> Option<String> {
    match reqwest::get(url).await {
        Err(_) => None,
        Ok(res) => match parse_location(res).await {
            Err(_) => None,
            Ok(list) => {
                if list.len() > 0 {
                    let path = list[0].clone();
                    let base = url::Url::parse(url).ok();
                    base.map(|b| b.join(&path).ok())
                        .flatten()
                        .map(|u| u.to_string())
                } else {
                    None
                }
            }
        },
    }
}

async fn parse_location(response: reqwest::Response) -> Result<Vec<String>, reqwest::Error> {
    let content_type = response.headers().get(CONTENT_TYPE);
    if let Some(content_type) = content_type {
        if content_type.to_str().unwrap_or("").starts_with("text/html") {
            let content = response.text().await?;
            let list = parse_content(&content);
            return Ok(list);
        }
    }
    Ok(Vec::new())
}

fn parse_content(content: &str) -> Vec<String> {
    let mut list: Vec<String> = Vec::new();
    let fragment = Html::parse_fragment(content);
    let selector = Selector::parse("link").expect("Failed to parse link");

    for element in fragment.select(&selector) {
        if let Some(rel) = element.value().attr("rel") {
            if rel == "icon" || rel == "apple-touch-icon" {
                if let Some(href) = element.value().attr("href") {
                    list.push(href.to_string());
                }
            }
        }
    }
    list
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_favicon_url_for_fedibird() {
        let result = get_favicon_url("https://mastodon.social").await;
        assert!(result.is_some());
        assert_eq!(
            result,
            Some(String::from("https://mastodon.social/favicon.ico"))
        );
    }

    #[tokio::test]
    async fn test_get_favicon_url_for_pleroma() {
        let result = get_favicon_url("https://pleroma.soykaf.com").await;
        assert!(result.is_some());
        assert_eq!(
            result,
            Some(String::from("https://pleroma.soykaf.com/favicon.png"))
        );
    }

    #[test]
    fn test_parse_content_for_mastodon() {
        let html = r#"
<!DOCTYPE html>
<html lang='en'>
<head>
<meta charset='utf-8'>
<meta content='width=device-width, initial-scale=1, viewport-fit=cover' name='viewport'>
<link href='/favicon.ico' rel='icon' type='image/x-icon'>
<link href='/apple-touch-icon.png' rel='apple-touch-icon' sizes='180x180'>
<link color='#2B90D9' href='/mask-icon.svg' rel='mask-icon'>
<meta content='/browserconfig.xml' name='msapplication-config'>
<title>Sample</title>
</head>
<body></body>
</html>
"#;

        let result = parse_content(html);
        assert_eq!(
            result,
            vec![
                String::from("/favicon.ico"),
                String::from("/apple-touch-icon.png")
            ]
        );
    }

    #[test]
    fn test_parse_content_for_pleroma() {
        let html = r#"
"<!DOCTYPE html>
<html lang=en>
<head>
<meta charset=utf-8>
<meta name=viewport content=\"width=device-width,initial-scale=1,user-scalable=no\">
<title>Pleroma.io</title>
<link rel=icon type=image/png href=/favicon.png>
<link href=/static/css/app.7d2d223f75c3a14b0991.css rel=stylesheet>
</head>
<body class=hidden>
<noscript>To use Pleroma, please enable JavaScript.</noscript>
<div id=app></div>
<script type=text/javascript src=/static/js/vendors~app.cea10ab53f3aa19fc30e.js></script>
<script type=text/javascript src=/static/js/app.6c972d84b60f601b01f8.js></script>
</body>
</html>"
"#;
        let result = parse_content(html);
        assert_eq!(result, vec![String::from("/favicon.png"),]);
    }
}
