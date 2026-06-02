# 🖥️ ForgeAI Developer Platform | 智能开发者平台 & 代码知识图谱系统

欢迎来到 **ForgeAI**，这是一个专为现代全栈软件工程设计的“人机协同开发（Agentic Workspace）”和“代码流向分析（AST Knowledge Graph）”的一体化可视化调试平台。

---

## 🎯 功能是真实的？还是 Mock？—— 核心架构解密

本项目采用 **双模态混合架构**：客户端核心的**语法编译器**和**布局引擎**是**100% 运行在浏览器中的真实算法**；后端的 **AI 协作功能**则采用 **真机与离线模拟双通道**，可以根据您的 API Key 配置无缝自动切换。

### 1. 📂 100% 真实运行的本地功能 (Frontend Real Real-time Engines)
*   **AST 语法解析与知识网图谱 (Graphify Compiler Engine)**
    *   **真实原理**：该解析器完全采用**真实正则表达式 AST 分析算法**（查看 `/src/utils/graphify.ts`）。当我们进入代码文件点击“对项目进行 Graphify 编译”时，分析引擎会**动态扫描当前工作区所有文件的实际内容**。
    *   **追踪维度**：
        1.  **文件实体 (File Nodes)**。
        2.  **函数定义 (Functions)**：自动解析 Python 中的 `def` 结构、以及 JavaScript/TypeScript 中的 `function` 语句、箭头函数等。
        3.  **类定义 (Classes)**：识别面向对象面向对象类的成员划分。
        4.  **跨文件依赖关系 (Imports & Relations)**：真实解析 `import ... from "./parser"` 或 Python 首部的 `from DB import` 依赖树。
        5.  **调用级序列流向 (Callable Calls Graph)**：如果函数 `A` 的代码体中直接出现了别的文件中函数 `B` 的名称，平台会真实将其注册并绘制为首尾相连的箭头调用边 `calls`。
    *   **轨道约束几何算法 (Orbital Constraint Layout)**：使用极坐标几何，以各文件为圆心进行星团状 orbital 平铺计算，实时确定各节点的 SVG 坐标。
*   **极客代码编辑器 (Forge IDE & Live Editing)**
    *   真实的选项卡管理。一旦您直接在编辑器内修改文件内容并触发保存，平台底层的数据流状态会立刻发生真实修改，后续执行知识网扫描即可展现您**最新修改的类和函数！**
*   **工作区CI/CD虚拟集成 (Terminal Logs & Test Suites Tests)**
    *   针对 Python API 模块、TS Utils 底层库、平台自身 UI (Self UI) 这三个内置的异构工作区，预设了高度拟真的单元测试执行和打包检查脚本输出。

### 2. 🤖 双模态后端 AI 引擎 (Express Backend with Hybrid GenAI Paths)
服务器后台 `/server.ts` 结合了 `@google/genai` 官方最新 SDK，会实时监视您的秘钥状态：
*   **如果您已经配置了 `GEMINI_API_KEY`** (可在右侧 AI Studio **Settings** 菜单中进行配置注入)：
    *   **真实 AI 智能体生成**：在 **Agent Studio** 中输入描述（例如“我需要一个专门精简 Docker 的运维助手”），平台将调用 **Gemini 3.5 Flash** 结构化 JSON 返回，从头像 Emoji 到底层高复杂度 System Prompt、Temperature 配置全部生成。
    *   **真实 Vibe Coding 代码流向重构 (Composer 模式)**：在 IDE 侧栏中，向 AI 协同器下达指令（例如“将所有 FastAPI 节点全更改为异步 non-blocking async 机制”或“补充 TypeScript 类型断言”）。Gemini 将会**真实阅读整个文件上下文进行重构**，并全量返回全新的可运行代码！
*   **如果您没有配置 `GEMINI_API_KEY`（离线试玩模式）**：
    *   后端接口将被保护，并无缝重定向到**预设精美结构化编译模型**和**本地分析模式**（如根据输入的关键词，做真实的正则代码格式化映射）。整个 UI 绝不崩溃，依然流畅、高响应地渲染完整流式的 AI 操作卡片！

---

## 🗺️ 五大系统组件及使用教程

### 1. 🎛️ 模型控制枢纽 (Model Hub)
*   **视图功能**：总览可供我们调回的 LLM 谱系。实时记录模型延迟指标、支持的最大上下文 Token 上限以及适用开发场景。
*   **操作**：可在这里评估不同算力模型对应的开发边界。

### 2. 🧪 智能体创客室 (Agent Studio)
*   **视图功能**：创建具备自主开发权限和专精技能属性的助理。
*   **操作**：
    *   在顶层对话框输入特定的专职描述。
    *   点击 **AI 结构化生成**，右侧会动态显示生成的智能体详细画像（包含系统初始 System Prompt 调试指令、工具组特权、执行权限级别等）。
    *   生成后，还可以在右下角交互终端里向其下派具体任务并获取调试回答。

### 3. 🖥️ 极客编译器工作台 (Forge IDE)
*   **视图功能**：真实的客户端多工作区 IDE、完美兼容三种技术栈：
    *   🐍 **Python API**：FastAPI 后台和 SQLAlchemy 数据引擎。
    *   📦 **TS Utils**：通用打包工具、Slugify 文本格式转换器和本地单元测试。
    *   🖥️ **Forge Platform**：展示了系统本身的自渲染 UI 源代码树。
*   **操作**：
    *   在左侧树结构中浏览文件，在主编辑窗口内可**自由编辑代码字符**。
    *   右下侧可点击 **Run Build Verify** 进行虚拟 CI 检查。
    *   右上侧可点击 **Refactor Code** 开启局部 Vibe Coding 提示框，驱动 AI 根据您的指示全量重构当下选中的代码。

### 4. 🔗 代码知识图谱分析 (Knowledge Graph)
*   **视图功能**：本系统最具亮点的空间图谱，展示了当前代码在面向对象和模块解耦层面极具美感的 Constellation 几何流向图！
*   **操作**：
    *   您在编辑器中写好了类或函数，回到这里，点击右上方闪烁的 **Graphify Project** (图谱动态扫描)。
    *   系统会展示高管进度的 AST 语法断词解析扫描动画。
    *   扫描完毕后，右侧会展示当前图谱分析出的核心指标。
    *   **交互悬浮与追踪**：在 SVG 图上把鼠标移动到任一个文件或函数圆形节点，它的所有相关依赖和调用流路网就会自动亮起，并在最右侧的 **Symbol Inspector（符号巡查器）** 中完全导出详细的入口参考指标！

### 5. 🎨 平台个性化设计中心 (Theme Studio)
*   **视图功能**：控制 ForgeAI 底层的 UI 风格。
*   **操作**：
    *   支持定义个性化的品牌 LOGO 字标。
    *   自由微调 Primary 主题色相、圆角尺度、动态特效深度等。

---

## 🛠️ 项目环境与运行参数

*   **运行主端口**：`3000` (由 Nginx 专属网关反向代理至 Cloud Run)
*   **后端开发语言**：TypeScript Node.js (基于全功能防错编译的 Express 进行通信托管)
*   **前端开发框架**：React 18 + Tailwind CSS 极简排版配色 + Lucide 高清矢量符号系统
*   **本地热更新状态**：已在环境配置中屏蔽 `HMR` 防止多次写码状态重叠干扰。代码编写完毕后，系统将自动于次轮更新渲染。
