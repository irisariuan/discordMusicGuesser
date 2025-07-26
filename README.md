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
    - Get hints with randomized song options
- **Voice Channel Integration**: Plays audio directly in Discord voice channels
- **Playlist Support**: Uses YouTube playlists as song sources
- **Smart Caching**: Caches video metadata and titles for improved performance
- **Enhanced Logging**: Comprehensive logging system with configurable levels
- **Runtime Management**: Reload commands without restarting the bot

## Commands

- `/start <url> [clipnumber] [cliplength]` - Start a new music guessing game
    - `url`: YouTube playlist URL (required)
    - `clipnumber`: Number of clips to play per song (default: 3, range: 1-10)
    - `cliplength`: Length of each clip in seconds (default: 2, range: 0.1-10)
- `/stop` - Stop the current game session
- `/next` - Play the next clip or song
- `/replay` - Replay the current clip
- `/hint` - Get a hint for the current song (shows multiple song options including the correct one)
- `/reveal` - Reveal the current song (private message)
- `/repick` - Pick a new random song from the playlist
- `/playfullsong` - Play the full version of the current song
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
OPENROUTER_TOKEN=your_openrouter_api_token (optional, for title processing)
DEV_OPENROUTER_TOKEN=your_dev_openrouter_api_token (optional)
MODEL=your_ai_model (optional, for title processing)
DEV_MODEL=your_dev_ai_model (optional)
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
- `--no_important`: Suppress important messages in the console
- `--debug` or `-B`: Enable debug mode (logs all messages, including debug information)
- `--noTitleCleaning`: Disable AI-powered title cleaning and processing (use raw YouTube titles)

## Runtime Commands

While the bot is running, you can use these console commands:

- `/exit` - Gracefully shut down the bot, finish downloads, and save cached data
- `/reload` - Reload all commands without restarting the bot

## Development

The project uses TypeScript and is structured as follows:

- `commands/` - Slash command implementations
- `lib/` - Core bot functionality
    - `discord/` - Discord interaction handling and UI components
    - `voice/` - Voice channel and audio handling
    - `youtube/` - YouTube API integration and lyrics processing
    - `commands/` - Command registration and management
    - `env/` - Environment variable and command line flag handling
    - `utils/` - Utility functions and formatting
- `data/` - Cached titles and metadata storage
- `logs/` - Application logs (organized by date and development mode)
- `downloads/` - Temporary audio file storage

### Key Features

- **Smart Caching**: Video metadata is cached using `node-cache` for improved performance
- **Title Processing**: Optional AI-powered title cleaning and processing via OpenRouter API
- **Enhanced Error Handling**: Comprehensive error handling with detailed logging
- **Modular Architecture**: Well-organized codebase with clear separation of concerns

To run in development mode, use the `--dev` flag and provide `DEV_TOKEN` and `DEV_CLIENT_ID` in your `.env` file.

## Dependencies

### Core Dependencies
- `discord.js` - Discord API wrapper
- `@discordjs/voice` - Voice channel support
- `@discordjs/opus` - Audio encoding
- `yt-search` - YouTube search and metadata
- `node-cache` - In-memory caching
- `dotenv` - Environment variable management

### Utility Dependencies
- `jsdom` - DOM manipulation for web scraping
- `colors` - Console output coloring
- `glob` - File pattern matching
- `zod` - Schema validation

## Contributing

Welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them
4. Test your changes thoroughly
5. Open a pull request with a clear description of your changes

## License

This project is private and not licensed for public use.
Personal use and editing is allowed, but redistribution or commercial use is not permitted without explicit permission.

## Support

If you encounter issues:

1. Check the console logs for error messages (enable logging with `--log` flag)
2. Ensure your bot has the required permissions
3. Verify your YouTube playlist is public and contains valid videos
4. Make sure you're in a voice channel when starting a game
5. Check that all prerequisites (FFmpeg, yt-dlp) are properly installed
6. If you need help, open an issue on the GitHub repository with your log files and a description of the problem

## Troubleshooting

### Common Issues

- **"Failed to fetch videos from playlist"**: Ensure the playlist is public and the URL is correct
- **Audio not playing**: Check that FFmpeg and yt-dlp are installed and accessible in your PATH
- **Commands not appearing**: Try using the `--refreshCommands` flag when starting the bot
- **Permission errors**: Verify the bot has all required Discord permissions in your server

---

_Built with ❤️ using Bun/Node.js, Discord.js, and yt-search_