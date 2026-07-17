# AutoDL / Zealman API 工作流目录

记录时间：2026-07-17（实例关闭前）  
实例入口：`https://uu863228-7841f4d2206a.westd.seetacloud.com:8443/`  
列表接口：`GET /api/workflow/list`  
总数：61 个

本目录只保存工作流 ID、名称和功能分类，不保存 API Key、SSH 密码或 Token。

## 调用格式

- `video`：图生视频、首尾帧、动作迁移、导演流、成人特效等，输出视频。
- `image`：文生图、图片编辑、换脸、换装、姿势、放大和多图合成，输出图片。
- `digital_human`：数字人或角色动作迁移，输出视频。
- `audio`：声音克隆或音频驱动，输出音频/视频。
- `none`：面板未标注类型，重新启用前必须人工确认输入节点和输出节点。

## 视频（34）

`WAN-NSFW-Undress`、`WAN2.2 NSFW 4in1 Adult PX`、`NSFW-LTX2.3-Anal (API)`、`功能08-Wan2.2-4in1成人特效（本地）`、`NSFW-LTX2.3-AllMotion (API)`、`NSFW-LTX2.3-Motion (API)`、`NSFW-LTX2.3-Anime (API)`、`NSFW-LTX2.3-SexyMove (API)`、`NSFW-LTX2.3-Slapping (API)`、`NSFW-LTX2.3-Oral (API)`、`NSFW-LTX2.3-Cumshot (API)`、`NSFW-LTX2.3-PosingNude (API)`、`NSFW-LTX2.3-AllInOne (API)`、`H28-LTX2.3-高动态图生视频`、`测试01-Wan2.2Remix-图生视频`、`新增06-P27-Scail2-循环长视频`、`新增04-H41-LTX2.3-MSR-V2`、`新增03-P26-Scail2-分段长视频`、`新增02-P25-Scail2-动作迁移`、`新增01-P24-Scail2-人物替换`、`测试06-角色动作迁移-WanAnimate`、`G01-图生视频-Wan2.2万相基础版`、`测试05-音频驱动-LTX2.3`、`功能09-Wan2.2-电影近景特效（本地）`、`测试03-LTX2.3-Sulphur-导演流`、`功能06-人物动作迁移（本地）`、`测试02-Wan2.2Remix-首尾帧`、`G02-首尾帧-Wan2.2首尾帧视频`、`G03-图生视频-Wan2.2SmoothMix`、`G07-图生视频-Wan2.2+LightX2V-WorkFisher`、`G10-图生视频-Wan2.2SmoothMixV2`、`H17-文图生视频-LTX2.3全面优化版`、`H31-ltx2.3声音-图像生成视频`、`Y08-四宫格-LTX-2.3图生视频优化版`。

## 图片（17）

`功能04-成年虚构角色换装（本地）`、`B13-千问角色一键多角度_multiple_character_angles-v1.0`、`功能05-人物姿势重构（本地）`、`测试04-文本生图-ZImage`、`新增05-T7-Krea2-图像编辑`、`测试07-多图编辑-Klein`、`功能07-图片高清修复（本地）`、`功能03-自然语言图片编辑（本地）`、`功能02-多图智能合成（本地）`、`功能01-授权虚构角色换脸（本地）`、`C07-文生图-Zimage-Nunchaku加速`、`A01-文生图-Qwen2512高清放大`、`C16-短剧文生图专用-支持场景-角色`、`D20-RAW画质重建Adonis_Workflow`、`A08-洗图-Qwen二次元转真人高清放大`、`D14-分镜-Flux克莱因9B多角度多场景`、`D18-klein9b真人剧制造机-多图编辑`。

## 数字人 / 音频

- 数字人：`J11-LTX2.3高清超自然电商数字人`、`P02-动作迁移-Wan2.2Animate角色迁移`
- 音频：`N2-单人声音克隆FishAudio S2pro`

## 未标注类型（7）

`H41-AI代码侠土豆-LTX2.3-MSR多参考图生成`、`T4-Krea2-int8-角色设定三视图`、`J13-小珠光90秒全自动版-单人InfiniteTalk`、`P07-动作迁移-Wan2.2AnimateV4`、`P17-动作迁移4090-48G显卡专用V8`、`C19-人物设定三视图zimage双采`、`C18-豹豹喵呜制作-白玉AIO三采超高清写真生成`。

## 后续使用

1. 先用工作流 ID 对照新实例的 `/api/workflow/list`，再恢复网站映射。
2. 图片输入通常先上传到 `/upload/image`，再写入 `LoadImage` 节点。
3. 任务提交使用工作流生成接口，状态通过 `/history/{prompt_id}` 查询。
4. 成人相关工作流只用于成年人、虚构或明确授权素材，不处理未成年人、名人色情或未经同意的真人内容。
