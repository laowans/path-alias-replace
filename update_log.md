## 1.0.7 (2023-8-14)

### 改变

-   优化添加扩展名的逻辑，修复添加扩展名可能出现的 bug
-   修改类型声明文件采用 jsDoc 语法书写默认值
-   修改 readme 的一些细节，增加没有注释的完整的配置项，方便复制
-   给测试文件添加注释

## 1.0.6 (2023-8-7)

### 改变

-   重写 watch 类，修改 rbefore、rafter 的创建方式
-   开启监控后，会有提示信息，示例如下
    ```
    start watch "C:\Users\xxx\test"
    ```
-   修复 rbefore、rafter 和替换执行期间，不会对文件变化做出反应，而 tsc --watch 命令在最初时会多次修改文件，导致频繁触发文件修改事件，可能导致替换完成，马上就被修改，但此时已经执行 rbefore 或 rafter 命令，若有文件未替换别名，就会导致运行错误，且在文件再次变化之前，不会重新执行 rbefore、rafter 和替换
-   修改输出信息样式，替换信息会展示全部完整的导入语句，示例如下
    ```
    path alias replace info
      a.js
      ├── import sa from '@/b' -> import sa from './b.js'
      ├── import { aa } from '@/b' -> import { aa } from './b.js'
      ├── import '@/b' -> import './b.js'
      ├── import '@/dir' -> import './dir/index.js'
      ├── import './dir' -> import './dir/index.js'
      ├── import('@/b') -> import('./b.js')
      └── export * from '@/b' -> export * from './b.js'
      b.js
      └── require('@/a') -> require('./a')
      dir/c.js
      └── import '@/a' -> import '../a.js'
    ```

## 1.0.5 (2023-8-5)

### 改变

-   修复 1.0.4 版本的路径错误的问题

## 1.0.3 (2023-8-5)

### 增加

-   增加以下配置项
    -   watchOpitons.rbeforeImmediate
    -   watchOpitons.rafterImmediate
    -   watchOpitons.rbeforeCwd
    -   watchOpitons.rafterCwd

### 改变

-   改用 [tree-kill](https://github.com/pkrumins/node-tree-kill) 来结束进程，增加了兼容性
