export default class WONService {
  // Params
  private static readonly lostBitRecover = false; // Recover Lost Bits
  private static readonly preProcessorSymbol = true; // Recover Lost Bits

  private static readonly symbolLife = 2000; // Symbol Life Time in Milliseconds
  private static readonly bit0Symbol = "#FF0000"; // Red
  private static readonly bit1Symbol = "#00FF00"; // Green
  private static readonly endSymbol = "#fff"; // Blue
  private static readonly guardSymbol = "#0000FF"; // Black
  private static readonly borderSize = 35; // Band Guard Size in Pixels
  private static readonly colorThrashold = 150; // Color Threshold for Rectangle Detection
  public static demoRunning = false;
  public static moduRunning = false;

  // MODULATION
  public static async startModulation(payload: string, modulation: string) {
    const bits = WONService.encodeTextToBinary(payload);
    const modulationValue = parseInt(modulation);

    console.log("Text in Bits: ", bits);

    const chunksQuantity = Math.ceil(bits.length / modulationValue);

    console.log("Chunks Quantity: ", chunksQuantity);

    WONService.moduRunning = true;

    // Transmitting Loop
    while (true) {
      console.log("Start Message Transmission");

      if (!WONService.moduRunning) {
        console.log("Transmission Canceled");
        break;
      }

      for (let i = 0; i < chunksQuantity; i++) {
        const chunk = bits.slice(
          i * modulationValue,
          (i + 1) * modulationValue
        );
        const chunkArray = chunk.split("").map(Number);

        console.log(`Chunk ${i}/${chunksQuantity}: `, chunkArray);

        console.log("Draw Symbol");
        WONService.drawSymbol(modulationValue, chunkArray);

        await sleep(WONService.symbolLife);

        console.log("Draw Guard Symbol");
        WONService.drawConfigSymbol(WONService.guardSymbol);

        await sleep(WONService.symbolLife);
      }

      WONService.drawConfigSymbol(WONService.endSymbol);

      await sleep(WONService.symbolLife * 4);
    }
  }

