### 项目需求文档（PRD）

#### 项目概述

这是一个AI助理网站，通过麦克风输入语音并解答用户的一切问题。使用OpenAI的SDK实现语音输入输出能力，前端采用NextJS 14、Tailwind CSS和Lucid Icon，后端数据管理使用Supabase。

#### 核心功能

1. **注册登录授权**
   - 注册：用户通过邮箱进行注册，无需邮件激活，使用Supabase的注册功能。
   - 登录：用户通过邮箱和密码进行登录，使用Supabase的登录功能。
   - 权限控制：非登录用户只能访问首页，无法访问功能页。

2. **人机交互页面**
   - 麦克风授权：网页端授权用户使用麦克风。
   - 语音输入：用户通过麦克风进行语音输入，通过OpenAI的"Speech to text"功能转换成文字。
   - 内容交互：将转换后的文字与OpenAI进行交互，将回复内容通过“Text to speech”转换为语音返回给用户。

3. **Landing Page**
   - 网站首页：非登录用户可访问，内容引导用户注册账号并介绍网站核心功能。

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