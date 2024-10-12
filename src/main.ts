// Vue
import { createApp } from "vue";
import App from "./App.vue";

// Ant
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";

// Styles
import "./styles/global.scss";

const app = createApp(App);

app.use(Antd).mount("#app");
