# Fedistar
[![Test](https://github.com/h3poteto/fedistar/actions/workflows/test.yml/badge.svg)](https://github.com/h3poteto/fedistar/actions/workflows/test.yml)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/h3poteto/fedistar)](https://github.com/h3poteto/fedistar/releases)
[![iTunes App Store](https://img.shields.io/itunes/v/6445863996)](https://apps.apple.com/us/app/fedistar/id6445863996)
[![AUR version](https://img.shields.io/aur/version/fedistar-bin)](https://aur.archlinux.org/packages/fedistar-bin)
![License](https://img.shields.io/github/license/h3poteto/fedistar)
[![Crowdin](https://badges.crowdin.net/fedistar/localized.svg)](https://crowdin.com/project/fedistar)

This is a Fediverse client application for desktop. It is supporting

- [x] Mastodon <img src="https://cdn.simpleicons.org/mastodon" alt="Mastodon" width=16 height=16>
- [x] Pleroma <img src="https://cdn.simpleicons.org/pleroma" alt="Pleroma" width=16 height=16>
- [x] Friendica
- [x] Firefish <img src="https://cdn.simpleicons.org/firefish" alt="Firefish" width=16 height=16>
- [x] Gotosocial
- [x] Pixelfed
- [x] Akkoma (Unofficial)
- [x] Sharkey (Unofficial)
- [x] Hometown (Unofficial)
- [x] Iceshrimp (Unofficial)


![screenshot](screenshot.png)

## Install
### MacOS
[![App Store](app-store.svg)](https://apps.apple.com/us/app/fedistar/id6445863996)

Or `.dmg` is available from [release page](https://github.com/h3poteto/fedistar/releases).

### Windows
Please download `.msi` file from [release page](https://github.com/h3poteto/fedistar/releases).

### Linux
Please use `.AppImage` or `.deb` in [release page](https://github.com/h3poteto/fedistar/releases).
If you're Arch Linux user, [Arch User Repository](https://aur.archlinux.org/packages/fedistar-bin) is available.

```
$ yay -S fedistar-bin
```

## Translation

If you can speak multiple languages, could you please help with translation in [Crowdin](https://crowdin.com/project/fedistar)?

Or if you want add new language, please create an issue. I will add it.

## Development
### Prerequisites
At first, install system dependencies.

```
$ sudo apt update
$ sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
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
$ pnpm install
$ pnpm tauri dev
```

## Sponsors
Fedistar is free software. We don't monetize with advertisement. So your donation supports this project.

## License
The software is available as open source under the terms of the [GPL-3.0 License](https://www.gnu.org/licenses/gpl-3.0.en.html).
However, icons do not comply with this license, &copy; Haruka Kurosaki.
