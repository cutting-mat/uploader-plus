<template>
  <el-upload
    ref="myupload"
    v-bind="$attrs"
    action
    :fileList="fileListFinnal"
    :accept="acceptFinnal"
    :before-upload="handleBeforeUpload"
    :on-exceed="handleonExceed"
    :on-change="handleChange"
    :on-remove="handleRemove"
    :http-request="customUpload"
  >
    <div :id="triggerId">
      <slot name="default">
        <el-button>点击上传</el-button>
      </slot>
      <slot name="trigger"></slot>
      <slot name="tip"></slot>
    </div>
    <!-- edit dialog -->
    <el-dialog
      v-model="dialogVisible"
      append-to-body
      title="图像剪裁"
      top="10vh"
      custom-class="uploader-cropper-dialog"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      @close="cropperMethod('close')"
    >
      <div class="cropper_main">
        <img src ref="CropperImg" />
      </div>
      <div class="cropper_actions flex-row align-center">
        <div class="flex-1">
          <el-button-group>
            <el-button title="左旋" @click="cropperMethod('rotateLeft')">
              <el-icon><refresh-left /></el-icon>
              左旋
            </el-button>
            <el-button title="右旋" @click="cropperMethod('rotateRight')">
              <el-icon><refresh-right /></el-icon>
              右旋
            </el-button>
          </el-button-group>
          <el-button-group>
            <el-button title="水平镜像" @click="cropperMethod('scaleX')">
              <el-icon style="transform: rotateZ(90deg)"><sort /></el-icon>
              水平镜像
            </el-button>
            <el-button title="垂直镜像" @click="cropperMethod('scaleY')">
              <el-icon><sort /></el-icon>
              垂直镜像
            </el-button>
          </el-button-group>
          <el-button-group>
            <el-button title="重置" @click="cropperMethod('reset')">
              <el-icon><refresh /></el-icon>
              重置
            </el-button>
          </el-button-group>
        </div>

        <el-button type="primary" plain @click="cropperMethod('save')">
          <el-icon><crop /></el-icon>
          确定
        </el-button>
      </div>
    </el-dialog>
  </el-upload>
</template>
<script>
import { fixImgFile } from "ios-photo-repair";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import { inject } from "vue";
import {
  Crop,
  Refresh,
  Sort,
  RefreshRight,
  RefreshLeft,
} from "@element-plus/icons-vue";

let cropperInstance;

// 调试开关
const DEBUG = process.env.NODE_ENV === "development";

// 图片压缩成jpg格式
const fixJpgFileName = function (fileName) {
  if (fileName.match(/\.jpg|\.jpeg$/)) {
    return fileName;
  }
  return fileName + ".jpg";
};

// 文件类型集合
const FileTypeMap = {
  "t-image": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
  "t-video": [".mp4", ".rmvb", ".avi", ".mov", ".3gp", ".webm"],
  "t-audio": [".wav", ".mp3", ".ogg", ".acc"],
  "t-word": [".docx", ".doc"],
  "t-excel": [".xlsx", ".xls"],
  "t-ppt": [".ppt", ".pptx"],
  "t-document": [".pdf", "t-word", "t-excel", "t-ppt"],
  "t-zip": [".zip", ".rar"],
};

