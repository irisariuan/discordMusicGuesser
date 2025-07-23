# Music Guess Bot 🎵

A Discord bot that creates interactive music guessing games using YouTube playlists. Players listen to short audio clips and try to guess the songs!

## Features

- **Interactive Music Guessing Games**: Play clips from YouTube playlists and let users guess the songs
- **Customizable Game Settings**:
    - Configure number of clips per song (1-10)
    - Adjust clip length (0.1-10 seconds)
- **Game Controls**:
    - Skip to next clip
    - Replay current clip
    - Go back to previous clip
    - Reveal song answer
    - Play full song
- **Voice Channel Integration**: Plays audio directly in Discord voice channels
- **Playlist Support**: Uses YouTube playlists as song sources

## Commands

- `/start <url> [clipnumber] [cliplength]` - Start a new music guessing game
    - `url`: YouTube playlist URL (required)
    - `clipnumber`: Number of clips to play per song (default: 3, range: 1-10)
    - `cliplength`: Length of each clip in seconds (default: 2, range: 0.1-10)
- `/stop` - Stop the current game session
- `/next` - Play the next clip or song
- `/replay` - Replay the current clip
- `/hint` - Get a hint for the current song
- `/reveal` - Reveal the current song
- `/repick` - Pick a new random song from the playlist
- `/play-full-song` - Play the full version of the current song
- `/volume` - Adjust playback volume

## Installation

1. Clone the repository:

```bash
git clone https://github.com/irisariuan/discordMusicGuesser.git
cd discordMusicGuesser
```

2. Install dependencies:

Npm

```bash
npm install
```

Bun

```bash
bun install
```

3. Create a `.env` file in the root directory:

```env
TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
DEV_TOKEN=your_development_bot_token (optional)
DEV_CLIENT_ID=your_development_client_id (optional)
```

4. Set up your Discord bot:
    - Create a new application at [Discord Developer Portal](https://discord.com/developers/applications)
    - Create a bot and copy the token
    - Enable the following bot permissions:
        - Send Messages
        - Use Slash Commands
        - Connect to Voice Channels
        - Speak in Voice Channels
        - Use Voice Activity

5. Install prerequisites

## Prerequisites

- Install [Bun](https://bun.sh) or [Node.js](https://nodejs.org/) runtime (Node.js is recommended for better compatibility)
- Install [FFmpeg](https://ffmpeg.org/download.html) for audio processing (required for voice channel audio playback)
- Install [FFprobe](https://ffmpeg.org/download.html) for audio file metadata extraction (required for clip length validation)
- Install [yt-dlp](https://github.com/yt-dlp/yt-dlp) for downloading YouTube audio (required for playing clips)

## Usage

1. Start the bot:

Bun
```bash
bun run index.ts
```
or Node.js
```bash
npx tsc # Compile TypeScript files
node dist/index.js
```

2. Invite the bot to your Discord server with the required permissions

3. Join a voice channel and run `/start` with a YouTube playlist URL

4. Use the interactive buttons or commands to control the game

## Command Line Flags

- `--refreshCommands` or `-R`: Force refresh slash commands on startup
- `--dev` or `-D`: Run in development mode (uses `DEV_TOKEN` and `DEV_CLIENT_ID` from `.env`)
- `--log` or `-L`: Enable detailed logging (logs to `logs/` directory)
- `--no_warn` or `-N`: Suppress warning messages in the console
- `--no_important` or `-N`: Suppress important messages in the console
- `--debug` or `-B` or `-D`: Enable debug mode (logs all messages, including debug information)

## Development

The project uses TypeScript and is structured as follows:

- `commands/` - Slash command implementations
- `lib/` - Core bot functionality
    - `voice/` - Voice channel and audio handling
    - `youtube/` - YouTube API integration
    - `commands/` - Command registration and management
- `logs/` - Application logs
- `downloads/` - Temporary audio file storage

To run in development mode, references the Command Line Flags session and provide `DEV_TOKEN` and `DEV_CLIENT_ID`.

## Contributing

Welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them
4. Open a pull request with a clear description of your changes

## License

This project is private and not licensed for public use.
Personally use and edit is allowed, but redistribution or commercial use is not permitted without explicit permission.

## Support

If you encounter issues:

1. Check the console logs for error messages
2. Ensure your bot has the required permissions
3. Verify your YouTube playlist is public and contains valid videos
4. Make sure you're in a voice channel when starting a game
5. If you need help, open an issue on the GitHub repository with your log files and a description of the problem

---

_Built with ❤️ using Bun and Discord.js_
