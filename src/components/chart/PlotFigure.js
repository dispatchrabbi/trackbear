import * as Plot from "@observablehq/plot";
import {h, withDirectives} from "vue";

export default {
  props: ["options"],
  render() {
    const {options} = this;
    return withDirectives(h("div"), [
      [
        {
          mounted(el) {
            el.append(Plot.plot(options));
          }
        }
      ]
    ]);
  }
};
