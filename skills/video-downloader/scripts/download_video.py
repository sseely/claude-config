#!/usr/bin/env python3
"""
YouTube Video Downloader
Downloads videos from YouTube with customizable quality and format options.
"""

import argparse
import shutil
import sys
import subprocess
import json


def check_yt_dlp():
    """Check if yt-dlp is installed, install if not."""
    try:
        subprocess.run(["yt-dlp", "--version"], capture_output=True, check=True)
        return
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass

    print("yt-dlp not found. Installing...")
    if shutil.which("pipx"):
        install_cmd = ["pipx", "install", "yt-dlp"]
    else:
        # Prefer pipx when available; fall back to pip with
        # --break-system-packages for externally-managed environments.
        install_cmd = [
            sys.executable, "-m", "pip", "install",
            "--break-system-packages", "yt-dlp",
        ]

    try:
        subprocess.run(install_cmd, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"❌ Error: failed to install yt-dlp: {e}")
        sys.exit(1)


def get_video_info(url):
    """Get information about the video without downloading."""
    try:
        result = subprocess.run(
            ["yt-dlp", "--dump-json", "--no-playlist", url],
            capture_output=True,
            text=True,
            check=True,
            timeout=30,
        )
    except subprocess.TimeoutExpired as e:
        print(f"❌ Error: timed out fetching video info: {e}")
        raise
    return json.loads(result.stdout)


def _build_ytdlp_command(url, output_path, quality, format_type, audio_only):
    """Build the yt-dlp command line for the given download options."""
    cmd = ["yt-dlp"]

    if audio_only:
        cmd.extend([
            "-x",  # Extract audio
            "--audio-format", "mp3",
            "--audio-quality", "0",  # Best quality
        ])
    else:
        # Video quality settings
        if quality == "best":
            format_string = "bestvideo+bestaudio/best"
        elif quality == "worst":
            format_string = "worstvideo+worstaudio/worst"
        else:
            # Specific resolution (e.g., 1080p, 720p)
            height = quality.replace("p", "")
            format_string = f"bestvideo[height<={height}]+bestaudio/best[height<={height}]"

        cmd.extend([
            "-f", format_string,
            "--merge-output-format", format_type,
        ])

    # Output template
    cmd.extend([
        "-o", f"{output_path}/%(title)s.%(ext)s",
        "--no-playlist",  # Don't download playlists by default
    ])

    cmd.append(url)
    return cmd


def _print_download_header(url, quality, format_type, audio_only, output_path):
    """Print the download configuration banner."""
    print(f"Downloading from: {url}")
    print(f"Quality: {quality}")
    print(f"Format: {'mp3 (audio only)' if audio_only else format_type}")
    print(f"Output: {output_path}\n")


def download_video(url, output_path="/mnt/user-data/outputs", quality="best", format_type="mp4", audio_only=False):
    """
    Download a YouTube video.

    Args:
        url: YouTube video URL
        output_path: Directory to save the video
        quality: Quality setting (best, 1080p, 720p, 480p, 360p, worst)
        format_type: Output format (mp4, webm, mkv, etc.)
        audio_only: Download only audio (mp3)
    """
    check_yt_dlp()

    cmd = _build_ytdlp_command(url, output_path, quality, format_type, audio_only)
    _print_download_header(url, quality, format_type, audio_only, output_path)

    try:
        # Get video info first
        info = get_video_info(url)
        print(f"Title: {info.get('title', 'Unknown')}")
        print(f"Duration: {info.get('duration', 0) // 60}:{info.get('duration', 0) % 60:02d}")
        print(f"Uploader: {info.get('uploader', 'Unknown')}\n")

        # Download the video
        subprocess.run(cmd, check=True)
        print("\n✅ Download complete!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error downloading video: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def _build_arg_parser():
    """Build the CLI argument parser."""
    parser = argparse.ArgumentParser(
        description="Download YouTube videos with customizable quality and format"
    )
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument(
        "-o", "--output",
        default="/mnt/user-data/outputs",
        help="Output directory (default: /mnt/user-data/outputs)"
    )
    parser.add_argument(
        "-q", "--quality",
        default="best",
        choices=["best", "1080p", "720p", "480p", "360p", "worst"],
        help="Video quality (default: best)"
    )
    parser.add_argument(
        "-f", "--format",
        default="mp4",
        choices=["mp4", "webm", "mkv"],
        help="Video format (default: mp4)"
    )
    parser.add_argument(
        "-a", "--audio-only",
        action="store_true",
        help="Download only audio as MP3"
    )
    return parser


def main():
    parser = _build_arg_parser()
    args = parser.parse_args()

    success = download_video(
        url=args.url,
        output_path=args.output,
        quality=args.quality,
        format_type=args.format,
        audio_only=args.audio_only
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
