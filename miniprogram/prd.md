快速选照片（WeChat 小程序）完整规格

目标：一键跑通“多图上传 → AI 选一张最佳 → 两两对比筛选 → 相册管理 → 分享给朋友点赞评论（实时回流）”。

0. 技术栈与项目骨架

平台：微信小程序（原生）

目录结构

/miniprogram
  app.js / app.json / app.wxss
  /assets  （icon、占位图、配色变量）
  /pages
    /home            （页面1：上传入口）
    /picker          （页面2：系统相册选择）
    /analyze         （页面3：AI智能分析 + 进度条）
    /recommend       （页面4：AI推荐）
    /compare         （页面5：初步筛选，两两对比）
    /album           （页面6：相册） 
    /share           （朋友侧查看页：点赞评论）
  /components
    PhotoCard/       （缩略图卡片，右上角心形、皇冠、全屏icon）
    ComparePane/     （左右/上下对比容器 + 联动缩放）
    TagChips/        （光线/构图/画质/五官/氛围）
    ProgressBar/
/cloudfunctions（可选：若用微信云开发）
  aiPick/           （转发至你的后端或直连 OpenAI）
  shareApis/
/server（可选：你自备 Node 服务时）
  index.js


状态管理：使用 globalData + storage（键名见「状态与存储」）

适配：暗色模式、iPhone 安全区

1. 视觉与文案基调（与截图一致）

主色：#FF2D83（粉色，用于按钮/描边/进度）

标题字重：Semibold；正文：Regular

按钮：粉底白字（大圆角）

描边：粉色 3px；最佳照右上角 皇冠 icon

Loading 文案轮播：光线 / 构图 / 画质 / 五官 / 氛围

2. 交互流程（6页）
页面1 /home：上传入口

主标题：快速选照片

副标题：选照片从未如此简单

按钮：选择多张照片（粉底白字，居中，靠下）

玩法三行小字（与截图一致）：

可直接信赖AI的审美，沿用AI帮你筛选的最佳照片

也可两两对比，体验筛选的乐趣，pick的照片都将存入相册

如果还是非常纠结，可以一键发给朋友帮忙挑选

事件

点击按钮 → wx.chooseMedia({count: 100, mediaType: ['image']}) → 跳转 /pages/analyze/index

页面2 /picker：系统相册

（如你更想完全自定义，可保留；默认直接用 chooseMedia，可不单独建页）

页面3 /analyze：AI 智能分析

标题：AI智能分析中

进度条 + 百分比

Loading 文案（循环打点）：光线、构图、画质、五官、氛围……

流程

将用户选图 tempFilePath[] 转 base64（尺寸压缩到 1600px 长边、JPEG 质量 0.8）

调用 POST /ai/pick

正常 → 跳 /pages/recommend/index

失败 → 降级：使用本地启发式评分（见「降级策略」）

页面4 /recommend：AI为你推荐

大图：粉色描边 + 右上角皇冠

下方标签：光线/构图/画质/五官/氛围（由返回的 tags 决定高亮）

推荐理由：一段话（不超过 60 字）

按钮：去对比

事件

去对比 → 跳 /pages/compare/index?sessionId=xxx

页面5 /compare：初步筛选（两两对比）

标题：初步筛选

布局规则

横图：上下对比

竖图：左右对比

不裁剪原图；容器内 contain 展示

对比对象：默认左/上为 AI 最佳（粉色描边 + 皇冠）

手势与按钮

上/左滑：当前卡片“更好”，替换最佳

下/右滑：不保留（软删除）

暂存：持平 → 入相册（按钮显示计数）

撤回（仅icon）：撤销上一步

全屏 icon：查看大图

双指缩放联动：A/B 同步缩放（对比时一致性检查）

逻辑

遍历其余照片，与当前“最佳”逐一对比

走完全部后 → 自动跳 /pages/album/index

页面6 /album：相册与分享

三列网格；每张右上角灰色心形 + 数字

点击图片 → 详情页（内部路由）：可删除、查看评论列表

右上角 分享按钮：

创建分享会话 POST /share/create → 返回 shareId

打开 /pages/share/index?shareId=xxx

朋友侧 /share：点赞与评论

顶部大图 + 横向缩略图条

底部：评论输入框、红心按钮

朋友点赞/评论 → 调用 /share/like、/share/comment

用户侧回流：打开相册时轮询 /share/sync 或订阅消息（如用云开发可用 realtime）

