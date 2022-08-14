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
    <slot name="default">
      <el-button>点击上传</el-button>
    </slot>
    <template #tip>
      <slot name="tip"></slot>
    </template>

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

<script setup>
import { ref, computed, watch, inject, useAttrs, onMounted } from "vue";
import { fixImgFile } from "ios-photo-repair";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
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
import FileTypeMap from "../assets/FileTypeMap.js";

const props = defineProps({
  accept: {
    type: String,
    default: "*",
  },
  modelValue: {
    type: Array,
    required: false,
    default() {
      return [];
    },
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
});

// 事件
const emits = defineEmits(["update:modelValue"]);

// 插件全局配置
const globalOption = inject("$UploaderOption");
// 最终配置
const propsFinnal = computed(() => {
  const globalOptionKeys = Object.keys(globalOption);

  let result = {};
  Object.keys(props).forEach((prop) => {
    result[prop] =
      globalOptionKeys.indexOf(prop) === -1 ? props[prop] : globalOption[prop];
  });
  return result;
});
// 上传组件ref
const myupload = ref(null);

const getExtByType = (type) => {
  const quickType = Object.assign(
    {},
    FileTypeMap,
    globalOption.quickType || {}
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
        extList = extList.concat(getExtByType(classType));
      });
    }
    return extList;
  } else if (type && type.split) {
    return [type.toLowerCase()];
  }
};

const acceptFinnal = computed(() => {
  if (props.accept && props.accept.indexOf("t-") !== -1) {
    const typeArray = props.accept.split(",");
    let result = [];
    typeArray.forEach((type) => {
      result = result.concat(getExtByType(type));
    });
    return result.join(",");
  } else {
    return props.accept || "*";
  }
});
// attrs
const attrs = useAttrs();
const fileListFinnal = computed(
  () => {
    return attrs.fileList || props.modelValue || [];
  },
  {
    immediate: true,
  }
);
// 组件变量
let dialogVisible = ref(false);
let cropResult = ref(null);
let controller = ref(null);

// 方法
const handleBeforeUpload = function (file) {
  // 尺寸校验
  if (file.size > propsFinnal.value.limitSize) {
    propsFinnal.value.BeforeUploadError({
      message: "文件大小超出限制",
      type: "warning",
    });
    return false;
  }
  // 格式校验
  if (
    acceptFinnal.value !== "*" &&
    acceptFinnal.value.indexOf(
      file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
    ) === -1
  ) {
    console.log(file.name.substring(file.name.lastIndexOf(".")).toLowerCase());
    propsFinnal.value.BeforeUploadError({
      message: "文件格式不正确",
      type: "warning",
    });
    return false;
  }

  if (typeof attrs["before-upload"] === "function") {
    return attrs["before-upload"](file);
  } else if (globalOption && typeof globalOption.beforeUpload === "function") {
    return globalOption.beforeUpload(file);
  } else {
    return true;
  }
};

const handleonExceed = function (file, fileList) {
  if (typeof attrs["on-exceed"] === "function") {
    attrs["on-exceed"](file, fileList);
  } else if (globalOption && typeof globalOption.onExceed === "function") {
    globalOption.onExceed(file, fileList);
  }
};

const handleChange = function (file, fileList) {
  const doneFiles = fileList.filter((e) => e.status === "success");
  if (doneFiles.length === fileList.length) {
    emits(
      "update:modelValue",
      doneFiles.map((e) => {
        let data = e.response
          ? propsFinnal.value.responseTransfer(e.response)
          : e;
        // 扩展字段
        data.uid = e.uid;
        data.status = e.status;
        return data;
      })
    );
  }

  if (typeof attrs["on-change"] === "function") {
    attrs["on-change"](file, fileList);
  }
};
const handleProgress = function (e) {
  if (typeof attrs["on-progress"] === "function") {
    if (e.total > 0) {
      e.percent = (e.loaded / e.total) * 100;
    }
    attrs["on-progress"](e);
  }
};
const handleRemove = function (file, fileList) {
  emits(
    "update:modelValue",
    fileList.map((e) => {
      let data = e.response
        ? propsFinnal.value.responseTransfer(e.response)
        : e;
      data.uid = e.uid;
      return data;
    })
  );

  if (typeof attrs["on-remove"] === "function") {
    attrs["on-remove"](file, fileList);
  }
};

const cropperMethod = function (action) {
  // 剪裁相关处理方法
  switch (action) {
    case "save":
      cropperInstance
        .getCroppedCanvas({
          minWidth: propsFinnal.value.imgCropOption.minWidth,
          minHeight: propsFinnal.value.imgCropOption.minHeight,
          maxWidth: propsFinnal.value.imgCropOption.maxWidth || 1000,
          maxHeight: propsFinnal.value.imgCropOption.maxHeight || 1000,
          imageSmoothingQuality: "medium",
        })
        .toBlob((blob) => {
          cropResult.value = blob;
        }, "image/jpeg");
      break;
    case "close":
      dialogVisible.value = false;
      if (cropperInstance) {
        cropperInstance.destroy();
      }
      if (!cropResult.value) {
        const newValue = [].concat(props.modelValue);
        newValue.pop();
        emits("update:modelValue", newValue);
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
};
const clearFiles = function () {
  // el-upload 方法
  myupload.value.clearFiles();
};
const abort = function () {
  controller.value.abort();
};
const submit = function () {
  // el-upload 方法
  myupload.value.submit();
};
// 剪裁图片DOM
const CropperImg = ref(null);
// 自定义上传逻辑
const customUpload = async (params) => {
  if (
    !globalOption &&
    !globalOption.uploadMethod &&
    !propsFinnal.value.uploadMethod
  ) {
    return console.warn(
      "Uploader: The required configuration [uploadMethod] is missing!"
    );
  }

  const theUploadRequest =
    propsFinnal.value.uploadMethod || globalOption.uploadMethod;
  if (typeof theUploadRequest !== "function") {
    return console.warn("Uploader: [uploadMethod] must be a Function!");
  }

  const uploadedFileType = params.file.type;
  DEBUG && console.log("uploadedFileType", uploadedFileType);

  let formDataFileObj = params.file;
  let formDataFileName = params.file.name;

  if (uploadedFileType.indexOf("image/") === 0) {
    if (propsFinnal.value.imgCrop) {
      // 图片剪裁
      cropResult.value = null;
      dialogVisible.value = true;

      const imgBlob = await new Promise((resolve) => {
        let oReader = new FileReader();
        oReader.onload = (e) => {
          let base64 = e.target.result;
          let img = CropperImg.value;
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
            aspectRatio: propsFinnal.value.imgCropOption.ratio,
          });
        };
        oReader.readAsDataURL(params.file);

        watch(cropResult, resolve);
      });

      if (imgBlob) {
        DEBUG && console.log("imgCrop", imgBlob);
        formDataFileObj = imgBlob;
        formDataFileName = fixJpgFileName(formDataFileName);
        cropperMethod("close");
      }
    } else if (propsFinnal.value.imgCompress) {
      // 图片压缩
      const imgBlob = await fixImgFile(
        params.file,
        Object.assign({}, propsFinnal.value.imgCompressOption, {
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
  controller.value = new AbortController();
  return theUploadRequest(formDataFileObj, formDataFileName, {
    onUploadProgress: handleProgress,
    signal: controller.value.signal,
  }).then((res) => {
    return res.data;
  });
};

// onMounted(() => {
//   console.warn(CropperImg.value);
// });
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