  private static encodeTextToBinary(text: string): string {
    return text
      .split("")
      .map((char) => {
        return char.charCodeAt(0).toString(2).padStart(8, "0");
      })
      .join("");
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

  public static drawConfigSymbol(color: string) {
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
  public static async startDemodulation(
    modulation: number,
    videoElem: HTMLVideoElement | null,
    signalCoord: { x: number; y: number; width: number; height: number }
  ) {
    WONService.demoRunning = true;

    let bits: number[] = [];
    let nextSymbol = true;

    while (true) {
      if (!WONService.demoRunning) {
        console.log("Demodulation Canceled");
        break;
      }

      // Take Signal Area
      let signal = WONService.takeCamShot(
        videoElem,
        signalCoord?.x,
        signalCoord?.y,
        signalCoord?.width,
        signalCoord?.height
      );

      if (!signal) return;

      if (WONService.preProcessorSymbol) {
        signal = WONService.removeSaltAndPepperNoise(signal);
      }

      const centerColor = WONService.detectCenterColor(signal);

      console.log("Center Color: ", centerColor);

      if (centerColor === "blue") {
        console.log("Blue (Guard) Symbol Detected");
        nextSymbol = true;
        await sleep(WONService.symbolLife / 4);
        continue;
      }

      if (centerColor === "white") {
        console.log("White (End) Symbol Detected");
        break;
      }

      if (nextSymbol === false) {
        await sleep(WONService.symbolLife / 4);
        continue;
      }

      const { rectangleColors } = WONService.detectRectangles(signal);

      console.log("Rectangle Colors: ", rectangleColors);

      if (WONService.lostBitRecover && rectangleColors.length !== modulation) {
        const missingBits = modulation - rectangleColors.length;
        for (let i = 0; i < missingBits; i++) {
          rectangleColors.push(Math.round(Math.random()));
        }
      }

      bits.push(...rectangleColors);

      console.log("Signal Data: ", rectangleColors);
      console.log("Bits List: ", bits);

      nextSymbol = false;

      await sleep(WONService.symbolLife / 4);
    }

    const bitsString = bits.join("");

    console.log("Bits String: ", bitsString);

    const decodedText = WONService.decodeBinaryToText(bitsString);

    console.log("Decoded Text: ", decodedText);

    WONService.demoRunning = false;

    return decodedText;
  }

  public static startVideoRecording(videoElem: HTMLVideoElement | null) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia is not supported");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (!videoElem) {
          console.error("Video Element not found");
          return;
        }

        videoElem.srcObject = stream;
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
      });
  }

  private static decodeBinaryToText(binaryString: string): string {
    // Dividir a string binária em grupos de 8 bits (bytes)
    const binaryGroups = binaryString.match(/.{1,8}/g) || [];

    // Converter cada grupo de 8 bits para um caractere
    return binaryGroups
      .map((binary) => {
        // Converter o binário para decimal e depois para caractere
        const charCode = parseInt(binary, 2);
        return String.fromCharCode(charCode);
      })
      .join("");
  }

  private static takeCamShot(
    videoElem: HTMLVideoElement | null,
    cropX?: number,
    cropY?: number,
    cropWidth?: number,
    cropHeight?: number
  ): ImageData | null {
    if (!videoElem) {
      console.error("Video Element not found");
      return null;
    }

    // Create a canvas element
    const canvas = document.createElement("canvas");

    // Define as dimensões do recorte, se fornecidas, ou usa as dimensões do vídeo
    const x = cropX || 0;
    const y = cropY || 0;
    const width = cropWidth || videoElem.videoWidth;
    const height = cropHeight || videoElem.videoHeight;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      console.error("Canvas 2D Context not found");
      return null;
    }

    // Draw the cropped video frame to the canvas
    context.drawImage(
      videoElem,
      x,
      y,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Create Png
    // const imageDataUrl = canvas.toDataURL("image/png");

    // Iniciar o download da imagem
    // const link = document.createElement("a");
    // link.href = imageDataUrl;
    // link.download = "foto.png";
    // link.click();

    return context.getImageData(0, 0, canvas.width, canvas.height);
  }

  private static detectRectangles(imageData: ImageData): {
    rectangleColors: number[]; // Array para armazenar as cores dos retângulos
  } {
    // console.log("Detecting Rectangles", imageData);

    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data; // Acessa os dados dos pixels
    const rectangleColors: number[] = []; // Array para armazenar as cores dos retângulos

    for (let y = 0; y < height; y++) {
      let x = 0;

      while (x < width) {
        const index = (y * width + x) * 4;
        const pixel: [number, number, number] = [
          data[index],
          data[index + 1],
          data[index + 2],
        ]; // Obtém o valor RGB do pixel

        console.log("Pixel:", {
          x,
          y,
          r: pixel[0],
          g: pixel[1],
          b: pixel[2],
        });

        // Se encontrar um pixel escuro, avança para o próximo pixel
        if (
          pixel[0] < WONService.colorThrashold &&
          pixel[1] < WONService.colorThrashold &&
          pixel[2] < WONService.colorThrashold
        ) {
          x++;
          continue;
        }

        // Determine a cor do retângulo pelo maior valor
        if (pixel[0] > pixel[1] && pixel[0] > pixel[2]) {
          rectangleColors.push(0); // Red
          // console.log("RED RECTANGLE ENCOUNTERED");
        } else if (pixel[1] > pixel[0] && pixel[1] > pixel[2]) {
          rectangleColors.push(1); // Green
          // console.log("GREEN RECTANGLE ENCOUNTERED");
        } else {
          x++;
          continue; // Skip to next pixel if it's not red or green
        }

        console.log("Trying Find Vertical Border");

        // Avançar o x para a direita até encontrar uma borda preta ou fim da linha.
        let currentIndex = (y * width + x) * 4;

        // Enquanto o pixel for colorido
        while (
          data[currentIndex] >= WONService.colorThrashold ||
          data[currentIndex + 1] >= WONService.colorThrashold ||
          data[currentIndex + 2] >= WONService.colorThrashold
        ) {
          x++; // Move x para o próximo pixel
          currentIndex = (y * width + x) * 4;

          if (x >= width) {
            break;
          }

          // Se chegar na borda preta
          if (
            data[currentIndex] < WONService.colorThrashold &&
            data[currentIndex + 1] < WONService.colorThrashold &&
            data[currentIndex + 2] < WONService.colorThrashold
          ) {
            // console.log("Vertical Border Found", {
            //   x,
            //   y,
            //   r: data[currentIndex],
            //   g: data[currentIndex + 1],
            //   b: data[currentIndex + 2],
            // });
            // Avança na borda até a próxima cor.
            while (
              data[currentIndex] < WONService.colorThrashold &&
              data[currentIndex + 1] < WONService.colorThrashold &&
              data[currentIndex + 2] < WONService.colorThrashold
            ) {
              x++; // Move x para o próximo pixel
              currentIndex = (y * width + x) * 4;

              if (x >= width) {
                break; // Sai do loop de percorrer a borda
              }
            }
            // console.log("Vertical Border End", {
            //   x,
            //   y,
            //   r: data[currentIndex],
            //   g: data[currentIndex + 1],
            //   b: data[currentIndex + 2],
            // });

            break; // Sai de procurar a borda
          }
        }

        // Se x exceder a largura da imagem, reinicie x e avance y
        if (x >= width) {
          console.log("Finding Horizontal Border");
          x = 0; // Reinicia x

          // Avançar y até encontrar a borda inferior ou fim da imagem
          while (
            data[currentIndex] >= WONService.colorThrashold ||
            data[currentIndex + 1] >= WONService.colorThrashold ||
            data[currentIndex + 2] >= WONService.colorThrashold
          ) {
            y++; // Move y para a próxima linha
            currentIndex = (y * width + x) * 4;

            if (y >= height) {
              break;
            }

            // Se chegar na borda inferior
            if (
              data[currentIndex] < WONService.colorThrashold &&
              data[currentIndex + 1] < WONService.colorThrashold &&
              data[currentIndex + 2] < WONService.colorThrashold
            ) {
              // console.log("Horizontal Border Found", {
              //   x,
              //   y,
              //   r: data[currentIndex],
              //   g: data[currentIndex + 1],
              //   b: data[currentIndex + 2],
              // });

              // Avança na borda até a próxima cor.
              while (
                data[currentIndex] < WONService.colorThrashold &&
                data[currentIndex + 1] < WONService.colorThrashold &&
                data[currentIndex + 2] < WONService.colorThrashold
              ) {
                console.log("Horizontal Border Loop", { x, y });
                y++; // Move y para a próxima linha
                currentIndex = (y * width + x) * 4;

                if (y >= height) {
                  break; // Sai do loop de percorrer a borda
                }
              }
              // console.log("Horizontal Border End", {
              //   x,
              //   y,
              //   r: data[currentIndex],
              //   g: data[currentIndex + 1],
              //   b: data[currentIndex + 2],
              // });

              break; // Sai de procurar a borda
            }
          }

          // Se y exceder a altura da imagem, termine o loop
          if (y >= height) {
            break; // Sai do loop de percorrer a imagem
          }
        }
      }
    }

    return { rectangleColors };
  }

  private static removeSaltAndPepperNoise(
    imageData: ImageData,
    kernelSize: number = 4
  ): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data; // Acessa os dados dos pixels
    const outputData = new Uint8ClampedArray(data); // Cria um novo array para os dados de saída

    const halfKernelSize = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const rValues: number[] = [];
        const gValues: number[] = [];
        const bValues: number[] = [];

        // Coleta os valores dos pixels vizinhos
        for (let ky = -halfKernelSize; ky <= halfKernelSize; ky++) {
          for (let kx = -halfKernelSize; kx <= halfKernelSize; kx++) {
            const nx = x + kx;
            const ny = y + ky;

            // Verifica se o pixel vizinho está dentro dos limites da imagem
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const index = (ny * width + nx) * 4; // Calcula o índice no array de pixels
              rValues.push(data[index]); // Red
              gValues.push(data[index + 1]); // Green
              bValues.push(data[index + 2]); // Blue
            }
          }
        }

        // Calcula a mediana para cada canal de cor
        outputData[(y * width + x) * 4] = median(rValues); // Red
        outputData[(y * width + x) * 4 + 1] = median(gValues); // Green
        outputData[(y * width + x) * 4 + 2] = median(bValues); // Blue
        outputData[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3]; // Alpha
      }
    }

    return new ImageData(outputData, width, height);

    // Função auxiliar para calcular a mediana de um array
    function median(values: number[]): number {
      values.sort((a, b) => a - b); // Ordena os valores
      const mid = Math.floor(values.length / 2);
      return values.length % 2 === 0
        ? (values[mid - 1] + values[mid]) / 2
        : values[mid]; // Retorna a mediana
    }
  }

  private static detectCenterColor(
    imageData: ImageData
  ): null | "red" | "green" | "blue" | "white" | "black" {
    const { width, height, data } = imageData;

    // Calcula as coordenadas do centro da imagem
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    // Define o tamanho do quadrado ao redor do centro (5x5)
    const squareSize = 5;
    const halfSquareSize = Math.floor(squareSize / 2);

    // Variáveis para somar os valores RGB
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let pixelCount = 0;

    // Percorre o quadrado de 5x5 ao redor do centro
    for (let y = -halfSquareSize; y <= halfSquareSize; y++) {
      for (let x = -halfSquareSize; x <= halfSquareSize; x++) {
        const nx = centerX + x;
        const ny = centerY + y;

        // Verifica se o pixel está dentro dos limites da imagem
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const index = (ny * width + nx) * 4; // Calcula o índice no array de pixels
          totalR += data[index]; // Red
          totalG += data[index + 1]; // Green
          totalB += data[index + 2]; // Blue
          pixelCount++;
        }
      }
    }

    // Calcula a média dos valores RGB
    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;

    const threshold = WONService.colorThrashold; // Tolerância para considerar um valor próximo de zero

    console.log("Center Color:", { avgR, avgG, avgB });

    if (avgR > threshold && avgG > threshold && avgB > threshold) {
      return "white";
    } else if (avgR < threshold && avgG < threshold && avgB < threshold) {
      return "black";
    } else if (avgR > avgG && avgR > avgB) {
      return "red";
    } else if (avgG > avgR && avgG > avgB) {
      return "green";
    } else if (avgB > avgR && avgB > avgG) {
      return "blue";
    }

    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