3. 数据与接口（可先 Mock，后切换真接口）
3.1 统一数据模型
type Photo = {
  id: string;                // 客户端生成 uuid
  path: string;              // 临时/持久路径（本地或CDN）
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait' | 'square';
  meta?: { exif?: any };
};

type AiPickResult = {
  bestId: string;
  reason: string;            // 推荐理由
  tags: Array<'光线'|'构图'|'画质'|'五官'|'氛围'>; // 高亮标签
  scored?: Array<{ id: string; score: number; details?: Record<string, number> }>;
};

type CompareAction = 'better' | 'worse' | 'same';

type AlbumItem = {
  id: string;
  photo: Photo;
  liked: number;
  comments: Array<{ id: string; author: string; content: string; ts: number }>;
};

3.2 接口契约
POST /ai/pick

入参

{
  "sessionId": "string",
  "photos": [
    { "id": "p1", "base64": "data:image/jpeg;base64,..." },
    { "id": "p2", "base64": "..." }
  ],
  "needScores": true
}


出参

{
  "bestId": "p2",
  "reason": "构图稳定、地平线平直、天空层次丰富。",
  "tags": ["构图","氛围","画质"],
  "scored": [
    {"id":"p1","score":0.62,"details":{"light":0.6,"composition":0.7,"clarity":0.58,"face":0.0,"mood":0.65}},
    {"id":"p2","score":0.81,"details":{"light":0.78,"composition":0.85,"clarity":0.8,"face":0.0,"mood":0.82}}
  ]
}

POST /share/create

入参：{ sessionId, album: AlbumItem[] }

出参：{ shareId, url }

POST /share/like

入参：{ shareId, photoId }

出参：{ liked: number }

POST /share/comment

入参：{ shareId, photoId, author, content }

出参：{ commentId, ts }

GET /share/sync?shareId=xxx

出参：{ album: AlbumItem[] }

如使用微信云开发：将以上 4 个接口用云函数映射；或在 aiPick/ 内转发到你自有 Node 服务（支持域名白名单）。

4. AI 调用策略（Claude/GPT 提示词）

后端调用时传入 系统提示词（system） 与 用户提示词（user）。

system

你是照片选优评审。给定多张图片，请基于以下维度给出一个最优照片的ID，并给出简洁、非套话的推荐理由：
1) 光线 2) 构图 3) 画质 4) 五官/主体状态（如有人像） 5) 氛围
规则：
- 只选1张最佳，必要时在近似照片中考虑地平线、景深、抖动、遮挡、眩光、噪点。
- 返回 JSON，字段：bestId、reason、tags（从["光线","构图","画质","五官","氛围"]中选2-3个）、scored（可选）。
- 语言：简体中文，理由不超过60字，避免空洞形容词。


user（示例）

照片列表（已按base64传输）。如果识别到明显横竖构图差异，优先选择更规整的地平线和更清晰的主体。请输出 JSON。

5. 关键前端逻辑
5.1 方向判断
const orientation = (w, h) =>
  w > h ? 'landscape' : (w < h ? 'portrait' : 'square');

5.2 比例不同不裁剪、联动缩放

容器统一以 短边满、object-fit: contain

ComparePane 维护一个 scale 与 translate，两个子面板绑定同一套手势矩阵（在 onPinch 中同步）

5.3 对比遍历器

queue = others[]

currentBest = bestId

用户对每一张给出 better/worse/same

better → currentBest = thatId，旧 best 进 tempKeep[]

worse → trash[]

same → tempKeep[]

全部结束 → album = [currentBest, ...tempKeep]

5.4 撤回

用 命令栈 记录每一步（{type, payload, prevState}），点击撤回时 pop + restore(prevState)

6. 状态与本地存储键

g.session: { id, createdAt }

g.photos: Photo[]（原始选图）

g.aiResult: AiPickResult

g.compare: { index, currentBestId, queueIds, keepIds, trashIds, history[] }

g.album: AlbumItem[]

本地缓存键：

PP_SESSION_${id}_ALBUM

PP_SESSION_${id}_AIREASON

7. 降级策略（离线/失败兜底）

/ai/pick 请求失败时：

图像启发式评分（亮度直方图均衡度 + 清晰度（Laplacian）+ 人脸可选（wx.getFileSystemManager 不支持时跳过））

规则：亮度过曝/过暗扣分；强抖动/糊扣分；地平线倾斜 > 5°扣分

