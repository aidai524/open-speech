### 项目需求文档（PRD）

#### 项目概述

这是一个AI助理网站，通过麦克风输入语音并解答用户的一切问题。使用OpenAI的SDK实现语音输入输出能力，前端采用NextJS 14、Tailwind CSS和Lucid Icon，后端数据管理使用Supabase。

#### 核心功能

1. **注册登录授权**
   - 注册：用户通过邮箱进行注册，无需邮件激活，使用Supabase的注册功能。
   - 登录：用户通过邮箱和密码进行登录，使用Supabase的登录功能。
   - 权限控制：非登录用户只能访问首页，无法访问功能页。
   - 在注册时：
     - 添加了 options.data.confirm = false 来禁用邮箱验证
     - 注册成功后自动执行登录
     - 登录成功后自动跳转到首页
   - 在登录时：
     - 登录成功后自动跳转到首页
     - 添加了错误处理和提示
   - 在首页：
     - 显示用户邮箱（如果已登录）
     - 添加退出登录按钮
     - 根据登录状态显示不同的内容

2. **人机交互页面**
   - 麦克风授权：网页端授权用户使用麦克风。
   - 语音输入：用户通过麦克风进行语音输入，通过OpenAI的"Speech to text"功能转换成文字。
   - 内容交互：将转换后的文字与OpenAI进行交互，将回复内容通过“Text to speech”转换为语音返回给用户。
   - 路由保护：
     - 未登录用户无法访问聊天页面
   - 麦克风权限管理：
     - 检查麦克风权限状态
     - 请求麦克风权限
     - 显示权限状态
     - 控制麦克风开启/关闭
   - 用户界面：
     - 清晰的权限状态提示
     - 直观的操作按钮
     - 友好的错误提示
   - 消息展示样式：
     - 用户消息和AI回复使用不同的样式和位置
     - 添加了消息时间戳
   - 鼠标悬停时显示删除按钮
   - 消息内容支持自动换行
   - 分页加载：
     - 每页加载20条消息
   - 添加"加载更多"按钮
   - 显示加载状态
     - 自动检测是否还有更多消息
   - 删除功能：
     - 支持删除单条消息
     - 添加清空所有记录的功能
     - 删除前有确认提示
     - 显示删除操作的加载状态
   - 其他改进：
     - 添加了滚动到底部的功能
     - 优化了加载状态的显示
     - 使用 Lucide 图标美化界面
     - 添加了粘性定位的输入组件

3. **Landing Page**
   - 网站首页：非登录用户可访问，内容引导用户注册账号并介绍网站核心功能。
   - Hero 区域：
     - 引人注目的标题
     - 简短的产品描述
     - 醒目的注册按钮
   - 特性介绍：
     - 实时语音识别
     - 智能对话系统
     - 语音合成
   - 使用流程：
     - 分步骤展示使用方法
     - 简单明了的说明
   - 行动召唤区域：
     - 再次展示注册按钮
     - 鼓励用户立即开始使用

#### 文件结构

```plaintext
open-speech
├── README.md
├── app
│   ├── favicon.ico
│   ├── fonts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── AuthForm.tsx
│   ├── MicrophoneInput.tsx
│   ├── SpeechOutput.tsx
│   └── LandingPage.tsx
├── lib
│   ├── supabaseClient.js
│   └── openaiClient.js
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

#### 文件详细说明

- **app/page.tsx**: 主页组件，显示首页内容和登录页面。
- **components/AuthForm.tsx**: 处理注册和登录的表单组件。
- **components/MicrophoneInput.tsx**: 负责麦克风输入和语音转文字。
- **components/SpeechOutput.tsx**: 负责文字转语音输出。
- **components/LandingPage.tsx**: 显示给非登录用户的引导页面。
- **lib/supabaseClient.js**: Supabase客户端配置和初始化。
- **lib/openaiClient.js**: OpenAI客户端配置和初始化。

#### 示例代码

1. **Speech to Text**

```javascript
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

async function main() {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream("/path/to/file/audio.mp3"),
    model: "whisper-1",
  });

  console.log(transcription.text);
}
main();
```

2. **Text to Speech**

```javascript
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI();

const speechFile = path.resolve("./speech.mp3");

async function main() {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: "Today is a wonderful day to build something people love!",
  });
  console.log(speechFile);
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}
main();
```

3. **Signing in with an Email and Password**

```javascript
async function signInWithEmail() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'example@email.com',
    password: 'example-password',
  });
}
```

#### 开发者指南

- **前端开发**: 使用NextJS和Tailwind CSS开发响应式用户界面，确保良好的用户体验。
- **后端配置**: 使用Supabase进行用户认证管理，确保数据安全和隐私。
- **OpenAI集成**