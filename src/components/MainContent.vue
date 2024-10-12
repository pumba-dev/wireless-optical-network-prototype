<template>
  <div class="main-content">
    <div class="content__mode-container">
      <span>Select the device mode</span>
      <a-segmented
        v-model:value="networkMode"
        :options="[
          { label: 'Modulation', value: 'modulation' },
          { label: 'Demodulation', value: 'demodulation' },
        ]"
      />
    </div>

    <!-- Modulation Modal -->
    <ModulationModal
      :data="modulationModal.data"
      @close="modulationModal.close"
      @cancel="modulationModal.close"
      v-model:open="modulationModal.visible"
      v-if="modulationModal.visible && modulationModal.data"
    />

    <!-- Modulation -->
    <div class="content__form">
      <a-form
        ref="formRef"
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
  </div>
</template>

<script setup lang="ts">
import ModulationModal from "./ModulationModal.vue";

import { ref, reactive, toRaw } from "vue";

import IConnectionData from "../interfaces/IConnectionData";

const formRef = ref<any>(null);
const networkMode = ref<"modulation" | "demodulation">("modulation");

const dataForm = reactive<IConnectionData>({
  modulation: "2",
  payload: "Testando a transmissão de dados, vamos testar novamente.",
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

async function onStartTransmission() {
  console.log("Start Transmission");

  if (!formRef.value) return;

  formRef.value
    .validate()
    .then(() => {
      console.log("values", dataForm, toRaw(dataForm));
      modulationModal.open(dataForm);
    })
    .catch((error: Error) => {
      console.log("error", error);
    });
}
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

  .content__form {
    width: 600px;
    margin: 0 auto;
  }
}
</style>
