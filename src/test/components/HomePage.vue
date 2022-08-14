<template>
  <div>
    <div class="wrap">
      <div class="logo"></div>
      <h1 class="maintitle">&lt;uploader&gt;</h1>
      <h2 class="subtitle">
        基于ElementPlus，整合图片上传前压缩、上传前剪裁、IOS图片方向自动校正、自定义文件类型的
        Vue 上传组件
      </h2>

      <a
        href="https://github.com/cutting-mat/uploader-plus/blob/main/README.md"
        target="_blank"
        class="myBtn"
      >
        <i class="el-icon-reading"></i>
        文档
      </a>

      <h3 class="channeltitle">示例</h3>

      <div class="flex-row main">
        <div class="flex-1">
          <div class="demo">
            <uploader
              ref="myUploader"
              v-model="fileList"
              :data="{ test: 123 }"
              :limit="2"
              :on-progress="handleProgress"
            >
              <el-button>上传个文件</el-button>
            </uploader>
          </div>

          <div class="code">
            <textarea readonly>
            <uploader v-model="fileList" :data="{ test: 123 }" :limit="2" />
            </textarea>
          </div>
        </div>
        <div class="flex-1">
          <div class="demo">
            <uploader
              accept="t-image"
              :value="avatar ? [avatar] : []"
              imgCrop
              :show-file-list="false"
              :on-success="
                (res) => {
                  avatar = res.data;
                }
              "
            >
              <img
                :src="avatar.url"
                v-if="avatar"
                style="
                  width: 100px;
                  height: 100px;
                  object-fit: cover;
                  background: #666;
                "
              />
              <el-button v-else>上传个头像</el-button>
            </uploader>
          </div>

          <div class="code">
            <textarea readonly>
            <uploader accept="t-image" :value="avatar ? [avatar] : []" imgCrop :show-file-list="false" :on-success="res => {avatar = res.data}" />
            </textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      fileList: [],
      avatar: null,
    };
  },
  methods: {
    handleProgress(e) {
      console.log("handleProgress:", e.percent);
    },
  },
  created() {
    setTimeout(() => {
      this.fileList = [
        {
          name: "test",
          url: "http://dummyimage.com/200x200/a1f279/fff&text=IMAGE.png",
        },
      ];
    }, 1000);
  },
};
</script>

<style scoped>
.wrap {
  width: 1200px;
  text-align: center;
}

.maintitle {
  color: #000;
  font-size: 2.5em;
}
.subtitle {
  color: rgb(71, 101, 130);
  font-size: 1.6em;
  font-weight: normal;
  margin-bottom: 20px;
}
.channeltitle {
  font-size: 1.5em;
  color: #000;
  margin: 40px 0 20px;
  font-weight: normal;
}

.links .el-link {
  margin: 0 10px;
}

.myBtn {
  display: inline-block;
  border-radius: 6px;
  padding: 0 24px;
  line-height: 52px;
  font-size: 1.2rem;
  font-weight: 500;
  color: #f8f8f8;
  background-color: #4abf8a;
  border: 2px solid #3eaf7c;
  transition: background-color 0.1s ease;
}

.main .flex-1 {
  margin: 0 10px;
}
.demo {
  height: 100px;
  margin-bottom: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 10px;
}
.code {
  background: #333;
  padding: 10px;
  border-radius: 8px;
  min-height: 50px;
  margin: 20px auto;
  max-width: 600px;
}
.code > textarea {
  width: 100%;
  height: 100%;
  border: 0;
  color: #fff;
  background: transparent;
  resize: none;
  font-family: "Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande",
    "Lucida Sans", Arial, sans-serif;
  line-height: 1.7;
}
</style>
