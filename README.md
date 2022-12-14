# fedistar
[![Test](https://github.com/h3poteto/fedistar/actions/workflows/test.yml/badge.svg)](https://github.com/h3poteto/fedistar/actions/workflows/test.yml)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/h3poteto/fedistar)](https://github.com/h3poteto/fedistar/releases)
![GitHub](https://img.shields.io/github/license/h3poteto/fedistar)

This is a Mastodon and Pleroma client application for desktop.

![screenshot](screenshot.png)

## !! This software is under development
There is no stable version of fedistar yet. We're developing it now, so there are many unimplemented features.
Please be careful when using.

## Roadmap for 1.0.0
- [x] Servers and Accounts
    - [x] Add/Remove
- [x] See timelines without sign in
- [ ] Timelines
    - [x] Home
    - [x] Notifications
    - [x] Local
    - [x] Public
    - [x] Lists
    - [x] Bookmarks
    - [ ] DirectMessages
- [x] Streaming
- [x] Notification
- [ ] Status actions
    - [x] Reply
    - [x] Reblog
    - [x] Favourite
    - [x] Bookmark
    - [ ] Emoji reaction
- [ ] User Profile
    - [ ] Show profile
    - [ ] Show followers
    - [ ] Show followings
    - [ ] Show user timeline
    - [ ] Follow/Unfollow
    - [ ] Mute/Block
- [x] Status detail
    - [x] Show media
    - [x] Handle NSFW and CW
    - [x] Show the thread
    - [x] Link preview
- [x] Post statuses
    - [x] Post statuses
    - [x] Add emoji
    - [x] Attach media
    - [x] Change visibility
    - [x] Specify NSFW and CW
- [x] See media
    - [x] Image
    - [x] Video
    - [x] Audio

## Development
### Prereqisites
At first, install system dependencies.

```
$ sudo apt update
$ sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

Next, install Rust.

```
$ curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

And install Node.js.

### Getting started

```
$ git clone git@github.com:h3poteto/fedistar.git
$ cd fedistar
$ yarn install
$ yarn tauri dev
```

## License
The software is available as open source under the terms of the [GPL-3.0 License](https://www.gnu.org/licenses/gpl-3.0.en.html).

