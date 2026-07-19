// hifun.ai tool configurations — drives tool.html
window.__TOOL_CONFIG__ = {
  "image-editor": {
    name: "图片编辑器",
    type: "image",
    desc: "无审查图片编辑 · 重绘 · 扩图 · 局部修复",
    upload: { single: true, multiple: true, accept: "image/*", hint: "支持 JPG、PNG、WebP，最大 20MB" },
    prompt: { label: "人工智能提示", placeholder: "描述你想要的修改效果...", hint: "描述越详细，效果越精准" },
    credit: 1,
    link: "./zh/app/image-editor/"
  },
  "face-swap": {
    name: "AI 换脸",
    type: "face-swap",
    desc: "上传照片一键换脸 · 支持多人脸检测",
    upload: { single: true, multiple: true, accept: "image/*", hint: "上传源脸和目标的清晰正面照片" },
    prompt: { label: "换脸模式", placeholder: "描述换脸风格...", hint: "可选：自然融合、夸张特效、动漫风格" },
    credit: 2,
    link: "./zh/app/face-swap/"
  },
  "outfit-studio": {
    name: "性感礼服",
    type: "outfit",
    desc: "服饰与造型选择 · 品牌风格定制",
    upload: { single: true, multiple: false, accept: "image/*", hint: "上传人物照片，选择服装风格" },
    prompt: { label: "服装描述", placeholder: "描述想要的服装风格...", hint: "例如：蕾丝内衣、兔女郎装、丝袜" },
    credit: 2,
    link: "./zh/app/outfit-studio/"
  },
  "pose-generator": {
    name: "性爱姿势",
    type: "pose",
    desc: "姿势和镜头参考 · AI 姿势生成器 (59+)",
    upload: { single: true, multiple: false, accept: "image/*", hint: "上传参考照片，选择姿势类型" },
    prompt: { label: "姿势描述", placeholder: "描述想要的姿势和角度...", hint: "例如：传教士、后入式、女上位" },
    credit: 2,
    link: "./zh/app/pose-generator/"
  },
  "image-to-video": {
    name: "图片转视频",
    type: "video",
    desc: "单图生成动态视频 · 支持多种特效与风格",
    upload: { single: true, multiple: false, accept: "image/*", hint: "上传静态图片，自动生成动态视频" },
    prompt: { label: "视频描述", placeholder: "描述想要的视频效果和动作...", hint: "描述人物动作、镜头运动、场景氛围" },
    credit: 5,
    link: "./zh/app/image-to-video/",
    extra: { duration: true, ratio: true }
  },
  "undress-video": {
    name: "Undress Video",
    type: "video",
    desc: "成人脱衣特效视频 · 合规图片转视频工作台",
    upload: { single: true, multiple: false, accept: "image/*", hint: "上传穿着衣服的人物照片" },
    prompt: { label: "特效描述", placeholder: "描述脱衣过程和最终效果...", hint: "描述服装脱落顺序和最终裸露程度" },
    credit: 5,
    link: "./zh/app/undress-video/",
    effectSelector: { label: "选择辣味效果", source: "spicy-effects-data.js" }
  },
  "outfit-studio": {
    name: "性感礼服",
    type: "outfit",
    desc: "服饰与造型选择 · 品牌风格定制",
    upload: { single: true, multiple: false, accept: "image/*", hint: "上传人物照片，选择服装风格" },
    prompt: { label: "服装描述", placeholder: "描述想要的服装风格...", hint: "例如：蕾丝内衣、兔女郎装、丝袜" },
    credit: 2,
    link: "./zh/app/outfit-studio/",
    effectSelector: { label: "选择服装风格", source: "outfit-studio" }
  },
  "pose-generator": {
    name: "性爱姿势",
    type: "pose",
    desc: "姿势和镜头参考 · AI 姿势生成器 (59+)",
    upload: { single: true, multiple: false, accept: "image/*", hint: "上传参考照片，选择姿势类型" },
    prompt: { label: "姿势描述", placeholder: "描述想要的姿势和角度...", hint: "例如：传教士、后入式、女上位" },
    credit: 2,
    link: "./zh/app/pose-generator/",
    effectSelector: { label: "选择姿势", source: "pose-generator" }
  },
  "image-to-video": {
    name: "图片转视频",
    type: "video",
    desc: "单图生成动态视频 · 支持多种特效与风格",
    upload: { single: true, multiple: false, accept: "image/*", hint: "上传静态图片，自动生成动态视频" },
    prompt: { label: "视频描述", placeholder: "描述想要的视频效果和动作...", hint: "描述人物动作、镜头运动、场景氛围" },
    credit: 5,
    link: "./zh/app/image-to-video/",
    extra: { duration: true, ratio: true },
    effectSelector: { label: "选择视频特效", source: "spicy-effects-data.js" }
  }
};
