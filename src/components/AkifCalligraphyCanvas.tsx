// File: src/components/AkifCalligraphyCanvas.tsx
import { useEffect, useRef } from 'react'
import type { PortfolioTheme } from '../hooks/useTheme'

export type WritingStage = 'load' | 'hint' | 'writing' | 'stamped'

type Streak = { d: string; w: number; o: number; kind: 'tone' | 'gap' }
type Hair = { d: string; w: number; o: number }
type Speck = { x: number; y: number; r: number; o: number }

type StrokeSpec = {
  id: string
  /** Spine path used by the progressive reveal mask and the brush-tip follower */
  spine: string
  /** Mask brush width along this spine */
  maskWidth: number
  /** Relative share of the total 0..1 writing progress */
  weight: number
  /** Variable-width brush silhouette with pointed, tapered ends */
  body: string
  /** Fine bristle streaks that follow the stroke direction */
  streaks: Streak[]
  /** Dry-brush hairs that leave the stroke end */
  hairs: Hair[]
  /** Tiny chalk specks near the stroke end */
  specks: Speck[]
}

/**
 * Authentic AKIF Sumi-e Calligraphy Artwork matching Image 2 Reference.
 * Direct vector extraction from reference with authentic dry-brush feibai bristle teeth,
 * chiseled brush-press apex and crossbar on A, flared eagle-wing upper arm on K,
 * expansive sweeping lower blade on K reaching under I, bold slanted dagger on I,
 * sweeping top cap on F, and organic wave flick into the brush tip at (554, 234).
 */
