export interface HebelCalculationInput {
  wallLength: number; // meters
  wallHeight: number; // meters
  openingsArea: number; // m2 (pintu, jendela)
  blockLength: number; // meters (e.g. 0.6)
  blockHeight: number; // meters (e.g. 0.2)
  wastePercentage: number; // % (e.g. 5%)
}

export interface HebelCalculationResult {
  grossWallArea: number; // m2
  netWallArea: number; // m2
  singleBlockArea: number; // m2
  baseBlocksCount: number; // pcs
  wasteBlocksCount: number; // pcs
  totalBlocksCount: number; // pcs
  totalCubicMeters: number; // m3 (based on 10cm thickness standard 0.1m)
}

export function calculateHebel(input: HebelCalculationInput): HebelCalculationResult {
  const grossWallArea = Math.max(0, input.wallLength * input.wallHeight);
  const netWallArea = Math.max(0, grossWallArea - (input.openingsArea || 0));
  const bLength = input.blockLength > 0 ? input.blockLength : 0.6;
  const bHeight = input.blockHeight > 0 ? input.blockHeight : 0.2;
  const singleBlockArea = bLength * bHeight;

  const baseBlocksCount = singleBlockArea > 0 ? Math.ceil(netWallArea / singleBlockArea) : 0;
  const wasteRate = (input.wastePercentage || 0) / 100;
  const wasteBlocksCount = Math.ceil(baseBlocksCount * wasteRate);
  const totalBlocksCount = baseBlocksCount + wasteBlocksCount;
  // standard 10cm = 0.1m thickness => 1 m3 ~ 83.3 pcs (60x20x10)
  const totalCubicMeters = Math.round((totalBlocksCount * (bLength * bHeight * 0.1)) * 100) / 100;

  return {
    grossWallArea: Math.round(grossWallArea * 100) / 100,
    netWallArea: Math.round(netWallArea * 100) / 100,
    singleBlockArea: Math.round(singleBlockArea * 1000) / 1000,
    baseBlocksCount,
    wasteBlocksCount,
    totalBlocksCount,
    totalCubicMeters,
  };
}

export interface KeramikCalculationInput {
  roomLength: number; // meters
  roomWidth: number; // meters
  tileLengthCm: number; // cm (e.g. 60)
  tileWidthCm: number; // cm (e.g. 60)
  piecesPerBox: number; // e.g. 4
  wastePercentage: number; // % (e.g. 10%)
}

export interface KeramikCalculationResult {
  roomArea: number; // m2
  singleTileAreaM2: number; // m2
  areaPerBoxM2: number; // m2
  baseTilesCount: number; // pcs
  totalTilesCount: number; // pcs
  totalBoxesCount: number; // dus
}

export function calculateKeramik(input: KeramikCalculationInput): KeramikCalculationResult {
  const roomArea = Math.max(0, input.roomLength * input.roomWidth);
  const tLengthM = (input.tileLengthCm || 60) / 100;
  const tWidthM = (input.tileWidthCm || 60) / 100;
  const singleTileAreaM2 = tLengthM * tWidthM;
  const pcsPerBox = input.piecesPerBox > 0 ? input.piecesPerBox : 4;
  const areaPerBoxM2 = singleTileAreaM2 * pcsPerBox;

  const baseTilesCount = singleTileAreaM2 > 0 ? Math.ceil(roomArea / singleTileAreaM2) : 0;
  const wasteRate = (input.wastePercentage || 0) / 100;
  const totalTilesCount = Math.ceil(baseTilesCount * (1 + wasteRate));
  const totalBoxesCount = Math.ceil(totalTilesCount / pcsPerBox);

  return {
    roomArea: Math.round(roomArea * 100) / 100,
    singleTileAreaM2: Math.round(singleTileAreaM2 * 1000) / 1000,
    areaPerBoxM2: Math.round(areaPerBoxM2 * 100) / 100,
    baseTilesCount,
    totalTilesCount,
    totalBoxesCount,
  };
}

export interface PasirCalculationInput {
  length: number; // meters
  width: number; // meters
  thickness: number; // meters (e.g. 0.05 for 5cm)
  wastePercentage?: number;
}

export interface PasirCalculationResult {
  areaM2: number;
  volumeM3: number;
  totalWithWasteM3: number;
  estimatedPickups: number; // 1 pickup ~ 0.8 - 1 m3
  estimatedTrucks: number;  // 1 dump truck ~ 4 m3
}

export function calculatePasir(input: PasirCalculationInput): PasirCalculationResult {
  const areaM2 = Math.max(0, input.length * input.width);
  const volumeM3 = areaM2 * Math.max(0, input.thickness);
  const waste = (input.wastePercentage || 10) / 100;
  const totalWithWasteM3 = Math.round(volumeM3 * (1 + waste) * 100) / 100;

  return {
    areaM2: Math.round(areaM2 * 100) / 100,
    volumeM3: Math.round(volumeM3 * 100) / 100,
    totalWithWasteM3,
    estimatedPickups: Math.ceil(totalWithWasteM3 / 0.8),
    estimatedTrucks: Math.round((totalWithWasteM3 / 4) * 10) / 10,
  };
}

export interface CatCalculationInput {
  wallArea: number; // m2
  spreadRateM2PerLiter: number; // e.g. 10 - 12 m2/liter
  coatsCount: number; // e.g. 2 layers
}

export interface CatCalculationResult {
  wallArea: number;
  coatsCount: number;
  totalLiters: number;
  estimatedGallons5L: number;
  estimatedPails20L: number;
}

export function calculateCat(input: CatCalculationInput): CatCalculationResult {
  const spreadRate = input.spreadRateM2PerLiter > 0 ? input.spreadRateM2PerLiter : 10;
  const coats = input.coatsCount > 0 ? input.coatsCount : 2;
  const totalEffectiveArea = input.wallArea * coats;
  const totalLiters = Math.round((totalEffectiveArea / spreadRate) * 10) / 10;

  return {
    wallArea: Math.round(input.wallArea * 100) / 100,
    coatsCount: coats,
    totalLiters,
    estimatedGallons5L: Math.ceil(totalLiters / 5),
    estimatedPails20L: Math.ceil(totalLiters / 20),
  };
}

export interface BetonCalculationInput {
  length: number; // meters
  width: number; // meters
  heightOrThickness: number; // meters
  wastePercentage?: number;
}

export interface BetonCalculationResult {
  volumeM3: number;
  totalWithWasteM3: number;
  cementSacksApprox: number; // ~ 6-7 sak cement (50kg) per m3 beton K-225
  sandM3Approx: number;      // ~ 0.5 m3 pasir per m3
  gravelM3Approx: number;    // ~ 0.8 m3 split/kerikil per m3
}

export function calculateBeton(input: BetonCalculationInput): BetonCalculationResult {
  const baseVol = Math.max(0, input.length * input.width * input.heightOrThickness);
  const waste = (input.wastePercentage || 5) / 100;
  const totalWithWasteM3 = Math.round(baseVol * (1 + waste) * 100) / 100;

  return {
    volumeM3: Math.round(baseVol * 100) / 100,
    totalWithWasteM3,
    cementSacksApprox: Math.ceil(totalWithWasteM3 * 6.8),
    sandM3Approx: Math.round(totalWithWasteM3 * 0.52 * 100) / 100,
    gravelM3Approx: Math.round(totalWithWasteM3 * 0.78 * 100) / 100,
  };
}
