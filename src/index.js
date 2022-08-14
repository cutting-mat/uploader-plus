/**
 * @cutting-mat/uploader-plus
 *
 * */
import Uploader from "@/components/uploader";

export default {
  install: function (app, option) {
    app.config.compilerOptions.isCustomElement = (tag) => {
      return tag === "uploader";
    };

    app.provide("$UploaderOption", option || {});

    app.component("uploader", Uploader);
  },
};
