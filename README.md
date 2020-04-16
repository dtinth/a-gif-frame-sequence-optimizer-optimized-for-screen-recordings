# A GIF frame sequence optimizer optimized for screen recordings

This is the companion code for my article, [**A GIF optimization algorithm for screen recordings — from 5 MB to 986 KB**](https://dev.to/dtinth/a-gif-optimization-algorithm-for-screen-recordings-from-5-mb-to-986-kb-143g).

## The optimization process

Prerequisites: Node.js, Yarn, FFmpeg, Gifsicle

1. Put GIF file at `tmp/input.gif`.

2. Convert GIF to PNG frames using FFmpeg:

   ```sh
   mkdir -p tmp/unoptimized-frames tmp/optimized-frames
   ffmpeg -i tmp/input.gif -y tmp/unoptimized-frames/%04d.png
   ```

3. Analyze and reduce dithering:

   ```sh
   yarn
   node main.js
   ```

4. Convert PNG frames back to GIF using FFmpeg:

   ```sh
   # Adapted from https://superuser.com/questions/556029/how-do-i-convert-a-video-to-gif-using-ffmpeg-with-reasonable-quality
   ffmpeg -r 8 -i tmp/optimized-frames/%04d.png -vf "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse=dither=none:diff_mode=rectangle" -y tmp/output.gif

   # To limit the amount of colors in the palette.
   ffmpeg -r 8 -i tmp/optimized-frames/%04d.png -vf "split[s0][s1];[s0]palettegen=max_colors=48[p];[s1][p]paletteuse=dither=none:diff_mode=rectangle" -y tmp/output.gif
   ```

   - Change `-r 8` to desired frame rate.

5. Perform further lossy optimization using Gifsicle:

   ```sh
   gifsicle --lossy=200 --optimize=3 tmp/output.gif -o tmp/output.optimized.gif
   ```
