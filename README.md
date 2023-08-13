# 路径别名替换

### 介绍

我们在开发中经常使用路径别名，但是每次修改路径别名都需要手动替换，非常麻烦，所以有了这个包，可以自动替换路径别名。

但这个包不止如此，它还可以给 `import` 导入的路径添加扩展名，就比如把 package.json 的 type 设置为 module 后，导入模块都需要添加 .js 后缀，还有 index.js 这种的也要手动补全，就无法和 require 导入一样丝滑了，但这个包就弥补这个缺点，可以给 `import` 导入语法可以自动添加 .js 后缀和 index.js，无需手动添加。

还有 watch 模式，可以监听文件变化，自动替换、自动添加扩展名。

> 要是各位有更好的建议，或发现 BUG，欢迎提 issue [gitee](https://gitee.com/laowans/path-alias-replace) [github](https://github.com/laowans/path-alias-replace)

### 特性

-   支持 watch 模式
-   支持 路径别名替换相对路径
-   支持 import 导入语法自动添加 .js 后缀/扩展名 和 index.js 文件路径自动补全

### 安装

```
npm i path-alias-replace -D
```

### 使用

#### express + ts 项目

首先新建一个 js 文件

script/dev.js

```js
const path = require('path');
// 注意哦，这个包是commonjs模块化，所以要使用require导入，暂时还不支持esm
const { pathAliasReplace } = require('path-alias-replace');

pathAliasReplace({
	// 扫描路径，这里必须要是绝对路径哦
	sweepPath: path.join(__dirname, '../dist'),
	// 路径别名
	alias: {
		// 这里注意哦！不要写tsconfig.json的路径别名，不然路径会错误的
		// 因为经过tsc编译后，文件就到dist目录下，所以这里要把src换成dist
		// 这里具体要根据项目来，你就想着要给dist目录下的文件设置路径别名
		// 这里也要要是绝对路径哦
		'@': path.join(__dirname, '../dist'),
	},
	// 开始监控，默认监控的目录就是 sweepPath 的路径
	watch: true,
	// 监控配置
	watchOpitons: {
		// 替换完别名后执行的命令
		rafter: 'node ./dist/app.js',
		// 上面命令的环境变量
		rafterEnv: {
			NODE_ENV: 'development',
		},
	},
});
```

这样一个简单的配置文件就写好了

然后在 package.json 添加两个脚本

```json
"scripts": {
    "tsc:w": "tsc --watch",
    "dev": "node ./script/dev.js",
}
```

接下来就是开两个终端，依次运行 `npm run tsc:w` 和 `npm run dev`

这样就实现代码自动编译、自动替换别名和自动重启了

> 至于使用 `tsc --watch` 就是因为实时编译基本上能做到和普通 express 项目加使用 nodemon 一样的速度。这边保存，那边就重启了，唉~主打就是一个丝滑。

然后就可以愉快的写代码啦！

#### electron + ts 项目

还是一样，先新建一个 js 文件

script/dev.js

```js
const path = require('path');
const { pathAliasReplace } = require('path-alias-replace');

pathAliasReplace({
	sweepPath: path.join(__dirname, '../dist/main'),
	alias: {
		'@e': path.join(__dirname, '../dist/main'),
	},
	watch: true,
	watchOpitons: {
		// 替换完启动 electron
		rafter: 'npx electron ./dist/main/main.js',
		rafterEnv: {
			NODE_ENV: 'development',
		},
	},
});
```

还是一样，在 package.json 添加两个脚本

```json
"scripts": {
    "tsc:w": "tsc --watch",
    "dev": "node ./script/dev.js",
}
```

然后在终端把那两个命令一敲，就 OK 啦！

#### 单纯的 ts 项目，只是想用路径别名和路径自动添加扩展名

还是先新建一个 js 文件

script/dev.js

```js
const path = require('path');
const { pathAliasReplace } = require('path-alias-replace');

pathAliasReplace({
	sweepPath: path.join(__dirname, '../dist/main'),
	alias: {
		'@': path.join(__dirname, '../dist/main'),
	},
	// 根据需要要不要开启监控
});
```

在 package.json 添加两个脚本

```json
"scripts": {
    "tsc:w": "tsc --watch",
    "dev": "node ./script/dev.js",
}
```

再在终端把那两个命令一敲，就好了！

#### 单纯的 esm 模块化 js 项目

这个上面那个差不多，只是没有编译的过程，直接替换别名了

> 如果你只想使用自动添加扩展名功能，那么可以将 alias 设置为空对象，但是不能不写 alias 啊！会报错的！

**这里注意哈，记得添加一个 outputPath 配置，不然就把你 src 下的文件别名替换了**

```js
pathAliasReplace({
	sweepPath: path.join(__dirname, '../src'),
	alias: {
		'@': path.join(__dirname, '../src'),
	},
	// 将处理好的文件输出到指定目录
	outputPath: path.join(__dirname, '../dist'),
});
```

其他的都一样，我就不写了哈，打字挺累的，比写代码累多了

#### 删除指定目录下多余的文件

在 1.0.1 版本中，新增了删除文件的方法，可用于删除指定目录下多余的文件

例如使用 tsc 编译，会在输出目录下生成 js 文件，若删除 src 下一个文件，再次使用 tsc 编译，并不会删除输出目录指定的文件，所以就可以在每次运行项目前，删除输出目录下所有的文件，这样就不会造成文件堆积

记得检查一下路径，不要删除错了！

```js
const path = require('path');
const { deleteFolderRecursive } = require('path-alias-replace');

deleteFolderRecursive(path.join(__dirname, '../dist'));
```

### 完整的配置项

```js
const options = {
	// 扫描路径，也就是要执行别名替换的目录
	sweepPath: path.join(__dirname, '../dist'),

	// 别名
	alias: {
		// 这里说下，这个别名结尾不用加 /，因为他会生成一个正则，比如 /^@\//，如果加了 / 结尾，那么这个正则就是 /^@\/\//，这样就匹配不到了
		// 然后就是必须绝对路径
		'@': path.join(__dirname, '../dist'),
	},

	// 以上的就是为数不多的两个必选参数，下面就是可选的了
	/* ------------------------------------------- */

	// 这个是用来设置那些文件，需要替换的，只有扩展名符合的才会替换别名、添加扩展名的操作
	// 下面的就是默认值
	ext: ['js'],

	// 输出路径，将处理好的文件输出到指定目录
	// 这个看需要，比如说 esm 的 js 项目，一定要写！它默认是修改"扫描路径"下的文件，不然就把你src下的文件给修改了
	outputPath: path.join(__dirname, '../dist'),

	// 输出路径不存在则创建
	// 跟上那个配套的，就比如，一般新项目，或还没建 dist 文件夹，他就给你创建一个
	// 默认值：true
	createOutputPath: true,

	// 是否匹配 require 导入
	// 默认值：true
	require: true,

	// 是否匹配 import 导入
	// 匹配有以下几种，要是不全，欢迎提 issue
	// 1. import { xxx } from 'xxx'
	// 2. import xxx from 'xxx'
	// 3. import 'xxx'
	// 4. import('xxx')
	// 5. export * from 'xxx'
	// 默认值：true
	import: true,

	// 这个需要自动添加那些扩展名，当值为 undefined 时就不会自动添加
	// 这个只会给 import 导入，自动添加那些扩展名，而 require 导入本就有这功能，所以无需自动添加
	// 注意自动添加那些扩展名，是通过判断文件是否存在，来添加的，若有多个同名文件则根据扩展名的前后顺序，添加第一个匹配成功的
	// 下面是默认值
	importAutoAddExtension: ['js', 'mjs', 'json', 'node'],

	// 是否输出替换信息，默认为：true，当开启 watch 时，默认为 false
	/* 就是下面这种
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
	*/
	outputReplacementInfo: true,

	// 是否开始监控
	// 默认值：false
	watch: false,

	// 监控配置项
	watchOpitons: {
		// 监控目录，这个默认就是"扫描路径"
		// 这个也可以写相对路径，但是相对于 cwd (即终端的路径)
		watchPath: '',

		// 忽略的，可以是 string / RegExp / function， 也可以是由它们组成的数组
		ignored: '',

		// 以上两个参数会传递给 chokidar，具体可以看 chokidar 的文档
		// https://github.com/paulmillr/chokidar

		// 是否输出文件变化信息，如下
		/* 这里的文件路径是相对于 watchPath
			change  a.js
			add     b.js
		*/
		// 默认值：true
		outputMsg: true,

		// 替换前执行的命令
		rbefore: 'node dev.js',

		// 替换后执行的命令
		rafter: 'node dev.js',

		// rbefore 的环境变量
		rbeforeEnv:{
			NODE_ENV: 'development'
		}

		// rafter 的环境变量
		rafterEnv:{
			NODE_ENV: 'development'
		}

		// 是否在初始化时执行 rbefore，也就是执行 pathAliasReplace 方法时
		// 默认值：true
		rbeforeImmediate: true,

		// 是否在初始化时执行 rafter
		// 默认值：true
		rafterImmediate: true,

		// rbefore 的 cwd
		rbeforeCwd: '',

		// rafter 的 cwd
		rafterCwd: '',
	},
};
```

### 没有注释的完整的配置项

```js
const options = {
	// 必选的
	sweepPath: path.join(__dirname, '../dist'),
	alias: {
		'@': path.join(__dirname, '../dist'),
	},

	// 可选的
	ext: ['js'],
	outputPath: path.join(__dirname, '../dist'),
	createOutputPath: true,
	require: true,
	import: true,
	importAutoAddExtension: ['js', 'mjs', 'json', 'node'],
	outputReplacementInfo: true,
	watch: false,
	watchOpitons: {
		watchPath: '',
		ignored: '',
		outputMsg: true,
		rbefore: 'node dev.js',
		rafter: 'node dev.js',
		rbeforeEnv:{
			NODE_ENV: 'development'
		}
		rafterEnv:{
			NODE_ENV: 'development'
		}
		rbeforeImmediate: true,
		rafterImmediate: true,
		rbeforeCwd: '',
		rafterCwd: '',
	},
};
```

### 后记

若是文档中有错误，欢迎提出！我会改正的

都看这里了，要是觉得这个包还不错，给个 star 呗~

\>\>\> [gitee](https://gitee.com/laowans/path-alias-replace) [github](https://github.com/laowans/path-alias-replace) <<<
