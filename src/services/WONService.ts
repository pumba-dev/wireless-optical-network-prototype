export default class WONService {
  // Params
  private static readonly symbolLife = 500; // Symbol Life Time in Milliseconds
  private static readonly bit0Symbol = "#FF0000"; // Red
  private static readonly bit1Symbol = "#00FF00"; // Green
  private static readonly initialSymbol = "#fff"; // Blue
  private static readonly guardSymbol = "#0000FF"; // Black
  private static readonly borderSize = 10; // Band Guard Size in Pixels

  // MODULATION
  public static async startModulation(payload: string, modulation: string) {
    const bits = WONService.encodeTextToBinary(payload);
    const modulationValue = parseInt(modulation);

    console.log("Bits: ", bits);

    const chunksQuantity = Math.ceil(bits.length / modulationValue);

    console.log("Chunks Quantity: ", chunksQuantity);

    // Transmitting Loop
    while (true) {
      console.log("Draw Initial Symbol");
      WONService.drawConfigSymbol(WONService.initialSymbol);

      await sleep(WONService.symbolLife * 2);

      console.log("Start Message Transmission");

      for (let i = 0; i < chunksQuantity; i++) {
        const chunk = bits.slice(
          i * modulationValue,
          (i + 1) * modulationValue
        );
        const chunkArray = chunk.split("").map(Number);

        console.log(`Chunk ${i}: `, chunkArray);

        console.log("Draw Symbol");
        WONService.drawSymbol(modulationValue, chunkArray);

        await sleep(WONService.symbolLife);

        console.log("Draw Guard Symbol");
        WONService.drawConfigSymbol(WONService.guardSymbol);

        await sleep(WONService.symbolLife);
      }
    }
  }

  private static encodeTextToBinary(text: string): string {
    return text
      .split("")
      .map((char) => {
        if (char === " ") {
          return " ";
        }
        return char.charCodeAt(0).toString(2).padStart(8, "0");
      })
      .join(" ");
  }

  private static drawSymbol(modulation: number, bits: number[]) {
    // Quantidade de áreas do grid (quadrados ou retângulos)
    const canvas = document.getElementById(
      "transmitter-symbol"
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      alert("Error: Get canvas context");
      return;
    }

    // Ajuste o tamanho do canvas para o tamanho da div
    const canvasContainer = document.getElementById("body__transmitter");

    if (!canvasContainer) {
      alert("Error: Get canvas container");
      return;
    }

    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = WONService.borderSize; // Tamanho da borda de guarda entre os bits.

    const numSquaresPerSide = Math.sqrt(modulation);

    if (modulation === 2) {
      const pieceHeight = canvas.height;
      const pieceWidth = canvas.width / modulation;

      for (let i = 0; i < modulation; i++) {
        const x = (i % modulation) * pieceWidth;
        const y = Math.floor(i / modulation) * pieceHeight;

        const currentBit = bits[i] as 0 | 1;
        ctx.fillStyle = this.getSymbolColorValue(currentBit);
        ctx.fillRect(x, y, pieceWidth, pieceHeight);
        ctx.strokeRect(x, y, pieceWidth, pieceHeight);
      }
    } else {
      const pieceWidth = canvas.width / numSquaresPerSide;
      const pieceHeight = canvas.height / numSquaresPerSide;

      for (let row = 0; row < numSquaresPerSide; row++) {
        for (let col = 0; col < numSquaresPerSide; col++) {
          const currentBit = bits[row * numSquaresPerSide + col] as 0 | 1;
          ctx.fillStyle = this.getSymbolColorValue(currentBit);
          ctx.fillRect(
            col * pieceWidth,
            row * pieceHeight,
            pieceWidth,
            pieceHeight
          );
          ctx.strokeRect(
            col * pieceWidth,
            row * pieceHeight,
            pieceWidth,
            pieceHeight
          );
        }
      }
    }
  }

  private static drawConfigSymbol(color: string) {
    const canvas = document.getElementById(
      "transmitter-symbol"
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      alert("Error: Get canvas context");
      return;
    }

    const canvasContainer = document.getElementById("body__transmitter");

    if (!canvasContainer) {
      alert("Error: Get canvas container");
      return;
    }

    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }

  private static getSymbolColorValue(bit: 0 | 1): string {
    switch (bit) {
      case 0: // RED
        return WONService.bit0Symbol;
      case 1: // GREEN
        return WONService.bit1Symbol;
      default:
        return "#000";
    }
  }

  // DEMODULATION
  private static decodeBinaryToText(binary: string): string {
    return binary
      .split(" ")
      .map((bin) => {
        if (bin === "") {
          return " ";
        }
        return String.fromCharCode(parseInt(bin, 2));
      })
      .join("");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
