import "./style.less";
import App from "./App.svelte";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { marked } from "marked";
dayjs.extend(relativeTime);
marked.use({ gfm: true, breaks: true, silent: true });
const app = new App({ target: document.body });
export default app;