// @ts-check

const glob = require('glob')
const jimp = require('jimp')
const util = require('util')

async function main() {
  const images = []

  // Load the images
  console.time('Read images')
  for (const file of glob.sync('./tmp/unoptimized-frames/*.png').sort()) {
    images.push(await jimp.read(file))
    console.log('Read', file)
    // if (images.length > 40) break
  }
  console.timeEnd('Read images')

  const {
    width,
    height,
    data: { length: totalLength },
  } = images[0].bitmap
  let lastPercentage

  console.time('Process images')
  images[0].scan(0, 0, width, height, (x, y, idx) => {
    const percentage = Math.round((idx * 100) / totalLength)
    if (percentage !== lastPercentage) {
      lastPercentage = percentage
      console.log('Process', percentage + '%')
    }
    let section
    const flush = () => {
      if (section) {
        const { count, sum, start } = section
        const end = start + count
        const ar = sum[0] / count
        const ag = sum[1] / count
        const ab = sum[2] / count
        let min
        let minDist = Infinity
        for (let i = start; i < end; i++) {
          const frameData = images[i].bitmap.data
          let dist = Math.hypot(
            frameData[idx] - ar,
            frameData[idx + 1] - ag,
            frameData[idx + 2] - ab,
          )
          if (!min || dist < minDist) {
            minDist = dist
            min = frameData
          }
        }
        const [r, g, b] = min.slice(idx, idx + 3)
        for (let i = start; i < end; i++) {
          const frameData = images[i].bitmap.data
          frameData[idx] = r
          frameData[idx + 1] = g
          frameData[idx + 2] = b
        }
        section = null
      }
    }
    images.forEach((image, i) => {
      // const imagesToConsider = images.slice(Math.max(0, i - 2), i + 1)
      // const r =
      //   imagesToConsider.reduce((a, m) => a + m.bitmap.data[idx], 0) /
      //   imagesToConsider.length
      // const g =
      //   imagesToConsider.reduce((a, m) => a + m.bitmap.data[idx + 1], 0) /
      //   imagesToConsider.length
      // const b =
      //   imagesToConsider.reduce((a, m) => a + m.bitmap.data[idx + 2], 0) /
      //   imagesToConsider.length
      const [r, g, b] = image.bitmap.data.slice(idx, idx + 3)
      const [cr, cg, cb] = image.bitmap.data.slice(idx, idx + 3)
      if (section) {
        const [r0, g0, b0] = section.base
        if (Math.hypot(r - r0, g - g0, b - b0) >= 18) {
          flush()
        }
      }
      if (!section) {
        section = {
          start: i,
          base: [cr, cg, cb],
          sum: [cr, cg, cb],
          count: 1,
        }
      } else {
        section.count++
        section.sum[0] += cr
        section.sum[1] += cg
        section.sum[2] += cb
      }
    })
    flush()
  })
  console.timeEnd('Process images')

  console.time('Write images')
  for (const [i, image] of images.entries()) {
    const out = util.format(
      'tmp/optimized-frames/%s.png',
      i.toString().padStart(4, '0'),
    )
    console.log('Write', out)
    await image.writeAsync(out)
  }
  console.timeEnd('Write images')
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