const CALLIGRAPHY_STROKES: StrokeSpec[] = [
  // 1. Letter 'A' — Bold chiseled apex, heavy diagonal legs, sweeping crossbar, frayed dry-brush feet
  {
    id: 'a-letter',
    weight: 0.28,
    maskWidth: 340,
    spine: 'M 196 74 C 156 156 106 258 32 386',
    body: 'M 214.3 81.2 L 207.1 81.2 L 200.0 78.3 L 191.4 79.7 L 187.1 82.6 L 181.4 98.2 L 175.7 108.2 L 170.0 115.3 L 168.6 119.6 L 165.7 122.5 L 162.9 122.5 L 154.3 132.4 L 152.9 135.3 L 152.9 138.1 L 141.4 156.6 L 142.9 159.5 L 141.4 162.3 L 137.1 166.6 L 132.9 175.1 L 134.3 179.4 L 128.6 185.1 L 125.7 192.2 L 122.9 195.1 L 121.4 195.1 L 118.6 205.0 L 110.0 219.3 L 105.7 223.5 L 95.7 226.4 L 90.0 229.2 L 88.6 226.4 L 74.3 233.5 L 70.0 232.1 L 58.6 242.1 L 55.7 252.0 L 48.6 253.4 L 44.3 256.3 L 57.1 253.4 L 57.1 259.1 L 54.3 263.4 L 60.0 260.6 L 62.9 263.4 L 62.9 264.8 L 67.1 266.3 L 72.9 270.5 L 85.7 266.3 L 85.7 269.1 L 82.9 274.8 L 78.6 277.6 L 75.7 281.9 L 75.7 289.0 L 70.0 293.3 L 68.6 296.2 L 68.6 300.4 L 65.7 304.7 L 64.3 311.8 L 61.4 311.8 L 60.0 314.7 L 61.4 317.5 L 57.1 320.4 L 47.1 338.9 L 47.1 341.7 L 48.6 344.6 L 40.0 360.2 L 41.4 357.4 L 45.7 354.5 L 50.0 344.6 L 52.9 341.7 L 55.7 341.7 L 58.6 338.9 L 60.0 338.9 L 64.3 333.2 L 68.6 334.6 L 67.1 330.3 L 72.9 323.2 L 72.9 321.8 L 77.1 321.8 L 78.6 318.9 L 81.4 317.5 L 85.7 311.8 L 91.4 300.4 L 95.7 296.2 L 97.1 291.9 L 102.9 284.8 L 101.4 280.5 L 105.7 280.5 L 102.9 279.1 L 104.3 274.8 L 108.6 274.8 L 105.7 272.0 L 110.0 267.7 L 111.4 263.4 L 115.7 263.4 L 115.7 256.3 L 117.1 253.4 L 121.4 253.4 L 125.7 249.2 L 134.3 246.3 L 137.1 242.1 L 161.4 230.7 L 167.1 232.1 L 172.9 229.2 L 174.3 225.0 L 177.1 225.0 L 181.4 222.1 L 184.3 225.0 L 187.1 240.6 L 187.1 250.6 L 191.4 270.5 L 195.7 277.6 L 195.7 281.9 L 197.1 286.2 L 201.4 290.5 L 201.4 297.6 L 205.7 303.3 L 211.4 307.5 L 211.4 313.2 L 212.9 316.1 L 221.4 318.9 L 222.9 323.2 L 222.9 276.2 L 220.0 272.0 L 220.0 269.1 L 221.4 267.7 L 221.4 262.0 L 217.1 266.3 L 215.7 244.9 L 220.0 242.1 L 220.0 239.2 L 215.7 237.8 L 218.6 213.6 L 221.4 210.7 L 225.7 210.7 L 228.6 209.3 L 234.3 203.6 L 237.1 203.6 L 237.1 190.8 L 234.3 186.5 L 237.1 186.5 L 231.4 186.5 L 228.6 189.4 L 218.6 187.9 L 220.0 172.3 L 215.7 170.9 Z M 185.7 152.4 L 185.7 160.9 L 182.9 168.0 L 184.3 170.9 L 181.4 199.3 L 171.4 202.2 L 168.6 200.8 L 158.6 203.6 L 155.7 206.5 L 148.6 205.0 L 155.7 196.5 L 158.6 190.8 L 160.0 185.1 L 164.3 179.4 L 164.3 176.6 L 168.6 170.9 L 168.6 168.0 L 172.9 160.9 L 180.0 152.4 Z',
    streaks: [],
    hairs: [
      { d: 'M 68 338 C 50 366 32 392 16 410', w: 1.6, o: 0.75 },
      { d: 'M 52 366 C 38 388 24 406 12 414', w: 1.2, o: 0.65 },
    ],
    specks: [
      { x: 18, y: 412, r: 1.2, o: 0.5 },
    ],
  },

  // 2. Letter 'K' — Slanted backbone, flared eagle-wing upper arm, sweeping curved blade under I
  {
    id: 'k-letter',
    weight: 0.28,
    maskWidth: 340,
    spine: 'M 260 100 C 246 186 230 230 388 350',
    body: 'M 224.3 279.1 L 224.3 321.8 L 231.4 328.9 L 232.9 331.8 L 232.9 336.0 L 235.7 338.9 L 235.7 336.0 L 231.4 330.3 L 230.0 320.4 L 234.3 320.4 L 231.4 314.7 L 227.1 299.0 L 227.1 291.9 L 224.3 284.8 Z M 287.1 109.6 L 284.3 111.1 L 282.9 113.9 L 277.1 115.3 L 275.7 119.6 L 277.1 122.5 L 272.9 129.6 L 272.9 135.3 L 270.0 139.5 L 270.0 142.4 L 272.9 143.8 L 268.6 146.7 L 265.7 152.4 L 265.7 156.6 L 261.4 165.2 L 257.1 179.4 L 260.0 182.3 L 255.7 190.8 L 251.4 190.8 L 250.0 189.4 L 238.6 190.8 L 238.6 193.6 L 245.7 193.6 L 247.1 190.8 L 255.7 192.2 L 254.3 197.9 L 250.0 202.2 L 244.3 202.2 L 238.6 199.3 L 238.6 203.6 L 241.4 203.6 L 244.3 205.0 L 245.7 202.2 L 250.0 205.0 L 248.6 212.2 L 245.7 219.3 L 247.1 229.2 L 244.3 237.8 L 241.4 239.2 L 242.9 243.5 L 240.0 247.7 L 237.1 264.8 L 238.6 269.1 L 237.1 274.8 L 240.0 276.2 L 240.0 279.1 L 237.1 281.9 L 240.0 281.9 L 244.3 287.6 L 241.4 291.9 L 245.7 293.3 L 242.9 299.0 L 245.7 300.4 L 245.7 303.3 L 245.7 299.0 L 254.3 287.6 L 257.1 280.5 L 260.0 264.8 L 265.7 250.6 L 262.9 249.2 L 265.7 236.4 L 268.6 233.5 L 272.9 233.5 L 277.1 237.8 L 280.0 237.8 L 287.1 246.3 L 291.4 247.7 L 291.4 250.6 L 300.0 254.9 L 310.0 263.4 L 314.3 263.4 L 318.6 267.7 L 324.3 269.1 L 328.6 273.4 L 331.4 273.4 L 334.3 276.2 L 337.1 274.8 L 345.7 279.1 L 355.7 286.2 L 357.1 283.3 L 361.4 281.9 L 367.1 286.2 L 374.3 287.6 L 377.1 290.5 L 385.7 291.9 L 388.6 294.7 L 391.4 294.7 L 398.6 299.0 L 401.4 307.5 L 401.4 310.4 L 397.1 313.2 L 394.3 318.9 L 395.7 323.2 L 390.0 327.5 L 388.6 330.3 L 390.0 333.2 L 385.7 338.9 L 385.7 343.1 L 377.1 357.4 L 384.3 346.0 L 390.0 340.3 L 392.9 333.2 L 397.1 330.3 L 400.0 323.2 L 405.7 320.4 L 408.6 316.1 L 408.6 293.3 L 405.7 297.6 L 400.0 297.6 L 397.1 296.2 L 395.7 290.5 L 391.4 290.5 L 385.7 286.2 L 384.3 286.2 L 387.1 283.3 L 384.3 280.5 L 381.4 283.3 L 377.1 279.1 L 377.1 276.2 L 374.3 273.4 L 375.7 260.6 L 378.6 260.6 L 378.6 257.7 L 371.4 257.7 L 371.4 260.6 L 374.3 263.4 L 371.4 272.0 L 360.0 262.0 L 357.1 262.0 L 351.4 254.9 L 341.4 246.3 L 334.3 244.9 L 335.7 242.1 L 325.7 232.1 L 317.1 225.0 L 314.3 225.0 L 304.3 213.6 L 300.0 212.2 L 292.9 206.5 L 292.9 200.8 L 304.3 196.5 L 311.4 195.1 L 308.6 197.9 L 312.9 193.6 L 321.4 190.8 L 330.0 182.3 L 337.1 178.0 L 342.9 172.3 L 342.9 169.4 L 345.7 166.6 L 348.6 166.6 L 351.4 163.7 L 351.4 119.6 L 347.1 123.9 L 347.1 126.7 L 337.1 135.3 L 337.1 139.5 L 334.3 139.5 L 328.6 143.8 L 321.4 153.8 L 308.6 166.6 L 308.6 170.9 L 297.1 180.8 L 298.6 183.7 L 294.3 186.5 L 291.4 190.8 L 285.7 192.2 L 282.9 196.5 L 280.0 192.2 L 282.9 190.8 L 285.7 185.1 L 285.7 182.3 L 290.0 175.1 L 294.3 172.3 L 297.1 165.2 L 297.1 160.9 L 298.6 156.6 L 301.4 153.8 L 302.9 145.2 L 308.6 129.6 L 305.7 125.3 L 298.6 121.0 L 295.7 118.2 L 295.7 115.3 L 290.0 115.3 L 287.1 113.9 Z M 301.4 192.2 L 297.1 196.5 L 290.0 200.8 L 285.7 197.9 L 288.6 195.1 L 292.9 193.6 L 297.1 189.4 Z M 217.1 82.6 L 217.1 170.9 L 220.0 169.4 L 217.1 168.0 L 217.1 163.7 L 218.6 162.3 L 220.0 155.2 L 222.9 153.8 L 220.0 152.4 L 220.0 149.5 L 221.4 148.1 L 222.9 142.4 L 225.7 142.4 L 225.7 138.1 L 228.6 131.0 L 228.6 121.0 L 230.0 116.8 L 232.9 115.3 L 231.4 112.5 L 234.3 108.2 L 234.3 103.9 L 231.4 94.0 L 224.3 88.3 L 220.0 88.3 L 220.0 85.4 Z',
    streaks: [],
    hairs: [
      { d: 'M 358 106 C 372 90 388 76 398 66', w: 1.4, o: 0.7 },
      { d: 'M 368 332 C 388 346 408 358 424 366', w: 1.6, o: 0.75 },
    ],
    specks: [
      { x: 426, y: 368, r: 1.2, o: 0.5 },
    ],
  },

  // 3. Letter 'I' — Bold slanted dagger with chiseled angled top cut and tapered blade
  {
    id: 'i-letter',
    weight: 0.16,
    maskWidth: 220,
    spine: 'M 392 110 C 374 186 354 256 360 330',
    body: 'M 404.3 115.3 L 401.4 118.2 L 397.1 128.1 L 397.1 133.8 L 387.1 158.0 L 384.3 178.0 L 381.4 179.4 L 382.9 183.7 L 380.0 192.2 L 377.1 192.2 L 381.4 195.1 L 378.6 197.9 L 377.1 197.9 L 374.3 206.5 L 375.7 210.7 L 372.9 220.7 L 370.0 225.0 L 368.6 233.5 L 370.0 242.1 L 368.6 244.9 L 371.4 256.3 L 380.0 256.3 L 390.0 239.2 L 394.3 226.4 L 392.9 219.3 L 398.6 203.6 L 402.9 200.8 L 401.4 196.5 L 405.7 190.8 L 408.6 180.8 L 408.6 119.6 Z M 357.1 112.5 L 352.9 112.5 L 352.9 163.7 L 355.7 160.9 L 357.1 156.6 L 360.0 153.8 L 362.9 153.8 L 365.7 150.9 L 368.6 145.2 L 371.4 143.8 L 374.3 139.5 L 374.3 131.0 L 370.0 123.9 L 367.1 122.5 L 367.1 119.6 L 364.3 119.6 L 358.6 115.3 Z',
    streaks: [],
    hairs: [
      { d: 'M 356 310 C 354 326 352 342 350 354', w: 1.3, o: 0.65 },
    ],
    specks: [
      { x: 350, y: 358, r: 1.0, o: 0.4 },
    ],
  },

  // 4. Letter 'F' — Sweeping dry-brush horizontal cap, tall slanted spine, wave flick to brush tip
  {
    id: 'f-letter',
    weight: 0.28,
    maskWidth: 380,
    spine: 'M 416 85 C 474 76 500 180 554 234',
    body: 'M 592.9 220.7 L 591.4 202.2 L 590.0 202.2 L 587.1 199.3 L 587.1 205.0 L 581.4 205.0 L 584.3 206.5 L 584.3 210.7 L 578.6 210.7 L 574.3 209.3 L 568.6 202.2 L 561.4 206.5 L 564.3 212.2 L 561.4 212.2 L 555.7 209.3 L 562.9 213.6 L 570.0 213.6 L 568.6 217.8 L 572.9 220.7 L 575.7 219.3 L 580.0 222.1 L 587.1 222.1 L 588.6 220.7 Z M 570.0 213.6 L 572.9 210.7 L 575.7 215.0 L 572.9 215.0 Z M 415.7 118.2 L 412.9 118.2 L 410.0 119.6 L 411.4 179.4 L 412.9 172.3 L 417.1 169.4 L 418.6 166.6 L 418.6 163.7 L 421.4 159.5 L 421.4 155.2 L 422.9 150.9 L 427.1 145.2 L 427.1 142.4 L 430.0 141.0 L 430.0 135.3 L 424.3 125.3 L 420.0 125.3 L 417.1 122.5 Z M 608.6 91.1 L 600.0 88.3 L 600.0 85.4 L 585.7 82.6 L 580.0 84.0 L 578.6 81.2 L 575.7 81.2 L 574.3 84.0 L 567.1 84.0 L 565.7 81.2 L 560.0 81.2 L 551.4 84.0 L 541.4 84.0 L 531.4 86.9 L 518.6 85.4 L 517.1 86.9 L 510.0 86.9 L 492.9 92.5 L 485.7 92.5 L 474.3 101.1 L 470.0 102.5 L 462.9 101.1 L 452.9 106.8 L 450.0 105.4 L 442.9 112.5 L 440.0 122.5 L 435.7 122.5 L 441.4 123.9 L 445.7 132.4 L 445.7 138.1 L 448.6 139.5 L 451.4 138.1 L 452.9 141.0 L 464.3 136.7 L 464.3 143.8 L 460.0 148.1 L 457.1 153.8 L 455.7 160.9 L 454.3 162.3 L 454.3 172.3 L 450.0 182.3 L 447.1 185.1 L 444.3 185.1 L 441.4 183.7 L 437.1 186.5 L 431.4 186.5 L 424.3 195.1 L 422.9 202.2 L 418.6 202.2 L 410.0 206.5 L 415.7 203.6 L 425.7 205.0 L 427.1 209.3 L 425.7 215.0 L 431.4 219.3 L 437.1 219.3 L 437.1 223.5 L 435.7 227.8 L 432.9 226.4 L 424.3 244.9 L 420.0 257.7 L 421.4 262.0 L 420.0 263.4 L 420.0 267.7 L 414.3 277.6 L 414.3 281.9 L 410.0 289.0 L 410.0 313.2 L 412.9 311.8 L 415.7 313.2 L 418.6 310.4 L 418.6 307.5 L 421.4 306.1 L 424.3 301.9 L 425.7 296.2 L 432.9 289.0 L 435.7 284.8 L 438.6 276.2 L 441.4 273.4 L 445.7 263.4 L 445.7 257.7 L 448.6 256.3 L 451.4 252.0 L 451.4 249.2 L 452.9 246.3 L 451.4 242.1 L 452.9 237.8 L 458.6 226.4 L 462.9 226.4 L 462.9 223.5 L 465.7 220.7 L 467.1 212.2 L 470.0 206.5 L 472.9 203.6 L 478.6 202.2 L 487.1 197.9 L 488.6 200.8 L 491.4 196.5 L 495.7 195.1 L 508.6 196.5 L 510.0 193.6 L 515.7 192.2 L 528.6 192.2 L 534.3 189.4 L 535.7 192.2 L 541.4 192.2 L 541.4 195.1 L 538.6 197.9 L 534.3 197.9 L 541.4 199.3 L 545.7 202.2 L 545.7 197.9 L 560.0 200.8 L 557.1 200.8 L 552.9 192.2 L 555.7 189.4 L 561.4 189.4 L 561.4 192.2 L 560.0 187.9 L 554.3 185.1 L 555.7 180.8 L 562.9 183.7 L 567.1 182.3 L 564.3 179.4 L 561.4 179.4 L 552.9 175.1 L 551.4 170.9 L 544.3 169.4 L 542.9 172.3 L 540.0 172.3 L 537.1 170.9 L 535.7 168.0 L 532.9 166.6 L 531.4 169.4 L 520.0 169.4 L 517.1 166.6 L 512.9 166.6 L 494.3 169.4 L 481.4 173.7 L 477.1 172.3 L 480.0 168.0 L 480.0 165.2 L 484.3 155.2 L 488.6 152.4 L 488.6 146.7 L 491.4 146.7 L 491.4 143.8 L 497.1 131.0 L 497.1 125.3 L 498.6 122.5 L 502.9 119.6 L 524.3 112.5 L 530.0 112.5 L 531.4 113.9 L 535.7 113.9 L 537.1 109.6 L 541.4 109.6 L 542.9 111.1 L 558.6 109.6 L 570.0 105.4 L 578.6 105.4 L 587.1 101.1 L 594.3 101.1 L 595.7 99.7 L 600.0 99.7 L 595.7 98.2 L 594.3 94.0 L 597.1 89.7 L 602.9 91.1 L 604.3 89.7 Z M 414.3 294.7 L 418.6 296.2 L 414.3 304.7 L 411.4 301.9 L 411.4 299.0 L 414.3 296.2 Z M 585.7 86.9 L 587.1 84.0 L 595.7 88.3 Z',
    streaks: [],
    hairs: [
      { d: 'M 588 78 C 606 80 622 84 636 88', w: 1.4, o: 0.7 },
      { d: 'M 408 320 C 404 336 400 348 396 358', w: 1.4, o: 0.65 },
    ],
    specks: [
      { x: 638, y: 90, r: 1.2, o: 0.5 },
    ],
  },
]