export default {
  name: "Uploader",
  props: {
    modelValue: {
      type: Array,
      required: false,
      default() {
        return [];
      },
    },
    triggerId: {
      // 配合实现富文本插件上传功能
      type: String,
      required: false,
      default: "upload_image_trigger" + parseInt(Math.random() * 1e8),
    },
    limitSize: {
      // 文件尺寸限制
      type: Number,
      required: false,
      default() {
        return 100 * 1024 * 1024;
      },
    },
    imgCompress: {
      // 开启图片压缩
      type: Boolean,
      required: false,
      default() {
        return true;
      },
    },
    imgCompressOption: {
      // 图片压缩配置
      type: Object,
      required: false,
      default() {
        return {
          maxWidth: 1000,
          maxHeight: 1000,
        };
      },
    },
    imgCrop: {
      // 开启图片剪裁
      type: Boolean,
      required: false,
      default() {
        return false;
      },
    },
    imgCropOption: {
      // 图片剪裁配置
      type: Object,
      required: false,
      default() {
        return {
          ratio: 1,
          minWidth: 0,
          minHeight: 0,
          maxWidth: 1000,
          maxHeight: 1000,
        };
      },
    },
    uploadMethod: {
      // 自定义上传方法，参数（file/blob, fileName）
      type: Function,
      required: false,
    },
    responseTransfer: {
      // 接口返回数据 与 fileList 数据格式转换函数
      type: Function,
      required: false,
      default(response) {
        return response;
      },
    },
    BeforeUploadError: {
      // 上传前校验失败回调
      type: Function,
      required: false,
      default(info) {
        return console.warn(info);
      },
    },
  },
  components: {
    Crop,
    Refresh,
    Sort,
    RefreshRight,
    RefreshLeft,
  },
  data() {
    return {
      dialogVisible: false,
      cropResult: null,
      fileListFinnal: [],
      controller: null,
      globalOption: {},
    };
  },
  computed: {
    acceptFinnal() {
      if (this.$attrs.accept && this.$attrs.accept.indexOf("t-") !== -1) {
        const typeArray = this.$attrs.accept.split(",");
        let result = [];
        typeArray.forEach((type) => {
          result = result.concat(this.getExtByType(type));
        });
        return result.join(",");
      } else {
        return this.$attrs.accept || "*";
      }
    },
    propsFinnal() {
      const getDefaultValue = (key) => {
        if (Object.keys(this.globalOption).indexOf(key) !== -1) {
          return this.globalOption[key];
        }
        return this.$props[key];
      };
      let result = {};
      Object.keys(this.$props).forEach((prop) => {
        result[prop] = getDefaultValue(prop);
      });
      return result;
    },
  },
  watch: {
    modelValue: {
      handler(newValue) {
        this.fileListFinnal = this.$attrs.fileList || newValue || [];
        if (this.$refs.myupload) {
          this.$refs.myupload.uploadFiles = newValue.filter((ef) => {
            return newValue.findIndex((f) => f.uid === ef.uid) !== -1;
          });
        }
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    getExtByType(type) {
      const quickType = Object.assign(
        {},
        FileTypeMap,
        this.globalOption.quickType || {}
      );
      if (type && Array.isArray(quickType[type])) {
        let classList = [];
        let extList = [];
        quickType[type].forEach((e) => {
          if (e.indexOf("t-") === 0) {
            classList.push(e);
          } else {
            extList.push(e);
          }
        });
        if (classList.length) {
          classList.forEach((classType) => {
            extList = extList.concat(this.getExtByType(classType));
          });
        }
        return extList;
      } else if (type && type.split) {
        return [type.toLowerCase()];
      }
    },
    handleBeforeUpload: function (file) {
      // 尺寸校验
      if (file.size > this.propsFinnal.limitSize) {
        this.propsFinnal.BeforeUploadError({
          message: "文件大小超出限制",
          type: "warning",
        });
        return false;
      }
      // 格式校验
      if (
        this.acceptFinnal !== "*" &&
        this.acceptFinnal.indexOf(
          file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
        ) === -1
      ) {
        this.propsFinnal.BeforeUploadError({
          message: "文件格式不正确",
          type: "warning",
        });
        return false;
      }

      if (typeof this.$attrs["before-upload"] === "function") {
        return this.$attrs["before-upload"](file);
      } else if (
        this.globalOption &&
        typeof this.globalOption.beforeUpload === "function"
      ) {
        return this.globalOption.beforeUpload(file);
      } else {
        return true;
      }
    },
    handleonExceed: function (file, fileList) {
      if (typeof this.$attrs["on-exceed"] === "function") {
        this.$attrs["on-exceed"](file, fileList);
      } else if (
        this.globalOption &&
        typeof this.globalOption.onExceed === "function"
      ) {
        this.globalOption.onExceed(file, fileList);
      }
    },
    handleChange: function (file, fileList) {
      const doneFiles = fileList.filter((e) => e.status === "success");
      if (doneFiles.length === fileList.length) {
        this.$emit(
          "update:modelValue",
          doneFiles.map((e) => {
            let data = e.response
              ? this.propsFinnal.responseTransfer(e.response)
              : e;
            // 扩展字段
            data.uid = e.uid;
            data.status = e.status;
            return data;
          })
        );
      }

      if (typeof this.$attrs["on-change"] === "function") {
        this.$attrs["on-change"](file, fileList);
      }
    },
    handleProgress(e) {
      if (typeof this.$attrs["on-progress"] === "function") {
        if (e.total > 0) {
          e.percent = (e.loaded / e.total) * 100;
        }
        this.$attrs["on-progress"](e);
      }
    },
    handleRemove: function (file, fileList) {
      this.$emit(
        "update:modelValue",
        fileList.map((e) => {
          let data = e.response
            ? this.propsFinnal.responseTransfer(e.response)
            : e;
          data.uid = e.uid;
          return data;
        })
      );

      if (typeof this.$attrs["on-remove"] === "function") {
        this.$attrs["on-remove"](file, fileList);
      }
    },
    customUpload: async function (params) {
      if (
        !this.globalOption &&
        !this.globalOption.uploadMethod &&
        !this.propsFinnal.uploadMethod
      ) {
        return console.warn(
          "Uploader: The required configuration [uploadMethod] is missing!"
        );
      }

      const theUploadRequest =
        this.propsFinnal.uploadMethod || this.globalOption.uploadMethod;
      if (typeof theUploadRequest !== "function") {
        return console.warn("Uploader: [uploadMethod] must be a Function!");
      }

      const uploadedFileType = params.file.type;
      DEBUG && console.log("uploadedFileType", uploadedFileType);

      let formDataFileObj = params.file;
      let formDataFileName = params.file.name;

      if (uploadedFileType.indexOf("image/") === 0) {
        if (this.propsFinnal.imgCrop) {
          // 图片剪裁
          this.cropResult = null;
          this.dialogVisible = true;

          const imgBlob = await new Promise((resolve) => {
            let oReader = new FileReader();
            oReader.onload = (e) => {
              let base64 = e.target.result;
              let img = this.$refs.CropperImg;
              img.src = base64;
              //
              if (cropperInstance) {
                cropperInstance.destroy();
              }

              cropperInstance = new Cropper(img, {
                viewMode: 1,
                dragMode: "none",
                movable: false,
                zoomOnTouch: false,
                zoomOnWheel: false,
                toggleDragModeOnDblclick: false,
                aspectRatio: this.propsFinnal.imgCropOption.ratio,
              });
            };
            oReader.readAsDataURL(params.file);

            this.$watch("cropResult", resolve);
          });

          if (imgBlob) {
            DEBUG && console.log("imgCrop", imgBlob);
            formDataFileObj = imgBlob;
            formDataFileName = fixJpgFileName(formDataFileName);
            this.cropperMethod("close");
          }
        } else if (this.propsFinnal.imgCompress) {
          // 图片压缩
          const imgBlob = await fixImgFile(
            params.file,
            Object.assign({}, this.propsFinnal.imgCompressOption, {
              outType: "blob",
            })
          );

          DEBUG && console.log("imgCompress", imgBlob);
          formDataFileObj = imgBlob;
          formDataFileName = fixJpgFileName(formDataFileName);
        }
      }

      // 上传
      DEBUG && console.log("upload params", formDataFileName, formDataFileObj);
      this.controller = new AbortController();
      return theUploadRequest(formDataFileObj, formDataFileName, {
        onUploadProgress: this.handleProgress,
        signal: this.controller.signal,
      }).then((res) => {
        return res.data;
      });
    },
    cropperMethod(action) {
      // 剪裁相关处理方法
      switch (action) {
        case "save":
          cropperInstance
            .getCroppedCanvas({
              minWidth: this.propsFinnal.imgCropOption.minWidth,
              minHeight: this.propsFinnal.imgCropOption.minHeight,
              maxWidth: this.propsFinnal.imgCropOption.maxWidth || 1000,
              maxHeight: this.propsFinnal.imgCropOption.maxHeight || 1000,
              imageSmoothingQuality: "medium",
            })
            .toBlob((blob) => {
              this.cropResult = blob;
            }, "image/jpeg");
          break;
        case "close":
          this.dialogVisible = false;
          if (cropperInstance) {
            cropperInstance.destroy();
          }
          if (!this.cropResult) {
            const newValue = [].concat(this.modelValue);
            newValue.pop();
            this.$emit("update:modelValue", newValue);
          }
          break;
        case "rotateLeft":
          cropperInstance.rotate(-90);
          break;
        case "rotateRight":
          cropperInstance.rotate(90);
          break;
        case "scaleX":
          cropperInstance.scaleX(-1);
          break;
        case "scaleY":
          cropperInstance.scaleY(-1);
          break;
        case "reset":
          cropperInstance.reset();
          break;
        default:
          console.warn("cropperMethod 参数错误: ", action);
      }
    },
    clearFiles() {
      // el-upload 方法
      this.$refs.myupload.clearFiles();
    },
    abort() {
      this.controller.abort();
    },
    submit() {
      // el-upload 方法
      this.$refs.myupload.submit();
    },
  },
  created() {
    this.globalOption = inject("$UploaderOption");
    DEBUG && console.log(this.globalOption);
  },
};
</script>
<style>
.uploader-cropper-dialog .el-dialog__body {
  padding: 0;
}
</style>
<style scoped>
/* 图片剪裁弹窗 */

.cropper_main {
  height: 50vh;
  min-height: 500px;
}

.cropper_actions {
  padding: 0.5em;
}

.cropper_actions :deep(.el-button-group) {
  margin-right: 10px;
}
</style>
