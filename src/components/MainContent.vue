<template>
  <div class="main-content">
    <!-- Modulation Modal -->
    <ModulationModal
      :data="modulationModal.data"
      @close="modulationModal.close"
      @cancel="modulationModal.close"
      v-model:open="modulationModal.visible"
      v-if="modulationModal.visible && modulationModal.data"
    />

    <!-- App Mode -->
    <div class="content__mode-container">
      <span>Device mode</span>
      <a-segmented
        v-model:value="networkMode"
        :options="[
          { label: 'Modulation', value: 'modulation' },
          { label: 'Demodulation', value: 'demodulation' },
        ]"
      />
    </div>

    <!-- Modulation -->
    <div class="content__modulation" v-show="networkMode === 'modulation'">
      <a-form
        ref="modulationFormRef"
        layout="vertical"
        :model="dataForm"
        :rules="{
          payload: [
            {
              required: true,
              trigger: 'change',
              message: '',
            },
          ],
        }"
      >
        <!-- Modulation -->
        <a-form-item
          name="modulation"
          label="Modulation format: "
          tooltip="Select how many bits per symbol will be used in communication."
        >
          <a-select
            v-model:value="dataForm.modulation"
            :options="[
              { label: '1 bit/symbol', value: '1' },
              { label: '2 bit/symbol', value: '2' },
              { label: '4 bit/symbol', value: '4' },
              { label: '16 bit/symbol', value: '16' },
              { label: '64 bit/symbol', value: '64' },
            ]"
          />
        </a-form-item>

        <!-- Payload -->
        <a-form-item
          name="payload"
          label="Text to transmission: "
          tooltip="Enter the text you want to send in the message."
        >
          <a-textarea
            showCount
            allowClear
            :autoSize="{
              minRows: 4,
              maxRows: 4,
            }"
            :maxlength="300"
            v-model:value="dataForm.payload"
          />
        </a-form-item>

        <!-- Start Button -->
        <a-form-item>
          <a-button type="primary" @click.prevent="onStartTransmission">
            Start Transmission
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- Demodulation -->
    <div class="content__demodulation" v-show="networkMode === 'demodulation'">
      <!-- Header -->
      <div class="demodulation__header">
        <!-- State -->
        <h3>{{ getDemodulationStateLabel() }}</h3>

        <!-- Buttons -->
        <a-space>
          <a-button
            type="primary"
            :icon="h(ReloadOutlined)"
            @click="handleClearSyncPoints()"
            v-if="demodulationData.state === 'sync'"
            :disabled="demodulationData.points.length == 0"
          >
            Restart Points
          </a-button>

          <a-button
            type="primary"
            :icon="h(PlayCircleOutlined)"
            @click="handleStartDemodule()"
            v-if="demodulationData.state === 'sync'"
            :disabled="demodulationData.points.length !== 2"
          >
            Start Demodulation
          </a-button>

          <a-button
            v-else
            type="primary"
            :icon="h(ReloadOutlined)"
            @click="handleResetDemodule()"
            :disabled="demodulationData.points.length !== 2"
          >
            Restart Demodulation
          </a-button>
        </a-space>
      </div>

      <!-- Video -->
      <div class="demodulation__video">
        <video ref="videoElem" width="640" height="480" autoplay></video>
        <canvas
          width="640"
          height="480"
          ref="syncCanvas"
          @click="handleSignalSyncClick"
          class="video__sync-canvas"
        ></canvas>

        <canvas
          width="640"
          height="480"
          ref="videoCanvas"
          style="display: none"
        ></canvas>
      </div>

      <!-- Parsed Text -->
      <div class="demodulation__text">
        <LoadingOutlined
          v-if="demodulationData.state === 'running'"
          :style="{
            fontSize: '32px',
          }"
        />
        <template v-else>
          {{ demodulationData.output }}
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ModulationModal from "./ModulationModal.vue";

import { ref, reactive, toRaw, onMounted, h } from "vue";
import {
  PlayCircleOutlined,
  ReloadOutlined,
  LoadingOutlined,
} from "@ant-design/icons-vue";

import IConnectionData from "../interfaces/IConnectionData";
import WONService from "../services/WONService";

onMounted(() => {
  console.log("MainContent Mounted");
  WONService.startVideoRecording(videoElem.value);
});

const networkMode = ref<"modulation" | "demodulation">("modulation");

const modulationFormRef = ref<any>(null);
const videoElem = ref<HTMLVideoElement | null>(null);
const syncCanvas = ref<HTMLCanvasElement | null>(null);
const videoCanvas = ref<HTMLCanvasElement | null>(null);

const dataForm = reactive<IConnectionData>({
  modulation: "2",
  payload: "WON",
});
const modulationModal = reactive({
  visible: false,
  data: null as null | IConnectionData,
  open: (data: IConnectionData) => {
    modulationModal.data = data;
    modulationModal.visible = true;
  },
  close: () => {
    modulationModal.data = null;
    modulationModal.visible = false;
  },
});

const demodulationData = reactive({
  output: "" as string | null,
  points: [] as { x: number; y: number }[],
  state: "sync" as "sync" | "running" | "finished",
});

function getDemodulationStateLabel() {
  switch (demodulationData.state) {
    case "sync":
      return "In the video, click on the main diagonal to focus on the signal source.";
    case "running":
      return "Symbols recognition in progress";
    case "finished":
      return "Transmission finished";
  }
}