type AkifCalligraphyCanvasProps = {
  theme: PortfolioTheme
  stage: WritingStage
  progress: number
  velocity: number
  hintVisible: boolean
  sealStamped: boolean
  isMobile: boolean
  pointerInside: boolean
  pointerPos: { x: number; y: number }
}

/** Deterministic dry-brush foam stipple cluster between F's middle bar and the brush bristles */
const DRY_BRUSH_FOAM = (() => {
  let seed = 19
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  return Array.from({ length: 42 }, (_, idx) => {
    const t = idx / 41
    const baseX = 488 + t * 66 + (rand() - 0.5) * 8
    const baseY = 208 + t * 26 + (rand() - 0.5) * 14
    return {
      x: baseX,
      y: baseY,
      r: 0.7 + rand() * 2.1,
      o: 0.35 + rand() * 0.6,
    }
  })
})()

/** Deterministic fine watercolor spatter droplets around the outer ink wash cloud */
const WASH_SPATTER = (() => {
  let s = 11
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  return Array.from({ length: 36 }, () => {
    const a = r() * Math.PI * 2
    const d = 145 + r() * 140
    return {
      x: 265 + Math.cos(a) * d * 1.32,
      y: 212 + Math.sin(a) * d * 0.78,
      r: 1.1 + r() * 3.4,
      o: 0.16 + r() * 0.32,
    }
  })
})()