仍输出与 AI 相同结构的 JSON，reason 改为「基于本地规则判断」。

8. 权限与合法域名

小程序后台 → 开发 → 服务器域名：加入你的后端域名（https）

权限弹窗：相册读写；分享消息

图片大小：建议单张 ≤ 2MB（上传前压缩）

9. 可复用组件清单

PhotoCard：props { photo, crown?, liked?, onFullscreen }

ComparePane：props { aPhoto, bPhoto, layout: 'vertical'|'horizontal', onGesture }

TagChips：props { tags: string[] }

ProgressBar：props { percent }

10. 验收标准（UAT）

选 10 张图，30 秒内出推荐；

横图走 上下对比、竖图走 左右对比，且不裁剪；

双指缩放联动无抖动，放大后拖动两张保持相同 ROI；

better/worse/same 行为正确，撤回恢复上一步状态；

相册三列，删除/全屏可用；

分享页点赞/评论后，用户相册内红心数/评论数刷新；

AI 不可用时能降级并给出理由；

所有按钮与描边均使用粉色主色，推荐照右上角有皇冠；

页面文案与你截图一致（尤其首页与分析页文案）。

11. 示例页面原型（Claude 可直接照此生成）
app.json
{
  "pages": [
    "pages/home/index",
    "pages/analyze/index",
    "pages/recommend/index",
    "pages/compare/index",
    "pages/album/index",
    "pages/share/index"
  ],
  "window": {
    "navigationStyle": "default",
    "navigationBarTextStyle": "white",
    "navigationBarBackgroundColor": "#111",
    "backgroundTextStyle": "dark"
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}

pages/home/index.wxml（要点）
<view class="wrap">
  <text class="title">快速选照片</text>
  <text class="subtitle">选照片从未如此简单</text>
  <button class="primary" bindtap="onPick">选择多张照片</button>
  <view class="tips">
    <text>可直接信赖AI的审美，AI帮你筛选最佳</text>
    <text>也可两两对比，体验筛选的乐趣，Pick的照片将存入相册</text>
    <text>如果还是非常纠结，可以一键发给朋友帮忙挑选</text>
  </view>
</view>

pages/analyze/index.js（核心流程骨架）
Page({
  data:{ percent: 0, hint: '光线、构图、画质、五官、氛围……' },
  onLoad(){
    const photos = getApp().globalData.photos || [];
    this.loopProgress();
    this.callAiPick(photos);
  },
  loopProgress(){
    let p = 5;
    this.timer = setInterval(()=>{
      p = Math.min(95, p + Math.random()*5);
      this.setData({ percent: Math.floor(p) });
    }, 300);
  },
  async callAiPick(photos){
    try{
      const payload = await toBase64Payload(photos);
      const res = await request('/ai/pick', { method:'POST', data: payload });
      getApp().globalData.aiResult = res;
      clearInterval(this.timer);
      this.setData({ percent: 100 });
      setTimeout(()=> wx.redirectTo({ url:'/pages/recommend/index' }), 300);
    }catch(err){
      const fallback = localHeuristicPick(photos);
      getApp().globalData.aiResult = fallback;
      clearInterval(this.timer);
      wx.redirectTo({ url:'/pages/recommend/index' });
    }
  }
});


其余页面 Claude 按“交互流程”生成即可（ComparePane 做联动缩放，Album 做分享与回流）。

12. 开发顺序建议（一天内可跑通）

home → analyze（Mock）→ recommend → compare → album 主链路

上/下/左/右滑手势 & 撤回

分享页与回流（先用 /share/sync 轮询）

接入真实 /ai/pick（替换 Mock）

性能与体验打磨（压缩、首屏 FPS、动效）

13. Mock 服务（本地即可）

/ai/pick 返回固定 bestId = photos[0].id，reason="构图稳定，清晰度更好"，tags=["构图","画质"]

/share/* 全走内存对象；小程序端 setStorage 持久化

14. 实现要求

严格按上文页面与交互实现；

优先跑通端到端链路（包含 Mock）；

组件化实现 ComparePane 的联动缩放；

写好 utils/media.js（压缩与 base64）、utils/request.js（统一报错与重试）；

预留 CONFIG.API_BASE，只需切换为我的后端域名即可上线；

文案、描边、皇冠、粉色主色严格一致；

所有接口与数据结构按“数据与接口”章节；

提供一份 README：如何本地预览、如何切换真接口、需要在小程序后台配置的合法域名列表。