async function onStartTransmission() {
  console.log("Start Transmission");

  if (!modulationFormRef.value) return;

  modulationFormRef.value
    .validate()
    .then(() => {
      console.log("values", dataForm, toRaw(dataForm));
      modulationModal.open(dataForm);
    })
    .catch((error: Error) => {
      console.log("error", error);
    });
}

async function handleStartDemodule() {
  demodulationData.state = "running";

  WONService.startDemodulation(
    Number(dataForm.modulation),
    videoElem.value,
    calcCoordByPoints()
  )
    .then((output) => {
      demodulationData.state = "finished";
      demodulationData.output = output || null;
    })
    .catch((error) => {
      console.error("Error on demodulation", error);
      demodulationData.state = "sync";
    });
}

function handleResetDemodule() {
  demodulationData.state = "sync";
  demodulationData.output = "";
  WONService.demoRunning = false;
  handleClearSyncPoints();
}

function handleClearSyncPoints() {
  demodulationData.points = [];
  drawRectangle();
}

function calcCoordByPoints(): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const [p1, p2, p3, p4] = getRectangleVertices();

  const x = Math.min(p1.x, p2.x, p3.x, p4.x);
  const y = Math.min(p1.y, p2.y, p3.y, p4.y);

  const width = Math.max(p1.x, p2.x, p3.x, p4.x) - x;
  const height = Math.max(p1.y, p2.y, p3.y, p4.y) - y;

  return {
    x: Number(x),
    y: Number(y),
    width: Number(width),
    height: Number(height),
  };
}

function handleSignalSyncClick(event: MouseEvent) {
  if (!syncCanvas.value) {
    console.error("Sync Canvas not found");
    return;
  }

  const rect = syncCanvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Armazenar o ponto clicado (máximo de 2 pontos)
  if (demodulationData.points.length < 2) {
    demodulationData.points.push({ x, y });
    drawRectangle();
  } else {
    console.warn(
      "Já foram selecionados 2 pontos. Resete para selecionar novamente."
    );
  }
}

const drawRectangle = () => {
  if (!syncCanvas.value) {
    return;
  }

  const context = syncCanvas.value.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, syncCanvas.value.width, syncCanvas.value.height);

  if (demodulationData.points.length < 2) {
    return;
  }

  context.strokeStyle = "red";
  context.lineWidth = 2;

  // Obter os dois pontos da diagonal
  const [point1, point2] = demodulationData.points;

  // Calcular os quatro vértices do retângulo
  const topLeft = {
    x: Math.min(point1.x, point2.x),
    y: Math.min(point1.y, point2.y),
  };
  const bottomRight = {
    x: Math.max(point1.x, point2.x),
    y: Math.max(point1.y, point2.y),
  };
  const topRight = { x: bottomRight.x, y: topLeft.y };
  const bottomLeft = { x: topLeft.x, y: bottomRight.y };

  // Desenhar o retângulo usando os pontos calculados
  context.beginPath();
  context.moveTo(topLeft.x, topLeft.y);
  context.lineTo(topRight.x, topRight.y);
  context.lineTo(bottomRight.x, bottomRight.y);
  context.lineTo(bottomLeft.x, bottomLeft.y);
  context.closePath();
  context.stroke();

  // Desenhar uma bolinha em cada vértice do retângulo
  const vertices = [topLeft, topRight, bottomRight, bottomLeft];
  context.fillStyle = "blue"; // Cor das bolinhas

  vertices.forEach(({ x, y }) => {
    context.beginPath();
    context.arc(x, y, 5, 0, 2 * Math.PI); // Desenha uma bolinha com raio de 5
    context.fill();
  });
};

const getRectangleVertices = () => {
  const [point1, point2] = demodulationData.points;

  // Calcular os quatro vértices do retângulo
  const topLeft = {
    x: Math.min(point1.x, point2.x),
    y: Math.min(point1.y, point2.y),
  };
  const bottomRight = {
    x: Math.max(point1.x, point2.x),
    y: Math.max(point1.y, point2.y),
  };
  const topRight = { x: bottomRight.x, y: topLeft.y };
  const bottomLeft = { x: topLeft.x, y: bottomRight.y };

  return [topLeft, topRight, bottomRight, bottomLeft];
};
</script>

<style scoped lang="scss">
.main-content {
  height: 100%;

  display: flex;
  flex-direction: column;

  gap: 20px;
  padding: 24px;
  justify-content: center;

  .content__mode-container {
    display: flex;
    flex-direction: column;

    gap: 10px;
    align-items: center;

    span {
      font-size: 1.5rem;
      font-weight: bold;
    }
  }

  .content__modulation {
    width: 600px;
    margin: 0 auto;
  }

  .content__demodulation {
    margin: 0 auto;

    display: flex;
    flex-direction: column;

    gap: 20px;

    .demodulation__header {
      display: flex;
      flex-direction: column;

      gap: 8px;
      align-items: center;
      justify-content: center;

      h3 {
        font-size: 1rem;
        font-weight: bold;
      }
    }

    .demodulation__video {
      width: 640px;
      height: 480px;

      display: flex;
      flex-direction: column;

      gap: 10px;
      align-items: center;
      justify-content: center;

      position: relative;

      video {
        border: 1px solid #000;
      }

      .video__sync-canvas {
        position: absolute;
        top: 0;
        left: 0;
        border: 1px solid transparent;
      }
    }

    .demodulation__text {
      width: 100%;
      height: 100px;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 0.8rem;
      text-wrap: wrap;
      font-weight: 500;
      text-align: center;

      padding: 10px;
      border: 1px solid #ccc;

      overflow-y: auto;
    }
  }
}
</style>