export function AkifCalligraphyCanvas({
  theme,
  stage,
  progress,
  velocity,
  hintVisible,
  sealStamped,
  isMobile,
  pointerInside,
  pointerPos,
}: AkifCalligraphyCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const spineRefs = useRef<(SVGPathElement | null)[]>([])
  const maskRefs = useRef<(SVGPathElement | null)[]>([])
  const lengthsRef = useRef<number[]>([])
  const brushTipGroupRef = useRef<SVGGElement>(null)
  const trailPathRef = useRef<SVGPathElement>(null)
  const trailPointsRef = useRef<Array<{ x: number; y: number }>>([])

  const isDark = theme === 'dark'
  const inkColor = isDark ? '#EDE7D9' : '#203359'
  const innerToneColor = isDark ? '#DFD7C4' : '#4A6396'
  const bgCutoutColor = isDark ? '#12161E' : '#DCE4F2'
  const sealColor = isDark ? '#E0583E' : '#C8432C'
  const sealTextColor = isDark ? '#F5EFE2' : '#FAF6EE'

  // Measure exact SVG path lengths on mount
  useEffect(() => {
    lengthsRef.current = CALLIGRAPHY_STROKES.map((_, idx) => {
      const el = spineRefs.current[idx]
      if (!el) return 300
      try {
        return el.getTotalLength()
      } catch {
        return 300
      }
    })
  }, [])

  // Update stroke-dashoffset masks & brush tip position via direct DOM updates
  useEffect(() => {
    const clampedProgress = Math.max(0, Math.min(1, progress))
    let accumulatedWeight = 0
    let activeIdx = CALLIGRAPHY_STROKES.length - 1
    let activeLocalProgress = 1

    for (let i = 0; i < CALLIGRAPHY_STROKES.length; i++) {
      const spec = CALLIGRAPHY_STROKES[i]
      const start = accumulatedWeight
      const end = start + spec.weight
      accumulatedWeight = end

      const local =
        clampedProgress <= start
          ? 0
          : clampedProgress >= end
            ? 1
            : (clampedProgress - start) / spec.weight

      if (clampedProgress >= start && clampedProgress <= end) {
        activeIdx = i
        activeLocalProgress = local
      }

      const maskEl = maskRefs.current[i]
      const len = lengthsRef.current[i] || 300
      if (maskEl) {
        maskEl.style.strokeDasharray = `${len + 28}`
        maskEl.style.strokeDashoffset = `${(1 - local) * (len + 28)}`
        const velocityWidthMod = 1 - Math.min(0.2, velocity * 0.14)
        maskEl.style.strokeWidth = `${(spec.maskWidth * velocityWidthMod).toFixed(1)}`
      }
    }

    const tipGroup = brushTipGroupRef.current
    if (!tipGroup) return

    if (clampedProgress <= 0.002) {
      tipGroup.style.opacity = '0'
      trailPointsRef.current = []
      if (trailPathRef.current) trailPathRef.current.setAttribute('d', '')
      return
    }

    const activeSpine = spineRefs.current[activeIdx]
    const activeLen = lengthsRef.current[activeIdx] || 300

    if (activeSpine) {
      try {
        // When complete, rest the brush tip at (554, 234) angled steeply (~28 deg local = ~60 deg shaft angle matching Reference 3 & 4)
        if (clampedProgress >= 0.995) {
          tipGroup.style.opacity = '1'
          tipGroup.setAttribute('transform', 'translate(554, 234) rotate(0)')
        } else {
          const dist = Math.max(0, Math.min(activeLen, activeLocalProgress * activeLen))
          const pt = activeSpine.getPointAtLength(dist)
          const tilt = Math.min(12, velocity * 8)
          tipGroup.style.opacity = '1'
          tipGroup.setAttribute(
            'transform',
            `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}) rotate(${tilt.toFixed(1)})`,
          )

          const pts = trailPointsRef.current
          pts.push({ x: pt.x, y: pt.y })
          if (pts.length > 10) pts.shift()
          if (trailPathRef.current && pts.length > 1) {
            const d = pts
              .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
              .join(' ')
            trailPathRef.current.setAttribute('d', d)
          }
        }
      } catch {
        // Fallback if SVG path is not ready
      }
    }
  }, [progress, velocity])

  const dryBrushOpacity = Math.min(1, 0.8 + velocity * 0.2)

  return (
    <div className="akif-canvas-stage">
      <svg
        ref={svgRef}
        className="akif-calligraphy-svg"
        viewBox="0 0 680 430"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="AKIF interactive brush calligraphy artwork"
      >
        <defs>
          {/* Distressed carved stamp filter for the vermilion AK / IF seal */}
          <filter id="akifSealRough" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -7 5.6" result="holes" />
            <feComposite in="d" in2="holes" operator="in" />
          </filter>

          {/* Crisp directional sumi-e dry-brush bristle edge filter */}
          <filter id="akifCrispBrushEdge" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04 0.16"
              numOctaves="3"
              seed="11"
              result="bristleNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="bristleNoise"
              scale="2.0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Structured Watercolor / Sumi-e Cloud Filter with distinct organic paper-bleed lobes */}
          <filter id="akifSmokyWashCloud" x="-35%" y="-35%" width="170%" height="170%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.028 0.036"
              numOctaves="4"
              seed="17"
              result="cloudNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="cloudNoise"
              scale="82"
              xChannelSelector="R"
              yChannelSelector="G"
              result="warpedCloud"
            />
            <feGaussianBlur in="warpedCloud" stdDeviation="2.2" result="softCloud" />
          </filter>

          {/* Secondary crisp watercolor bloom filter for inner smoky mottling */}
          <filter id="akifWashFineEdge" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.042"
              numOctaves="3"
              seed="29"
              result="fineNoise"
            />
            <feDisplacementMap in="SourceGraphic" in2="fineNoise" scale="44" result="warped" />
            <feGaussianBlur in="warped" stdDeviation="1.8" />
          </filter>

          {/* Radial gradients for smoky whitish-gray ink wash in Dark Mode & ice-blue watercolor in Light Mode */}
          <radialGradient id="akifWashCoreGrad" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={isDark ? '#9BA7BC' : '#96B0DC'}
              stopOpacity={isDark ? '0.46' : '0.58'}
            />
            <stop
              offset="54%"
              stopColor={isDark ? '#545F73' : '#B8CAE6'}
              stopOpacity={isDark ? '0.32' : '0.42'}
            />
            <stop
              offset="85%"
              stopColor={isDark ? '#2A303C' : '#D5E0F2'}
              stopOpacity={isDark ? '0.16' : '0.22'}
            />
            <stop offset="100%" stopColor={isDark ? '#000000' : '#F4F2EC'} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="akifWashHighlightGrad" cx="48%" cy="44%" r="48%">
            <stop
              offset="0%"
              stopColor={isDark ? '#CDD6E6' : '#88A6D8'}
              stopOpacity={isDark ? '0.32' : '0.48'}
            />
            <stop
              offset="62%"
              stopColor={isDark ? '#6D798E' : '#B4C6E4'}
              stopOpacity={isDark ? '0.18' : '0.28'}
            />
            <stop offset="100%" stopColor={isDark ? '#000000' : '#F4F2EC'} stopOpacity="0" />
          </radialGradient>

          {/* Hidden spine geometry paths used for getPointAtLength measurements */}
          {CALLIGRAPHY_STROKES.map((stroke, idx) => (
            <path
              key={`spine-${stroke.id}`}
              ref={(el) => {
                spineRefs.current[idx] = el
              }}
              d={stroke.spine}
              fill="none"
            />
          ))}

          {/* Individual progressive drawing mask for each calligraphy stroke */}
          {CALLIGRAPHY_STROKES.map((stroke, idx) => (
            <mask
              key={`mask-${stroke.id}`}
              id={`akif-stroke-mask-${stroke.id}`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="680"
              height="430"
            >
              <path
                ref={(el) => {
                  maskRefs.current[idx] = el
                }}
                d={stroke.spine}
                fill="none"
                stroke="#ffffff"
                strokeWidth={stroke.maskWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 600,
                  strokeDashoffset: 600,
                }}
              />
            </mask>
          ))}
        </defs>

        {/* =================================================================
            LAYER 1: STRUCTURED SUMI-E / WATERCOLOR INK-WASH CLOUD BEHIND AKIF
            Matches the distinct billowing lobes in Reference 3 & Reference 4
            ================================================================= */}
        <g
          className="akif-ink-wash-layer"
          style={{
            opacity: Math.min(1, progress * 1.15),
            transition: 'opacity 0.4s ease-out',
          }}
        >
          {/* Multi-lobed watercolor cloud base */}
          <g filter="url(#akifSmokyWashCloud)">
            <ellipse cx="262" cy="210" rx="242" ry="158" fill="url(#akifWashCoreGrad)" />
            <ellipse cx="192" cy="182" rx="170" ry="134" fill="url(#akifWashHighlightGrad)" />
            <ellipse cx="358" cy="218" rx="175" ry="130" fill="url(#akifWashCoreGrad)" />
            {/* Distinct upper-left & top billowing plumes above A, K, I */}
            <circle
              cx="232"
              cy="88"
              r="76"
              fill={isDark ? '#626D82' : '#B2C4E2'}
              fillOpacity={isDark ? '0.3' : '0.42'}
            />
            <circle
              cx="332"
              cy="94"
              r="68"
              fill={isDark ? '#566073' : '#BCCCE6'}
              fillOpacity={isDark ? '0.28' : '0.38'}
            />
            <circle
              cx="114"
              cy="148"
              r="82"
              fill={isDark ? '#667186' : '#AEC2E0'}
              fillOpacity={isDark ? '0.28' : '0.4'}
            />
            <circle
              cx="64"
              cy="208"
              r="58"
              fill={isDark ? '#586376' : '#B8CAE6'}
              fillOpacity={isDark ? '0.26' : '0.36'}
            />
            {/* Lower smoky billows beneath A, K, I */}
            <ellipse
              cx="248"
              cy="336"
              rx="142"
              ry="72"
              fill={isDark ? '#525C6E' : '#B8CAE6'}
              fillOpacity={isDark ? '0.28' : '0.38'}
            />
          </g>

          {/* Crisp inner watercolor blooms & mottled smoky highlights */}
          <g filter="url(#akifWashFineEdge)">
            <ellipse cx="242" cy="196" rx="152" ry="102" fill="url(#akifWashHighlightGrad)" />
            <circle
              cx="222"
              cy="132"
              r="54"
              fill={isDark ? '#8E9BB0' : '#9EB6DF'}
              fillOpacity={isDark ? '0.22' : '0.32'}
            />
            <circle
              cx="296"
              cy="258"
              r="52"
              fill={isDark ? '#8A96AC' : '#A4BCE2'}
              fillOpacity={isDark ? '0.22' : '0.32'}
            />
            <circle
              cx="458"
              cy="236"
              r="50"
              fill={isDark ? '#545E70' : '#BCCCE6'}
              fillOpacity={isDark ? '0.22' : '0.3'}
            />
          </g>

          {/* Subtle organic ink-wash edge droplets */}
          <g filter="url(#akifWashFineEdge)">
            {WASH_SPATTER.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={d.r}
                fill={isDark ? '#6D788C' : '#9EB4DC'}
                fillOpacity={d.o}
              />
            ))}
          </g>
        </g>

        {/* =================================================================
            STAGE 2 HINT: SINGLE IVORY BRUSH STROKE + "Move to write"
            ================================================================= */}
        <g
          className={`akif-hint-layer ${hintVisible && progress < 0.04 ? 'is-visible' : 'is-hidden'}`}
          aria-hidden="true"
        >
          <path
            className="akif-hint-stroke"
            d="M 190 226 C 244 202 324 196 408 214"
            fill="none"
            stroke={inkColor}
            strokeWidth="11"
            strokeLinecap="round"
            filter="url(#akifCrispBrushEdge)"
          />
          <path
            className="akif-hint-feather"
            d="M 198 231 C 254 209 332 204 416 218"
            fill="none"
            stroke={inkColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />
          {!isMobile && (
            <text
              x="302"
              y="268"
              textAnchor="middle"
              className="akif-hint-caption"
              fill={inkColor}
              fillOpacity="0.72"
            >
              Move to write
            </text>
          )}
        </g>

        {/* =================================================================
            LAYER 2: AKIF CALLIGRAPHY LETTERING WITH DRY-BRUSH FEIBAI STREAKS
            ================================================================= */}
        <g className="akif-lettering-layer" filter="url(#akifCrispBrushEdge)">
                    {CALLIGRAPHY_STROKES.map((stroke) => (
            <g key={stroke.id} mask={`url(#akif-stroke-mask-${stroke.id})`}>
              {/* Variable-width brush silhouette */}
              <path d={stroke.body} fill={inkColor} fillRule="evenodd" />

              {/* Fine bristle streaks that follow the stroke direction */}
              {stroke.streaks.map((s, sIdx) => (
                <path
                  key={`${stroke.id}-streak-${sIdx}`}
                  d={s.d}
                  fill="none"
                  stroke={s.kind === 'tone' ? innerToneColor : bgCutoutColor}
                  strokeWidth={s.w}
                  strokeLinecap="round"
                  strokeOpacity={s.kind === 'tone' ? s.o * (isDark ? 0.34 : 0.72) : s.o * (isDark ? 0.9 : 0.5)}
                />
              ))}

              {/* Dry-brush hairs leaving the stroke end */}
              {stroke.hairs.map((h, hIdx) => (
                <path
                  key={`${stroke.id}-hair-${hIdx}`}
                  d={h.d}
                  fill="none"
                  stroke={inkColor}
                  strokeWidth={h.w}
                  strokeLinecap="round"
                  strokeOpacity={h.o * dryBrushOpacity}
                />
              ))}

              {/* Chalk specks beyond the stroke end */}
              {stroke.specks.map((sp, spIdx) => (
                <circle
                  key={`${stroke.id}-speck-${spIdx}`}
                  cx={sp.x}
                  cy={sp.y}
                  r={sp.r}
                  fill={inkColor}
                  fillOpacity={sp.o}
                />
              ))}
            </g>
          ))}

          {/* Dry-brush stipple foam at the right end of F's middle stroke leading into the brush tip */}
          <g
            style={{
              opacity: progress > 0.9 ? Math.min(1, (progress - 0.9) / 0.1) : 0,
            }}
          >
            {DRY_BRUSH_FOAM.map((dot, idx) => (
              <circle
                key={`foam-${idx}`}
                cx={dot.x}
                cy={dot.y}
                r={dot.r}
                fill={inkColor}
                fillOpacity={dot.o}
              />
            ))}
          </g>
        </g>

        {/* =================================================================
            LAYER 3: VERMILION AK / IF SEAL (Separate Asset Layer)
            Matches the bold carved serif glyphs & stamp border in Reference 3 & 4
            ================================================================= */}
        <g transform="translate(534, 295)">
          <g className={`akif-seal-layer ${sealStamped ? 'is-stamped' : ''}`} filter="url(#akifSealRough)">
            {/* Outer vermilion stamp block */}
            <rect x="-39" y="-39" width="78" height="78" rx="7" fill={sealColor} />
            {/* Carved inner stamp frame */}
            <rect
              x="-34.5"
              y="-34.5"
              width="69"
              height="69"
              rx="4.5"
              fill="none"
              stroke={sealTextColor}
              strokeWidth="1.75"
              strokeOpacity="0.88"
            />
            {/* Bold carved serif 'AK' top row and 'IF' bottom row filling the seal square */}
            <text
              x="0"
              y="-4"
              textAnchor="middle"
              fill={sealTextColor}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="700"
              fontSize="27"
              letterSpacing="2.5"
            >
              AK
            </text>
            <text
              x="0"
              y="26"
              textAnchor="middle"
              fill={sealTextColor}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="700"
              fontSize="27"
              letterSpacing="3.8"
            >
              IF
            </text>
          </g>
        </g>

        {/* =================================================================
            LAYER 4: STEEP-ANGLED (~60°) 3D BRUSH TIP, WOOD/COPPER FERRULE & SHAFT
            Matches the exact angle, scale, and shading in Reference 3 & Reference 4
            ================================================================= */}
        <path
          ref={trailPathRef}
          className="akif-brush-trail"
          d=""
          fill="none"
          stroke={inkColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity={stage === 'writing' ? '0.26' : '0'}
        />

        <g
          ref={brushTipGroupRef}
          className={`akif-brush-tip-layer ${pointerInside ? 'is-suppressed' : ''}`}
          style={{ opacity: 0 }}
        >
          {/* Soft drop shadow under brush tip */}
          <ellipse
            cx="10"
            cy="-12"
            rx="16"
            ry="6"
            transform="rotate(-58 10 -12)"
            fill="#000000"
            fillOpacity={isDark ? '0.45' : '0.18'}
          />

          {/* Full-bodied calligraphy bristle cone (ivory in dark mode, warm ivory/indigo tip in light mode) */}
          <path
            d="M -4 3 C 2 3 10 -1 16 -12 C 19 -17 18 -24 13 -27 C 8 -29 2 -23 -2 -14 C -5 -7 -6 1 -4 3 Z"
            fill={isDark ? '#F3EDE0' : '#DFC8A8'}
          />
          {/* Ink-loaded bristle tip blending into the stroke */}
          <path
            d="M -4 3 C 0 3 6 0 11 -7 C 7 -9 2 -8 -2 -3 C -4 0 -5 2 -4 3 Z"
            fill={inkColor}
          />

          {/* 3D Shaded Warm Wood / Copper Ferrule Collar */}
          <path
            d="M 8 -24 L 18 -18 L 26 -33 L 16 -39 Z"
            fill="#B87346"
          />
          {/* Left specular highlight along ferrule */}
          <path
            d="M 9 -25 L 13 -23 L 21 -36 L 17 -38 Z"
            fill="#E5A575"
            fillOpacity="0.85"
          />
          {/* Dark ring seam between ferrule and shaft */}
          <path
            d="M 16 -39 L 26 -33 L 28 -36 L 18 -42 Z"
            fill="#3A2214"
          />

          {/* Steep-angled (~60°) Tapered Glossy Bamboo Brush Shaft */}
          <path
            d="M 18 -41 L 26 -36 L 64 -112 L 60 -114 Z"
            fill={isDark ? '#2B2D33' : '#141821'}
          />
          {/* Specular rim highlight along the bamboo shaft */}
          <path
            d="M 19 -41 L 22 -39 L 62 -113 L 60 -114 Z"
            fill={isDark ? '#9EA4B0' : '#687285'}
            fillOpacity="0.75"
          />

          {/* Secondary hanging loop cord near top of brush handle matching Reference 3 & 4 */}
          <path
            d="M 52 -88 C 56 -76 48 -62 39 -52"
            fill="none"
            stroke={isDark ? '#8C929E' : '#3A4358'}
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeOpacity="0.82"
          />
        </g>
      </svg>

      {/* Floating Custom 28px Brush Cursor when hovering interactive desktop canvas */}
      {!isMobile && pointerInside && (
        <div
          className="akif-floating-brush-cursor"
          style={{
            transform: `translate3d(${pointerPos.x}px, ${pointerPos.y}px, 0)`,
          }}
          aria-hidden="true"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M 3 25 C 6 23 10 19 13 13 C 14 10 12 8 10 8 C 7 8 5 12 3 18 C 2 21 2 24 3 25 Z"
              fill={inkColor}
            />
            <path
              d="M 10 8 L 13 10 L 23 2 L 21 0 Z"
              fill="#C87D4B"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
